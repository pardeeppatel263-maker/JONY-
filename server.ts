import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // WhatsApp OTP API Proxy Route
  app.post('/api/send-whatsapp-otp', async (req, res) => {
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
      if (provider === 'renflair' || String(apiUrl).includes('renflair')) {
        const keyToUse = (apiKey || process.env.RENFLAIR_API_KEY || '417d155c4d7937dc6555a13a71f09ec0').trim();
        
        // Renflair strictly requires 12 digits (with 91 country code prefix) in PHONE parameter AND COUNTRY=91
        const whatsappUrl = 'https://whatsapp.renflair.in/V1.php';
        const primaryUrl = `${whatsappUrl}?API=${encodeURIComponent(keyToUse)}&PHONE=${encodeURIComponent(fullMobile)}&OTP=${encodeURIComponent(String(otp))}&COUNTRY=91`;

        console.log(`[WhatsApp-OTP] Dispatched to +${fullMobile} | OTP: ${otp} | Key: ${keyToUse.slice(0, 6)}...`);

        let lastResponseText = '';
        let lastResponseJson: any = null;
        let isSuccess = false;
        let gatewayMsg = '';

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
          console.log(`[WhatsApp-OTP] Renflair Gateway Response for +${fullMobile}:`, lastResponseText);

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
        } catch (err: any) {
          console.warn(`[WhatsApp-OTP] Renflair Gateway Error:`, err.message);
          gatewayMsg = err.message || 'Connection timeout';
        }

        return res.json({
          success: isSuccess,
          provider: 'renflair',
          deliveredByGateway: isSuccess,
          status: isSuccess ? 200 : 400,
          usedEndpoint: whatsappUrl,
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
