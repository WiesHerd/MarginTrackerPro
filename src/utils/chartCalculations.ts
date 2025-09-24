/**
 * Chart calculation utilities
 * Extracted from App.tsx and InteractiveChart.tsx to eliminate duplication
 */

/**
 * Calculate Simple Moving Average (SMA)
 * @param arr Array of numbers
 * @param period Period for SMA calculation
 * @returns Array of SMA values (null for insufficient data)
 */
export function calculateSMA(arr: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  let sum = 0;
  
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
    if (i >= period) sum -= arr[i - period];
    out.push(i >= period - 1 ? sum / period : null);
  }
  
  return out;
}

/**
 * Calculate Standard Deviation
 * @param arr Array of numbers
 * @param period Period for calculation
 * @param means Array of mean values (from SMA)
 * @returns Array of standard deviation values
 */
export function calculateStdDev(
  arr: number[], 
  period: number, 
  means: (number | null)[]
): (number | null)[] {
  const out: (number | null)[] = [];
  
  for (let i = 0; i < arr.length; i++) {
    if (i < period - 1 || means[i] == null) { 
      out.push(null); 
      continue; 
    }
    
    const start = i - period + 1;
    const slice = arr.slice(start, i + 1);
    const mean = means[i] as number;
    const variance = slice.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / period;
    out.push(Math.sqrt(variance));
  }
  
  return out;
}

/**
 * Calculate Bollinger Bands
 * @param closes Array of closing prices
 * @param period Period for calculation
 * @param stdDev Standard deviation multiplier
 * @returns Object with upper, middle, and lower bands
 */
export function calculateBollingerBands(
  closes: number[], 
  period: number, 
  stdDev: number
) {
  const mid = calculateSMA(closes, period);
  const sd = calculateStdDev(closes, period, mid);
  
  return {
    mid,
    upper: mid.map((m, i) => 
      m != null && sd[i] != null ? m + stdDev * sd[i] : null
    ),
    lower: mid.map((m, i) => 
      m != null && sd[i] != null ? m - stdDev * sd[i] : null
    )
  };
}

/**
 * Calculate multiple overlays for chart data
 * @param data Chart data points
 * @param params Overlay parameters
 * @returns Chart data with overlays
 */
export function calculateChartOverlays(data: any[], params: {
  bbPeriod: number;
  bbStdDev: number;
  sma50: number;
  sma200: number;
  volSMA: number;
}) {
  const closes = data.map(p => (p.close ?? p.price) || 0);
  const volumes = data.map(p => p.volume || 0);

  const volSMA = calculateSMA(volumes, params.volSMA);
  const sma50 = calculateSMA(closes, params.sma50);
  const sma200 = calculateSMA(closes, params.sma200);
  const bb = calculateBollingerBands(closes, params.bbPeriod, params.bbStdDev);

  return data.map((point, index) => ({
    ...point,
    volSMA20: volSMA[index],
    sma50: sma50[index],
    sma200: sma200[index],
    bbMid: bb.mid[index],
    bbUpper: bb.upper[index],
    bbLower: bb.lower[index],
  }));
}
