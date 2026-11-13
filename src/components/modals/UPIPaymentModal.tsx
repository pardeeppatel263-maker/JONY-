import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { compressImage } from '../../utils/imageCompressor';
import {
  X,
  Copy,
  Check,
  UploadCloud,
  ArrowRight,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Clock,
  Star,
  ExternalLink,
  Zap,
  RefreshCw,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { PhonePeIcon, GPayIcon, PaytmIcon, BhimIcon, UpiIcon } from '../PaymentIcons';
import { sanitizeUpiPayeeName } from '../../utils/drampay';
import QRCode from 'qrcode';

export const UPIPaymentModal: React.FC = () => {
  const {
    isUPIModalOpen,
    setIsUPIModalOpen,
    pendingUPIAmount,
    pendingUPIBonus,
    pendingDepositType,
    pendingPlanForUPI,
    adminSettings,
    submitUPIPaymentProof,
    initiateDramPayPayment,
    checkDramPayStatus,
    verifyDramPayUtr,
    initiateQoPayment,
    checkQoPayStatus,
    submitUserUtrForDeposit,
    prefetchedQoPaySession,
    clearPrefetchedQoPaySession,
    copyText,
    showToast,
  } = useApp();

  // Mode: 'qopay' | 'drampay' | 'manual'
  const isQoPayActive = Boolean(
    (adminSettings.qopayEnabled === true || adminSettings.paymentGatewayProvider === 'qopay') &&
    (adminSettings.qopayUserToken?.trim() || '1ff0e5b2dd0096245789f08a9df5cc1c')
  );

  const isDrampayActive = Boolean(
    adminSettings.drampayEnabled === true &&
    adminSettings.drampayMerchantId?.trim() &&
    adminSettings.drampaySecretKey?.trim() &&
    adminSettings.drampayMerchantId.trim().toLowerCase() !== 'int32' &&
    adminSettings.paymentGatewayProvider !== 'qopay'
  );

  const canUseManual = adminSettings.manualPaymentEnabled === true;

  const initialMode: 'qopay' | 'drampay' | 'manual' =
    adminSettings.paymentGatewayProvider === 'qopay' && isQoPayActive
      ? 'qopay'
      : isQoPayActive
      ? 'qopay'
      : isDrampayActive
      ? 'drampay'
      : canUseManual
      ? 'manual'
      : 'qopay';

  const [paymentMode, setPaymentMode] = useState<'qopay' | 'drampay' | 'manual'>(initialMode);

  // Auto fallback when admin switches a gateway OFF
  useEffect(() => {
    if (paymentMode === 'drampay' && !isDrampayActive) {
      setPaymentMode(isQoPayActive ? 'qopay' : (canUseManual ? 'manual' : 'qopay'));
    } else if (paymentMode === 'qopay' && !isQoPayActive) {
      setPaymentMode(isDrampayActive ? 'drampay' : (canUseManual ? 'manual' : 'qopay'));
    } else if (paymentMode === 'manual' && !canUseManual) {
      setPaymentMode(isQoPayActive ? 'qopay' : (isDrampayActive ? 'drampay' : 'qopay'));
    }
  }, [isDrampayActive, isQoPayActive, canUseManual, paymentMode]);

  // Manual payment state
  const [step, setStep] = useState<'pay' | 'proof'>('pay');
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(600); // 10 minutes countdown
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // DramPay state
  const [drampayLoading, setDrampayLoading] = useState(false);
  const [drampayOrder, setDrampayOrder] = useState<{
    orderId?: string;
    merchantOrderId?: string;
    payUrl?: string;
    deeplink?: string;
    depositId?: string;
  } | null>(null);
  const [drampayError, setDrampayError] = useState<string | null>(null);
  const [drampayStatus, setDrampayStatus] = useState<string>('0');
  const [isCheckingDrampay, setIsCheckingDrampay] = useState(false);
  const [drampayUtrInput, setDrampayUtrInput] = useState('');
  const [isVerifyingUtr, setIsVerifyingUtr] = useState(false);
  const [drampaySuccess, setDrampaySuccess] = useState(false);

  // QO Pay state (https://qo-pay.com/api)
  const [qopayLoading, setQopayLoading] = useState(false);
  const [qopayOrder, setQopayOrder] = useState<{
    orderId?: string;
    paymentUrl?: string;
    deeplink?: string;
    upiIntent?: string;
    qrCode?: string;
    collectUpi?: string;
    collectName?: string;
    deeplinks?: { upi?: string; gpay?: string; phonepe?: string; paytm?: string; bhim?: string };
    depositId?: string;
  } | null>(null);
  const [qopayError, setQopayError] = useState<string | null>(null);
  const [qopayStatus, setQopayStatus] = useState<string>('0');
  const [isCheckingQopay, setIsCheckingQopay] = useState(false);
  const [qopaySuccess, setQopaySuccess] = useState(false);
  const [qopayUtrInput, setQopayUtrInput] = useState('');
  const [isSubmittingQopayUtr, setIsSubmittingQopayUtr] = useState(false);
  const hasInitializedQoPayForOpenRef = useRef(false);

  // Active admin UPI ID & merchant from backend / settings
  const adminUpiId = adminSettings.adminUpiId || 'zorotask.pay@icici';
  const adminMerchantName = adminSettings.adminMerchantName || 'ZoroTask Pay';

  // Standard UPI URI format with stable note per modal open
  const safeTransactionNote = React.useMemo(() => `Ref${Date.now().toString().slice(-6)}`, [isUPIModalOpen]);
  const upiIntentUri = React.useMemo(() => {
    return `upi://pay?pa=${encodeURIComponent(adminUpiId)}&pn=${encodeURIComponent(
      adminMerchantName
    )}&am=${encodeURIComponent(pendingUPIAmount)}&cu=INR&tn=${encodeURIComponent(
      safeTransactionNote
    )}`;
  }, [adminUpiId, adminMerchantName, pendingUPIAmount, safeTransactionNote]);

  // Dynamic QR Code: use QO Pay / DramPay deeplink/payUrl if in Gateway mode, else admin QR
  const rawQrCodeData = React.useMemo(() => {
    return paymentMode === 'qopay' && qopayOrder
      ? qopayOrder.qrCode || qopayOrder.upiIntent || qopayOrder.deeplink || qopayOrder.paymentUrl || upiIntentUri
      : paymentMode === 'drampay' && drampayOrder
      ? drampayOrder.deeplink || drampayOrder.payUrl || upiIntentUri
      : adminSettings.adminQrCodeUrl && adminSettings.adminQrCodeUrl.trim() !== ''
      ? adminSettings.adminQrCodeUrl.trim()
      : upiIntentUri;
  }, [paymentMode, qopayOrder, drampayOrder, adminSettings.adminQrCodeUrl, upiIntentUri]);

  const qrCodeData = React.useMemo(() => {
    return sanitizeUpiPayeeName(
      rawQrCodeData,
      paymentMode === 'qopay' && qopayOrder?.collectName ? qopayOrder.collectName : adminMerchantName || 'ZoroTask'
    );
  }, [rawQrCodeData, paymentMode, qopayOrder?.collectName, adminMerchantName]);

  const isDirectImage = React.useMemo(() => {
    return (
      qrCodeData.startsWith('data:image/') ||
      (/\.(png|jpe?g|webp|gif|svg)($|\?)/i.test(qrCodeData) && !qrCodeData.includes('create-qr-code'))
    );
  }, [qrCodeData]);

  const [generatedQrDataUrl, setGeneratedQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!qrCodeData || !isUPIModalOpen) return;
    if (isDirectImage) {
      setGeneratedQrDataUrl(qrCodeData);
      return;
    }
    // Generate QR locally using QRCode library - instant, offline-capable, high resolution
    QRCode.toDataURL(qrCodeData, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 280,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setGeneratedQrDataUrl(url))
      .catch((err) => {
        console.warn('Local QRCode generator error, falling back to server QR:', err);
        setGeneratedQrDataUrl(
          `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
            qrCodeData
          )}&margin=1`
        );
      });
  }, [qrCodeData, isDirectImage, isUPIModalOpen]);

  const activeQrCodeSrc =
    generatedQrDataUrl ||
    (isDirectImage
      ? qrCodeData
      : `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
          qrCodeData
        )}&margin=1`);

  // Initialize or reset when modal opens
  useEffect(() => {
    if (!isUPIModalOpen) {
      hasInitializedQoPayForOpenRef.current = false;
      setStep('pay');
      setUtrNumber('');
      setScreenshotData(null);
      setScreenshotName(null);
      setIsSubmitting(false);
      setQopayOrder(null);
      setQopayError(null);
      setQopayStatus('0');
      setQopaySuccess(false);
      setQopayUtrInput('');
      setIsSubmittingQopayUtr(false);
      setDrampayOrder(null);
      setDrampayError(null);
      setDrampayStatus('0');
      setDrampaySuccess(false);
      return;
    }

    setSecondsLeft(600);
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    if (paymentMode === 'qopay') {
      const freshPrefetch =
        prefetchedQoPaySession &&
        Date.now() - prefetchedQoPaySession.timestamp < 25000 &&
        prefetchedQoPaySession.amount === pendingUPIAmount;

      if (freshPrefetch && prefetchedQoPaySession) {
        hasInitializedQoPayForOpenRef.current = true;
        if (prefetchedQoPaySession.success && prefetchedQoPaySession.order) {
          const ord = prefetchedQoPaySession.order;
          setQopayOrder({
            orderId: ord.orderId,
            paymentUrl: ord.paymentUrl,
            deeplink: ord.deeplink,
            upiIntent: ord.upiIntent,
            qrCode: ord.qrCode,
            collectUpi: ord.collectUpi,
            collectName: ord.collectName,
            deeplinks: ord.deeplinks,
            depositId: ord.depositId,
          });
          setQopayError(null);
        } else {
          // Gateway was in cooldown/timeout — do NOT spam create-order again; show Instant Dynamic QR cleanly
          setQopayOrder(null);
          setQopayError(prefetchedQoPaySession.message || 'Instant Dynamic UPI QR ready for fast payment.');
        }
        clearPrefetchedQoPaySession();
      } else if (!hasInitializedQoPayForOpenRef.current) {
        hasInitializedQoPayForOpenRef.current = true;
        createQoPaySession();
      }
    } else if (paymentMode === 'drampay') {
      createDramPaySession();
    }

    return () => clearInterval(interval);
  }, [isUPIModalOpen, paymentMode]);

  // Create QO Pay order on demand
  const createQoPaySession = async () => {
    setQopayLoading(true);
    setQopayError(null);
    try {
      const res = await initiateQoPayment(
        pendingUPIAmount,
        pendingUPIBonus,
        pendingDepositType || 'add_money',
        pendingPlanForUPI || undefined
      );
      if (res.success) {
        setQopayOrder({
          orderId: res.orderId,
          paymentUrl: res.paymentUrl,
          deeplink: res.deeplink,
          upiIntent: res.upiIntent,
          qrCode: res.qrCode,
          collectUpi: res.collectUpi,
          collectName: res.collectName,
          deeplinks: res.deeplinks,
          depositId: res.depositId,
        });
      } else {
        if (res.message && !res.message.toLowerCase().includes('empty')) {
          setQopayError(res.message);
        } else {
          setQopayError('Instant Dynamic UPI QR ready for fast payment.');
        }
      }
    } catch {
      setQopayError('Instant Dynamic UPI QR ready for fast payment.');
    } finally {
      setQopayLoading(false);
    }
  };

  // Auto-polling QO Pay status every 3.5 seconds while order is pending
  useEffect(() => {
    if (!isUPIModalOpen || paymentMode !== 'qopay' || !qopayOrder?.orderId || qopaySuccess) {
      return;
    }

    const pollInterval = setInterval(async () => {
      if (!qopayOrder.depositId || !qopayOrder.orderId) return;
      try {
        const check = await checkQoPayStatus(qopayOrder.depositId, qopayOrder.orderId);
        if (check.isPaid) {
          setQopaySuccess(true);
          showToast('🎉 Payment Confirmed via QO Pay Gateway! Balance Credited.');
          setTimeout(() => {
            setIsUPIModalOpen(false);
          }, 1800);
        }
      } catch (err) {
        console.warn('QO Pay auto-polling error:', err);
      }
    }, 3500);

    return () => clearInterval(pollInterval);
  }, [isUPIModalOpen, paymentMode, qopayOrder, qopaySuccess]);

  const handleManualQoPayCheck = async () => {
    if (!qopayOrder?.depositId || !qopayOrder.orderId) return;
    setIsCheckingQopay(true);
    try {
      const check = await checkQoPayStatus(qopayOrder.depositId, qopayOrder.orderId);
      if (check.isPaid) {
        setQopaySuccess(true);
        showToast('✓ Payment confirmed by QO Pay! Credited to your wallet.');
        setTimeout(() => setIsUPIModalOpen(false), 1500);
      } else {
        showToast(`QO Pay Status: ${check.message || 'Waiting for payment confirmation'}`);
      }
    } catch (err: any) {
      showToast(`Status check error: ${err.message}`);
    } finally {
      setIsCheckingQopay(false);
    }
  };

  const persistPendingQoPayReturnState = () => {
    try {
      localStorage.setItem('taskvibe_auth', 'true');
      localStorage.setItem(
        'taskvibe_screen',
        pendingDepositType === 'plan_purchase' ? 'plan_detail' : 'add_money'
      );
      if (pendingPlanForUPI) {
        localStorage.setItem('taskvibe_pending_plan', JSON.stringify(pendingPlanForUPI));
      }
      if (qopayOrder?.orderId) {
        localStorage.setItem(
          'taskvibe_pending_qopay_order',
          JSON.stringify({
            orderId: qopayOrder.orderId,
            depositId: qopayOrder.depositId,
            amount: pendingUPIAmount,
            bonus: pendingUPIBonus,
            depositType: pendingDepositType || 'add_money',
            planId: pendingPlanForUPI?.id,
            planLevel: pendingPlanForUPI?.level,
            planTitle: pendingPlanForUPI?.title,
            timestamp: Date.now(),
          })
        );
      }
    } catch {}
  };

  const handleQoPayInlineUtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = qopayUtrInput.replace(/\s+/g, '').trim();
    if (!cleanUtr || cleanUtr.length < 8) {
      showToast('❌ Please enter a valid 12-digit UTR number');
      return;
    }
    setIsSubmittingQopayUtr(true);
    try {
      if (qopayOrder?.orderId || qopayOrder?.depositId) {
        const orderOrDepId = qopayOrder.orderId || qopayOrder.depositId || '';
        const found = await submitUserUtrForDeposit(orderOrDepId, cleanUtr);
        if (found) {
          setIsUPIModalOpen(false);
          return;
        }
      }
      setIsUPIModalOpen(false);
      await submitUPIPaymentProof(cleanUtr);
    } finally {
      setIsSubmittingQopayUtr(false);
    }
  };

  const handleLaunchQoPayUPI = (targetDeeplink?: string) => {
    try {
      persistPendingQoPayReturnState();

      const rawTargetUri =
        targetDeeplink ||
        qopayOrder?.upiIntent ||
        qopayOrder?.deeplink ||
        qopayOrder?.paymentUrl ||
        upiIntentUri;
      const targetUri = sanitizeUpiPayeeName(rawTargetUri, adminMerchantName || 'ZoroTask');

      if (
        targetUri.startsWith('upi://') ||
        targetUri.startsWith('phonepe://') ||
        targetUri.startsWith('paytmmp://') ||
        targetUri.startsWith('tez://')
      ) {
        window.location.href = targetUri;
      } else if (targetUri.startsWith('http://') || targetUri.startsWith('https://')) {
        let inIframe = false;
        try {
          inIframe = window.self !== window.top;
        } catch {
          inIframe = true;
        }
        if (inIframe) {
          const a = document.createElement('a');
          a.href = targetUri;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          window.location.href = targetUri;
        }
      } else {
        window.location.href = targetUri;
      }
    } catch {
      if (qopayOrder?.paymentUrl) {
        window.location.href = qopayOrder.paymentUrl;
      }
    }
  };

  // Create DramPay order on demand
  const createDramPaySession = async () => {
    if (
      !adminSettings.drampayMerchantId?.trim() ||
      !adminSettings.drampaySecretKey?.trim() ||
      adminSettings.drampayMerchantId.trim().toLowerCase() === 'int32'
    ) {
      setDrampayError(
        'DramPay Gateway credentials not configured in Admin Panel. Please click "Use Manual QR Mode" below to pay instantly via UPI QR & UTR, or enter valid DramPay credentials in Admin Panel settings.'
      );
      setDrampayLoading(false);
      return;
    }

    setDrampayLoading(true);
    setDrampayError(null);
    try {
      const res = await initiateDramPayPayment(
        pendingUPIAmount,
        pendingUPIBonus,
        pendingDepositType || 'add_money',
        pendingPlanForUPI || undefined
      );
      if (res.success) {
        setDrampayOrder({
          orderId: res.orderId,
          merchantOrderId: res.merchantOrderId,
          payUrl: res.payUrl,
          deeplink: res.deeplink,
          depositId: res.depositId,
        });
      } else {
        setDrampayError(res.message || 'Could not connect to DramPay Gateway');
      }
    } catch (err: any) {
      setDrampayError(err.message || 'DramPay connection error');
    } finally {
      setDrampayLoading(false);
    }
  };

  // Auto-polling DramPay status every 3 seconds while order is pending
  useEffect(() => {
    if (!isUPIModalOpen || paymentMode !== 'drampay' || !drampayOrder?.merchantOrderId || drampaySuccess) {
      return;
    }

    const pollInterval = setInterval(async () => {
      if (!drampayOrder.depositId || !drampayOrder.merchantOrderId) return;
      try {
        const check = await checkDramPayStatus(drampayOrder.depositId, drampayOrder.merchantOrderId);
        if (check.isPaid) {
          setDrampaySuccess(true);
          showToast('🎉 Payment Confirmed via DramPay Gateway! Balance Credited.');
          setTimeout(() => {
            setIsUPIModalOpen(false);
          }, 1800);
        }
      } catch (err) {
        console.warn('DramPay auto-polling error:', err);
      }
    }, 3500);

    return () => clearInterval(pollInterval);
  }, [isUPIModalOpen, paymentMode, drampayOrder, drampaySuccess]);

  // Auto-switch to proof step or check payment status when returning from UPI app
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isUPIModalOpen) {
        if (paymentMode === 'manual') {
          setStep('proof');
        } else if (paymentMode === 'qopay' && qopayOrder?.orderId && qopayOrder.depositId) {
          handleManualQoPayCheck();
        } else if (drampayOrder?.merchantOrderId && drampayOrder.depositId) {
          handleManualDramPayCheck();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isUPIModalOpen, paymentMode, qopayOrder, drampayOrder]);

  if (!isUPIModalOpen) return null;

  const handleManualDramPayCheck = async () => {
    if (!drampayOrder?.depositId || !drampayOrder.merchantOrderId) return;
    setIsCheckingDrampay(true);
    try {
      const check = await checkDramPayStatus(drampayOrder.depositId, drampayOrder.merchantOrderId);
      if (check.isPaid) {
        setDrampaySuccess(true);
        showToast('✓ Payment confirmed by DramPay! Credited to your wallet.');
        setTimeout(() => setIsUPIModalOpen(false), 1500);
      } else {
        showToast(`Status: ${check.message || 'Waiting for payment confirmation'}`);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsCheckingDrampay(false);
    }
  };

  const handleVerifyUtrWithDrampay = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = drampayUtrInput.trim();
    if (!cleanUtr || cleanUtr.length < 8) {
      showToast('❌ Please enter a valid 12-digit UTR number');
      return;
    }
    if (!drampayOrder?.depositId || !drampayOrder.merchantOrderId) {
      showToast('❌ No active DramPay order found');
      return;
    }

    setIsVerifyingUtr(true);
    try {
      const res = await verifyDramPayUtr(drampayOrder.depositId, drampayOrder.merchantOrderId, cleanUtr);
      if (res.success) {
        setDrampaySuccess(true);
        setTimeout(() => setIsUPIModalOpen(false), 1500);
      } else {
        showToast(`DramPay: ${res.message}`);
      }
    } catch (err: any) {
      showToast(`Verification failed: ${err.message}`);
    } finally {
      setIsVerifyingUtr(false);
    }
  };

  const handleLaunchDramPayUPI = (_appName?: string) => {
    try {
      localStorage.setItem('taskvibe_auth', 'true');
      localStorage.setItem(
        'taskvibe_screen',
        pendingDepositType === 'plan_purchase' ? 'plan_detail' : 'add_money'
      );
      if (pendingPlanForUPI) {
        localStorage.setItem('taskvibe_pending_plan', JSON.stringify(pendingPlanForUPI));
      }

      const rawTargetUri = drampayOrder?.deeplink || drampayOrder?.payUrl || upiIntentUri;
      const targetUri = sanitizeUpiPayeeName(rawTargetUri, adminMerchantName || 'ZoroTask');
      window.location.href = targetUri;
    } catch {
      if (drampayOrder?.payUrl) {
        const a = document.createElement('a');
        a.href = drampayOrder.payUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    }
  };

  const handleLaunchManualUPIApp = () => {
    try {
      localStorage.setItem('taskvibe_auth', 'true');
      localStorage.setItem(
        'taskvibe_screen',
        pendingDepositType === 'plan_purchase' ? 'plan_detail' : 'add_money'
      );
      if (pendingPlanForUPI) {
        localStorage.setItem('taskvibe_pending_plan', JSON.stringify(pendingPlanForUPI));
      }
      setStep('proof');
      window.location.href = upiIntentUri;
    } catch {
      showToast('Scan the QR code or copy UPI ID above to complete payment.');
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCopyUpi = () => {
    copyText(adminUpiId, 'Admin UPI ID');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('❌ Please upload an image file (JPG, PNG) only');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('❌ Screenshot size must be less than 10MB');
      return;
    }

    setScreenshotName(file.name);
    try {
      showToast('Processing screenshot...');
      const compressed = await compressImage(file, 800, 800, 0.72);
      setScreenshotData(compressed);
      showToast('✓ Payment screenshot selected');
    } catch (err) {
      console.warn('Image compression fallback:', err);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setScreenshotData(reader.result);
          showToast('✓ Payment screenshot selected');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utrNumber.trim();
    if (!cleanUtr) {
      showToast('❌ Please enter the 12-digit UPI Ref / UTR number');
      return;
    }

    if (cleanUtr.length < 8) {
      showToast('❌ Please enter a valid UPI Ref / UTR number (at least 8-12 digits)');
      return;
    }

    setIsUPIModalOpen(false);
    submitUPIPaymentProof(cleanUtr, screenshotData || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100 my-auto">
        {/* UPI Gateway Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-950 text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-white px-2 py-0.5 rounded-md text-[11px] font-black text-slate-900 tracking-wider shadow-xs flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600" />
              <span>{paymentMode === 'qopay' ? 'QO Pay' : paymentMode === 'drampay' ? 'DramPay' : 'Fast UPI'}</span>
            </div>
            <div>
              <h3 className="text-xs font-bold leading-tight">
                {pendingDepositType === 'plan_purchase'
                  ? `Buy VIP Level ${pendingPlanForUPI?.level} (${pendingPlanForUPI?.levelTag})`
                  : 'Fast UPI Payment Gateway'}
              </h3>
              <p className="text-[10px] text-indigo-100 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-300" />
                <span>Automated 24x7 Settlement • 256-Bit</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsUPIModalOpen(false)}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="Close UPI Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PAYMENT METHOD SELECTOR TABS - Always allow users to choose automated or Dynamic QR */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold p-1 gap-1">
          {/* QO Pay Tab */}
          {isQoPayActive && (
            <button
              type="button"
              onClick={() => setPaymentMode('qopay')}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                paymentMode === 'qopay'
                  ? 'bg-white text-indigo-950 shadow-xs border border-indigo-300 ring-1 ring-indigo-400 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
              <span>⚡ QO Pay</span>
              <span className="text-[9px] bg-indigo-100 text-indigo-800 font-black px-1.5 py-0.2 rounded">LIVE</span>
            </button>
          )}

          {/* DramPay Tab */}
          {isDrampayActive && (
            <button
              type="button"
              onClick={() => setPaymentMode('drampay')}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                paymentMode === 'drampay'
                  ? 'bg-white text-amber-950 shadow-xs border border-amber-300 ring-1 ring-amber-400 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>⚡ DramPay</span>
              <span className="text-[9px] bg-amber-100 text-amber-800 font-black px-1.5 py-0.2 rounded">LIVE</span>
            </button>
          )}

          {/* Dynamic UPI QR Tab - ALWAYS accessible so members can scan & pay */}
          <button
            type="button"
            onClick={() => setPaymentMode('manual')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              paymentMode === 'manual'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-extrabold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <UpiIcon size={16} />
            <span>📱 Dynamic QR &amp; UTR</span>
          </button>
        </div>

        {/* Offline Gateways Notice when both DramPay and QO Pay are OFF */}
        {!isDrampayActive && !isQoPayActive && (
          <div className="bg-amber-50 border-b border-amber-200 px-3.5 py-2 flex items-center gap-2 text-[11px] text-amber-900 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>Automated gateways currently OFF. Please pay using the Admin UPI QR Code below and submit your 12-digit UTR.</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 0: QOPAY INSTANT AUTOMATED GATEWAY */}
        {/* ======================================================== */}
        {paymentMode === 'qopay' && (
          <div className="p-4 space-y-3.5 text-center">
            {/* Amount Banner */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200/80 rounded-2xl p-3 space-y-1">
              <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">
                Total Amount To Pay
              </span>
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                ₹{pendingUPIAmount.toLocaleString('en-IN')}
              </div>
              {pendingDepositType === 'plan_purchase' && pendingPlanForUPI ? (
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-white/90 px-2.5 py-0.5 rounded-full border border-indigo-200 shadow-xs">
                  <Star className="w-3 h-3 text-indigo-600" />
                  <span>VIP Plan: Level {pendingPlanForUPI.level} ({pendingPlanForUPI.levelTag})</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-white/90 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-xs">
                  <Star className="w-3 h-3 text-emerald-600" />
                  <span>Includes +₹{pendingUPIBonus} Extra Bonus Credit</span>
                </div>
              )}
            </div>

            {/* QOPAY ORDER INITIALIZATION / LOADING */}
            {qopayLoading && (
              <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <span className="text-xs font-bold text-slate-800">
                  Connecting to QO Pay Gateway (https://qo-pay.com)...
                </span>
                <span className="text-[10px] text-slate-400">
                  Generating dynamic UPI session &amp; QR code
                </span>
              </div>
            )}

            {/* SUCCESS BANNER WHEN PAYMENT CONFIRMS */}
            {qopaySuccess && (
              <div className="p-6 bg-emerald-50 rounded-2xl border-2 border-emerald-400 flex flex-col items-center justify-center space-y-2 animate-in zoom-in-95">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                <h4 className="text-base font-black text-emerald-950">Payment Confirmed!</h4>
                <p className="text-xs text-emerald-800">
                  ₹{pendingUPIAmount} has been credited to your wallet in real time.
                </p>
              </div>
            )}

            {/* FRIENDLY NOTICE WHEN QOPAY CHANNEL IS BUSY OR IN STANDBY */}
            {qopayError && !qopayLoading && !qopayOrder && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-left space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Instant UPI QR Ready</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-snug">
                  {typeof qopayError === 'string' &&
                  (qopayError.toLowerCase().includes('success rate') ||
                    qopayError.toLowerCase().includes('channel inactive') ||
                    qopayError.toLowerCase().includes('timed out'))
                    ? `Scan the Dynamic UPI QR Code below (or tap 1-Click Pay) to pay ₹${pendingUPIAmount.toLocaleString(
                        'en-IN'
                      )}, then enter your 12-digit UTR below for fast verification!`
                    : qopayError}
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMode('manual');
                      setStep('proof');
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <UpiIcon size={14} /> Enter UTR / Screenshot
                  </button>
                  <button
                    type="button"
                    onClick={createQoPaySession}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry Live Gateway
                  </button>
                </div>
              </div>
            )}

            {/* QOPAY ORDER OR DYNAMIC UPI QR CODE READY */}
            {!qopayLoading && !qopaySuccess && (
              <div className="space-y-3">
                {/* QR Code Container */}
                <div className="bg-white border-2 border-dashed border-indigo-300 rounded-2xl p-3 flex flex-col items-center justify-center space-y-2 relative shadow-xs">
                  <div className="w-48 h-48 bg-white p-2 rounded-xl border border-slate-200 shadow-inner flex flex-col items-center justify-center relative">
                    <img
                      src={activeQrCodeSrc}
                      alt="QO Pay Dynamic UPI QR Code"
                      className="w-44 h-44 object-contain rounded"
                      loading="eager"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-900 bg-indigo-100/80 px-2.5 py-0.5 rounded-full border border-indigo-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>
                      {qopayOrder
                        ? 'Live QO Pay Auto-Verification Active'
                        : 'Instant Dynamic UPI QR Code • Any UPI App'}
                    </span>
                  </div>
                </div>

                {/* Live Payee UPI Information */}
                <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-2.5 flex items-center justify-between text-left">
                  <div className="min-w-0 pr-2">
                    <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-wider block">
                      Payee: {qopayOrder?.collectName || adminMerchantName || 'ZoroTask Pay'}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900 truncate block">
                      {qopayOrder?.collectUpi || adminUpiId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      copyText(qopayOrder?.collectUpi || adminUpiId);
                      showToast('✓ Payee UPI ID copied to clipboard!');
                    }}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-xs active:scale-95 transition"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy UPI</span>
                  </button>
                </div>

                {/* 1-Click Pay Buttons */}
                <div className="space-y-1.5 pt-1">
                  {qopayOrder?.paymentUrl && (
                    <a
                      href={qopayOrder.paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => persistPendingQoPayReturnState()}
                      className="w-full py-3 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-300 font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-xs active:scale-98"
                    >
                      <ExternalLink className="w-4 h-4 text-indigo-600" />
                      <span>Open QO Pay Payment Page</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => handleLaunchQoPayUPI()}
                    className="w-full py-3 px-3 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2.5 shadow-md shadow-indigo-500/25 active:scale-98 transition cursor-pointer"
                  >
                    <div className="flex items-center -space-x-1.5">
                      <PhonePeIcon size={20} className="rounded-full shadow-xs border border-white" />
                      <GPayIcon size={20} className="rounded-full shadow-xs border border-white" />
                      <PaytmIcon size={20} className="rounded-full shadow-xs border border-white" />
                      <BhimIcon size={20} className="rounded-full shadow-xs border border-white" />
                    </div>
                    <span>1-Click Pay (PhonePe / GPay / Paytm / UPI)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-white shrink-0" />
                  </button>

                  {/* Individual UPI App Shortcuts if available */}
                  {qopayOrder?.deeplinks && (
                    <div className="grid grid-cols-4 gap-1.5">
                      {qopayOrder.deeplinks.phonepe && (
                        <button
                          type="button"
                          onClick={() => handleLaunchQoPayUPI(qopayOrder.deeplinks?.phonepe)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex flex-col items-center gap-1 text-[10px] font-bold text-slate-700 cursor-pointer"
                        >
                          <PhonePeIcon size={20} />
                          <span>PhonePe</span>
                        </button>
                      )}
                      {qopayOrder.deeplinks.gpay && (
                        <button
                          type="button"
                          onClick={() => handleLaunchQoPayUPI(qopayOrder.deeplinks?.gpay)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex flex-col items-center gap-1 text-[10px] font-bold text-slate-700 cursor-pointer"
                        >
                          <GPayIcon size={20} />
                          <span>GPay</span>
                        </button>
                      )}
                      {qopayOrder.deeplinks.paytm && (
                        <button
                          type="button"
                          onClick={() => handleLaunchQoPayUPI(qopayOrder.deeplinks?.paytm)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex flex-col items-center gap-1 text-[10px] font-bold text-slate-700 cursor-pointer"
                        >
                          <PaytmIcon size={20} />
                          <span>Paytm</span>
                        </button>
                      )}
                      {qopayOrder.deeplinks.bhim && (
                        <button
                          type="button"
                          onClick={() => handleLaunchQoPayUPI(qopayOrder.deeplinks?.bhim)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex flex-col items-center gap-1 text-[10px] font-bold text-slate-700 cursor-pointer"
                        >
                          <BhimIcon size={20} />
                          <span>BHIM</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Inline 12-Digit UTR Submission Box (Always works even if QO Pay cashier is slow/busy) */}
                  <form
                    onSubmit={handleQoPayInlineUtrSubmit}
                    className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-2.5 text-left space-y-1.5"
                  >
                    <span className="text-[10px] font-bold text-indigo-950 uppercase tracking-wider block">
                      Paid via QR or UPI? Enter 12-Digit UTR to Verify:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={qopayUtrInput}
                        onChange={(e) => setQopayUtrInput(e.target.value)}
                        placeholder="e.g. 427819283749"
                        className="flex-1 px-2.5 py-2 bg-white border border-indigo-300 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none focus:border-indigo-600"
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingQopayUtr || qopayUtrInput.trim().length < 8}
                        className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {isSubmittingQopayUtr ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>Submit UTR</span>
                      </button>
                    </div>
                  </form>

                  {/* Switch to Screenshot + UTR submission */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMode('manual');
                      setStep('proof');
                    }}
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Also Upload Payment Screenshot</span>
                  </button>
                </div>

                {/* Status Radar & Manual Check when active order exists */}
                {qopayOrder && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-left">
                    <div className="min-w-0 pr-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        Order ID: {qopayOrder.orderId}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <span>Auto-checking status every 3.5s...</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleManualQoPayCheck}
                      disabled={isCheckingQopay}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {isCheckingQopay ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      <span>Check Status</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 1: DRAMPAY INSTANT AUTOMATED GATEWAY */}
        {/* ======================================================== */}
        {paymentMode === 'drampay' && (
          <div className="p-4 space-y-3.5 text-center">
            {/* Amount Banner */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-3 space-y-1">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                Total Amount To Pay
              </span>
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                ₹{pendingUPIAmount.toLocaleString('en-IN')}
              </div>
              {pendingDepositType === 'plan_purchase' && pendingPlanForUPI ? (
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-white/80 px-2.5 py-0.5 rounded-full border border-indigo-200 shadow-xs">
                  <Star className="w-3 h-3 text-indigo-600" />
                  <span>VIP Plan: Level {pendingPlanForUPI.level} ({pendingPlanForUPI.levelTag})</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-white/80 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-xs">
                  <Star className="w-3 h-3 text-emerald-600" />
                  <span>Includes +₹{pendingUPIBonus} Extra Bonus Credit</span>
                </div>
              )}
            </div>

            {/* DRAMPAY ORDER INITIALIZATION / LOADING */}
            {drampayLoading && (
              <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
                <span className="text-xs font-bold text-slate-800">
                  Connecting to DramPay Payment Gateway...
                </span>
                <span className="text-[10px] text-slate-400">
                  Generating secure UPI session &amp; deeplink
                </span>
              </div>
            )}

            {/* SUCCESS BANNER WHEN PAYMENT CONFIRMS */}
            {drampaySuccess && (
              <div className="p-6 bg-emerald-50 rounded-2xl border-2 border-emerald-400 flex flex-col items-center justify-center space-y-2 animate-in zoom-in-95">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                <h4 className="text-base font-black text-emerald-950">Payment Confirmed!</h4>
                <p className="text-xs text-emerald-800">
                  ₹{pendingUPIAmount} has been credited to your wallet in real time.
                </p>
              </div>
            )}

            {/* ERROR OR UNCONFIGURED NOTICE */}
            {drampayError && !drampayLoading && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-left space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>DramPay Gateway Notice</span>
                </div>
                <p className="text-[11px] text-rose-800 leading-snug">
                  {typeof drampayError === 'string' && (drampayError.startsWith('<') || drampayError.includes('<html'))
                    ? 'Payment server offline or connecting to gateway. Please retry or click "Use Manual QR Mode".'
                    : drampayError}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={createDramPaySession}
                    className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry
                  </button>
                  {canUseManual && (
                    <button
                      type="button"
                      onClick={() => setPaymentMode('manual')}
                      className="px-3 py-1 bg-slate-800 text-white rounded-lg text-xs font-bold"
                    >
                      Use Manual QR Mode
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* DRAMPAY ORDER READY */}
            {drampayOrder && !drampayLoading && !drampaySuccess && (
              <div className="space-y-3">
                {/* QR Code Container */}
                <div className="bg-white border-2 border-dashed border-amber-300 rounded-2xl p-3 flex flex-col items-center justify-center space-y-2 relative shadow-xs">
                  <div className="w-44 h-44 bg-white p-2 rounded-xl border border-slate-200 shadow-inner flex flex-col items-center justify-center relative">
                    <img
                      src={activeQrCodeSrc}
                      alt="DramPay UPI QR Code"
                      className="w-40 h-40 object-contain rounded"
                      loading="eager"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-900 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Live DramPay Auto-Verification Active</span>
                  </div>
                </div>

                {/* 1-Click Pay Buttons */}
                <div className="space-y-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleLaunchDramPayUPI()}
                    className="w-full py-3 px-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2.5 shadow-md shadow-amber-500/25 active:scale-98 transition cursor-pointer"
                  >
                    <div className="flex items-center -space-x-1.5">
                      <PhonePeIcon size={20} className="rounded-full shadow-xs border border-white" />
                      <GPayIcon size={20} className="rounded-full shadow-xs border border-white" />
                      <PaytmIcon size={20} className="rounded-full shadow-xs border border-white" />
                      <BhimIcon size={20} className="rounded-full shadow-xs border border-white" />
                    </div>
                    <span>1-Click Pay (PhonePe / GPay / Paytm / UPI)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                  </button>

                  {drampayOrder.payUrl && (
                    <a
                      href={drampayOrder.payUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-200 transition"
                    >
                      <span>Open DramPay Web Cashier Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Status Radar & Manual Check */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-left">
                  <div className="min-w-0 pr-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      Order ID: {drampayOrder.merchantOrderId}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Checking payment status every 3s...</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleManualDramPayCheck}
                    disabled={isCheckingDrampay}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {isCheckingDrampay ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    <span>Check Status</span>
                  </button>
                </div>

                {/* Instant UTR Claim Box */}
                <form onSubmit={handleVerifyUtrWithDrampay} className="bg-amber-50/70 border border-amber-200 rounded-xl p-2.5 text-left space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                      Paid already? Enter UTR for instant verification:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={drampayUtrInput}
                      onChange={(e) => setDrampayUtrInput(e.target.value)}
                      placeholder="12-digit UTR from UPI receipt"
                      className="flex-1 px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      disabled={isVerifyingUtr || !drampayUtrInput.trim()}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isVerifyingUtr ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                      <span>Verify</span>
                    </button>
                  </div>
                  <span className="text-[9px] text-amber-800 block">
                    Direct DramPay UTR check &amp; auto-assignment (/api/payin/utr/check).
                  </span>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 2: MANUAL UPI QR & SCREENSHOT PROOF */}
        {/* ======================================================== */}
        {paymentMode === 'manual' && step === 'pay' && (
          <div className="p-4 space-y-3.5 text-center">
            {/* Amount Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Amount To Pay
              </span>
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                ₹{pendingUPIAmount.toLocaleString('en-IN')}
              </div>
              {pendingDepositType === 'plan_purchase' && pendingPlanForUPI ? (
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  <Star className="w-3 h-3" />
                  <span>VIP Plan: Level {pendingPlanForUPI.level} ({pendingPlanForUPI.levelTag})</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <Star className="w-3 h-3" />
                  <span>Includes +₹{pendingUPIBonus} Bonus Credit</span>
                </div>
              )}
            </div>

            {/* AUTOMATIC QR CODE GENERATED FROM BACKEND UPI ID */}
            <div className="bg-white border-2 border-dashed border-indigo-200 rounded-2xl p-3 flex flex-col items-center justify-center space-y-2 relative shadow-xs">
              <div className="w-44 h-44 bg-white p-2 rounded-xl border border-slate-200 shadow-inner flex flex-col items-center justify-center relative">
                <img
                  src={activeQrCodeSrc}
                  alt={`UPI QR Code for ${adminUpiId}`}
                  className="w-40 h-40 object-contain rounded"
                  loading="eager"
                />
              </div>

              {/* Verified Badge */}
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Auto QR • Scan with Any UPI App</span>
              </div>
            </div>

            {/* BACKEND ADMIN UPI ID WITH 1-CLICK COPY */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-left">
              <div className="min-w-0 pr-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  Admin Official UPI ID
                </span>
                <span className="text-xs font-mono font-bold text-slate-900 truncate block">
                  {adminUpiId}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyUpi}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                  copiedUpi
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                }`}
              >
                {copiedUpi ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy UPI</span>
                  </>
                )}
              </button>
            </div>

            {/* Action Buttons: Direct UPI open OR Next to upload Screenshot */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleLaunchManualUPIApp}
                className="w-full py-3 px-3 bg-gradient-to-r from-purple-50 via-blue-50 to-emerald-50 hover:from-purple-100 hover:to-emerald-100 text-slate-900 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2.5 border border-purple-200 active:scale-98 transition-all cursor-pointer shadow-xs"
              >
                <div className="flex items-center -space-x-1.5">
                  <PhonePeIcon size={20} className="rounded-full shadow-xs border border-white" />
                  <GPayIcon size={20} className="rounded-full shadow-xs border border-white" />
                  <PaytmIcon size={20} className="rounded-full shadow-xs border border-white" />
                  <BhimIcon size={20} className="rounded-full shadow-xs border border-white" />
                </div>
                <span>Pay via PhonePe / GPay / Paytm</span>
                <ExternalLink className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setStep('proof')}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
              >
                <span>Payment Done? Upload Screenshot &amp; UTR</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SUBMIT PAYMENT SCREENSHOT & UTR NUMBER (MANUAL MODE) */}
        {paymentMode === 'manual' && step === 'proof' && (
          <form onSubmit={handleSubmitProof} className="p-4 space-y-3.5">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-start gap-2 text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-tight">
                <p className="font-bold">Submit payment screenshot after completing payment:</p>
                <p className="text-[10px] text-amber-700 mt-0.5">
                  The transaction remains <b>In-Process</b> until approved by Admin.
                </p>
              </div>
            </div>

            {/* Amount details */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-600 font-semibold">Submitted Amount</span>
              <span className="font-black text-slate-900 text-sm">
                ₹{pendingUPIAmount.toLocaleString('en-IN')}
              </span>
            </div>

            {/* UTR / UPI Ref ID Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide flex items-center justify-between">
                <span>12-Digit UTR / UPI Ref Number *</span>
                <span className="text-[9px] text-blue-600 lowercase font-medium">required</span>
              </label>
              <input
                type="text"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="e.g. 427819283749"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold outline-none focus:border-blue-600 focus:bg-white"
                required
              />
              <span className="text-[9px] text-slate-400 block">
                Found on your PhonePe/GPay/Paytm successful receipt (12 digits).
              </span>
            </div>

            {/* SCREENSHOT UPLOAD BOX */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide block">
                Payment Screenshot (Optional)
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {screenshotData ? (
                <div className="relative border-2 border-emerald-500 rounded-2xl p-2 bg-emerald-50/50 flex items-center gap-3">
                  <img
                    src={screenshotData}
                    alt="Payment screenshot preview"
                    className="w-14 h-14 object-cover rounded-lg border border-emerald-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-emerald-900 truncate block">
                      {screenshotName || 'Screenshot selected'}
                    </span>
                    <span className="text-[10px] text-emerald-700 flex items-center gap-1 font-semibold">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Ready to Submit</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setScreenshotData(null);
                      setScreenshotName(null);
                    }}
                    className="p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-4 bg-slate-50 hover:bg-blue-50/40 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-1.5"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    Click to Upload Screenshot
                  </div>
                  <span className="text-[10px] text-slate-400">
                    PNG, JPG, WebP supported (Max 5MB)
                  </span>
                </div>
              )}
            </div>

            {/* Submission Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep('pay')}
                className="px-3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Back to QR
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !utrNumber.trim()}
                className="flex-1 py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Proof...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Submit Payment Proof (In-Process)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
