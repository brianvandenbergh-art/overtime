/**
 * South African BCEA + tax helpers
 * Tax year: 1 March 2026 – 28 February 2027
 */

// Official SA public holidays (including observed Mondays when holiday falls on Sunday)
export const PUBLIC_HOLIDAYS_2026_2027 = new Set([
  // 2026
  '2026-01-01', // New Year
  '2026-03-21', // Human Rights (Sat)
  '2026-04-03', // Good Friday
  '2026-04-06', // Family Day
  '2026-04-27', // Freedom Day
  '2026-05-01', // Workers' Day
  '2026-06-16', // Youth Day
  '2026-08-09', // National Women's Day (Sun)
  '2026-08-10', // National Women's Day observed
  '2026-09-24', // Heritage Day
  '2026-11-04', // Local Government Elections (special)
  '2026-12-16', // Day of Reconciliation
  '2026-12-25', // Christmas
  '2026-12-26', // Day of Goodwill
  // 2027
  '2027-01-01',
  '2027-03-21',
  '2027-03-22', // Human Rights observed
  '2027-03-26', // Good Friday
  '2027-03-29', // Family Day
  '2027-04-27',
  '2027-05-01',
  '2027-06-16',
  '2027-08-09',
  '2027-09-24',
  '2027-12-16',
  '2027-12-25',
  '2027-12-26',
  '2027-12-27'  // Day of Goodwill observed
]);

/**
 * Auto-detect BCEA multiplier from the date
 * - Public holiday → 2.0
 * - Sunday → 2.0 (assumes Sunday is NOT ordinary working day – most common)
 * - Everything else (Mon–Sat) → 1.5
 */
export function getMultiplierForDate(dateInput) {
  const d = new Date(dateInput);
  const iso = d.toISOString().slice(0, 10); // YYYY-MM-DD

  if (PUBLIC_HOLIDAYS_2026_2027.has(iso)) {
    return { multiplier: 2.0, reason: 'Public holiday' };
  }

  const day = d.getDay(); // 0 = Sunday
  if (day === 0) {
    return { multiplier: 2.0, reason: 'Sunday' };
  }

  return { multiplier: 1.5, reason: 'Weekday / Saturday overtime' };
}

/**
 * 2027 tax year brackets (1 Mar 2026 – 28 Feb 2027)
 */
const TAX_BRACKETS = [
  { upTo: 245100, rate: 0.18, base: 0 },
  { upTo: 383100, rate: 0.26, base: 44118 },
  { upTo: 530200, rate: 0.31, base: 79998 },
  { upTo: 695800, rate: 0.36, base: 125599 },
  { upTo: 887000, rate: 0.39, base: 185215 },
  { upTo: 1878600, rate: 0.41, base: 259783 },
  { upTo: Infinity, rate: 0.45, base: 666339 }
];

const PRIMARY_REBATE = 17820;

/**
 * Estimate annual tax on a given annual taxable income (under 65)
 */
export function estimateAnnualTax(annualIncome) {
  if (!annualIncome || annualIncome <= 0) return 0;
  if (annualIncome <= 99000) return 0; // under threshold

  let tax = 0;
  let prev = 0;
  for (const b of TAX_BRACKETS) {
    if (annualIncome > prev) {
      const taxableInBand = Math.min(annualIncome, b.upTo) - prev;
      tax = b.base + taxableInBand * b.rate;
      if (annualIncome <= b.upTo) break;
    }
    prev = b.upTo;
  }
  return Math.max(0, tax - PRIMARY_REBATE);
}

/**
 * Marginal tax rate for an annual income (used to estimate tax on OT)
 */
export function getMarginalRate(annualIncome) {
  for (const b of TAX_BRACKETS) {
    if (annualIncome <= b.upTo) return b.rate;
  }
  return 0.45;
}

/**
 * Estimate tax that would be withheld on a given overtime amount,
 * assuming the employee already earns `monthlySalary` * 12.
 * This is an APPROXIMATION for display only – real PAYE is done by payroll.
 */
export function estimateTaxOnOvertime(otAmount, monthlySalary = 0) {
  const annual = (monthlySalary || 0) * 12;
  const rate = getMarginalRate(annual + otAmount * 12); // rough
  return Number((otAmount * rate).toFixed(2));
}

/**
 * Generate a short readable invite code
 */
export function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
