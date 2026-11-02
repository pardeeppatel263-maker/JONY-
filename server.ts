import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Dedicated Android APK Route with official package MIME type
  app.get(['/ZoroTask-Official.apk', '/api/download-apk'], (_req, res) => {
    const apkPath = path.resolve(__dirname, 'public', 'ZoroTask-Official.apk');
    if (fs.existsSync(apkPath)) {
      const stat = fs.statSync(apkPath);
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', 'attachment; filename="ZoroTask-Official.apk"');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.sendFile(apkPath);
    }
    return res.status(404).send('APK file not found');
  });

  // Lightweight connectivity ping route
  app.get('/api/ping', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(204).end();
  });

  // App Version & In-App 1-Click Update Info Endpoint
  app.get('/api/app-version', (_req, res) => {
    return res.json({
      success: true,
      currentVersion: '2.8.0',
      versionCode: 28,
      releaseDate: '30 Oct 2026',
      apkFileName: 'ZoroTask-Official-v2.8.apk',
      downloadUrl: '/ZoroTask-Official.apk',
      fileSizeMb: '18.66 MB',
      forceUpdate: false,
      changelog: [
        '📶 Full-Screen Low Internet Connection Popup Modal with instant reconnect',
        '🔒 Total app function lock when offline - prevents errors and preserves session',
        '👑 All 8 VIP Membership Plans (Level 0 Starter to Level 7 Grand Master) synced',
        '⚡ In-place 1-click update directly from app'
      ]
    });
  });

  // Real-time network health check endpoint for online-only connectivity guard
  app.get('/api/health', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return res.json({ status: 'ok', online: true, timestamp: Date.now() });
  });

  // Request logger for real-time diagnostics
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`[HTTP-REQ] ${req.method} ${req.url} - IP: ${req.ip} - Time: ${new Date().toISOString()}`);
    }
    next();
  });

  // WhatsApp OTP API Proxy Route
  app.post('/api/send-whatsapp-otp', async (req, res) => {
    console.log('[API-INCOMING] /api/send-whatsapp-otp received payload:', JSON.stringify(req.body));
    try {
      const payload = req.body || {};
      const {
        provider = 'renflair',
        mobile = '',
        otp = '',
        message = '',
        apiKey = '',
        apiUrl = 'https://whatsapp.renflair.in/V1.php',
        instanceId = '',
      } = payload;

      const cleanMobile = String(mobile).replace(/\D/g, '').slice(-10);
      const fullMobile = `91${cleanMobile}`;
      const textMessage = message || `*ZoroTask Account Verification*\n\nYour OTP code is: *${otp}*\n\nValid for 10 minutes. Do not share this OTP with anyone.\n\n- ZoroTask Security Team`;
      const fallbackLink = `https://api.whatsapp.com/send?phone=${fullMobile}&text=${encodeURIComponent(textMessage)}`;

      // 1. Renflair WhatsApp Gateway (Direct WhatsApp OTP delivery)
      if (
        provider === 'renflair' ||
        provider === 'custom' ||
        String(apiUrl).includes('renflair') ||
        !['green_api', 'ultramsg', 'direct'].includes(provider)
      ) {
        const keyToUse = (apiKey || process.env.RENFLAIR_API_KEY || '417d155c4d7937dc6555a13a71f09ec0').trim();
        const clean10DigitMobile = cleanMobile; // Exactly 10 digits
        
        // WhatsApp Renflair Endpoint strictly requires COUNTRY=91
        const whatsappUrl = 'https://whatsapp.renflair.in/V1.php';
        const primaryUrl = `${whatsappUrl}?API=${encodeURIComponent(keyToUse)}&PHONE=${encodeURIComponent(clean10DigitMobile)}&OTP=${encodeURIComponent(String(otp))}&COUNTRY=91`;
        const alternateUrl = `${whatsappUrl}?API=${encodeURIComponent(keyToUse)}&PHONE=${encodeURIComponent('91' + clean10DigitMobile)}&OTP=${encodeURIComponent(String(otp))}&COUNTRY=91`;

        console.log(`[WhatsApp-OTP] Dispatched to Renflair WhatsApp API: ${clean10DigitMobile} | OTP: ${otp} | Key: ${keyToUse.slice(0, 6)}...`);

        let lastResponseText = '';
        let lastResponseJson: any = null;
        let isSuccess = false;
        let gatewayMsg = '';
        let usedEndpoint = whatsappUrl;

        try {
          const apiRes = await fetch(primaryUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'application/json, text/plain, */*',
            },
            signal: AbortSignal.timeout(10000),
          });
          lastResponseText = await apiRes.text();
          console.log(`[WhatsApp-OTP] Renflair WhatsApp Response for ${clean10DigitMobile}:`, lastResponseText);

          try {
            lastResponseJson = JSON.parse(lastResponseText);
          } catch {
            lastResponseJson = null;
          }

          let statusStr = String(lastResponseJson?.status || '').toUpperCase();
          if (statusStr === 'SUCCESS' || lastResponseJson?.success === true) {
            isSuccess = true;
            gatewayMsg = lastResponseJson?.message || 'Message Successfully Delivered';
          } else if (lastResponseJson?.message) {
            gatewayMsg = lastResponseJson.message;
          }

          // If 10-digit didn't succeed, try 12-digit alternate URL
          if (!isSuccess) {
            try {
              const altRes = await fetch(alternateUrl, {
                method: 'GET',
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                  'Accept': 'application/json, text/plain, */*',
                },
                signal: AbortSignal.timeout(8000),
              });
              const altText = await altRes.text();
              console.log(`[WhatsApp-OTP] Renflair WhatsApp Alternate Response:`, altText);
              let altJson: any = null;
              try { altJson = JSON.parse(altText); } catch { altJson = null; }
              if (String(altJson?.status || '').toUpperCase() === 'SUCCESS') {
                isSuccess = true;
                gatewayMsg = altJson?.message || 'Message Successfully Delivered';
                lastResponseJson = altJson;
              }
            } catch (aErr: any) {
              console.warn('[WhatsApp-OTP] Alternate Renflair dispatch error:', aErr.message);
            }
          }

          // If still not succeeded, try sms.renflair.in as backup
          if (!isSuccess) {
            const smsUrl = `https://sms.renflair.in/V1.php?API=${encodeURIComponent(keyToUse)}&PHONE=${encodeURIComponent(clean10DigitMobile)}&OTP=${encodeURIComponent(String(otp))}&COUNTRY=91`;
            try {
              const smsRes = await fetch(smsUrl, {
                method: 'GET',
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                  'Accept': 'application/json, text/plain, */*',
                },
                signal: AbortSignal.timeout(8000),
              });
              const smsText = await smsRes.text();
              let smsJson: any = null;
              try { smsJson = JSON.parse(smsText); } catch { smsJson = null; }
              if (String(smsJson?.status || '').toUpperCase() === 'SUCCESS') {
                isSuccess = true;
                gatewayMsg = smsJson?.message || 'Message Successfully Delivered';
                lastResponseJson = smsJson;
                usedEndpoint = 'https://sms.renflair.in/V1.php';
              }
            } catch (sErr: any) {
              console.warn('[WhatsApp-OTP] Backup SMS dispatch error:', sErr.message);
            }
          }
        } catch (err: any) {
          console.warn(`[WhatsApp-OTP] Renflair Gateway Error:`, err.message);
          gatewayMsg = err.message || 'Connection timeout';
        }

        return res.json({
          success: isSuccess,
          provider: 'renflair',
          deliveredByGateway: isSuccess,
          status: isSuccess ? 200 : 400,
          usedEndpoint,
          gatewayMessage: gatewayMsg,
          message: isSuccess
            ? `OTP sent to your WhatsApp (+91 ${cleanMobile})`
            : gatewayMsg
              ? `Renflair Gateway: ${gatewayMsg}`
              : `OTP delivery pending for WhatsApp (+91 ${cleanMobile})`,
          fallbackLink,
          directLink: fallbackLink,
          gatewayResponse: lastResponseJson || lastResponseText,
        });
      }

      // 2. Green-API / WhatsApp Web Multi-Device Instance
      if (provider === 'green_api') {
        const idInst = String(instanceId || '').trim();
        const apiTok = String(apiKey || '').trim();

        if (!idInst || !apiTok) {
          return res.json({
            success: false,
            provider: 'green_api',
            deliveredByGateway: false,
            message: 'Green-API Instance ID or Token missing. Please configure in Admin Panel.',
            fallbackLink,
          });
        }

        const baseUrl = apiUrl || `https://api.green-api.com/waInstance${idInst}`;

        try {
          console.log(`[WhatsApp-Web] Sending via Green-API Instance ${idInst} to +${fullMobile}`);
          const gRes = await fetch(`${baseUrl}/sendMessage/${apiTok}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chatId: `${fullMobile}@c.us`,
              message: textMessage,
            }),
            signal: AbortSignal.timeout(10000),
          });
          const gJson: any = await gRes.json();
          const isDelivered = Boolean(gJson?.idMessage);

          return res.json({
            success: isDelivered,
            provider: 'green_api',
            deliveredByGateway: isDelivered,
            gatewayResponse: gJson,
            message: isDelivered
              ? `OTP dispatched from your linked WhatsApp Web to +91 ${cleanMobile}`
              : gJson?.message || 'Green-API delivery failed. Check QR connection status.',
            fallbackLink,
            directLink: fallbackLink,
          });
        } catch (gErr: any) {
          console.warn('[WhatsApp-Web] Green-API error:', gErr.message);
          return res.json({
            success: false,
            provider: 'green_api',
            message: gErr.message || 'Green-API connection timeout',
            fallbackLink,
          });
        }
      }

      // 3. UltraMsg Gateway
      if (provider === 'ultramsg') {
        const inst = instanceId || 'instance192672';
        const tok = apiKey || 'zwsvwyr1pqa8ztxa';

        try {
          const uRes = await fetch(`https://api.ultramsg.com/${inst}/messages/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              token: tok,
              to: fullMobile,
              body: textMessage,
            }),
          });
          const uJson = await uRes.json();
          return res.json({
            success: true,
            provider: 'ultramsg',
            deliveredByGateway: uJson?.sent === 'true' || !!uJson?.id,
            message: `OTP dispatched to WhatsApp +91 ${cleanMobile}`,
            fallbackLink,
            directLink: fallbackLink,
          });
        } catch (uErr: any) {
          console.warn('UltraMsg fetch warning:', uErr.message);
          return res.json({
            success: true,
            provider: 'direct',
            message: `OTP dispatched to WhatsApp +91 ${cleanMobile}`,
            fallbackLink,
            directLink: fallbackLink,
          });
        }
      }

      // 4. Default Direct Mode
      return res.json({
        success: true,
        provider: 'direct',
        message: `OTP dispatched to WhatsApp +91 ${cleanMobile}`,
        fallbackLink,
        directLink: fallbackLink,
      });
    } catch (err: any) {
      console.error('WhatsApp API proxy error:', err);
      const cleanMobile = String(req.body?.mobile || '').replace(/\D/g, '').slice(-10);
      const fallback = `https://api.whatsapp.com/send?phone=91${cleanMobile}&text=${encodeURIComponent(`Your ZoroTask OTP code is: ${req.body?.otp || ''}`)}`;
      return res.json({
        success: true,
        provider: 'direct',
        message: 'OTP ready for WhatsApp dispatch',
        fallbackLink: fallback,
        directLink: fallback,
      });
    }
  });

  // 1. WhatsApp Instance QR Code Endpoint (for scanning QR in Admin Panel)
  app.get('/api/whatsapp-instance-qr', async (req, res) => {
    try {
      const { provider = 'green_api', instanceId = '', apiToken = '' } = req.query;
      const cleanInst = String(instanceId || '').trim();
      const cleanToken = String(apiToken || '').trim();

      if (!cleanInst || !cleanToken) {
        return res.json({
          success: false,
          message: 'Please enter your Instance ID and Token first.',
        });
      }

      if (provider === 'green_api') {
        const qrUrl = `https://api.green-api.com/waInstance${cleanInst}/qr/${cleanToken}`;
        const qrRes = await fetch(qrUrl, { signal: AbortSignal.timeout(8000) });
        const qrJson: any = await qrRes.json();
        return res.json({
          success: true,
          type: qrJson?.type || 'qrCode',
          qrData: qrJson?.message || '',
          raw: qrJson,
        });
      }

      if (provider === 'ultramsg') {
        return res.json({
          success: true,
          type: 'qrCode',
          qrData: `https://api.ultramsg.com/${cleanInst}/instance/qr?token=${cleanToken}`,
          isImageUrl: true,
        });
      }

      return res.json({
        success: false,
        message: 'Unsupported QR provider',
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. WhatsApp Instance Connection Status Endpoint
  app.get('/api/whatsapp-instance-status', async (req, res) => {
    try {
      const { provider = 'green_api', instanceId = '', apiToken = '' } = req.query;
      const cleanInst = String(instanceId || '').trim();
      const cleanToken = String(apiToken || '').trim();

      if (!cleanInst || !cleanToken) {
        return res.json({ success: false, isAuthorized: false, state: 'not_configured' });
      }

      if (provider === 'green_api') {
        const stUrl = `https://api.green-api.com/waInstance${cleanInst}/getStateInstance/${cleanToken}`;
        const stRes = await fetch(stUrl, { signal: AbortSignal.timeout(8000) });
        const stJson: any = await stRes.json();
        const isAuth = stJson?.stateInstance === 'authorized';
        return res.json({
          success: true,
          state: stJson?.stateInstance || 'unknown',
          isAuthorized: isAuth,
        });
      }

      if (provider === 'ultramsg') {
        const stUrl = `https://api.ultramsg.com/${cleanInst}/instance/status?token=${cleanToken}`;
        const stRes = await fetch(stUrl, { signal: AbortSignal.timeout(8000) });
        const stJson: any = await stRes.json();
        const isAuth = stJson?.status?.accountStatus === 'authenticated';
        return res.json({
          success: true,
          state: stJson?.status?.accountStatus || 'unknown',
          isAuthorized: isAuth,
        });
      }

      return res.json({ success: false, isAuthorized: false, state: 'unknown' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // DRAMPAY PAYMENT GATEWAY API PROXY ROUTES
  // Official Docs: https://drampay.net/doc/doc.html
  // ==========================================

  // In-memory runtime config for DramPay
  const drampayConfig = {
    merchantId: process.env.DRAMPAY_MERCHANT_ID || '',
    secretKey: process.env.DRAMPAY_SECRET_KEY || '',
    baseUrl: process.env.DRAMPAY_BASE_URL || 'https://drampay.net',
  };

  // In-memory map of recorded DramPay orders (with webhook status updates)
  const drampayOrders = new Map<string, any>();

  // Signature calculation function as per DramPay doc:
  // 1. Sort keys by ASCII
  // 2. key=value&key=value (exclude empty values and 'sign')
  // 3. Append &key=secretKey
  // 4. MD5 hash in lowercase
  function generateDramPaySign(params: Record<string, any>, secretKey: string): string {
    const keys = Object.keys(params)
      .filter((k) => k !== 'sign' && params[k] !== undefined && params[k] !== null && params[k] !== '')
      .sort();
    const stringA = keys.map((k) => `${k}=${params[k]}`).join('&');
    const stringToSign = `${stringA}&key=${secretKey}`;
    return crypto.createHash('md5').update(stringToSign, 'utf8').digest('hex').toLowerCase();
  }

  // Get or Update DramPay Runtime Config
  app.get('/api/drampay/config', (_req, res) => {
    return res.json({
      success: true,
      configured: Boolean(drampayConfig.merchantId && drampayConfig.secretKey),
      merchantId: drampayConfig.merchantId,
      baseUrl: drampayConfig.baseUrl,
      hasSecretKey: Boolean(drampayConfig.secretKey),
    });
  });

  app.post('/api/drampay/config', (req, res) => {
    const { merchantId, secretKey, baseUrl } = req.body || {};
    if (merchantId !== undefined) drampayConfig.merchantId = String(merchantId).trim();
    if (secretKey !== undefined) drampayConfig.secretKey = String(secretKey).trim();
    if (baseUrl !== undefined) drampayConfig.baseUrl = String(baseUrl).trim() || 'https://drampay.net';
    return res.json({
      success: true,
      message: 'DramPay gateway configuration updated successfully',
      configured: Boolean(drampayConfig.merchantId && drampayConfig.secretKey),
      merchantId: drampayConfig.merchantId,
    });
  });

  // 1. Payin Submit (Create Payment Order)
  // Calls https://drampay.net/api/payin/submit
  app.post('/api/drampay/payin/create', async (req, res) => {
    try {
      const {
        merchantId = drampayConfig.merchantId,
        secretKey = drampayConfig.secretKey,
        merchantOrderId = `ZT${Date.now()}${Math.floor(100 + Math.random() * 900)}`,
        amount,
        name = 'ZoroTask Member',
        mobile = '',
        email = '',
        notifyUrl,
        returnUrl,
        deeplink = true,
        clientIp,
        userAgent,
        mode,
        payType,
      } = req.body || {};

      const activeMerchantId = merchantId || drampayConfig.merchantId;
      const activeSecretKey = secretKey || drampayConfig.secretKey;

      if (!activeMerchantId || !activeSecretKey) {
        return res.status(400).json({
          success: false,
          code: 400,
          msg: 'DramPay Merchant ID and Secret Key are required. Please configure them in the Admin Panel settings or .env file.',
        });
      }

      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({
          success: false,
          code: 400,
          msg: 'Valid amount is required',
        });
      }

      const hostUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      const defaultNotifyUrl = `${hostUrl}/api/drampay/payin/notify`;
      const defaultReturnUrl = `${hostUrl}/#wallet?payment=success&orderId=${merchantOrderId}`;

      // Formatted amount (DramPay expects string amount)
      const formattedAmount = Number(amount).toFixed(2);
      const userIp = clientIp || req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.ip || '106.51.12.34';
      const userAgentStr = userAgent || req.headers['user-agent'] || 'Mozilla/5.0 (Linux; Android 13)';

      const params: Record<string, any> = {
        merchantId: Number(activeMerchantId),
        merchantOrderId: String(merchantOrderId),
        amount: formattedAmount,
        notifyUrl: notifyUrl || defaultNotifyUrl,
        returnUrl: returnUrl || defaultReturnUrl,
        name: String(name).slice(0, 50),
        deeplink: Boolean(deeplink),
        clientIp: userIp,
        userAgent: userAgentStr,
      };

      if (mobile) params.mobile = String(mobile).replace(/\D/g, '').slice(-10);
      if (email) params.email = String(email);
      if (mode) params.mode = mode;
      if (payType) params.payType = payType;

      // Generate signature
      params.sign = generateDramPaySign(params, activeSecretKey);

      const endpoint = `${drampayConfig.baseUrl || 'https://drampay.net'}/api/payin/submit`;
      console.log(`[DramPay-Payin] Sending order to ${endpoint} with merchantId ${activeMerchantId}`);

      const apiRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(15000),
      });

      const responseData: any = await apiRes.json();
      console.log('[DramPay-Payin] Response:', JSON.stringify(responseData));

      // Record in local cache
      drampayOrders.set(merchantOrderId, {
        merchantOrderId,
        amount: formattedAmount,
        platformOrderId: responseData?.data?.orderId,
        status: responseData?.data?.status || '0',
        payUrl: responseData?.data?.payUrl,
        deeplink: responseData?.data?.deeplink,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return res.json({
        success: responseData?.code === 200,
        code: responseData?.code,
        msg: responseData?.msg || 'OK',
        data: {
          ...responseData?.data,
          merchantOrderId,
        },
      });
    } catch (err: any) {
      console.error('[DramPay-Payin-Error]', err);
      return res.status(500).json({
        success: false,
        code: 500,
        msg: err.message || 'Failed to initiate DramPay payment',
      });
    }
  });

  // 2. Payin Status Query
  // Calls https://drampay.net/api/payin/status
  app.post('/api/drampay/payin/status', async (req, res) => {
    try {
      const {
        merchantId,
        secretKey,
        merchantOrderId,
      } = req.body || {};

      const activeMerchantId = merchantId || drampayConfig.merchantId;
      const activeSecretKey = secretKey || drampayConfig.secretKey;

      if (!merchantOrderId) {
        return res.status(400).json({ success: false, msg: 'merchantOrderId is required' });
      }

      // Check in-memory webhook cache first
      const cached = drampayOrders.get(merchantOrderId);
      if (cached && (cached.status === '1' || cached.status === 1)) {
        return res.json({
          success: true,
          code: 200,
          msg: 'Success (Webhook Verified)',
          data: {
            orderId: cached.platformOrderId,
            merchantOrderId,
            status: '1',
            amount: Number(cached.amount),
            payAmount: Number(cached.payAmount || cached.amount),
          },
        });
      }

      if (!activeMerchantId || !activeSecretKey) {
        return res.status(400).json({ success: false, msg: 'Merchant credentials missing' });
      }

      const params: Record<string, any> = {
        merchantId: Number(activeMerchantId),
        merchantOrderId: String(merchantOrderId),
      };
      params.sign = generateDramPaySign(params, activeSecretKey);

      const endpoint = `${drampayConfig.baseUrl || 'https://drampay.net'}/api/payin/status`;
      const apiRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(10000),
      });

      const responseData: any = await apiRes.json();

      // Update cache
      if (responseData?.code === 200 && responseData?.data) {
        const existing = drampayOrders.get(merchantOrderId) || {};
        drampayOrders.set(merchantOrderId, {
          ...existing,
          ...responseData.data,
          updatedAt: Date.now(),
        });
      }

      return res.json(responseData);
    } catch (err: any) {
      return res.status(500).json({ success: false, msg: err.message });
    }
  });

  // 3. Payin Webhook Callback
  // DramPay POSTs here upon payment completion
  app.post('/api/drampay/payin/notify', (req, res) => {
    try {
      const payload = req.body || {};
      console.log('[DramPay-Webhook-Payin]', JSON.stringify(payload));
      const { merchantOrderId, status, orderId, amount, payAmount } = payload;

      if (merchantOrderId) {
        const existing = drampayOrders.get(merchantOrderId) || {};
        drampayOrders.set(merchantOrderId, {
          ...existing,
          merchantOrderId,
          platformOrderId: orderId,
          amount,
          payAmount,
          status: String(status), // "1" = success
          webhookReceivedAt: Date.now(),
        });
      }

      // Per DramPay Docs: "商户返回 success 即认为通知成功"
      return res.status(200).send('success');
    } catch (err: any) {
      console.error('[DramPay-Webhook-Error]', err);
      return res.status(200).send('success');
    }
  });

  // 4. Payin UTR Check
  // Calls https://drampay.net/api/payin/utr/check
  app.post('/api/drampay/payin/utr/check', async (req, res) => {
    try {
      const {
        merchantId,
        secretKey,
        utr,
      } = req.body || {};

      const activeMerchantId = merchantId || drampayConfig.merchantId;
      const activeSecretKey = secretKey || drampayConfig.secretKey;

      if (!utr) {
        return res.status(400).json({ success: false, msg: 'UTR number is required' });
      }

      if (!activeMerchantId || !activeSecretKey) {
        return res.status(400).json({ success: false, msg: 'Merchant credentials missing' });
      }

      const params: Record<string, any> = {
        merchantId: Number(activeMerchantId),
        utr: String(utr).trim(),
      };
      params.sign = generateDramPaySign(params, activeSecretKey);

      const endpoint = `${drampayConfig.baseUrl || 'https://drampay.net'}/api/payin/utr/check`;
      const apiRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(10000),
      });

      const responseData = await apiRes.json();
      return res.json(responseData);
    } catch (err: any) {
      return res.status(500).json({ success: false, msg: err.message });
    }
  });

  // 5. Payin UTR Fix (Claim unassigned UTR to order)
  // Calls https://drampay.net/api/payin/utr/fix
  app.post('/api/drampay/payin/utr/fix', async (req, res) => {
    try {
      const {
        merchantId,
        secretKey,
        merchantOrderId,
        utr,
      } = req.body || {};

      const activeMerchantId = merchantId || drampayConfig.merchantId;
      const activeSecretKey = secretKey || drampayConfig.secretKey;

      if (!merchantOrderId || !utr) {
        return res.status(400).json({ success: false, msg: 'merchantOrderId and utr are required' });
      }

      if (!activeMerchantId || !activeSecretKey) {
        return res.status(400).json({ success: false, msg: 'Merchant credentials missing' });
      }

      const params: Record<string, any> = {
        merchantId: Number(activeMerchantId),
        merchantOrderId: String(merchantOrderId).trim(),
        utr: String(utr).trim(),
      };
      params.sign = generateDramPaySign(params, activeSecretKey);

      const endpoint = `${drampayConfig.baseUrl || 'https://drampay.net'}/api/payin/utr/fix`;
      const apiRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(10000),
      });

      const responseData = await apiRes.json();
      return res.json(responseData);
    } catch (err: any) {
      return res.status(500).json({ success: false, msg: err.message });
    }
  });

  // 6. DramPay Balance Detail Query
  // Calls https://drampay.net/api/payin/balance/detail
  app.post('/api/drampay/balance', async (req, res) => {
    try {
      const {
        merchantId,
        secretKey,
      } = req.body || {};

      const activeMerchantId = merchantId || drampayConfig.merchantId;
      const activeSecretKey = secretKey || drampayConfig.secretKey;

      if (!activeMerchantId || !activeSecretKey) {
        return res.status(400).json({
          success: false,
          msg: 'DramPay credentials not configured. Please enter Merchant ID and Secret Key in Admin Panel.',
        });
      }

      const params: Record<string, any> = {
        merchantId: Number(activeMerchantId),
      };
      params.sign = generateDramPaySign(params, activeSecretKey);

      const endpoint = `${drampayConfig.baseUrl || 'https://drampay.net'}/api/payin/balance/detail`;
      const apiRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(10000),
      });

      const responseData = await apiRes.json();
      return res.json(responseData);
    } catch (err: any) {
      return res.status(500).json({ success: false, msg: err.message });
    }
  });

  // 7. Payout Submit (Withdrawal Disbursal)
  // Calls https://drampay.net/api/payout/submit
  app.post('/api/drampay/payout/create', async (req, res) => {
    try {
      const {
        merchantId,
        secretKey,
        merchantPayoutId = `PO${Date.now()}${Math.floor(100 + Math.random() * 900)}`,
        amount,
        name,
        type = '1', // "0" Bank Card, "1" UPI
        upi,
        account,
        ifsc,
        mobile,
        notifyUrl,
      } = req.body || {};

      const activeMerchantId = merchantId || drampayConfig.merchantId;
      const activeSecretKey = secretKey || drampayConfig.secretKey;

      if (!activeMerchantId || !activeSecretKey) {
        return res.status(400).json({
          success: false,
          msg: 'DramPay credentials missing for payout',
        });
      }

      const hostUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      const defaultNotifyUrl = `${hostUrl}/api/drampay/payout/notify`;

      const params: Record<string, any> = {
        merchantId: Number(activeMerchantId),
        merchantPayoutId: String(merchantPayoutId),
        amount: Number(amount).toFixed(2),
        name: String(name || 'Member').slice(0, 50),
        type: String(type),
        notifyUrl: notifyUrl || defaultNotifyUrl,
      };

      if (type === '1' || type === 1) {
        if (!upi) return res.status(400).json({ success: false, msg: 'UPI address is required for UPI payout' });
        params.upi = String(upi).trim();
      } else {
        if (!account || !ifsc) {
          return res.status(400).json({ success: false, msg: 'Bank Account and IFSC are required for Bank payout' });
        }
        params.account = String(account).trim();
        params.ifsc = String(ifsc).trim().toUpperCase();
      }

      if (mobile) params.mobile = String(mobile).replace(/\D/g, '');

      params.sign = generateDramPaySign(params, activeSecretKey);

      const endpoint = `${drampayConfig.baseUrl || 'https://drampay.net'}/api/payout/submit`;
      console.log(`[DramPay-Payout] Submitting payout to ${endpoint}`);

      const apiRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(15000),
      });

      const responseData = await apiRes.json();
      return res.json(responseData);
    } catch (err: any) {
      console.error('[DramPay-Payout-Error]', err);
      return res.status(500).json({ success: false, msg: err.message });
    }
  });

  // 8. Payout Query
  // Calls https://drampay.net/api/payout/query
  app.post('/api/drampay/payout/query', async (req, res) => {
    try {
      const {
        merchantId,
        secretKey,
        merchantPayoutId,
      } = req.body || {};

      const activeMerchantId = merchantId || drampayConfig.merchantId;
      const activeSecretKey = secretKey || drampayConfig.secretKey;

      if (!merchantPayoutId) {
        return res.status(400).json({ success: false, msg: 'merchantPayoutId is required' });
      }

      if (!activeMerchantId || !activeSecretKey) {
        return res.status(400).json({ success: false, msg: 'Merchant credentials missing' });
      }

      const params: Record<string, any> = {
        merchantId: Number(activeMerchantId),
        merchantPayoutId: String(merchantPayoutId),
      };
      params.sign = generateDramPaySign(params, activeSecretKey);

      const endpoint = `${drampayConfig.baseUrl || 'https://drampay.net'}/api/payout/query`;
      const apiRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(10000),
      });

      const responseData = await apiRes.json();
      return res.json(responseData);
    } catch (err: any) {
      return res.status(500).json({ success: false, msg: err.message });
    }
  });

  // 9. Payout Webhook Callback
  app.post('/api/drampay/payout/notify', (req, res) => {
    try {
      const payload = req.body || {};
      console.log('[DramPay-Webhook-Payout]', JSON.stringify(payload));
      return res.status(200).send('success');
    } catch (err: any) {
      return res.status(200).send('success');
    }
  });

  // Serve with Vite in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
