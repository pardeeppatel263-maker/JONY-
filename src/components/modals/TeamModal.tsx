import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Users, Award, TrendingUp, Gift, Percent, CheckCircle2 } from 'lucide-react';

export const TeamModal: React.FC = () => {
  const { isTeamModalOpen, setIsTeamModalOpen, user, registeredUsers } = useApp();

  if (!isTeamModalOpen) return null;

  const myCode = user.referralCode;
  const directTeam = registeredUsers.filter((u) => u.referredBy === myCode);
  const directCodes = directTeam.map((u) => u.referralCode);
  const tier2Team = registeredUsers.filter((u) => u.referredBy && directCodes.includes(u.referredBy));
  const tier2Codes = tier2Team.map((u) => u.referralCode);
  const tier3Team = registeredUsers.filter((u) => u.referredBy && tier2Codes.includes(u.referredBy));

  const totalMembers = directTeam.length + tier2Team.length + tier3Team.length;
  const totalCommission = (user.referralEarnings || 0) + (user.teamTaskEarnings || 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-scaleUp">
        <div className="bg-gradient-to-r from-purple-800 to-indigo-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-200" />
            <div>
              <h3 className="text-sm font-bold leading-tight">Team Referral Report</h3>
              <p className="text-[10px] text-purple-200">Live Downstream Royalty Network</p>
            </div>
          </div>
          <button
            onClick={() => setIsTeamModalOpen(false)}
            className="p-1 rounded-full text-white/80 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Overview */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100 text-center">
              <span className="text-[10px] uppercase font-bold text-purple-600 block">Total Team</span>
              <p className="text-xl font-black text-purple-900 mt-0.5">{totalMembers}</p>
              <span className="text-[9px] text-slate-500">Registered members</span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block">Total Royalty</span>
              <p className="text-xl font-black text-emerald-700 mt-0.5">
                ₹{totalCommission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[9px] text-emerald-600">Plan &amp; task earnings</span>
            </div>
          </div>

          {/* Level Breakdown matching user specifications */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Multi-Tier Royalty Levels
            </h4>

            {/* Level 1: 4.5% + 1.6% Daily */}
            <div className="bg-blue-50/70 rounded-xl p-3 border border-blue-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-blue-900">Level 1 (Direct Friends)</span>
                  <span className="text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.2 rounded">
                    4.5% + 1.6%
                  </span>
                </div>
                <p className="text-[10px] text-blue-700 mt-0.5">
                  {directTeam.length} direct members &bull; 4.5% plan + 1.6% daily tasks
                </p>
              </div>
              <span className="text-xs font-black text-blue-800 shrink-0">
                {directTeam.length} Active
              </span>
            </div>

            {/* Level 2: 1.5% */}
            <div className="bg-purple-50/70 rounded-xl p-3 border border-purple-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-purple-900">Level 2 (Friends of Friends)</span>
                  <span className="text-[9px] font-black bg-purple-600 text-white px-1.5 py-0.2 rounded">
                    1.5%
                  </span>
                </div>
                <p className="text-[10px] text-purple-700 mt-0.5">
                  {tier2Team.length} members &bull; 1.5% on plan purchases
                </p>
              </div>
              <span className="text-xs font-black text-purple-800 shrink-0">
                {tier2Team.length} Active
              </span>
            </div>

            {/* Level 3+: 1.0% */}
            <div className="bg-emerald-50/70 rounded-xl p-3 border border-emerald-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-emerald-900">Level 3+ (Downstream Team)</span>
                  <span className="text-[9px] font-black bg-emerald-600 text-white px-1.5 py-0.2 rounded">
                    1.0%
                  </span>
                </div>
                <p className="text-[10px] text-emerald-700 mt-0.5">
                  {tier3Team.length} members &bull; 1.0% downstream plan bonus
                </p>
              </div>
              <span className="text-xs font-black text-emerald-800 shrink-0">
                {tier3Team.length} Active
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsTeamModalOpen(false)}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs active:scale-98 transition-all cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
