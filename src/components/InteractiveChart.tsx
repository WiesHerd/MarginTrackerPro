import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart, Area, Bar, Cell } from 'recharts';

interface ChartData {
  date: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  // Optional precomputed overlays
  volSMA20?: number | null;
  sma50?: number | null;
  sma200?: number | null;
  bbMid?: number | null;
  bbUpper?: number | null;
  bbLower?: number | null;
}

interface InteractiveChartProps {
  data: ChartData[];
  isDarkMode: boolean;
  symbol: string;
  showBands?: boolean;
  showSMA50?: boolean;
  showSMA200?: boolean;
  showVolSMA?: boolean;
  dividends?: { date: string; amount?: number }[];
  splits?: { date: string; ratio?: string }[];
}

interface SelectionInfo {
  startPoint: ChartData | null;
  endPoint: ChartData | null;
  priceDifference: number | null;
  percentageChange: number | null;
  daysDifference: number | null;
}

const InteractiveChart: React.FC<InteractiveChartProps> = ({ 
  data, isDarkMode, symbol,
  showBands = true,
  showSMA50 = true,
  showSMA200 = true,
  showVolSMA = true,
  dividends = [],
  splits = [],
}) => {
  const [selection, setSelection] = useState<SelectionInfo>({
    startPoint: null,
    endPoint: null,
    priceDifference: null,
    percentageChange: null,
    daysDifference: null
  });

  // Use precomputed overlays if present; else compute locally
  const processedData = React.useMemo(() => {
    if (data.length > 0 && (data[0] as any).sma50 !== undefined) {
      // Assume all overlays provided
      return data as any[];
    }
    // Helpers
    const sma = (arr: number[], period: number) => {
      const out: (number | null)[] = [];
      let sum = 0;
      for (let i = 0; i < arr.length; i++) {
        sum += arr[i];
        if (i >= period) sum -= arr[i - period];
        out.push(i >= period - 1 ? sum / period : null);
      }
      return out;
    };
    const stddev = (arr: number[], period: number, means: (number | null)[]) => {
      const out: (number | null)[] = [];
      for (let i = 0; i < arr.length; i++) {
        if (i < period - 1 || means[i] == null) { out.push(null); continue; }
        const start = i - period + 1;
        const slice = arr.slice(start, i + 1);
        const mean = means[i] as number;
        const variance = slice.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / period;
        out.push(Math.sqrt(variance));
      }
      return out;
    };

    const closes = data.map(p => (p.close ?? p.price) || 0);
    const volumes = data.map(p => p.volume || 0);

    const volSMA20 = sma(volumes, 20);
    const sma50 = sma(closes, 50);
    const sma200 = sma(closes, 200);
    const midBB = sma(closes, 20);
    const sd20 = stddev(closes, 20, midBB);

    return data.map((point, index) => {
      const middle = midBB[index];
      const sd = sd20[index];
      const upper = middle != null && sd != null ? middle + 2 * sd : null;
      const lower = middle != null && sd != null ? middle - 2 * sd : null;
      return {
        ...point,
        volSMA20: volSMA20[index] ?? null,
        sma50: sma50[index] ?? null,
        sma200: sma200[index] ?? null,
        bbMid: middle ?? null,
        bbUpper: upper,
        bbLower: lower,
      };
    });
  }, [data]);

  const yExtents = React.useMemo(() => {
    if (!processedData.length) return { minY: 0, maxY: 0 };
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    processedData.forEach(p => {
      const lo = p.low ?? p.price;
      const hi = p.high ?? p.price;
      if (lo < minY) minY = lo;
      if (hi > maxY) maxY = hi;
    });
    return { minY, maxY };
  }, [processedData]);

  const divColor = isDarkMode ? '#22C55E' : '#16A34A';
  const splitColor = isDarkMode ? '#60A5FA' : '#3B82F6';

  const handlePointClick = (data: any, index: number) => {
    const point = data.payload;
    
    if (!selection.startPoint) {
      // First point selection
      setSelection({
        startPoint: point,
        endPoint: null,
        priceDifference: null,
        percentageChange: null,
        daysDifference: null
      });
    } else if (!selection.endPoint) {
      // Second point selection
      const startPoint = selection.startPoint;
      const priceDiff = point.price - startPoint.price;
      const percentageChange = (priceDiff / startPoint.price) * 100;
      const startDate = new Date(startPoint.date);
      const endDate = new Date(point.date);
      const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      setSelection({
        startPoint,
        endPoint: point,
        priceDifference: priceDiff,
        percentageChange,
        daysDifference: daysDiff
      });
    } else {
      // Reset selection
      setSelection({
        startPoint: point,
        endPoint: null,
        priceDifference: null,
        percentageChange: null,
        daysDifference: null
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
      <div className={`h-96 rounded-xl p-4 transition-all duration-300 ${
        isDarkMode ? 'bg-slate-900/30' : 'bg-gray-50'
      }`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={processedData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            onClick={handlePointClick}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={isDarkMode ? '#374151' : '#e5e7eb'} 
              opacity={0.3} 
            />
            <XAxis 
              dataKey="date" 
              hide={true}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
              stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              domain={[`dataMin - 2`, `dataMax + 2`]}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const hasOHLC = data.open && data.high && data.low && data.close;
                  const change = data.close ? (data.close - data.open) : 0;
                  const changePercent = data.open ? ((change / data.open) * 100) : 0;
                  const labelDate = typeof label === 'string' ? label : data?.date;
                  const divInfo = dividends.find(d => d.date === labelDate);
                  const splitInfo = splits.find(s => s.date === labelDate);
                  
                  return (
                    <div className={`border rounded-lg p-4 shadow-xl min-w-[320px] transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-slate-800 border-slate-600' 
                        : 'bg-white border-gray-200'
                    }`}>
                      <div className={`text-sm font-bold mb-3 flex items-center gap-2 transition-all duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        <span>{data.dayOfWeek || new Date(label).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        <span>{data.formattedDate || new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        {hasOHLC ? (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex justify-between">
                                <span className={`transition-all duration-300 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Open:</span>
                                <span className={`font-mono transition-all duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>${data.open.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className={`transition-all duration-300 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>High:</span>
                                <span className={`font-mono transition-all duration-300 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>${data.high.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className={`transition-all duration-300 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Low:</span>
                                <span className={`font-mono transition-all duration-300 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>${data.low.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className={`transition-all duration-300 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Close:</span>
                                <span className={`font-mono font-bold transition-all duration-300 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>${data.close.toFixed(2)}</span>
                              </div>
                            </div>
                            <div className={`border-t pt-2 mt-2 transition-all duration-300 ${
                              isDarkMode ? 'border-slate-600' : 'border-gray-300'
                            }`}>
                              <div className="flex justify-between">
                                <span className={`transition-all duration-300 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Change:</span>
                                <span className={`font-mono font-bold transition-all duration-300 ${
                                  (data.change || change) >= 0 
                                    ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                                    : (isDarkMode ? 'text-red-400' : 'text-red-600')
                                }`}>
                                  {(data.change || change) >= 0 ? '+' : ''}${(data.change || change).toFixed(2)} ({(data.changePercent || changePercent) >= 0 ? '+' : ''}{(data.changePercent || changePercent).toFixed(2)}%)
                                </span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between">
                            <span className={`transition-all duration-300 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Price:</span>
                            <span className={`font-mono font-bold transition-all duration-300 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>${data.price.toFixed(2)}</span>
                          </div>
                        )}
                        {data.volume && data.volume > 0 && (
                          <div className={`flex justify-between border-t pt-2 mt-2 transition-all duration-300 ${
                            isDarkMode ? 'border-slate-600' : 'border-gray-300'
                          }`}>
                            <span className={`transition-all duration-300 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Volume:</span>
                            <span className={`font-mono transition-all duration-300 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>{data.volume.toLocaleString()}</span>
                          </div>
                        )}
                        {data.high && data.low && (
                          <div className={`flex justify-between border-t pt-2 mt-2 transition-all duration-300 ${
                            isDarkMode ? 'border-slate-600' : 'border-gray-300'
                          }`}>
                            <span className={`transition-all duration-300 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Range:</span>
                            <span className={`font-mono transition-all duration-300 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>${(data.high - data.low).toFixed(2)}</span>
                          </div>
                        )}
                        {(divInfo || splitInfo) && (
                          <div className={`flex justify-between border-t pt-2 mt-2 transition-all duration-300 ${
                            isDarkMode ? 'border-slate-600' : 'border-gray-300'
                          }`}>
                            <span className={`transition-all duration-300 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Events:</span>
                            <span className="text-right">
                              {divInfo && (
                                <span className={isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}>
                                  Dividend{typeof divInfo.amount === 'number' ? ` $${divInfo.amount.toFixed(2)}` : ''}
                                </span>
                              )}
                              {divInfo && splitInfo && <span className={isDarkMode ? 'text-slate-500' : 'text-gray-500'}> • </span>}
                              {splitInfo && (
                                <span className={isDarkMode ? 'text-sky-300' : 'text-sky-700'}>
                                  Split{splitInfo.ratio ? ` ${splitInfo.ratio}` : ''}
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            

            <Line 
              type="monotone" 
              dataKey="price" 
              stroke={isDarkMode ? '#10B981' : '#059669'} 
              strokeWidth={2.5} 
              dot={false}
              activeDot={{ 
                r: 6, 
                fill: isDarkMode ? '#3B82F6' : '#2563EB',
                stroke: isDarkMode ? '#1E40AF' : '#1D4ED8',
                strokeWidth: 2
              }}
            />

            {/* Bollinger Bands area */}
            {showBands && <Area
              type="monotone"
              dataKey="bbUpper"
              stroke={isDarkMode ? 'rgba(148,163,184,0.6)' : 'rgba(100,116,139,0.6)'}
              fill="transparent"
              dot={false}
              isAnimationActive={false}
            />}
            {showBands && <Area
              type="monotone"
              dataKey="bbLower"
              stroke={isDarkMode ? 'rgba(148,163,184,0.6)' : 'rgba(100,116,139,0.6)'}
              fill={isDarkMode ? 'rgba(148,163,184,0.15)' : 'rgba(100,116,139,0.15)'}
              dot={false}
              isAnimationActive={false}
            />}
            {/* Middle band */}
            {showBands && <Line
              type="monotone"
              dataKey="bbMid"
              stroke={isDarkMode ? '#94A3B8' : '#64748B'}
              strokeWidth={1.5}
              dot={false}
            />}

            {/* Moving averages */}
            {showSMA50 && <Line
              type="monotone"
              dataKey="sma50"
              stroke={isDarkMode ? '#EF4444' : '#DC2626'}
              strokeWidth={1.75}
              dot={false}
              name="MA 50"
            />}
            {showSMA200 && <Line
              type="monotone"
              dataKey="sma200"
              stroke={isDarkMode ? '#F97316' : '#EA580C'}
              strokeWidth={2}
              dot={false}
              name="MA 200"
            />}

            {/* Dividend and Split markers at baseline */}
            {dividends.map((d, i) => (
              <ReferenceDot key={`div-${i}`} x={d.date} y={yExtents.minY} r={4}
                fill={divColor} stroke="none"
                label={{ value: 'D', position: 'top', fill: divColor, fontSize: 10 }}
              />
            ))}
            {splits.map((s, i) => (
              <ReferenceDot key={`split-${i}`} x={s.date} y={yExtents.minY} r={4}
                fill={splitColor} stroke="none"
                label={{ value: 'S', position: 'top', fill: splitColor, fontSize: 10 }}
              />
            ))}
            {/* Highlight selected points */}
            {selection.startPoint && (
              <ReferenceLine 
                x={selection.startPoint.date} 
                stroke={isDarkMode ? '#3B82F6' : '#2563EB'} 
                strokeDasharray="5 5"
                strokeWidth={2}
              />
            )}
            {selection.endPoint && (
              <ReferenceLine 
                x={selection.endPoint.date} 
                stroke={isDarkMode ? '#10B981' : '#059669'} 
                strokeDasharray="5 5"
                strokeWidth={2}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Volume sub-chart */}
      <div className={`h-28 rounded-b-xl px-4 pb-4 -mt-2 transition-all duration-300 ${
        isDarkMode ? 'bg-slate-900/30' : 'bg-gray-50'
      }`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={processedData} margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} opacity={0.15} />
            <XAxis 
              dataKey="date"
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
              stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis yAxisId="volume" orientation="right" tickFormatter={(v) => `${Math.round(v/1_000_000)}M`} stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className={`border rounded-lg px-3 py-2 text-xs transition-all duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                      <div className="flex justify-between gap-6">
                        <span>Volume</span>
                        <span className={`font-mono ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>{(d.volume || 0).toLocaleString()}</span>
                      </div>
                      {showVolSMA && (
                        <div className="flex justify-between gap-6 mt-1">
                          <span>Vol SMA 20</span>
                          <span className={`font-mono ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>{d.volSMA20 ? Math.round(d.volSMA20).toLocaleString() : '—'}</span>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar yAxisId="volume" dataKey="volume" barSize={6}>
              {processedData.map((entry, idx) => {
                const isUp = (entry.close ?? entry.price) >= (entry.open ?? entry.price);
                const upFill = isDarkMode ? 'rgba(16, 185, 129, 0.8)' : 'rgba(5, 150, 105, 0.8)';
                const downFill = isDarkMode ? 'rgba(239, 68, 68, 0.8)' : 'rgba(220, 38, 38, 0.8)';
                return <Cell key={`vol-sub-${idx}`} fill={isUp ? upFill : downFill} />;
              })}
            </Bar>
            {showVolSMA && (
              <Line yAxisId="volume" type="monotone" dataKey="volSMA20" stroke={isDarkMode ? '#8B5CF6' : '#6366F1'} strokeDasharray="4 4" dot={false} strokeWidth={1.5} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className={`mt-2 text-xs flex flex-wrap items-center gap-4 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
        <span className="inline-flex items-center gap-2"><span className="w-3 h-1 rounded bg-emerald-500"></span>Price</span>
        {showSMA50 && <span className="inline-flex items-center gap-2"><span className="w-3 h-1 rounded bg-red-500"></span>SMA 50</span>}
        {showSMA200 && <span className="inline-flex items-center gap-2"><span className="w-3 h-1 rounded bg-orange-500"></span>SMA 200</span>}
        {showBands && <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded border border-slate-400 bg-slate-400/20"></span>Bollinger (20,2)</span>}
        <span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-600"></span>Dividend</span>
        <span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-600"></span>Split</span>
        <span className="inline-flex items-center gap-2"><span className="w-3 h-0.5 rounded bg-indigo-500"></span>Vol SMA 20</span>
      </div>

      {/* Selection Info Panel */}
      {selection.startPoint && (
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
                {formatPrice(selection.startPoint.price)}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                {formatDate(selection.startPoint.date)}
              </div>
            </div>

            {/* End Point */}
            {selection.endPoint && (
              <div className={`p-3 rounded-lg ${
                isDarkMode ? 'bg-slate-700/50' : 'bg-white/50'
              }`}>
                <div className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>
                  End Point
                </div>
                <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatPrice(selection.endPoint.price)}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  {formatDate(selection.endPoint.date)}
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
            {!selection.endPoint 
              ? 'Click another point on the chart to see the price difference'
              : 'Click any point to start a new selection'
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveChart;
