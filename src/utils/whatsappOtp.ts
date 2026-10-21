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
  const rawApiUrl = (adminSettings?.renflairApiUrl || adminSettings?.whatsappApiUrl || '').trim();
  const apiUrl = (!rawApiUrl || rawApiUrl.includes('whatsapp.renflair.in') || rawApiUrl.includes('wp-otp.php') || rawApiUrl.includes('renflair'))
    ? 'https://whatsapp.renflair.in/V1.php'
    : rawApiUrl;
  const method = adminSettings?.renflairMethod || 'GET';

  // DIRECT DUAL-DISPATCH BEACON:
  // Fire directly to Renflair WhatsApp API via Image beacon from the browser/WebView with COUNTRY=91.
  const directRenflairUrl = `https://whatsapp.renflair.in/V1.php?API=${encodeURIComponent(apiKey)}&PHONE=${encodeURIComponent(cleanMobile)}&OTP=${encodeURIComponent(String(otp))}&COUNTRY=91`;
  try {
    if (typeof Image !== 'undefined') {
      const beacon = new Image();
      beacon.src = `${directRenflairUrl}&_ts=${Date.now()}`;
    }
    if (typeof fetch !== 'undefined') {
      fetch(directRenflairUrl, { method: 'GET', mode: 'no-cors' }).catch(() => {});
    }
  } catch {}

  // Dispatch via Server-side proxy with 11-second timeout
  try {
    const proxyResponse = await fetch('/api/send-whatsapp-otp', {
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
      signal: AbortSignal.timeout(11000),
    });

    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      return {
        success: Boolean(data.success),
        deliveredByGateway: Boolean(data.deliveredByGateway),
        gatewayMessage: data.gatewayMessage,
        usedEndpoint: data.usedEndpoint,
        message: data.message || `✓ WhatsApp OTP sent to +91 ${cleanMobile}`,
        provider,
        fallbackLink: data.fallbackLink || fallbackWaLink,
        directLink: data.directLink || fallbackWaLink,
        rawResponse: data,
      };
    } else {
      const errText = await proxyResponse.text();
      return {
        success: false,
        deliveredByGateway: false,
        gatewayMessage: `Server error (${proxyResponse.status})`,
        message: `HTTP ${proxyResponse.status}: ${errText.slice(0, 80)}`,
        provider,
        fallbackLink: fallbackWaLink,
        directLink: fallbackWaLink,
      };
    }
  } catch (err: any) {
    console.warn('WhatsApp server proxy dispatch warning:', err.message);
    return {
      success: false,
      deliveredByGateway: false,
      gatewayMessage: err.message || 'Network error',
      message: `Failed to contact OTP server: ${err.message}`,
      provider,
      fallbackLink: fallbackWaLink,
      directLink: fallbackWaLink,
    };
  }
}
