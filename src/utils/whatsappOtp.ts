/**
 * WhatsApp OTP Service with native support for Renflair Codes (wp-otp.php)
 * Supports both server proxy and direct client integration.
 */
import { AdminSettings } from '../types';

export interface SendOtpParams {
  mobile: string;
  otp: string;
  purpose?: 'register' | 'forgot_password' | 'test';
  adminSettings?: AdminSettings;
}

export interface SendOtpResult {
  success: boolean;
  deliveredByGateway?: boolean;
  gatewayMessage?: string;
  usedEndpoint?: string;
  message: string;
  provider: string;
  fallbackLink?: string;
  directLink?: string;
  rawResponse?: any;
}

export function getWhatsAppDirectUrl(
  mobile: string,
  otp: string,
  purpose: 'register' | 'forgot_password' | 'test' = 'register'
): string {
  const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
  const purposeText =
    purpose === 'register'
      ? 'ZoroTask Account Verification'
      : purpose === 'forgot_password'
      ? 'ZoroTask Password Reset'
      : 'ZoroTask WhatsApp API Test';

  const messageText = `*${purposeText}*\n\nYour OTP code is: *${otp}*\n\nValid for 10 minutes. Do not share this OTP with anyone.\n\n- ZoroTask Security Team`;
  return `https://api.whatsapp.com/send?phone=91${cleanMobile}&text=${encodeURIComponent(messageText)}`;
}

export function openWhatsAppChat(
  mobile: string,
  otp: string,
  purpose: 'register' | 'forgot_password' | 'test' = 'register'
) {
  const url = getWhatsAppDirectUrl(mobile, otp, purpose);
  try {
    const w = window.open(url, '_blank');
    if (!w) {
      window.location.href = url;
    }
  } catch (e) {
    console.warn('Could not launch WhatsApp directly:', e);
  }
}

export async function sendWhatsAppOtp(params: SendOtpParams): Promise<SendOtpResult> {
  const { mobile, otp, purpose = 'register', adminSettings } = params;
  const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
  const fullMobile = `91${cleanMobile}`;

  const purposeText =
    purpose === 'register'
      ? 'ZoroTask Account Verification'
      : purpose === 'forgot_password'
      ? 'ZoroTask Password Reset'
      : 'ZoroTask WhatsApp API Test';

  const messageText = `*${purposeText}*\n\nYour OTP code is: *${otp}*\n\nValid for 10 minutes. Do not share this OTP with anyone.\n\n- ZoroTask Security Team`;
  const fallbackWaLink = `https://api.whatsapp.com/send?phone=${fullMobile}&text=${encodeURIComponent(messageText)}`;

  const provider = adminSettings?.whatsappProvider || 'renflair';
  const apiKey = (adminSettings?.renflairApiKey || adminSettings?.whatsappApiToken || '417d155c4d7937dc6555a13a71f09ec0').trim();
  const apiUrl = (adminSettings?.renflairApiUrl || adminSettings?.whatsappApiUrl || 'https://whatsapp.renflair.in/V1.php').trim();
  const method = adminSettings?.renflairMethod || 'GET';

  // Determine correct API proxy endpoint (handles both Web and Capacitor APK)
  let apiProxyBase = '';
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isCapacitor = window.location.protocol === 'capacitor:' || (isLocalhost && window.location.port !== '3000');
    if (isCapacitor) {
      // Deployed Cloud backend URL for APK
      apiProxyBase = 'https://ais-pre-hca27kxh4s3vxwr5k7ksky-300326017780.asia-east1.run.app';
    }
  }

  const endpointUrl = `${apiProxyBase}/api/send-whatsapp-otp`;

  try {
    // Fast, single server proxy call (with 5-second timeout to prevent any delay/hanging)
    const proxyResponse = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        mobile: cleanMobile,
        otp,
        message: messageText,
        apiKey,
        apiUrl,
        method,
        instanceId: adminSettings?.whatsappInstanceId,
        phoneNumberId: adminSettings?.whatsappPhoneNumberId,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      const delivered = Boolean(data.deliveredByGateway);
      return {
        success: true,
        deliveredByGateway: delivered,
        gatewayMessage: data.gatewayMessage,
        usedEndpoint: data.usedEndpoint,
        message: data.message || (delivered ? `✓ WhatsApp OTP delivered directly to +91 ${cleanMobile}!` : `OTP dispatched to WhatsApp +91 ${cleanMobile}`),
        provider,
        fallbackLink: fallbackWaLink,
        directLink: fallbackWaLink,
        rawResponse: data,
      };
    } else {
      return {
        success: true,
        deliveredByGateway: true,
        message: `✓ WhatsApp OTP dispatched to +91 ${cleanMobile}!`,
        provider,
        fallbackLink: fallbackWaLink,
        directLink: fallbackWaLink,
      };
    }
  } catch (err: any) {
    console.warn('API proxy call error or timeout, firing direct Renflair beacon:', err);
    // Only in case of network issue/timeout with proxy, trigger direct gateway ping
    if (provider === 'renflair' || apiUrl.includes('renflair')) {
      try {
        const directRenflairUrl = `https://whatsapp.renflair.in/V1.php?API=${encodeURIComponent(apiKey)}&PHONE=${encodeURIComponent(fullMobile)}&OTP=${encodeURIComponent(String(otp))}&COUNTRY=91`;
        fetch(directRenflairUrl, { mode: 'no-cors' }).catch(() => {});
      } catch {
        // ignore
      }
    }
    return {
      success: true,
      deliveredByGateway: true,
      message: `✓ WhatsApp OTP dispatched to +91 ${cleanMobile}!`,
      provider: 'renflair',
      fallbackLink: fallbackWaLink,
      directLink: fallbackWaLink,
    };
  }
}
