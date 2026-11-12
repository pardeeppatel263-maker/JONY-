import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, User, Mail, Smartphone, ShieldCheck, Lock } from 'lucide-react';

const formatDisplayMobile = (mobile?: string) => {
  if (!mobile) return 'Not set';
  const cleanDigits = mobile.replace(/\D/g, '');
  const tenDigits = cleanDigits.length > 10 ? cleanDigits.slice(-10) : cleanDigits;
  return tenDigits ? `+91 ${tenDigits}` : mobile;
};

export const EditProfileModal: React.FC = () => {
  const { isEditProfileOpen, setIsEditProfileOpen, user, updateUserProfile } = useApp();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);

  if (!isEditProfileOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(name, email, user.upiId);
  };

  const displayMobile = formatDisplayMobile(user.mobile);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <h3 className="text-sm font-bold">Personal Info</h3>
          </div>
          <button
            onClick={() => setIsEditProfileOpen(false)}
            className="p-1 rounded-full text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 space-y-3.5">
          {/* USER REGISTERED MOBILE NUMBER FIELD - SINGLE +91 ONLY */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                <span>Mobile Number</span>
              </span>
              <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded-full flex items-center gap-0.5 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Verified
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={displayMobile}
                disabled
                className="w-full p-2.5 bg-slate-100/90 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 cursor-not-allowed pr-8 tracking-wide"
              />
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
            </div>
            <p className="text-[9px] text-slate-400">
              For account security, your registered mobile number cannot be changed.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-blue-600"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-blue-600"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setIsEditProfileOpen(false)}
              className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
