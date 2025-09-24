/**
 * Enhanced Yahoo Finance data fetcher
 * Extracts additional market data beyond just price and volume
 */

export interface EnhancedMarketData {
  // Basic data
  symbol: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
  marketState: string | null;
  isMarketOpen: boolean;
  
  // Market data
  bid?: number | null;
  ask?: number | null;
  marketCap?: number | null;
  fiftyTwoWeekHigh?: number | null;
  fiftyTwoWeekLow?: number | null;
  currency?: string | null;
  averageDailyVolume3Month?: number | null;
  
  // Calculated metrics
  priceToHigh52Week?: number | null;  // Current price / 52-week high
  priceToLow52Week?: number | null;   // Current price / 52-week low
  volumeVsAverage?: number | null;   // Current volume / 3-month average
}

/**
 * Fetch enhanced market data with additional fields
 */
export async function fetchEnhancedMarketData(
  symbols: string[], 
  useProxy = true
): Promise<Record<string, EnhancedMarketData>> {
  console.log('[fetchEnhancedMarketData] Fetching enhanced data for:', symbols);
  
  const results: Record<string, EnhancedMarketData> = {};
  
  for (const symbol of symbols) {
    try {
      // Fetch from v7 quote API for comprehensive data
      const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;
      const proxyCandidates = [
        `https://cors.isomorphic-git.org/${quoteUrl}`,
        `https://thingproxy.freeboard.io/fetch/${quoteUrl}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(quoteUrl)}`,
      ];
      
      let quoteData: any = null;
      for (const url of proxyCandidates) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            quoteData = await response.json();
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (quoteData?.quoteResponse?.result?.[0]) {
        const quote = quoteData.quoteResponse.result[0];
        
        // Calculate additional metrics
        const price = quote.regularMarketPrice;
        const high52 = quote.fiftyTwoWeekHigh;
        const low52 = quote.fiftyTwoWeekLow;
        const volume = quote.regularMarketVolume;
        const avgVolume = quote.averageDailyVolume3Month;
        
        const priceToHigh = price && high52 ? (price / high52) * 100 : null;
        const priceToLow = price && low52 ? (price / low52) * 100 : null;
        const volumeVsAvg = volume && avgVolume ? (volume / avgVolume) * 100 : null;
        
        // Determine market status
        const { determineMarketStatus } = await import('./marketStatus');
        const marketStatus = determineMarketStatus(quote.marketState);
        
        results[symbol.toUpperCase()] = {
          symbol: symbol.toUpperCase(),
          price,
          change: quote.regularMarketChange,
          changePercent: quote.regularMarketChangePercent,
          volume,
          marketState: quote.marketState,
          isMarketOpen: marketStatus.isMarketOpen,
          bid: quote.bid,
          ask: quote.ask,
          marketCap: quote.marketCap,
          fiftyTwoWeekHigh: high52,
          fiftyTwoWeekLow: low52,
          currency: quote.currency,
          averageDailyVolume3Month: avgVolume,
          priceToHigh52Week: priceToHigh,
          priceToLow52Week: priceToLow,
          volumeVsAverage: volumeVsAvg,
        };
        
        console.log(`[fetchEnhancedMarketData] Enhanced data for ${symbol}:`, results[symbol.toUpperCase()]);
      }
    } catch (error) {
      console.warn(`[fetchEnhancedMarketData] Error fetching ${symbol}:`, error);
      // Fallback to basic data
      results[symbol.toUpperCase()] = {
        symbol: symbol.toUpperCase(),
        price: null,
        change: null,
        changePercent: null,
        volume: null,
        marketState: null,
        isMarketOpen: false,
      };
    }
  }
  
  return results;
}

/**
 * Fetch company financial data (P/E, EPS, etc.)
 */
export async function fetchCompanyFinancials(
  symbol: string,
  useProxy = true
): Promise<any> {
  try {
    const { fetchQuoteSummary } = await import('./yahoo');
    const summaryData = await fetchQuoteSummary(symbol, [
      'summaryDetail',
      'financialData', 
      'defaultKeyStatistics'
    ], useProxy);
    
    return {
      peRatio: summaryData?.summaryDetail?.trailingPE,
      eps: summaryData?.summaryDetail?.trailingEps,
      dividendYield: summaryData?.summaryDetail?.dividendYield,
      beta: summaryData?.defaultKeyStatistics?.beta,
      pegRatio: summaryData?.defaultKeyStatistics?.pegRatio,
      enterpriseValue: summaryData?.defaultKeyStatistics?.enterpriseValue,
      revenue: summaryData?.financialData?.totalRevenue,
      profitMargins: summaryData?.financialData?.profitMargins,
    };
  } catch (error) {
    console.warn(`[fetchCompanyFinancials] Error fetching ${symbol}:`, error);
    return null;
  }
}

/**
 * Format market cap for display
 */
export function formatMarketCap(marketCap: number | null | undefined): string {
  if (!marketCap) return '—';
  
  if (marketCap >= 1e12) {
    return `$${(marketCap / 1e12).toFixed(2)}T`;
  } else if (marketCap >= 1e9) {
    return `$${(marketCap / 1e9).toFixed(2)}B`;
  } else if (marketCap >= 1e6) {
    return `$${(marketCap / 1e6).toFixed(2)}M`;
  } else {
    return `$${marketCap.toLocaleString()}`;
  }
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(decimals)}%`;
}
