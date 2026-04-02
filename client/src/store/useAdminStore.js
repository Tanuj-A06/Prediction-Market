// src/store/useAdminStore.js
import { create } from 'zustand';

export const useAdminStore = create((set) => ({
  pendingMarkets: [],
  
  addPendingMarket: (market) => set((state) => ({
    pendingMarkets: [market, ...state.pendingMarkets]
  })),

  removePendingMarket: (id) => set((state) => ({
    pendingMarkets: state.pendingMarkets.filter(m => m.id !== id)
  }))
}));
