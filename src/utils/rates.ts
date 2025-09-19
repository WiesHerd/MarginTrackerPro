import { RateTier } from '@/types';

/**
 * Find the appropriate APR for a given balance using tiered rates
 */
export function pickTierAPR(balance: number, tiers: RateTier[]): number {
  if (balance <= 0) return 0;
  
  // Sort tiers by minBalance to ensure proper order
  const sortedTiers = [...tiers].sort((a, b) => a.minBalance - b.minBalance);
  
  for (const tier of sortedTiers) {
    if (balance >= tier.minBalance) {
      if (tier.maxBalance === undefined || balance <= tier.maxBalance) {
        return tier.apr;
      }
    }
  }
  
  // If no tier matches, return the highest tier's rate
  const highestTier = sortedTiers[sortedTiers.length - 1];
  return highestTier?.apr || 0;
}

/**
 * Calculate daily interest for a given balance and APR
 */
export function calculateDailyInterest(
  balance: number,
  apr: number,
  dayCountBasis: 360 | 365 = 360
): number {
  if (balance <= 0) return 0;
  return (balance * apr) / dayCountBasis;
}

/**
 * Calculate effective APR for a given day based on ledger history
 */
export function effectiveAPRByDay(
  date: string,
  balance: number,
  tiers: RateTier[],
  manualOverride?: number
): number {
  if (manualOverride !== undefined) {
    return manualOverride;
  }
  return pickTierAPR(balance, tiers);
}

/**
 * Get default Schwab rate tiers
 */
export function getDefaultSchwabTiers(): RateTier[] {
  return [
    { minBalance: 0, maxBalance: 25000, apr: 0.119 },
    { minBalance: 25000, maxBalance: 100000, apr: 0.111 },
    { minBalance: 100000, maxBalance: 250000, apr: 0.106 },
    { minBalance: 250000, maxBalance: 1000000, apr: 0.102 },
    { minBalance: 1000000, apr: 0.098 }
  ];
}

/**
 * Format APR as percentage string
 */
export function formatAPR(apr: number): string {
  return `${(apr * 100).toFixed(3)}%`;
}

/**
 * Parse APR from percentage string
 */
export function parseAPR(aprString: string): number {
  const cleaned = aprString.replace('%', '').trim();
  const value = parseFloat(cleaned);
  return isNaN(value) ? 0 : value / 100;
}
