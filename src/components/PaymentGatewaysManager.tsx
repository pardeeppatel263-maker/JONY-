import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Zap,
  Server,
  Key,
  Cpu,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  CheckCheck,
  Search,
  RefreshCw,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface PaymentGatewaysManagerProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export const PaymentGatewaysManager: React.FC<PaymentGatewaysManagerProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const { adminSettings, updateAdminSettings, showToast, copyText } = useApp();

  // Internal tab selection ('drampay' | 'qopay')
  const [selectedGateway, setSelectedGateway] = useState<'drampay' | 'qopay'>(
    activeTab === 'qopay' ? 'qopay' : 'drampay'
  );

  useEffect(() => {
    if (activeTab === 'qopay') setSelectedGateway('qopay');
    if (activeTab === 'drampay') setSelectedGateway('drampay');
  }, [activeTab]);

  // DramPay state
  const [drampayEnabled, setDrampayEnabled] = useState(adminSettings.drampayEnabled ?? true);
  const [drampayMerchantId, setDrampayMerchantId] = useState(adminSettings.drampayMerchantId || '');
  const [drampaySecretKey, setDrampaySecretKey] = useState(adminSettings.drampaySecretKey || '');
  const [drampayBaseUrl, setDrampayBaseUrl] = useState(adminSettings.drampayBaseUrl || 'https://drampay.net');
  const [drampayAutoApprove, setDrampayAutoApprove] = useState(adminSettings.drampayAutoApprove ?? true);
  const [drampayAutoPayoutEnabled, setDrampayAutoPayoutEnabled] = useState(adminSettings.drampayAutoPayoutEnabled ?? true);
  const [drampayUpiMode, setDrampayUpiMode] = useState<'deeplink' | 'payurl' | 'both'>(adminSettings.drampayUpiMode || 'both');
  const [showDrampaySecret, setShowDrampaySecret] = useState(false);
  const [isSavingDrampay, setIsSavingDrampay] = useState(false);

  // DramPay live diagnostics
  const [drampayBalanceData, setDrampayBalanceData] = useState<any>(null);
  const [isFetchingDrampayBalance, setIsFetchingDrampayBalance] = useState(false);
  const [drampayTestStatus, setDrampayTestStatus] = useState<string | null>(null);
  const [drampayUtrInput, setDrampayUtrInput] = useState('');
  const [drampayUtrResult, setDrampayUtrResult] = useState<any>(null);
  const [isCheckingDrampayUtr, setIsCheckingDrampayUtr] = useState(false);

  // QO Pay state (https://qo-pay.com)
  const [qopayEnabled, setQopayEnabled] = useState(adminSettings.qopayEnabled ?? false);
  const [qopayUserToken, setQopayUserToken] = useState(adminSettings.qopayUserToken || '');
  const [qopayBaseUrl, setQopayBaseUrl] = useState(adminSettings.qopayBaseUrl || 'https://qo-pay.com');
  const [qopayAutoApprove, setQopayAutoApprove] = useState(adminSettings.qopayAutoApprove ?? true);
  const [qopayAutoPayoutEnabled, setQopayAutoPayoutEnabled] = useState(adminSettings.qopayAutoPayoutEnabled ?? true);
  const [showQopayToken, setShowQopayToken] = useState(false);
  const [isSavingQopay, setIsSavingQopay] = useState(false);

  // QO Pay live diagnostics
  const [qopayTestStatus, setQopayTestStatus] = useState<string | null>(null);
  const [isTestingQopay, setIsTestingQopay] = useState(false);
  const [qopayStatusOrderId, setQopayStatusOrderId] = useState('');
  const [qopayStatusResult, setQopayStatusResult] = useState<any>(null);
  const [isCheckingQopayStatus, setIsCheckingQopayStatus] = useState(false);

  // Sync state when adminSettings update from Firestore
  useEffect(() => {
    if (adminSettings) {
      if (adminSettings.drampayEnabled !== undefined) setDrampayEnabled(adminSettings.drampayEnabled);
      if (adminSettings.drampayMerchantId !== undefined) setDrampayMerchantId(adminSettings.drampayMerchantId);
      if (adminSettings.drampaySecretKey !== undefined) setDrampaySecretKey(adminSettings.drampaySecretKey);
      if (adminSettings.drampayBaseUrl !== undefined) setDrampayBaseUrl(adminSettings.drampayBaseUrl);
      if (adminSettings.drampayAutoApprove !== undefined) setDrampayAutoApprove(adminSettings.drampayAutoApprove);
      if (adminSettings.drampayAutoPayoutEnabled !== undefined) setDrampayAutoPayoutEnabled(adminSettings.drampayAutoPayoutEnabled);
      if (adminSettings.drampayUpiMode !== undefined) setDrampayUpiMode(adminSettings.drampayUpiMode);

      if (adminSettings.qopayEnabled !== undefined) setQopayEnabled(adminSettings.qopayEnabled);
      if (adminSettings.qopayUserToken !== undefined) setQopayUserToken(adminSettings.qopayUserToken);
      if (adminSettings.qopayBaseUrl !== undefined) setQopayBaseUrl(adminSettings.qopayBaseUrl);
      if (adminSettings.qopayAutoApprove !== undefined) setQopayAutoApprove(adminSettings.qopayAutoApprove);
      if (adminSettings.qopayAutoPayoutEnabled !== undefined) setQopayAutoPayoutEnabled(adminSettings.qopayAutoPayoutEnabled);
    }
  }, [adminSettings]);

  // SAVE DRAMPAY SETTINGS (Independent)
  const handleSaveDrampay = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingDrampay(true);
    try {
      const isDrampayOn = Boolean(drampayEnabled);
      const chosenProvider = isDrampayOn ? 'drampay' : (qopayEnabled ? 'qopay' : 'manual');
      await updateAdminSettings({
        drampayEnabled: isDrampayOn,
        drampayMerchantId: drampayMerchantId.trim(),
        drampaySecretKey: drampaySecretKey.trim(),
        drampayBaseUrl: drampayBaseUrl.trim() || 'https://drampay.net',
        drampayAutoApprove,
        drampayAutoPayoutEnabled,
        drampayUpiMode,
        paymentGatewayProvider: chosenProvider,
        paymentGatewayEnabled: isDrampayOn || qopayEnabled,
      });

      fetch('/api/drampay/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: drampayMerchantId.trim(),
          secretKey: drampaySecretKey.trim(),
          baseUrl: drampayBaseUrl.trim() || 'https://drampay.net',
        }),
      }).catch(console.warn);

      showToast(
        isDrampayOn
          ? '✓ DramPay Gateway is now ACTIVE & Synced to Cloud!'
          : '✓ DramPay Gateway turned COMPLETELY OFF & Synced to Cloud!'
      );
    } catch (err: any) {
      console.error(err);
      showToast(`❌ Failed to save DramPay settings: ${err.message || ''}`);
    } finally {
      setIsSavingDrampay(false);
    }
  };

  // SAVE QO PAY SETTINGS (Independent)
  const handleSaveQopay = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingQopay(true);
    try {
      const isQopayOn = Boolean(qopayEnabled);
      const chosenProvider = isQopayOn ? 'qopay' : (drampayEnabled ? 'drampay' : 'manual');
      await updateAdminSettings({
        qopayEnabled: isQopayOn,
        qopayUserToken: qopayUserToken.trim(),
        qopayBaseUrl: qopayBaseUrl.trim() || 'https://qo-pay.com',
        qopayAutoApprove,
        qopayAutoPayoutEnabled,
        paymentGatewayProvider: chosenProvider,
        paymentGatewayEnabled: isQopayOn || drampayEnabled,
      });

      fetch('/api/qopay/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userToken: qopayUserToken.trim(),
          baseUrl: qopayBaseUrl.trim() || 'https://qo-pay.com',
        }),
      }).catch(console.warn);

      showToast(
        isQopayOn
          ? '✓ QO Pay Gateway is now ACTIVE & Synced to Cloud!'
          : '✓ QO Pay Gateway turned COMPLETELY OFF & Synced to Cloud!'
      );
    } catch (err: any) {
      console.error(err);
      showToast(`❌ Failed to save QO Pay settings: ${err.message || ''}`);
    } finally {
      setIsSavingQopay(false);
    }
  };

  // DramPay Live Tools
  const handleFetchDrampayBalance = async () => {
    const activeMid = drampayMerchantId.trim();
    const activeKey = drampaySecretKey.trim();
    if (!activeMid || !activeKey) {
      showToast('❌ Please enter DramPay Merchant ID and Secret Key first');
      return;
    }
    setIsFetchingDrampayBalance(true);
    try {
      const res = await fetch('/api/drampay/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: activeMid, secretKey: activeKey }),
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { code: res.status, msg: text };
      }
      if (data.code === 200) {
        setDrampayBalanceData(data.data);
        showToast('✓ Real-time DramPay Balance fetched successfully!');
      } else {
        showToast(`❌ DramPay Error: ${data.msg || 'Failed to fetch balance'}`);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsFetchingDrampayBalance(false);
    }
  };

  const handleCheckDrampayUtr = async (attemptFix = false) => {
    const cleanUtr = drampayUtrInput.trim();
    const activeMid = drampayMerchantId.trim();
    const activeKey = drampaySecretKey.trim();
    if (!cleanUtr) {
      showToast('❌ Please enter a 12-digit UTR number');
      return;
    }
    setIsCheckingDrampayUtr(true);
    try {
      const endpoint = attemptFix ? '/api/drampay/payin/utr/fix' : '/api/drampay/payin/utr/check';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: activeMid, secretKey: activeKey, utr: cleanUtr }),
      });
      const data = await res.json();
      setDrampayUtrResult(data);
      if (data.status === 1 || data.code === 200) {
        showToast(`✓ UTR ${cleanUtr} confirmed paid!`);
      } else {
        showToast(`UTR check: ${data.msg || 'Not settled or invalid'}`);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsCheckingDrampayUtr(false);
    }
  };

  const handleTestDrampayConnection = async () => {
    const activeMid = drampayMerchantId.trim();
    const activeKey = drampaySecretKey.trim();
    if (!activeMid || !activeKey) {
      showToast('❌ Enter DramPay Merchant ID & Secret Key first');
      return;
    }
    setDrampayTestStatus('Testing MD5 signature & network connection...');
    try {
      const testOrderId = `TEST_${Date.now()}`;
      const res = await fetch('/api/drampay/payin/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: activeMid,
          secretKey: activeKey,
          merchantOrderId: testOrderId,
          amount: 1,
          name: 'ZoroTask Admin Test',
          mobile: '9876543210',
          email: 'admin@zorotask.com',
          deeplink: true,
        }),
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { code: res.status, msg: text };
      }
      if (data.code === 200 && (data.data?.payUrl || data.data?.deeplink)) {
        setDrampayTestStatus(`✓ Success: MD5 verified, payUrl generated (${data.data?.payUrl?.slice(0, 45)}...)`);
        showToast('✓ DramPay API connection test PASSED!');
      } else {
        setDrampayTestStatus(`❌ API Response: ${data.msg || text.slice(0, 100)}`);
        showToast('⚠️ DramPay Test response received');
      }
    } catch (err: any) {
      setDrampayTestStatus(`❌ Connection error: ${err.message}`);
      showToast(`Test failed: ${err.message}`);
    }
  };

  // QO Pay Live Tools
  const handleTestQoPayConnection = async () => {
    const activeToken = qopayUserToken.trim();
    if (!activeToken) {
      showToast('❌ Please enter your QO Pay User Token first');
      return;
    }
    setIsTestingQopay(true);
    setQopayTestStatus('Pinging QO Pay Gateway API...');
    try {
      const res = await fetch('/api/qopay/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userToken: activeToken, baseUrl: qopayBaseUrl.trim() || 'https://qo-pay.com' }),
      });
      const data = await res.json();
      if (data.success) {
        setQopayTestStatus(`✓ QO Pay Online! Server response: ${JSON.stringify(data.data || data.message || 'OK')}`);
        showToast('✓ QO Pay API connected successfully!');
      } else {
        setQopayTestStatus(`⚠️ QO Pay replied with error: ${data.message || 'Check User Token'}`);
        showToast(`QO Pay Response: ${data.message}`);
      }
    } catch (err: any) {
      setQopayTestStatus(`❌ QO Pay connection failed: ${err.message}`);
      showToast(`Error: ${err.message}`);
    } finally {
      setIsTestingQopay(false);
    }
  };

  const handleCheckQoPayStatus = async () => {
    const cleanOrderId = qopayStatusOrderId.trim();
    if (!cleanOrderId) {
      showToast('❌ Please enter an Order ID to check status');
      return;
    }
    setIsCheckingQopayStatus(true);
    try {
      const res = await fetch('/api/qopay/payin/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userToken: qopayUserToken.trim(),
          baseUrl: qopayBaseUrl.trim() || 'https://qo-pay.com',
          orderId: cleanOrderId,
        }),
      });
      const data = await res.json();
      setQopayStatusResult(data);
      if (data.isPaid) {
        showToast(`🎉 Order ${cleanOrderId} is PAID! UTR: ${data.utr || 'N/A'}`);
      } else {
        showToast(`Order Status: ${data.status || 'PENDING'} (${data.message || ''})`);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsCheckingQopayStatus(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* TWO SEPARATE PROMINENT GATEWAY SELECTOR CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* SECTION 1 CARD: DRAMPAY */}
        <div
          onClick={() => {
            setSelectedGateway('drampay');
            setActiveTab('drampay');
          }}
          className={`p-5 rounded-3xl border cursor-pointer transition-all relative overflow-hidden ${
            selectedGateway === 'drampay'
              ? 'bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-950 border-amber-500 ring-2 ring-amber-500/40 shadow-2xl'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Zap className="w-6 h-6 fill-amber-400" />
              </div>
              <div>
                <div className="text-base font-black text-white flex items-center gap-2">
                  <span>⚡ DramPay Gateway</span>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    drampay.net
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">UPI Deeplink, Cashier Web &amp; Auto Payouts</p>
              </div>
            </div>

            {/* Quick 1-Click Master Switch on Card */}
            <div className="flex flex-col items-end gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setDrampayEnabled(!drampayEnabled)}
                className={`w-12 h-6.5 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                  drampayEnabled ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <span className="bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform" />
              </button>
              <span
                className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                  drampayEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {drampayEnabled ? 'ACTIVE (ON)' : 'COMPLETELY OFF'}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 2 CARD: QO PAY */}
        <div
          onClick={() => {
            setSelectedGateway('qopay');
            setActiveTab('qopay');
          }}
          className={`p-5 rounded-3xl border cursor-pointer transition-all relative overflow-hidden ${
            selectedGateway === 'qopay'
              ? 'bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border-indigo-500 ring-2 ring-indigo-500/40 shadow-2xl'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Zap className="w-6 h-6 fill-indigo-400" />
              </div>
              <div>
                <div className="text-base font-black text-white flex items-center gap-2">
                  <span>⚡ QO Pay Gateway</span>
                  <span className="text-[10px] font-mono text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded border border-indigo-400/20">
                    qo-pay.com
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Dynamic UPI QR, Intent &amp; Auto Payouts</p>
              </div>
            </div>

            {/* Quick 1-Click Master Switch on Card */}
            <div className="flex flex-col items-end gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setQopayEnabled(!qopayEnabled)}
                className={`w-12 h-6.5 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                  qopayEnabled ? 'bg-indigo-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <span className="bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform" />
              </button>
              <span
                className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                  qopayEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {qopayEnabled ? 'ACTIVE (ON)' : 'COMPLETELY OFF'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* DEDICATED SECTION 1: DRAMPAY GATEWAY FULL CONFIGURATION */}
      {/* ======================================================== */}
      {selectedGateway === 'drampay' && (
        <div className="bg-slate-900 p-4 sm:p-6 rounded-3xl border border-amber-500/30 space-y-6 shadow-2xl">
          {/* Header & Independent Switch */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Zap className="w-6 h-6 fill-amber-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>DramPay Payment Gateway Configuration</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    drampay.net
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  UPI Deeplink (App Intent), Cashier PayUrl, and 1-Click Automated Payouts API.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <a
                href="https://drampay.net"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-300 hover:text-white flex items-center gap-1 bg-amber-500/10 px-2.5 py-1.5 rounded-xl border border-amber-500/20"
              >
                <span>Merchant Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              {/* Master DramPay Switch */}
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300">DramPay Status:</span>
                <button
                  type="button"
                  onClick={() => setDrampayEnabled(!drampayEnabled)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                    drampayEnabled ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Status Alert Banner */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
              drampayEnabled
                ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Cpu className={`w-5 h-5 shrink-0 ${drampayEnabled ? 'text-amber-400 animate-pulse' : 'text-rose-400'}`} />
              <div>
                <div className="font-bold text-sm">
                  {drampayEnabled
                    ? 'DramPay is currently ACTIVE (ON)'
                    : 'DramPay is COMPLETELY OFF (Disabled across the entire app)'}
                </div>
                <p className="text-[11px] opacity-80">
                  {drampayEnabled
                    ? 'Member deposit checkouts and automated payouts use DramPay.'
                    : 'DramPay will NOT be shown to users and NO DramPay API transactions will execute.'}
                </p>
              </div>
            </div>
            <span
              className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase ${
                drampayEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {drampayEnabled ? 'LIVE ACTIVE' : 'FULLY OFF'}
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveDrampay} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-950 p-4 sm:p-5 rounded-2xl border border-amber-500/20">
              {/* Merchant ID */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">
                  DramPay Numeric Merchant ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={drampayMerchantId}
                  onChange={(e) => setDrampayMerchantId(e.target.value)}
                  placeholder="e.g. 58"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white outline-none focus:border-amber-400 transition"
                />
                <p className="text-[10px] text-slate-500">Your assigned numeric merchant ID from drampay.net dashboard (e.g. 58)</p>
                {drampayMerchantId.trim().toLowerCase() === 'int32' && (
                  <p className="text-[10px] text-rose-400 font-bold">
                    ⚠️ &quot;int32&quot; is a type placeholder, not your actual ID! Please enter your real numeric merchant ID.
                  </p>
                )}
              </div>

              {/* Secret Key */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">
                    DramPay Secret Key (MD5 Signature) <span className="text-red-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDrampaySecret(!showDrampaySecret)}
                    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {showDrampaySecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showDrampaySecret ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <input
                  type={showDrampaySecret ? 'text' : 'password'}
                  value={drampaySecretKey}
                  onChange={(e) => setDrampaySecretKey(e.target.value)}
                  placeholder="Enter 32-character secret key"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white outline-none focus:border-amber-400 transition"
                />
                <p className="text-[10px] text-slate-500">Used server-side for calculating MD5 request/response signatures.</p>
              </div>

              {/* API Host URL */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">
                  DramPay API Host Base URL
                </label>
                <input
                  type="text"
                  value={drampayBaseUrl}
                  onChange={(e) => setDrampayBaseUrl(e.target.value)}
                  placeholder="https://drampay.net"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 outline-none focus:border-amber-400 transition"
                />
              </div>

              {/* UPI Checkout Mode */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">
                  UPI Checkout Trigger Mode
                </label>
                <select
                  value={drampayUpiMode}
                  onChange={(e) => setDrampayUpiMode(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-amber-400 transition cursor-pointer"
                >
                  <option value="both">Smart Hybrid (Deeplink on Mobile + Cashier on Desktop)</option>
                  <option value="deeplink">Direct UPI Deeplink (App Intent only)</option>
                  <option value="payurl">Cashier PayUrl (Hosted Web Checkout only)</option>
                </select>
              </div>

              {/* Auto-Approve Callback Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Auto-Approve Payin</span>
                  <span className="text-[10px] text-slate-400">Credit wallet instantly when DramPay webhook confirms</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDrampayAutoApprove(!drampayAutoApprove)}
                  className={`w-10 h-5.5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                    drampayAutoApprove ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              {/* Auto-Payout API Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Automated Payouts API</span>
                  <span className="text-[10px] text-slate-400">Enable 1-click disbursement via /api/drampay/payout/create</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDrampayAutoPayoutEnabled(!drampayAutoPayoutEnabled)}
                  className={`w-10 h-5.5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                    drampayAutoPayoutEnabled ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>
            </div>

            {/* Webhook Endpoints */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">
                  Payin Notify URL (Set in DramPay Portal)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={typeof window !== 'undefined' ? `${window.location.origin}/api/drampay/payin/notify` : ''}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-amber-300 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyText(`${window.location.origin}/api/drampay/payin/notify`, 'Payin Notify URL')}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">
                  Payout Notify URL (Set in DramPay Portal)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={typeof window !== 'undefined' ? `${window.location.origin}/api/drampay/payout/notify` : ''}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-amber-300 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyText(`${window.location.origin}/api/drampay/payout/notify`, 'Payout Notify URL')}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
            </div>

            {/* DramPay Live Tools & Balance */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Server className="w-4 h-4" />
                  <span>DramPay Live Tools &amp; Balance Diagnostic</span>
                </span>
                <button
                  type="button"
                  onClick={handleFetchDrampayBalance}
                  disabled={isFetchingDrampayBalance}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isFetchingDrampayBalance ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>Check Balance</span>
                </button>
              </div>

              {drampayBalanceData && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Available Balance</span>
                    <span className="text-sm font-black text-emerald-400">₹{drampayBalanceData.balance || 0}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Settleable Amount</span>
                    <span className="text-sm font-black text-amber-400">₹{drampayBalanceData.settleableAmount || 0}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Total Pay In</span>
                    <span className="text-sm font-black text-white">₹{drampayBalanceData.totalPayAmount || 0}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Total Fee</span>
                    <span className="text-sm font-black text-rose-400">₹{drampayBalanceData.totalFeeAmount || 0}</span>
                  </div>
                </div>
              )}

              {/* UTR Check Tool */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <label className="text-xs font-bold text-slate-300 block">Check / Fix DramPay UTR Status</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={drampayUtrInput}
                    onChange={(e) => setDrampayUtrInput(e.target.value)}
                    placeholder="Enter 12-digit UPI UTR Number"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCheckDrampayUtr(false)}
                    disabled={isCheckingDrampayUtr}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isCheckingDrampayUtr ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>Check UTR</span>
                  </button>
                </div>
                {drampayUtrResult && (
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
                    <span className="text-emerald-400 font-bold">API Result:</span> {JSON.stringify(drampayUtrResult)}
                  </div>
                )}
              </div>

              {/* Test Connection Button */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handleTestDrampayConnection}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
                >
                  <Server className="w-4 h-4 text-amber-400" />
                  <span>Test DramPay Connection &amp; MD5 Sign</span>
                </button>
                {drampayTestStatus && (
                  <span className="text-xs font-mono text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                    {drampayTestStatus}
                  </span>
                )}
              </div>
            </div>

            {/* Save DramPay Settings Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingDrampay}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSavingDrampay ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                <span>{isSavingDrampay ? 'Saving DramPay...' : '💾 Save & Deploy DramPay Gateway Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* DEDICATED SECTION 2: QO PAY GATEWAY FULL CONFIGURATION */}
      {/* ======================================================== */}
      {selectedGateway === 'qopay' && (
        <div className="bg-slate-900 p-4 sm:p-6 rounded-3xl border border-indigo-500/30 space-y-6 shadow-2xl">
          {/* Header & Independent Switch */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                <Zap className="w-6 h-6 fill-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>QO Pay Payment Gateway Configuration</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    qo-pay.com
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Instant Dynamic UPI QR Code, App Intent Deeplinks, &amp; 1-Click Automated Payouts API.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <a
                href="https://qo-pay.com"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-300 hover:text-white flex items-center gap-1 bg-indigo-500/10 px-2.5 py-1.5 rounded-xl border border-indigo-500/20"
              >
                <span>Merchant Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              {/* Master QO Pay Switch */}
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300">QO Pay Status:</span>
                <button
                  type="button"
                  onClick={() => setQopayEnabled(!qopayEnabled)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                    qopayEnabled ? 'bg-indigo-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Status Alert Banner */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
              qopayEnabled
                ? 'bg-indigo-950/30 border-indigo-500/30 text-indigo-300'
                : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Cpu className={`w-5 h-5 shrink-0 ${qopayEnabled ? 'text-indigo-400 animate-pulse' : 'text-rose-400'}`} />
              <div>
                <div className="font-bold text-sm">
                  {qopayEnabled
                    ? 'QO Pay is currently ACTIVE (ON)'
                    : 'QO Pay is COMPLETELY OFF (Disabled across the entire app)'}
                </div>
                <p className="text-[11px] opacity-80">
                  {qopayEnabled
                    ? 'Member deposit checkouts and automated payouts use QO Pay.'
                    : 'QO Pay will NOT be shown to users and NO QO Pay API transactions will execute.'}
                </p>
              </div>
            </div>
            <span
              className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase ${
                qopayEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {qopayEnabled ? 'LIVE ACTIVE' : 'FULLY OFF'}
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveQopay} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-950 p-4 sm:p-5 rounded-2xl border border-indigo-500/20">
              {/* User Token */}
              <div className="space-y-1 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">
                    QO Pay User Token (user_token) <span className="text-red-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowQopayToken(!showQopayToken)}
                    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {showQopayToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showQopayToken ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <input
                  type={showQopayToken ? 'text' : 'password'}
                  value={qopayUserToken}
                  onChange={(e) => setQopayUserToken(e.target.value)}
                  placeholder="Paste your unique QO Pay user_token from https://qo-pay.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white outline-none focus:border-indigo-400 transition"
                />
                <p className="text-[10px] text-slate-400">
                  This token is passed as &apos;user_token&apos; to https://qo-pay.com/api/create-order and /order-status.
                </p>
              </div>

              {/* API Host URL */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">
                  QO Pay API Host Base URL
                </label>
                <input
                  type="text"
                  value={qopayBaseUrl}
                  onChange={(e) => setQopayBaseUrl(e.target.value)}
                  placeholder="https://qo-pay.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 outline-none focus:border-indigo-400 transition"
                />
              </div>

              {/* Webhook Notify URL */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">
                  Webhook / Notify URL (Paste in QO Pay Console)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={typeof window !== 'undefined' ? `${window.location.origin}/api/qopay/notify` : ''}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-indigo-300 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyText(`${window.location.origin}/api/qopay/notify`, 'QO Pay Notify URL')}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              {/* Auto-Approve on Callback */}
              <div className="flex items-center justify-between p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Auto-Approve on Callback</span>
                  <span className="text-[10px] text-slate-400">Credit wallet instantly when QO Pay webhook confirms</span>
                </div>
                <button
                  type="button"
                  onClick={() => setQopayAutoApprove(!qopayAutoApprove)}
                  className={`w-10 h-5.5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                    qopayAutoApprove ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              {/* Automated Payouts API Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Automated Payouts API</span>
                  <span className="text-[10px] text-slate-400">Enable 1-click withdrawal disbursement via /api/create-payout</span>
                </div>
                <button
                  type="button"
                  onClick={() => setQopayAutoPayoutEnabled(!qopayAutoPayoutEnabled)}
                  className={`w-10 h-5.5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                    qopayAutoPayoutEnabled ? 'bg-indigo-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>
            </div>

            {/* QO Pay Live Tools */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <Server className="w-4 h-4" />
                  <span>QO Pay Live Diagnostics &amp; Status Check</span>
                </span>
                <button
                  type="button"
                  onClick={handleTestQoPayConnection}
                  disabled={isTestingQopay}
                  className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isTestingQopay ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>Test API Connection</span>
                </button>
              </div>

              {qopayTestStatus && (
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
                  {qopayTestStatus}
                </div>
              )}

              {/* Order Status Checker */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <label className="text-xs font-bold text-slate-300 block">Query Order Status (order_id)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={qopayStatusOrderId}
                    onChange={(e) => setQopayStatusOrderId(e.target.value)}
                    placeholder="e.g. QO_1730000000000_1234"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCheckQoPayStatus}
                    disabled={isCheckingQopayStatus}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isCheckingQopayStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>Query Status</span>
                  </button>
                </div>
                {qopayStatusResult && (
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 max-h-40 overflow-y-auto">
                    {JSON.stringify(qopayStatusResult, null, 2)}
                  </div>
                )}
              </div>
            </div>

            {/* Save QO Pay Settings Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingQopay}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-600/30 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSavingQopay ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                <span>{isSavingQopay ? 'Saving QO Pay...' : '💾 Save & Deploy QO Pay Gateway Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
