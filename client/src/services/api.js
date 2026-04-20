// src/services/api.js

const API_URL = "http://localhost:5000/api";

export const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Utility: transform DB snake_case response to frontend camelCase shape
export function mapMarket(m) {
  return {
    id: (m.market_id || m.id || "").toString(),
    title: m.title,
    description: m.description,
    category: m.category,
    marketType: m.market_type,
    yesPrice: parseFloat(m.yes_price ?? m.yesPrice ?? 0.5),
    noPrice: parseFloat(m.no_price ?? m.noPrice ?? 0.5),
    yesPool: parseFloat(m.yes_pool ?? 500),
    noPool: parseFloat(m.no_pool ?? 500),
    volume: parseFloat(m.volume ?? m.liquidity ?? 0),
    resolutionSource: m.resolution_source || m.resolutionSource || "",
    resolutionScript: m.resolution_script || m.resolutionScript || "",
    resolutionDate: m.resolution_date || m.resolutionDate || "",
    startDate: m.start_date || m.startDate || "",
    status: m.status || "active",
    resolvedOutcome: m.resolved_outcome || null,
    createdBy: m.created_by || null,
    creatorEmail: m.creator_email || null,
    creatorUsername: m.creator_username || null,
  };
}

export const authService = {
  login: async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    return data;
  },
  register: async (username, email, password) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");
    return data;
  },
  getMe: async () => {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch user");
    return data;
  },
};

export const backendMarketService = {
  getMarkets: async (query = {}) => {
    const params = new URLSearchParams();
    if (query.category) params.append("category", query.category);
    if (query.searchQuery) params.append("search", query.searchQuery);
    if (query.sortBy) params.append("sortBy", query.sortBy);

    const res = await fetch(`${API_URL}/markets?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return (data.markets || []).map(mapMarket);
  },
  getMarketById: async (id) => {
    const res = await fetch(`${API_URL}/markets/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return mapMarket(data.market);
  },
  getHistory: async (id, timeframe = "1M") => {
    const res = await fetch(
      `${API_URL}/markets/${id}/history?timeframe=${timeframe}`,
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.history || [];
  },
  createMarket: async (input) => {
    const res = await fetch(`${API_URL}/markets`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        category: input.category,
        resolution_source: input.resolutionSource,
        resolution_date: input.resolutionDate,
        initialProbability: input.initialProbability,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return mapMarket(data.market);
  },
  getPending: async () => {
    const res = await fetch(`${API_URL}/markets/pending`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return (data.markets || []).map(mapMarket);
  },
  approveMarket: async (id, resolutionScript) => {
    const res = await fetch(`${API_URL}/markets/admin/${id}/approve`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ resolutionScript }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return mapMarket(data.market);
  },
  rejectMarket: async (id) => {
    const res = await fetch(`${API_URL}/markets/admin/${id}/reject`, {
      method: "POST",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },
  resolveMarket: async (id, outcome) => {
    const res = await fetch(`${API_URL}/markets/admin/${id}/resolve`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ outcome }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return mapMarket(data.market);
  },
  getActiveMarketsAdmin: async () => {
    const res = await fetch(`${API_URL}/markets/admin/active`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return (data.markets || []).map(mapMarket);
  },
  getAdminUsers: async () => {
    const res = await fetch(`${API_URL}/markets/admin/users`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.users || [];
  },
  getAdminUserDetail: async (userId) => {
    const res = await fetch(`${API_URL}/markets/admin/users/${userId}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },
};

export const tradeService = {
  buy: async (marketId, outcome, amount) => {
    const res = await fetch(`${API_URL}/trades/buy`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ marketId, outcome, amount }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },
  sell: async (marketId, outcome, shares) => {
    const res = await fetch(`${API_URL}/trades/sell`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ marketId, outcome, shares }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },
  claim: async (marketId) => {
    const res = await fetch(`${API_URL}/trades/claim`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ marketId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },
};

export const userService = {
  getPortfolio: async () => {
    const res = await fetch(`${API_URL}/user/portfolio`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },
};
