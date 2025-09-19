import { addDays, format, parseISO, isAfter, isBefore } from 'date-fns';
import { Lot, Trade, Side } from '@/types';

/**
 * Apply a trade to existing lots using FIFO matching
 */
export function applyTradeToLotsFIFO(
  trade: Trade,
  existingLots: Lot[]
): { updatedLots: Lot[]; realizedPnL: number; newLots: Lot[] } {
  const updatedLots = [...existingLots];
  const newLots: Lot[] = [];
  let realizedPnL = 0;
  let remainingQty = trade.qty;
  
  if (trade.side === 'BUY') {
    // Create new long lot
    const newLot: Lot = {
      id: `lot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ticker: trade.ticker,
      openDate: trade.date,
      side: 'LONG',
      qtyOpen: trade.qty,
      qtyInit: trade.qty,
      costBasisPerShare: trade.price,
      feesTotal: trade.fees || 0
    };
    newLots.push(newLot);
    return { updatedLots, realizedPnL, newLots };
  }
  
  if (trade.side === 'SHORT') {
    // Create new short lot
    const newLot: Lot = {
      id: `lot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ticker: trade.ticker,
      openDate: trade.date,
      side: 'SHORT',
      qtyOpen: trade.qty,
      qtyInit: trade.qty,
      costBasisPerShare: trade.price,
      feesTotal: trade.fees || 0
    };
    newLots.push(newLot);
    return { updatedLots, realizedPnL, newLots };
  }
  
  // For SELL and COVER, match against existing lots
  const matchingLots = updatedLots
    .filter(lot => lot.ticker === trade.ticker)
    .sort((a, b) => parseISO(a.openDate).getTime() - parseISO(b.openDate).getTime()); // FIFO order
  
  for (const lot of matchingLots) {
    if (remainingQty <= 0) break;
    
    const availableQty = Math.abs(lot.qtyOpen);
    const sellQty = Math.min(remainingQty, availableQty);
    
    if (sellQty > 0) {
      // Calculate realized P&L for this portion
      const costBasis = lot.costBasisPerShare * sellQty;
      const proceeds = trade.price * sellQty;
      const lotPnL = proceeds - costBasis;
      realizedPnL += lotPnL;
      
      // Update the lot
      lot.qtyOpen -= sellQty;
      remainingQty -= sellQty;
    }
  }
  
  // Remove lots with zero remaining quantity
  const filteredLots = updatedLots.filter(lot => lot.qtyOpen !== 0);
  
  return { updatedLots: filteredLots, realizedPnL, newLots };
}

/**
 * Apply a trade to existing lots using LIFO matching
 */
export function applyTradeToLotsLIFO(
  trade: Trade,
  existingLots: Lot[]
): { updatedLots: Lot[]; realizedPnL: number; newLots: Lot[] } {
  const updatedLots = [...existingLots];
  const newLots: Lot[] = [];
  let realizedPnL = 0;
  let remainingQty = trade.qty;
  
  if (trade.side === 'BUY') {
    // Create new long lot
    const newLot: Lot = {
      id: `lot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ticker: trade.ticker,
      openDate: trade.date,
      side: 'LONG',
      qtyOpen: trade.qty,
      qtyInit: trade.qty,
      costBasisPerShare: trade.price,
      feesTotal: trade.fees || 0
    };
    newLots.push(newLot);
    return { updatedLots, realizedPnL, newLots };
  }
  
  if (trade.side === 'SHORT') {
    // Create new short lot
    const newLot: Lot = {
      id: `lot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ticker: trade.ticker,
      openDate: trade.date,
      side: 'SHORT',
      qtyOpen: trade.qty,
      costBasisPerShare: trade.price,
      feesTotal: trade.fees || 0
    };
    newLots.push(newLot);
    return { updatedLots, realizedPnL, newLots };
  }
  
  // For SELL and COVER, match against existing lots (LIFO order)
  const matchingLots = updatedLots
    .filter(lot => lot.ticker === trade.ticker)
    .sort((a, b) => parseISO(b.openDate).getTime() - parseISO(a.openDate).getTime()); // LIFO order
  
  for (const lot of matchingLots) {
    if (remainingQty <= 0) break;
    
    const availableQty = Math.abs(lot.qtyOpen);
    const sellQty = Math.min(remainingQty, availableQty);
    
    if (sellQty > 0) {
      // Calculate realized P&L for this portion
      const costBasis = lot.costBasisPerShare * sellQty;
      const proceeds = trade.price * sellQty;
      const lotPnL = proceeds - costBasis;
      realizedPnL += lotPnL;
      
      // Update the lot
      lot.qtyOpen -= sellQty;
      remainingQty -= sellQty;
    }
  }
  
  // Remove lots with zero remaining quantity
  const filteredLots = updatedLots.filter(lot => lot.qtyOpen !== 0);
  
  return { updatedLots: filteredLots, realizedPnL, newLots };
}

/**
 * Calculate unrealized P&L for a lot
 */
export function calculateUnrealizedPnL(
  lot: Lot,
  currentPrice: number
): number {
  if (!currentPrice) return 0;
  
  const marketValue = lot.qtyOpen * currentPrice;
  const costBasis = lot.qtyOpen * lot.costBasisPerShare;
  
  return marketValue - costBasis;
}

/**
 * Calculate allocated interest for a lot based on days held
 */
export function calculateAllocatedInterest(
  lot: Lot,
  totalInterest: number,
  totalDays: number
): number {
  const daysHeld = Math.max(1, Math.ceil(
    (Date.now() - parseISO(lot.openDate).getTime()) / (1000 * 60 * 60 * 24)
  ));
  
  return (lot.qtyOpen * lot.costBasisPerShare * totalInterest * daysHeld) / 
         (totalDays * lot.qtyOpen * lot.costBasisPerShare);
}

/**
 * Get all lots for a specific ticker
 */
export function getLotsForTicker(ticker: string, lots: Lot[]): Lot[] {
  return lots.filter(lot => lot.ticker === ticker);
}

/**
 * Get total quantity for a ticker across all lots
 */
export function getTotalQuantityForTicker(ticker: string, lots: Lot[]): number {
  return lots
    .filter(lot => lot.ticker === ticker)
    .reduce((sum, lot) => sum + lot.qtyOpen, 0);
}

/**
 * Check if a sell/cover trade is valid (sufficient quantity)
 */
export function validateSellTrade(
  trade: Trade,
  lots: Lot[]
): { isValid: boolean; availableQty: number; error?: string } {
  const tickerLots = getLotsForTicker(trade.ticker, lots);
  const availableQty = getTotalQuantityForTicker(trade.ticker, lots);
  
  if (availableQty < trade.qty) {
    return {
      isValid: false,
      availableQty,
      error: `Insufficient quantity. Available: ${availableQty}, Requested: ${trade.qty}`
    };
  }
  
  return { isValid: true, availableQty };
}

/**
 * Split a lot for partial sells
 */
export function splitLot(
  lot: Lot,
  sellQty: number
): { remainingLot: Lot; soldLot: Lot } {
  const remainingQty = lot.qtyOpen - sellQty;
  
  const remainingLot: Lot = {
    ...lot,
    qtyOpen: remainingQty,
    qtyInit: remainingQty
  };
  
  const soldLot: Lot = {
    ...lot,
    id: `${lot.id}_sold_${Date.now()}`,
    qtyOpen: sellQty,
    qtyInit: sellQty
  };
  
  return { remainingLot, soldLot };
}
