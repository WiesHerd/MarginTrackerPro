export default async function handler(req, res) {
  try {
    const symbolsParam = req.query.symbols;
    if (!symbolsParam) {
      return res.status(400).json({ error: 'symbols query param is required' });
    }
    const symbols = Array.isArray(symbolsParam)
      ? symbolsParam.join(',')
      : String(symbolsParam);

    // Prefer query2
    const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`;
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) {
      return res.status(response.status).json({ error: `Upstream error ${response.status}` });
    }
    const data = await response.json();
    const result = data?.quoteResponse?.result ?? [];
    return res.status(200).json({ result });
  } catch (error) {
    console.error('fetch-quotes error', error);
    return res.status(500).json({ error: 'Failed to fetch quotes' });
  }
}


