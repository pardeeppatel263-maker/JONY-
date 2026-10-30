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
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  Crown,
} from 'lucide-react';
import { SupportTicket } from '../types';

export const HelpCenterScreen: React.FC = () => {
  const { showToast, adminSettings, supportTickets, createSupportTicket, user } = useApp();
  const [expandedSection, setExpandedSection] = useState<'ticket' | 'faq' | 'contact' | 'terms' | 'privacy' | 'about' | null>('ticket');

  // Support Ticket Form State
  const [ticketCategory, setTicketCategory] = useState<SupportTicket['category']>('payment');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketScreenshot, setTicketScreenshot] = useState<string>('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  const userTickets = supportTickets.filter(
    (t) => t.userMobile === user.mobile || (user.referralCode && t.userId === user.referralCode)
  );

  const handleTicketScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('❌ Image size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setTicketScreenshot(reader.result as string);
        showToast('✓ Screenshot attached');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim()) {
      showToast('❌ Please enter a subject for your ticket');
      return;
    }
    if (!ticketMessage.trim()) {
      showToast('❌ Please describe your issue');
      return;
    }
    setIsSubmittingTicket(true);
    try {
      await createSupportTicket(ticketCategory, ticketSubject, ticketMessage, ticketScreenshot);
      setTicketSubject('');
      setTicketMessage('');
      setTicketScreenshot('');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const whatsappVal = (adminSettings.supportWhatsapp || adminSettings.whatsappSupportNumber)?.trim() || '';
  const telegramVal = adminSettings.supportTelegram?.trim() || '';

  const handleOpenWhatsApp = () => {
    if (whatsappVal) {
      const cleanNumber = whatsappVal.replace(/\D/g, '');
      const fullDigits = cleanNumber.length === 10 ? '91' + cleanNumber : cleanNumber;
      const url = whatsappVal.startsWith('http')
        ? whatsappVal
        : `https://wa.me/${fullDigits}?text=${encodeURIComponent('Hello ZoroTask Support! I need assistance with my account.')}`;
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

  const vipTelegramVal = (adminSettings.vipSupportTelegram || adminSettings.supportTelegram)?.trim() || '';

  const handleOpenVipTelegram = () => {
    if (vipTelegramVal) {
      const url = vipTelegramVal.startsWith('http')
        ? vipTelegramVal
        : `https://t.me/${vipTelegramVal.replace('@', '')}`;
      window.open(url, '_blank');
      showToast('Opening VIP Telegram Support...');
    } else {
      showToast('⚠️ VIP Telegram support link is not configured yet. Configure it in Admin Panel Settings.');
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
          {/* Support Ticket Section */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === 'ticket' ? null : 'ticket')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-800">Support Tickets</h3>
                    {userTickets.filter((t) => t.status === 'open').length > 0 && (
                      <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full">
                        {userTickets.filter((t) => t.status === 'open').length} Open
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">Report payment, task, or account issues</p>
                </div>
              </div>
              {expandedSection === 'ticket' ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {expandedSection === 'ticket' && (
              <div className="p-4 pt-0 space-y-4 border-t border-slate-100 animate-in fade-in">
                {/* Create Ticket Form */}
                <form onSubmit={handleCreateTicket} className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800">Open a New Ticket</h4>
                  
                  {/* Category Pills */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Issue Category</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['payment', 'withdrawal', 'task', 'plan', 'other'] as const).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setTicketCategory(cat)}
                          className={`py-1.5 px-2 rounded-lg text-[10px] font-bold capitalize transition ${
                            ticketCategory === cat
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Subject</label>
                    <input
                      type="text"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="e.g. UTR payment not updated or task stuck"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Detailed Message</label>
                    <textarea
                      rows={3}
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder="Explain your problem with exact details (amount, UTR, date, etc.)..."
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Optional Screenshot */}
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700 flex items-center gap-1.5 transition">
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>{ticketScreenshot ? 'Change Screenshot' : 'Attach Screenshot'}</span>
                      <input type="file" accept="image/*" onChange={handleTicketScreenshotUpload} className="hidden" />
                    </label>
                    {ticketScreenshot && (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Attached</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingTicket}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingTicket ? 'Submitting...' : 'Submit Support Ticket'}</span>
                  </button>
                </form>

                {/* My Tickets List */}
                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-bold text-slate-800">My Tickets History ({userTickets.length})</h4>
                  {userTickets.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No tickets submitted yet.</p>
                  ) : (
                    userTickets.map((t) => (
                      <div key={t.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-slate-400">#{t.id.slice(-6)}</span>
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-full capitalize ${
                              t.status === 'resolved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : t.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {t.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800">{t.subject}</h5>
                          <p className="text-[11px] text-slate-600 mt-0.5">{t.message}</p>
                        </div>
                        {t.adminReply && (
                          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1">
                            <span className="text-[10px] font-black text-emerald-800 flex items-center gap-1">
                              <span>Admin Reply:</span>
                              <span className="font-normal text-emerald-600">({t.repliedAt})</span>
                            </span>
                            <p className="text-xs text-emerald-950 font-medium">{t.adminReply}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

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
                        {telegramVal ? telegramVal : 'https://t.me/zorotask'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-sky-800 bg-white/80 px-2.5 py-1 rounded-lg border border-sky-200 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    Join Channel &rarr;
                  </span>
                </button>

                {/* VIP Telegram Support Button */}
                <button
                  onClick={handleOpenVipTelegram}
                  className="w-full p-3 bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100/90 hover:to-yellow-100/90 border border-amber-300 rounded-xl flex items-center justify-between transition-all group active:scale-98 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-500 text-slate-950 flex items-center justify-center shadow-xs">
                      <Crown className="w-4 h-4 fill-amber-950/20" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-amber-950 block">VIP Telegram Support</span>
                        <span className="text-[9px] font-black uppercase bg-amber-400 text-amber-950 px-1.5 py-0.2 rounded shadow-2xs">
                          VIP
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-800 font-medium block">
                        {vipTelegramVal ? vipTelegramVal : 'https://t.me/ZoroTaskVIPSupport'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-amber-950 bg-white/90 px-2.5 py-1 rounded-lg border border-amber-300 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors shrink-0">
                    Connect VIP &rarr;
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
                <p className="font-semibold text-slate-800">ZoroTask (Version 2.6)</p>
                <p>India's leading opinion rewards and task fulfillment network. Empowering individuals to monetize their free time with daily surveys and peer referrals.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
