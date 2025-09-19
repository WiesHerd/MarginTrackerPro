import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';

interface ChartData {
  time: UTCTimestamp;
  value: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

interface TradingViewChartProps {
  data: ChartData[];
  isDarkMode: boolean;
  symbol: string;
  currentPrice: number;
}

interface SelectionInfo {
  startTime: UTCTimestamp | null;
  endTime: UTCTimestamp | null;
  startPrice: number | null;
  endPrice: number | null;
  priceDifference: number | null;
  percentageChange: number | null;
  daysDifference: number | null;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({ 
  data, 
  isDarkMode, 
  symbol, 
  currentPrice 
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const [selection, setSelection] = useState<SelectionInfo>({
    startTime: null,
    endTime: null,
    startPrice: null,
    endPrice: null,
    priceDifference: null,
    percentageChange: null,
    daysDifference: null
  });

  useEffect(() => {
    if (!chartContainerRef.current) return;

    try {
      // Create chart
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: isDarkMode ? '#1e293b' : '#ffffff' },
          textColor: isDarkMode ? '#e2e8f0' : '#1f2937',
        },
        grid: {
          vertLines: { color: isDarkMode ? '#334155' : '#e5e7eb' },
          horzLines: { color: isDarkMode ? '#334155' : '#e5e7eb' },
        },
        crosshair: {
          mode: 1,
        },
        rightPriceScale: {
          borderColor: isDarkMode ? '#475569' : '#d1d5db',
        },
        timeScale: {
          borderColor: isDarkMode ? '#475569' : '#d1d5db',
          timeVisible: true,
          secondsVisible: false,
        },
        width: chartContainerRef.current.clientWidth,
        height: 400,
      });

      console.log('Chart created:', chart);
      console.log('Chart methods:', Object.getOwnPropertyNames(chart));

      // Create line series
      const lineSeries = chart.addLineSeries({
        color: isDarkMode ? '#3b82f6' : '#2563eb',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 6,
        priceLineVisible: false,
        lastValueVisible: true,
      });

      console.log('Line series created:', lineSeries);

      // Set data
      lineSeries.setData(data);

      // Store references
      chartRef.current = chart;
      seriesRef.current = lineSeries;

    // Handle point selection
    const handleClick = (param: any) => {
      if (!param.point) return;

      const time = param.time as UTCTimestamp;
      const price = param.seriesData.get(lineSeries)?.value;

      if (!price) return;

      if (!selection.startTime) {
        // First point selection
        setSelection({
          startTime: time,
          endTime: null,
          startPrice: price,
          endPrice: null,
          priceDifference: null,
          percentageChange: null,
          daysDifference: null
        });
      } else if (!selection.endTime) {
        // Second point selection
        const startTime = selection.startTime;
        const startPrice = selection.startPrice;
        
        const priceDiff = price - startPrice;
        const percentageChange = (priceDiff / startPrice) * 100;
        const daysDiff = Math.floor((time - startTime) / (24 * 60 * 60));

        setSelection({
          startTime,
          endTime: time,
          startPrice,
          endPrice: price,
          priceDifference: priceDiff,
          percentageChange,
          daysDifference: daysDiff
        });
      } else {
        // Reset selection
        setSelection({
          startTime: time,
          endTime: null,
          startPrice: price,
          endPrice: null,
          priceDifference: null,
          percentageChange: null,
          daysDifference: null
        });
      }
    };

    // Subscribe to click events
    chart.subscribeClick(handleClick);

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
        }
      };
    } catch (error) {
      console.error('Error creating TradingView chart:', error);
    }
  }, [data, isDarkMode]);

  // Update chart theme when isDarkMode changes
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({
        layout: {
          background: { type: ColorType.Solid, color: isDarkMode ? '#1e293b' : '#ffffff' },
          textColor: isDarkMode ? '#e2e8f0' : '#1f2937',
        },
        grid: {
          vertLines: { color: isDarkMode ? '#334155' : '#e5e7eb' },
          horzLines: { color: isDarkMode ? '#334155' : '#e5e7eb' },
        },
        rightPriceScale: {
          borderColor: isDarkMode ? '#475569' : '#d1d5db',
        },
        timeScale: {
          borderColor: isDarkMode ? '#475569' : '#d1d5db',
        },
      });
    }
  }, [isDarkMode]);

  const formatDate = (timestamp: UTCTimestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="w-full">
      {/* Chart Container */}
      <div 
        ref={chartContainerRef} 
        className="w-full h-96 rounded-lg overflow-hidden"
      />

      {/* Selection Info Panel */}
      {selection.startTime && (
        <div className={`mt-4 p-4 rounded-lg border transition-all duration-300 ${
          isDarkMode 
            ? 'bg-slate-800/50 border-slate-600/50' 
            : 'bg-gray-50/50 border-gray-200/50'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Price Analysis
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Point */}
            <div className={`p-3 rounded-lg ${
              isDarkMode ? 'bg-slate-700/50' : 'bg-white/50'
            }`}>
              <div className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                Start Point
              </div>
              <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatPrice(selection.startPrice!)}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                {formatDate(selection.startTime)}
              </div>
            </div>

            {/* End Point */}
            {selection.endTime && (
              <div className={`p-3 rounded-lg ${
                isDarkMode ? 'bg-slate-700/50' : 'bg-white/50'
              }`}>
                <div className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>
                  End Point
                </div>
                <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatPrice(selection.endPrice!)}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  {formatDate(selection.endTime)}
                </div>
              </div>
            )}
          </div>

          {/* Analysis Results */}
          {selection.priceDifference !== null && (
            <div className={`mt-4 p-4 rounded-lg ${
              isDarkMode ? 'bg-slate-700/30' : 'bg-gray-100/50'
            }`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Price Difference */}
                <div className="text-center">
                  <div className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    Price Change
                  </div>
                  <div className={`text-xl font-bold ${
                    selection.priceDifference >= 0 
                      ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                      : (isDarkMode ? 'text-red-400' : 'text-red-600')
                  }`}>
                    {selection.priceDifference >= 0 ? '+' : ''}{formatPrice(selection.priceDifference)}
                  </div>
                </div>

                {/* Percentage Change */}
                <div className="text-center">
                  <div className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    Percentage Change
                  </div>
                  <div className={`text-xl font-bold ${
                    selection.percentageChange! >= 0 
                      ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                      : (isDarkMode ? 'text-red-400' : 'text-red-600')
                  }`}>
                    {selection.percentageChange! >= 0 ? '+' : ''}{selection.percentageChange!.toFixed(2)}%
                  </div>
                </div>

                {/* Time Period */}
                <div className="text-center">
                  <div className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    Time Period
                  </div>
                  <div className={`text-xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {selection.daysDifference} day{selection.daysDifference !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className={`mt-3 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            {!selection.endTime 
              ? 'Click another point on the chart to see the price difference'
              : 'Click any point to start a new selection'
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingViewChart;
