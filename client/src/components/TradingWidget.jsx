// src/components/TradingWidget.jsx
import React, { useState, useEffect } from "react";
import { GlassCard } from "./shared/GlassCard";
import { GlowButton } from "./shared/GlowButton";
import { useUserStore } from "../store/useUserStore";
import { animate } from "framer-motion";
import { toast } from "sonner";

/**
 * Estimate shares received for a BUY using CPMM:
 *   k = yesPool * noPool  (constant product)
 *   Buy YES: inject amount into noPool, drain yesPool
 *   Buy NO:  inject amount into yesPool, drain noPool
 */
function estimateBuyShares(market, outcome, amount) {
  if (!market || amount <= 0) return 0;
  const yesPool = market.yesPool || 500;
  const noPool = market.noPool || 500;
  const k = yesPool * noPool;
  if (outcome === "Yes") {
    const newNoPool = noPool + amount;
    const newYesPool = k / newNoPool;
    return Math.max(0, yesPool - newYesPool);
  } else {
    const newYesPool = yesPool + amount;
    const newNoPool = k / newYesPool;
    return Math.max(0, noPool - newNoPool);
  }
}

/**
 * Estimate credits received for a SELL using CPMM:
 *   Sell YES: return shares to yesPool, drain noPool
 *   Sell NO:  return shares to noPool, drain yesPool
 */
function estimateSellPayout(market, outcome, shares) {
  if (!market || shares <= 0) return 0;
  const yesPool = market.yesPool || 500;
  const noPool = market.noPool || 500;
  const k = yesPool * noPool;
  if (outcome === "Yes") {
    const newYesPool = yesPool + shares;
    const newNoPool = k / newYesPool;
    return Math.max(0, noPool - newNoPool);
  } else {
    const newNoPool = noPool + shares;
    const newYesPool = k / newNoPool;
    return Math.max(0, yesPool - newYesPool);
  }
}

export function TradingWidget({ market, onTradeComplete }) {
  const [activeTab, setActiveTab] = useState("Buy");
  const [outcome, setOutcome] = useState("Yes");
  const [amountStr, setAmountStr] = useState("");
  const [isTrading, setIsTrading] = useState(false);

  const balance = useUserStore((state) => state.balance);
  const executeTrade = useUserStore((state) => state.executeTrade);
  const sellPosition = useUserStore((state) => state.sellPosition);
  const positions = useUserStore((state) => state.positions);

  const amount = parseFloat(amountStr) || 0;
  const currentPrice = outcome === "Yes" ? market?.yesPrice : market?.noPrice;

  const existingPosition = positions?.find(
    (p) =>
      p.marketId?.toString() === market?.id?.toString() &&
      p.outcome === outcome,
  );
  const userShares = existingPosition ? parseFloat(existingPosition.shares) : 0;

  // CPMM-accurate estimates
  const estimatedShares =
    activeTab === "Buy" ? estimateBuyShares(market, outcome, amount) : 0;
  const estimatedPayout =
    activeTab === "Sell" ? estimateSellPayout(market, outcome, amount) : 0;

  // Effective average price
  let effectivePrice = currentPrice || 0.5;
  if (activeTab === "Buy" && estimatedShares > 0) {
    effectivePrice = amount / estimatedShares;
  } else if (activeTab === "Sell" && amount > 0 && estimatedPayout > 0) {
    effectivePrice = estimatedPayout / amount;
  }

  const priceImpact =
    activeTab === "Buy" && amount > 0 && currentPrice
      ? Math.abs(Math.round((effectivePrice - currentPrice) * 100))
      : 0;

  // Smoothly animate the estimated value display
  const [displayValue, setDisplayValue] = useState(0);
  const targetValue = activeTab === "Buy" ? estimatedShares : estimatedPayout;

  useEffect(() => {
    const controls = animate(displayValue, targetValue, {
      duration: 0.35,
      onUpdate: (value) => setDisplayValue(value),
    });
    return () => controls.stop();
  }, [targetValue]);

  const handleTrade = async () => {
    if (amount <= 0) return toast.error("Enter a valid amount");

    setIsTrading(true);
    try {
      if (activeTab === "Buy") {
        if (amount > balance) return toast.error("Insufficient Credits");
        const result = await executeTrade(market.id, outcome, amount);
        toast.success(
          "Trade Executed! Received " + result.shares.toFixed(4) + " shares.",
        );
      } else {
        if (amount > userShares) return toast.error("Insufficient Shares");
        const result = await sellPosition(market.id, outcome, amount);
        toast.success(
          "Sold! Received " + result.payout.toFixed(2) + " credits.",
        );
      }
      setAmountStr("");
      if (onTradeComplete) onTradeComplete();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsTrading(false);
    }
  };

  if (!market) return null;

  const isDisabled =
    isTrading ||
    amount <= 0 ||
    (activeTab === "Buy" ? amount > balance : amount > userShares);

  const yesPct = Math.round((market.yesPrice || 0.5) * 100);
  const noPct = Math.round((market.noPrice || 0.5) * 100);
  const execPct = Math.round(effectivePrice * 100);

  return (
    <GlassCard className="w-full">
      {/* Buy / Sell tabs */}
      <div className="flex gap-4 mb-4 border-b border-cy-border/50 pb-2">
        {["Buy", "Sell"].map((tab) => (
          <button
            key={tab}
            className={
              "uppercase font-mono text-sm tracking-widest transition-colors " +
              (activeTab === tab
                ? "text-cy-accent-cyan"
                : "text-cy-text-muted hover:text-white")
            }
            onClick={() => {
              setActiveTab(tab);
              setAmountStr("");
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* YES / NO outcome selector with live prices */}
      <div className="flex gap-2 mb-6">
        <button
          className={
            "flex-1 py-3 px-4 rounded-lg font-mono text-sm uppercase transition-all " +
            (outcome === "Yes"
              ? "bg-cy-yes/20 border border-cy-yes text-cy-yes"
              : "border border-cy-border text-cy-text-muted hover:bg-white/5")
          }
          onClick={() => setOutcome("Yes")}
        >
          <div className="text-[10px] tracking-widest opacity-70 mb-0.5">
            YES
          </div>
          <div className="text-xl font-bold">{yesPct}c</div>
        </button>
        <button
          className={
            "flex-1 py-3 px-4 rounded-lg font-mono text-sm uppercase transition-all " +
            (outcome === "No"
              ? "bg-cy-no/20 border border-cy-no text-cy-no"
              : "border border-cy-border text-cy-text-muted hover:bg-white/5")
          }
          onClick={() => setOutcome("No")}
        >
          <div className="text-[10px] tracking-widest opacity-70 mb-0.5">
            NO
          </div>
          <div className="text-xl font-bold">{noPct}c</div>
        </button>
      </div>

      {/* Amount input */}
      <div className="mb-6">
        <label className="text-xs text-cy-text-muted uppercase mb-2 block font-mono">
          Amount ({activeTab === "Buy" ? "Credits" : "Shares"})
        </label>
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
            onClick={() =>
              setAmountStr(
                activeTab === "Buy" ? String(balance) : String(userShares),
              )
            }
          >
            MAX
          </button>
        </div>
        <div className="mt-2 text-xs font-mono text-cy-text-muted">
          Available:{" "}
          {activeTab === "Buy"
            ? balance.toLocaleString(undefined, { maximumFractionDigits: 2 }) +
              " Cr"
            : userShares.toFixed(4) + " Sh"}
        </div>
      </div>

      {/* Trade summary */}
      <div className="bg-black/30 p-4 rounded-lg mb-6 border border-cy-border/50 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-cy-text-muted text-sm uppercase font-mono tracking-wider">
            {activeTab === "Buy" ? "Est. Shares" : "Est. Payout"}
          </span>
          <span
            className={
              "font-mono text-xl " +
              (activeTab === "Sell" ? "text-cy-yes" : "text-white")
            }
          >
            {displayValue.toFixed(4)}{" "}
            <span className="text-sm opacity-70">
              {activeTab === "Buy" ? "Sh" : "Cr"}
            </span>
          </span>
        </div>

        <div className="flex justify-between items-center text-xs border-t border-cy-border/30 pt-2">
          <span className="text-cy-text-muted font-mono">
            Avg Execution Price
          </span>
          <span className="text-cy-accent-cyan font-mono">{execPct}c</span>
        </div>

        {activeTab === "Buy" && amount > 0 && priceImpact > 0 && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-cy-text-muted font-mono">Price Impact</span>
            <span className="text-cy-accent-purple font-mono">
              +{priceImpact}c
            </span>
          </div>
        )}
      </div>

      <GlowButton
        variant={outcome === "Yes" ? "success" : "danger"}
        className="w-full py-4 text-base tracking-widest"
        onClick={handleTrade}
        disabled={isDisabled}
      >
        {isTrading ? "Transmitting..." : "Execute " + activeTab + " " + outcome}
      </GlowButton>
    </GlassCard>
  );
}
