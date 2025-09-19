import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { selectLedger } from '../store/selectors';
import { format } from 'date-fns';

const InterestLedger: React.FC = () => {
  const entries = useSelector(selectLedger);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatAPR = (apr: number) => {
    return `${(apr * 100).toFixed(3)}%`;
  };

  // Get recent entries (last 10 days)
  const recentEntries = useMemo(() => {
    return [...entries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [entries]);

  const totalInterest = useMemo(() => {
    return entries.reduce((sum, entry) => sum + entry.dailyInterest, 0);
  }, [entries]);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Interest Ledger</h2>
            <p className="text-sm text-gray-600">Daily interest accrual and margin debit</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Interest</p>
            <p className="text-lg font-semibold text-red-600">
              {formatCurrency(totalInterest)}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="table-header">
            <tr>
              <th className="table-cell text-left">Date</th>
              <th className="table-cell text-right">Opening Debit</th>
              <th className="table-cell text-right">Cash Activity</th>
              <th className="table-cell text-right">Daily Interest</th>
              <th className="table-cell text-right">Closing Debit</th>
              <th className="table-cell text-right">APR Used</th>
            </tr>
          </thead>
          <tbody>
            {recentEntries.map((entry, index) => (
              <tr key={entry.date} className="table-row">
                <td className="table-cell">
                  <div className="font-medium text-gray-900">
                    {format(new Date(entry.date), 'MMM dd, yyyy')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(entry.date), 'EEEE')}
                  </div>
                </td>
                <td className="table-cell text-right">
                  <span className="text-gray-900">
                    {formatCurrency(entry.openingDebit)}
                  </span>
                </td>
                <td className="table-cell text-right">
                  <span className={`font-medium ${entry.cashActivity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.cashActivity >= 0 ? '+' : ''}{formatCurrency(entry.cashActivity)}
                  </span>
                </td>
                <td className="table-cell text-right">
                  <span className="text-red-600 font-medium">
                    {formatCurrency(entry.dailyInterest)}
                  </span>
                </td>
                <td className="table-cell text-right">
                  <span className="text-gray-900 font-medium">
                    {formatCurrency(entry.closingDebit)}
                  </span>
                </td>
                <td className="table-cell text-right">
                  <span className="text-sm text-gray-600">
                    {entry.aprUsed ? formatAPR(entry.aprUsed) : 'N/A'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {entries.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No interest ledger entries</p>
            <p className="text-sm text-gray-400 mt-1">Interest will be calculated when trades are added</p>
          </div>
        )}
      </div>

      {entries.length > 10 && (
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            Showing last 10 entries of {entries.length} total
          </p>
        </div>
      )}
    </div>
  );
};

export default InterestLedger;
