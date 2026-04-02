// src/store/useUserStore.js
import { create } from 'zustand';
import { tradingService, marketService } from '../services/mockApi';

export const useUserStore = create((set, get) => ({
  balance: 10000,
  positions: [],
  history: [],
  isAuthenticated: false,
  isAdmin: true,
  
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

  sellPosition: async (marketId, outcome, sellShares) => {
    const { balance, positions, history } = get();
    await new Promise(res => setTimeout(res, 800));

    const market = await marketService.getMarketById(marketId);
    const executionPrice = outcome === 'Yes' ? market.yesPrice : market.noPrice;
    const payout = sellShares * executionPrice;

    tradingService.simulatePriceImpact(marketId, outcome === 'Yes' ? 'No' : 'Yes', payout);

    const positionIndex = positions.findIndex(p => p.marketId === marketId && p.outcome === outcome);
    if (positionIndex === -1) throw new Error("Position not found");

    const pos = positions[positionIndex];
    if (pos.shares < sellShares) throw new Error("Not enough shares to sell");

    let newPositions = [...positions];
    if (pos.shares - sellShares < 0.001) {
      newPositions.splice(positionIndex, 1);
    } else {
      newPositions[positionIndex] = { ...pos, shares: pos.shares - sellShares };
    }

    const newHistory = {
      id: `trx_${Date.now()}`,
      marketId,
      type: 'Sell',
      outcome,
      amount: payout,
      shares: sellShares,
      timestamp: new Date().toISOString()
    };

    set({
      balance: balance + payout,
      positions: newPositions,
      history: [newHistory, ...history]
    });

    return { success: true, payout };
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
