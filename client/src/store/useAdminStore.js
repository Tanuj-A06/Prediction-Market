// src/store/useAdminStore.js
import { create } from "zustand";
import { backendMarketService } from "../services/api";

export const useAdminStore = create((set) => ({
  pendingMarkets: [],
  isLoading: false,
  error: null,

  fetchPendingMarkets: async () => {
    set({ isLoading: true, error: null });
    try {
      const markets = await backendMarketService.getPending();
      set({ pendingMarkets: markets, isLoading: false });
    } catch (err) {
      console.error("Failed to fetch pending markets:", err);
      set({
        isLoading: false,
        error: err.message || "Failed to load pending markets",
      });
    }
  },

  approveMarket: async (id, resolutionScript) => {
    await backendMarketService.approveMarket(id, resolutionScript);
    set((state) => ({
      pendingMarkets: state.pendingMarkets.filter(
        (m) => m.id !== id.toString(),
      ),
    }));
  },

  rejectMarket: async (id) => {
    await backendMarketService.rejectMarket(id);
    set((state) => ({
      pendingMarkets: state.pendingMarkets.filter(
        (m) => m.id !== id.toString(),
      ),
    }));
  },
}));
