// src/components/TradingWidget.jsx
import React, { useState, useEffect } from 'react';
import { GlassCard } from './shared/GlassCard';
import { GlowButton } from './shared/GlowButton';
import { useUserStore } from '../store/useUserStore';
import { motion, animate } from 'framer-motion';
import { toast } from 'sonner';

export function TradingWidget({ market }) {
  const [outcome, setOutcome] = useState('Yes');
  const [amountStr, setAmountStr] = useState('');
  const [isTrading, setIsTrading] = useState(false);
  
  const balance = useUserStore(state => state.balance);
  const executeTrade = useUserStore(state => state.executeTrade);

  const amount = parseFloat(amountStr) || 0;
  const currentPrice = outcome === 'Yes' ? market?.yesPrice : market?.noPrice;
  const estimatedShares = currentPrice ? amount / currentPrice : 0;
  
  // Smoothly animate the estimated shares display
  const [displayShares, setDisplayShares] = useState(0);
  
  useEffect(() => {
    const controls = animate(displayShares, estimatedShares, {
      duration: 0.4,
      onUpdate: (value) => setDisplayShares(value)
    });
    return () => controls.stop();
  }, [estimatedShares]);

  const handleTrade = async () => {
    if (amount <= 0) return toast.error("Enter a valid amount");
    if (amount > balance) return toast.error("Insufficient Credits");
    
    setIsTrading(true);
    try {
      const result = await executeTrade(market.id, outcome, amount);
      toast.success(`Trade Executed! Received ${result.shares.toFixed(2)} shares.`);
      setAmountStr('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsTrading(false);
    }
  };

  if (!market) return null;

  return (
    <GlassCard className="w-full">
      <h3 className="text-xl font-display text-white mb-4">Execute Trade</h3>
      
      <div className="flex gap-2 mb-6">
        <button
          className={`flex-1 py-3 px-4 rounded-lg font-mono text-sm uppercase transition-all ${
            outcome === 'Yes' 
              ? 'bg-cy-yes/20 border border-cy-yes text-cy-yes shadow-glow-cyan' 
              : 'border border-cy-border text-cy-text-muted hover:bg-white/5'
          }`}
          onClick={() => setOutcome('Yes')}
        >
          Buy Yes {Math.round(market.yesPrice * 100)}Cr
        </button>
        <button
          className={`flex-1 py-3 px-4 rounded-lg font-mono text-sm uppercase transition-all ${
            outcome === 'No' 
              ? 'bg-cy-no/20 border border-cy-no text-cy-no shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]' 
              : 'border border-cy-border text-cy-text-muted hover:bg-white/5'
          }`}
          onClick={() => setOutcome('No')}
        >
          Buy No {Math.round(market.noPrice * 100)}Cr
        </button>
      </div>

      <div className="mb-6 relative">
        <label className="text-xs text-cy-text-muted uppercase mb-2 block font-mono">Amount (Credits)</label>
        <div className="relative">
          <input
            type="number"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            className="w-full bg-black/50 border border-cy-border rounded-lg py-3 px-4 text-white font-mono focus:outline-none focus:border-cy-accent-cyan transition-colors"
            placeholder="0"
            min="0"
          />
          <button 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-cy-accent-cyan hover:text-white transition-colors"
            onClick={() => setAmountStr(balance.toString())}
          >
            MAX
          </button>
        </div>
        <div className="flex justify-between mt-2 text-xs font-mono">
          <span className="text-cy-text-muted">Balance: {balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="bg-black/30 p-4 rounded-lg mb-6 border border-cy-border/50">
        <div className="flex justify-between items-center mb-1">
          <span className="text-cy-text-muted text-sm uppercase font-mono tracking-wider">Est. Payout</span>
          <span className="text-white font-mono text-xl">{(displayShares).toFixed(2)} Credits</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-cy-text-muted">Shares</span>
          <span className="text-cy-accent-cyan font-mono">{displayShares.toFixed(2)}</span>
        </div>
      </div>

      <GlowButton 
        variant={outcome === 'Yes' ? 'success' : 'danger'} 
        className="w-full py-4 text-base"
        onClick={handleTrade}
        disabled={isTrading || amount <= 0 || amount > balance}
      >
        {isTrading ? 'Confirming...' : 'Confirm Trade'}
      </GlowButton>
    </GlassCard>
  );
}
