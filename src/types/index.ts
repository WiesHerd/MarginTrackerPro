// Core entities
export interface RateTier {
  minBalance: number;
  maxBalance?: number;
  apr: number;
}

export interface BrokerSettings {
  brokerName: string;
  baseRateName?: string; // label only
  tiers: RateTier[];
  dayCountBasis: 360 | 365; // default 360
  initialMarginPct: number; // e.g., 0.50 for Reg T
  maintenanceMarginPct: number; // default 0.30 for equities; per-position override allowed
}

// Trades & positions
export type Side = 'BUY' | 'SELL' | 'SHORT' | 'COVER';

export interface Trade {
  id: string;
  date: string;
  ticker: string;
  side: Side;
  qty: number;
  price: number;
  fees?: number;
  notes?: string;
  interestRate?: number;
}

export interface Lot {
  id: string;
  ticker: string;
  openDate: string;
  side: 'LONG' | 'SHORT';
  qtyOpen: number; // remaining shares
  qtyInit: number;
  costBasisPerShare: number;
  feesTotal: number;
  maintenanceMarginPct?: number; // per-lot override
}

export interface PositionSnapshot {
  date: string;
  ticker: string;
  lotId: string;
  qty: number;
  marketPrice?: number;
  // computed caches for UI: marketValue, unrealizedPnL, requiredMaintMargin, etc.
  marketValue?: number;
  unrealizedPnL?: number;
  requiredMaintMargin?: number;
  equityImpact?: number;
}

export interface InterestLedgerEntry {
  date: string;
  openingDebit: number;
  cashActivity: number; // net of trades, dividends, interest posted
  dailyInterest: number;
  closingDebit: number;
  aprUsed?: number; // for manual overrides
}

export interface AppState {
  broker: BrokerSettings;
  trades: Trade[];
  lots: Lot[];
  ledger: InterestLedgerEntry[];
  settings: {
    fifo: boolean;
    defaultFeesPerTrade?: number;
    rounding: number; // 2
  };
}

// UI State
export interface UIState {
  selectedTicker?: string;
  showLotsDrawer: boolean;
  showTradeModal: boolean;
  showSettingsModal: boolean;
  showRateTiersModal: boolean;
  showImportModal: boolean;
  showExportModal: boolean;
}

// Calculation results
export interface PositionSummary {
  ticker: string;
  totalQty: number;
  totalMarketValue: number;
  totalUnrealizedPnL: number;
  totalRequiredMargin: number;
  equityImpact: number;
  lots: Lot[];
}

export interface AccountSummary {
  totalEquity: number;
  totalDebit: number;
  totalMarketValue: number;
  availableBuyingPower: number;
  maintenanceRequirement: number;
  dailyInterest: number;
  pdtStatus: {
    dayTradesLast5Days: number;
    isPDTRisk: boolean;
  };
}

// CSV Import/Export
export interface TradeCSVRow {
  date: string;
  ticker: string;
  side: string;
  qty: number;
  price: number;
  fees?: number;
  notes?: string;
}

export interface InterestLedgerCSVRow {
  date: string;
  openingDebit: number;
  cashActivity: number;
  dailyInterest: number;
  closingDebit: number;
  aprUsed?: number;
}

// PDT Detection
export interface PDTStatus {
  dayTradesLast5Days: number;
  isPDTRisk: boolean;
  last5BusinessDays: string[];
  dayTradesByDate: Record<string, number>;
}
