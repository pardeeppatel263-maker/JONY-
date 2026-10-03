import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AppHeader } from '../components/AppHeader';
import { BottomNav } from '../components/BottomNav';
import {
  FileCheck,
  PlayCircle,
  Users,
  CheckCircle2,
  Clock,
  Youtube,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Crown,
  Sparkles,
  Lock,
  Layers,
  ChevronRight,
  Award
} from 'lucide-react';

export const MissionTasksScreen: React.FC = () => {
  const {
    taskSubmissions,
    adminSettings,
    navigate,
    openVideoTask,
    maxDailyVideos,
    todayVideosWatched,
    perVideoReward,
    activeUserPlan,
    activeUserPlans,
    userDailyVideoMissions,
    totalDailyIncome,
    plans,
    user,
  } = useApp();
  const [activeFilter, setActiveFilter] = useState<'all' | 'in_progress' | 'completed'>('all');

  const pendingSubmissions = taskSubmissions.filter(
    (s) => s.status === 'pending' && s.taskType === 'youtube_video'
  );
  const approvedSubmissions = taskSubmissions.filter(
    (s) => s.status === 'approved' && s.taskType === 'youtube_video'
  );

  // Multi-Plan Video Missions:
  // Each task has its own level, reward, and tag according to user's purchased plans!
  const videoMissions = userDailyVideoMissions.map((mission, idx) => {
    const taskNum = mission.index;
    const isDone = idx < todayVideosWatched;
    const isReady = idx === todayVideosWatched;
    const isLocked = idx > todayVideosWatched;

    return {
      id: `task_yt_video_lv${mission.planLevel}_${taskNum}`,
      title: mission.title,
      subtitle: isDone
        ? `Task completed! ₹${mission.reward} credited to wallet.`
        : `Watch 30s & earn ₹${mission.reward} (Level ${mission.planLevel} Plan)`,
      reward: mission.reward,
      planLevel: mission.planLevel,
      planTag: mission.planTag,
      levelIndex: mission.levelIndex,
      category: 'video' as const,
      taskNum,
      isDone,
      isReady,
      isLocked,
    };
  });

  const referralTask = {
    id: 'task_invite_friends',
    title: 'Invite Friends & Earn',
    subtitle: 'Share your referral link with friends (+₹100 bonus)',
    reward: adminSettings.referralBonus || 100,
    category: 'referral' as const,
    taskNum: 0,
    isDone: false,
    isReady: true,
    isLocked: false,
  };

  const allTasks = [...videoMissions, referralTask];

  const handleStartTask = (category: string, taskNum?: number) => {
    if (category === 'video') {
      openVideoTask(taskNum);
    } else if (category === 'referral') {
      navigate('referral_earn');
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'survey':
      case 'daily_survey':
        return <FileCheck className="w-5 h-5 text-emerald-600" />;
      case 'video':
      case 'youtube_video':
        return <Youtube className="w-5 h-5 text-red-600" />;
      case 'referral':
        return <Users className="w-5 h-5 text-blue-600" />;
      default:
        return <PlayCircle className="w-5 h-5 text-purple-600" />;
    }
  };

  const isAllVideosDone = todayVideosWatched >= maxDailyVideos;
  const remainingVideos = Math.max(0, maxDailyVideos - todayVideosWatched);

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden bg-slate-50">
      {/* FIXED TOP HEADER */}
      <div className="shrink-0 z-30">
        <AppHeader title="Mission Tasks" showBack={true} />
      </div>

      {/* SCROLLABLE MIDDLE CONTENT */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <main className="p-4 space-y-4 max-w-md mx-auto pb-6">
          {/* Header Banner with Level Info */}
          <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {activeUserPlans.map((p) => (
                    <span
                      key={p.id}
                      className="text-[10px] uppercase font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shadow-2xs"
                    >
                      LV {p.level} • {p.levelTag}
                    </span>
                  ))}
                  {activeUserPlans.length > 1 && (
                    <span className="text-[10px] font-bold bg-emerald-400/30 text-emerald-200 border border-emerald-400/40 px-2 py-0.5 rounded-full">
                      Combined Missions
                    </span>
                  )}
                </div>
                <h2 className="text-base font-black leading-tight text-white">
                  {activeUserPlans.length > 1
                    ? `${activeUserPlans.map((p) => `Level ${p.level}`).join(' + ')} Daily Missions`
                    : `Level ${activeUserPlan.level} Daily Missions`} <br />
                  <span className="text-amber-300">Total {maxDailyVideos} Videos Available</span>
                </h2>
                <p className="text-[11px] text-blue-100 flex items-center gap-1">
                  <span>Total Daily Income: ₹{totalDailyIncome}</span>
                </p>
              </div>
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex flex-col items-center justify-center text-center shadow-inner border border-white/10 shrink-0">
                <span className="text-xl leading-none">🎬</span>
                <span className="text-[9px] font-black text-amber-300 uppercase tracking-tighter mt-1">
                  {maxDailyVideos} VD
                </span>
              </div>
            </div>
          </div>

          {/* Level 0 Free Trial Alert if User has not bought VIP plan yet */}
          {activeUserPlan.level === 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-3.5 border border-amber-200 shadow-2xs space-y-2">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5">
                  <Crown className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-black text-amber-950">
                    Free Trial Mode (Level 0 - 2 Videos)
                  </h4>
                  <p className="text-[11px] text-amber-800 leading-snug mt-0.5">
                    Purchase Level 1 (2 Videos, ₹40/day), Level 2 (3 Videos, ₹90/day), or Level 3 (3 Videos, ₹135/day) to unlock daily VIP tasks for 365 days!
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('member_plans')}
                className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-xs active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Buy VIP Level Plan Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Daily Missions Quota Progress Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Youtube className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wide block leading-none">
                    Level {activeUserPlan.level} Tasks Quota
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Total {maxDailyVideos} Videos ({todayVideosWatched} Completed, {remainingVideos} Remaining)
                  </span>
                </div>
              </div>
              <span
                className={`text-xs font-black px-2.5 py-1 rounded-full border shadow-2xs ${
                  isAllVideosDone
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                {todayVideosWatched} / {maxDailyVideos} VD
              </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isAllVideosDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                  }`}
                  style={{
                    width: `${Math.min(100, (todayVideosWatched / maxDailyVideos) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {!isAllVideosDone && (
              <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-slate-600 flex items-center justify-between">
                <span>
                  Your <b>Level {activeUserPlan.level}</b> includes <b>{maxDailyVideos} videos</b>. Earn <b>₹{perVideoReward}</b> reward per video.
                </span>
                <span className="text-xs font-black text-blue-700 shrink-0 ml-2">
                  ₹{perVideoReward}/VD
                </span>
              </div>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-xs">
            {(['all', 'in_progress', 'completed'] as const).map((tab) => {
              const count =
                tab === 'in_progress'
                  ? pendingSubmissions.length
                  : tab === 'completed'
                  ? approvedSubmissions.length
                  : allTasks.length;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg capitalize transition-all flex items-center justify-center gap-1.5 ${
                    activeFilter === tab
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>{tab === 'in_progress' ? 'In Progress' : tab}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        activeFilter === tab
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ALL TAB: Shows exact video missions matching user's level */}
          {activeFilter === 'all' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Level {activeUserPlan.level} Video Tasks ({videoMissions.length} Total)</span>
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {todayVideosWatched}/{maxDailyVideos} Done
                </span>
              </div>

              {/* Exact Level-Based Video Tasks List */}
              <div className="space-y-2.5">
                {videoMissions.map((task) => (
                  <div
                    key={task.id}
                    className={`bg-white rounded-2xl p-3.5 border transition-all shadow-xs flex items-center justify-between ${
                      task.isDone
                        ? 'border-emerald-200/90 bg-emerald-50/20'
                        : task.isReady
                        ? 'border-blue-300 ring-2 ring-blue-500/10'
                        : 'border-slate-200/80 opacity-75'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center shrink-0 border relative ${
                          task.isDone
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : task.isReady
                            ? 'bg-red-50 text-red-600 border-red-200 shadow-xs'
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                      >
                        <Youtube className="w-5 h-5" />
                        <span className="text-[8px] font-black uppercase mt-0.5 leading-none">
                          VD #{task.taskNum}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black text-slate-800 truncate">
                            {task.title}
                          </h4>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                            LV {task.planLevel ?? activeUserPlan.level}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                          {task.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                      <span className="text-xs font-black text-emerald-600">
                        +₹{task.reward}
                      </span>

                      {task.isDone ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Done</span>
                        </span>
                      ) : task.isReady ? (
                        <button
                          onClick={() => handleStartTask('video', task.taskNum)}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer animate-pulse"
                        >
                          <PlayCircle className="w-3.5 h-3.5 fill-white/20" />
                          <span>Watch 30s</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>Locked</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Additional Bonus: Referral Task */}
                <div className="pt-2">
                  <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0 text-purple-600">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-800">{referralTask.title}</h4>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                            Extra Bonus
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">{referralTask.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                      <span className="text-xs font-black text-purple-600">
                        +₹{referralTask.reward}
                      </span>
                      <button
                        onClick={() => handleStartTask('referral')}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] px-3 py-1 rounded-lg shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>Invite</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* VIP Level Plan Task Guide & Upgrade Card */}
              <div className="mt-4 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Level Wise Video Tasks Quota
                    </h3>
                  </div>
                  <button
                    onClick={() => navigate('member_plans')}
                    className="text-[10px] font-black text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    <span>View All Plans</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Active Plans Summary Bar */}
                {activeUserPlans.length > 0 && activeUserPlans[0].level > 0 && (
                  <div className="p-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-emerald-950">
                        {activeUserPlans.length > 1
                          ? `You have ${activeUserPlans.length} VIP Plans Active (${activeUserPlans.map((p) => `LV ${p.level}`).join(' + ')})`
                          : `Level ${activeUserPlan.level} Active VIP Plan`}
                      </span>
                    </div>
                    <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                      {maxDailyVideos} Videos Daily Quota
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2 text-xs">
                  {plans.filter((p) => p.level > 0).map((p) => {
                    const isPurchased =
                      (user.purchasedPlanIds && user.purchasedPlanIds.includes(p.id)) ||
                      activeUserPlans.some((ap) => ap.level === p.level) ||
                      activeUserPlan.level === p.level;

                    return (
                      <div
                        key={p.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                          isPurchased
                            ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-400/40 shadow-xs'
                            : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded-md shrink-0 ${
                              isPurchased
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            LV {p.level}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-800 text-[11px] truncate">
                                {p.title}
                              </span>
                              {isPurchased && (
                                <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300">
                                  Purchased
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 block">
                              {p.dailyMissions} Videos Daily • ₹{p.perMission}/VD
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-right shrink-0">
                          <div>
                            <span className="font-black text-emerald-600 block text-[11px]">
                              ₹{p.dailyIncome}/day
                            </span>
                            <span className="text-[9px] text-slate-400">
                              Price: ₹{p.price.toLocaleString('en-IN')}
                            </span>
                          </div>

                          {isPurchased ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Active ✓</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => navigate('member_plans')}
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200"
                            >
                              Buy Plan
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* IN PROGRESS TAB */}
          {activeFilter === 'in_progress' && (
            <div className="space-y-3">
              {pendingSubmissions.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700">No Video Tasks In Progress</h4>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    You have not submitted any YouTube video tasks yet. Go to the "All" tab to start a video task.
                  </p>
                </div>
              ) : (
                pendingSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                          {getTaskIcon(sub.taskType)}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">{sub.title}</h4>
                          <p className="text-[10px] text-slate-500">
                            Submitted: {sub.submittedAt}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                        +₹{sub.reward}
                      </span>
                    </div>

                    <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                        <span>Admin Verification Pending</span>
                      </div>
                      <span className="text-[10px] text-amber-700 font-semibold">Under Review</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* COMPLETED TAB */}
          {activeFilter === 'completed' && (
            <div className="space-y-2.5">
              {approvedSubmissions.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700">No Completed Missions Yet</h4>
                  <p className="text-[11px] text-slate-400">
                    Approved missions yahan dikhenge.
                  </p>
                </div>
              ) : (
                approvedSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                        {getTaskIcon(sub.taskType)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{sub.title}</h4>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approved &amp; Added to Wallet</span>
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      +₹{sub.reward}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>

      {/* FIXED BOTTOM NAV */}
      <div className="shrink-0 z-30">
        <BottomNav />
      </div>
    </div>
  );
};
