// src/pages/AdminDashboard.jsx
import React, { useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { useUserStore } from '../store/useUserStore';
import { GlassCard } from '../components/shared/GlassCard';
import { GlowButton } from '../components/shared/GlowButton';
import { marketService } from '../services/mockApi';
import { toast } from 'sonner';
import { ShieldAlert, Database, Users, Search, X } from 'lucide-react';

export function AdminDashboard() {
  const { pendingMarkets, removePendingMarket } = useAdminStore();
  const { balance, positions, history } = useUserStore();
  const [scripts, setScripts] = useState({});
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleApprove = async (market) => {
    try {
      const script = scripts[market.id] || `fetch("${market.resolutionSource}").then(res => res.ok ? "YES" : "NO")`;
      await marketService.createMarket({
        ...market,
        resolutionScript: script,
      });
      removePendingMarket(market.id);
      toast.success('Market Approved & Deployed');
    } catch (err) {
      toast.error('Deploy failed');
    }
  };

  const mockUsers = [
    { 
      id: 'usr_01', 
      handle: 'Agent_Alpha (You)', 
      totalBalance: balance, 
      activePositions: positions.length, 
      history: history,
      positions: positions
    },
    { 
      id: 'usr_02', 
      handle: 'Morpheus', 
      totalBalance: 4200, 
      activePositions: 1, 
      history: [{id: 3, type: 'Buy No', market: 'AGI 2027', amount: -2000}],
      positions: [{ id: 'pos_02', marketTitle: 'AGI 2027', outcome: 'No', shares: 50, averagePrice: 0.4 }]
    },
    { 
      id: 'usr_03', 
      handle: 'Trinity', 
      totalBalance: 18900, 
      activePositions: 0, 
      history: [],
      positions: []
    },
  ];

  const filteredUsers = mockUsers.filter(u => u.handle.toLowerCase().includes(searchQuery.toLowerCase()));

  // Active sync for selected user
  const activeUserView = selectedUser ? mockUsers.find(u => u.id === selectedUser.id) : null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {activeUserView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <GlassCard className="w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 text-cy-text-muted hover:text-white transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-display text-white mb-4 flex items-center gap-2"><Users size={20} className="text-cy-accent-cyan"/> {activeUserView.handle} Snapshot</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
               <div className="bg-black/30 p-4 rounded border border-cy-border/50">
                 <div className="text-xs text-cy-text-muted uppercase font-mono tracking-wider mb-1">Total Balance</div>
                 <div className="text-2xl text-cy-accent-cyan font-mono">{activeUserView.totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} Cr</div>
               </div>
               <div className="bg-black/30 p-4 rounded border border-cy-border/50">
                 <div className="text-xs text-cy-text-muted uppercase font-mono tracking-wider mb-1">Active Positions</div>
                 <div className="text-2xl text-white font-mono">{activeUserView.activePositions}</div>
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-mono text-cy-accent-cyan uppercase tracking-wider mb-3">Current Portfolio</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {activeUserView.positions.length === 0 ? (
                    <div className="text-xs font-mono text-cy-text-muted p-4 text-center border border-dashed border-cy-border/30 rounded">No active positions.</div>
                  ) : activeUserView.positions.map(pos => (
                    <div key={pos.id} className="bg-black/20 p-3 rounded text-sm font-mono border border-cy-border/20">
                      <div className="text-white text-xs mb-1 line-clamp-1">{pos.marketTitle}</div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className={pos.outcome === 'Yes' ? "text-cy-yes font-bold" : "text-cy-no font-bold"}>{pos.outcome}</span>
                        <span className="text-cy-text-muted">{pos.shares.toFixed(2)} Shares @ {Math.round(pos.averagePrice * 100)}¢</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-mono text-cy-text-muted uppercase tracking-wider mb-3">Recent Transactions</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {activeUserView.history.length === 0 ? (
                    <div className="text-xs font-mono text-cy-text-muted p-4 text-center border border-dashed border-cy-border/30 rounded">No transactions found.</div>
                  ) : activeUserView.history.map(tx => (
                    <div key={tx.id} className="flex justify-between items-center bg-black/20 p-3 rounded text-sm font-mono border border-cy-border/20">
                       <div className="overflow-hidden mr-2">
                         <div className="text-white text-xs whitespace-nowrap">{tx.type}</div>
                         <div className="text-[10px] text-cy-text-muted truncate">{tx.market || tx.marketId}</div>
                       </div>
                       <div className={tx.amount > 0 ? "text-cy-yes whitespace-nowrap" : "text-cy-no whitespace-nowrap"}>{tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} Cr</div>
                     </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
          <ShieldAlert className="text-cy-no" size={28} /> Admin Protocol
        </h1>
        <p className="text-cy-text-muted font-mono text-sm">System oversight and Oracle dispute resolution.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <GlassCard>
            <h3 className="text-xl font-display text-white mb-6 flex items-center gap-2">
              <Database className="text-cy-accent-cyan" size={20} /> Pending Market Approvals
            </h3>
            
            {pendingMarkets.length === 0 ? (
              <div className="text-center py-10 text-cy-text-muted font-mono border border-dashed border-cy-border/50 rounded-lg">
                No markets awaiting approval.
              </div>
            ) : (
              <div className="space-y-6">
                {pendingMarkets.map(market => (
                  <div key={market.id} className="border border-cy-border/40 p-4 rounded-lg bg-black/30">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-white font-display text-xl">{market.title}</h4>
                      <span className="text-xs font-mono uppercase bg-cy-no/20 text-cy-no px-2 py-1 rounded">Awaiting</span>
                    </div>
                    <p className="text-sm text-cy-text-muted font-mono mb-4 leading-relaxed">{market.description}</p>
                    
                    <div className="mb-4">
                      <label className="block text-[10px] text-cy-accent-cyan uppercase tracking-widest font-mono mb-2">Oracle Resolution Script</label>
                      <textarea
                        className="w-full bg-black/50 border border-cy-border rounded-lg p-3 text-cy-accent-cyan font-mono text-sm flex tracking-tight focus:outline-none focus:border-cy-accent-purple"
                        rows={3}
                        placeholder="Write fetch() logic for Oracle..."
                        value={scripts[market.id] || ''}
                        onChange={(e) => setScripts({ ...scripts, [market.id]: e.target.value })}
                      />
                    </div>
                    
                    <div className="flex gap-4">
                      <GlowButton variant="success" className="py-2 px-6 text-sm" onClick={() => handleApprove(market)}>Approve & Deploy</GlowButton>
                      <GlowButton variant="danger" className="py-2 px-6 text-sm" onClick={() => {
                        removePendingMarket(market.id);
                        toast.success('Market Rejected');
                      }}>Reject</GlowButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-display text-white flex items-center gap-2">
                <Users className="text-cy-accent-purple" size={20} /> User Management
              </h3>
            </div>
            
            <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cy-text-muted" />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/50 border border-cy-border rounded-lg pl-9 pr-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-cy-accent-cyan"
              />
            </div>

            <div className="overflow-hidden rounded-lg border border-cy-border/50 bg-cy-surface backdrop-blur-md">
              <table className="w-full text-left">
                <thead className="bg-black/40 border-b border-cy-border/50">
                  <tr className="text-[10px] text-cy-text-muted font-mono uppercase tracking-wider">
                    <th className="p-3 font-normal">Handle</th>
                    <th className="p-3 font-normal text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="p-4 text-center text-xs font-mono text-cy-text-muted">No users found.</td>
                    </tr>
                  ) : filteredUsers.map(user => (
                    <tr 
                      key={user.id} 
                      onClick={() => setSelectedUser(user)}
                      className="border-b border-cy-border/20 last:border-0 hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <td className="p-3">
                        <div className="text-sm text-white font-mono">{user.handle}</div>
                        <div className="text-[10px] text-cy-text-muted font-mono">{user.activePositions} positions</div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="text-cy-accent-cyan font-mono text-sm">{user.totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} Cr</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
