import React from 'react';
import { useApp } from '../context/AppContext';
import { AppHeader } from '../components/AppHeader';
import { FileCheck, CheckCircle2, Clock, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export const DailySurveyScreen: React.FC = () => {
  const { surveys, setIsSurveyModalOpen, adminSettings } = useApp();
  const todaySurvey = surveys.find((s) => s.id === 'srv_today');
  const pastSurveys = surveys.filter((s) => s.id !== 'srv_today');
  const reward = adminSettings.dailySurveyReward || todaySurvey?.reward || 150;

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden bg-slate-50">
      {/* FIXED TOP HEADER */}
      <div className="shrink-0 z-30">
        <AppHeader title="Daily Survey" showBack={true} />
      </div>

      {/* SCROLLABLE MIDDLE CONTENT */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <main className="p-4 space-y-4 max-w-md mx-auto pb-6">
          {/* Top Banner matching Screenshot 7 */}
          <div className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 shadow-sm flex items-center justify-between">
            <div className="space-y-1 max-w-[70%]">
              <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                Earn Rewards
              </span>
              <h2 className="text-base font-black leading-tight text-white">
                Complete Survey <br />
                <span className="text-amber-300">Earn Rewards</span>
              </h2>
              <p className="text-[11px] text-blue-100">
                1 Survey per day • Easy &amp; Fast
              </p>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
              📝
            </div>
          </div>

          {/* Today's Survey Card matching Screenshot 7 */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Available Today
                </span>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      todaySurvey?.completed ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse'
                    }`}
                  />
                  <span>
                    {todaySurvey?.completed ? 'Today Survey Completed' : "1 Survey Available"}
                  </span>
                </h3>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-semibold text-slate-400">Survey Reward</span>
                <p className="text-base font-black text-emerald-600">
                  ₹{reward}
                </p>
                <span className="text-[9px] text-slate-400 block -mt-0.5">
                  (Official Survey)
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsSurveyModalOpen(true)}
              disabled={todaySurvey?.completed}
              className={`w-full py-3 px-4 font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all ${
                todaySurvey?.completed
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 active:scale-98'
              }`}
            >
              {todaySurvey?.completed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Already Claimed Today (Come back tomorrow)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Start Now (+₹{reward})</span>
                </>
              )}
            </button>
          </div>

          {/* Recent Surveys List matching Screenshot 7 */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Recent Surveys
            </h3>

            <div className="space-y-2">
              {pastSurveys.map((survey) => (
                <div
                  key={survey.id}
                  className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        {survey.title}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {survey.date}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    +₹{survey.reward}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
