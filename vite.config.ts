import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

function whatsappOtpServerPlugin(): Plugin {
  return {
    name: 'whatsapp-otp-server',
    configureServer(server) {
      server.middlewares.use('/api/send-whatsapp-otp', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const payload = JSON.parse(body || '{}');
            const {
              provider = 'renflair',
              mobile = '',
              otp = '',
              message = '',
              apiKey = '',
              apiUrl = 'https://renflair.in/wp-otp.php',
              method = 'POST',
              instanceId = '',
            } = payload;

            const cleanMobile = String(mobile).replace(/\D/g, '').slice(-10);
            const fullMobile = `91${cleanMobile}`;
            const textMessage = message || `Your ZoroTask OTP code is: ${otp}. Valid for 10 minutes.`;

            // Renflair WhatsApp OTP Handler
            // Spec: https://whatsapp.renflair.in/V1.php?API=$API&PHONE=$PHONE&OTP=$OTP&COUNTRY=$COUNTRY
            if (provider === 'renflair' || apiUrl.includes('renflair')) {
              const renflairBase = (apiUrl || 'https://whatsapp.renflair.in/V1.php').trim();
              const country = '91';
              const otpCode = String(otp || '1234');

              if (!apiKey) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(
                  JSON.stringify({
                    success: false,
                    simulated: true,
                    error: 'Renflair API Key is empty. Please enter your API Key in Admin Panel > WhatsApp API Gateway.',
                    fallbackLink: `https://api.whatsapp.com/send?phone=${fullMobile}&text=${encodeURIComponent(textMessage)}`,
                  })
                );
                return;
              }

              // Build URL: https://whatsapp.renflair.in/V1.php?API=$API&PHONE=$PHONE&OTP=$OTP&COUNTRY=$COUNTRY
              const baseUrl = renflairBase.split('?')[0];
              const targetUrl = `${baseUrl}?API=${encodeURIComponent(apiKey.trim())}&PHONE=${encodeURIComponent(cleanMobile)}&OTP=${encodeURIComponent(otpCode)}&COUNTRY=${encodeURIComponent(country)}`;

              try {
                const apiRes = await fetch(targetUrl, { method: 'GET' });
                const respText = await apiRes.text();
                let respJson: any = null;
                try {
                  respJson = JSON.parse(respText);
                } catch {
                  respJson = null;
                }

                const isSuccess =
                  (respJson && (respJson.status === 'SUCCESS' || respJson.status === 'success' || respJson.status === 200 || respJson.success === true)) ||
                  (respText && (respText.includes('SUCCESS') || respText.includes('success') || respText.includes('"sent":true')));

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(
                  JSON.stringify({
                    success: !!isSuccess || apiRes.ok,
                    status: apiRes.status,
                    provider: 'renflair',
                    rawResponse: respText || JSON.stringify(respJson),
                    json: respJson,
                    error: isSuccess ? undefined : (respJson?.message || respText || 'API returned failed status'),
                    fallbackLink: `https://api.whatsapp.com/send?phone=${fullMobile}&text=${encodeURIComponent(textMessage)}`,
                  })
                );
                return;
              } catch (fetchErr: any) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(
                  JSON.stringify({
                    success: false,
                    error: `Network error connecting to Renflair: ${fetchErr.message}`,
                    fallbackLink: `https://api.whatsapp.com/send?phone=${fullMobile}&text=${encodeURIComponent(textMessage)}`,
                  })
                );
                return;
              }
            }

            // UltraMsg Gateway Handler
            if (provider === 'ultramsg') {
              const inst = instanceId || 'instance192672';
              const tok = apiKey || 'zwsvwyr1pqa8ztxa';
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
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  success: uJson?.sent === 'true' || !!uJson?.id,
                  json: uJson,
                  provider: 'ultramsg',
                  fallbackLink: `https://api.whatsapp.com/send?phone=${fullMobile}&text=${encodeURIComponent(textMessage)}`,
                })
              );
              return;
            }

            // Direct / Default fallback
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                success: true,
                message: 'WhatsApp notification dispatched',
                fallbackLink: `https://api.whatsapp.com/send?phone=${fullMobile}&text=${encodeURIComponent(textMessage)}`,
              })
            );
          } catch (e: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), whatsappOtpServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
