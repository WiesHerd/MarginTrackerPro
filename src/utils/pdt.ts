import { addDays, format, parseISO, isSameDay } from 'date-fns';
import { Trade, PDTStatus } from '@/types';

/**
 * Check if a trade is a day trade (same ticker, opposite sides, same day)
 */
export function isDayTrade(trade: Trade, allTrades: Trade[]): boolean {
  if (trade.side !== 'SELL' && trade.side !== 'COVER') {
    return false;
  }
  
  const tradeDate = parseISO(trade.date);
  
  // Find opposite side trades for the same ticker on the same day
  const oppositeSide = trade.side === 'SELL' ? 'BUY' : 'SHORT';
  const sameDayTrades = allTrades.filter(t => 
    t.ticker === trade.ticker &&
    t.side === oppositeSide &&
    isSameDay(parseISO(t.date), tradeDate)
  );
  
  return sameDayTrades.length > 0;
}

/**
 * Get the last 5 business days from a given date
 */
export function getLast5BusinessDays(fromDate: Date): string[] {
  const businessDays: string[] = [];
  let currentDate = fromDate;
  let daysBack = 0;
  
  while (businessDays.length < 5 && daysBack < 10) {
    const dayOfWeek = currentDate.getDay();
    
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays.push(format(currentDate, 'yyyy-MM-dd'));
    }
    
    currentDate = addDays(currentDate, -1);
    daysBack++;
  }
  
  return businessDays;
}

/**
 * Count day trades in the last 5 business days
 */
export function countDayTradesLast5Days(
  trades: Trade[],
  asOfDate: string = format(new Date(), 'yyyy-MM-dd')
): number {
  const asOf = parseISO(asOfDate);
  const last5BusinessDays = getLast5BusinessDays(asOf);
  
  let dayTradeCount = 0;
  const processedTrades = new Set<string>();
  
  for (const trade of trades) {
    if (processedTrades.has(trade.id)) continue;
    
    const tradeDate = parseISO(trade.date);
    
    // Check if trade is within the last 5 business days
    const isWithinRange = last5BusinessDays.some(businessDay => 
      isSameDay(tradeDate, parseISO(businessDay))
    );
    
    if (isWithinRange && isDayTrade(trade, trades)) {
      dayTradeCount++;
      processedTrades.add(trade.id);
    }
  }
  
  return dayTradeCount;
}

/**
 * Get PDT status for the account
 */
export function getPDTStatus(
  trades: Trade[],
  asOfDate: string = format(new Date(), 'yyyy-MM-dd')
): PDTStatus {
  const asOf = parseISO(asOfDate);
  const last5BusinessDays = getLast5BusinessDays(asOf);
  const dayTradesLast5Days = countDayTradesLast5Days(trades, asOfDate);
  
  // Count day trades by date for detailed breakdown
  const dayTradesByDate: Record<string, number> = {};
  
  for (const businessDay of last5BusinessDays) {
    const dayTrades = trades.filter(trade => {
      const tradeDate = parseISO(trade.date);
      return isSameDay(tradeDate, parseISO(businessDay)) && 
             isDayTrade(trade, trades);
    });
    dayTradesByDate[businessDay] = dayTrades.length;
  }
  
  return {
    dayTradesLast5Days,
    isPDTRisk: dayTradesLast5Days >= 4,
    last5BusinessDays,
    dayTradesByDate
  };
}

/**
 * Get day trades for a specific date
 */
export function getDayTradesForDate(
  date: string,
  trades: Trade[]
): Trade[] {
  const targetDate = parseISO(date);
  
  return trades.filter(trade => {
    const tradeDate = parseISO(trade.date);
    return isSameDay(tradeDate, targetDate) && isDayTrade(trade, trades);
  });
}

/**
 * Check if a new trade would create a day trade
 */
export function wouldCreateDayTrade(
  newTrade: Trade,
  existingTrades: Trade[]
): boolean {
  const allTrades = [...existingTrades, newTrade];
  return isDayTrade(newTrade, allTrades);
}

/**
 * Get PDT warning message
 */
export function getPDTWarningMessage(pdtStatus: PDTStatus): string {
  if (pdtStatus.isPDTRisk) {
    return `⚠️ PDT Risk: ${pdtStatus.dayTradesLast5Days} day trades in last 5 business days. One more day trade will trigger PDT status.`;
  }
  
  if (pdtStatus.dayTradesLast5Days >= 2) {
    return `⚠️ Approaching PDT limit: ${pdtStatus.dayTradesLast5Days} day trades in last 5 business days.`;
  }
  
  return '';
}
