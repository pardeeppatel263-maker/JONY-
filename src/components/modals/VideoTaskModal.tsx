import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Play, Pause, CheckCircle2, ExternalLink, ShieldCheck, Youtube, AlertTriangle } from 'lucide-react';

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
  } = useApp();

  const duration = Math.max(30, adminSettings.youtubeVideoDurationSec || 30);
  const [countdown, setCountdown] = useState(duration);
  const [isFinished, setIsFinished] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

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

  // Reset states when modal opens
  useEffect(() => {
    if (!isWatchingVideo) {
      setIsVideoPlaying(false);
      setHasStarted(false);
      return;
    }
    setCountdown(duration);
    setIsFinished(false);
    setIsVideoPlaying(false);
    setHasStarted(false);
  }, [isWatchingVideo, duration]);

  // Listen to postMessage from YouTube iframe with enablejsapi=1
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && data.event === 'onStateChange') {
          // YouTube Player States:
          // 1: PLAYING
          // 2: PAUSED
          // 0: ENDED
          // 3: BUFFERING
          if (data.info === 1) {
            setIsVideoPlaying(true);
            setHasStarted(true);
          } else if (data.info === 2 || data.info === 0) {
            setIsVideoPlaying(false);
          }
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Countdown timer ONLY runs when YouTube video is ACTUALLY PLAYING!
  // "JAB TAK YT VD START N HO TAB TAK 30SEC WATCH TIME SURU N HO"
  useEffect(() => {
    if (!isWatchingVideo || isFinished) return;
    if (!isVideoPlaying) return; // Strictly frozen when not playing!

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
  }, [isWatchingVideo, isVideoPlaying, isFinished]);

  if (!isWatchingVideo) return null;

  // Strict enforcement: If daily quota is reached, do NOT allow video watch!
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
              Aapne aaj ke saare <b className="text-amber-400">{maxDailyVideos}/{maxDailyVideos}</b> video tasks complete kar liye hain. Isse jyada video aaj nahi dekh sakte.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Naye tasks kal unlock honge, ya aur daily tasks pane ke liye VIP Plan upgrade karein!
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

  const handlePlayCommand = () => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'playVideo', args: '' }),
        '*'
      );
    } catch (err) {
      console.warn(err);
    }
    setIsVideoPlaying(true);
    setHasStarted(true);
  };

  const handlePauseCommand = () => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }),
        '*'
      );
    } catch (err) {
      console.warn(err);
    }
    setIsVideoPlaying(false);
  };

  const handleSubmit = () => {
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

        {/* Real YouTube Video Player Embed with API control */}
        <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
          <iframe
            ref={iframeRef}
            id="taskvibe-yt-player"
            className="w-full h-full border-0"
            src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&mute=0&rel=0&modestbranding=1&playsinline=1`}
            title={videoTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />

          {/* Interactive Play Overlay if video has not yet started or was paused */}
          {!hasStarted && !isFinished && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex flex-col items-center justify-center p-4 text-center z-10 space-y-2.5">
              <button
                onClick={handlePlayCommand}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xl shadow-red-600/40 active:scale-95 transition-all cursor-pointer group"
              >
                <Play className="w-7 h-7 fill-white translate-x-0.5 group-hover:scale-110 transition-transform" />
              </button>
              <div>
                <p className="text-xs font-black text-white">Click to Start YouTube Video</p>
                <p className="text-[10px] text-amber-300 font-medium mt-0.5">
                  The 30-second timer will start once the video begins playing
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
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-300 hover:text-white bg-slate-800 border border-slate-700 px-2 py-1 rounded-lg"
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

          {/* Video Playing Status Banner */}
          {!isFinished && (
            <div
              className={`p-2 rounded-xl border flex items-center justify-between text-[11px] ${
                isVideoPlaying
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isVideoPlaying ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                  }`}
                />
                <span className="font-bold">
                  {isVideoPlaying
                    ? '▶ Video Playing (Timer Running)'
                    : '⏸ Video Not Playing (Timer Paused)'}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold">
                {isVideoPlaying ? `${countdown}s left` : 'Waiting for video'}
              </span>
            </div>
          )}

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Required watch time: {duration}s</span>
              <span className={isFinished ? 'text-emerald-400 font-bold' : isVideoPlaying ? 'text-emerald-400' : 'text-amber-400'}>
                {isFinished ? '✓ 30s Completed!' : `${countdown}s remaining`}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  isFinished ? 'bg-emerald-500' : isVideoPlaying ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Claim / Submit Action */}
          <div className="pt-1">
            <button
              onClick={handleSubmit}
              disabled={!isFinished}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                isFinished
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:opacity-95 text-white shadow-lg shadow-emerald-900/40 active:scale-95 animate-pulse cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isFinished ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Claim ₹{rewardAmount} &amp; Add to Wallet! 💰</span>
                </>
              ) : isVideoPlaying ? (
                <>
                  <Play className="w-3.5 h-3.5 animate-pulse" />
                  <span>Watch video: {countdown}s left to add ₹{rewardAmount}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Start video to begin 30s countdown</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[10px] text-emerald-400 text-center flex items-center justify-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Reward will be claimed once the video plays for 30 seconds!</span>
          </p>
        </div>
      </div>
    </div>
  );
};
