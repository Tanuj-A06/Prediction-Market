// src/components/shared/StatHolo.jsx
import React from 'react';
import { GlassCard } from './GlassCard';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function StatHolo({ label, value, trend, prefix = '' }) {
  return (
    <GlassCard className="p-6 relative overflow-hidden group">
      <div className="absolute inset-0 bg-cy-gradient opacity-0 group-hover:opacity-10 transition-opacity"></div>
      <span className="text-cy-text-muted text-xs font-mono uppercase tracking-widest block mb-2">{label}</span>
      <div className="flex items-end justify-between">
        <span className="font-mono text-3xl text-white">{prefix}{value}</span>
        {trend && (
          <span className={`flex items-center text-xs font-mono ${trend > 0 ? 'text-cy-yes' : 'text-cy-no'}`}>
            {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </GlassCard>
  );
}
