// Financial Modeling Prep API utilities
// Free tier: 250 requests per day

export interface AnalystRecommendation {
  symbol: string;
  date: string;
  rating: string;
  ratingScore: number;
  ratingRecommendation: string;
  ratingDetailsDCFRecommendation: string;
  ratingDetailsROERecommendation: string;
  ratingDetailsROARecommendation: string;
  ratingDetailsDERecommendation: string;
  ratingDetailsPERecommendation: string;
  ratingDetailsPBRecommendation: string;
  ratingDetailsPSRecommendation: string;
  ratingDetailsPEGRecommendation: string;
  ratingDetailsPEGRatio: number;
  ratingDetailsPriceToBookRatio: number;
  ratingDetailsPriceToSalesRatio: number;
  ratingDetailsPriceEarningsRatio: number;
  ratingDetailsPriceEarningsToGrowthRatio: number;
  ratingDetailsDividendYield: number;
  ratingDetailsEarningsPerShare: number;
  ratingDetailsReturnOnEquity: number;
  ratingDetailsReturnOnAssets: number;
  ratingDetailsDebtToEquity: number;
  ratingDetailsBookValuePerShare: number;
  ratingDetailsDividendPerShare: number;
  ratingDetailsCashPerShare: number;
  ratingDetailsPriceToCashFlowRatio: number;
  ratingDetailsPriceToFreeCashFlowRatio: number;
  ratingDetailsEarningsYield: number;
  ratingDetailsFreeCashFlowYield: number;
  ratingDetailsDebtToAssets: number;
  ratingDetailsNetDebtToEBITDA: number;
  ratingDetailsCurrentRatio: number;
  ratingDetailsInterestCoverage: number;
  ratingDetailsIncomeQuality: number;
  ratingDetailsDividendYieldPercentage: number;
  ratingDetailsPayoutRatio: number;
  ratingDetailsSalesGeneralAndAdministrativeToRevenue: number;
  ratingDetailsResearchAndDevelopmentToRevenue: number;
  ratingDetailsIntangiblesToTotalAssets: number;
  ratingDetailsCapexToOperatingCashFlow: number;
  ratingDetailsCapexToRevenue: number;
  ratingDetailsCapexToDepreciation: number;
  ratingDetailsStockBasedCompensationToRevenue: number;
  ratingDetailsGrahamNumber: number;
  ratingDetailsRoic: number;
  ratingDetailsReturnOnTangibleAssets: number;
  ratingDetailsGrahamNetNet: number;
  ratingDetailsWorkingCapital: number;
  ratingDetailsTangibleAssetValue: number;
  ratingDetailsNetCurrentAssetValue: number;
  ratingDetailsInvestedCapital: number;
  ratingDetailsAverageReceivables: number;
  ratingDetailsAveragePayables: number;
  ratingDetailsAverageInventory: number;
  ratingDetailsDaysSalesOutstanding: number;
  ratingDetailsDaysPayablesOutstanding: number;
  ratingDetailsDaysOfInventoryOnHand: number;
  ratingDetailsReceivablesTurnover: number;
  ratingDetailsPayablesTurnover: number;
  ratingDetailsInventoryTurnover: number;
  ratingDetailsRoe: number;
  ratingDetailsCapexPerShare: number;
}

export interface AnalystEstimate {
  symbol: string;
  date: string;
  estimatedRevenueLow: number;
  estimatedRevenueHigh: number;
  estimatedRevenueAvg: number;
  estimatedEbitdaLow: number;
  estimatedEbitdaHigh: number;
  estimatedEbitdaAvg: number;
  estimatedEbitLow: number;
  estimatedEbitHigh: number;
  estimatedEbitAvg: number;
  estimatedNetIncomeLow: number;
  estimatedNetIncomeHigh: number;
  estimatedNetIncomeAvg: number;
  estimatedSgaExpenseLow: number;
  estimatedSgaExpenseHigh: number;
  estimatedSgaExpenseAvg: number;
  estimatedEpsLow: number;
  estimatedEpsHigh: number;
  estimatedEpsAvg: number;
  estimatedEpsGrowthLow: number;
  estimatedEpsGrowthHigh: number;
  estimatedEpsGrowthAvg: number;
  revenueEstimateAvg: number;
  revenueEstimateLow: number;
  revenueEstimateHigh: number;
  revenueEstimateGrowthAvg: number;
  revenueEstimateGrowthLow: number;
  revenueEstimateGrowthHigh: number;
  epsEstimateAvg: number;
  epsEstimateLow: number;
  epsEstimateHigh: number;
  epsEstimateGrowthAvg: number;
  epsEstimateGrowthLow: number;
  epsEstimateGrowthHigh: number;
}

// Get API key from environment or use demo key
const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY || 'demo';

export const fetchAnalystRecommendations = async (symbol: string): Promise<AnalystRecommendation[]> => {
  try {
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/rating/${symbol}?apikey=${FMP_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status}`);
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching analyst recommendations:', error);
    return [];
  }
};

export const fetchAnalystEstimates = async (symbol: string): Promise<AnalystEstimate[]> => {
  try {
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/analyst-estimates/${symbol}?apikey=${FMP_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status}`);
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching analyst estimates:', error);
    return [];
  }
};

export const fetchCompanyProfile = async (symbol: string) => {
  try {
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${FMP_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status}`);
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data[0] : null;
  } catch (error) {
    console.error('Error fetching company profile:', error);
    return null;
  }
};

// Helper function to get rating color
export const getRatingColor = (rating: string): string => {
  const ratingLower = rating.toLowerCase();
  
  if (ratingLower.includes('buy') || ratingLower.includes('strong buy')) {
    return 'text-green-600';
  } else if (ratingLower.includes('hold') || ratingLower.includes('neutral')) {
    return 'text-yellow-600';
  } else if (ratingLower.includes('sell') || ratingLower.includes('strong sell')) {
    return 'text-red-600';
  }
  
  return 'text-gray-600';
};

// Helper function to get rating badge color
export const getRatingBadgeColor = (rating: string): string => {
  const ratingLower = rating.toLowerCase();
  
  if (ratingLower.includes('buy') || ratingLower.includes('strong buy')) {
    return 'bg-green-100 text-green-700';
  } else if (ratingLower.includes('hold') || ratingLower.includes('neutral')) {
    return 'bg-yellow-100 text-yellow-700';
  } else if (ratingLower.includes('sell') || ratingLower.includes('strong sell')) {
    return 'bg-red-100 text-red-700';
  }
  
  return 'bg-gray-100 text-gray-700';
};
