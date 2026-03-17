// src/pages/Portfolio.jsx
import React from 'react';
import { useUserStore } from '../store/useUserStore';
import { GlassCard } from '../components/shared/GlassCard';
import { StatHolo } from '../components/shared/StatHolo';
import { ArrowUpRight, ArrowDownRight, Award, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';



export function Portfolio() {
  const { balance, positions = [], history = [] } = useUserStore();
  const navigate = useNavigate();

  // Mock calculations
  const totalPositionValue = positions?.reduce((acc, pos) => acc + ((pos?.shares || 0) * (pos?.averagePrice || 0)), 0) || 0;
  const totalValue = balance + totalPositionValue;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-2">Command Center</h1>
        <p className="text-cy-text-muted font-mono text-sm">Track your active deployments and historical performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatHolo label="Total Value" value={totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} prefix="C$ " trend={12.4} />
        <StatHolo label="Cash Balance" value={balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} prefix="C$ " />
        <StatHolo label="Active Positions" value={positions.length.toString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Positions Table */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard>
            <h3 className="text-xl font-display text-white mb-6 flex items-center gap-2">
              <Activity className="text-cy-accent-cyan" size={20} /> Active Positions
            </h3>
            
            {positions.length === 0 ? (
              <div className="text-center py-10 text-cy-text-muted font-mono border border-dashed border-cy-border/50 rounded-lg">
                No active positions. The future is unwritten.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-cy-border/50 text-cy-text-muted text-xs font-mono uppercase tracking-wider">
                      <th className="pb-4 pr-4 font-normal">Market</th>
                      <th className="pb-4 px-4 font-normal">Outcome</th>
                      <th className="pb-4 px-4 font-normal">Shares</th>
                      <th className="pb-4 px-4 font-normal">Avg Price</th>
                      <th className="pb-4 pl-4 font-normal text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((pos) => (
                      <tr key={pos.id} className="border-b border-cy-border/20 last:border-0 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => navigate(`/market/${pos.marketId}`)}>
                        <td className="py-4 pr-4">
                          <p className="text-sm font-display text-white line-clamp-1">{pos.marketTitle}</p>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono ${pos.outcome === 'Yes' ? 'bg-cy-yes/20 text-cy-yes border border-cy-yes/30' : 'bg-cy-no/20 text-cy-no border border-cy-no/30'}`}>
                            {pos.outcome}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm font-mono text-gray-300">{pos.shares.toFixed(2)}</td>
                        <td className="py-4 px-4 text-sm font-mono text-gray-300">{Math.round(pos.averagePrice * 100)}¢</td>
                        <td className="py-4 pl-4 text-sm font-mono text-cy-accent-cyan text-right">{(pos.shares * pos.averagePrice).toFixed(2)} Cr</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Claim Winnings & History */}
        <div className="space-y-6">
          <GlassCard className="border-cy-accent-purple/30 bg-cy-accent-purple/5">
            <h3 className="text-lg font-display text-white mb-4 flex items-center gap-2">
              <Award className="text-cy-accent-purple" size={18} /> Resolvable Markets
            </h3>
            <p className="text-sm text-cy-text-muted mb-4 font-mono">No winnings available to claim at this time.</p>
            <button className="w-full py-2 bg-black/40 border border-cy-border text-cy-text-muted text-sm font-mono rounded cursor-not-allowed uppercase">
              Claim All
            </button>
          </GlassCard>

          <GlassCard>
            <h3 className="text-lg font-display text-white mb-4">Recent Transmissions</h3>
            {history.length === 0 ? (
              <p className="text-sm text-cy-text-muted font-mono text-center py-4">No logged history.</p>
            ) : (
              <div className="space-y-4">
                 {history.slice(0, 5).map(trx => (
                   <div key={trx.id} className="flex justify-between items-center text-sm font-mono border-b border-cy-border/30 pb-3 last:border-0 last:pb-0">
                     <div>
                       <div className="text-white">Bought {trx.outcome}</div>
                       <div className="text-xs text-cy-text-muted">{new Date(trx.timestamp).toLocaleTimeString()}</div>
                     </div>
                     <div className="text-cy-no">-{trx.amount.toFixed(2)} Cr</div>
                   </div>
                 ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
