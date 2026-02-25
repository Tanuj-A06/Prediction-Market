// src/store/useUserStore.js
import { create } from 'zustand';
import { tradingService, marketService } from '../services/mockApi';

export const useUserStore = create((set, get) => ({
  balance: 10000,
  positions: [],
  history: [],
  isAuthenticated: false,
  
  login: async (data) => {
    // Simulate latency
    await new Promise(res => setTimeout(res, 500));
    set({ isAuthenticated: true });
  },

  register: async (data) => {
    await new Promise(res => setTimeout(res, 500));
    set({ isAuthenticated: true });
  },

  logout: () => {
    set({ isAuthenticated: false });
  },
  
  executeTrade: async (marketId, outcome, amountInCredits) => {
    const { balance, positions, history } = get();
    
    if (balance < amountInCredits) {
      throw new Error("Insufficient balance");
    }

    // This simulates API call latency
    await new Promise(res => setTimeout(res, 800));

    // Get current market state directly for simplicity in this mock
    const market = await marketService.getMarketById(marketId);
    const executionPrice = outcome === 'Yes' ? market.yesPrice : market.noPrice;
    
    const shares = tradingService.calculateShares(amountInCredits, executionPrice);
    
    // Update market mock service state
    tradingService.simulatePriceImpact(marketId, outcome, amountInCredits);

    const newPosition = {
      id: `pos_${Date.now()}`,
      marketId,
      marketTitle: market.title,
      outcome,
      shares,
      averagePrice: executionPrice
    };

    const newHistory = {
      id: `trx_${Date.now()}`,
      marketId,
      type: 'Buy',
      outcome,
      amount: amountInCredits,
      shares,
      timestamp: new Date().toISOString()
    };

    // Update local state
    set({
      balance: balance - amountInCredits,
      positions: [...positions, newPosition],
      history: [newHistory, ...history]
    });

    return { success: true, shares };
  },

  claimWinnings: async (marketId) => {
    // Mock claiming winnings
    // In a real app we'd verify market is resolved correctly.
    await new Promise(res => setTimeout(res, 500));
    set((state) => ({
      positions: state.positions.filter(p => p.marketId !== marketId)
    }));
    return { success: true };
  }
}));
