import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calculator, TrendingUp, Clock, DollarSign, Percent } from 'lucide-react';

interface Trade {
  id: string;
  ticker: string;
  buyPrice: number;
  buyDate: string;
  sellPrice?: number;
  sellDate?: string;
  quantity: number;
  interestRate: number;
  currentPrice?: number;
}

interface HoldingCostCalculatorProps {
  trade: Trade;
  metrics: any;
  isDarkMode: boolean;
  onClose: () => void;
  onApplyRate?: (tradeId: string, rate: number) => void;
  brokerSettings?: {
    baseRate: number;
    marginRates: Array<{
      minBalance: number;
      maxBalance: number;
      marginRate: number;
      effectiveRate: number;
    }>;
  };
}

const HoldingCostCalculator: React.FC<HoldingCostCalculatorProps> = ({
  trade,
  metrics,
  isDarkMode,
  onClose,
  onApplyRate,
  brokerSettings
}) => {
  const [customDays, setCustomDays] = useState<number>(30);
  const [manualDaysHeld, setManualDaysHeld] = useState<number>(metrics.daysHeld);
  const [useManualDays, setUseManualDays] = useState<boolean>(false);
  const [selectedRate, setSelectedRate] = useState<number>(metrics.marginRate);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownDirection, setDropdownDirection] = useState<'up' | 'down'>('down');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [projectedCosts, setProjectedCosts] = useState<{
    [key: string]: {
      days: number;
      interestCost: number;
      totalCost: number;
      dailyCost: number;
      breakEvenPrice: number;
      breakEvenGain: number;
    };
  }>({});

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Calculate dropdown direction and position when opening
  useEffect(() => {
    if (isDropdownOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 240; // Approximate height of dropdown

      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        setDropdownDirection('up');
        setDropdownPosition({
          top: rect.top - dropdownHeight - 8,
          left: rect.left,
          width: rect.width
        });
      } else {
        setDropdownDirection('down');
        setDropdownPosition({
          top: rect.bottom + 8,
          left: rect.left,
          width: rect.width
        });
      }
    }
  }, [isDropdownOpen]);

  // Calculate projected costs for different periods
  useEffect(() => {
    const calculateProjectedCosts = () => {
      const periods = [
        { label: '7 days', days: 7 },
        { label: '14 days', days: 14 },
        { label: '30 days', days: 30 },
        { label: '60 days', days: 60 },
        { label: '90 days', days: 90 },
        { label: 'Custom', days: customDays }
      ];

      const costs: { [key: string]: any } = {};
      
        periods.forEach(period => {
          const dailyRate = selectedRate / 100 / 365;
          const principal = trade.buyPrice * trade.quantity;
          const interestCost = principal * dailyRate * period.days;
          const totalCost = principal + interestCost;
          const dailyCost = interestCost / period.days;
          
          // Break-even calculations
          const breakEvenPrice = trade.buyPrice + (interestCost / trade.quantity);
          const breakEvenGain = (interestCost / principal) * 100;

        costs[period.label] = {
          days: period.days,
          interestCost,
          totalCost,
          dailyCost,
          breakEvenPrice,
          breakEvenGain
        };
      });

      setProjectedCosts(costs);
    };

    calculateProjectedCosts();
  }, [trade, metrics, customDays, selectedRate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Calculate dynamic values based on selected rate
  const getDynamicValues = () => {
    const dailyRate = selectedRate / 100 / 365;
    const principal = trade.buyPrice * trade.quantity;
    const currentInterestCost = principal * dailyRate * metrics.daysHeld;
    const currentDailyCost = currentInterestCost / metrics.daysHeld;
    
    return {
      interestCost: currentInterestCost,
      dailyCost: currentDailyCost,
      totalValue: principal
    };
  };

  const dynamicValues = getDynamicValues();

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(3)}%`;
  };

  // What‑If Profit Simulator state
  const initialSimPrice = (metrics && typeof metrics.currentPrice === 'number')
    ? metrics.currentPrice
    : trade.buyPrice;
  const [simPrice, setSimPrice] = useState<number>(initialSimPrice);
  const [simDays, setSimDays] = useState<number>(30);

  const priceMin = Math.max(0, initialSimPrice * 0.5);
  const priceMax = Math.max(initialSimPrice * 1.5, trade.buyPrice * 1.5);

  const simulatePnL = () => {
    const dailyRate = selectedRate / 100 / 365;
    const principal = trade.buyPrice * trade.quantity;
    const interest = principal * dailyRate * simDays;
    const grossPnL = (simPrice - trade.buyPrice) * trade.quantity;
    const netPnL = grossPnL - interest;
    const breakEvenPrice = trade.buyPrice + (interest / trade.quantity);
    const requiredGainPct = (breakEvenPrice - trade.buyPrice) / trade.buyPrice;
    return { interest, grossPnL, netPnL, breakEvenPrice, requiredGainPct };
  };
  const sim = simulatePnL();

  // Persist last simulator inputs for export convenience
  useEffect(() => {
    try {
      const payload = {
        ticker: trade.ticker,
        buyPrice: trade.buyPrice,
        quantity: trade.quantity,
        hypoPrice: simPrice,
        days: simDays,
        interest: sim.interest,
        netPnL: sim.netPnL,
        breakEvenPrice: sim.breakEvenPrice,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('simulatorLast', JSON.stringify(payload));
    } catch {}
  }, [trade.ticker, trade.buyPrice, trade.quantity, simPrice, simDays, sim.interest, sim.netPnL, sim.breakEvenPrice]);

  return (
    <div className="space-y-4">
      {/* Hero Section - Current Position */}
      <div className={`relative overflow-hidden rounded-xl p-4 transition-all duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 border border-slate-600/30' 
          : 'bg-gradient-to-br from-white via-gray-50 to-white border border-gray-200/50'
      } shadow-lg`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20"></div>
        </div>
        
        <div className="relative">
          {/* Compact Metrics Row */}
          <div className="flex items-center justify-between gap-4">
            {/* Rate Selector */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className={`text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                }`}>Rate</span>
                <div className="relative" ref={dropdownRef}>
                  {/* Custom dropdown display */}
                  <div
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-24 px-2 py-1 rounded-lg border text-center font-bold text-sm transition-all duration-300 cursor-pointer flex items-center justify-between ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-blue-300 hover:border-blue-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-500/30' 
                        : 'bg-white border-gray-300 text-blue-600 hover:border-blue-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-500/30'
                    }`}
                  >
                    <span>{selectedRate.toFixed(3)}%</span>
                    <svg 
                      className={`w-3 h-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Dropdown options - rendered as portal */}
                  {isDropdownOpen && createPortal(
                    <div 
                      className={`fixed z-[9999] w-64 rounded-lg shadow-lg border max-h-60 overflow-auto ${
                        isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'
                      }`}
                      style={{
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                        width: `${dropdownPosition.width}px`
                      }}
                    >
                      {brokerSettings?.marginRates.map((rate, index) => {
                        const formatToK = (amount: number) => {
                          if (amount >= 1000) {
                            return `$${(amount / 1000).toFixed(1)}K`;
                          }
                          return `$${amount.toLocaleString()}`;
                        };
                        return (
                          <div
                            key={index}
                            onClick={() => {
                              setSelectedRate(rate.effectiveRate);
                              setIsDropdownOpen(false);
                            }}
                            className={`px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors ${
                              selectedRate === rate.effectiveRate 
                                ? (isDarkMode ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-700')
                                : (isDarkMode ? 'text-blue-200 hover:bg-blue-700' : 'text-gray-900')
                            }`}
                          >
                            <div className="text-sm">
                              {formatToK(rate.minBalance)} - {formatToK(rate.maxBalance)} ({rate.effectiveRate.toFixed(3)}%)
                            </div>
                          </div>
                        );
                      })}
                    </div>,
                    document.body
                  )}
                </div>
              </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span className={`text-xs font-medium transition-all duration-300 ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                }`}>Interest:</span>
                <span className={`text-sm font-bold transition-all duration-300 ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`}>
                  {formatCurrency(dynamicValues.interestCost)}
                </span>
                <button
                  onClick={() => {
                    console.log('Apply rate clicked:', trade.id, selectedRate);
                    if (onApplyRate) {
                      onApplyRate(trade.id, selectedRate);
                    } else {
                      console.log('onApplyRate not provided');
                    }
                  }}
                  className={`ml-2 px-3 py-1 rounded-lg border-2 text-xs font-bold transition-all duration-200 ${
                    isDarkMode
                      ? 'border-blue-500 bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 hover:border-blue-400'
                      : 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-400'
                  }`}
                  title="Apply this rate to the position"
                >
                  Apply rate
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span className={`text-xs font-medium transition-all duration-300 ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                }`}>Daily:</span>
                <span className={`text-sm font-bold transition-all duration-300 ${
                  isDarkMode ? 'text-orange-400' : 'text-orange-600'
                }`}>
                  {formatCurrency(dynamicValues.dailyCost)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className={`text-xs font-medium transition-all duration-300 ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                }`}>Value:</span>
                <span className={`text-sm font-bold transition-all duration-300 ${
                  isDarkMode ? 'text-green-400' : 'text-green-600'
                }`}>
                  {formatCurrency(dynamicValues.totalValue)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Projected Costs Table */}
      <div className={`relative overflow-hidden rounded-xl transition-all duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-800/80 to-slate-700/80 border border-slate-600/30' 
          : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200/50'
      } shadow-lg`}>
          {/* Header */}
          <div className="p-4 border-b border-slate-600/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-3 w-3 text-white" />
                </div>
                <h4 className={`font-bold text-lg transition-all duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Projected Holding Costs</h4>
              </div>
              <div className="flex items-center gap-3">
                <Calculator className={`h-4 w-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <div className="flex items-center gap-2">
                  <div className={`text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                    isDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}>Model Period</div>
                  <input
                    type="number"
                    value={customDays}
                    onChange={(e) => setCustomDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className={`w-16 px-2 py-1 rounded border text-center font-bold text-sm transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white focus:border-purple-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-purple-500'
                    } focus:outline-none focus:ring-1 focus:ring-purple-500/20`}
                    min="1"
                    max="365"
                    aria-label="Custom holding period in days"
                  />
                  <span className={`text-xs font-medium transition-all duration-300 ${
                    isDarkMode ? 'text-slate-400' : 'text-gray-600'
                  }`}>days</span>
                </div>
              </div>
            </div>
          </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b transition-all duration-300 ${
                isDarkMode ? 'border-slate-600/30' : 'border-gray-200/50'
              }`}>
                <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-600'
                }`}>Period</th>
                <th className={`px-4 py-3 text-right text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-600'
                }`}>Interest Cost</th>
                <th className={`px-4 py-3 text-right text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-600'
                }`}>Daily Cost</th>
                <th className={`px-4 py-3 text-right text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-600'
                }`}>Break-Even Price</th>
                <th className={`px-4 py-3 text-right text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-600'
                }`}>Gain Required</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(projectedCosts).map(([period, cost], index) => (
                <tr key={period} className={`transition-all duration-300 ${
                  index % 2 === 0 
                    ? (isDarkMode ? 'bg-slate-800/30' : 'bg-gray-50/50')
                    : (isDarkMode ? 'bg-slate-800/10' : 'bg-white/50')
                } hover:bg-opacity-80`}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300 ${
                        period === 'Custom' 
                          ? (isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100')
                          : (isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100')
                      }`}>
                        <Clock className={`h-3 w-3 ${
                          period === 'Custom' 
                            ? (isDarkMode ? 'text-purple-400' : 'text-purple-600')
                            : (isDarkMode ? 'text-blue-600' : 'text-blue-600')
                        }`} />
                      </div>
                      <div>
                        <div className={`text-sm font-bold transition-all duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {period}
                        </div>
                        {period === 'Custom' && (
                          <div className={`text-xs transition-all duration-300 ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-500'
                          }`}>
                            {cost.days} days
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className={`text-base font-bold transition-all duration-300 ${
                      isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`}>
                      {formatCurrency(cost.interestCost)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className={`text-base font-bold transition-all duration-300 ${
                      isDarkMode ? 'text-orange-400' : 'text-orange-600'
                    }`}>
                      {formatCurrency(cost.dailyCost)}
                    </div>
                    <div className={`text-xs transition-all duration-300 ${
                      isDarkMode ? 'text-slate-400' : 'text-gray-500'
                    }`}>
                      per day
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className={`text-base font-bold transition-all duration-300 ${
                      isDarkMode ? 'text-green-400' : 'text-green-600'
                    }`}>
                      {formatCurrency(cost.breakEvenPrice)}
                    </div>
                    <div className={`text-xs transition-all duration-300 ${
                      isDarkMode ? 'text-slate-400' : 'text-gray-500'
                    }`}>
                      vs {formatCurrency(trade.buyPrice)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                        : 'bg-orange-100 text-orange-700 border border-orange-200'
                    }`}>
                      +{cost.breakEvenGain.toFixed(1)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* What‑If Profit Simulator */}
      <div className={`relative overflow-hidden rounded-xl transition-all duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-800/80 to-slate-700/80 border border-slate-600/30' 
          : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200/50'
      } shadow-lg`}>
        <div className="p-4 border-b border-slate-600/20">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <DollarSign className="h-3 w-3 text-white" />
            </div>
            <h4 className={`font-bold text-lg transition-all duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>What‑If Profit Simulator</h4>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hypothetical Price */}
            <div>
              <div className={`text-xs font-semibold uppercase mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Hypothetical Price</div>
              <input
                type="range"
                min={priceMin}
                max={priceMax}
                step={0.01}
                value={simPrice}
                onChange={(e) => setSimPrice(parseFloat(e.target.value))}
                className="w-full h-1.5 appearance-none rounded-full bg-gray-300/60 accent-blue-600"
              />
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={simPrice}
                  onChange={(e) => setSimPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  className={`w-32 px-2 py-1 rounded border text-sm font-semibold ${
                    isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Range {formatCurrency(priceMin)} – {formatCurrency(priceMax)}
                </div>
              </div>
            </div>

            {/* Days Open */}
            <div>
              <div className={`text-xs font-semibold uppercase mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Days Open</div>
              <input
                type="range"
                min={1}
                max={365}
                step={1}
                value={simDays}
                onChange={(e) => setSimDays(parseInt(e.target.value) || 1)}
                className="w-full h-1.5 appearance-none rounded-full bg-gray-300/60 accent-blue-600"
              />
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={simDays}
                  onChange={(e) => setSimDays(Math.min(365, Math.max(1, parseInt(e.target.value) || 1)))}
                  className={`w-20 px-2 py-1 rounded border text-sm font-semibold ${
                    isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>days</div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`rounded-lg p-3 border ${isDarkMode ? 'bg-slate-800/50 border-slate-600/30' : 'bg-gray-100/50 border-gray-200'}`}>
              <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Net P&L</div>
              <div className={`text-lg font-bold ${sim.netPnL >= 0 ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-red-400' : 'text-red-600')}`}>{formatCurrency(sim.netPnL)}</div>
            </div>
            <div className={`rounded-lg p-3 border ${isDarkMode ? 'bg-slate-800/50 border-slate-600/30' : 'bg-gray-100/50 border-gray-200'}`}>
              <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Interest (sim)</div>
              <div className={`text-lg font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{formatCurrency(sim.interest)}</div>
            </div>
            <div className={`rounded-lg p-3 border ${isDarkMode ? 'bg-slate-800/50 border-slate-600/30' : 'bg-gray-100/50 border-gray-200'}`}>
              <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Break‑Even Price</div>
              <div className={`text-lg font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{formatCurrency(sim.breakEvenPrice)}</div>
            </div>
            <div className={`rounded-lg p-3 border ${isDarkMode ? 'bg-slate-800/50 border-slate-600/30' : 'bg-gray-100/50 border-gray-200'}`}>
              <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Gain Required</div>
              <div className={`text-lg font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>{(sim.requiredGainPct * 100).toFixed(2)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Persist rate button relocated next to Interest label */}


      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className={`px-4 py-2 rounded-lg border transition-all duration-300 ${
            isDarkMode 
              ? 'border-slate-600 text-slate-300 hover:bg-slate-700/50' 
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default HoldingCostCalculator;
