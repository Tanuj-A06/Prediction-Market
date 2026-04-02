// src/components/TradingWidget.jsx
import React, { useState, useEffect } from 'react';
import { GlassCard } from './shared/GlassCard';
import { GlowButton } from './shared/GlowButton';
import { useUserStore } from '../store/useUserStore';
import { motion, animate } from 'framer-motion';
import { toast } from 'sonner';

export function TradingWidget({ market }) {
  const [activeTab, setActiveTab] = useState('Buy');
  const [outcome, setOutcome] = useState('Yes');
  const [amountStr, setAmountStr] = useState('');
  const [isTrading, setIsTrading] = useState(false);
  
  const balance = useUserStore(state => state.balance);
  const executeTrade = useUserStore(state => state.executeTrade);
  const sellPosition = useUserStore(state => state.sellPosition);
  const positions = useUserStore(state => state.positions);

  const amount = parseFloat(amountStr) || 0;
  const currentPrice = outcome === 'Yes' ? market?.yesPrice : market?.noPrice;
  
  const existingPosition = positions?.find(p => p.marketId === market?.id && p.outcome === outcome);
  const userShares = existingPosition ? existingPosition.shares : 0;

  const estimatedShares = currentPrice && activeTab === 'Buy' ? amount / currentPrice : 0;
  const estimatedPayout = currentPrice && activeTab === 'Sell' ? amount * currentPrice : 0;
  
  // Smoothly animate the estimated dynamic value display
  const [displayValue, setDisplayValue] = useState(0);
  const targetValue = activeTab === 'Buy' ? estimatedShares : estimatedPayout;
  
  useEffect(() => {
    const controls = animate(displayValue, targetValue, {
      duration: 0.4,
      onUpdate: (value) => setDisplayValue(value)
    });
    return () => controls.stop();
  }, [targetValue]);

  const handleTrade = async () => {
    if (amount <= 0) return toast.error("Enter a valid amount");
    
    setIsTrading(true);
    try {
      if (activeTab === 'Buy') {
        if (amount > balance) return toast.error("Insufficient Credits");
        const result = await executeTrade(market.id, outcome, amount);
        toast.success(`Trade Executed! Received ${result.shares.toFixed(2)} shares.`);
      } else {
        if (amount > userShares) return toast.error("Insufficient Shares");
        const result = await sellPosition(market.id, outcome, amount);
        toast.success(`Sold! Returned ${result.payout.toFixed(2)} credits.`);
      }
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
      <div className="flex gap-4 mb-4 border-b border-cy-border/50 pb-2">
        <button className={`uppercase font-mono text-sm tracking-widest transition-colors ${activeTab === 'Buy' ? 'text-cy-accent-cyan' : 'text-cy-text-muted hover:text-white'}`} onClick={() => { setActiveTab('Buy'); setAmountStr(''); }}>Buy</button>
        <button className={`uppercase font-mono text-sm tracking-widest transition-colors ${activeTab === 'Sell' ? 'text-cy-accent-cyan' : 'text-cy-text-muted hover:text-white'}`} onClick={() => { setActiveTab('Sell'); setAmountStr(''); }}>Sell</button>
      </div>
      
      <div className="flex gap-2 mb-6">
        <button
          className={`flex-1 py-3 px-4 rounded-lg font-mono text-sm uppercase transition-all ${
            outcome === 'Yes' 
              ? 'bg-cy-yes/20 border border-cy-yes text-cy-yes shadow-glow-cyan' 
              : 'border border-cy-border text-cy-text-muted hover:bg-white/5'
          }`}
          onClick={() => setOutcome('Yes')}
        >
          {activeTab} Yes {Math.round(market.yesPrice * 100)}Cr
        </button>
        <button
          className={`flex-1 py-3 px-4 rounded-lg font-mono text-sm uppercase transition-all ${
            outcome === 'No' 
              ? 'bg-cy-no/20 border border-cy-no text-cy-no shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]' 
              : 'border border-cy-border text-cy-text-muted hover:bg-white/5'
          }`}
          onClick={() => setOutcome('No')}
        >
          {activeTab} No {Math.round(market.noPrice * 100)}Cr
        </button>
      </div>

      <div className="mb-6 relative">
        <label className="text-xs text-cy-text-muted uppercase mb-2 block font-mono">Amount ({activeTab === 'Buy' ? 'Credits' : 'Shares'})</label>
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
            onClick={() => setAmountStr(activeTab === 'Buy' ? balance.toString() : userShares.toString())}
          >
            MAX
          </button>
        </div>
        <div className="flex justify-between mt-2 text-xs font-mono">
          <span className="text-cy-text-muted">Max Available: {activeTab === 'Buy' ? balance.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' Cr' : userShares.toFixed(2) + ' Sh'}</span>
        </div>
      </div>

      <div className="bg-black/30 p-4 rounded-lg mb-6 border border-cy-border/50">
        <div className="flex justify-between items-center mb-1">
          <span className="text-cy-text-muted text-sm uppercase font-mono tracking-wider">{activeTab === 'Buy' ? 'Est. Shares' : 'Est. Payout'}</span>
          <span className={`font-mono text-xl ${activeTab === 'Sell' ? 'text-cy-yes' : 'text-white'}`}>{(displayValue).toFixed(2)} {activeTab === 'Buy' ? 'Shares' : 'Credits'}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-cy-text-muted">Execution Price</span>
          <span className="text-cy-accent-cyan font-mono">{Math.round(currentPrice * 100)}¢</span>
        </div>
      </div>

      <GlowButton 
        variant={outcome === 'Yes' ? 'success' : 'danger'} 
        className="w-full py-4 text-base tracking-widest"
        onClick={handleTrade}
        disabled={isTrading || amount <= 0 || (activeTab === 'Buy' ? amount > balance : amount > userShares)}
      >
        {isTrading ? 'Transmitting...' : `Execute ${activeTab}`}
      </GlowButton>
    </GlassCard>
  );
}
