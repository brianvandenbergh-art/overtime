import crypto from 'crypto';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const APP_ID = process.env.IKHOKHA_APP_ID;
const APP_SECRET = process.env.IKHOKHA_APP_SECRET;
const ENTITY_ID = process.env.IKHOKHA_ENTITY_ID;
const MODE = process.env.IKHOKHA_MODE || 'test';
const API_URL = process.env.IKHOKHA_API_URL || 'https://api.ikhokha.com/public-api/v1/api/payment';
const WEBHOOK_BASE = process.env.WEBHOOK_BASE_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Create HMAC-SHA256 signature required by iKhokha
 */
function createSignature(payloadToSign) {
  return crypto
    .createHmac('sha256', APP_SECRET.trim())
    .update(payloadToSign)
    .digest('hex');
}

/**
 * Create a one-time payment link for a subscription
 * Amount is in ZAR (we convert to cents)
 */
export async function createPaymentLink({ amountZar, description, externalTxId, companyId }) {
  if (!APP_ID || !APP_SECRET) {
    throw new Error('iKhokha credentials not configured');
  }

  const amountCents = Math.round(amountZar * 100);
  const externalTransactionID = externalTxId || `OTSA-${companyId}-${uuidv4().slice(0, 8)}`;

  const request = {
    entityID: ENTITY_ID || APP_ID,
    amount: amountCents,
    currency: 'ZAR',
    requesterUrl: FRONTEND_URL,
    description: description || 'OvertimeSA Subscription',
    mode: MODE,
    externalTransactionID,
    urls: {
      callbackUrl: `${WEBHOOK_BASE}/api/payments/webhook`,
      successPageUrl: `${FRONTEND_URL}/payment/success?tx=${externalTransactionID}`,
      failurePageUrl: `${FRONTEND_URL}/payment/failed?tx=${externalTransactionID}`,
      cancelUrl: `${FRONTEND_URL}/payment/cancel`
    }
  };

  const body = JSON.stringify(request);
  // iKhokha expects a specific payload-to-sign format – see their Node example
  const payloadToSign = body; // simplified; adjust if their docs require path + body
  const signature = createSignature(payloadToSign);

  const response = await axios.post(API_URL, request, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'IK-APPID': APP_ID.trim(),
      'IK-SIGN': signature
    }
  });

  return {
    paylinkUrl: response.data.paylinkUrl,
    paylinkID: response.data.paylinkID,
    externalTransactionID: response.data.externalTransactionID || externalTransactionID,
    responseCode: response.data.responseCode
  };
}

/**
 * Plans pricing (ZAR)
 */
export const PLANS = {
  basic: { name: 'Basic', amount: 99, maxUsers: 20 },
  pro: { name: 'Pro', amount: 199, maxUsers: 50 },
  enterprise: { name: 'Enterprise', amount: 499, maxUsers: 9999 }
};
