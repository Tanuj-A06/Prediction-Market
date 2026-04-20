// src/store/useMarketStore.js
import { create } from 'zustand';
import { backendMarketService } from '../services/api';

export const useMarketStore = create((set, get) => ({
  markets: [],
  isLoading: false,
  error: null,
  filters: {
    category: '',
    sortBy: 'volume', // or 'endingSoon'
    searchQuery: ''
  },
  
  setSearchQuery: (query) => {
    set({ filters: { ...get().filters, searchQuery: query } });
    get().fetchMarkets();
  },
  
  setFilters: (newFilters) => {
    set({ filters: { ...get().filters, ...newFilters } });
    get().fetchMarkets();
  },

  fetchMarkets: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filters } = get();
      const markets = await backendMarketService.getMarkets(filters);
      set({ markets, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  updateMarketData: (marketId, newYesPrice, newNoPrice, addedVolume) => {
    set((state) => ({
      markets: state.markets.map(m => 
        m.id === marketId 
          ? { ...m, yesPrice: newYesPrice, noPrice: newNoPrice, volume: m.volume + addedVolume }
          : m
      )
    }));
  }
}));
