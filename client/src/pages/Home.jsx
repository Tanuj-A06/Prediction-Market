// src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import { useMarketStore } from '../store/useMarketStore';
import { MarketCard } from '../components/shared/MarketCard';
import { GlowButton } from '../components/shared/GlowButton';
import { Filter, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export function Home() {
  const { markets, isLoading, fetchMarkets, setFilters, filters, setSearchQuery } = useMarketStore();
  const [activeCategory, setActiveCategory] = useState('');

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  const handleCategoryFilter = (cat) => {
    const newCat = activeCategory === cat ? '' : cat;
    setActiveCategory(newCat);
    setFilters({ category: newCat });
  };

  const categories = ['Crypto', 'Tech', 'Politics', 'Science'];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border border-cy-border/50 bg-black/40 p-8 md:p-12">
        <div className="absolute inset-0 bg-cy-gradient opacity-10 blur-3xl"></div>
        <div className="relative z-10 max-w-2xl space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-display font-bold text-white tracking-tight"
          >
            Predict the Future. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cy-accent-cyan to-cy-accent-purple">Trade Beliefs.</span>
          </motion.h1>
          <p className="text-cy-text-muted font-mono leading-relaxed max-w-lg">
            Nexus Markets provides a decentralized, low-latency prediction engine.
            Capitalize on truth before it happens.
          </p>
          <div className="pt-4 flex gap-4">
            <GlowButton variant="cyan" onClick={() => window.scrollTo({ top: 500, behavior: 'smooth' })}>Explore Markets</GlowButton>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-cy-surface p-4 rounded-xl border border-cy-border/50 backdrop-blur-md">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <Filter size={16} className="text-cy-text-muted mr-2" />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-mono uppercase transition-all whitespace-nowrap ${activeCategory === cat
                  ? 'bg-cy-accent-purple/20 text-cy-accent-purple border border-cy-accent-purple shadow-glow-purple'
                  : 'bg-black/30 text-cy-text-muted border border-cy-border/50 hover:bg-white/10 hover:text-white'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cy-text-muted" />
          <input
            type="text"
            value={filters.searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search markets..."
            className="w-full bg-black/50 border border-cy-border/50 rounded-lg pl-9 pr-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-cy-accent-cyan transition-colors placeholder:text-cy-text-muted/50"
          />
        </div>
      </div>

      {/* Markets Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-cy-surface border border-cy-border/30 animate-pulse"></div>
          ))}
        </div>
      ) : markets.length === 0 ? (
        <div className="py-20 text-center border border-cy-border/30 rounded-xl bg-cy-surface backdrop-blur-md">
          <p className="text-cy-text-muted font-mono">No markets found matching your filters. The future is unwritten.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {markets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      )}
    </div>
  );
}
