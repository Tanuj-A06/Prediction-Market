// src/store/useUserStore.js
import { create } from 'zustand';
import { authService, tradeService, userService } from '../services/api';

export const useUserStore = create((set, get) => ({
  balance: 10000,
  positions: [],
  history: [],
  isAuthenticated: false,
  isAdmin: false,
  currentUser: null,
  
  login: async (data) => {
    const response = await authService.login(data.email, data.password);
    localStorage.setItem('token', response.token);
    set({ 
      isAuthenticated: true, 
      currentUser: response.user,
      balance: parseFloat(response.user.balance),
      isAdmin: response.user.is_admin
    });
    // Hydrate portfolio after login
    await get().fetchPortfolio();
  },

  register: async (data) => {
    const response = await authService.register(data.username, data.email, data.password);
    localStorage.setItem('token', response.token);
    set({ 
      isAuthenticated: true, 
      currentUser: response.user,
      balance: parseFloat(response.user.balance),
      isAdmin: response.user.is_admin
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ isAuthenticated: false, currentUser: null, isAdmin: false, balance: 10000, positions: [], history: [] });
  },

  // Restore session from stored JWT token
  restoreSession: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const { user } = await authService.getMe();
      set({
        isAuthenticated: true,
        currentUser: user,
        balance: parseFloat(user.balance),
        isAdmin: user.is_admin
      });
      await get().fetchPortfolio();
    } catch {
      localStorage.removeItem('token');
    }
  },

  fetchPortfolio: async () => {
    try {
      const data = await userService.getPortfolio();
      set({
        balance: data.balance,
        positions: data.positions,
        history: data.history
      });
    } catch (err) {
      console.error('Failed to fetch portfolio:', err);
    }
  },
  
  executeTrade: async (marketId, outcome, amountInCredits) => {
    const result = await tradeService.buy(marketId, outcome, amountInCredits);
    
    // Update local state with server response
    set({ balance: result.newBalance });
    
    // Re-fetch portfolio to get accurate positions
    await get().fetchPortfolio();

    return { success: true, shares: result.shares };
  },

  sellPosition: async (marketId, outcome, sellShares) => {
    const result = await tradeService.sell(marketId, outcome, sellShares);
    
    set({ balance: result.newBalance });
    
    // Re-fetch portfolio
    await get().fetchPortfolio();

    return { success: true, payout: result.payout };
  },

  claimWinnings: async (marketId) => {
    const result = await tradeService.claim(marketId);
    
    set({ balance: result.newBalance });
    await get().fetchPortfolio();
    
    return { success: true };
  }
}));
