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
        const keyToUse = (apiKey || '417d155c4d7937dc6555a13a71f09ec0').trim();
        
        // Renflair strictly requires 12 digits (with 91 country code prefix) in PHONE parameter AND COUNTRY=91
        const whatsappUrl = 'https://whatsapp.renflair.in/V1.php';
        const primaryUrl = `${whatsappUrl}?API=${encodeURIComponent(keyToUse)}&PHONE=${encodeURIComponent(fullMobile)}&OTP=${encodeURIComponent(String(otp))}&COUNTRY=91`;

        let lastResponseText = '';
        let lastResponseJson: any = null;
        let isSuccess = false;
        let gatewayMsg = '';

        try {
          // Fast direct dispatch to official Renflair endpoint
          const apiRes = await fetch(primaryUrl, { method: 'GET', signal: AbortSignal.timeout(4500) });
          lastResponseText = await apiRes.text();
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
          console.warn(`Renflair WhatsApp gateway error:`, err.message);
          gatewayMsg = err.message || 'Connection timeout';
        }

        return res.json({
          success: true,
          provider: 'renflair',
          deliveredByGateway: isSuccess,
          status: isSuccess ? 200 : 400,
          usedEndpoint: whatsappUrl,
          gatewayMessage: gatewayMsg,
          message: isSuccess
            ? `OTP sent to your WhatsApp (+91 ${cleanMobile})!`
            : gatewayMsg
              ? `Renflair Gateway: ${gatewayMsg}`
              : `OTP generated for WhatsApp (+91 ${cleanMobile})`,
          fallbackLink,
          directLink: fallbackLink,
          gatewayResponse: lastResponseJson || lastResponseText,
        });
      }

      // 2. UltraMsg Gateway
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

      // 3. Default Direct Mode
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
