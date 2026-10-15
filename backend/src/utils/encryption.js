import CryptoJS from 'crypto-js';

const KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

export function encrypt(text) {
  if (!text && text !== 0) return null;
  return CryptoJS.AES.encrypt(String(text), KEY).toString();
}

export function decrypt(ciphertext) {
  if (!ciphertext) return null;
  const bytes = CryptoJS.AES.decrypt(ciphertext, KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Standard SA divisor for monthly → hourly (45h week)
 * 45 * 52 / 12 ≈ 195
 */
export function monthlyToHourly(monthlySalary) {
  if (!monthlySalary || monthlySalary <= 0) return 0;
  return Number((monthlySalary / 195).toFixed(4));
}
