import { Lot, PositionSnapshot, BrokerSettings } from '@/types';

/**
 * Calculate total market value for a position
 */
export function calculateMarketValue(
  qty: number,
  marketPrice: number
): number {
  return qty * marketPrice;
}

/**
 * Calculate equity for the account
 */
export function computeEquity(
  positions: PositionSnapshot[],
  debit: number,
  credit: number = 0
): number {
  const totalMarketValue = positions.reduce((sum, pos) => {
    if (!pos.marketPrice) return sum;
    return sum + calculateMarketValue(pos.qty, pos.marketPrice);
  }, 0);
  
  return totalMarketValue - debit + credit;
}

/**
 * Calculate maintenance margin requirement for a position
 */
export function maintenanceRequirement(
  qty: number,
  marketPrice: number,
  maintenanceMarginPct: number
): number {
  return Math.abs(qty) * marketPrice * maintenanceMarginPct;
}

/**
 * Calculate total maintenance margin requirement for all positions
 */
export function computeMaintenanceRequirement(
  positions: PositionSnapshot[],
  lots: Lot[],
  defaultMaintenancePct: number
): number {
  return positions.reduce((total, pos) => {
    if (!pos.marketPrice) return total;
    
    // Find the lot to get any custom maintenance percentage
    const lot = lots.find(l => l.id === pos.lotId);
    const maintenancePct = lot?.maintenanceMarginPct || defaultMaintenancePct;
    
    return total + maintenanceRequirement(pos.qty, pos.marketPrice, maintenancePct);
  }, 0);
}

/**
 * Calculate available buying power (Reg T style)
 */
export function computeABP(
  equity: number,
  maintenanceReq: number,
  initialMarginPct: number
): number {
  // Available Buying Power ≈ 2 * (Equity - Maintenance Requirement)
  // This is a simplified calculation
  const excessEquity = equity - maintenanceReq;
  return Math.max(0, 2 * excessEquity);
}

/**
 * Calculate initial margin requirement for a new purchase
 */
export function computeInitialMargin(
  purchaseAmount: number,
  initialMarginPct: number
): number {
  return purchaseAmount * initialMarginPct;
}

/**
 * Check if account is in margin call territory
 */
export function isMarginCall(
  equity: number,
  maintenanceReq: number
): boolean {
  return equity < maintenanceReq;
}

/**
 * Calculate equity impact of a position
 */
export function calculateEquityImpact(
  qty: number,
  marketPrice: number,
  costBasis: number
): number {
  return qty * (marketPrice - costBasis);
}

/**
 * Get position summary with all calculated values
 */
export function getPositionSummary(
  ticker: string,
  lots: Lot[],
  marketPrice?: number
): {
  totalQty: number;
  totalMarketValue: number;
  totalCostBasis: number;
  totalUnrealizedPnL: number;
  totalRequiredMargin: number;
  equityImpact: number;
} {
  const positionLots = lots.filter(lot => lot.ticker === ticker);
  
  const totalQty = positionLots.reduce((sum, lot) => sum + lot.qtyOpen, 0);
  const totalCostBasis = positionLots.reduce((sum, lot) => 
    sum + (lot.qtyOpen * lot.costBasisPerShare), 0
  );
  
  const totalMarketValue = marketPrice ? totalQty * marketPrice : 0;
  const totalUnrealizedPnL = totalMarketValue - totalCostBasis;
  
  // Use default maintenance margin for now (30%)
  const totalRequiredMargin = marketPrice ? 
    Math.abs(totalQty) * marketPrice * 0.30 : 0;
  
  const equityImpact = totalUnrealizedPnL;
  
  return {
    totalQty,
    totalMarketValue,
    totalCostBasis,
    totalUnrealizedPnL,
    totalRequiredMargin,
    equityImpact
  };
}

/**
 * Calculate account summary with all key metrics
 */
export function getAccountSummary(
  positions: PositionSnapshot[],
  lots: Lot[],
  debit: number,
  broker: BrokerSettings
): {
  totalEquity: number;
  totalDebit: number;
  totalMarketValue: number;
  availableBuyingPower: number;
  maintenanceRequirement: number;
  dailyInterest: number;
  isMarginCall: boolean;
} {
  const totalMarketValue = positions.reduce((sum, pos) => {
    if (!pos.marketPrice) return sum;
    return sum + calculateMarketValue(pos.qty, pos.marketPrice);
  }, 0);
  
  const totalEquity = totalMarketValue - debit;
  const maintenanceReq = computeMaintenanceRequirement(positions, lots, broker.maintenanceMarginPct);
  const availableBP = computeABP(totalEquity, maintenanceReq, broker.initialMarginPct);
  const isMarginCallStatus = isMarginCall(totalEquity, maintenanceReq);
  
  // Calculate daily interest (simplified - using current debit)
  const currentAPR = 0.10; // This should come from rate calculation
  const dailyInterest = (debit * currentAPR) / broker.dayCountBasis;
  
  return {
    totalEquity,
    totalDebit: debit,
    totalMarketValue,
    availableBuyingPower: availableBP,
    maintenanceRequirement: maintenanceReq,
    dailyInterest,
    isMarginCall: isMarginCallStatus
  };
}
