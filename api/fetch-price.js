export default async function handler(req, res) {
  const { symbol, timePeriod } = req.query;
  
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  try {
    // Map UI period keys to Yahoo Finance range values
    const rangeParam = timePeriod === '1M' ? '1mo' : timePeriod;
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?range=${rangeParam}&interval=1d&region=US&lang=en-US`;
    
    const response = await fetch(yahooUrl);
    const data = await response.json();
    
    if (data.chart && data.chart.result && data.chart.result[0]) {
      const result = data.chart.result[0];
      const price = result.meta.regularMarketPrice;
      
      // Extract historical data
      if (result.timestamp && result.indicators && result.indicators.quote) {
        const timestamps = result.timestamp;
        const quotes = result.indicators.quote[0];
        
        const chartPoints = timestamps.map((timestamp, index) => {
          const open = quotes.open[index];
          const high = quotes.high[index];
          const low = quotes.low[index];
          const close = quotes.close[index];
          const volume = quotes.volume[index];
          
          if (close && close > 0) {
            const date = new Date(timestamp * 1000);
            const change = close - open;
            const changePercent = open ? (change / open) * 100 : 0;
            
            return {
              date: date.toISOString().split('T')[0],
              price: close,
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
        }).filter(point => point !== null);
        
        // Limit data points based on time period
        let maxPoints = 30;
        if (timePeriod === '3mo') maxPoints = 90;
        else if (timePeriod === '6mo') maxPoints = 180;
        else if (timePeriod === '1y') maxPoints = 365;
        
        const finalData = chartPoints.length > maxPoints ? chartPoints.slice(-maxPoints) : chartPoints;
        
        return res.status(200).json({
          success: true,
          price,
          chartData: finalData
        });
      }
      
      return res.status(200).json({
        success: true,
        price,
        chartData: []
      });
    } else {
      return res.status(404).json({ error: 'Symbol not found' });
    }
  } catch (error) {
    console.error('Error fetching price:', error);
    return res.status(500).json({ error: 'Failed to fetch price data' });
  }
}
