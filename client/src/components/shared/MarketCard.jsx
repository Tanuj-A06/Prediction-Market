// src/components/shared/MarketCard.jsx
import React from 'react';
import { GlassCard } from './GlassCard';
import { GlowButton } from './GlowButton';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users } from 'lucide-react';

export function MarketCard({ market }) {
  const navigate = useNavigate();

  return (
    <GlassCard hoverGlow className="flex flex-col h-full cursor-pointer group" onClick={() => navigate(`/market/${market.id}`)}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-mono px-2 py-1 rounded bg-cy-border/50 text-cy-accent-purple border border-cy-accent-purple/30">
          {market.category}
        </span>
        <div className="flex items-center gap-1 text-cy-text-muted text-xs font-mono">
          <Users size={12} />
          <span>{(market.volume).toLocaleString()}</span>
        </div>
      </div>

      <h3 className="text-lg font-display text-white mb-4 flex-grow group-hover:text-cy-accent-cyan transition-colors">
        {market.title}
      </h3>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-cy-border/50">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-cy-text-muted">Yes</span>
            <span className="text-cy-yes font-mono text-lg ">{Math.round(market.yesPrice * 100)}%</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-cy-text-muted">No</span>
            <span className="text-cy-no font-mono text-lg">{Math.round(market.noPrice * 100)}%</span>
          </div>
        </div>

        <div className="flex flex-col gap-1 items-end">
          <span className="text-[10px] text-cy-text-muted uppercase">Ending</span>
          <span className="text-xs text-white font-mono">{new Date(market.resolutionDate).toLocaleDateString()}</span>
        </div>
      </div>
    </GlassCard>
  );
}
