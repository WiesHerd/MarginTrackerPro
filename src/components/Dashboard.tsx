import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { selectTrades, selectLots, selectLedger } from '../store/selectors';
import PositionsTable from './PositionsTable';
import InterestLedger from './InterestLedger';
import PDTIndicator from './PDTIndicator';
import AccountSummary from './AccountSummary';

const Dashboard: React.FC = () => {
  const trades = useSelector(selectTrades);
  const lots = useSelector(selectLots);
  const ledger = useSelector(selectLedger);

  return (
    <div className="space-y-6">
      {/* PDT Warning */}
      <PDTIndicator trades={trades} />

      {/* Account Summary */}
      <AccountSummary />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Positions Table */}
        <div className="lg:col-span-1">
          <PositionsTable />
        </div>

        {/* Interest Ledger */}
        <div className="lg:col-span-1">
          <InterestLedger />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
