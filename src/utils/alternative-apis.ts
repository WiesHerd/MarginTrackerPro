// Alternative free APIs for production use

export const ALTERNATIVE_APIS = {
  // Option 1: Alpha Vantage (Free tier: 5 calls/minute, 500 calls/day)
  alphaVantage: {
    baseUrl: 'https://www.alphavantage.co/query',
    apiKey: 'YOUR_ALPHA_VANTAGE_KEY', // Get free at alphavantage.co
    getUrl: (symbol: string) => 
      `${this.baseUrl}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${this.apiKey}&outputsize=compact`
  },

  // Option 2: Polygon.io (Free tier: 5 calls/minute)
  polygon: {
    baseUrl: 'https://api.polygon.io/v2/aggs/ticker',
    apiKey: 'YOUR_POLYGON_KEY', // Get free at polygon.io
    getUrl: (symbol: string, timespan: string) => 
      `${this.baseUrl}/${symbol}/range/1/day/2023-01-01/2024-01-01?apikey=${this.apiKey}`
  },

  // Option 3: IEX Cloud (Free tier: 50,000 calls/month)
  iexCloud: {
    baseUrl: 'https://cloud.iexapis.com/stable/stock',
    apiKey: 'YOUR_IEX_KEY', // Get free at iexcloud.io
    getUrl: (symbol: string) => 
      `${this.baseUrl}/${symbol}/chart/1m?token=${this.apiKey}`
  },

  // Option 4: Finnhub (Free tier: 60 calls/minute)
  finnhub: {
    baseUrl: 'https://finnhub.io/api/v1',
    apiKey: 'YOUR_FINNHUB_KEY', // Get free at finnhub.io
    getUrl: (symbol: string) => 
      `${this.baseUrl}/quote?symbol=${symbol}&token=${this.apiKey}`
  }
};

// Fallback to mock data for demo purposes
export const MOCK_DATA = {
  'AAPL': { price: 150.25, data: generateMockData(150.25) },
  'MSFT': { price: 300.15, data: generateMockData(300.15) },
  'GOOGL': { price: 2500.75, data: generateMockData(2500.75) },
  'TSLA': { price: 200.50, data: generateMockData(200.50) },
  'NVDA': { price: 400.80, data: generateMockData(400.80) },
  'AMZN': { price: 3200.00, data: generateMockData(3200.00) },
  'META': { price: 250.30, data: generateMockData(250.30) },
  'NFLX': { price: 450.75, data: generateMockData(450.75) },
  'SPY': { price: 450.00, data: generateMockData(450.00) },
  'QQQ': { price: 380.00, data: generateMockData(380.00) },
  'IWM': { price: 200.00, data: generateMockData(200.00) }
};

function generateMockData(basePrice: number) {
  const data = [];
  const today = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Generate realistic price movement
    const variation = (Math.random() - 0.5) * 0.05; // ±2.5% variation
    const price = basePrice * (1 + variation);
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: price,
      open: price * (1 + (Math.random() - 0.5) * 0.02),
      high: price * (1 + Math.random() * 0.03),
      low: price * (1 - Math.random() * 0.03),
      close: price,
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      change: (Math.random() - 0.5) * 5,
      changePercent: (Math.random() - 0.5) * 5,
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
      formattedDate: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })
    });
  }
  
  return data;
}
