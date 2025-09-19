import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { selectAccountSummary } from '../store/selectors';
import { getAccountSummary } from '../utils/margin';
import { getCurrentDebit } from '../utils/ledger';
import { DollarSign, TrendingUp, AlertTriangle, Calculator } from 'lucide-react';

const AccountSummary: React.FC = () => {
  const { lots, ledger, broker } = useSelector(selectAccountSummary);

  // Mock market prices and positions for calculation
  const mockPositions = useMemo(() => {
    const tickers = [...new Set(lots.map(lot => lot.ticker))];
    const mockPrices: Record<string, number> = {
      'AAPL': 150.25,
      'MSFT': 300.15,
      'GOOGL': 2500.75,
      'TSLA': 200.50,
      'NVDA': 400.80,
    };

    return tickers.map(ticker => ({
      date: new Date().toISOString().split('T')[0],
      ticker,
      lotId: `mock_${ticker}`,
      qty: lots.filter(lot => lot.ticker === ticker).reduce((sum, lot) => sum + lot.qtyOpen, 0),
      marketPrice: mockPrices[ticker] || 0,
    }));
  }, [lots]);

  const currentDebit = getCurrentDebit(ledger);
  const summary = getAccountSummary(mockPositions, lots, currentDebit, broker || {
    brokerName: 'Default',
    tiers: [],
    dayCountBasis: 360,
    initialMarginPct: 0.50,
    maintenanceMarginPct: 0.30
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Equity */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Equity</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(summary.totalEquity)}
            </p>
          </div>
        </div>
      </div>

      {/* Margin Debit */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Calculator className="h-8 w-8 text-red-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Margin Debit</p>
            <p className="text-2xl font-semibold text-red-600">
              {formatCurrency(summary.totalDebit)}
            </p>
          </div>
        </div>
      </div>

      {/* Available Buying Power */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Available BP</p>
            <p className="text-2xl font-semibold text-green-600">
              {formatCurrency(summary.availableBuyingPower)}
            </p>
          </div>
        </div>
      </div>

      {/* Maintenance Requirement */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <AlertTriangle className={`h-8 w-8 ${summary.isMarginCall ? 'text-red-600' : 'text-yellow-600'}`} />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Maintenance Req</p>
            <p className={`text-2xl font-semibold ${summary.isMarginCall ? 'text-red-600' : 'text-gray-900'}`}>
              {formatCurrency(summary.maintenanceRequirement)}
            </p>
            {summary.isMarginCall && (
              <p className="text-xs text-red-600 mt-1">Margin Call Risk</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSummary;
