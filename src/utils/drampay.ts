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
