import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Gift,
  RotateCw,
  Trophy,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { ScratchCardItem } from '../../types';

interface WheelPrize {
  label: string;
  amount: number;
  isScratchCard?: boolean;
  color: string;
  textColor: string;
}

const WHEEL_PRIZES: WheelPrize[] = [
  { label: '₹5 Cash', amount: 5, color: '#10B981', textColor: '#FFFFFF' },
  { label: '₹10 Cash', amount: 10, color: '#8B5CF6', textColor: '#FFFFFF' },
  { label: '₹25 Cash', amount: 25, color: '#F59E0B', textColor: '#FFFFFF' },
  { label: '₹50 Cash', amount: 50, color: '#EC4899', textColor: '#FFFFFF' },
  { label: '₹100 Mega', amount: 100, color: '#EAB308', textColor: '#000000' },
  { label: '🎁 Scratch Card', amount: 0, isScratchCard: true, color: '#06B6D4', textColor: '#FFFFFF' },
  { label: '₹2 Cash', amount: 2, color: '#3B82F6', textColor: '#FFFFFF' },
  { label: '₹15 Cash', amount: 15, color: '#F97316', textColor: '#FFFFFF' },
];

export const LuckySpinModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const {
    user,
    adminSettings,
    spinLuckyWheel,
    claimScratchCard,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'wheel' | 'scratch'>('wheel');
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [wonPrize, setWonPrize] = useState<WheelPrize | null>(null);

  // Scratch card active interaction state
  const [activeScratchCard, setActiveScratchCard] = useState<ScratchCardItem | null>(null);
  const [scratchProgress, setScratchProgress] = useState(0);
  const [isCardRevealed, setIsCardRevealed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  const dailyLimit = adminSettings?.dailyFreeSpins || 2;
  const todayStr = new Date().toISOString().split('T')[0];
  const spinsUsedToday = user.lastSpinDate === todayStr ? (user.dailySpinsUsed || 0) : 0;
  const freeSpinsLeft = Math.max(0, dailyLimit - spinsUsedToday);

  const scratchCards: ScratchCardItem[] = user.scratchCards || [];

  // Reset won prize when modal opens
  useEffect(() => {
    if (isOpen) {
      setWonPrize(null);
      setIsCardRevealed(false);
      setScratchProgress(0);
    }
  }, [isOpen]);

  // Handle Scratch Canvas setup
  useEffect(() => {
    if (!activeScratchCard || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 280;
    canvas.height = 160;

    // Fill with modern holographic silver-gold overlay
    const gradient = ctx.createLinearGradient(0, 0, 280, 160);
    gradient.addColorStop(0, '#94A3B8');
    gradient.addColorStop(0.3, '#CBD5E1');
    gradient.addColorStop(0.5, '#F1F5F9');
    gradient.addColorStop(0.8, '#94A3B8');
    gradient.addColorStop(1, '#64748B');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 280, 160);

    // Decorative pattern
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨ SCRATCH & WIN CASH ✨', 140, 85);
    ctx.font = '10px sans-serif';
    ctx.fillText('Swipe with finger to reveal', 140, 105);

    setIsCardRevealed(false);
    setScratchProgress(0);
  }, [activeScratchCard]);

  const handleScratchMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current || isCardRevealed || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    // Check clear progress roughly
    const nextProg = Math.min(100, scratchProgress + 6);
    setScratchProgress(nextProg);

    if (nextProg >= 50 && !isCardRevealed && activeScratchCard) {
      setIsCardRevealed(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
      claimScratchCard?.(activeScratchCard.id);
    }
  };

  const handleStartSpin = async () => {
    if (isSpinning) return;
    if (freeSpinsLeft <= 0) {
      showToast('⚠️ Daily free spins limit reached! Come back tomorrow or earn more from tasks.');
      return;
    }

    setIsSpinning(true);
    setWonPrize(null);

    // Pick weighted prize
    // Weighted probabilities: index 0 (₹5), index 1 (₹10), index 6 (₹2), index 5 (Scratch Card) have highest weight
    const prizeIndex = Math.floor(Math.random() * WHEEL_PRIZES.length);
    const selected = WHEEL_PRIZES[prizeIndex];

    const segmentAngle = 360 / WHEEL_PRIZES.length;
    // Rotate 5 to 7 full circles + land on segment center
    const extraRotations = (5 + Math.floor(Math.random() * 3)) * 360;
    // Calculate final rotation to align segment with top indicator (270 deg)
    const targetAngle = extraRotations + (360 - (prizeIndex * segmentAngle + segmentAngle / 2));
    
    setRotationAngle((prev) => prev + targetAngle);

    setTimeout(async () => {
      setIsSpinning(false);
      setWonPrize(selected);

      // Trigger Confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.55 },
      });

      // Call context handler to commit reward to user account
      if (spinLuckyWheel) {
        await spinLuckyWheel();
      }
    }, 4500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-indigo-500/30 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-blue-900 p-3.5 flex items-center justify-between border-b border-indigo-500/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white leading-tight">
                Lucky Spin &amp; Win
              </h3>
              <p className="text-[10px] text-indigo-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>100% Free Daily Rewards</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB SWITCHER: WHEEL VS SCRATCH CARDS */}
        <div className="flex p-2 bg-slate-900/90 border-b border-white/10 gap-2">
          <button
            onClick={() => setActiveTab('wheel')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
              activeTab === 'wheel'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Spin Wheel</span>
            {freeSpinsLeft > 0 && (
              <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                {freeSpinsLeft}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('scratch')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
              activeTab === 'scratch'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Scratch Cards</span>
            {scratchCards.filter((c) => !c.isScratched).length > 0 && (
              <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                {scratchCards.filter((c) => !c.isScratched).length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: LUCKY SPIN WHEEL */}
        {activeTab === 'wheel' && (
          <div className="p-4 space-y-4 text-center">
            {/* SPINS COUNTER */}
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-2.5 px-3.5 text-xs">
              <span className="text-slate-300 font-medium">Daily Free Spins:</span>
              <span className="font-mono font-black text-amber-300 bg-amber-400/20 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                {freeSpinsLeft} / {dailyLimit} Left
              </span>
            </div>

            {/* WHEEL CONTAINER */}
            <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
              {/* TOP POINTER TRIANGLE */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-amber-400 drop-shadow-md" />

              {/* ROTATING SVG WHEEL */}
              <div
                className="w-full h-full rounded-full shadow-2xl relative border-4 border-amber-400 overflow-hidden"
                style={{
                  transform: `rotate(${rotationAngle}deg)`,
                  transition: isSpinning ? 'transform 4.5s cubic-bezier(0.12, 0.8, 0.15, 1)' : 'none',
                }}
              >
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {WHEEL_PRIZES.map((prize, idx) => {
                    const totalSegments = WHEEL_PRIZES.length;
                    const angle = 360 / totalSegments;
                    const startAngle = (idx * angle - 90) * (Math.PI / 180);
                    const endAngle = ((idx + 1) * angle - 90) * (Math.PI / 180);

                    const x1 = 50 + 50 * Math.cos(startAngle);
                    const y1 = 50 + 50 * Math.sin(startAngle);
                    const x2 = 50 + 50 * Math.cos(endAngle);
                    const y2 = 50 + 50 * Math.sin(endAngle);

                    const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;
                    const midAngle = idx * angle + angle / 2;

                    return (
                      <g key={idx}>
                        <path d={pathData} fill={prize.color} stroke="#FFFFFF" strokeWidth="0.5" />
                        <text
                          x="50"
                          y="18"
                          fill={prize.textColor}
                          fontSize="4"
                          fontWeight="bold"
                          textAnchor="middle"
                          transform={`rotate(${midAngle}, 50, 50)`}
                        >
                          {prize.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* CENTER SPIN BUTTON */}
              <button
                disabled={isSpinning || freeSpinsLeft <= 0}
                onClick={handleStartSpin}
                className={`absolute z-10 w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs uppercase shadow-xl flex flex-col items-center justify-center border-2 border-white transition-all active:scale-95 ${
                  isSpinning || freeSpinsLeft <= 0 ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 cursor-pointer animate-pulse'
                }`}
              >
                <span className="text-[11px] leading-tight">SPIN</span>
                <span className="text-[8px] font-bold text-slate-800">NOW</span>
              </button>
            </div>

            {/* WON PRIZE CELEBRATION BOX */}
            {wonPrize && !isSpinning && (
              <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-2 border-amber-400/80 rounded-2xl p-3 animate-in fade-in zoom-in-95 space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">
                  🎉 Congratulations! You Won
                </span>
                <div className="text-xl font-black text-white">
                  {wonPrize.label}
                </div>
                <p className="text-[10px] text-emerald-400 font-bold">
                  {wonPrize.isScratchCard
                    ? '1 Scratch Card added to your collection! Switch to Scratch Cards tab to claim.'
                    : `+₹${wonPrize.amount} credited directly to your ZoroTask balance!`}
                </p>
              </div>
            )}

            {/* INSTRUCTIONS */}
            <p className="text-[10px] text-slate-400">
              💡 Every user gets 2 free spins daily. Win instant real cash and bonus scratch cards.
            </p>
          </div>
        )}

        {/* TAB 2: SCRATCH CARDS */}
        {activeTab === 'scratch' && (
          <div className="p-4 space-y-4">
            {activeScratchCard ? (
              /* ACTIVE CARD SCRATCHING CANVAS */
              <div className="space-y-3 text-center">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-bold">{activeScratchCard.title}</span>
                  <button
                    onClick={() => setActiveScratchCard(null)}
                    className="text-amber-400 hover:underline text-[10px] font-bold"
                  >
                    &larr; Back to Cards
                  </button>
                </div>

                <div className="relative w-[280px] h-[160px] mx-auto rounded-2xl overflow-hidden shadow-xl border-2 border-amber-400/80 bg-gradient-to-tr from-amber-500 via-orange-500 to-purple-600 flex flex-col items-center justify-center text-white">
                  {/* UNDERLYING PRIZE */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3 select-none">
                    <Trophy className="w-9 h-9 text-yellow-300 mb-1" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-200">
                      You Won Cash!
                    </span>
                    <span className="text-3xl font-black text-white font-mono">
                      ₹{activeScratchCard.amount}
                    </span>
                    <span className="text-[9px] text-emerald-300 font-bold mt-1">
                      Credited to Wallet
                    </span>
                  </div>

                  {/* SCRATCHABLE CANVAS OVERLAY */}
                  <canvas
                    ref={canvasRef}
                    onMouseDown={() => (isDrawingRef.current = true)}
                    onMouseUp={() => (isDrawingRef.current = false)}
                    onMouseMove={handleScratchMove}
                    onTouchStart={() => (isDrawingRef.current = true)}
                    onTouchEnd={() => (isDrawingRef.current = false)}
                    onTouchMove={handleScratchMove}
                    className={`absolute inset-0 cursor-pointer touch-none transition-opacity duration-300 ${
                      isCardRevealed ? 'opacity-0 pointer-events-none' : 'opacity-100'
                    }`}
                  />
                </div>

                {isCardRevealed && (
                  <div className="bg-emerald-500/20 border border-emerald-400/50 rounded-2xl p-2.5 text-center text-xs text-emerald-300 font-bold animate-in fade-in">
                    ✓ ₹{activeScratchCard.amount} added to your balance!
                  </div>
                )}
              </div>
            ) : (
              /* CARDS LIST */
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-bold">Your Available Scratch Cards</span>
                  <span className="text-[10px] text-amber-400 font-mono">
                    {scratchCards.filter((c) => !c.isScratched).length} Unscratched
                  </span>
                </div>

                {scratchCards.length === 0 ? (
                  <div className="text-center py-8 space-y-2 bg-white/5 rounded-2xl border border-white/10 p-4">
                    <Gift className="w-10 h-10 text-slate-500 mx-auto" />
                    <h4 className="text-xs font-bold text-white">No Scratch Cards Yet</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Spin the Lucky Wheel or complete daily missions to win bonus Scratch Cards with up to ₹100 cash!
                    </p>
                    <button
                      onClick={() => setActiveTab('wheel')}
                      className="mt-2 px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs"
                    >
                      Spin Wheel Now
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                    {scratchCards.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => {
                          if (!card.isScratched) {
                            setActiveScratchCard(card);
                          }
                        }}
                        className={`rounded-2xl p-3 border text-center transition-all ${
                          card.isScratched
                            ? 'bg-white/5 border-white/10 opacity-60'
                            : 'bg-gradient-to-tr from-purple-900/60 to-indigo-900/60 border-indigo-400/50 hover:border-amber-400 cursor-pointer shadow-md active:scale-95'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center mx-auto mb-1.5">
                          {card.isScratched ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Gift className="w-5 h-5 text-amber-400 animate-bounce" />
                          )}
                        </div>
                        <span className="text-[11px] font-black text-white block truncate">
                          {card.title}
                        </span>
                        <span className="text-[9px] font-bold text-amber-300 mt-1 block">
                          {card.isScratched ? `Claimed ₹${card.amount}` : 'Tap to Scratch ✨'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
