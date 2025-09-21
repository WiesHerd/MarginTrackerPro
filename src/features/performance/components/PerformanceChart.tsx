import React, { useMemo } from 'react';
import { Chart as ReactChart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Trade } from '../../trading/types';
import { calculateTradeMetrics } from '../../trading/utils/tradeCalculations';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PerformanceChartProps {
  trades: Trade[];
  tradingHistory: Trade[];
  isDarkMode: boolean;
}

const PerformanceChart: React.FC<PerformanceChartProps> = React.memo(({
  trades,
  tradingHistory,
  isDarkMode
}) => {
  const { chartData, options } = useMemo(() => {
    const allTrades = [...trades, ...tradingHistory];
    
    if (allTrades.length === 0) {
      return {
        chartData: { labels: [], datasets: [] },
        options: {}
      };
    }

    // Get current year for YTD calculation
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1); // January 1st of current year
    
    // Filter trades to those relevant for YTD views
    // For realized monthly bars we only use trades closed this year
    const closedThisYear = allTrades.filter(trade => !!trade.sellDate && new Date(trade.sellDate as string).getFullYear() === currentYear);
    // For cumulative lines, we consider realized values up to each month in current year

    if (closedThisYear.length === 0) {
      return {
        chartData: { labels: [], datasets: [] },
        options: {}
      };
    }

    // Create monthly realized and cumulative YTD performance data
    const monthlyData: Array<{ month: string; monthIndex: number; realizedGross: number; realizedInterest: number; realizedNet: number; cumGross: number; cumNet: number; cumInterest: number; }> = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(currentYear, month, 1);
      const monthEnd = new Date(currentYear, month + 1, 0);

      let realizedGross = 0;
      let realizedInterest = 0;

      for (const trade of closedThisYear) {
        const sellDate = new Date(trade.sellDate as string);
        if (sellDate >= monthStart && sellDate <= monthEnd) {
          const gross = ((trade.sellPrice || 0) - trade.buyPrice) * trade.quantity;
          const metrics = calculateTradeMetrics(trade, trade.interestRate || 0);
          realizedGross += gross;
          realizedInterest += metrics.interestCost;
        }
      }

      const realizedNet = realizedGross - realizedInterest;

      monthlyData.push({
        month: months[month],
        monthIndex: month,
        realizedGross,
        realizedInterest,
        realizedNet,
        cumGross: 0,
        cumNet: 0,
        cumInterest: 0,
      });
    }

    // Build cumulative lines based on monthly realized values up to each month
    let runningGross = 0;
    let runningInterest = 0;
    let runningNet = 0;
    const currentMonthIndex = new Date().getMonth();
    for (let i = 0; i < monthlyData.length; i++) {
      runningGross += monthlyData[i].realizedGross;
      runningInterest += monthlyData[i].realizedInterest;
      runningNet += monthlyData[i].realizedNet;
      monthlyData[i].cumGross = runningGross;
      monthlyData[i].cumInterest = runningInterest;
      monthlyData[i].cumNet = runningNet;
    }

    // Only show from January through current month for a clean YTD read
    const ytdSlice = monthlyData.slice(0, currentMonthIndex + 1);

    const chartData = {
      labels: ytdSlice.map(d => d.month),
      datasets: [
        // Monthly realized P&L as bars
        {
          type: 'bar' as const,
          label: 'Monthly Realized P&L',
          data: ytdSlice.map(d => d.realizedNet),
          backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.25)',
          borderColor: isDarkMode ? 'rgba(59, 130, 246, 0.6)' : 'rgba(59, 130, 246, 0.6)',
          borderWidth: 1,
          barThickness: 14,
        },
        // YTD Gross line
        {
          type: 'line' as const,
          label: 'YTD Gross',
          data: ytdSlice.map(d => d.cumGross),
          borderColor: isDarkMode ? '#10B981' : '#059669',
          backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(5, 150, 105, 0.15)',
          borderWidth: 2,
          fill: false,
          tension: 0.3,
          pointRadius: 3,
        },
        // YTD Net line
        {
          type: 'line' as const,
          label: 'YTD Net (after interest)',
          data: ytdSlice.map(d => d.cumNet),
          borderColor: isDarkMode ? '#14b8a6' : '#0d9488',
          backgroundColor: isDarkMode ? 'rgba(20, 184, 166, 0.15)' : 'rgba(13, 148, 136, 0.15)',
          borderWidth: 2,
          fill: false,
          tension: 0.3,
          pointRadius: 3,
        },
        // Cumulative Interest line
        {
          type: 'line' as const,
          label: 'Cumulative Interest',
          data: ytdSlice.map(d => d.cumInterest),
          borderColor: isDarkMode ? '#f59e0b' : '#d97706',
          backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(217, 119, 6, 0.15)',
          borderWidth: 2,
          fill: false,
          tension: 0.3,
          pointRadius: 3,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom' as const,
          labels: {
            color: isDarkMode ? '#cbd5e1' : '#374151',
            usePointStyle: true,
            boxWidth: 8,
          },
        },
        tooltip: {
          backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
          titleColor: isDarkMode ? '#F1F5F9' : '#111827',
          bodyColor: isDarkMode ? '#CBD5E1' : '#374151',
          borderColor: isDarkMode ? '#475569' : '#D1D5DB',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          callbacks: {
            title: function(context: any) {
              const idx = context[0].dataIndex;
              return `${ytdSlice[idx].month} ${currentYear}`;
            },
            label: function(context: any) {
              const value = context.parsed.y;
              const formattedValue = value?.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
              return `${context.dataset.label}: ${formattedValue}`;
            }
          }
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: isDarkMode ? '#9CA3AF' : '#6B7280',
            font: {
              size: 11,
            },
          },
        },
        y: {
          grid: {
            color: isDarkMode ? '#374151' : '#E5E7EB',
            opacity: 0.3,
          },
          ticks: {
            color: isDarkMode ? '#9CA3AF' : '#6B7280',
            font: {
              size: 11,
            },
            callback: function(value: any) {
              return `$${value.toLocaleString()}`;
            }
          },
        },
      },
      elements: {
        point: {
          hoverBackgroundColor: isDarkMode ? '#10B981' : '#059669',
        },
      },
    };

    return { chartData, options };
  }, [trades, tradingHistory, isDarkMode]);

  return (
    <div className="w-full">
      {chartData.datasets.length > 0 ? (
        <div className="h-96">
          <ReactChart type="bar" data={chartData} options={options} />
        </div>
      ) : (
        <div className={`flex items-center justify-center h-96 rounded-lg ${
          isDarkMode ? 'bg-slate-800/30' : 'bg-gray-50'
        }`}>
          <div className={`text-center p-8 rounded-2xl shadow-lg ${
            isDarkMode 
              ? 'bg-slate-800/50 border border-slate-700/50' 
              : 'bg-white/90 border border-gray-200/50'
          }`}>
            {/* Professional Chart Icon */}
            <div className={`w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center ${
              isDarkMode 
                ? 'bg-blue-500/20 border border-blue-500/30' 
                : 'bg-blue-50 border border-blue-200'
            }`}>
              <svg className="w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="none">
                {/* Chart line with upward trend */}
                <path d="M3 17L9 11L13 15L21 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 7L17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 7L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                {/* Upward arrow */}
                <path d="M19 5L21 7L19 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            <h3 className={`text-lg font-semibold mb-2 transition-all duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>No YTD Performance Data</h3>
            <p className={`text-sm transition-all duration-300 ${
              isDarkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>Execute your first trade this year to start tracking your YTD performance</p>
          </div>
        </div>
      )}
    </div>
  );
});

PerformanceChart.displayName = 'PerformanceChart';

export default PerformanceChart;