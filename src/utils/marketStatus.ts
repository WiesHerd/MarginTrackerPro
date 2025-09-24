/**
 * Market status utilities
 * Extracted from various components to centralize market status logic
 */

export interface MarketStatus {
  isMarketOpen: boolean;
  marketState: string;
  lastUpdate: string;
}

/**
 * Determine if market is open based on Yahoo Finance data
 * @param regularMarketState Market state from Yahoo Finance
 * @param currentTradingPeriod Current trading period data
 * @returns Market status information
 */
export function determineMarketStatus(
  regularMarketState?: string,
  currentTradingPeriod?: any
): MarketStatus {
  const now = new Date();
  const lastUpdate = now.toLocaleTimeString();
  
  let isMarketOpen = false;
  let marketState = regularMarketState || 'UNKNOWN';

  if (regularMarketState === 'REGULAR') {
    isMarketOpen = true;
  } else if (regularMarketState === 'PRE' || regularMarketState === 'POST') {
    isMarketOpen = true;
  } else if (regularMarketState === 'CLOSED') {
    isMarketOpen = false;
  } else if (currentTradingPeriod?.regular) {
    // Fallback to timestamp comparison
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      const regular = currentTradingPeriod.regular;
      
      if (typeof regular.start === 'number' && typeof regular.end === 'number') {
        isMarketOpen = currentTime >= regular.start && currentTime <= regular.end;
      }
    } catch (e) {
      isMarketOpen = false;
    }
  }

  return {
    isMarketOpen,
    marketState,
    lastUpdate
  };
}

/**
 * Format market status for display
 * @param status Market status object
 * @returns Formatted status string
 */
export function formatMarketStatus(status: MarketStatus): string {
  return status.isMarketOpen ? 'Open' : 'Closed';
}

/**
 * Get market status color for UI
 * @param status Market status object
 * @returns Color class or style
 */
export function getMarketStatusColor(status: MarketStatus): string {
  return status.isMarketOpen ? 'text-green-500' : 'text-red-500';
}
