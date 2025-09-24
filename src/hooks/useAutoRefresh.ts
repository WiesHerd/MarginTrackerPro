import { useState, useEffect, useCallback } from 'react';
import { fetchYahooQuotes, fetchEnhancedStockData, fetchVolumeData } from '../utils/yahoo';

interface AutoRefreshOptions {
  enabled: boolean;
  interval: number; // in milliseconds
  tickers: string[];
  onUpdate: (data: any) => void;
  onError?: (error: Error) => void;
}

export const useAutoRefresh = ({
  enabled,
  interval,
  tickers,
  onUpdate,
  onError
}: AutoRefreshOptions) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<string>('');

  const refreshPrices = useCallback(async () => {
    if (isRefreshing || tickers.length === 0) return;
    
    setIsRefreshing(true);
    try {
      console.log('[Auto-refresh] Starting price refresh for tickers:', tickers);
      
      // Method 1: Try primary API route
      const apiUrl = '/api/fetch-quotes';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: tickers })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[Auto-refresh] Primary API success:', data);
        onUpdate(data);
        setLastRefreshTime(new Date().toLocaleTimeString());
        return;
      }

      // Method 2: Fallback to enhanced stock data
      console.log('[Auto-refresh] Primary API failed, trying enhanced stock data');
      const enhancedData = await fetchEnhancedStockData(tickers, true);
      if (enhancedData && Object.keys(enhancedData).length > 0) {
        console.log('[Auto-refresh] Enhanced stock data success:', enhancedData);
        onUpdate(enhancedData);
        setLastRefreshTime(new Date().toLocaleTimeString());
        return;
      }

      // Method 3: Try volume data separately
      console.log('[Auto-refresh] Fetching volume data separately');
      const volumeData = await fetchVolumeData(tickers, true);
      if (volumeData && Object.keys(volumeData).length > 0) {
        console.log('[Auto-refresh] Volume data success:', volumeData);
        onUpdate(volumeData);
        setLastRefreshTime(new Date().toLocaleTimeString());
        return;
      }

      console.log('[Auto-refresh] All methods failed');
    } catch (error) {
      console.error('[Auto-refresh] Error:', error);
      onError?.(error as Error);
    } finally {
      setIsRefreshing(false);
    }
  }, [tickers, onUpdate, onError, isRefreshing]);

  useEffect(() => {
    if (!enabled || tickers.length === 0) return;

    const intervalId = setInterval(refreshPrices, interval);
    return () => clearInterval(intervalId);
  }, [enabled, interval, refreshPrices]);

  return {
    isRefreshing,
    lastRefreshTime,
    refreshPrices
  };
};
