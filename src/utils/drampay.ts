/**
 * DramPay Payment Gateway Integration Utilities & Type Definitions
 * Official Docs: https://drampay.net/doc/doc.html
 *
 * Supports:
 * - Payin: Order Creation, UPI Deeplink, Cashier URL, Payment Status, UTR Check, UTR Fix, Balance
 * - Payout: Automated Withdrawals via UPI and Bank Account (IFSC)
 * - Signatures: MD5 ASCII sorted key-value hashing
 */

export interface DramPayPayinSubmitParams {
  merchantId: number | string;
  merchantOrderId: string;
  amount: string; // e.g. "100.00"
  notifyUrl?: string;
  returnUrl?: string;
  name?: string;
  mobile?: string;
  email?: string;
  deeplink?: boolean;
  clientIp?: string;
  userAgent?: string;
  mode?: string; // 'fz' | 'ptm'
  payType?: string;
  sign?: string;
}

export interface DramPayPayinSubmitResponse {
  code: number;
  msg: string;
  data?: {
    payUrl?: string;
    orderId?: string;
    message?: string;
    status?: string; // "0" waiting, "1" success, "2" failed
    channelId?: number;
    deeplink?: string;
  };
}

export interface DramPayPayinStatusResponse {
  code: number;
  msg: string;
  data?: {
    orderId?: string;
    merchantOrderId?: string;
    message?: string;
    status?: string; // "0" pending, "1" paid, "2" expired
    amount?: number;
    payAmount?: number;
  };
}

export interface DramPayPayinNotifyPayload {
  merchantId: number | string;
  merchantOrderId: string;
  amount: string;
  payAmount?: string;
  orderId: string;
  status: string; // "0" wait, "1" success, "2" fail
  msg?: string;
  payTime?: string;
  sign: string;
}

export interface DramPayPayoutSubmitParams {
  merchantId: number | string;
  merchantPayoutId: string;
  amount: string;
  notifyUrl?: string;
  name: string;
  type: string; // "0" Bank Card, "1" UPI
  account?: string;
  ifsc?: string;
  upi?: string;
  bankCode?: string;
  mobile?: string;
  sign?: string;
}

export interface DramPayPayoutSubmitResponse {
  code: number;
  msg: string;
  data?: {
    payoutId?: string;
    merchantPayoutId?: string;
    type?: string;
    status?: string; // "0" waiting, "1" success, "2" failed
    msg?: string;
    amount?: string;
    utr?: string;
  };
}

export interface DramPayPayoutQueryResponse {
  code: number;
  msg: string;
  data?: {
    payoutId?: string;
    merchantPayoutId?: string;
    type?: string;
    status?: string;
    msg?: string;
    amount?: string;
    utr?: string;
  };
}

export interface DramPayUtrCheckResponse {
  code: number;
  msg: string;
  data?: {
    utr?: string;
    amount?: number;
    status?: string; // "0" pending claim, "1" claimed, "2" does not exist
    matchOrderId?: string;
  };
}

export interface DramPayBalanceDetailResponse {
  code: number;
  msg: string;
  data?: {
    totalPayAmount?: number;
    totalFeeAmount?: number;
    settleableAmount?: number;
    settledAmount?: number;
    balance?: number;
    channels?: Array<{
      channelId?: number;
      channelName?: string;
      totalPayAmount?: number;
      feeAmount?: number;
      settleableAmount?: number;
      settledAmount?: number;
      balance?: number;
    }>;
  };
}

export const BACKEND_FALLBACK_URL =
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_APP_URL || import.meta.env?.APP_URL)) ||
  (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('capacitor:') && !window.location.origin.includes('localhost') ? window.location.origin : '') ||
  'https://ais-pre-cgdga3yv2d33dg4wlq3ahi-300326017780.asia-east1.run.app';

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined') {
    // If in standalone Capacitor native app without an origin host or on local device
    const isCapacitorOrLocal =
      window.location.protocol === 'capacitor:' ||
      window.location.protocol === 'ionic:' ||
      window.location.protocol === 'file:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    if (isCapacitorOrLocal) {
      return `${BACKEND_FALLBACK_URL}${cleanPath}`;
    }
  }
  // Standard web browser / WebView: relative path hits Express server directly
  return cleanPath;
}

// Pure JS MD5 Algorithm for browser & Android WebView client signing
export function pureJsMd5(string: string): string {
  function rotateLeft(lValue: number, iShiftBits: number) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }
  function addUnsigned(lX: number, lY: number) {
    const lX4 = (lX & 0x40000000);
    const lY4 = (lY & 0x40000000);
    const lX8 = (lX & 0x80000000);
    const lY8 = (lY & 0x80000000);
    const lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
    if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
      else return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
    } else return (lResult ^ lX8 ^ lY8);
  }
  function F(x: number, y: number, z: number) { return (x & y) | ((~x) & z); }
  function G(x: number, y: number, z: number) { return (x & z) | (y & (~z)); }
  function H(x: number, y: number, z: number) { return (x ^ y ^ z); }
  function I(x: number, y: number, z: number) { return (y ^ (x | (~z))); }
  function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function convertToWordArray(str: string) {
    let lWordCount;
    const lMessageLength = str.length;
    const lNumberOfWords_temp1 = lMessageLength + 8;
    const lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    const lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    const lWordArray = Array(lNumberOfWords - 1);
    let lBytePosition = 0;
    let lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition));
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }
  function wordToHex(lValue: number) {
    let WordToHexValue = "", WordToHexValue_temp = "";
    for (let lCount = 0; lCount <= 3; lCount++) {
      const lByte = (lValue >>> (lCount * 8)) & 255;
      WordToHexValue_temp = "0" + lByte.toString(16);
      WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
    }
    return WordToHexValue;
  }
  const x = convertToWordArray(string);
  let a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;
  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;
    a = FF(a, b, c, d, x[k + 0], 7, 0xD76AA478);
    d = FF(d, a, b, c, x[k + 1], 12, 0xE8C7B756);
    c = FF(c, d, a, b, x[k + 2], 17, 0x242070DB);
    b = FF(b, c, d, a, x[k + 3], 22, 0xC1BDCEEE);
    a = FF(a, b, c, d, x[k + 4], 7, 0xF57C0FAF);
    d = FF(d, a, b, c, x[k + 5], 12, 0x4787C62A);
    c = FF(c, d, a, b, x[k + 6], 17, 0xA8304613);
    b = FF(b, c, d, a, x[k + 7], 22, 0xFD469501);
    a = FF(a, b, c, d, x[k + 8], 7, 0x698098D8);
    d = FF(d, a, b, c, x[k + 9], 12, 0x8B44F7AF);
    c = FF(c, d, a, b, x[k + 10], 17, 0xFFFF5BB1);
    b = FF(b, c, d, a, x[k + 11], 22, 0x895CD7BE);
    a = FF(a, b, c, d, x[k + 12], 7, 0x6B901122);
    d = FF(d, a, b, c, x[k + 13], 12, 0xFD987193);
    c = FF(c, d, a, b, x[k + 14], 17, 0xA679438E);
    b = FF(b, c, d, a, x[k + 15], 22, 0x49B40821);
    a = GG(a, b, c, d, x[k + 1], 5, 0xF61E2562);
    d = GG(d, a, b, c, x[k + 6], 9, 0xC040B340);
    c = GG(c, d, a, b, x[k + 11], 14, 0x265E5A51);
    b = GG(b, c, d, a, x[k + 0], 20, 0xE9B6C7AA);
    a = GG(a, b, c, d, x[k + 5], 5, 0xD62F105D);
    d = GG(d, a, b, c, x[k + 10], 9, 0x02441453);
    c = GG(c, d, a, b, x[k + 15], 14, 0xD8A1E681);
    b = GG(b, c, d, a, x[k + 4], 20, 0xE7D3FBC8);
    a = GG(a, b, c, d, x[k + 9], 5, 0x21E1CDE6);
    d = GG(d, a, b, c, x[k + 14], 9, 0xC33707D6);
    c = GG(c, d, a, b, x[k + 3], 14, 0xF4D50D87);
    b = GG(b, c, d, a, x[k + 8], 20, 0x455A14ED);
    a = GG(a, b, c, d, x[k + 13], 5, 0xA9E3E905);
    d = GG(d, a, b, c, x[k + 2], 9, 0xFCEFA3F8);
    c = GG(c, d, a, b, x[k + 7], 14, 0x676F02D9);
    b = GG(b, c, d, a, x[k + 12], 20, 0x8D2A4C8A);
    a = HH(a, b, c, d, x[k + 5], 4, 0xFFFA3942);
    d = HH(d, a, b, c, x[k + 8], 11, 0x8771F681);
    c = HH(c, d, a, b, x[k + 11], 16, 0x6D9D6122);
    b = HH(b, c, d, a, x[k + 14], 23, 0xFDE5380C);
    a = HH(a, b, c, d, x[k + 1], 4, 0xA4BEEA44);
    d = HH(d, a, b, c, x[k + 4], 11, 0x4BDECFA9);
    c = HH(c, d, a, b, x[k + 7], 16, 0xF6BB4B60);
    b = HH(b, c, d, a, x[k + 10], 23, 0xBEBFBC70);
    a = HH(a, b, c, d, x[k + 13], 4, 0x289B7EC6);
    d = HH(d, a, b, c, x[k + 0], 11, 0xEAA127FA);
    c = HH(c, d, a, b, x[k + 3], 16, 0xD4EF3085);
    b = HH(b, c, d, a, x[k + 6], 23, 0x04881D05);
    a = HH(a, b, c, d, x[k + 9], 4, 0xD9D4D039);
    d = HH(d, a, b, c, x[k + 12], 11, 0xE6DB99E5);
    c = HH(c, d, a, b, x[k + 15], 16, 0x1FA27CF8);
    b = HH(b, c, d, a, x[k + 2], 23, 0xC4AC5665);
    a = II(a, b, c, d, x[k + 0], 6, 0xF4292244);
    d = II(d, a, b, c, x[k + 7], 10, 0x432AFF97);
    c = II(c, d, a, b, x[k + 14], 15, 0xAB9423A7);
    b = II(b, c, d, a, x[k + 5], 21, 0xFC93A039);
    a = II(a, b, c, d, x[k + 12], 6, 0x655B59C3);
    d = II(d, a, b, c, x[k + 3], 10, 0x8F0CCC92);
    c = II(c, d, a, b, x[k + 10], 15, 0xFFEFF47D);
    b = II(b, c, d, a, x[k + 1], 21, 0x85845DD1);
    a = II(a, b, c, d, x[k + 8], 6, 0x6FA87E4F);
    d = II(d, a, b, c, x[k + 15], 10, 0xFE2CE6E0);
    c = II(c, d, a, b, x[k + 6], 15, 0xA3014314);
    b = II(b, c, d, a, x[k + 13], 21, 0x4E0811A1);
    a = II(a, b, c, d, x[k + 4], 6, 0xF7537E82);
    d = II(d, a, b, c, x[k + 11], 10, 0xBD3AF235);
    c = II(c, d, a, b, x[k + 2], 15, 0x2AD7D2BB);
    b = II(b, c, d, a, x[k + 9], 21, 0xEB86D391);
    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }
  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

export function generateClientDramPaySign(params: Record<string, any>, secretKey: string): string {
  const keys = Object.keys(params)
    .filter((k) => k !== 'sign' && params[k] !== undefined && params[k] !== null && params[k] !== '')
    .sort();
  const stringA = keys.map((k) => `${k}=${params[k]}`).join('&');
  const stringToSign = `${stringA}&key=${secretKey}`;
  return pureJsMd5(stringToSign);
}

export function sanitizeUpiPayeeName(uri?: string, brandName = 'ZoroTask'): string {
  if (!uri || typeof uri !== 'string' || !uri.startsWith('upi://')) return uri || '';
  return uri.replace(/([?&])pn=([^&]*)/i, (match, prefix, val) => {
    const decoded = decodeURIComponent(val || '');
    if (!decoded || decoded.toLowerCase().includes('test') || decoded.toLowerCase() === 'merchant') {
      return `${prefix}pn=${encodeURIComponent(brandName)}`;
    }
    return match;
  });
}

// Direct Client-Side Fallback Caller (Bypasses backend if local WebView / offline)
export async function callDirectDramPayPayin(
  merchantId: string | number,
  secretKey: string,
  merchantOrderId: string,
  amount: number,
  name = 'ZoroTask Member',
  mobile = ''
): Promise<{ success: boolean; data?: any; msg?: string }> {
  try {
    const formattedAmount = Number(amount).toFixed(2);
    const params: Record<string, any> = {
      merchantId: Number(merchantId) || merchantId,
      merchantOrderId,
      amount: formattedAmount,
      name: String(name).slice(0, 50),
      deeplink: true,
      clientIp: '106.51.12.34',
      userAgent: 'Mozilla/5.0 (Linux; Android 13; Mobile)',
    };
    if (mobile) params.mobile = String(mobile).replace(/\D/g, '').slice(-10);
    params.sign = generateClientDramPaySign(params, secretKey);

    const res = await fetch('https://drampay.net/api/payin/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
      },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(12000),
    });

    const text = await res.text();
    let json: any = {};
    try {
      json = JSON.parse(text);
    } catch {
      return { success: false, msg: `Gateway returned invalid response` };
    }

    if (json.code === 200 && json.data) {
      if (json.data.deeplink) {
        json.data.deeplink = sanitizeUpiPayeeName(json.data.deeplink, 'ZoroTask');
      }
      return {
        success: true,
        data: {
          ...json.data,
          merchantOrderId,
        },
        msg: json.msg || 'Success',
      };
    }

    return {
      success: false,
      msg: json.msg || `DramPay error (Code ${json.code})`,
    };
  } catch (err: any) {
    return {
      success: false,
      msg: err.message || 'Direct DramPay gateway connection timed out',
    };
  }
}
