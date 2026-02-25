// src/services/mockApi.js

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let markets = [
  {
    id: "mkt_gpt5",
    title: "Will OpenAI announce GPT-5 by December 2026?",
    category: "Tech",
    description: "Resolves to Yes if OpenAI officially announces a model named GPT-5 before Dec 31, 2026, 11:59 PM PT.",
    resolutionSource: "openai.com/blog",
    resolutionDate: "2026-12-31T23:59:59Z",
    yesPrice: 0.68,
    noPrice: 0.32,
    volume: 1250400,
    status: "Active"
  },
  {
    id: "mkt_mars",
    title: "Will SpaceX successfully land a Starship on Mars by 2028?",
    category: "Science",
    description: "Resolves to Yes if an uncrewed Starship touches down on the Martian surface intact.",
    resolutionSource: "spacex.com",
    resolutionDate: "2028-12-31T23:59:59Z",
    yesPrice: 0.41,
    noPrice: 0.59,
    volume: 840000,
    status: "Active"
  },
  {
    id: "mkt_btc_100k",
    title: "Will Bitcoin reach $150k before 2027?",
    category: "Crypto",
    description: "Resolves to Yes if Bitcoin spot price crosses $150,000 on Coinbase.",
    resolutionSource: "coinbase.com",
    resolutionDate: "2026-12-31T23:59:59Z",
    yesPrice: 0.85,
    noPrice: 0.15,
    volume: 3450000,
    status: "Active"
  },
  {
    id: "mkt_eth_etf",
    title: "Will Ethereum flip Bitcoin in market cap by 2027?",
    category: "Crypto",
    description: "Resolves to Yes if ETH market cap exceeds BTC market cap at any point before Jan 1, 2027.",
    resolutionSource: "coinmarketcap.com",
    resolutionDate: "2026-12-31T23:59:59Z",
    yesPrice: 0.12,
    noPrice: 0.88,
    volume: 620000,
    status: "Active"
  },
  {
    id: "mkt_fusion",
    title: "Will a net-positive commercial fusion reactor be announced by 2026?",
    category: "Science",
    description: "Resolves to Yes if a credible entity announces sustained net-positive commercial fusion.",
    resolutionSource: "iter.org",
    resolutionDate: "2026-12-31T23:59:59Z",
    yesPrice: 0.08,
    noPrice: 0.92,
    volume: 125000,
    status: "Active"
  },
  {
    id: "mkt_us_elec",
    title: "Will the US implement a federal AI licensing requirement by 2026?",
    category: "Politics",
    description: "Resolves to Yes if a federal bill is signed requiring licenses to compute > 10^25 FLOP.",
    resolutionSource: "congress.gov",
    resolutionDate: "2026-12-31T23:59:59Z",
    yesPrice: 0.35,
    noPrice: 0.65,
    volume: 1100200,
    status: "Active"
  },
  {
    id: "mkt_apple_car",
    title: "Will Apple officially unveil a vehicle by Q3 2026?",
    category: "Tech",
    description: "Resolves to Yes if Apple announces an Apple Car or similar vehicle.",
    resolutionSource: "apple.com",
    resolutionDate: "2026-09-30T23:59:59Z",
    yesPrice: 0.05,
    noPrice: 0.95,
    volume: 450000,
    status: "Active"
  },
  {
    id: "mkt_agi",
    title: "Will any org claim to have reached AGI by 2027?",
    category: "Tech",
    description: "Resolves to Yes if OpenAI, DeepMind, or Anthropic officially claim to have achieved AGI.",
    resolutionSource: "Multiple",
    resolutionDate: "2026-12-31T23:59:59Z",
    yesPrice: 0.25,
    noPrice: 0.75,
    volume: 2100000,
    status: "Active"
  }
];

export const marketService = {
  getMarkets: async (query = {}) => {
    await delay(600);
    let result = [...markets];
    if (query.searchQuery) {
      result = result.filter(m => m.title.toLowerCase().includes(query.searchQuery.toLowerCase()));
    }
    if (query.category) {
      result = result.filter(m => m.category === query.category);
    }
    if (query.status) {
      result = result.filter(m => m.status === query.status);
    }
    if (query.sortBy === 'volume') {
      result.sort((a, b) => b.volume - a.volume);
    } else if (query.sortBy === 'endingSoon') {
      result.sort((a, b) => new Date(a.resolutionDate) - new Date(b.resolutionDate));
    }
    return result;
  },
  getMarketById: async (id) => {
    await delay(400);
    const market = markets.find(m => m.id === id);
    if (!market) throw new Error("Market not found");
    return market;
  },
  createMarket: async (input) => {
    await delay(800);
    const newMarket = {
      id: `mkt_${Date.now()}`,
      ...input,
      yesPrice: input.initialProbability || 0.5,
      noPrice: 1 - (input.initialProbability || 0.5),
      volume: 0,
      status: "Active",
    };
    markets = [newMarket, ...markets];
    return newMarket;
  }
};

export const tradingService = {
  // Simple mock AMM behavior: calculates shares based on current price
  calculateShares: (amountInCredits, price) => {
    return amountInCredits / price;
  },
  simulatePriceImpact: (marketId, outcome, amountInCredits) => {
    const market = markets.find(m => m.id === marketId);
    if (!market) return;
    
    // Impact logic
    const impact = Math.min((amountInCredits / 100000) * 0.05, 0.1); 
    if (outcome === 'Yes') {
      market.yesPrice = Math.min(0.99, market.yesPrice + impact);
      market.noPrice = 1 - market.yesPrice;
    } else {
      market.noPrice = Math.min(0.99, market.noPrice + impact);
      market.yesPrice = 1 - market.noPrice;
    }
    market.volume += amountInCredits;
  }
};

export const priceHistoryService = {
  getChartData: async (marketId, timeframe) => {
    await delay(500);
    const market = markets.find(m => m.id === marketId);
    if (!market) throw new Error("Market not found");

    const data = [];
    let currentProb = market.yesPrice;
    const points = timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : 24;

    for (let i = points; i >= 0; i--) {
        const date = new Date();
        if (timeframe === '1W' || timeframe === '1M') {
            date.setDate(date.getDate() - i);
        } else {
            date.setHours(date.getHours() - i);
        }
        
        // Random walk towards current probability
        const noise = (Math.random() - 0.5) * 0.1;
        let previousProb = currentProb - noise;
        previousProb = Math.max(0.01, Math.min(0.99, previousProb));
        
        data.push({
            time: timeframe === '1D' ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString(),
            prob: parseFloat(previousProb.toFixed(2))
        });
        currentProb = previousProb;
    }
    
    // Ensure last point is exactly the current price
    data[data.length - 1].prob = parseFloat(market.yesPrice.toFixed(2));
    
    return data;
  }
};
