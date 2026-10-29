import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Play,
  Pause,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Youtube,
  AlertTriangle,
  WifiOff,
  Loader2,
} from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export const extractYouTubeId = (urlOrId: string) => {
  if (!urlOrId) return 'dQw4w9WgXcQ';
  const clean = urlOrId.trim();
  if (clean.length === 11 && !clean.includes('/') && !clean.includes('?') && !clean.includes('.')) {
    return clean;
  }
  // Matches youtu.be/ID, youtube.com/watch?v=ID, youtube.com/shorts/ID, embed/ID, etc.
  const match = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : (clean.length === 11 ? clean : 'dQw4w9WgXcQ');
};

export const VideoTaskModal: React.FC = () => {
  const {
    isWatchingVideo,
    setIsWatchingVideo,
    submitYouTubeVideoTask,
    adminSettings,
    user,
    maxDailyVideos,
    todayVideosWatched,
    perVideoReward,
    activeUserPlan,
    userDailyVideoMissions,
    currentPlayingTaskNum,
    navigate,
    showToast,
  } = useApp();

  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const duration = Math.max(30, adminSettings.youtubeVideoDurationSec || 30);
  const [countdown, setCountdown] = useState<number>(duration);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [playerStateDesc, setPlayerStateDesc] = useState<'idle' | 'buffering' | 'playing' | 'paused' | 'ended' | 'error'>('idle');

  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Extract all available YouTube video URLs from Admin Settings
  const videoList = React.useMemo(() => {
    const list: string[] = [];
    if (adminSettings.youtubeVideoUrls && Array.isArray(adminSettings.youtubeVideoUrls)) {
      adminSettings.youtubeVideoUrls.forEach((u) => {
        if (u && typeof u === 'string' && u.trim().length > 0) {
          list.push(u.trim());
        }
      });
    }
    if (list.length === 0 && adminSettings.youtubeVideoId) {
      list.push(adminSettings.youtubeVideoId);
    }
    if (list.length === 0) {
      list.push('dQw4w9WgXcQ');
    }
    return list;
  }, [adminSettings.youtubeVideoUrls, adminSettings.youtubeVideoId]);

  // Specific mission chosen from composite multi-plan mission list
  const taskOrder = currentPlayingTaskNum || Math.min(maxDailyVideos, todayVideosWatched + 1);
  const activeMissionDef =
    (userDailyVideoMissions && userDailyVideoMissions.find((m) => m.index === taskOrder)) ||
    (userDailyVideoMissions && userDailyVideoMissions[taskOrder - 1]) ||
    userDailyVideoMissions?.[0];

  const currentTaskIndex = Math.max(0, taskOrder - 1) % videoList.length;
  const rawVideoLink = user.assignedVideoUrl || videoList[currentTaskIndex];
  const videoId = extractYouTubeId(rawVideoLink);
  const videoTitle =
    user.assignedVideoTitle ||
    activeMissionDef?.title ||
    `Level ${activeUserPlan.level} Official Sponsor Video #${taskOrder}`;
  const rewardAmount =
    user.assignedReward ||
    activeMissionDef?.reward ||
    perVideoReward ||
    adminSettings.youtubeVideoReward ||
    50;

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setIsVideoPlaying(false);
      setPlayerStateDesc('paused');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Reset all playback states when modal is opened or closed
  useEffect(() => {
    if (!isWatchingVideo) {
      setIsVideoPlaying(false);
      setHasStarted(false);
      setPlayerStateDesc('idle');
      return;
    }
    setCountdown(duration);
    setIsFinished(false);
    setIsVideoPlaying(false);
    setHasStarted(false);
    setPlayerStateDesc('idle');
  }, [isWatchingVideo, duration]);

  // Initialize YouTube Iframe Player with Google's official API
  useEffect(() => {
    if (!isWatchingVideo) return;

    let player: any = null;
    let isCancelled = false;

    const setupPlayerInstance = () => {
      if (isCancelled || !window.YT || !window.YT.Player) return;
      const targetElem = document.getElementById('zorotask-yt-player-target');
      if (!targetElem) return;

      try {
        // Destroy any prior instance
        if (playerRef.current?.destroy) {
          try {
            playerRef.current.destroy();
          } catch {}
        }

        player = new window.YT.Player('zorotask-yt-player-target', {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 0,
            controls: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            enablejsapi: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
          events: {
            onStateChange: (event: any) => {
              if (isCancelled) return;
              const s = event.data;
              // 1 = PLAYING, 2 = PAUSED, 3 = BUFFERING, 0 = ENDED, -1 = UNSTARTED
              if (s === 1) {
                setIsVideoPlaying(true);
                setHasStarted(true);
                setPlayerStateDesc('playing');
              } else if (s === 3) {
                // BUFFERING -> Timer MUST freeze
                setIsVideoPlaying(false);
                setPlayerStateDesc('buffering');
              } else if (s === 2) {
                // PAUSED -> Timer MUST freeze
                setIsVideoPlaying(false);
                setPlayerStateDesc('paused');
              } else if (s === 0) {
                // ENDED -> Timer stops
                setIsVideoPlaying(false);
                setPlayerStateDesc('ended');
              } else {
                setIsVideoPlaying(false);
                setPlayerStateDesc('idle');
              }
            },
            onError: () => {
              if (isCancelled) return;
              setIsVideoPlaying(false);
              setPlayerStateDesc('error');
            },
          },
        });

        playerRef.current = player;
      } catch (err) {
        console.warn('YT Player init failed:', err);
      }
    };

    if (window.YT && window.YT.Player) {
      setupPlayerInstance();
    } else {
      // Load YouTube Iframe API script dynamically
      if (!document.getElementById('yt-iframe-api-tag')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api-tag';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
      const existingCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (existingCallback) existingCallback();
        setupPlayerInstance();
      };
    }

    return () => {
      isCancelled = true;
      try {
        if (playerRef.current?.destroy) {
          playerRef.current.destroy();
        }
      } catch {}
      playerRef.current = null;
    };
  }, [isWatchingVideo, videoId]);

  // Fallback postMessage listener for YouTube iframe messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        let data: any = event.data;
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch {
            return;
          }
        }
        if (!data) return;

        // Format 1: infoDelivery
        if (data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.playerState !== 'undefined') {
            const ps = data.info.playerState;
            if (ps === 1) {
              setIsVideoPlaying(true);
              setHasStarted(true);
              setPlayerStateDesc('playing');
            } else if (ps === 3) {
              setIsVideoPlaying(false);
              setPlayerStateDesc('buffering');
            } else if (ps === 2) {
              setIsVideoPlaying(false);
              setPlayerStateDesc('paused');
            } else if (ps === 0) {
              setIsVideoPlaying(false);
              setPlayerStateDesc('ended');
            }
          }
        }

        // Format 2: onStateChange
        if (data.event === 'onStateChange') {
          const ps = data.info;
          if (ps === 1) {
            setIsVideoPlaying(true);
            setHasStarted(true);
            setPlayerStateDesc('playing');
          } else if (ps === 3) {
            setIsVideoPlaying(false);
            setPlayerStateDesc('buffering');
          } else if (ps === 2) {
            setIsVideoPlaying(false);
            setPlayerStateDesc('paused');
          } else if (ps === 0) {
            setIsVideoPlaying(false);
            setPlayerStateDesc('ended');
          }
        }
      } catch {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Direct 400ms state polling: Queries player.getPlayerState() to ensure 100% sync
  useEffect(() => {
    if (!isWatchingVideo || isFinished) return;

    const poller = setInterval(() => {
      try {
        if (playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
          const state = playerRef.current.getPlayerState();
          if (state === 1) {
            // PLAYING
            setIsVideoPlaying(true);
            setHasStarted(true);
            setPlayerStateDesc('playing');
          } else if (state === 3) {
            // BUFFERING
            setIsVideoPlaying(false);
            setPlayerStateDesc('buffering');
          } else if (state === 2) {
            // PAUSED
            setIsVideoPlaying(false);
            setPlayerStateDesc('paused');
          } else if (state === 0) {
            // ENDED
            setIsVideoPlaying(false);
            setPlayerStateDesc('ended');
          } else if (state === -1 || state === 5) {
            setIsVideoPlaying(false);
          }
        }
      } catch {}
    }, 400);

    return () => clearInterval(poller);
  }, [isWatchingVideo, isFinished]);

  // Tab switch / background freeze: When user switches tabs, freeze timer immediately
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setIsVideoPlaying(false);
        setPlayerStateDesc('paused');
        try {
          playerRef.current?.pauseVideo?.();
        } catch {}
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // STRICT COUNTDOWN TIMER:
  // Timer runs ONLY AND STRICTLY when isVideoPlaying is TRUE and device is ONLINE!
  // When video pauses, buffers, or stops, the timer IMMEDIATELY FROZEN!
  useEffect(() => {
    if (!isWatchingVideo || isFinished) return;
    if (!isVideoPlaying || !isOnline) return; // Strictly frozen when video not streaming or offline!

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isWatchingVideo, isVideoPlaying, isFinished, isOnline]);

  if (!isWatchingVideo) return null;

  // Strict enforcement: Daily quota check
  if (todayVideosWatched >= maxDailyVideos) {
    return (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-slate-900 text-white rounded-3xl w-full max-w-sm p-6 text-center space-y-4 shadow-2xl border border-white/10 animate-scaleUp">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center text-3xl">
            🎬
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Daily Task Limit Reached!</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              You have completed all <b className="text-amber-400">{maxDailyVideos}/{maxDailyVideos}</b> video tasks for today.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              New tasks unlock tomorrow, or upgrade your VIP plan to unlock more daily tasks!
            </p>
          </div>
          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                setIsWatchingVideo(false);
                navigate('member_plans');
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-lg shadow-orange-500/20 hover:brightness-110 active:scale-95 transition"
            >
              Upgrade VIP Plan for More Tasks ⭐
            </button>
            <button
              onClick={() => setIsWatchingVideo(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Play command sends command to YouTube player.
  // CRITICAL: We do NOT set isVideoPlaying(true) here!
  // We wait for YouTube's onStateChange event (state === 1) so the timer only starts when the video actually plays!
  const handlePlayCommand = () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      showToast('❌ No Internet Connection! Video cannot stream without Mobile Data or Wi-Fi.');
      return;
    }
    try {
      if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
        playerRef.current.playVideo();
      } else {
        const iframe = containerRef.current?.querySelector('iframe') as HTMLIFrameElement;
        iframe?.contentWindow?.postMessage(
          JSON.stringify({ event: 'command', func: 'playVideo', args: '' }),
          '*'
        );
      }
    } catch (err) {
      console.warn(err);
    }
    setHasStarted(true);
    setPlayerStateDesc('buffering');
  };

  const handlePauseCommand = () => {
    try {
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
      } else {
        const iframe = containerRef.current?.querySelector('iframe') as HTMLIFrameElement;
        iframe?.contentWindow?.postMessage(
          JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }),
          '*'
        );
      }
    } catch (err) {
      console.warn(err);
    }
    setIsVideoPlaying(false);
    setPlayerStateDesc('paused');
  };

  const handleSubmit = () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      showToast('❌ No Internet Connection! Turn on Mobile Data to claim rewards.');
      return;
    }
    submitYouTubeVideoTask(videoTitle, `https://www.youtube.com/watch?v=${videoId}`);
  };

  const progressPercent = Math.round(((duration - countdown) / duration) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900 text-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-white/10 animate-scaleUp">
        {/* Header */}
        <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-white/10 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-red-600 rounded-xl text-white shadow-xs">
              <Youtube className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black leading-none block">
                  Level {activeMissionDef?.planLevel ?? activeUserPlan.level} Video #{activeMissionDef?.levelIndex ?? taskOrder} (Overall {taskOrder}/{maxDailyVideos})
                </span>
                <span className="text-[9px] font-bold bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full">
                  {activeMissionDef?.planTag || activeUserPlan.badge}
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-medium">
                Watch 30s &amp; Earn ₹{rewardAmount}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsWatchingVideo(false)}
            className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real YouTube Video Player Container with YouTube Iframe API */}
        <div
          ref={containerRef}
          className="relative aspect-video bg-black overflow-hidden flex items-center justify-center"
        >
          {/* Target div for YouTube Iframe API */}
          <div id="zorotask-yt-player-target" className="w-full h-full" />

          {/* Interactive Play Overlay if video has not yet started */}
          {!hasStarted && !isFinished && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-2xs flex flex-col items-center justify-center p-4 text-center z-10 space-y-2.5">
              <button
                onClick={handlePlayCommand}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xl shadow-red-600/50 active:scale-95 transition-all cursor-pointer group animate-pulse"
              >
                <Play className="w-7 h-7 fill-white translate-x-0.5 group-hover:scale-110 transition-transform" />
              </button>
              <div>
                <p className="text-xs font-black text-white">Click to Start YouTube Video</p>
                <p className="text-[10px] text-amber-300 font-medium mt-0.5">
                  Watch timer will only run while the video is actively playing
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Video Info & Watch Timer */}
        <div className="p-4 space-y-3 bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-2">
              <h4 className="text-xs font-bold text-white truncate">{videoTitle}</h4>
              <p className="text-[10px] text-slate-400">
                Reward: <span className="text-emerald-400 font-bold">+₹{rewardAmount}</span> (Added directly to wallet)
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {hasStarted && !isFinished && (
                <button
                  type="button"
                  onClick={isVideoPlaying ? handlePauseCommand : handlePlayCommand}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-300 hover:text-white bg-slate-800 border border-slate-700 px-2 py-1 rounded-lg transition active:scale-95 cursor-pointer"
                >
                  {isVideoPlaying ? (
                    <>
                      <Pause className="w-3 h-3 text-amber-400" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                      <span>Play</span>
                    </>
                  )}
                </button>
              )}
              <a
                href={`https://www.youtube.com/watch?v=${videoId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 hover:text-red-300 bg-red-950/60 border border-red-800/60 px-2 py-1 rounded-lg shrink-0"
              >
                <span>YouTube</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Real-time Video Playing Status Banner */}
          {!isOnline ? (
            <div className="p-2.5 rounded-xl border border-rose-500/70 bg-rose-950/70 text-rose-300 flex items-center justify-between text-[11px] animate-pulse">
              <div className="flex items-center gap-1.5">
                <WifiOff className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-bold">⚠️ No Internet • Timer Paused (Turn ON Mobile Data)</span>
              </div>
              <span className="text-[10px] font-mono text-rose-400 font-bold">Offline</span>
            </div>
          ) : isFinished ? (
            <div className="p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold">✓ 30s Watch Time Completed! Claim your reward now.</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">Ready</span>
            </div>
          ) : isVideoPlaying ? (
            <div className="p-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="font-bold">▶ Video Playing (Timer Running)</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400">
                {countdown}s left
              </span>
            </div>
          ) : playerStateDesc === 'buffering' ? (
            <div className="p-2 rounded-xl border border-amber-500/40 bg-amber-950/40 text-amber-300 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                <span className="font-bold">⏳ Video Loading / Buffering... (Timer Paused)</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-300">
                {countdown}s left
              </span>
            </div>
          ) : (
            <div className="p-2 rounded-xl border border-amber-500/40 bg-amber-950/40 text-amber-300 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <Pause className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-bold">
                  {hasStarted
                    ? '⏸ Video Paused (Timer Stopped) • Press Play on video to continue'
                    : '⏸ Video Not Started • Press Play above to begin 30s timer'}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-300">
                {countdown}s left
              </span>
            </div>
          )}

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Required watch time: {duration}s</span>
              <span
                className={
                  !isOnline
                    ? 'text-rose-400 font-bold'
                    : isFinished
                    ? 'text-emerald-400 font-bold'
                    : isVideoPlaying
                    ? 'text-emerald-400 font-bold'
                    : 'text-amber-400 font-bold'
                }
              >
                {!isOnline
                  ? 'Paused (Offline)'
                  : isFinished
                  ? '✓ 30s Completed!'
                  : isVideoPlaying
                  ? `${countdown}s remaining (Running)`
                  : `${countdown}s remaining (Paused)`}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  !isOnline
                    ? 'bg-rose-500'
                    : isFinished
                    ? 'bg-emerald-500'
                    : isVideoPlaying
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Claim / Submit Action */}
          <div className="pt-1">
            <button
              onClick={handleSubmit}
              disabled={!isFinished || !isOnline}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                !isOnline
                  ? 'bg-rose-950/60 border border-rose-800/80 text-rose-300 cursor-not-allowed'
                  : isFinished
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:opacity-95 text-white shadow-lg shadow-emerald-900/40 active:scale-95 animate-pulse cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {!isOnline ? (
                <>
                  <WifiOff className="w-4 h-4 text-rose-400" />
                  <span>Internet Required to Claim (Turn on Mobile Data)</span>
                </>
              ) : isFinished ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Claim ₹{rewardAmount} &amp; Add to Wallet! 💰</span>
                </>
              ) : isVideoPlaying ? (
                <>
                  <Play className="w-3.5 h-3.5 animate-pulse" />
                  <span>Watching video: {countdown}s left to add ₹{rewardAmount}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Play YouTube video above to start 30s timer</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[10px] text-emerald-400 text-center flex items-center justify-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Reward can only be claimed once the video plays for full 30 seconds!</span>
          </p>
        </div>
      </div>
    </div>
  );
};
