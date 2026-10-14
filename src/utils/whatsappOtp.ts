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
  message: string;
  provider: string;
  fallbackLink?: string;
  rawResponse?: any;
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

  try {
    // Call server-side API proxy (bypasses browser CORS)
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
    });

    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      return {
        success: !!data.success,
        message: data.success
          ? `✓ WhatsApp OTP delivered directly to +91 ${cleanMobile} via ${provider.toUpperCase()}!`
          : data.error || (data.simulated ? 'Simulated OTP dispatch' : 'WhatsApp gateway returned failed status'),
        provider,
        fallbackLink: data.fallbackLink || fallbackWaLink,
        rawResponse: data,
      };
    } else {
      const errJson = await proxyResponse.json().catch(() => null);
      return {
        success: false,
        message: errJson?.error || `Gateway server responded with status ${proxyResponse.status}`,
        provider,
        fallbackLink: fallbackWaLink,
      };
    }
  } catch (err: any) {
    console.warn('API proxy call error:', err);
    return {
      success: false,
      message: err?.message || 'Network error connecting to WhatsApp gateway proxy',
      provider,
      fallbackLink: fallbackWaLink,
    };
  }
}
