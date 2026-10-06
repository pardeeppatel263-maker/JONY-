import React, { useState } from 'react';
import { AppHeader } from '../components/AppHeader';
import { useApp } from '../context/AppContext';
import {
  HelpCircle,
  PhoneCall,
  FileText,
  ShieldAlert,
  Info,
  ChevronRight,
  ChevronDown,
  MessageCircle,
  Mail,
  Send,
} from 'lucide-react';

export const HelpCenterScreen: React.FC = () => {
  const { showToast, adminSettings } = useApp();
  const [expandedSection, setExpandedSection] = useState<'faq' | 'contact' | 'terms' | 'privacy' | 'about' | null>('contact');

  const whatsappVal = adminSettings.supportWhatsapp?.trim() || '';
  const telegramVal = adminSettings.supportTelegram?.trim() || '';

  const handleOpenWhatsApp = () => {
    if (whatsappVal) {
      const cleanNumber = whatsappVal.replace(/\D/g, '');
      const url = whatsappVal.startsWith('http')
        ? whatsappVal
        : `https://wa.me/${cleanNumber.length === 10 ? '91' + cleanNumber : cleanNumber}`;
      window.open(url, '_blank');
      showToast('Opening WhatsApp Support chat...');
    } else {
      showToast('⚠️ WhatsApp support link is not configured yet. Configure it in Admin Panel Settings.');
    }
  };

  const handleOpenTelegram = () => {
    if (telegramVal) {
      const url = telegramVal.startsWith('http')
        ? telegramVal
        : `https://t.me/${telegramVal.replace('@', '')}`;
      window.open(url, '_blank');
      showToast('Opening Telegram Support channel...');
    } else {
      showToast('⚠️ Telegram support link is not configured yet. Configure it in Admin Panel Settings.');
    }
  };

  const faqs = [
    {
      q: 'How do I earn daily survey rewards?',
      a: 'After choosing a member plan, 1 high-reward survey is unlocked daily. Complete the questions to instantly receive ₹150+ in your wallet balance.',
    },
    {
      q: 'How long does UPI withdrawal take?',
      a: 'Withdrawal requests are processed via automated UPI gateway within 24-48 business hours directly to your registered UPI ID.',
    },
    {
      q: 'How does the Referral program work?',
      a: 'Share your unique referral code or link. When your friend signs up and completes their first task, you both receive a ₹100 bonus instantly.',
    },
    {
      q: 'What is the minimum withdrawal limit?',
      a: 'The minimum withdrawal limit is ₹1,000. You can withdraw to PhonePe, Google Pay, Paytm, or any BHIM UPI handle.',
    },
  ];

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden bg-slate-50">
      {/* FIXED TOP HEADER */}
      <div className="shrink-0 z-30">
        <AppHeader title="Help Center" showBack={true} />
      </div>

      {/* SCROLLABLE MIDDLE CONTENT */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <main className="p-4 space-y-3.5 max-w-md mx-auto pb-6">
          {/* FAQ Card matching Screenshot 14 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === 'faq' ? null : 'faq')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">FAQ</h3>
                  <p className="text-[10px] text-slate-400">Common questions &amp; answers</p>
                </div>
              </div>
              {expandedSection === 'faq' ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {expandedSection === 'faq' && (
              <div className="px-4 pb-4 space-y-3 pt-1 border-t border-slate-100">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-xl space-y-1">
                    <h4 className="text-xs font-bold text-slate-800">{faq.q}</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact & Support Section with WhatsApp and Telegram */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === 'contact' ? null : 'contact')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Help &amp; Support Channels</h3>
                  <p className="text-[10px] text-slate-400">Direct WhatsApp &amp; Telegram Assistance</p>
                </div>
              </div>
              {expandedSection === 'contact' ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {expandedSection === 'contact' && (
              <div className="px-4 pb-4 space-y-2.5 border-t border-slate-100 pt-3">
                {/* WhatsApp Button */}
                <button
                  onClick={handleOpenWhatsApp}
                  className="w-full p-3 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl flex items-center justify-between transition-all group active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-emerald-950 block">WhatsApp Support</span>
                      <span className="text-[10px] text-emerald-700">
                        {whatsappVal ? whatsappVal : 'Click to chat with support team'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-emerald-800 bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    Chat Now &rarr;
                  </span>
                </button>

                {/* Telegram Button */}
                <button
                  onClick={handleOpenTelegram}
                  className="w-full p-3 bg-sky-50 hover:bg-sky-100/80 border border-sky-200 rounded-xl flex items-center justify-between transition-all group active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shadow-xs">
                      <Send className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-sky-950 block">Telegram Channel / Support</span>
                      <span className="text-[10px] text-sky-700">
                        {telegramVal ? telegramVal : 'Join official community & updates'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-sky-800 bg-white/80 px-2.5 py-1 rounded-lg border border-sky-200 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    Join Channel &rarr;
                  </span>
                </button>

                {/* Email Support */}
                <button
                  onClick={() => showToast('Email support: help@zorotask.in')}
                  className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-3 text-xs font-bold text-slate-800 transition-colors"
                >
                  <Mail className="w-4 h-4 text-slate-600" />
                  <span>Email: support@zorotask.in</span>
                </button>

                <p className="text-[10px] text-slate-400 text-center pt-1">
                  💡 You can update the WhatsApp number and Telegram channel link in Admin Panel Settings.
                </p>
              </div>
            )}
          </div>

          {/* Terms & Conditions matching Screenshot 14 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === 'terms' ? null : 'terms')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Terms &amp; Conditions</h3>
                  <p className="text-[10px] text-slate-400">Read our terms &amp; conditions</p>
                </div>
              </div>
              {expandedSection === 'terms' ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {expandedSection === 'terms' && (
              <div className="p-4 border-t border-slate-100 text-xs text-slate-600 space-y-2">
                <p>1. Users must submit accurate and authentic survey feedback.</p>
                <p>2. Only 1 account per device/IP address is permitted.</p>
                <p>3. Fraudulent referral activities may result in account review.</p>
              </div>
            )}
          </div>

          {/* Privacy Policy matching Screenshot 14 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === 'privacy' ? null : 'privacy')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Privacy Policy</h3>
                  <p className="text-[10px] text-slate-400">We value your privacy</p>
                </div>
              </div>
              {expandedSection === 'privacy' ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {expandedSection === 'privacy' && (
              <div className="p-4 border-t border-slate-100 text-xs text-slate-600 space-y-1 leading-relaxed">
                <p>Your personal data and UPI details are encrypted and securely stored. We never sell your survey data to unauthorized third parties.</p>
              </div>
            )}
          </div>

          {/* About Us matching Screenshot 14 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === 'about' ? null : 'about')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">About Us</h3>
                  <p className="text-[10px] text-slate-400">Know more about ZoroTask</p>
                </div>
              </div>
              {expandedSection === 'about' ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {expandedSection === 'about' && (
              <div className="p-4 border-t border-slate-100 text-xs text-slate-600 space-y-2">
                <p className="font-semibold text-slate-800">ZoroTask (Version 2.5)</p>
                <p>India's leading opinion rewards and task fulfillment network. Empowering individuals to monetize their free time with daily surveys and peer referrals.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
