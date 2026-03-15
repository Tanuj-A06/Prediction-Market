// src/pages/MarketDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { marketService, priceHistoryService } from '../services/mockApi';
import { TradingWidget } from '../components/TradingWidget';
import { GlassCard } from '../components/shared/GlassCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Clock, ShieldCheck, Database } from 'lucide-react';

export function MarketDetail() {
  const { id } = useParams();
  const [market, setMarket] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const m = await marketService.getMarketById(id);
        const history = await priceHistoryService.getChartData(id, '1M');
        setMarket(m);
        setChartData(history);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
    
    // Poll for updates in this mock environment
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [id]);

  if (isLoading && !market) {
    return (
      <div className="flex justify-center items-center h-64">
        <Activity className="animate-spin text-cy-accent-cyan" size={32} />
      </div>
    );
  }

  if (!market) {
    return <div className="text-center font-mono text-cy-no mt-20">Market not found.</div>;
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
          <div className="flex justify-between items-start mb-6">
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-cy-accent-purple/10 text-cy-accent-purple border border-cy-accent-purple/30 uppercase tracking-wider">
              {market.category}
            </span>
            <div className="flex gap-4 text-xs font-mono text-cy-text-muted">
               <span className="flex items-center gap-1"><Database size={14}/> Vol: {market.volume.toLocaleString()}</span>
               <span className="flex items-center gap-1 text-cy-accent-cyan"><Clock size={14}/> {new Date(market.resolutionDate).toLocaleDateString()}</span>
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-display text-white mb-8 leading-tight">
            {market.title}
          </h1>

          <div className="h-72 w-full mt-4 bg-black/20 rounded-xl p-4 border border-cy-border/30">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData}>
                 <defs>
                   <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#00F0FF" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                 <XAxis dataKey="time" stroke="#8A8A93" fontSize={11} tickMargin={10} axisLine={false} tickLine={false} />
                 <YAxis domain={[0, 1]} tickFormatter={(tick) => `${Math.round(tick * 100)}¢`} stroke="#8A8A93" fontSize={11} axisLine={false} tickLine={false} tickMargin={10} />
                 <Tooltip content={<CustomTooltip />} />
                 <Area type="monotone" dataKey="prob" stroke="#00F0FF" strokeWidth={2} fillOpacity={1} fill="url(#colorProb)" />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </GlassCard>

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
             <h3 className="text-sm font-mono text-cy-text-muted uppercase tracking-wider mb-4">Source of Truth</h3>
             <a href={`https://${market.resolutionSource}`} target="_blank" rel="noopener noreferrer" className="text-cy-accent-cyan hover:underline font-mono text-sm break-all">
               {market.resolutionSource}
             </a>
           </GlassCard>
        </div>
      </div>

      {/* Right Column: Trading Widget */}
      <div className="lg:w-96 shrink-0">
        <div className="sticky top-24">
           <TradingWidget market={market} />
        </div>
      </div>
    </div>
  );
}
