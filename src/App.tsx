import React, { useState, useEffect } from 'react';
import { fetchYahooQuotes, fetchQuoteSummary } from './utils/yahoo';
import * as Papa from 'papaparse';
import { Search, TrendingUp, DollarSign, BarChart3, X, Clock, Calculator, Trash2, TrendingDown, Download, FileText, Percent } from 'lucide-react';
import InteractiveChart from './components/InteractiveChart';
import HoldingCostCalculator from './components/HoldingCostCalculator';
// Performance screen removed

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
  date?: string;
  side?: string;
  qty?: number;
  price?: number;
  action?: 'SELL' | 'PARTIAL_SELL';
}

interface MarginRate {
  minBalance: number;
  maxBalance: number;
  marginRate: number;
  effectiveRate: number;
}

interface BrokerSettings {
  baseRate: number;
  marginRates: MarginRate[];
}

const App: React.FC = () => {
  const [ticker, setTicker] = useState('');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentTickers, setRecentTickers] = useState<string[]>(() => {
    const saved = localStorage.getItem('recentTickers');
    return saved ? JSON.parse(saved) : [];
  });
  const [trades, setTrades] = useState<Trade[]>(() => {
    const saved = localStorage.getItem('marginTrades');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [tradingHistory, setTradingHistory] = useState<Trade[]>(() => {
    const saved = localStorage.getItem('tradingHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [sellForm, setSellForm] = useState<{ price: string; date: string; qty: string }>({
    price: '',
    date: new Date().toISOString().split('T')[0],
    qty: ''
  });
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedMarginRate, setSelectedMarginRate] = useState<number>(12.575);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [activeScreen, setActiveScreen] = useState<'trading' | 'market'>('trading');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('isDarkMode');
    return saved ? JSON.parse(saved) : false; // Default to light mode
  });
  const [priceUpdateInterval, setPriceUpdateInterval] = useState<NodeJS.Timeout | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(() => {
    const saved = localStorage.getItem('autoRefreshEnabled');
    return saved ? JSON.parse(saved) : false;
  });
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<string | null>(null);
  const [showHoldingCalculator, setShowHoldingCalculator] = useState<{
    trade: Trade;
    metrics: any;
  } | null>(null);

  useEffect(() => {
    if (selectedTrade) {
      setSellForm({ price: '', date: new Date().toISOString().split('T')[0], qty: '' });
    }
  }, [selectedTrade]);
  const [tickerMarketData, setTickerMarketData] = useState<Record<string, { volume: number | null, isMarketOpen: boolean | null }>>({});
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('1M');
  const [analystCard, setAnalystCard] = useState<{
    recommendation?: string;
    recommendationMean?: number;
    targetMean?: number;
    targetHigh?: number;
    targetLow?: number;
    earningsDate?: string;
    dividendDate?: string;
  } | null>(null);
  // Base chart series without overlays (warm buffer included)
  const [baseChart, setBaseChart] = useState<any[]>([]);
  const [overlayOptions, setOverlayOptions] = useState({
    bands: true,
    sma50: true,
    sma200: true,
    volSMA: true,
  });
  const [overlayParams, setOverlayParams] = useState({
    bbPeriod: 20,
    bbStdDev: 2,
    sma50: 50,
    sma200: 200,
    volSMA: 20,
  });
  const [eventMarkers, setEventMarkers] = useState<{ dividends: { date: string; amount?: number }[]; splits: { date: string; ratio?: string }[] }>({ dividends: [], splits: [] });
  const [brokerSettings] = useState<BrokerSettings>({
    baseRate: 10.75, // Base rate from your data
    marginRates: [
      { minBalance: 0, maxBalance: 24999.99, marginRate: 1.825, effectiveRate: 12.575 },
      { minBalance: 25000, maxBalance: 49999.99, marginRate: 1.325, effectiveRate: 12.075 },
      { minBalance: 50000, maxBalance: 99999.99, marginRate: 0.375, effectiveRate: 11.125 },
      { minBalance: 100000, maxBalance: 249999.99, marginRate: 0.325, effectiveRate: 11.075 },
      { minBalance: 250000, maxBalance: 499999.99, marginRate: 0.075, effectiveRate: 10.825 }
    ]
  });

  // Recompute overlays whenever parameters or baseChart change
  useEffect(() => {
    if (!baseChart.length) return;
    const closes = baseChart.map((p: any) => p.price);
    const vols = baseChart.map((p: any) => p.volume || 0);
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

    const volSMA = sma(vols, overlayParams.volSMA);
    const sma50Arr = sma(closes, overlayParams.sma50);
    const sma200Arr = sma(closes, overlayParams.sma200);
    const mid = sma(closes, overlayParams.bbPeriod);
    const sd = stddev(closes, overlayParams.bbPeriod, mid);

    const withOverlays = baseChart.map((p: any, i: number) => ({
      ...p,
      volSMA20: volSMA[i],
      sma50: sma50Arr[i],
      sma200: sma200Arr[i],
      bbMid: mid[i],
      bbUpper: mid[i] != null && sd[i] != null ? (mid[i] as number) + overlayParams.bbStdDev * (sd[i] as number) : null,
      bbLower: mid[i] != null && sd[i] != null ? (mid[i] as number) - overlayParams.bbStdDev * (sd[i] as number) : null,
    }));

    const visible = getVisiblePoints(selectedTimePeriod);
    const finalData = withOverlays.length > visible ? withOverlays.slice(-visible) : withOverlays;
    setChartData(finalData);
  }, [baseChart, overlayParams, selectedTimePeriod]);

  // Helper to determine visible points for the selected range
  const getVisiblePoints = (timePeriodKey: string) => {
    if (timePeriodKey === '3mo') return 90;
    if (timePeriodKey === '6mo') return 180;
    if (timePeriodKey === '1y') return 365;
    return 30; // 1M default
  };

  // Real API price fetching using Vercel API route
  const fetchPrice = async (symbol: string, timePeriod: string = selectedTimePeriod) => {
    setLoading(true);
    try {
      // Use Vercel API route for production, fallback to proxy for development
      const isProduction = window.location.hostname !== 'localhost';
      const apiUrl = isProduction 
        ? `/api/fetch-price?symbol=${symbol}&timePeriod=${timePeriod}`
        : `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?range=${timePeriod === '1M' ? '1mo' : timePeriod}&interval=1d&region=US&lang=en-US`)}`;
      
      console.log('[fetchPrice] fetching', apiUrl);
      const response = await fetch(apiUrl);
      const data = await response.json();
      console.log('[fetchPrice] response received');
      
      // Handle both API route response and proxy response
      if (data.success && data.price) {
        // New API route format
        console.log('[fetchPrice] API route price', data.price);
        setCurrentPrice(data.price);
        setChartData(data.chartData || []);
        updateAllTradesWithCurrentPrice(symbol.toUpperCase(), data.price);
        console.log('API route data processed:', data.chartData?.length || 0, 'points');
        
        // Save to recent tickers
        const upperSymbol = symbol.toUpperCase();
        const newRecentTickers = [upperSymbol, ...recentTickers.filter(t => t !== upperSymbol)].slice(0, 10);
        setRecentTickers(newRecentTickers);
        localStorage.setItem('recentTickers', JSON.stringify(newRecentTickers));
      } else if (data.chart && data.chart.result && data.chart.result[0]) {
        // Legacy proxy format
        console.log('[fetchPrice] proxy result path');
        const result = data.chart.result[0];
        const price = result.meta.regularMarketPrice;
        setCurrentPrice(price);
        setChartData([]);
        updateAllTradesWithCurrentPrice(symbol.toUpperCase(), price);
        
        // Save to recent tickers
        const upperSymbol = symbol.toUpperCase();
        const newRecentTickers = [upperSymbol, ...recentTickers.filter(t => t !== upperSymbol)].slice(0, 10);
        setRecentTickers(newRecentTickers);
        localStorage.setItem('recentTickers', JSON.stringify(newRecentTickers));
        
         // Extract comprehensive historical data for chart
         if (result.timestamp && result.indicators && result.indicators.quote) {
           const timestamps = result.timestamp;
           const quotes = result.indicators.quote[0];
           const events = result.events || {};
           
           // Create comprehensive chart data with all OHLC data
           const chartPoints = timestamps.map((timestamp: number, index: number) => {
             const open = quotes.open[index];
             const high = quotes.high[index];
             const low = quotes.low[index];
             const close = quotes.close[index];
             const volume = quotes.volume[index];
             
             // Only include points with valid close price
             if (close && close > 0) {
               const date = new Date(timestamp * 1000);
               const change = close - open;
               const changePercent = open ? (change / open) * 100 : 0;
               
               return {
                 date: date.toISOString().split('T')[0],
                 price: close, // Use close as the main price for the line
                 open: open || close,
                 high: high || close,
                 low: low || close,
                 volume: volume || 0,
                 change: change,
                 changePercent: changePercent,
                 dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
                 formattedDate: date.toLocaleDateString('en-US', { 
                   month: 'short', 
                   day: 'numeric',
                   year: 'numeric'
                 })
               };
             }
             return null;
          }).filter((point: any) => point !== null); // Remove invalid points
           
           // Warm-up buffer so overlays initialize from left edge
           const buffer = Math.max(overlayParams.bbPeriod, overlayParams.sma200, overlayParams.volSMA) + 10;
           const takePoints = getVisiblePoints(timePeriod) + buffer;
           const warm = chartPoints.length > takePoints ? chartPoints.slice(-takePoints) : chartPoints;
           setBaseChart(warm);
           // Extract markers from events (dividends/splits)
           const dividends = events.dividends ? Object.values(events.dividends).map((d: any) => ({
             date: new Date((d.date || d.timestamp) * 1000).toISOString().split('T')[0],
             amount: d.amount,
           })) : [];
           const splits = events.splits ? Object.values(events.splits).map((s: any) => ({
             date: new Date((s.date || s.timestamp) * 1000).toISOString().split('T')[0],
             ratio: s.numerator && s.denominator ? `${s.numerator}:${s.denominator}` : s.splitRatio,
           })) : [];
           setEventMarkers({ dividends, splits });
         }
        // Non-blocking fetch for analyst/earnings card
        fetchQuoteSummary(symbol.toUpperCase())
          .then(summary => {
            if (!summary) return;
            const trend = summary.recommendationTrend?.trend?.[0];
            const fin = summary.financialData;
            const cal = summary.calendarEvents;
            setAnalystCard({
              recommendation: trend?.rating || undefined,
              recommendationMean: fin?.recommendationMean?.raw ?? summary.price?.recommendationMean?.raw,
              targetMean: fin?.targetMeanPrice?.raw ?? undefined,
              targetHigh: fin?.targetHighPrice?.raw ?? undefined,
              targetLow: fin?.targetLowPrice?.raw ?? undefined,
              earningsDate: cal?.earnings?.earningsDate?.[0]?.fmt ?? cal?.earningsDate?.[0]?.fmt,
              dividendDate: cal?.dividendDate?.fmt,
            });
          })
          .catch(() => {});
      } else {
        setCurrentPrice(null);
        setChartData([]);
      }
    } catch (error) {
      console.error('Error fetching price:', error);
      // Fallback to mock prices if API fails
      const mockPrices: Record<string, number> = {
        'AAPL': 150.25, 'MSFT': 300.15, 'GOOGL': 2500.75, 'TSLA': 200.50,
        'NVDA': 400.80, 'AMZN': 3200.00, 'META': 250.30, 'NFLX': 450.75,
        'SPY': 450.00, 'QQQ': 380.00, 'IWM': 200.00
      };
      setCurrentPrice(mockPrices[symbol.toUpperCase()] || null);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  const saveTrades = (newTrades: Trade[]) => {
    setTrades(newTrades);
    localStorage.setItem('marginTrades', JSON.stringify(newTrades));
  };

  const saveTradingHistory = (newHistory: Trade[]) => {
    setTradingHistory(newHistory);
    localStorage.setItem('tradingHistory', JSON.stringify(newHistory));
  };

  const clearTradingHistory = () => {
    saveTradingHistory([]);
    setShowClearHistoryConfirm(false);
  };

  // removed unused clearAllData

  const addTrade = (tradeData: Omit<Trade, 'id'>) => {
    const newTrade: Trade = { ...tradeData, id: Date.now().toString() };
    console.log('Adding trade with interest rate:', newTrade.interestRate);
    const updatedTrades = [...trades, newTrade];
    saveTrades(updatedTrades);
  };

  const updateTrade = (id: string, updates: Partial<Trade>) => {
    console.log('updateTrade called:', id, updates);
    const updatedTrades = trades.map(trade => 
      trade.id === id ? { ...trade, ...updates } : trade
    );
    
    // If this trade was just sold, move it to trading history
    const soldTrade = updatedTrades.find(trade => trade.id === id && trade.sellPrice);
    if (soldTrade) {
      // Remove from active trades
      const remainingTrades = updatedTrades.filter(trade => trade.id !== id);
      saveTrades(remainingTrades);
      
      // Add to trading history
      const updatedHistory = [...tradingHistory, soldTrade];
      saveTradingHistory(updatedHistory);
    } else {
      console.log('Saving updated trades:', updatedTrades);
    saveTrades(updatedTrades);
    }
  };

  const updateAllTradesWithCurrentPrice = (ticker: string, currentPrice: number, marketState?: string) => {
    const updatedTrades = trades.map(trade => 
      trade.ticker === ticker 
        ? { ...trade, currentPrice } 
        : trade
    );
    saveTrades(updatedTrades);
    // Also update the selected trade metrics panel if open
    if (selectedTrade && selectedTrade.ticker === ticker) {
      setSelectedTrade({ ...selectedTrade, currentPrice });
    }
  };

  // Enhanced data fetching with multiple Yahoo API endpoints
  const fetchEnhancedStockData = async (ticker: string) => {
    try {
      // Get comprehensive stock data
      const isProduction = window.location.hostname !== 'localhost';
      const direct = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d&includePrePost=true`;
      const url = isProduction 
        ? `/api/fetch-price?symbol=${ticker}&timePeriod=5d`
        : `https://api.allorigins.win/raw?url=${encodeURIComponent(direct)}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.chart?.result?.[0]) {
        const result = data.chart.result[0];
        const meta = result.meta;
        // Determine market open using currentTradingPeriod when available
        let isMarketOpen: boolean | null = null;
        try {
          const now = Math.floor(Date.now() / 1000);
          const regular = meta?.currentTradingPeriod?.regular;
          if (regular && typeof regular.start === 'number' && typeof regular.end === 'number') {
            isMarketOpen = now >= regular.start && now <= regular.end;
          } else if (typeof meta?.regularMarketState === 'string') {
            isMarketOpen = meta.regularMarketState === 'REGULAR';
          }
        } catch {
          isMarketOpen = typeof meta?.regularMarketState === 'string' ? (meta.regularMarketState === 'REGULAR') : null;
        }

        return {
          currentPrice: meta.regularMarketPrice,
          previousClose: meta.previousClose,
          open: meta.regularMarketOpen,
          high: meta.regularMarketDayHigh,
          low: meta.regularMarketDayLow,
          volume: meta.regularMarketVolume,
          marketCap: meta.marketCap,
          change: meta.regularMarketPrice - meta.previousClose,
          changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
          isMarketOpen,
          marketHours: meta.regularMarketState
        };
      }
    } catch (error) {
      console.warn(`Failed to fetch enhanced data for ${ticker}:`, error);
      return null;
    }
  };

  // Real-time price updates using mobile-friendly approach
  const startRealTimePriceUpdates = () => {
    if (priceUpdateInterval) return; // Already running
    
    const updatePrices = async () => {
      const openTrades = trades.filter(t => !t.sellPrice);
      const uniqueTickers = [...new Set(openTrades.map(t => t.ticker))];
      
      if (uniqueTickers.length === 0) return;
      
      console.log('[Auto-refresh] Updating prices for:', uniqueTickers);
      
      try {
        // Try our own API route first (most reliable for mobile)
        const isProduction = window.location.hostname !== 'localhost';
        if (isProduction) {
          try {
            const apiUrl = `/api/fetch-quotes?symbols=${encodeURIComponent(uniqueTickers.join(','))}`;
            const response = await fetch(apiUrl);
            if (response.ok) {
              const data = await response.json();
              const quotes = data?.result || [];
              
              for (const quote of quotes) {
                if (quote && quote.symbol && typeof quote.regularMarketPrice === 'number') {
                  console.log(`[Auto-refresh] API route updating ${quote.symbol} to price:`, quote.regularMarketPrice);
                  updateAllTradesWithCurrentPrice(quote.symbol, quote.regularMarketPrice, quote.marketState);
                  
                  // Also update market data for volume and market status
                  setTickerMarketData(prev => ({
                    ...prev,
                    [quote.symbol]: {
                      volume: quote.regularMarketVolume || null,
                      isMarketOpen: quote.marketState === 'REGULAR' || quote.marketState === 'PRE' || quote.marketState === 'POST'
                    }
                  }));
                }
              }
              return; // Success, exit early
            }
          } catch (e) {
            console.warn('[Auto-refresh] API route failed, trying fallback:', e);
          }
        }
        
        // Fallback to individual enhanced data fetching
      for (const ticker of uniqueTickers) {
          try {
        const enhancedData = await fetchEnhancedStockData(ticker);
        if (enhancedData?.currentPrice) {
              console.log(`[Auto-refresh] Enhanced data updating ${ticker} to price:`, enhancedData.currentPrice);
          updateAllTradesWithCurrentPrice(ticker, enhancedData.currentPrice);
        }
          } catch (e) {
            console.warn(`[Auto-refresh] Failed to update ${ticker}:`, e);
          }
        }
      } catch (error) {
        console.error('[Auto-refresh] Price update failed:', error);
      }
    };

    // Update immediately, then every 30 seconds
    updatePrices();
    const interval = setInterval(updatePrices, 30000);
    setPriceUpdateInterval(interval);
  };

  const stopRealTimePriceUpdates = () => {
    if (priceUpdateInterval) {
      clearInterval(priceUpdateInterval);
      setPriceUpdateInterval(null);
    }
  };

  // Auto-manage real-time updates: start when enabled, on trading screen, and there are open trades
  useEffect(() => {
    const hasOpenTrades = trades.some(t => !t.sellPrice);
    if (autoRefreshEnabled && activeScreen === 'trading' && hasOpenTrades && !priceUpdateInterval) {
      startRealTimePriceUpdates();
    }
    if ((!autoRefreshEnabled || activeScreen !== 'trading' || !hasOpenTrades) && priceUpdateInterval) {
      stopRealTimePriceUpdates();
    }
  }, [autoRefreshEnabled, activeScreen, trades, priceUpdateInterval]);

  // Save auto-refresh preference
  useEffect(() => {
    localStorage.setItem('autoRefreshEnabled', JSON.stringify(autoRefreshEnabled));
  }, [autoRefreshEnabled]);

  const deleteTrade = (id: string) => {
    console.log('Deleting trade with ID:', id);
    const updatedTrades = trades.filter(trade => trade.id !== id);
    console.log('Updated trades count:', updatedTrades.length);
    saveTrades(updatedTrades);
    setShowDeleteConfirm(null);
    // Force a re-render by updating state
    setTrades([...updatedTrades]);
  };


  const getMarginRateLabel = (rate: number) => {
    const marginRate = brokerSettings.marginRates.find(r => r.effectiveRate === rate);
    if (marginRate) {
      const formatToK = (amount: number) => {
        if (amount >= 1000) {
          return `$${(amount / 1000).toFixed(1)}K`;
        }
        return `$${amount.toLocaleString()}`;
      };
      return `${formatToK(marginRate.minBalance)} - ${formatToK(marginRate.maxBalance)} (${rate.toFixed(3)}%)`;
    }
    return `${rate.toFixed(3)}%`;
  };

  const calculateTradeMetrics = (trade: Trade) => {
    const daysHeld = trade.sellDate 
      ? Math.ceil((new Date(trade.sellDate).getTime() - new Date(trade.buyDate).getTime()) / (1000 * 60 * 60 * 24))
      : Math.ceil((Date.now() - new Date(trade.buyDate).getTime()) / (1000 * 60 * 60 * 24));
    
    // Use the trade's individual interest rate if set, otherwise use the selected margin rate
    const marginRate = trade.interestRate || selectedMarginRate;
    const interestCost = (trade.buyPrice * trade.quantity * marginRate / 100 / 365) * daysHeld;
    
    // Use sell price if sold, otherwise use current price from API, otherwise use buy price
    const currentPrice = trade.sellPrice || trade.currentPrice || trade.buyPrice;
    const profitLoss = (currentPrice - trade.buyPrice) * trade.quantity;
    const totalReturn = profitLoss - interestCost;

    // Enhanced risk metrics
    const positionValue = currentPrice * trade.quantity;
    const marginUsed = trade.buyPrice * trade.quantity;
    const marginUtilization = (marginUsed / (positionValue || 1)) * 100;
    const priceChangePercent = ((currentPrice - trade.buyPrice) / trade.buyPrice) * 100;
    const dailyReturn = totalReturn / daysHeld;
    const annualizedReturn = (dailyReturn * 365) / marginUsed * 100;

    return { 
      daysHeld, 
      interestCost, 
      profitLoss, 
      totalReturn, 
      marginRate, 
      currentPrice,
      // Risk metrics
      positionValue,
      marginUsed,
      marginUtilization,
      priceChangePercent,
      dailyReturn,
      annualizedReturn,
      // Enhanced market data (will be populated by fetchEnhancedStockData)
      volume: null,
      isMarketOpen: null,
      marketHours: null,
      change: null,
      changePercent: null
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <>
      <div className={`min-h-screen transition-all duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
          : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
      }`}>
        {/* Header with Trading Platform Aesthetic */}
        <div className={`backdrop-blur-sm border-b shadow-2xl transition-all duration-300 ${
          isDarkMode 
            ? 'bg-slate-900/95 border-slate-700/50' 
            : 'bg-white/95 border-gray-200/50'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Left Side - Premium Logo and Brand */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1">
              {/* Professional App Icon */}
              <div className="relative group">
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-2xl transform transition-all duration-300 group-hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-emerald-500 via-blue-600 to-purple-700 shadow-blue-900/30' 
                    : 'bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 shadow-blue-500/30'
                }`}>
                  {/* Geometric Financial Icon */}
                  <div className="relative">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" viewBox="0 0 32 32" fill="none">
                      {/* Chart bars */}
                      <rect x="4" y="20" width="3" height="8" fill="currentColor" opacity="0.8" rx="1"/>
                      <rect x="9" y="16" width="3" height="12" fill="currentColor" opacity="0.9" rx="1"/>
                      <rect x="14" y="12" width="3" height="16" fill="currentColor" rx="1"/>
                      <rect x="19" y="8" width="3" height="20" fill="currentColor" rx="1"/>
                      <rect x="24" y="14" width="3" height="14" fill="currentColor" opacity="0.9" rx="1"/>
                      {/* Trending arrow */}
                      <path d="M6 10 L20 4 L18 6 L26 6 L26 14 L24 12 L20 16" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            fill="none" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {/* Subtle glow effect */}
                  <div className={`absolute inset-0 rounded-2xl ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-blue-400/20 to-purple-500/20' 
                      : 'bg-gradient-to-br from-white/20 to-white/10'
                  }`}></div>
                </div>
                {/* Small indicator dot for "live" status */}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900 animate-pulse shadow-lg"></div>
              </div>

              {/* Premium Typography */}
              <div className="min-w-0 flex-1">
                <h1 className={`text-2xl sm:text-4xl font-black tracking-tight transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-emerald-300 via-blue-400 to-purple-400 bg-clip-text text-transparent'
                    : 'bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-700 bg-clip-text text-transparent'
                }`} style={{ fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif' }}>
                  <span className="hidden sm:inline">MarginTracker</span>
                  <span className="sm:hidden">MT</span><span className={`text-lg sm:text-2xl font-bold ml-1 ${
                    isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                  }`}>PRO</span>
                </h1>
              </div>
            </div>
            
            {/* Mobile-First Navigation */}
            <div className="flex items-center space-x-1 sm:space-x-6 flex-shrink-0">
                 {/* Desktop Navigation */}
                 <div className="hidden sm:flex items-center border-b border-gray-200 dark:border-slate-700">
                   <nav className="flex space-x-8">
                     <button
                       onClick={() => setActiveScreen('trading')}
                       className={`relative py-4 px-1 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                         activeScreen === 'trading'
                           ? (isDarkMode ? 'text-blue-400' : 'text-blue-600')
                           : (isDarkMode ? 'text-slate-400 hover:text-slate-300' : 'text-gray-500 hover:text-gray-700')
                       }`}
                     >
                       <DollarSign className="h-4 w-4" />
                       <span>Trading</span>
                       {activeScreen === 'trading' && (
                         <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                           isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                         }`}></div>
                       )}
                     </button>
                     
                     <button
                       onClick={() => setActiveScreen('market')}
                       className={`relative py-4 px-1 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                         activeScreen === 'market'
                           ? (isDarkMode ? 'text-blue-400' : 'text-blue-600')
                           : (isDarkMode ? 'text-slate-400 hover:text-slate-300' : 'text-gray-500 hover:text-gray-700')
                       }`}
                     >
                       <TrendingUp className="h-4 w-4" />
                       <span>Market Data</span>
                       {activeScreen === 'market' && (
                         <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                           isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                         }`}></div>
                       )}
                     </button>
                     
                     <button
                       onClick={() => setShowSettings(true)}
                       className={`relative py-4 px-1 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                         isDarkMode ? 'text-slate-400 hover:text-slate-300' : 'text-gray-500 hover:text-gray-700'
                       }`}
                     >
                       <Settings className="h-4 w-4" />
                       <span>Settings</span>
                     </button>
                   </nav>
                 </div>

                 {/* Mobile Navigation - Bottom Tab Style */}
                 <div className="sm:hidden flex items-center justify-center w-full">
                   <nav className="flex items-center justify-around w-full max-w-sm bg-white dark:bg-slate-800 rounded-full p-1 shadow-lg border border-gray-200 dark:border-slate-700">
                     <button
                       onClick={() => setActiveScreen('trading')}
                       className={`flex flex-col items-center justify-center py-2 px-3 rounded-full transition-all duration-200 min-h-[44px] min-w-[44px] ${
                         activeScreen === 'trading'
                           ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                           : (isDarkMode ? 'text-slate-400' : 'text-gray-500')
                       }`}
                     >
                       <DollarSign className="h-5 w-5" />
                       <span className="text-xs font-medium mt-0.5">Trades</span>
                     </button>
                     
                     <button
                       onClick={() => setActiveScreen('market')}
                       className={`flex flex-col items-center justify-center py-2 px-3 rounded-full transition-all duration-200 min-h-[44px] min-w-[44px] ${
                         activeScreen === 'market'
                           ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                           : (isDarkMode ? 'text-slate-400' : 'text-gray-500')
                       }`}
                     >
                       <TrendingUp className="h-5 w-5" />
                       <span className="text-xs font-medium mt-0.5">Charts</span>
                     </button>
                     
                     <button
                       onClick={() => setShowSettings(true)}
                       className={`flex flex-col items-center justify-center py-2 px-3 rounded-full transition-all duration-200 min-h-[44px] min-w-[44px] ${
                         isDarkMode ? 'text-slate-400' : 'text-gray-500'
                       }`}
                     >
                       <Settings className="h-5 w-5" />
                       <span className="text-xs font-medium mt-0.5">Settings</span>
                     </button>
                   </nav>
                 </div>
                 
                {/* Control Panel - Dark Mode Toggle */}
                <div className="flex items-center space-x-2 sm:space-x-4">
                  {/* Dark/Light Mode Toggle */}
                   <button
                     onClick={() => {
                       const newMode = !isDarkMode;
                       setIsDarkMode(newMode);
                       localStorage.setItem('isDarkMode', JSON.stringify(newMode));
                     }}
                     className={`relative w-10 h-5 sm:w-14 sm:h-7 rounded-full transition-all duration-300 ${
                       isDarkMode ? 'bg-slate-700' : 'bg-blue-500'
                     }`}
                     title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                   >
                     <div className={`absolute top-0.5 w-4 h-4 sm:w-6 sm:h-6 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                       isDarkMode ? 'translate-x-0.5' : 'translate-x-5 sm:translate-x-7'
                     }`}>
                       <div className="flex items-center justify-center h-full">
                         {isDarkMode ? (
                           <span className="text-slate-800 text-xs">🌙</span>
                         ) : (
                           <span className="text-yellow-500 text-xs">☀️</span>
                         )}
                       </div>
                     </div>
                   </button>
                   
                   {/* Last Updated - Hidden on mobile */}
                   <div className="hidden sm:block text-right">
                     <div className={`text-xs transition-all duration-300 ${
                       isDarkMode ? 'text-slate-400' : 'text-gray-500'
                     }`}>Last Updated</div>
                     <div className={`text-sm font-medium transition-all duration-300 ${
                       isDarkMode ? 'text-slate-300' : 'text-gray-700'
                     }`}>{new Date().toLocaleTimeString()}</div>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {activeScreen === 'trading' && (
          <div>
          {/* Portfolio Summary - Trading Platform Style */}
          {trades.length > 0 && (
          <div className={`mb-5 backdrop-blur-sm rounded-2xl shadow-2xl p-5 transition-all duration-300 ${
            isDarkMode 
              ? 'bg-slate-800/80 border border-slate-600/60' 
              : 'bg-white/90 border border-gray-200/50'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className={`text-lg font-bold mb-1 transition-all duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Portfolio Dashboard</h2>
                <p className={`text-xs transition-all duration-300 ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-600'
                }`}>
                  Real-time margin trading performance
                  <span className="ml-2 text-blue-400">📈 Market Data</span>
                  {lastRefreshTime && (
                    <span className="ml-2 text-green-400">✓ Last updated: {lastRefreshTime}</span>
                  )}
                </p>
              </div>
              
              {/* Auto-refresh Toggle - Compact */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                    autoRefreshEnabled
                      ? (isDarkMode 
                          ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40' 
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-300')
                      : (isDarkMode 
                          ? 'bg-slate-700/50 text-slate-400 border border-slate-600' 
                          : 'bg-gray-100 text-gray-600 border border-gray-300')
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    autoRefreshEnabled ? 'bg-emerald-400' : 'bg-gray-400'
                  }`}></div>
                  Auto
                </button>
                
                <span className={`text-xs px-1.5 py-0.5 rounded border ${
                  priceUpdateInterval
                    ? (isDarkMode ? 'border-emerald-500/40 text-emerald-300' : 'border-emerald-300 text-emerald-600')
                    : (isDarkMode ? 'border-slate-600 text-slate-400' : 'border-gray-300 text-gray-600')
                }`}>
                  {priceUpdateInterval ? 'Live' : 'Paused'}
                </span>
              </div>
            </div>
            

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {(() => {
                const openTrades = trades.filter(t => !t.sellPrice);
                const closedTrades = trades.filter(t => t.sellPrice);
                
                const totalOpenValue = openTrades.reduce((sum, trade) => {
                  const metrics = calculateTradeMetrics(trade);
                  return sum + (metrics.currentPrice * trade.quantity);
                }, 0);
                
                const totalOpenCost = openTrades.reduce((sum, trade) => {
                  return sum + (trade.buyPrice * trade.quantity);
                }, 0);
                
                const totalClosedPnL = closedTrades.reduce((sum, trade) => {
                  const metrics = calculateTradeMetrics(trade);
                  return sum + metrics.totalReturn;
                }, 0);
                
                const totalOpenPnL = totalOpenValue - totalOpenCost;
                
                return (
                  <>
                    {/* Open P&L Card */}
                    <div className={`relative rounded-xl p-4 shadow-sm transition-all duration-300 hover:shadow-md ${
                      isDarkMode 
                        ? 'bg-slate-800/60 border border-slate-700/50'
                        : 'bg-white border border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`text-sm font-medium ${
                          isDarkMode ? 'text-slate-400' : 'text-gray-600'
                        }`}>Open P&L</div>
                        <div className={`w-2 h-2 rounded-full ${
                          totalOpenPnL >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      </div>
                      <div className={`text-2xl font-bold mb-1 ${
                          totalOpenPnL >= 0 
                          ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                            : (isDarkMode ? 'text-red-400' : 'text-red-600')
                        }`}>
                          {totalOpenPnL >= 0 ? '+' : ''}{formatCurrency(totalOpenPnL)}
                        </div>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-slate-500' : 'text-gray-500'
                      }`}>• Unrealized</div>
                        </div>

                    {/* Closed P&L Card */}
                    <div className={`relative rounded-xl p-4 shadow-sm transition-all duration-300 hover:shadow-md ${
                      isDarkMode 
                        ? 'bg-slate-800/60 border border-slate-700/50'
                        : 'bg-white border border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`text-sm font-medium ${
                          isDarkMode ? 'text-slate-400' : 'text-gray-600'
                        }`}>Closed P&L</div>
                        <div className={`w-2 h-2 rounded-full ${
                          totalClosedPnL >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      </div>
                      <div className={`text-2xl font-bold mb-1 ${
                          totalClosedPnL >= 0 
                          ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                            : (isDarkMode ? 'text-red-400' : 'text-red-600')
                        }`}>
                          {totalClosedPnL >= 0 ? '+' : ''}{formatCurrency(totalClosedPnL)}
                        </div>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-slate-500' : 'text-gray-500'
                      }`}>• Realized</div>
                        </div>

                    {/* Total P&L Card */}
                    <div className={`relative rounded-xl p-4 shadow-sm transition-all duration-300 hover:shadow-md ${
                      isDarkMode 
                        ? 'bg-slate-800/60 border border-slate-700/50'
                        : 'bg-white border border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`text-sm font-medium ${
                          isDarkMode ? 'text-slate-400' : 'text-gray-600'
                        }`}>Total P&L</div>
                        <div className={`w-2 h-2 rounded-full ${
                          (totalOpenPnL + totalClosedPnL) >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      </div>
                      <div className={`text-2xl font-bold mb-1 ${
                          (totalOpenPnL + totalClosedPnL) >= 0 
                            ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                            : (isDarkMode ? 'text-red-400' : 'text-red-600')
                        }`}>
                          {(totalOpenPnL + totalClosedPnL) >= 0 ? '+' : ''}{formatCurrency(totalOpenPnL + totalClosedPnL)}
                        </div>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-slate-500' : 'text-gray-500'
                      }`}>• Combined</div>
                    </div>
                  </>
                );
              })()}
            </div>
            
                {(() => {
                  const currentYear = new Date().getFullYear();
                  const ytdTrades = trades.filter(trade => {
                    const tradeYear = new Date(trade.buyDate).getFullYear();
                    return tradeYear === currentYear;
                  });
                  
                  const ytdClosedPnL = ytdTrades.filter(t => t.sellPrice).reduce((sum, trade) => {
                    const metrics = calculateTradeMetrics(trade);
                    return sum + metrics.totalReturn;
                  }, 0);
                  
                  const ytdOpenPnL = ytdTrades.filter(t => !t.sellPrice).reduce((sum, trade) => {
                    const metrics = calculateTradeMetrics(trade);
                    return sum + metrics.totalReturn;
                  }, 0);
                  
                  const totalYtdPnL = ytdClosedPnL + ytdOpenPnL;
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {/* Trades This Year Card */}
                      <div className={`relative rounded-xl p-4 shadow-sm transition-all duration-300 hover:shadow-md ${
                        isDarkMode 
                          ? 'bg-slate-800/60 border border-slate-700/50'
                          : 'bg-white border border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`text-sm font-medium ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-600'
                            }`}>Trades This Year</div>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isDarkMode ? 'bg-orange-500/20' : 'bg-orange-100'
                          }`}>
                            <BarChart3 className={`h-3 w-3 ${
                              isDarkMode ? 'text-orange-400' : 'text-orange-600'
                            }`} />
                          </div>
                        </div>
                        <div className={`text-2xl font-bold mb-1 ${
                          isDarkMode ? 'text-orange-400' : 'text-orange-600'
                        }`}>{ytdTrades.length}</div>
                        <div className={`text-xs ${
                          isDarkMode ? 'text-slate-500' : 'text-gray-500'
                        }`}>• Year to date</div>
                      </div>

                      {/* YTD Closed P&L Card */}
                      <div className={`relative rounded-xl p-4 shadow-sm transition-all duration-300 hover:shadow-md ${
                        isDarkMode 
                          ? 'bg-slate-800/60 border border-slate-700/50'
                          : 'bg-white border border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`text-sm font-medium ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-600'
                          }`}>YTD Closed P&L</div>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                          }`}>
                            <DollarSign className={`h-3 w-3 ${
                              isDarkMode ? 'text-blue-400' : 'text-blue-600'
                            }`} />
                          </div>
                        </div>
                        <div className={`text-2xl font-bold mb-1 ${
                              ytdClosedPnL >= 0 
                            ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                                : (isDarkMode ? 'text-red-400' : 'text-red-600')
                            }`}>
                              {ytdClosedPnL >= 0 ? '+' : ''}{formatCurrency(ytdClosedPnL)}
                            </div>
                        <div className={`text-xs ${
                          isDarkMode ? 'text-slate-500' : 'text-gray-500'
                        }`}>• Realized YTD</div>
                          </div>

                      {/* YTD Total P&L Card */}
                      <div className={`relative rounded-xl p-4 shadow-sm transition-all duration-300 hover:shadow-md ${
                        isDarkMode 
                          ? 'bg-slate-800/60 border border-slate-700/50'
                          : 'bg-white border border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`text-sm font-medium ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-600'
                          }`}>YTD Total P&L</div>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
                          }`}>
                            <TrendingUp className={`h-3 w-3 ${
                              isDarkMode ? 'text-purple-400' : 'text-purple-600'
                            }`} />
                          </div>
                        </div>
                        <div className={`text-2xl font-bold mb-1 ${
                              totalYtdPnL >= 0 
                            ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                                : (isDarkMode ? 'text-red-400' : 'text-red-600')
                            }`}>
                              {totalYtdPnL >= 0 ? '+' : ''}{formatCurrency(totalYtdPnL)}
                            </div>
                        <div className={`text-xs ${
                          isDarkMode ? 'text-slate-500' : 'text-gray-500'
                        }`}>• Combined YTD</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
          )}
          {/* Main Trading Interface */}
          <div className="space-y-16">
          {/* Trade Execution Terminal */}
          <div className={`backdrop-blur-sm rounded-2xl shadow-2xl p-5 transition-all duration-300 ${
            isDarkMode 
              ? 'bg-slate-800/80 border border-slate-600/60' 
              : 'bg-white/90 border border-gray-200/50'
          }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                    <DollarSign className="h-4 w-4 text-white" />
                </div>
                  <h2 className={`text-lg font-bold transition-all duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Trade Execution Terminal</h2>
                </div>
                <button form="tradeForm" type="submit" className={`px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2`}>
                  <DollarSign className="h-4 w-4" />
                  Execute Trade
                </button>
              </div>
              <form id="tradeForm" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const tradeData = {
                  ticker: String(formData.get('ticker') || '').toUpperCase(),
                  buyPrice: Number(formData.get('buyPrice') || 0),
                  buyDate: String(formData.get('buyDate') || new Date().toISOString().split('T')[0]),
                  quantity: Number(formData.get('quantity') || 0),
                  interestRate: selectedMarginRate,
                };
                console.log('Saving trade with interest rate:', selectedMarginRate);
                addTrade(tradeData);
                (e.target as HTMLFormElement).reset();
                // Ensure UI shows the new row immediately
                setTicker(tradeData.ticker);
              }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
                  <div>
                    <label className={`block text-xs font-bold mb-2 transition-all duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Ticker Symbol</label>
                    <input type="text" name="ticker" defaultValue={ticker || ''} required className={`w-full h-[42px] px-3 border-2 rounded-lg focus:ring-2 transition-all duration-200 shadow-sm text-sm font-semibold ${
                      isDarkMode 
                        ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-300 focus:ring-blue-500/30 focus:border-blue-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500/30 focus:border-blue-400'
                    }`} placeholder="e.g., AAPL" />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-2 transition-all duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Quantity</label>
                    <input type="number" name="quantity" required min="1" className={`w-full h-[42px] px-3 border-2 rounded-lg focus:ring-2 transition-all duration-200 shadow-sm text-sm font-semibold ${
                      isDarkMode 
                        ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-300 focus:ring-blue-500/30 focus:border-blue-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500/30 focus:border-blue-400'
                    }`} placeholder="Number of shares" />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-2 transition-all duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Buy Price</label>
                    <input type="number" name="buyPrice" required step="0.0001" min="0" className={`w-full h-[42px] px-3 border-2 rounded-lg focus:ring-2 transition-all duration-200 shadow-sm text-sm font-semibold ${
                      isDarkMode 
                        ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-300 focus:ring-blue-500/30 focus:border-blue-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500/30 focus:border-blue-400'
                    }`} placeholder="Price per share" />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-2 transition-all duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Buy Date</label>
                    <input 
                      type="date" 
                      name="buyDate" 
                      required 
                      defaultValue={new Date().toISOString().split('T')[0]} 
                      className={`w-full h-[42px] px-3 border rounded-lg focus:ring-2 transition-all duration-200 shadow-sm text-sm font-medium ${
                      isDarkMode 
                        ? 'bg-slate-700/80 border-slate-500/60 text-white focus:ring-purple-500/40 focus:border-purple-400/80 [color-scheme:dark]'
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-purple-500/40 focus:border-purple-400'
                      }`}
                      aria-label="Buy date"
                      title="Select the date when you bought the position"
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-2 transition-all duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Margin Rate</label>
                     <select 
                       value={selectedMarginRate} 
                       onChange={(e) => setSelectedMarginRate(parseFloat(e.target.value))}
                       className={`w-full h-[42px] px-3 border rounded-lg focus:ring-2 transition-all duration-200 shadow-sm text-sm font-medium ${
                         isDarkMode 
                           ? 'bg-slate-700/80 border-slate-500/60 text-white focus:ring-purple-500/40 focus:border-purple-400/80'
                           : 'bg-white border-gray-300 text-gray-900 focus:ring-purple-500/40 focus:border-purple-400'
                       }`}
                       title="Select margin rate based on account balance"
                     >
                      {brokerSettings.marginRates.map((rate, index) => (
                        <option key={index} value={rate.effectiveRate} className={`${
                          isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'
                        }`}>
                          {getMarginRateLabel(rate.effectiveRate)}
                        </option>
                      ))}
                    </select>
                  </div>
                  </div>
                
              </form>
            </div>
          </div>

          {/* Trading Positions Terminal - Only show if there are active trades */}
          {trades.length > 0 && (
          <div className={`backdrop-blur-sm rounded-2xl shadow-2xl mt-8 transition-all duration-300 ${
            isDarkMode 
              ? 'bg-slate-800/50 border border-slate-700/50' 
              : 'bg-white/90 border border-gray-200/50'
          }`}>
            <div className={`p-8 border-b transition-all duration-300 ${
              isDarkMode ? 'border-slate-700/50' : 'border-gray-200/50'
            }`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mr-3">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <h2 className={`text-xl font-bold transition-all duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Trading Positions</h2>
                </div>
                {trades.length > 0 && (
                  <div className="flex justify-end">
                    {/* Manual Refresh Button */}
                    <button
                    onClick={async () => {
                        if (isRefreshingPrices) return; // Prevent multiple clicks
                        
                        setIsRefreshingPrices(true);
                        console.log('[Refresh Prices] Manual refresh clicked');
                      const uniqueTickers = [...new Set(trades.map(t => t.ticker.toUpperCase()))];
                      console.log('[Refresh Prices] Tickers:', uniqueTickers);
                        
                        // Clear any cached market data to force fresh data
                        setTickerMarketData({});
                        
                        // Mobile debugging info
                        console.log('[Mobile Debug] User Agent:', navigator.userAgent);
                        console.log('[Mobile Debug] Network:', navigator.connection?.effectiveType || 'unknown');
                        console.log('[Mobile Debug] Online:', navigator.onLine);
                        console.log('[Mobile Debug] Location:', window.location.hostname);
                        
                        try {
                          let successCount = 0;
                          const isProduction = window.location.hostname !== 'localhost';
                          
                          // Method 1: Try our own API route first (most reliable for mobile)
                          if (isProduction) {
                            try {
                              console.log('[Refresh Prices] Method 1: Trying production API route');
                              const apiUrl = `/api/fetch-quotes?symbols=${encodeURIComponent(uniqueTickers.join(','))}`;
                              const response = await fetch(apiUrl, {
                                method: 'GET',
                                headers: {
                                  'Accept': 'application/json',
                                },
                                // Add timeout for mobile
                                signal: AbortSignal.timeout(10000)
                              });
                              
                              if (response.ok) {
                                const data = await response.json();
                                const quotes = data?.result || [];
                                console.log('[Refresh Prices] API route response:', quotes);
                                
                                for (const quote of quotes) {
                                  if (quote && quote.symbol && typeof quote.regularMarketPrice === 'number') {
                                    console.log(`[Refresh Prices] API route updating ${quote.symbol} to price:`, quote.regularMarketPrice);
                                    updateAllTradesWithCurrentPrice(quote.symbol, quote.regularMarketPrice, quote.marketState);
                                    
                                    // Also update market data for volume and market status
                                    console.log(`[Volume Debug] ${quote.symbol} - Volume:`, quote.regularMarketVolume, 'Market State:', quote.marketState);
                                    
                                    // Better market status detection
                                    const isMarketOpen = quote.marketState === 'REGULAR' || quote.marketState === 'PRE' || quote.marketState === 'POST';
                                    
                                    // Manual weekend check (since APIs often don't work correctly on weekends)
                                    const now = new Date();
                                    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
                                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                                    const finalMarketStatus = isWeekend ? false : isMarketOpen;
                                    
                                    console.log(`[Market Status] ${quote.symbol} - Market State: ${quote.marketState}, Is Open: ${isMarketOpen}, Weekend: ${isWeekend}, Final: ${finalMarketStatus}`);
                                    
                                    setTickerMarketData(prev => ({
                                      ...prev,
                                      [quote.symbol]: {
                                        volume: quote.regularMarketVolume || null,
                                        isMarketOpen: finalMarketStatus
                                      }
                                    }));
                                    
                                    successCount++;
                                  }
                                }
                                
                                if (successCount > 0) {
                                  console.log(`[Refresh Prices] Method 1 success: ${successCount}/${uniqueTickers.length} prices updated`);
                                  return; // Success, exit early
                                }
                              } else {
                                console.warn('[Refresh Prices] API route failed with status:', response.status);
                              }
                            } catch (e) {
                              console.warn('[Refresh Prices] Method 1 failed:', e);
                            }
                          }
                          
                          // Method 2: Try direct Yahoo API (no proxies for mobile)
                          try {
                            console.log('[Refresh Prices] Method 2: Trying direct Yahoo API');
                            
                            // Test if we can make any external calls at all
                            console.log('[Mobile Test] Testing basic connectivity...');
                            try {
                              const testResponse = await fetch('https://httpbin.org/get', { 
                                method: 'GET',
                                signal: AbortSignal.timeout(5000)
                              });
                              console.log('[Mobile Test] Basic connectivity:', testResponse.ok ? 'SUCCESS' : 'FAILED');
                            } catch (testError) {
                              console.warn('[Mobile Test] Basic connectivity failed:', testError);
                            }
                            
                            const directQuotes = await fetchYahooQuotes(uniqueTickers, false); // No proxies
                            console.log('[Refresh Prices] Direct API response:', directQuotes);
                        
                        for (const sym of uniqueTickers) {
                              const q = directQuotes[sym];
                          if (q && typeof q.regularMarketPrice === 'number') {
                                console.log(`[Refresh Prices] Direct API updating ${sym} to price:`, q.regularMarketPrice);
                            updateAllTradesWithCurrentPrice(sym, q.regularMarketPrice, q.marketState);
                                
                                // Also update market data for volume and market status
                                setTickerMarketData(prev => ({
                                  ...prev,
                                  [sym]: {
                                    volume: q.regularMarketVolume || null,
                                    isMarketOpen: q.marketState === 'REGULAR' || q.marketState === 'PRE' || q.marketState === 'POST'
                                  }
                                }));
                                
                                successCount++;
                              }
                            }
                            
                            if (successCount > 0) {
                              console.log(`[Refresh Prices] Method 2 success: ${successCount}/${uniqueTickers.length} prices updated`);
                              return;
                            }
                          } catch (e) {
                            console.warn('[Refresh Prices] Method 2 failed:', e);
                          }
                          
                          // Method 3: Try with proxies as last resort
                          try {
                            console.log('[Refresh Prices] Method 3: Trying with proxies');
                            const proxyQuotes = await fetchYahooQuotes(uniqueTickers, true);
                            console.log('[Refresh Prices] Proxy response:', proxyQuotes);
                            
                            for (const sym of uniqueTickers) {
                              const q = proxyQuotes[sym];
                              if (q && typeof q.regularMarketPrice === 'number') {
                                console.log(`[Refresh Prices] Proxy updating ${sym} to price:`, q.regularMarketPrice);
                                updateAllTradesWithCurrentPrice(sym, q.regularMarketPrice, q.marketState);
                                
                                // Also update market data for volume and market status
                                setTickerMarketData(prev => ({
                                  ...prev,
                                  [sym]: {
                                    volume: q.regularMarketVolume || null,
                                    isMarketOpen: q.marketState === 'REGULAR' || q.marketState === 'PRE' || q.marketState === 'POST'
                                  }
                                }));
                                
                                successCount++;
                              }
                            }
                          } catch (e) {
                            console.warn('[Refresh Prices] Method 3 failed:', e);
                          }
                          
                          // Final result
                          if (successCount === 0) {
                            console.error('[Refresh Prices] All methods failed - no prices updated');
                            alert('Unable to refresh prices. This may be due to network restrictions on mobile. Try using WiFi or check your internet connection.');
                          } else {
                            console.log(`[Refresh Prices] Final result: ${successCount}/${uniqueTickers.length} prices updated`);
                            setLastRefreshTime(new Date().toLocaleTimeString());
                          }
                      } catch (error) {
                          console.error('[Refresh Prices] Unexpected error:', error);
                          alert('Unable to refresh prices. Please check your internet connection and try again.');
                        } finally {
                          setIsRefreshingPrices(false);
                        }
                      }}
                      disabled={isRefreshingPrices}
                      className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                        isRefreshingPrices
                          ? 'bg-gray-500 text-white cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                      }`}
                    >
                      {isRefreshingPrices ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="hidden sm:inline">Refreshing...</span>
                          <span className="sm:hidden">...</span>
                        </>
                      ) : (
                        <>
                    <TrendingUp className="h-4 w-4" />
                          <span className="hidden sm:inline">Refresh Prices</span>
                          <span className="sm:hidden">Refresh</span>
                        </>
                      )}
                  </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-8">
              {trades.length === 0 ? (
                <div className="text-center py-16">
                  <div className={`w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner ${
                    isDarkMode 
                      ? 'bg-slate-800/70 border border-slate-600/60' 
                      : 'bg-white border border-gray-200'
                  }`}>
                    <TrendingUp className={`h-12 w-12 ${
                      isDarkMode ? 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]' : 'text-sky-600'
                    }`} />
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>No Active Positions</h3>
                  <p className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Execute your first trade to start tracking your margin positions</p>
                </div>
              ) : (
                <div className={`overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
                  isDarkMode 
                    ? 'border-slate-700/50 bg-slate-800/30' 
                    : 'border-gray-200 bg-white'
                }`}>
                  {/* Modern Table Header */}
                  <div className={`px-6 py-4 transition-all duration-300 ${
                    isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'
                  }`}>
                    <h3 className={`text-lg font-semibold transition-all duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Trading Positions</h3>
                  </div>

                  {/* Mobile: Card Layout, Desktop: Table Layout */}
                  <div className="block sm:hidden">
                    {/* Mobile Card Layout */}
                    <div className="space-y-4 p-4">
                      {trades.map((trade) => {
                        const metrics = calculateTradeMetrics(trade);
                        const isProfitable = metrics.totalReturn > 0;
                        const percentageChange = ((metrics.totalReturn / (trade.buyPrice * trade.quantity)) * 100);
                        
                        return (
                          <div key={trade.id} className={`p-4 rounded-xl border transition-all duration-300 ${
                            isDarkMode 
                              ? 'bg-slate-800/50 border-slate-700/50' 
                              : 'bg-white border-gray-200'
                          }`}>
                            {/* Header Row */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`text-lg font-bold ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>{trade.ticker}</div>
                                <div className={`text-sm ${
                                  isDarkMode ? 'text-slate-400' : 'text-gray-600'
                                }`}>
                                  {trade.quantity} shares @ {formatCurrency(trade.buyPrice)}
                                </div>
                              </div>
                              <div className={`text-right ${
                                isProfitable
                                  ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                                  : (isDarkMode ? 'text-red-400' : 'text-red-600')
                              }`}>
                                <div className="text-lg font-bold">
                                  {isProfitable ? '+' : ''}{formatCurrency(metrics.totalReturn)}
                                </div>
                                <div className="text-sm">
                                  {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(2)}%
                                </div>
                              </div>
                            </div>

                            {/* Current Price Row */}
                            <div className="flex items-center justify-between mb-3">
                              <div className={`text-sm ${
                                isDarkMode ? 'text-slate-400' : 'text-gray-500'
                              }`}>Current Price</div>
                              <div className="flex items-center gap-2">
                                {metrics.currentPrice && !trade.sellPrice ? (
                                  <>
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                    <span className={`text-sm font-medium ${
                                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                    }`}>
                                      {formatCurrency(metrics.currentPrice)}
                                    </span>
                                  </>
                                ) : trade.sellPrice ? (
                                  <>
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span className={`text-sm font-medium ${
                                      isDarkMode ? 'text-green-400' : 'text-green-600'
                                    }`}>
                                      {formatCurrency(trade.sellPrice)}
                                    </span>
                                  </>
                                ) : (
                                  <span className={`text-sm ${
                                    isDarkMode ? 'text-slate-400' : 'text-gray-500'
                                  }`}>—</span>
                                )}
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                              <div>
                                <div className={`text-xs font-medium ${
                                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                                }`}>Volume</div>
                                <div className={`font-semibold ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {(() => {
                                    const md = tickerMarketData[trade.ticker.toUpperCase()];
                                    const vol = md?.volume ?? metrics.volume;
                                    console.log(`[Volume Display] ${trade.ticker} - Market Data:`, md, 'Metrics Volume:', metrics.volume, 'Final Volume:', vol);
                                    return (metrics.currentPrice && vol && vol > 0)
                                      ? `${(vol / 1000000).toFixed(1)}M`
                                      : (vol === 0 ? '0' : '—');
                                  })()}
                                </div>
                                <div className={`text-xs ${
                                  isDarkMode ? 'text-slate-500' : 'text-gray-500'
                                }`}>
                                  {(() => {
                                    const md = tickerMarketData[trade.ticker.toUpperCase()];
                                    const isOpen = (md?.isMarketOpen != null) ? md.isMarketOpen : metrics.isMarketOpen;
                                    const vol = md?.volume ?? metrics.volume;
                                    
                                    // Weekend override - markets are always closed on weekends
                                    const now = new Date();
                                    const dayOfWeek = now.getDay();
                                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                                    
                                    if (isWeekend) {
                                      return '🔴 Closed (Weekend)';
                                    }
                                    
                                    if (isOpen === false && (vol === 0 || vol === null)) {
                                      return '🔴 Closed (No volume)';
                                    }
                                    return isOpen === null ? '—' : (isOpen ? '🟢 Open' : '🔴 Closed');
                                  })()}
                                </div>
                              </div>
                              <div>
                                <div className={`text-xs font-medium ${
                                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                                }`}>Risk</div>
                                <div className={`font-semibold ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>{formatCurrency(metrics.marginUsed)}</div>
                                <div className={`text-xs ${
                                  metrics.priceChangePercent > 0 ? (isDarkMode ? 'text-green-400' : 'text-green-600') :
                                  metrics.priceChangePercent < 0 ? (isDarkMode ? 'text-red-400' : 'text-red-600') :
                                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                                }`}>
                                  {metrics.priceChangePercent > 0 ? '+' : ''}{metrics.priceChangePercent.toFixed(2)}%
                                </div>
                              </div>
                              <div>
                                <div className={`text-xs font-medium ${
                                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                                }`}>Days Held</div>
                                <div className={`font-semibold ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>{metrics.daysHeld}</div>
                              </div>
                              <div>
                                <div className={`text-xs font-medium ${
                                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                                }`}>Rate</div>
                                <div className={`font-semibold ${
                                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                }`}>{metrics.marginRate.toFixed(3)}%</div>
                              </div>
                              <div>
                                <div className={`text-xs font-medium ${
                                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                                }`}>Interest</div>
                                <div className={`font-semibold ${
                                  isDarkMode ? 'text-red-400' : 'text-red-600'
                                }`}>{formatCurrency(metrics.interestCost)}</div>
                              </div>
                              <div>
                                <div className={`text-xs font-medium ${
                                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                                }`}>P&L</div>
                                <div className={`font-semibold ${
                                  metrics.profitLoss >= 0
                                    ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                                    : (isDarkMode ? 'text-red-400' : 'text-red-600')
                                }`}>
                                  {formatCurrency(metrics.profitLoss)}
                                </div>
                              </div>
                            </div>

                            {/* Actions Row */}
                            <div className="flex items-center justify-center gap-2 pt-3 border-t border-gray-200 dark:border-slate-700">
                              <button
                                onClick={() => setShowHoldingCalculator({ trade, metrics })}
                                className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105"
                                title="Model holding costs"
                              >
                                <Calculator className="h-4 w-4" />
                              </button>
                              {!trade.sellPrice && (
                                <button
                                  onClick={() => setSelectedTrade(trade)}
                                  className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105"
                                  title="Sell position"
                                >
                                  <TrendingDown className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => setShowDeleteConfirm(trade.id)}
                                className="p-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105"
                                title="Delete trade"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Desktop Table Layout */}
                  <div className="hidden sm:block overflow-x-auto relative -mx-4 sm:mx-0">
                    <table className="w-full">
                      <thead>
                        <tr className="transition-all duration-300">
                          <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-500'
                          }`}>
                            <div className="group relative inline-block" title="Stock symbol and position details">
                              Position
                            </div>
                          </th>
                          <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-500'
                          }`}>
                            <div className="group relative inline-block" title="Live market price per share">
                              Current Price
                            </div>
                          </th>
                          <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-500'
                          }`}>
                            <div className="group relative inline-block" title="Total profit/loss including interest costs">
                              Total Return
                            </div>
                          </th>
                          <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-500'
                          }`}>
                            <div className="group relative inline-block" title="Percentage change from buy price">
                              % Change
                            </div>
                          </th>
                          <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-500'
                          }`}>
                            <div className="group relative inline-block" title="Daily volume and market data">
                              Volume
                            </div>
                          </th>
                          <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-500'
                          }`}>
                            <div className="group relative inline-block" title="Risk metrics: margin utilization and daily return">
                              Risk
                            </div>
                          </th>
                          <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-500'
                          }`}>
                            <div className="group relative inline-block" title="Number of days position held">
                              Days
                            </div>
                          </th>
                          <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-500'
                          }`}>
                            <div className="group relative inline-block" title="Annual margin interest rate">
                              Rate
                            </div>
                          </th>
                          <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-500'
                          }`}>
                            <div className="group relative inline-block" title="Total interest cost accrued">
                              Interest
                            </div>
                          </th>
                          <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-500'
                          }`}>
                            <div className="group relative inline-block" title="Profit & Loss (excluding interest)">
                              P&L
                            </div>
                          </th>
                          <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-500'
                          }`}>
                            <div className="group relative inline-block" title="Available actions for this position">
                              Actions
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                  {trades.map((trade) => {
                    const metrics = calculateTradeMetrics(trade);
                    const isProfitable = metrics.totalReturn > 0;
                          const percentageChange = ((metrics.totalReturn / (trade.buyPrice * trade.quantity)) * 100);
                    
                    return (
                            <tr 
                        key={trade.id}
                              className={`cursor-pointer transition-all duration-300 hover:scale-[1.01] ${
                          selectedTrade?.id === trade.id 
                            ? (isDarkMode 
                                      ? 'bg-blue-900/20 border-l-4 border-blue-500' 
                                      : 'bg-blue-50 border-l-4 border-blue-500')
                            : (isDarkMode 
                                      ? 'hover:bg-slate-800/50' 
                                      : 'hover:bg-gray-50')
                              }`}
                        onClick={() => setSelectedTrade(trade)}
                      >
                      {/* Position Column */}
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <div>
                          <div className={`text-sm font-bold transition-all duration-300 ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{trade.ticker}</div>
                          <div className={`text-xs transition-all duration-300 ${
                                  isDarkMode ? 'text-slate-400' : 'text-gray-600'
                                }`}>
                                  {trade.quantity} shares @ {formatCurrency(trade.buyPrice)}
                              </div>
                            </div>
                      </td>

                              {/* Current Price Column */}
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                {metrics.currentPrice && !trade.sellPrice ? (
                                  <div className="flex items-center">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse mr-2"></div>
                                    <span className={`text-sm font-medium transition-all duration-300 ${
                                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                    }`}>
                                      {formatCurrency(metrics.currentPrice)}
                                    </span>
                                  </div>
                                ) : trade.sellPrice ? (
                                  <div className="flex items-center">
                                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                                    <span className={`text-sm font-medium transition-all duration-300 ${
                                      isDarkMode ? 'text-green-400' : 'text-green-600'
                                    }`}>
                                      {formatCurrency(trade.sellPrice)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className={`text-sm transition-all duration-300 ${
                                    isDarkMode ? 'text-slate-400' : 'text-gray-500'
                                  }`}>—</span>
                                )}
                              </td>

                              {/* Total Return Column */}
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                                <div className={`text-sm font-bold transition-all duration-300 ${
                                  isProfitable 
                                    ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                                    : (isDarkMode ? 'text-red-400' : 'text-red-600')
                                }`}>
                                  {isProfitable ? '+' : ''}{formatCurrency(metrics.totalReturn)}
                                </div>
                              </td>

                              {/* Percentage Change Column */}
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                                <div className={`text-sm font-medium transition-all duration-300 ${
                                  isProfitable 
                                    ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                                    : (isDarkMode ? 'text-red-400' : 'text-red-600')
                                }`}>
                                  {isProfitable ? '+' : ''}{percentageChange.toFixed(2)}%
                                </div>
                                {metrics.currentPrice && !trade.sellPrice && (
                                  <div className={`text-xs transition-all duration-300 ${
                                    isDarkMode ? 'text-slate-400' : 'text-gray-500'
                                  }`}>
                                    {metrics.currentPrice > trade.buyPrice ? '↗' : '↘'} {((metrics.currentPrice - trade.buyPrice) / trade.buyPrice * 100).toFixed(2)}%
                                  </div>
                                )}
                              </td>

                              {/* Volume Column */}
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                                <div className="space-y-1">
                                  <div className={`text-xs font-medium transition-all duration-300 ${
                                    isDarkMode ? 'text-slate-300' : 'text-gray-700'
                                  }`}>
                                    {(() => {
                                      const md = tickerMarketData[trade.ticker.toUpperCase()];
                                      const vol = md?.volume ?? metrics.volume;
                                      console.log(`[Volume Display] ${trade.ticker} - Market Data:`, md, 'Metrics Volume:', metrics.volume, 'Final Volume:', vol);
                                      return (metrics.currentPrice && vol && vol > 0)
                                        ? `${(vol / 1000000).toFixed(1)}M`
                                        : (vol === 0 ? '0' : '—');
                                    })()}
                                  </div>
                                  <div className={`text-xs transition-all duration-300 ${
                                    isDarkMode ? 'text-slate-400' : 'text-gray-500'
                                  }`}>
                                    {(() => {
                                      const md = tickerMarketData[trade.ticker.toUpperCase()];
                                      const isOpen = (md?.isMarketOpen != null) ? md.isMarketOpen : metrics.isMarketOpen;
                                      const vol = md?.volume ?? metrics.volume;
                                      
                                      // Weekend override - markets are always closed on weekends
                                      const now = new Date();
                                      const dayOfWeek = now.getDay();
                                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                                      
                                      if (isWeekend) {
                                        return '🔴 Closed (Weekend)';
                                      }
                                      
                                      if (isOpen === false && (vol === 0 || vol === null)) {
                                        return '🔴 Closed';
                                      }
                                      return isOpen === null ? '—' : (isOpen ? '🟢 Open' : '🔴 Closed');
                                    })()}
                                  </div>
                                </div>
                              </td>

                              {/* Risk Column - Broker Style */}
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                                <div className="space-y-1">
                                  <div className={`text-xs font-medium transition-all duration-300 ${
                                    isDarkMode ? 'text-slate-300' : 'text-gray-700'
                                  }`}>
                                    {formatCurrency(metrics.marginUsed)} margin
                                  </div>
                                  <div className={`text-xs transition-all duration-300 ${
                                    metrics.priceChangePercent > 0 ? (isDarkMode ? 'text-green-400' : 'text-green-600') :
                                    metrics.priceChangePercent < 0 ? (isDarkMode ? 'text-red-400' : 'text-red-600') :
                                    isDarkMode ? 'text-slate-400' : 'text-gray-500'
                                  }`}>
                                    {metrics.priceChangePercent > 0 ? '+' : ''}{metrics.priceChangePercent.toFixed(2)}%
                                  </div>
                                </div>
                              </td>

                              {/* Days Column */}
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center">
                                <div className={`text-sm font-bold transition-all duration-300 ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {metrics.daysHeld}
                                </div>
                              </td>

                              {/* Rate Column */}
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-1">
                                <div className={`text-sm font-bold transition-all duration-300 ${
                                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                }`}>
                                  {metrics.marginRate.toFixed(3)}%
                                  </div>
                                  {trade.interestRate && trade.interestRate !== selectedMarginRate && (
                                    <div className={`w-2 h-2 rounded-full ${
                                      isDarkMode ? 'bg-yellow-400' : 'bg-yellow-500'
                                    }`} title="Custom rate applied"></div>
                                  )}
                                </div>
                              </td>

                      {/* Interest Column */}
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                        <div className={`text-sm font-bold transition-all duration-300 ${
                          isDarkMode ? 'text-red-400' : 'text-red-600'
                        }`}>
                          {formatCurrency(metrics.interestCost)}
                        </div>
                      </td>

                              {/* P&L Column */}
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                                <div className={`text-sm font-bold transition-all duration-300 ${
                                  metrics.profitLoss >= 0 
                                    ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                                    : (isDarkMode ? 'text-red-400' : 'text-red-600')
                                }`}>
                                  {formatCurrency(metrics.profitLoss)}
                                </div>
                              </td>

                      {/* Actions Column */}
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowHoldingCalculator({ trade, metrics });
                            }}
                            className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105"
                            title="Model holding costs for different periods"
                          >
                            <Calculator className="h-4 w-4" />
                          </button>
                              {!trade.sellPrice && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTrade(trade);
                                  }}
                              className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105"
                                  title="Sell position"
                                >
                                  <TrendingDown className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDeleteConfirm(trade.id);
                                }}
                            className="p-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105"
                                title="Delete trade"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                        </div>
                      </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
                            </div>
                          </div>
          )}
                          
          {/* Trading History Section */}
          {tradingHistory.length > 0 && (
            <div className={`backdrop-blur-sm rounded-2xl shadow-2xl mt-8 transition-all duration-300 ${
              isDarkMode 
                ? 'bg-slate-800/50 border border-slate-700/50' 
                : 'bg-white/90 border border-gray-200/50'
            }`}>
              <div className={`p-8 border-b transition-all duration-300 ${
                isDarkMode ? 'border-slate-700/50' : 'border-gray-200/50'
              }`}>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                    <TrendingUp className="h-5 w-5 text-white" />
                            </div>
                  <h2 className={`text-xl font-bold transition-all duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Trading History</h2>
                  <div className="ml-auto">
                    <button
                      onClick={() => setShowClearHistoryConfirm(true)}
                      className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear History
                    </button>
                  </div>
                </div>
                            </div>

              {/* Mobile: Card Layout, Desktop: Table Layout */}
              <div className="block sm:hidden">
                {/* Mobile Card Layout */}
                <div className="space-y-4">
                  {tradingHistory.map((trade) => {
                    const metrics = calculateTradeMetrics(trade);
                    const isProfitable = metrics.totalReturn > 0;
                    const percentageChange = ((metrics.totalReturn / (trade.buyPrice * trade.quantity)) * 100);
                    
                    return (
                      <div key={trade.id} className={`p-4 rounded-xl border transition-all duration-300 ${
                        isDarkMode 
                          ? 'bg-slate-800/50 border-slate-700/50' 
                          : 'bg-white border-gray-200'
                      }`}>
                        {/* Header Row */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`text-lg font-bold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>{trade.ticker}</div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              trade.action === 'PARTIAL_SELL'
                                ? (isDarkMode ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700')
                                : (isDarkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700')
                            }`}>
                              {trade.action === 'PARTIAL_SELL' ? 'Partial' : 'Sell'}
                            </span>
                          </div>
                          <div className={`text-right ${
                            isProfitable
                              ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                              : (isDarkMode ? 'text-red-400' : 'text-red-600')
                          }`}>
                            <div className="text-lg font-bold">
                              {isProfitable ? '+' : ''}{formatCurrency(metrics.totalReturn)}
                            </div>
                            <div className="text-sm">
                              {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(2)}%
                            </div>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className={`text-xs font-medium ${
                              isDarkMode ? 'text-slate-400' : 'text-gray-500'
                            }`}>Buy Price</div>
                            <div className={`font-semibold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>{formatCurrency(trade.buyPrice)}</div>
                            <div className={`text-xs ${
                              isDarkMode ? 'text-slate-500' : 'text-gray-500'
                            }`}>{trade.buyDate}</div>
                          </div>
                          <div>
                            <div className={`text-xs font-medium ${
                              isDarkMode ? 'text-slate-400' : 'text-gray-500'
                            }`}>Sell Price</div>
                            <div className={`font-semibold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>{formatCurrency(trade.sellPrice!)}</div>
                            <div className={`text-xs ${
                              isDarkMode ? 'text-slate-500' : 'text-gray-500'
                            }`}>{trade.sellDate}</div>
                          </div>
                          <div>
                            <div className={`text-xs font-medium ${
                              isDarkMode ? 'text-slate-400' : 'text-gray-500'
                            }`}>Quantity</div>
                            <div className={`font-semibold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>{trade.quantity} shares</div>
                          </div>
                          <div>
                            <div className={`text-xs font-medium ${
                              isDarkMode ? 'text-slate-400' : 'text-gray-500'
                            }`}>Days Held</div>
                            <div className={`font-semibold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>{metrics.daysHeld}</div>
                          </div>
                          <div>
                            <div className={`text-xs font-medium ${
                              isDarkMode ? 'text-slate-400' : 'text-gray-500'
                            }`}>Interest</div>
                            <div className={`font-semibold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>{formatCurrency(metrics.interestCost)}</div>
                          </div>
                          <div>
                            <div className={`text-xs font-medium ${
                              isDarkMode ? 'text-slate-400' : 'text-gray-500'
                            }`}>P&L</div>
                            <div className={`font-semibold ${
                              metrics.profitLoss >= 0
                                ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                                : (isDarkMode ? 'text-red-400' : 'text-red-600')
                            }`}>
                              {formatCurrency(metrics.profitLoss)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden sm:block overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b transition-all duration-300 ${
                      isDarkMode ? 'border-slate-700/50' : 'border-gray-200'
                    }`}>
                      <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-500'
                      }`}>Position</th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-500'
                      }`}>Action</th>
                      <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-500'
                      }`}>Buy Price</th>
                      <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-500'
                      }`}>Sell Price</th>
                      <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-500'
                      }`}>Total Return</th>
                      <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-500'
                      }`}>% Change</th>
                      <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-500'
                      }`}>Days</th>
                      <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-500'
                      }`}>Interest</th>
                      <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-500'
                      }`}>P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tradingHistory.map((trade) => {
                      const metrics = calculateTradeMetrics(trade);
                      const isProfitable = metrics.totalReturn > 0;
                      const percentageChange = ((metrics.totalReturn / (trade.buyPrice * trade.quantity)) * 100);
                      
                      return (
                        <tr key={trade.id} className={`transition-all duration-300 ${
                          isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'
                        }`}>
                          {/* Position Column */}
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className={`text-sm font-bold transition-all duration-300 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>{trade.ticker}</div>
                              <div className={`text-xs transition-all duration-300 ${
                                isDarkMode ? 'text-slate-400' : 'text-gray-600'
                              }`}>
                                {trade.quantity} shares
                              </div>
                                </div>
                          </td>

                          {/* Action Column */}
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              trade.action === 'PARTIAL_SELL'
                                ? (isDarkMode ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700')
                                : (isDarkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700')
                            }`}>
                              {trade.action === 'PARTIAL_SELL' ? 'Partial Sell' : 'Sell'}
                            </span>
                          </td>

                          {/* Buy Price Column */}
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                            <div className={`text-sm font-bold transition-all duration-300 ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {formatCurrency(trade.buyPrice)}
                            </div>
                            <div className={`text-xs transition-all duration-300 ${
                              isDarkMode ? 'text-slate-400' : 'text-gray-500'
                            }`}>
                              {trade.buyDate}
                            </div>
                          </td>

                          {/* Sell Price Column */}
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                            <div className={`text-sm font-bold transition-all duration-300 ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {formatCurrency(trade.sellPrice!)}
                              </div>
                            <div className={`text-xs transition-all duration-300 ${
                              isDarkMode ? 'text-slate-400' : 'text-gray-500'
                            }`}>
                              {trade.sellDate}
                              </div>
                          </td>

                          {/* Total Return Column */}
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                            <div className={`text-sm font-bold transition-all duration-300 ${
                              isProfitable 
                                ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                                : (isDarkMode ? 'text-red-400' : 'text-red-600')
                            }`}>
                              {isProfitable ? '+' : ''}{formatCurrency(metrics.totalReturn)}
                            </div>
                          </td>

                          {/* Percentage Change Column */}
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                            <div className={`text-sm font-bold transition-all duration-300 ${
                              isProfitable 
                                ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                                : (isDarkMode ? 'text-red-400' : 'text-red-600')
                            }`}>
                              {isProfitable ? '+' : ''}{percentageChange.toFixed(2)}%
                            </div>
                          </td>

                          {/* Days Column */}
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center">
                            <div className={`text-sm font-bold transition-all duration-300 ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {metrics.daysHeld}
                            </div>
                          </td>

                          {/* Interest Column */}
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                            <div className={`text-sm font-bold transition-all duration-300 ${
                                  isDarkMode ? 'text-red-400' : 'text-red-600'
                            }`}>
                              {formatCurrency(metrics.interestCost)}
                              </div>
                          </td>

                          {/* P&L Column */}
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                            <div className={`text-sm font-bold transition-all duration-300 ${
                                  metrics.profitLoss >= 0 
                                    ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                                    : (isDarkMode ? 'text-red-400' : 'text-red-600')
                                }`}>
                                  {formatCurrency(metrics.profitLoss)}
                                </div>
                          </td>
                        </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
                </div>
              )}
          </div>
        )}
        {activeScreen === 'market' && (
          <div className={`rounded-2xl p-4 sm:p-6 md:p-8 backdrop-blur-sm transition-all duration-300 ${
            isDarkMode 
              ? 'bg-slate-800/50 border border-slate-700/50' 
              : 'bg-white border border-gray-200'
          }`}>
            {/* Mobile-First Header - World-Class Standards */}
            <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Mobile-First Ticker Input - World-Class Standards */}
              <div className="flex items-center justify-between gap-3 w-full">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <label className={`text-base font-medium whitespace-nowrap flex-shrink-0 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                    Ticker
                  </label>
                  <input
                    type="text"
                    placeholder="Enter ticker (e.g., AAPL)"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    className={`w-24 sm:w-32 md:w-40 px-4 py-3 border-2 rounded-xl focus:ring-4 transition-all duration-200 shadow-sm text-center font-semibold text-base min-h-[44px] ${
                      isDarkMode 
                        ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-300 focus:ring-sky-500/30 focus:border-sky-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-sky-500/30 focus:border-sky-400'
                    }`}
                    style={{ minHeight: '44px' }} // WCAG accessibility standard
                  />
                </div>
                {/* Get Button - 44px minimum touch target */}
                <button
                  type="button"
                  onClick={() => {
                    console.log('[GetPrice] clicked', { ticker, selectedTimePeriod });
                    fetchPrice(ticker);
                  }}
                  disabled={!ticker || loading}
                  className={`px-4 py-3 rounded-xl font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2 transition-all duration-200 shadow-lg min-h-[44px] min-w-[44px] ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white active:scale-95'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white active:scale-95'
                  }`}
                  style={{ minHeight: '44px', minWidth: '44px' }} // WCAG accessibility standard
                >
                  <Search className="h-5 w-5" />
                  <span className="hidden sm:inline text-base">{loading ? 'Loading...' : 'Get'}</span>
                  <span className="sm:hidden text-base">{loading ? '...' : 'Get'}</span>
                </button>
              </div>

              {/* Recent Tickers - Mobile-Optimized */}
              {recentTickers.length > 0 && (
                <div className="flex flex-col gap-3">
                  <span className={`text-base font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Recent:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {recentTickers.map((recentTicker) => (
                      <button
                        key={`inline-${recentTicker}`}
                        onClick={() => {
                          setTicker(recentTicker);
                          fetchPrice(recentTicker);
                        }}
                        className={`px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 min-h-[44px] ${
                          ticker === recentTicker
                            ? (isDarkMode 
                                ? 'bg-sky-600 text-white shadow-lg active:scale-95' 
                                : 'bg-sky-600 text-white shadow-lg active:scale-95')
                            : (isDarkMode 
                                ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white active:scale-95' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 active:scale-95')
                        }`}
                        style={{ minHeight: '44px' }} // WCAG accessibility standard
                      >
                        {recentTicker}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Professional Trading Chart */}
            {chartData.length > 0 && (
              <div>
                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-3"></div>
                    <h3 className={`text-lg font-bold transition-all duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Professional Trading Chart</h3>
                  </div>
              </div>
              
              {currentPrice && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-sm ${
                  isDarkMode 
                          ? 'bg-slate-800/60 border-emerald-500/30 text-emerald-300'
                          : 'bg-white border-emerald-200 text-emerald-700'
                      }`}>
                        <span className="font-bold">{ticker}</span>
                        <span>{formatCurrency(currentPrice)}</span>
                      </span>
                      <span className={`${isDarkMode ? 'text-emerald-400/70' : 'text-emerald-600/80'} text-xs`}>
                      Live Market Price
                      </span>
                      <div className={`hidden sm:block h-5 w-px ${isDarkMode ? 'bg-emerald-500/30' : 'bg-emerald-300/50'}`}></div>
                      <div className={`flex items-center gap-6 text-sm ${isDarkMode ? 'text-emerald-300/70' : 'text-emerald-700/80'}`}>
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                          High: {formatCurrency(chartData.length > 0 ? Math.max(...chartData.map(p => p.high || p.price)) : currentPrice)}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                          Low: {formatCurrency(chartData.length > 0 ? Math.min(...chartData.map(p => p.low || p.price)) : currentPrice)}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                          Range: {chartData.length > 0 ? (((Math.max(...chartData.map(p => p.high || p.price)) - Math.min(...chartData.map(p => p.low || p.price))) / Math.min(...chartData.map(p => p.low || p.price)) * 100).toFixed(1) + '%') : '—'}
                        </span>
                    </div>
            </div>

            {/* Time Period Toggles */}
            <div className="flex justify-end mb-2">
                    <div className={`flex rounded-xl p-1 transition-all duration-200 ${
                  isDarkMode ? 'bg-slate-700/50' : 'bg-gray-100'
                }`}>
                  {[
                    { key: '1M', label: '1M' },
                    { key: '3mo', label: '3M' },
                    { key: '6mo', label: '6M' },
                    { key: '1y', label: '1Y' }
                  ].map((period) => (
                    <button
                      key={period.key}
                      onClick={() => {
                        setSelectedTimePeriod(period.key);
                        if (ticker) {
                          fetchPrice(ticker, period.key);
                        }
                      }}
                          className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all duration-200 ${
                        selectedTimePeriod === period.key
                          ? (isDarkMode 
                                      ? 'bg-sky-600 text-white shadow' 
                                      : 'bg-sky-600 text-white shadow')
                          : (isDarkMode 
                              ? 'text-slate-300 hover:text-white hover:bg-slate-600/50' 
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200')
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
              </div>
            </div>
              </div>
            )}

            {analystCard && (
              <div className={`mt-4 rounded-xl p-4 transition-all duration-300 ${
                isDarkMode ? 'bg-slate-800/60 border border-slate-700/50' : 'bg-white/90 border border-gray-200/50'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Analyst Summary</div>
                    <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {analystCard.recommendation || '—'}
                      {typeof analystCard.recommendationMean === 'number' && (
                        <span className={`ml-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          ({analystCard.recommendationMean.toFixed(1)})
                        </span>
                      )}
                    </div>
                    <div className={`mt-1 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      {typeof analystCard.targetMean === 'number' && (
                        <span>Target: ${analystCard.targetMean.toFixed(2)} </span>
                      )}
                      {typeof analystCard.targetHigh === 'number' && typeof analystCard.targetLow === 'number' && (
                        <span className="ml-2">(H: ${analystCard.targetHigh.toFixed(2)} • L: ${analystCard.targetLow.toFixed(2)})</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {analystCard.earningsDate && (
                      <div className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>Earnings: {analystCard.earningsDate}</div>
                    )}
                    {analystCard.dividendDate && (
                      <div className={`text-sm ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>Ex‑Div: {analystCard.dividendDate}</div>
                    )}
                  </div>
                </div>
              </div>
            )}
                <div className={`rounded-2xl p-2 transition-all duration-300 ${
                  isDarkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white/90 border border-gray-200/50'
                }`}>
                <InteractiveChart 
                  data={chartData}
                  isDarkMode={isDarkMode}
                  symbol={ticker}
                  showBands={overlayOptions.bands}
                  showSMA50={overlayOptions.sma50}
                  showSMA200={overlayOptions.sma200}
                  showVolSMA={overlayOptions.volSMA}
                  dividends={eventMarkers.dividends}
                  splits={eventMarkers.splits}
                />
                </div>

                {/* Chart Overlay Controls (below chart) */}
                <div className={`mt-3 p-4 rounded-lg ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                  {/* Checkboxes Row */}
                  <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                    <label className={`inline-flex items-center gap-2 cursor-pointer transition-colors duration-200 ${
                      isDarkMode ? 'text-slate-200 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                    }`}>
                      <input 
                        type="checkbox" 
                        checked={overlayOptions.bands} 
                        onChange={(e) => setOverlayOptions(o => ({...o, bands: e.target.checked}))}
                        className={`w-4 h-4 rounded border-2 transition-colors duration-200 ${
                          isDarkMode 
                            ? 'bg-slate-700 border-slate-500 text-blue-500 focus:ring-blue-400' 
                            : 'bg-white border-gray-300 text-blue-600 focus:ring-blue-500'
                        }`}
                      />
                      <span className="font-medium">Bands</span>
                  </label>
                    <label className={`inline-flex items-center gap-2 cursor-pointer transition-colors duration-200 ${
                      isDarkMode ? 'text-slate-200 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                    }`}>
                      <input 
                        type="checkbox" 
                        checked={overlayOptions.sma50} 
                        onChange={(e) => setOverlayOptions(o => ({...o, sma50: e.target.checked}))}
                        className={`w-4 h-4 rounded border-2 transition-colors duration-200 ${
                          isDarkMode 
                            ? 'bg-slate-700 border-slate-500 text-blue-500 focus:ring-blue-400' 
                            : 'bg-white border-gray-300 text-blue-600 focus:ring-blue-500'
                        }`}
                      />
                      <span className="font-medium">SMA 50</span>
                  </label>
                    <label className={`inline-flex items-center gap-2 cursor-pointer transition-colors duration-200 ${
                      isDarkMode ? 'text-slate-200 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                    }`}>
                      <input 
                        type="checkbox" 
                        checked={overlayOptions.sma200} 
                        onChange={(e) => setOverlayOptions(o => ({...o, sma200: e.target.checked}))}
                        className={`w-4 h-4 rounded border-2 transition-colors duration-200 ${
                          isDarkMode 
                            ? 'bg-slate-700 border-slate-500 text-blue-500 focus:ring-blue-400' 
                            : 'bg-white border-gray-300 text-blue-600 focus:ring-blue-500'
                        }`}
                      />
                      <span className="font-medium">SMA 200</span>
                  </label>
                    <label className={`inline-flex items-center gap-2 cursor-pointer transition-colors duration-200 ${
                      isDarkMode ? 'text-slate-200 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                    }`}>
                      <input 
                        type="checkbox" 
                        checked={overlayOptions.volSMA} 
                        onChange={(e) => setOverlayOptions(o => ({...o, volSMA: e.target.checked}))}
                        className={`w-4 h-4 rounded border-2 transition-colors duration-200 ${
                          isDarkMode 
                            ? 'bg-slate-700 border-slate-500 text-blue-500 focus:ring-blue-400' 
                            : 'bg-white border-gray-300 text-blue-600 focus:ring-blue-500'
                        }`}
                      />
                      <span className="font-medium">Vol SMA 20</span>
                  </label>
                  </div>
                  
                  {/* Parameters Row */}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <label className={`inline-flex items-center gap-2 ${
                      isDarkMode ? 'text-slate-200' : 'text-gray-700'
                    }`}>
                      <span className="font-medium">BB Period</span>
                      <input 
                        type="number" 
                        min="10" 
                        max="100" 
                        value={overlayParams.bbPeriod} 
                        onChange={(e)=>setOverlayParams(p=>({...p, bbPeriod: parseInt(e.target.value||'20')}))} 
                        className={`w-16 px-3 py-1.5 rounded border text-center font-medium transition-colors duration-200 ${
                          isDarkMode 
                            ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-400 focus:ring-blue-400/20' 
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20'
                        }`} 
                      />
                    </label>
                    <label className={`inline-flex items-center gap-2 ${
                      isDarkMode ? 'text-slate-200' : 'text-gray-700'
                    }`}>
                      <span className="font-medium">BB σ</span>
                      <input 
                        type="number" 
                        step="0.5" 
                        min="1" 
                        max="3" 
                        value={overlayParams.bbStdDev} 
                        onChange={(e)=>setOverlayParams(p=>({...p, bbStdDev: parseFloat(e.target.value||'2')}))} 
                        className={`w-16 px-3 py-1.5 rounded border text-center font-medium transition-colors duration-200 ${
                          isDarkMode 
                            ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-400 focus:ring-blue-400/20' 
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20'
                        }`} 
                      />
                    </label>
                    <label className={`inline-flex items-center gap-2 ${
                      isDarkMode ? 'text-slate-200' : 'text-gray-700'
                    }`}>
                      <span className="font-medium">SMA50</span>
                      <input 
                        type="number" 
                        min="10" 
                        max="200" 
                        value={overlayParams.sma50} 
                        onChange={(e)=>setOverlayParams(p=>({...p, sma50: parseInt(e.target.value||'50')}))} 
                        className={`w-16 px-3 py-1.5 rounded border text-center font-medium transition-colors duration-200 ${
                          isDarkMode 
                            ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-400 focus:ring-blue-400/20' 
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20'
                        }`} 
                      />
                    </label>
                    <label className={`inline-flex items-center gap-2 ${
                      isDarkMode ? 'text-slate-200' : 'text-gray-700'
                    }`}>
                      <span className="font-medium">SMA200</span>
                      <input 
                        type="number" 
                        min="20" 
                        max="400" 
                        value={overlayParams.sma200} 
                        onChange={(e)=>setOverlayParams(p=>({...p, sma200: parseInt(e.target.value||'200')}))} 
                        className={`w-20 px-3 py-1.5 rounded border text-center font-medium transition-colors duration-200 ${
                          isDarkMode 
                            ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-400 focus:ring-blue-400/20' 
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20'
                        }`} 
                      />
                    </label>
                  </div>
                </div>

                {/* Marker legend */}
                {(eventMarkers.dividends.length > 0 || eventMarkers.splits.length > 0) && (
                  <div className={`mt-2 text-xs inline-flex items-center gap-4 px-2 py-1 rounded ${
                    isDarkMode ? 'text-slate-300' : 'text-gray-700'
                  }`}>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#16A34A' }}></span>
                      Dividend (D)
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#3B82F6' }}></span>
                      Split (S)
                    </span>
                  </div>
                )}
                                        </div>
                                      )}
                                        </div>
                                      )}
                                        </div>

        {/* Performance screen removed */}

        {activeScreen === 'trading' && selectedTrade && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
            <div className={`backdrop-blur-xl rounded-2xl border shadow-2xl max-w-sm sm:max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300 ${
              isDarkMode 
                ? 'bg-slate-800/95 border-slate-700/50' 
                : 'bg-white/95 border-gray-200/50'
            }`}>
              <div className="flex justify-between items-center px-6 py-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <h3 className={`text-xl font-bold transition-all duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {selectedTrade.sellPrice ? 'Trade Details' : 'Sell Position'} - {selectedTrade.ticker}
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedTrade(null)} 
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white' 
                      : 'bg-gray-200/50 hover:bg-gray-300/50 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  X
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {/* Trade Info */}
                <div className={`rounded-xl p-4 transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-slate-700/50 border border-slate-600/50' 
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    <h4 className={`font-semibold transition-all duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Position Details</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className={`transition-all duration-300 ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-600'
                      }`}>Quantity:</span>
                      <div className={`font-bold transition-all duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{selectedTrade.quantity} shares</div>
                    </div>
                    <div>
                      <span className={`transition-all duration-300 ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-600'
                      }`}>Buy Price:</span>
                      <div className={`font-bold transition-all duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{formatCurrency(selectedTrade.buyPrice)}</div>
                    </div>
                    <div>
                      <span className={`transition-all duration-300 ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-600'
                      }`}>Buy Date:</span>
                      <div className={`font-bold transition-all duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{selectedTrade.buyDate}</div>
                    </div>
                    <div>
                      <span className={`transition-all duration-300 ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-600'
                      }`}>Margin Rate:</span>
                      <div className={`font-bold transition-all duration-300 ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`}>{selectedTrade.interestRate.toFixed(3)}%</div>
                    </div>
                  </div>
                </div>

                {!selectedTrade.sellPrice && (
                  <div className={`rounded-xl p-4 transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-slate-700/50 border border-slate-600/50' 
                      : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                      <h4 className={`font-semibold transition-all duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>Sell Position</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className={`block text-sm font-bold mb-2 transition-all duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>Sell Price</label>
                        <input
                          type="number"
                          step="0.0001"
                          min="0"
                          className={`w-full h-12 px-4 border-2 rounded-xl focus:ring-4 focus:ring-green-500/30 focus:border-green-400 transition-all duration-200 shadow-lg text-lg font-semibold ${
                            isDarkMode 
                              ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-300' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                          placeholder="Enter sell price"
                          value={sellForm.price}
                          onChange={(e) => setSellForm(prev => ({ ...prev, price: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-bold mb-2 transition-all duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>Sell Date</label>
                        <input
                          type="date"
                          value={sellForm.date}
                          className={`w-full h-12 px-4 border-2 rounded-xl focus:ring-4 focus:ring-green-500/30 focus:border-green-400 transition-all duration-200 shadow-lg text-lg font-semibold ${
                            isDarkMode 
                              ? 'bg-slate-800 border-slate-600 text-white [color-scheme:dark]' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          onChange={(e) => setSellForm(prev => ({ ...prev, date: e.target.value }))}
                          aria-label="Sell date"
                          title="Select the date when you sold the position"
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-bold mb-2 transition-all duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>Quantity to Sell</label>
                        <input
                          type="number"
                          min="1"
                          max={selectedTrade.quantity}
                          className={`w-full h-12 px-4 border-2 rounded-xl focus:ring-4 focus:ring-green-500/30 focus:border-green-400 transition-all duration-200 shadow-lg text-lg font-semibold ${
                            isDarkMode 
                              ? 'bg-slate-800 border-slate-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder={`Max ${selectedTrade.quantity}`}
                          value={sellForm.qty}
                          onChange={(e) => setSellForm(prev => ({ ...prev, qty: e.target.value }))}
                        />
                        <div className={`mt-1 text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                          Available: {selectedTrade.quantity} shares
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedTrade.sellPrice && (
                  <div className={`rounded-xl p-4 transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-green-900/20 border border-green-500/30' 
                      : 'bg-green-50 border border-green-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                      <h4 className={`font-semibold transition-all duration-300 ${
                        isDarkMode ? 'text-green-400' : 'text-green-700'
                      }`}>Position Closed</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className={`transition-all duration-300 ${
                          isDarkMode ? 'text-slate-400' : 'text-gray-600'
                        }`}>Sell Price:</span>
                        <div className={`font-bold transition-all duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{formatCurrency(selectedTrade.sellPrice)}</div>
                      </div>
                      <div>
                        <span className={`transition-all duration-300 ${
                          isDarkMode ? 'text-slate-400' : 'text-gray-600'
                        }`}>Sell Date:</span>
                        <div className={`font-bold transition-all duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{selectedTrade.sellDate}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className={`rounded-xl p-4 transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-slate-700/50 border border-slate-600/50' 
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                    <h4 className={`font-semibold transition-all duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Trade Summary</h4>
                  </div>
                  {(() => {
                    const metrics = calculateTradeMetrics(selectedTrade);
                    return (
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className={`transition-all duration-300 ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-600'
                          }`}>Days Held:</span>
                          <span className={`font-bold transition-all duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{metrics.daysHeld}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`transition-all duration-300 ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-600'
                          }`}>Interest Cost:</span>
                          <span className={`font-bold transition-all duration-300 ${
                            isDarkMode ? 'text-red-400' : 'text-red-600'
                          }`}>{formatCurrency(metrics.interestCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`transition-all duration-300 ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-600'
                          }`}>P&L:</span>
                          <span className={`font-bold transition-all duration-300 ${
                            metrics.profitLoss >= 0 
                              ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                              : (isDarkMode ? 'text-red-400' : 'text-red-600')
                          }`}>
                            {formatCurrency(metrics.profitLoss)}
                          </span>
                        </div>
                        <div className={`flex justify-between font-bold border-t pt-3 text-base transition-all duration-300 ${
                          isDarkMode ? 'border-slate-600' : 'border-gray-300'
                        }`}>
                          <span className={`transition-all duration-300 ${
                            isDarkMode ? 'text-slate-300' : 'text-gray-700'
                          }`}>Total Return:</span>
                          <span className={`transition-all duration-300 ${
                            metrics.totalReturn >= 0 
                              ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                              : (isDarkMode ? 'text-red-400' : 'text-red-600')
                          }`}>
                            {formatCurrency(metrics.totalReturn)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="px-6 py-4 border-t flex justify-end">
                <button
                  onClick={() => {
                    const price = parseFloat(sellForm.price);
                  const qty = parseInt(sellForm.qty || `${selectedTrade?.quantity}`);
                    if (!selectedTrade || !sellForm.price || isNaN(price) || price <= 0) return;
                  const finalQty = Math.max(1, Math.min(qty, selectedTrade.quantity));
                  if (finalQty >= selectedTrade.quantity) {
                    // Full close
                    updateTrade(selectedTrade.id, { sellPrice: price, sellDate: sellForm.date, action: 'SELL' });
                  } else {
                    // Partial close: split the position into closed + remaining
                    const remainingQty = selectedTrade.quantity - finalQty;
                    const closedPart: Trade = { ...selectedTrade, id: `${selectedTrade.id}_p_${Date.now()}`, quantity: finalQty, sellPrice: price, sellDate: sellForm.date, action: 'PARTIAL_SELL' };
                    const remainingPart: Trade = { ...selectedTrade, quantity: remainingQty };
                    // Replace selected trade with remainingPart and push closedPart to history
                    const remainingTrades = trades.map(t => t.id === selectedTrade.id ? remainingPart : t);
                    saveTrades(remainingTrades);
                    const updatedHistory = [...tradingHistory, closedPart];
                    saveTradingHistory(updatedHistory);
                  }
                    setSelectedTrade(null);
                  }}
                  disabled={!sellForm.price || isNaN(parseFloat(sellForm.price)) || parseFloat(sellForm.price) <= 0}
                  className={`px-5 py-2 rounded-xl font-semibold transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDarkMode
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  Sell Position
                </button>
              </div>
            </div>
          </div>
        )}

        {activeScreen === 'trading' && showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-sm sm:max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-red-600">Delete Trade</h3>
                <button onClick={() => setShowDeleteConfirm(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-700">
                  Are you sure you want to delete this trade? This action cannot be undone.
                </p>
                
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteTrade(showDeleteConfirm)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete Trade
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeScreen === 'trading' && showClearHistoryConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-sm sm:max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-red-600">Clear Trading History</h3>
                <button onClick={() => setShowClearHistoryConfirm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="space-y-4">
                <p className="text-gray-700">This will permanently remove all completed trades from this browser. This cannot be undone.</p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowClearHistoryConfirm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={clearTradingHistory}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Clear History
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Holding Cost Calculator Modal */}
        {showHoldingCalculator && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
            <div className={`rounded-xl shadow-2xl max-w-sm sm:max-w-4xl w-full max-h-[90vh] overflow-hidden transition-all duration-300 ${
              isDarkMode 
                ? 'bg-slate-900 border border-slate-700'
                : 'bg-white border border-gray-200'
            }`}>
              {/* Compact Header */}
              <div className={`px-4 py-3 border-b rounded-t-xl transition-all duration-300 ${
                isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{showHoldingCalculator.trade.ticker}</span>
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold transition-all duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>Holding Cost Calculator</h3>
                      <p className={`text-xs transition-all duration-300 ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-600'
                      }`}>
                        {showHoldingCalculator.trade.quantity} shares @ {formatCurrency(showHoldingCalculator.trade.buyPrice)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      <div className="text-right">
                        <div className={`text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                          isDarkMode ? 'text-slate-400' : 'text-gray-500'
                        }`}>Position Started</div>
                        <div className={`text-sm font-bold transition-all duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {new Date(showHoldingCalculator.trade.buyDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowHoldingCalculator(null)} 
                      className={`p-2 rounded-full transition-all duration-200 hover:scale-105 ${
                        isDarkMode 
                          ? 'hover:bg-slate-700 text-slate-400 hover:text-white' 
                          : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                      }`}
                      title="Close holding cost calculator"
                      aria-label="Close holding cost calculator"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="overflow-y-auto max-h-[calc(90vh-60px)] p-4">
                <HoldingCostCalculator 
                  trade={showHoldingCalculator.trade}
                  metrics={showHoldingCalculator.metrics}
                  isDarkMode={isDarkMode}
                  onClose={() => setShowHoldingCalculator(null)}
                  onApplyRate={(tradeId, rate) => {
                    updateTrade(tradeId, { interestRate: rate });
                    setShowHoldingCalculator(null);
                  }}
                  brokerSettings={brokerSettings}
                />
              </div>
            </div>
          </div>
        )}

         {showSettings && (
           <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
             <div className={`backdrop-blur-xl rounded-xl border shadow-2xl max-w-sm sm:max-w-2xl w-full p-6 transition-all duration-300 ${
               isDarkMode 
                 ? 'bg-slate-800/95 border-slate-700/50' 
                 : 'bg-white/95 border-gray-200/50'
             }`}>
               <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-2">
                   <Percent className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                   <h3 className={`text-lg font-semibold transition-all duration-300 ${
                     isDarkMode ? 'text-white' : 'text-gray-900'
                   }`}>Margin Rates</h3>
                 </div>
                 <button 
                   onClick={() => setShowSettings(false)} 
                   className={`w-6 h-6 rounded flex items-center justify-center transition-all duration-200 text-sm ${
                     isDarkMode 
                       ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white'
                       : 'bg-gray-200/50 hover:bg-gray-300/50 text-gray-600 hover:text-gray-900'
                   }`}
                 >
                   ✕
                 </button>
               </div>
               
               <div className="space-y-4">
                 <div className={`border rounded-lg p-3 transition-all duration-300 ${
                   isDarkMode 
                     ? 'bg-slate-700/30 border-slate-600/30' 
                     : 'bg-gray-100/50 border-gray-200/50'
                 }`}>
                   <div className="flex items-center gap-2 mb-2">
                     <div className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
                     <span className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>Rate Structure</span>
                   </div>
                   <p className={`text-xs transition-all duration-300 ${
                     isDarkMode ? 'text-slate-400' : 'text-gray-600'
                   }`}>
                     Rates adjust automatically based on account balance
                   </p>
                 </div>
                 
                 <div className="space-y-2">
                   {brokerSettings.marginRates.map((rate, index) => (
                     <div key={index} className={`border rounded-lg p-3 transition-all duration-200 ${
                       isDarkMode 
                         ? 'bg-slate-700/40 border-slate-600/40 hover:bg-slate-700/60' 
                         : 'bg-gray-50/50 border-gray-200/50 hover:bg-gray-100/50'
                     }`}>
                       <div className="flex justify-between items-center">
                         <div className="flex-1">
                           <div className={`text-sm font-medium transition-all duration-300 ${
                             isDarkMode ? 'text-white' : 'text-gray-900'
                           }`}>
                             {formatCurrency(rate.minBalance)} - {formatCurrency(rate.maxBalance)}
                           </div>
                           <div className={`text-xs transition-all duration-300 ${
                             isDarkMode ? 'text-slate-400' : 'text-gray-600'
                           }`}>
                             Base +{rate.marginRate.toFixed(3)}%
                           </div>
                         </div>
                         <div className="text-right">
                           <div className={`text-lg font-bold font-mono transition-all duration-300 ${
                             isDarkMode ? 'text-blue-400' : 'text-blue-600'
                           }`}>
                             {rate.effectiveRate.toFixed(3)}%
                           </div>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
                 
                 <div className={`border rounded-lg p-3 transition-all duration-300 ${
                   isDarkMode 
                     ? 'bg-slate-700/30 border-slate-600/30' 
                     : 'bg-gray-100/50 border-gray-200/50'
                 }`}>
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <div className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-emerald-400' : 'bg-emerald-500'}`}></div>
                       <span className={`text-sm font-medium transition-all duration-300 ${
                         isDarkMode ? 'text-emerald-300' : 'text-emerald-600'
                       }`}>Base Rate</span>
                     </div>
                     <div className={`text-lg font-bold font-mono transition-all duration-300 ${
                       isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                     }`}>
                       {brokerSettings.baseRate.toFixed(3)}%
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         )}

         {/* Export Modal */}
         {showExportModal && (
           <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
             <div className={`backdrop-blur-xl rounded-xl border shadow-2xl max-w-sm sm:max-w-2xl w-full p-6 transition-all duration-300 ${
               isDarkMode 
                 ? 'bg-slate-800/95 border-slate-700/50' 
                 : 'bg-white/95 border-gray-200/50'
             }`}>
               <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-2">
                   <Download className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                   <h3 className={`text-lg font-semibold transition-all duration-300 ${
                     isDarkMode ? 'text-white' : 'text-gray-900'
                   }`}>Export Data</h3>
                 </div>
                 <button 
                   onClick={() => setShowExportModal(false)} 
                   className={`w-6 h-6 rounded flex items-center justify-center transition-all duration-200 text-sm ${
                     isDarkMode 
                       ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white'
                       : 'bg-gray-200/50 hover:bg-gray-300/50 text-gray-600 hover:text-gray-900'
                   }`}
                 >
                   ✕
                 </button>
               </div>
               
               <div className="space-y-1">
                 {/* Google-style radio button menu */}
                 <label className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-opacity-50 ${
                   isDarkMode 
                     ? 'hover:bg-slate-700/30' 
                     : 'hover:bg-gray-100/50'
                 }`}>
                   <input
                     type="radio"
                     name="exportType"
                     value="trades"
                     className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                     defaultChecked
                   />
                   <div className="flex items-center gap-3 flex-1">
                     <DollarSign className="h-5 w-5 text-blue-600" />
                     <div className="flex-1">
                       <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                         Active Trades (CSV)
                       </div>
                       <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                         {trades.length} open positions
                       </div>
                     </div>
                   </div>
                 </label>
                 
                 <label className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-opacity-50 ${
                   isDarkMode 
                     ? 'hover:bg-slate-700/30' 
                     : 'hover:bg-gray-100/50'
                 }`}>
                   <input
                     type="radio"
                     name="exportType"
                     value="history"
                     className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                   />
                   <div className="flex items-center gap-3 flex-1">
                     <FileText className="h-5 w-5 text-orange-600" />
                     <div className="flex-1">
                       <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                         Trading History (CSV)
                       </div>
                       <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                         {tradingHistory.length} closed trades
                       </div>
                     </div>
                   </div>
                 </label>
                 
                 <label className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-opacity-50 ${
                   isDarkMode 
                     ? 'hover:bg-slate-700/30' 
                     : 'hover:bg-gray-100/50'
                 }`}>
                   <input
                     type="radio"
                     name="exportType"
                     value="tax"
                     className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                   />
                   <div className="flex items-center gap-3 flex-1">
                     <FileText className="h-5 w-5 text-red-600" />
                     <div className="flex-1">
                       <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                         Tax Report (CSV)
                       </div>
                       <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                         Form 8949 compatible with interest costs
                       </div>
                     </div>
                   </div>
                 </label>
               </div>
               
               {/* Export Button */}
               <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                 <button
                   onClick={() => setShowExportModal(false)}
                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                     isDarkMode 
                       ? 'text-slate-300 hover:text-white hover:bg-slate-700/50' 
                       : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                   }`}
                 >
                   Cancel
                 </button>
                 <button
                   onClick={() => {
                     const selectedType = (document.querySelector('input[name="exportType"]:checked') as HTMLInputElement)?.value;
                     
                     if (selectedType === 'trades') {
                       const csvData = Papa.unparse(trades.map(trade => ({
                         id: trade.id,
                         ticker: trade.ticker,
                         buyPrice: trade.buyPrice,
                         buyDate: trade.buyDate,
                         sellPrice: trade.sellPrice || '',
                         sellDate: trade.sellDate || '',
                         quantity: trade.quantity,
                         interestRate: trade.interestRate,
                         currentPrice: trade.currentPrice || ''
                       })));
                       const blob = new Blob([csvData], { type: 'text/csv' });
                       const url = window.URL.createObjectURL(blob);
                       const a = document.createElement('a');
                       a.href = url;
                       a.download = `trades_${new Date().toISOString().split('T')[0]}.csv`;
                       a.click();
                       window.URL.revokeObjectURL(url);
                     } else if (selectedType === 'history') {
                       const csvData = Papa.unparse(tradingHistory.map(trade => ({
                         id: trade.id,
                         ticker: trade.ticker,
                         buyPrice: trade.buyPrice,
                         buyDate: trade.buyDate,
                         sellPrice: trade.sellPrice,
                         sellDate: trade.sellDate,
                         quantity: trade.quantity,
                         interestRate: trade.interestRate
                       })));
                       const blob = new Blob([csvData], { type: 'text/csv' });
                       const url = window.URL.createObjectURL(blob);
                       const a = document.createElement('a');
                       a.href = url;
                       a.download = `trading_history_${new Date().toISOString().split('T')[0]}.csv`;
                       a.click();
                       window.URL.revokeObjectURL(url);
                     } else if (selectedType === 'tax') {
                       // Calculate tax-relevant data for all trades (active + history)
                       const allTrades = [...trades, ...tradingHistory];
                       const taxData = allTrades.map(trade => {
                         const buyDate = new Date(trade.buyDate);
                         const sellDate = trade.sellDate ? new Date(trade.sellDate) : new Date();
                         const daysHeld = Math.ceil((sellDate.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
                         const isLongTerm = daysHeld > 365;
                         const holdingPeriod = isLongTerm ? 'Long-term' : 'Short-term';
                         
                         // Calculate interest cost
                         const principal = trade.buyPrice * trade.quantity;
                         const dailyRate = trade.interestRate / 100 / 365;
                         const interestCost = principal * dailyRate * daysHeld;
                         
                         // Calculate P&L
                         const grossPnL = trade.sellPrice ? (trade.sellPrice - trade.buyPrice) * trade.quantity : 0;
                         const netPnL = grossPnL - interestCost;
                         
                         // Adjusted cost basis (includes interest)
                         const adjustedCostBasis = trade.buyPrice + (interestCost / trade.quantity);
                         
                         return {
                           // Basic trade info
                           ticker: trade.ticker,
                           buyDate: trade.buyDate,
                           sellDate: trade.sellDate || 'Open',
                           quantity: trade.quantity,
                           buyPrice: trade.buyPrice,
                           sellPrice: trade.sellPrice || trade.currentPrice || '',
                           
                           // Tax calculations
                           daysHeld: daysHeld,
                           holdingPeriod: holdingPeriod,
                           interestRate: trade.interestRate,
                           interestCost: interestCost.toFixed(2),
                           grossPnL: grossPnL.toFixed(2),
                           netPnL: netPnL.toFixed(2),
                           adjustedCostBasis: adjustedCostBasis.toFixed(2),
                           
                           // Tax classification
                           isLongTerm: isLongTerm,
                           isWashSale: false, // TODO: implement wash sale detection
                           
                           // Form 8949 fields
                           description: `${trade.quantity} shares of ${trade.ticker}`,
                           dateAcquired: trade.buyDate,
                           dateSold: trade.sellDate || '',
                           proceeds: trade.sellPrice ? (trade.sellPrice * trade.quantity).toFixed(2) : '',
                           costBasis: (adjustedCostBasis * trade.quantity).toFixed(2),
                           gainLoss: netPnL.toFixed(2)
                         };
                       });
                       
                       const csvData = Papa.unparse(taxData, { header: true });
                       const blob = new Blob([csvData], { type: 'text/csv' });
                       const url = window.URL.createObjectURL(blob);
                       const a = document.createElement('a');
                       a.href = url;
                       a.download = `tax_report_${new Date().toISOString().split('T')[0]}.csv`;
                       a.click();
                       window.URL.revokeObjectURL(url);
                     }
                     
                     setShowExportModal(false);
                   }}
                   className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-200 flex items-center gap-2"
                 >
                   <Download className="h-4 w-4" />
                   Export
                 </button>
               </div>
             </div>
           </div>
         )}
      </div>
    </>
  );
};
 
 export default App;
