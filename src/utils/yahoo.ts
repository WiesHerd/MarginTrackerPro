export type YahooQuote = {
  symbol: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  averageDailyVolume3Month?: number;
  bid?: number;
  ask?: number;
  marketCap?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  currency?: string;
  marketState?: string;
};

function buildYahooQuoteUrl(symbols: string[]): string {
  const joined = symbols.join(',');
  const base = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(joined)}`;
  return base;
}

// Use allorigins for dev to bypass CORS; in prod, proxy via /api
export async function fetchYahooQuotes(symbols: string[], useProxy = true): Promise<Record<string, YahooQuote>> {
  console.log('[fetchYahooQuotes] Called with symbols:', symbols, 'useProxy:', useProxy);
  if (symbols.length === 0) return {};
  // Prefer query2 which is generally less finicky
  const directUrlV7 = buildYahooQuoteUrl(symbols).replace('query1', 'query2');
  const directUrlV1 = `https://query1.finance.yahoo.com/v1/finance/quote?symbols=${encodeURIComponent(symbols.join(','))}`;

  const proxyCandidates = (u: string) => [
    // allorigins sometimes fails with 500; keep it but not first
    `https://cors.isomorphic-git.org/${u}`,
    `https://thingproxy.freeboard.io/fetch/${u}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  ];

  const makeUrl = (u: string) => useProxy ? proxyCandidates(u) : [u];

  async function fetchJsonWithFallback(urls: string[]): Promise<any | null> {
    for (const u of urls) {
      try {
        console.log('[fetchYahooQuotes] Trying URL:', u);
        const res = await fetch(u);
        if (!res.ok) {
          console.warn('[fetchYahooQuotes] Non-OK status for', u, res.status);
          continue;
        }
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          return json;
        } catch {
          // Some proxies return JSON with correct header; try res.json() fallback
          try {
            const json = await (Promise.resolve(text) as any);
            return json;
          } catch (e) {
            console.warn('[fetchYahooQuotes] Failed to parse JSON for', u);
          }
        }
      } catch (e) {
        console.warn('[fetchYahooQuotes] Fetch failed for', u, e);
      }
    }
    return null;
  }

  // In dev, prefer our local API route to avoid CORS headaches
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  if (isLocalhost) {
    try {
      const localUrl = `/api/fetch-quotes?symbols=${encodeURIComponent(symbols.join(','))}`;
      console.log('[fetchYahooQuotes] Trying local API route:', localUrl);
      const res = await fetch(localUrl);
      if (res.ok) {
        const localData = await res.json();
        const resultArray: YahooQuote[] = localData?.result ?? [];
        const map: Record<string, YahooQuote> = {};
        for (const q of resultArray) {
          if (q && q.symbol) map[q.symbol.toUpperCase()] = q;
        }
        if (Object.keys(map).length > 0) return map;
      }
    } catch (e) {
      console.warn('[fetchYahooQuotes] Local API route failed, falling back to proxies', e);
    }
  }

  const v7Urls = makeUrl(directUrlV7);
  console.log('[fetchYahooQuotes] Fetching URL candidates (v7):', v7Urls);
  let data = await fetchJsonWithFallback(v7Urls);
  console.log('[fetchYahooQuotes] Response data:', data);
  
  // Handle different response formats
  let resultArray: YahooQuote[] = [];
  if (data?.quoteResponse?.result) {
    // Standard Yahoo Finance API format
    resultArray = data.quoteResponse.result;
    console.log('[fetchYahooQuotes] Using quoteResponse format');
  } else if (data?.finance) {
    // Alternative format - let's explore the finance object structure
    console.log('[fetchYahooQuotes] Finance object keys:', Object.keys(data.finance));
    console.log('[fetchYahooQuotes] Finance object:', data.finance);
    
    if (data.finance.result) {
      resultArray = data.finance.result;
      console.log('[fetchYahooQuotes] Using finance.result format');
    } else if (data.finance.quote) {
      resultArray = data.finance.quote;
      console.log('[fetchYahooQuotes] Using finance.quote format');
    } else if (Array.isArray(data.finance)) {
      resultArray = data.finance;
      console.log('[fetchYahooQuotes] Using finance as direct array');
    } else {
      console.log('[fetchYahooQuotes] Finance object structure unknown:', data.finance);
    }
  } else if (Array.isArray(data)) {
    // Direct array format
    resultArray = data;
    console.log('[fetchYahooQuotes] Using direct array format');
  } else {
    console.log('[fetchYahooQuotes] Unknown response format:', Object.keys(data));
  }
  
  // If nothing parsed, try the v1 endpoint as a fallback
  if (!resultArray || resultArray.length === 0) {
    try {
      const v1Urls = makeUrl(directUrlV1);
      console.log('[fetchYahooQuotes] Fallback fetch candidates (v1):', v1Urls);
      const altData = await fetchJsonWithFallback(v1Urls);
      console.log('[fetchYahooQuotes] Fallback data:', altData);
      if (altData?.finance?.result) {
        resultArray = altData.finance.result as YahooQuote[];
        console.log('[fetchYahooQuotes] Parsed from v1 finance.result');
      } else if (altData?.quoteResponse?.result) {
        resultArray = altData.quoteResponse.result as YahooQuote[];
        console.log('[fetchYahooQuotes] Parsed from v1 quoteResponse.result');
      } else if (Array.isArray(altData)) {
        resultArray = altData as YahooQuote[];
        console.log('[fetchYahooQuotes] Parsed from v1 as direct array');
      }
    } catch (e) {
      console.warn('[fetchYahooQuotes] Fallback fetch failed:', e);
    }
  }

  console.log('[fetchYahooQuotes] Result array length:', resultArray.length);
  const map: Record<string, YahooQuote> = {};
  for (const q of resultArray) {
    if (q && q.symbol) {
      map[q.symbol.toUpperCase()] = q;
      console.log('[fetchYahooQuotes] Added quote for:', q.symbol, 'price:', q.regularMarketPrice);
    }
  }
  // If still empty, fall back to chart endpoint per symbol (reliable via proxies)
  if (Object.keys(map).length === 0) {
    for (const sym of symbols) {
      const single = await fetchChartPrice(sym, useProxy);
      if (single?.price != null) {
        map[sym.toUpperCase()] = {
          symbol: sym.toUpperCase(),
          regularMarketPrice: single.price,
          marketState: single.marketState,
        } as YahooQuote;
      }
    }
  }
  console.log('[fetchYahooQuotes] Final map:', map);
  return map;
}

// Fetch volume data using chart API with proxies
export async function fetchVolumeData(symbols: string[], useProxy = true): Promise<Record<string, { volume: number | null, marketState?: string }>> {
  console.log('[fetchVolumeData] Called with symbols:', symbols, 'useProxy:', useProxy);
  if (symbols.length === 0) return {};
  
  const results: Record<string, { volume: number | null, marketState?: string }> = {};
  
  for (const symbol of symbols) {
    try {
      const directUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d&includePrePost=true`;
      
      const proxyCandidates = (u: string) => [
        `https://cors.isomorphic-git.org/${u}`,
        `https://thingproxy.freeboard.io/fetch/${u}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
      ];
      
      const urls = useProxy ? proxyCandidates(directUrl) : [directUrl];
      
      let data: any = null;
      for (const url of urls) {
        try {
          console.log('[fetchVolumeData] Trying URL:', url);
          const response = await fetch(url);
          if (response.ok) {
            const text = await response.text();
            data = JSON.parse(text);
            break;
          }
        } catch (e) {
          console.warn('[fetchVolumeData] Failed for', url, e);
          continue;
        }
      }
      
      if (data?.chart?.result?.[0]) {
        const result = data.chart.result[0];
        const meta = result.meta;
        
        // Get volume from meta or indicators
        let volume = meta.regularMarketVolume;
        if (!volume && result.indicators?.quote?.[0]?.volume) {
          const volumes = result.indicators.quote[0].volume;
          // Get the last non-null volume
          for (let i = volumes.length - 1; i >= 0; i--) {
            if (volumes[i] !== null && volumes[i] !== undefined) {
              volume = volumes[i];
              break;
            }
          }
        }
        
        // Use centralized market status logic
        const { determineMarketStatus } = await import('./marketStatus');
        const marketStatus = determineMarketStatus(meta.regularMarketState, meta.currentTradingPeriod);
        const isMarketOpen = marketStatus.isMarketOpen;
        
        results[symbol.toUpperCase()] = {
          volume: volume || null,
          marketState: meta.regularMarketState,
          isMarketOpen: isMarketOpen
        };
        
        console.log(`[fetchVolumeData] ${symbol} - Volume:`, volume, 'Market State:', meta.regularMarketState, 'isMarketOpen:', isMarketOpen);
      } else {
        results[symbol.toUpperCase()] = { volume: null };
        console.warn(`[fetchVolumeData] No data for ${symbol}`);
      }
    } catch (error) {
      console.warn(`[fetchVolumeData] Error fetching ${symbol}:`, error);
      results[symbol.toUpperCase()] = { volume: null };
    }
  }
  
  return results;
}

// Fallback: fetch last price from chart API (works with proxies)
export async function fetchChartPrice(symbol: string, useProxy = true): Promise<{ price: number | null, marketState?: string } | null> {
  try {
    const direct = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d&includePrePost=true`;
    const url = useProxy
      ? `https://api.allorigins.win/raw?url=${encodeURIComponent(direct)}`
      : direct;
    const res = await fetch(url);
    if (!res.ok) return { price: null };
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return { price: null };
    const meta = result.meta || {};
    const price = meta.regularMarketPrice ?? null;
    let marketState: string | undefined = meta?.currentTradingPeriod?.regular ? undefined : meta?.regularMarketState;
    try {
      const now = Math.floor(Date.now() / 1000);
      const reg = meta?.currentTradingPeriod?.regular;
      if (reg && typeof reg.start === 'number' && typeof reg.end === 'number') {
        marketState = now >= reg.start && now <= reg.end ? 'REGULAR' : (now < reg.start ? 'PRE' : 'POST');
      }
    } catch {}
    return { price, marketState };
  } catch (e) {
    console.warn('[fetchChartPrice] failed for', symbol, e);
    return { price: null };
  }
}

export type QuoteSummaryModules =
  'summaryDetail' |
  'financialData' |
  'defaultKeyStatistics' |
  'calendarEvents' |
  'recommendationTrend' |
  'assetProfile' |
  'price' |
  'earningsTrend';

export async function fetchQuoteSummary(symbol: string, modules: QuoteSummaryModules[] = [
  'summaryDetail', 'financialData', 'defaultKeyStatistics', 'calendarEvents', 'recommendationTrend', 'price', 'earningsTrend'
], useProxy = true): Promise<any> {
  const joinedModules = modules.join(',');
  const directUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${encodeURIComponent(joinedModules)}`;
  const url = useProxy
    ? `https://api.allorigins.win/raw?url=${encodeURIComponent(directUrl)}`
    : directUrl;

  const res = await fetch(url);
  const data = await res.json();
  const result = data?.quoteSummary?.result?.[0] ?? null;
  return result;
}


