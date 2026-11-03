/**
 * QO Pay Payment Gateway Utilities & Direct Client-Side API Handler
 * Official Gateway: https://qo-pay.com
 *
 * Supports direct client-side requests from Browser & Android APK WebView:
 * - Direct Payin Order Creation (/api/create-order)
 * - Direct Live Order Status Verification (/api/order-status)
 * - Direct Automated Payout Disbursal (/api/create-payout)
 * - Full CORS enabled by gateway (access-control-allow-origin: *)
 */

export interface QoPayCreateOrderParams {
  userToken: string;
  amount: number;
  orderId: string;
  customerMobile?: string;
  customerName?: string;
  customerEmail?: string;
  redirectUrl?: string;
  remark1?: string;
  remark2?: string;
  baseUrl?: string;
}

export interface QoPayCreateOrderResult {
  success: boolean;
  orderId: string;
  paymentUrl?: string;
  upiIntent?: string;
  deeplink?: string;
  deeplinks?: {
    upi?: string;
    gpay?: string;
    phonepe?: string;
    paytm?: string;
    bhim?: string;
  };
  message?: string;
  raw?: any;
}

export interface QoPayStatusResult {
  success: boolean;
  isPaid: boolean;
  status: string;
  utr?: string;
  amount?: number;
  message?: string;
  raw?: any;
}

/**
 * Direct Client-Side call to create QO Pay order
 * Bypasses backend server completely to ensure 100% reliable operation
 * inside Android APK WebView and local environments.
 */
export async function callDirectQoPayCreateOrder(
  params: QoPayCreateOrderParams
): Promise<QoPayCreateOrderResult> {
  const {
    userToken,
    amount,
    orderId,
    customerMobile = '9876543210',
    customerName = 'Member',
    customerEmail = 'member@zorotask.com',
    redirectUrl = typeof window !== 'undefined' ? window.location.href : 'https://qo-pay.com',
    remark1 = 'ZoroTask Deposit',
    remark2 = orderId,
    baseUrl = 'https://qo-pay.com',
  } = params;

  const cleanBase = (baseUrl || 'https://qo-pay.com').replace(/\/+$/, '');
  const activeToken = String(userToken || '').trim();
  const numAmount = Number(amount);

  if (!activeToken) {
    return {
      success: false,
      orderId,
      message: 'QO Pay User Token is missing. Please enter your valid token in Admin Panel.',
    };
  }

  if (numAmount < 100) {
    return {
      success: false,
      orderId,
      message: 'QO Pay requires a minimum recharge of ₹100. Please enter ₹100 or more, or use Manual QR mode.',
    };
  }

  const endpoint = `${cleanBase}/api/create-order`;
  const payload = {
    user_token: activeToken,
    amount: numAmount.toFixed(2),
    order_id: orderId,
    customer_mobile: String(customerMobile).replace(/\D/g, '').slice(-10) || '9876543210',
    customer_name: String(customerName || 'ZoroTask Member').trim(),
    customer_email: String(customerEmail || 'member@zorotask.com').trim(),
    redirect_url: redirectUrl,
    remark1: String(remark1 || 'ZoroTask Deposit').trim(),
    remark2: String(remark2 || orderId).trim(),
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(16000),
    });

    const rawText = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(rawText);
    } catch {
      return {
        success: false,
        orderId,
        message: 'Invalid gateway response received from QO Pay.',
        raw: rawText,
      };
    }

    const resultObj = data?.result || data?.data || data || {};
    const paymentUrl =
      resultObj.payment_url ||
      resultObj.url ||
      resultObj.pay_url ||
      data?.payment_url ||
      null;

    const deeplinks = resultObj.deeplinks || {};
    const upiIntent = deeplinks.upi || resultObj.upi_intent || resultObj.upi || paymentUrl;

    if (data?.status === true || Boolean(paymentUrl)) {
      return {
        success: true,
        orderId,
        paymentUrl,
        upiIntent,
        deeplink: upiIntent,
        deeplinks,
        message: data?.message || 'QO Pay order initialized successfully',
        raw: data,
      };
    }

    return {
      success: false,
      orderId,
      message: data?.message || 'QO Pay failed to generate order. Please verify your token.',
      raw: data,
    };
  } catch (err: any) {
    return {
      success: false,
      orderId,
      message: err.message || 'Direct connection to QO Pay gateway timed out.',
    };
  }
}

/**
 * Direct Client-Side check of QO Pay Order Status
 * Uses GET https://qo-pay.com/api/order-status?user_token=...&order_id=...
 */
export async function callDirectQoPayStatusCheck(
  userToken: string,
  orderId: string,
  baseUrl = 'https://qo-pay.com'
): Promise<QoPayStatusResult> {
  const cleanBase = (baseUrl || 'https://qo-pay.com').replace(/\/+$/, '');
  const activeToken = String(userToken || '').trim();

  if (!activeToken || !orderId) {
    return {
      success: false,
      isPaid: false,
      status: 'PENDING',
      message: 'Missing userToken or orderId for status check',
    };
  }

  const queryUrl = `${cleanBase}/api/order-status?user_token=${encodeURIComponent(
    activeToken
  )}&order_id=${encodeURIComponent(orderId)}`;

  try {
    const res = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(12000),
    });

    const rawText = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(rawText);
    } catch {
      return {
        success: false,
        isPaid: false,
        status: 'PENDING',
        message: 'Could not parse QO Pay status response',
        raw: rawText,
      };
    }

    const resultObj = data?.result || data?.data || data || {};
    const paymentStatus = String(
      resultObj.payment_status ||
      data?.payment_status ||
      resultObj.status ||
      ''
    ).toUpperCase();

    const utr =
      resultObj.utr && resultObj.utr !== 'null'
        ? String(resultObj.utr)
        : resultObj.bank_ref_no || resultObj.rrn || '';

    const isPaid =
      paymentStatus === 'SUCCESS' ||
      paymentStatus === 'COMPLETED' ||
      paymentStatus === 'PAID' ||
      Boolean(utr && utr.length >= 8);

    return {
      success: data?.status === true || isPaid,
      isPaid,
      status: paymentStatus || (isPaid ? 'SUCCESS' : 'PENDING'),
      utr,
      amount: resultObj.amount || data?.amount,
      message: data?.message || (isPaid ? 'Payment Confirmed' : 'Payment Pending'),
      raw: data,
    };
  } catch (err: any) {
    return {
      success: false,
      isPaid: false,
      status: 'PENDING',
      message: err.message || 'Status check connection error',
    };
  }
}

/**
 * Direct Client-Side call to disburse QO Pay payout
 */
export async function callDirectQoPayPayout(
  userToken: string,
  amount: number,
  orderId: string,
  accountNumber: string,
  ifsc = 'UPI',
  beneficiaryName = 'Member',
  remark = 'ZoroTask Withdrawal Payout',
  baseUrl = 'https://qo-pay.com'
): Promise<{ success: boolean; utr?: string; payoutId?: string; message: string; raw?: any }> {
  const cleanBase = (baseUrl || 'https://qo-pay.com').replace(/\/+$/, '');
  const activeToken = String(userToken || '').trim();

  try {
    const res = await fetch(`${cleanBase}/api/create-payout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        user_token: activeToken,
        amount: Number(amount).toFixed(2),
        order_id: orderId,
        account_number: String(accountNumber).trim(),
        ifsc: String(ifsc || 'UPI').trim(),
        beneficiary_name: String(beneficiaryName || 'Customer').trim(),
        remark: String(remark || 'Withdrawal Disbursed').trim(),
      }),
      signal: AbortSignal.timeout(18000),
    });

    const rawText = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(rawText);
    } catch {
      return { success: false, message: 'Invalid response from QO Pay Payout API' };
    }

    const resultObj = data?.result || data?.data || data || {};
    const utr = resultObj.utr || resultObj.bank_ref_no || '';
    const payoutId = resultObj.payout_id || resultObj.order_id || orderId;

    return {
      success: data?.status === true,
      payoutId,
      utr,
      message: data?.message || (data?.status ? 'Payout initiated' : 'Payout request rejected'),
      raw: data,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Payout connection timed out' };
  }
}
