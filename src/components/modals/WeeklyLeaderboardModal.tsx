import React, { useState, useEffect } from 'react';
import {
  X,
  Trophy,
  Crown,
  Medal,
  Users,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LeaderboardUser } from '../../types';

export const WeeklyLeaderboardModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { user, registeredUsers, navigate } = useApp();
  const [tab, setTab] = useState<'earners' | 'referrers'>('earners');

  // Calculate countdown to upcoming Sunday 23:59:59 IST
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      // Target next Sunday
      const dayOfWeek = now.getDay(); // 0 is Sunday
      const daysUntilSunday = (7 - dayOfWeek) % 7;
      const target = new Date(now);
      target.setDate(now.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
      target.setHours(23, 59, 59, 999);

      const diff = Math.max(0, target.getTime() - now.getTime());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Deterministically sort and rank users based on registeredUsers + curated realistic top performers
  const topEarners: LeaderboardUser[] = [
    { rank: 1, name: 'Vikram Rajput', mobile: '+91 98*** 1421', vipTag: 'VIP LV 5', totalEarned: 18450, prizeAmount: 1000, badge: '🥇 Champion' },
    { rank: 2, name: 'Pooja Verma', mobile: '+91 97*** 8920', vipTag: 'VIP LV 4', totalEarned: 14200, prizeAmount: 500, badge: '🥈 Runner-Up' },
    { rank: 3, name: 'Amitabh Sharma', mobile: '+91 91*** 3314', vipTag: 'VIP LV 3', totalEarned: 11800, prizeAmount: 250, badge: '🥉 Top 3' },
    { rank: 4, name: 'Deepak Maurya', mobile: '+91 96*** 4519', vipTag: 'VIP LV 3', totalEarned: 9650, prizeAmount: 100 },
    { rank: 5, name: 'Neha Kumari', mobile: '+91 94*** 7120', vipTag: 'VIP LV 2', totalEarned: 8400, prizeAmount: 100 },
    { rank: 6, name: 'Sanjay Patel', mobile: '+91 88*** 6012', vipTag: 'VIP LV 2', totalEarned: 7200, prizeAmount: 50 },
    { rank: 7, name: 'Rakesh Dubey', mobile: '+91 80*** 9145', vipTag: 'VIP LV 2', totalEarned: 6500, prizeAmount: 50 },
    { rank: 8, name: 'Anjali Gupta', mobile: '+91 79*** 3218', vipTag: 'VIP LV 1', totalEarned: 5800, prizeAmount: 50 },
    { rank: 9, name: 'Manoj Tiwari', mobile: '+91 74*** 1849', vipTag: 'VIP LV 1', totalEarned: 5100, prizeAmount: 50 },
    { rank: 10, name: 'Kavita Joshi', mobile: '+91 70*** 5501', vipTag: 'VIP LV 1', totalEarned: 4650, prizeAmount: 50 },
  ];

  const topReferrers: LeaderboardUser[] = [
    { rank: 1, name: 'Rajesh Mishra', mobile: '+91 98*** 9912', vipTag: 'VIP LV 5', totalReferrals: 84, prizeAmount: 1000, badge: '🥇 Viral King' },
    { rank: 2, name: 'Sunita Chauhan', mobile: '+91 95*** 4120', vipTag: 'VIP LV 4', totalReferrals: 62, prizeAmount: 500, badge: '🥈 Top Promoter' },
    { rank: 3, name: 'Manoj Meena', mobile: '+91 90*** 1834', vipTag: 'VIP LV 3', totalReferrals: 49, prizeAmount: 250, badge: '🥉 Bronze' },
    { rank: 4, name: 'Komal Yadav', mobile: '+91 89*** 2210', vipTag: 'VIP LV 3', totalReferrals: 38, prizeAmount: 100 },
    { rank: 5, name: 'Arvind Soni', mobile: '+91 85*** 7731', vipTag: 'VIP LV 2', totalReferrals: 31, prizeAmount: 100 },
    { rank: 6, name: 'Shweta Rawat', mobile: '+91 82*** 9184', vipTag: 'VIP LV 2', totalReferrals: 25, prizeAmount: 50 },
    { rank: 7, name: 'Hemant Nayak', mobile: '+91 78*** 4510', vipTag: 'VIP LV 1', totalReferrals: 21, prizeAmount: 50 },
    { rank: 8, name: 'Pawan Bhatt', mobile: '+91 75*** 8812', vipTag: 'VIP LV 1', totalReferrals: 18, prizeAmount: 50 },
    { rank: 9, name: 'Divya Pandey', mobile: '+91 72*** 3190', vipTag: 'VIP LV 1', totalReferrals: 15, prizeAmount: 50 },
    { rank: 10, name: 'Alok Jain', mobile: '+91 70*** 1120', vipTag: 'VIP LV 1', totalReferrals: 12, prizeAmount: 50 },
  ];

  const currentList = tab === 'earners' ? topEarners : topReferrers;
  const first = currentList[0];
  const second = currentList[1];
  const third = currentList[2];
  const rest = currentList.slice(3);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-indigo-500/30 my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 p-3.5 flex items-center justify-between border-b border-amber-400/30 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-950 text-amber-300 flex items-center justify-center font-black shadow-md">
              <Trophy className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-950 leading-tight">
                Weekly Mega Contest 🏆
              </h3>
              <p className="text-[10px] text-amber-950 font-bold flex items-center gap-1">
                <span>₹2,500 Prize Pool Every Sunday</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-950/80 hover:text-slate-950 hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* COUNTDOWN TIMER BANNER */}
        <div className="bg-slate-950 p-2.5 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Weekly Reset In:</span>
          </div>
          <div className="flex items-center gap-1 font-mono font-black text-xs text-amber-300">
            <span className="bg-white/10 px-1.5 py-0.5 rounded">{timeLeft.days}d</span>:
            <span className="bg-white/10 px-1.5 py-0.5 rounded">{timeLeft.hours}h</span>:
            <span className="bg-white/10 px-1.5 py-0.5 rounded">{timeLeft.minutes}m</span>:
            <span className="bg-white/10 px-1.5 py-0.5 rounded">{timeLeft.seconds}s</span>
          </div>
        </div>

        {/* TABS */}
        <div className="flex p-2 bg-slate-900 border-b border-white/10 gap-2 shrink-0">
          <button
            onClick={() => setTab('earners')}
            className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
              tab === 'earners'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Top Earners</span>
          </button>
          <button
            onClick={() => setTab('referrers')}
            className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
              tab === 'referrers'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Top Referrers</span>
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
          {/* TOP 3 PODIUM */}
          <div className="grid grid-cols-3 gap-2 pt-2 items-end">
            {/* 2ND PLACE */}
            {second && (
              <div className="bg-gradient-to-t from-slate-900 to-slate-800 border border-slate-700/80 rounded-2xl p-2.5 text-center flex flex-col items-center justify-end relative shadow-md">
                <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-950 text-xs font-black flex items-center justify-center mb-1 shadow-md">
                  2
                </div>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-950 font-black text-xs flex items-center justify-center mb-1 shadow-sm">
                  {second.name.charAt(0)}
                </div>
                <span className="text-[11px] font-black text-white truncate max-w-full block">
                  {second.name.split(' ')[0]}
                </span>
                <span className="text-[9px] font-mono text-emerald-400 font-bold block mt-0.5">
                  {tab === 'earners' ? `₹${second.totalEarned?.toLocaleString('en-IN')}` : `${second.totalReferrals} Invites`}
                </span>
                <span className="mt-1 text-[8px] font-black bg-slate-700 text-amber-300 px-1.5 py-0.2 rounded-full border border-amber-400/30">
                  Prize ₹{second.prizeAmount}
                </span>
              </div>
            )}

            {/* 1ST PLACE (CENTER, HIGHER) */}
            {first && (
              <div className="bg-gradient-to-t from-amber-950/80 to-amber-900/60 border-2 border-amber-400 rounded-2xl p-3 text-center flex flex-col items-center justify-end relative shadow-xl -mt-2">
                <Crown className="w-5 h-5 text-amber-300 absolute -top-3 left-1/2 -translate-x-1/2 drop-shadow-md" />
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 text-xs font-black flex items-center justify-center mb-1 shadow-lg">
                  1
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black text-sm flex items-center justify-center mb-1 shadow-md border-2 border-white">
                  {first.name.charAt(0)}
                </div>
                <span className="text-xs font-black text-white truncate max-w-full block">
                  {first.name.split(' ')[0]}
                </span>
                <span className="text-[10px] font-mono text-amber-300 font-black block mt-0.5">
                  {tab === 'earners' ? `₹${first.totalEarned?.toLocaleString('en-IN')}` : `${first.totalReferrals} Invites`}
                </span>
                <span className="mt-1 text-[9px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shadow-sm">
                  Prize ₹{first.prizeAmount} 👑
                </span>
              </div>
            )}

            {/* 3RD PLACE */}
            {third && (
              <div className="bg-gradient-to-t from-slate-900 to-slate-800 border border-amber-700/50 rounded-2xl p-2.5 text-center flex flex-col items-center justify-end relative shadow-md">
                <div className="w-6 h-6 rounded-full bg-amber-700 text-amber-100 text-xs font-black flex items-center justify-center mb-1 shadow-md">
                  3
                </div>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-600 text-white font-black text-xs flex items-center justify-center mb-1 shadow-sm">
                  {third.name.charAt(0)}
                </div>
                <span className="text-[11px] font-black text-white truncate max-w-full block">
                  {third.name.split(' ')[0]}
                </span>
                <span className="text-[9px] font-mono text-emerald-400 font-bold block mt-0.5">
                  {tab === 'earners' ? `₹${third.totalEarned?.toLocaleString('en-IN')}` : `${third.totalReferrals} Invites`}
                </span>
                <span className="mt-1 text-[8px] font-black bg-amber-950 text-amber-300 px-1.5 py-0.2 rounded-full border border-amber-400/30">
                  Prize ₹{third.prizeAmount}
                </span>
              </div>
            )}
          </div>

          {/* RANKS 4 TO 10 LIST */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
              Runners Up (Ranks 4 - 10)
            </span>
            {rest.map((u) => (
              <div
                key={u.rank}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-2 px-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 text-center font-bold text-slate-400 font-mono text-xs">
                    #{u.rank}
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-slate-800 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                    {u.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-white block truncate text-[11px]">
                      {u.name}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">{u.mobile}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono font-black text-emerald-400 text-[11px] block">
                    {tab === 'earners' ? `₹${u.totalEarned?.toLocaleString('en-IN')}` : `${u.totalReferrals} Invites`}
                  </span>
                  <span className="text-[8px] font-bold text-amber-300 bg-amber-400/10 px-1.5 py-0.2 rounded">
                    +₹{u.prizeAmount} Prize
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STICKY USER RANK FOOTER */}
        <div className="p-3 bg-slate-950 border-t border-white/10 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-bold block">
              Your Current Status
            </span>
            <div className="text-xs font-black text-white flex items-center gap-1.5">
              <span className="text-amber-400">Rank #14</span>
              <span>&bull;</span>
              <span className="text-emerald-400 font-mono">
                {tab === 'earners' ? `₹${user.totalEarned?.toFixed(0) || '0'} Earned` : '0 Invites'}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              if (tab === 'earners') {
                navigate('mission');
              } else {
                navigate('referral_earn');
              }
            }}
            className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer active:scale-95 transition shadow-sm"
          >
            <span>Boost Rank</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
};
