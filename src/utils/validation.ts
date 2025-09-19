import { z } from 'zod';

// Trade validation
export const TradeSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  ticker: z.string().min(1).max(10).regex(/^[A-Z]+$/, 'Ticker must be uppercase letters'),
  side: z.enum(['BUY', 'SELL', 'SHORT', 'COVER']),
  qty: z.number().positive('Quantity must be positive'),
  price: z.number().min(0, 'Price must be non-negative'),
  fees: z.number().min(0, 'Fees must be non-negative').optional(),
  notes: z.string().optional()
});

// Lot validation
export const LotSchema = z.object({
  id: z.string().min(1),
  ticker: z.string().min(1).max(10),
  openDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  side: z.enum(['LONG', 'SHORT']),
  qtyOpen: z.number(),
  qtyInit: z.number().positive(),
  costBasisPerShare: z.number().min(0),
  feesTotal: z.number().min(0),
  maintenanceMarginPct: z.number().min(0).max(1).optional()
});

// Rate tier validation
export const RateTierSchema = z.object({
  minBalance: z.number().min(0),
  maxBalance: z.number().min(0).optional(),
  apr: z.number().min(0).max(1) // APR as decimal (0.10 = 10%)
});

// Broker settings validation
export const BrokerSettingsSchema = z.object({
  brokerName: z.string().min(1),
  baseRateName: z.string().optional(),
  tiers: z.array(RateTierSchema).min(1, 'At least one rate tier required'),
  dayCountBasis: z.enum([360, 365]),
  initialMarginPct: z.number().min(0).max(1),
  maintenanceMarginPct: z.number().min(0).max(1)
});

// Interest ledger entry validation
export const InterestLedgerEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  openingDebit: z.number(),
  cashActivity: z.number(),
  dailyInterest: z.number().min(0),
  closingDebit: z.number(),
  aprUsed: z.number().min(0).optional()
});

// App settings validation
export const AppSettingsSchema = z.object({
  fifo: z.boolean(),
  defaultFeesPerTrade: z.number().min(0).optional(),
  rounding: z.number().min(0).max(10)
});

// CSV import validation
export const TradeCSVRowSchema = z.object({
  date: z.string(),
  ticker: z.string(),
  side: z.string(),
  qty: z.number(),
  price: z.number(),
  fees: z.number().optional(),
  notes: z.string().optional()
});

export const InterestLedgerCSVRowSchema = z.object({
  date: z.string(),
  openingDebit: z.number(),
  cashActivity: z.number(),
  dailyInterest: z.number(),
  closingDebit: z.number(),
  aprUsed: z.number().optional()
});

// Form validation schemas
export const TradeFormSchema = z.object({
  ticker: z.string().min(1, 'Ticker is required').max(10, 'Ticker too long'),
  side: z.enum(['BUY', 'SELL', 'SHORT', 'COVER']),
  qty: z.number().positive('Quantity must be positive'),
  price: z.number().min(0, 'Price must be non-negative'),
  fees: z.number().min(0, 'Fees must be non-negative').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  notes: z.string().optional()
});

export const BrokerSettingsFormSchema = z.object({
  brokerName: z.string().min(1, 'Broker name is required'),
  baseRateName: z.string().optional(),
  dayCountBasis: z.enum([360, 365]),
  initialMarginPct: z.number().min(0).max(1),
  maintenanceMarginPct: z.number().min(0).max(1),
  tiers: z.array(RateTierSchema).min(1, 'At least one rate tier required')
});

// Utility functions for validation
export function validateTrade(trade: unknown) {
  return TradeSchema.parse(trade);
}

export function validateLot(lot: unknown) {
  return LotSchema.parse(lot);
}

export function validateBrokerSettings(settings: unknown) {
  return BrokerSettingsSchema.parse(settings);
}

export function validateTradeForm(data: unknown) {
  return TradeFormSchema.parse(data);
}

export function validateBrokerSettingsForm(data: unknown) {
  return BrokerSettingsFormSchema.parse(data);
}

// CSV parsing validation
export function validateTradeCSVRow(row: unknown) {
  return TradeCSVRowSchema.parse(row);
}

export function validateInterestLedgerCSVRow(row: unknown) {
  return InterestLedgerCSVRowSchema.parse(row);
}

// Date validation helpers
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

export function isFutureDate(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today;
}

export function isTodayOrPast(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date <= today;
}
