import React from 'react';
import { Trade } from '../types';
import { getPDTStatus } from '../utils/pdt';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface PDTIndicatorProps {
  trades: Trade[];
}

const PDTIndicator: React.FC<PDTIndicatorProps> = ({ trades }) => {
  const pdtStatus = getPDTStatus(trades);

  if (pdtStatus.dayTradesLast5Days === 0) {
    return null;
  }

  const getStatusColor = () => {
    if (pdtStatus.isPDTRisk) return 'status-danger';
    if (pdtStatus.dayTradesLast5Days >= 2) return 'status-warning';
    return 'status-info';
  };

  const getStatusIcon = () => {
    if (pdtStatus.isPDTRisk) return <AlertTriangle className="h-4 w-4" />;
    if (pdtStatus.dayTradesLast5Days >= 2) return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getStatusMessage = () => {
    if (pdtStatus.isPDTRisk) {
      return `⚠️ PDT Risk: ${pdtStatus.dayTradesLast5Days} day trades in last 5 business days. One more day trade will trigger PDT status.`;
    }
    
    if (pdtStatus.dayTradesLast5Days >= 2) {
      return `⚠️ Approaching PDT limit: ${pdtStatus.dayTradesLast5Days} day trades in last 5 business days.`;
    }
    
    return `ℹ️ Day trades: ${pdtStatus.dayTradesLast5Days} in last 5 business days.`;
  };

  return (
    <div className={`rounded-lg p-4 ${getStatusColor()}`}>
      <div className="flex items-center space-x-3">
        {getStatusIcon()}
        <div className="flex-1">
          <h3 className="font-medium">
            Pattern Day Trader (PDT) Status
          </h3>
          <p className="text-sm mt-1">
            {getStatusMessage()}
          </p>
          {pdtStatus.isPDTRisk && (
            <p className="text-sm mt-2 font-medium">
              ⚠️ This tool is for planning. Calculations are estimates and may differ from your broker's statements. 
              No investment advice. Use at your own risk.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDTIndicator;
