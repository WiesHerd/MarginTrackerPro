import { addDays, format, parseISO, isAfter, isBefore, isSameDay } from 'date-fns';
import { InterestLedgerEntry, Trade, BrokerSettings } from '@/types';
import { calculateDailyInterest, effectiveAPRByDay } from './rates';

/**
 * Calculate net cash activity from trades for a given date
 */
export function calculateCashActivityForDate(
  date: string,
  trades: Trade[]
): number {
  const targetDate = parseISO(date);
  
  return trades
    .filter(trade => isSameDay(parseISO(trade.date), targetDate))
    .reduce((net, trade) => {
      const tradeValue = trade.qty * trade.price;
      const fees = trade.fees || 0;
      
      switch (trade.side) {
        case 'BUY':
          return net - tradeValue - fees; // Cash out
        case 'SELL':
          return net + tradeValue - fees; // Cash in
        case 'SHORT':
          return net + tradeValue - fees; // Cash in (proceeds)
        case 'COVER':
          return net - tradeValue - fees; // Cash out
        default:
          return net;
      }
    }, 0);
}

/**
 * Post daily interest for a specific date
 */
export function postDailyInterest(
  date: string,
  openingDebit: number,
  cashActivity: number,
  broker: BrokerSettings,
  manualAPR?: number
): InterestLedgerEntry {
  const effectiveDebit = Math.max(openingDebit + Math.max(cashActivity, 0), 0);
  const apr = effectiveAPRByDay(date, effectiveDebit, broker.tiers, manualAPR);
  const dailyInterest = calculateDailyInterest(effectiveDebit, apr, broker.dayCountBasis);
  const closingDebit = openingDebit + cashActivity + dailyInterest;
  
  return {
    date,
    openingDebit,
    cashActivity,
    dailyInterest,
    closingDebit,
    aprUsed: manualAPR || apr
  };
}

/**
 * Recompute ledger from a specific date forward
 */
export function recomputeLedger(
  fromDate: string,
  trades: Trade[],
  broker: BrokerSettings,
  existingLedger: InterestLedgerEntry[] = []
): InterestLedgerEntry[] {
  const result: InterestLedgerEntry[] = [];
  const startDate = parseISO(fromDate);
  const today = new Date();
  
  // Keep entries before the fromDate
  const beforeEntries = existingLedger.filter(entry => 
    isBefore(parseISO(entry.date), startDate)
  );
  result.push(...beforeEntries);
  
  // Get the last entry before fromDate to determine opening debit
  let currentDebit = 0;
  if (beforeEntries.length > 0) {
    const lastEntry = beforeEntries[beforeEntries.length - 1];
    currentDebit = lastEntry.closingDebit;
  }
  
  // Process each day from fromDate to today
  let currentDate = startDate;
  while (!isAfter(currentDate, today)) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const cashActivity = calculateCashActivityForDate(dateStr, trades);
    
    const entry = postDailyInterest(
      dateStr,
      currentDebit,
      cashActivity,
      broker
    );
    
    result.push(entry);
    currentDebit = entry.closingDebit;
    currentDate = addDays(currentDate, 1);
  }
  
  return result;
}

/**
 * Apply cash activity to the ledger
 */
export function applyCashActivity(
  date: string,
  amount: number,
  description: string,
  ledger: InterestLedgerEntry[],
  broker: BrokerSettings
): InterestLedgerEntry[] {
  const targetDate = parseISO(date);
  const today = new Date();
  
  // If the date is in the future, we can't apply it yet
  if (isAfter(targetDate, today)) {
    return ledger;
  }
  
  // Find or create entry for this date
  let entryIndex = ledger.findIndex(entry => 
    isSameDay(parseISO(entry.date), targetDate)
  );
  
  if (entryIndex === -1) {
    // Create new entry
    const newEntry = postDailyInterest(date, 0, amount, broker);
    return [...ledger, newEntry].sort((a, b) => 
      parseISO(a.date).getTime() - parseISO(b.date).getTime()
    );
  }
  
  // Update existing entry
  const updatedLedger = [...ledger];
  const existingEntry = updatedLedger[entryIndex];
  
  const updatedEntry = postDailyInterest(
    date,
    existingEntry.openingDebit,
    existingEntry.cashActivity + amount,
    broker
  );
  
  updatedLedger[entryIndex] = updatedEntry;
  
  // Recompute all subsequent entries
  const nextDay = addDays(targetDate, 1);
  const nextDayStr = format(nextDay, 'yyyy-MM-dd');
  
  return recomputeLedger(nextDayStr, [], broker, updatedLedger);
}

/**
 * Get total interest accrued over a date range
 */
export function getTotalInterest(
  startDate: string,
  endDate: string,
  ledger: InterestLedgerEntry[]
): number {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  
  return ledger
    .filter(entry => {
      const entryDate = parseISO(entry.date);
      return !isBefore(entryDate, start) && !isAfter(entryDate, end);
    })
    .reduce((total, entry) => total + entry.dailyInterest, 0);
}

/**
 * Get current debit balance from the latest ledger entry
 */
export function getCurrentDebit(ledger: InterestLedgerEntry[]): number {
  if (ledger.length === 0) return 0;
  
  const latestEntry = ledger[ledger.length - 1];
  return latestEntry.closingDebit;
}

/**
 * Get opening debit for a specific date
 */
export function getOpeningDebit(date: string, ledger: InterestLedgerEntry[]): number {
  const targetDate = parseISO(date);
  
  // Find the entry for this date or the most recent previous entry
  const entry = ledger
    .filter(e => !isAfter(parseISO(e.date), targetDate))
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())[0];
  
  return entry?.openingDebit || 0;
}
