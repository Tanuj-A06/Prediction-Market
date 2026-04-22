// src/pages/MarketDetail.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { backendMarketService } from "../services/api";
import { TradingWidget } from "../components/TradingWidget";
import { GlassCard } from "../components/shared/GlassCard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity, Clock, ShieldCheck, Database } from "lucide-react";

const TIMEFRAMES = ["1D", "1W", "1M"];

export function MarketDetail() {
  const { id } = useParams();
  const [market, setMarket] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [timeframe, setTimeframe] = useState("1D");
  const [isLoading, setIsLoading] = useState(true);

  // Keep a ref so the setInterval callback always uses the latest timeframe
  const timeframeRef = useRef(timeframe);
  useEffect(() => {
    timeframeRef.current = timeframe;
  }, [timeframe]);

  const loadData = useCallback(async () => {
    try {
      const [m, history] = await Promise.all([
        backendMarketService.getMarketById(id),
        backendMarketService.getHistory(id, timeframeRef.current),
      ]);
      setMarket(m);
      setChartData(history);
    } catch (err) {
      console.error("Failed to load market data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Re-fetch history whenever the timeframe tab changes
  useEffect(() => {
    backendMarketService
      .getHistory(id, timeframe)
      .then(setChartData)
      .catch(console.error);
  }, [id, timeframe]);

  // Initial load + 5-second polling
  useEffect(() => {
    setIsLoading(true);
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (isLoading && !market) {
    return (
      <div className="flex justify-center items-center h-64">
        <Activity className="animate-spin text-cy-accent-cyan" size={32} />
      </div>
    );
  }

  if (!market) {
    return (
      <div className="text-center font-mono text-cy-no mt-20">
        Market not found.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-cy-surface border border-cy-border p-3 rounded-lg backdrop-blur-md shadow-lg">
          <p className="text-cy-text-muted text-xs mb-1 font-mono">{label}</p>
          <p className="text-cy-accent-cyan font-mono text-lg">
            YES: {Math.round(payload[0].value * 100)}¢
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
      {/* Left Column: Chart and Info */}
      <div className="flex-1 space-y-6">
        <GlassCard className="p-6 md:p-8">
          {/* Header row */}
          <div className="flex justify-between items-start mb-6">
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-cy-accent-purple/10 text-cy-accent-purple border border-cy-accent-purple/30 uppercase tracking-wider">
              {market.category}
            </span>
            <div className="flex gap-4 text-xs font-mono text-cy-text-muted">
              <span className="flex items-center gap-1">
                <Database size={14} /> Vol:{" "}
                {(market.volume || 0).toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-cy-accent-cyan">
                <Clock size={14} />{" "}
                {market.resolutionDate
                  ? new Date(market.resolutionDate).toLocaleDateString()
                  : "TBD"}
              </span>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-display text-white mb-6 leading-tight">
            {market.title}
          </h1>

          {/* Live price pills */}
          <div className="flex gap-3 mb-6">
            <div className="flex items-center gap-2 bg-cy-yes/10 border border-cy-yes/40 rounded-full px-4 py-1.5">
              <span className="text-xs font-mono text-cy-text-muted uppercase">
                YES
              </span>
              <span className="text-cy-yes font-mono font-bold text-lg">
                {Math.round(market.yesPrice * 100)}¢
              </span>
            </div>
            <div className="flex items-center gap-2 bg-cy-no/10 border border-cy-no/40 rounded-full px-4 py-1.5">
              <span className="text-xs font-mono text-cy-text-muted uppercase">
                NO
              </span>
              <span className="text-cy-no font-mono font-bold text-lg">
                {Math.round(market.noPrice * 100)}¢
              </span>
            </div>
          </div>

          {/* Timeframe selector */}
          <div className="flex gap-1 mb-3">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded text-xs font-mono uppercase tracking-wider transition-colors ${
                  timeframe === tf
                    ? "bg-cy-accent-cyan/20 text-cy-accent-cyan border border-cy-accent-cyan/50"
                    : "text-cy-text-muted hover:text-white border border-transparent"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Price chart */}
          <div className="h-72 w-full bg-black/20 rounded-xl p-4 border border-cy-border/30">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-cy-text-muted font-mono text-sm">
                No price history yet — make the first trade!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00F0FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="time"
                    stroke="#8A8A93"
                    fontSize={11}
                    tickMargin={10}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 1]}
                    tickFormatter={(tick) => `${Math.round(tick * 100)}¢`}
                    stroke="#8A8A93"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="prob"
                    stroke="#00F0FF"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorProb)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* Rules / Source / Script cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard>
            <h3 className="text-sm font-mono text-cy-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck size={16} className="text-cy-yes" /> Rules
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed font-body">
              {market.description}
            </p>
          </GlassCard>
          <GlassCard>
            <h3 className="text-sm font-mono text-cy-text-muted uppercase tracking-wider mb-4">
              Source of Truth
            </h3>
            <a
              href={`https://${market.resolutionSource}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cy-accent-cyan hover:underline font-mono text-sm break-all"
            >
              {market.resolutionSource}
            </a>
          </GlassCard>
          <GlassCard className="md:col-span-2">
            <h3 className="text-sm font-mono text-cy-text-muted uppercase tracking-wider mb-4">
              Protocol Transparency (Oracle Script)
            </h3>
            <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto text-xs font-mono text-cy-accent-cyan border border-cy-border/30">
              <code>
                {market.resolutionScript ||
                  `fetch("https://${market.resolutionSource}/api")\n  .then(res => res.json())\n  .then(data => data.value > threshold ? "YES" : "NO");`}
              </code>
            </pre>
          </GlassCard>
        </div>
      </div>

      {/* Right Column: Trading Widget */}
      <div className="lg:w-96 shrink-0">
        <div className="sticky top-24">
          <TradingWidget market={market} onTradeComplete={loadData} />
        </div>
      </div>
    </div>
  );
}
