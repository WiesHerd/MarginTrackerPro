import { Trade, Lot, InterestLedgerEntry, BrokerSettings } from '../types';
import { getDefaultSchwabTiers } from '../utils/rates';

export function loadSeedData() {
  const trades: Trade[] = [
    {
      id: 'trade_1',
      date: '2024-01-15',
      ticker: 'AAPL',
      side: 'BUY',
      qty: 100,
      price: 150.25,
      fees: 0.95,
      notes: 'Initial AAPL position'
    },
    {
      id: 'trade_2',
      date: '2024-01-16',
      ticker: 'MSFT',
      side: 'BUY',
      qty: 50,
      price: 300.15,
      fees: 0.95,
      notes: 'Microsoft position'
    },
    {
      id: 'trade_3',
      date: '2024-01-17',
      ticker: 'GOOGL',
      side: 'SHORT',
      qty: 10,
      price: 2500.75,
      fees: 0.95,
      notes: 'Short Google position'
    },
    {
      id: 'trade_4',
      date: '2024-01-18',
      ticker: 'AAPL',
      side: 'SELL',
      qty: 50,
      price: 152.50,
      fees: 0.95,
      notes: 'Partial AAPL exit'
    },
    {
      id: 'trade_5',
      date: '2024-01-19',
      ticker: 'TSLA',
      side: 'BUY',
      qty: 25,
      price: 200.50,
      fees: 0.95,
      notes: 'Tesla position'
    }
  ];

  const lots: Lot[] = [
    {
      id: 'lot_1',
      ticker: 'AAPL',
      openDate: '2024-01-15',
      side: 'LONG',
      qtyOpen: 50, // 100 - 50 sold
      qtyInit: 100,
      costBasisPerShare: 150.25,
      feesTotal: 0.95
    },
    {
      id: 'lot_2',
      ticker: 'MSFT',
      openDate: '2024-01-16',
      side: 'LONG',
      qtyOpen: 50,
      qtyInit: 50,
      costBasisPerShare: 300.15,
      feesTotal: 0.95
    },
    {
      id: 'lot_3',
      ticker: 'GOOGL',
      openDate: '2024-01-17',
      side: 'SHORT',
      qtyOpen: 10,
      qtyInit: 10,
      costBasisPerShare: 2500.75,
      feesTotal: 0.95
    },
    {
      id: 'lot_4',
      ticker: 'TSLA',
      openDate: '2024-01-19',
      side: 'LONG',
      qtyOpen: 25,
      qtyInit: 25,
      costBasisPerShare: 200.50,
      feesTotal: 0.95
    }
  ];

  const ledger: InterestLedgerEntry[] = [
    {
      date: '2024-01-15',
      openingDebit: 0,
      cashActivity: -15025.95, // AAPL buy
      dailyInterest: 0,
      closingDebit: 15025.95
    },
    {
      date: '2024-01-16',
      openingDebit: 15025.95,
      cashActivity: -15007.50, // MSFT buy
      dailyInterest: 4.17, // 15025.95 * 0.10 / 360
      closingDebit: 30037.62
    },
    {
      date: '2024-01-17',
      openingDebit: 30037.62,
      cashActivity: 25006.80, // GOOGL short proceeds
      dailyInterest: 8.34, // 30037.62 * 0.10 / 360
      closingDebit: 5004.16
    },
    {
      date: '2024-01-18',
      openingDebit: 5004.16,
      cashActivity: 7624.05, // AAPL partial sell
      dailyInterest: 1.39, // 5004.16 * 0.10 / 360
      closingDebit: 12629.60
    },
    {
      date: '2024-01-19',
      openingDebit: 12629.60,
      cashActivity: -5012.45, // TSLA buy
      dailyInterest: 3.51, // 12629.60 * 0.10 / 360
      closingDebit: 17645.56
    }
  ];

  const broker: BrokerSettings = {
    brokerName: 'Charles Schwab',
    baseRateName: 'Schwab Base Rate',
    tiers: getDefaultSchwabTiers(),
    dayCountBasis: 360,
    initialMarginPct: 0.50,
    maintenanceMarginPct: 0.30
  };

  return {
    trades,
    lots,
    ledger,
    broker
  };
}
