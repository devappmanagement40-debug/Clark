// Display-only examples for the explicitly marked demo accounts.
// No deposits, purchases, commissions, or balances are written for these values.
type DemoReferralPreview = {
  maskedPhone: string;
  vipLevel: number;
  totalInvested: number;
  totalReferralRevenue: number;
};

const examples: Record<string, DemoReferralPreview> = {
  "DEMO-00100001": { maskedPhone: "901***34", vipLevel: 1, totalInvested: 4000, totalReferralRevenue: 1000 },
  "DEMO-00100002": { maskedPhone: "872***56", vipLevel: 3, totalInvested: 15000, totalReferralRevenue: 3750 },
  "DEMO-00200001": { maskedPhone: "904***78", vipLevel: 2, totalInvested: 10000, totalReferralRevenue: 300 },
  "DEMO-00200002": { maskedPhone: "875***19", vipLevel: 4, totalInvested: 25000, totalReferralRevenue: 750 },
  "DEMO-00300001": { maskedPhone: "907***42", vipLevel: 5, totalInvested: 40000, totalReferralRevenue: 800 },
};

export function getDemoReferralPreview(phone: string): DemoReferralPreview | null {
  return examples[phone] || null;
}