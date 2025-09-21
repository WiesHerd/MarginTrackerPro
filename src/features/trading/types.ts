export interface Trade {
  readonly id: string;
  readonly ticker: string;
  readonly buyPrice: number;
  readonly buyDate: string;
  readonly sellPrice?: number;
  readonly sellDate?: string;
  readonly quantity: number;
  readonly interestRate: number;
  readonly currentPrice?: number;
  // Legacy fields for backward compatibility - consider removing in future versions
  readonly date?: string;
  readonly side?: string;
  readonly qty?: number;
  readonly price?: number;
}

export interface MarginRate {
  readonly minBalance: number;
  readonly maxBalance: number;
  readonly marginRate: number;
  readonly effectiveRate: number;
}

export interface BrokerSettings {
  readonly baseRate: number;
  readonly marginRates: readonly MarginRate[];
}

export interface TradeMetrics {
  readonly daysHeld: number;
  readonly interestCost: number;
  readonly profitLoss: number;
  readonly totalReturn: number;
  readonly marginRate: number;
  readonly currentPrice: number;
  readonly positionValue: number;
  readonly marginUsed: number;
  readonly marginUtilization: number;
  readonly priceChangePercent: number;
  readonly dailyReturn: number;
  readonly annualizedReturn: number;
}

export interface PortfolioMetrics {
  readonly openPnL: number;
  readonly closedPnL: number;
  readonly totalPnL: number;
  readonly totalInterest: number;
  readonly openPositions: number;
  readonly closedPositions: number;
}

// Form types for better validation
export interface TradeFormData {
  readonly ticker: string;
  readonly quantity: number;
  readonly buyPrice: number;
  readonly buyDate: string;
  readonly interestRate: number;
}

export interface SellFormData {
  readonly price: string;
  readonly date: string;
}

// Event handler types for better type safety
export type TradeEventHandlers = {
  readonly onAddTrade: (trade: Omit<Trade, 'id'>) => void;
  readonly onUpdateTrade: (id: string, updates: Partial<Trade>) => void;
  readonly onDeleteTrade: (id: string) => void;
  readonly onSelectedMarginRateChange: (rate: number) => void;
  readonly onTickerChange?: (ticker: string) => void;
};

// Component prop interfaces
export interface BaseComponentProps {
  readonly isDarkMode: boolean;
}
