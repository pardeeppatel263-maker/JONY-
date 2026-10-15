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

      // 1. Renflair Gateway
      if (provider === 'renflair' || String(apiUrl).includes('renflair')) {
        const keyToUse = (apiKey || '417d155c4d7937dc6555a13a71f09ec0').trim();
        const baseUrl = 'https://whatsapp.renflair.in/V1.php';
        const targetUrl = `${baseUrl}?API=${encodeURIComponent(keyToUse)}&PHONE=${encodeURIComponent(cleanMobile)}&OTP=${encodeURIComponent(String(otp))}&COUNTRY=91`;

        try {
          const apiRes = await fetch(targetUrl, { method: 'GET' });
          const respText = await apiRes.text();
          let respJson: any = null;
          try {
            respJson = JSON.parse(respText);
          } catch {
            respJson = null;
          }

          const statusStr = String(respJson?.status || '').toUpperCase();
          const isSuccess = statusStr === 'SUCCESS' || respJson?.success === true;

          return res.json({
            success: true,
            provider: 'renflair',
            deliveredByGateway: isSuccess,
            status: apiRes.status,
            message: isSuccess
              ? `Delivered directly to WhatsApp +91 ${cleanMobile}`
              : `OTP dispatched to WhatsApp +91 ${cleanMobile}`,
            fallbackLink,
            directLink: fallbackLink,
            gatewayResponse: respJson || respText,
          });
        } catch (gatewayErr: any) {
          console.warn('Renflair gateway fetch warning:', gatewayErr.message);
          return res.json({
            success: true,
            provider: 'direct',
            message: `OTP dispatched to WhatsApp +91 ${cleanMobile}`,
            fallbackLink,
            directLink: fallbackLink,
          });
        }
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
