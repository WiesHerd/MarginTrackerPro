# Margin Cost Calculator

A professional, production-ready **Margin Account Calculator** to track long/short equity positions financed with margin, daily interest accrual, buying power, and realized/unrealized P&L. Built with React, TypeScript, and Redux Toolkit.

## 🚀 Features

### Core Functionality
- **Broker-agnostic with Schwab defaults**: Tailored to Charles Schwab's tiered interest structure, but fully customizable
- **Daily workflow optimized**: Zero-friction trade entry, auto-persist data locally, one-click operations
- **Accurate finance math**: Daily interest accrual with 360/365 day-count options, pro-rated calculations
- **Multi-position support**: Multiple tickers, multiple lots per ticker, partial sells, FIFO/LIFO selection
- **Risk awareness**: Initial margin tracking, maintenance margin estimates, PDT status monitoring
- **Data portability**: CSV import/export, JSON backup, historical data migration

### Advanced Features
- **Real-time calculations**: Instant P&L updates, buying power estimates, margin requirements
- **Interest ledger**: Daily interest tracking with tiered APR support
- **Position management**: Lot-level tracking with cost basis and fee allocation
- **PDT monitoring**: Pattern Day Trader status tracking and warnings
- **Audit trail**: Immutable trade history and interest calculations

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS
- **Validation**: Zod schemas
- **Storage**: LocalForage (offline-first)
- **Testing**: Vitest + React Testing Library
- **Date Handling**: date-fns
- **CSV Processing**: PapaParse

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd margin-cost-calculator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Run tests**
   ```bash
   npm test
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🎯 Quick Start

1. **Launch the app** - The application loads with sample data to demonstrate functionality
2. **Add a trade** - Click "Add Trade" to enter your first position
3. **View positions** - See your holdings with real-time P&L calculations
4. **Check interest** - Review daily interest accrual in the Interest Ledger
5. **Monitor risk** - Watch PDT status and margin requirements

## 📊 Data Model

### Core Entities

```typescript
interface Trade {
  id: string;
  date: string;
  ticker: string;
  side: 'BUY' | 'SELL' | 'SHORT' | 'COVER';
  qty: number;
  price: number;
  fees?: number;
  notes?: string;
}

interface Lot {
  id: string;
  ticker: string;
  openDate: string;
  side: 'LONG' | 'SHORT';
  qtyOpen: number;
  qtyInit: number;
  costBasisPerShare: number;
  feesTotal: number;
  maintenanceMarginPct?: number;
}

interface InterestLedgerEntry {
  date: string;
  openingDebit: number;
  cashActivity: number;
  dailyInterest: number;
  closingDebit: number;
  aprUsed?: number;
}
```

## 🧮 Calculation Formulas

### Interest Accrual
```
Daily Interest = max(openingDebit + max(cashActivity, 0), 0) × APR ÷ dayCountBasis
```

### Available Buying Power
```
ABP ≈ 2 × (Equity - Maintenance Requirement)
```

### Maintenance Margin
```
Maintenance Requirement = |Quantity| × Market Price × Maintenance %
```

### P&L Calculations
```
Unrealized P&L = (Current Price - Cost Basis) × Quantity - Allocated Interest
Realized P&L = Trade Proceeds - Cost Basis - Allocated Interest
```

## ⚙️ Configuration

### Broker Settings
- **Rate Tiers**: Configure tiered APR structure
- **Day Count Basis**: Choose 360 or 365 days
- **Margin Requirements**: Set initial and maintenance percentages
- **Custom Overrides**: Per-position maintenance margins

### App Settings
- **Lot Matching**: FIFO or LIFO for tax lot identification
- **Default Fees**: Set standard commission per trade
- **Rounding**: Configure decimal precision

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard.tsx
│   ├── PositionsTable.tsx
│   ├── InterestLedger.tsx
│   ├── TradeModal.tsx
│   └── ...
├── store/               # Redux store
│   ├── index.ts
│   └── slices/
├── utils/               # Calculation utilities
│   ├── rates.ts
│   ├── ledger.ts
│   ├── margin.ts
│   ├── lots.ts
│   ├── pdt.ts
│   └── validation.ts
├── types/               # TypeScript definitions
├── data/                # Seed data and samples
└── test/                # Test files
```

## 🧪 Testing

The application includes comprehensive unit tests for all calculation utilities:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm test -- --watch
```

### Test Coverage
- **Rate calculations**: APR tier selection, daily interest computation
- **Margin calculations**: Equity, buying power, maintenance requirements
- **Lot management**: FIFO/LIFO matching, P&L calculations
- **PDT detection**: Day trade identification and counting
- **Validation**: Input validation and error handling

## 📊 Sample Data

The application includes sample data to demonstrate functionality:

- **3 long positions**: AAPL, MSFT, TSLA
- **1 short position**: GOOGL
- **Partial sell example**: AAPL position with 50% exit
- **Interest ledger**: 10 days of daily interest calculations
- **Rate tiers**: Default Schwab APR structure

## 📤 Import/Export

### CSV Formats

**Trades Import/Export:**
```csv
date,ticker,side,qty,price,fees,notes
2024-01-15,AAPL,BUY,100,150.25,0.95,Initial position
```

**Interest Ledger Export:**
```csv
date,openingDebit,cashActivity,dailyInterest,closingDebit,aprUsed
2024-01-15,0.00,-15025.95,0.00,15025.95,0.10
```

### JSON Backup
Complete application state including:
- All trades and lots
- Interest ledger entries
- Broker settings
- App preferences

## 🔧 Development

### Key Utilities

**Rate Calculations** (`utils/rates.ts`)
- `pickTierAPR()`: Select appropriate APR for balance
- `calculateDailyInterest()`: Compute daily interest accrual
- `effectiveAPRByDay()`: Get APR for specific date

**Margin Calculations** (`utils/margin.ts`)
- `computeEquity()`: Calculate account equity
- `computeABP()`: Available buying power
- `maintenanceRequirement()`: Margin requirements

**Lot Management** (`utils/lots.ts`)
- `applyTradeToLotsFIFO()`: FIFO lot matching
- `applyTradeToLotsLIFO()`: LIFO lot matching
- `calculateUnrealizedPnL()`: Position P&L

**PDT Detection** (`utils/pdt.ts`)
- `isDayTrade()`: Identify day trades
- `getPDTStatus()`: PDT risk assessment
- `countDayTradesLast5Days()`: Rolling day trade count

## 🚨 Important Disclaimers

> **⚠️ This tool is for planning purposes only. Calculations are estimates and may differ from your broker's statements. No investment advice is provided. Use at your own risk.**

> **⚠️ Maintenance margin and PDT logic are simplified to help you reason about risk. Always verify requirements with your broker.**

## 🐛 Known Limitations

1. **Price Data**: Uses mock prices for demonstration. Integrate with real-time data feed for production use.
2. **Tax Reporting**: Lot matching is approximate. Consult tax professional for accurate reporting.
3. **Complex Instruments**: Focuses on equity positions. Options, futures, and other instruments not supported.
4. **Broker Integration**: No direct broker API integration. Manual data entry required.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions, issues, or feature requests:
1. Check the documentation above
2. Review existing issues
3. Create a new issue with detailed description
4. Include steps to reproduce any bugs

---

**Built with ❤️ for margin traders who need accurate, real-time position tracking.**
