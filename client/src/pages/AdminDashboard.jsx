// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { useAdminStore } from "../store/useAdminStore";
import { useUserStore } from "../store/useUserStore";
import { GlassCard } from "../components/shared/GlassCard";
import { GlowButton } from "../components/shared/GlowButton";
import { backendMarketService } from "../services/api";
import { toast } from "sonner";
import {
  ShieldAlert,
  Database,
  Users,
  Search,
  X,
  RefreshCw,
  Activity,
} from "lucide-react";

export function AdminDashboard() {
  const {
    pendingMarkets,
    fetchPendingMarkets,
    approveMarket,
    rejectMarket,
    isLoading,
    error,
  } = useAdminStore();
  const { isAdmin } = useUserStore();
  const [scripts, setScripts] = useState({});

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [activeMarkets, setActiveMarkets] = useState([]);
  const [isLoadingActive, setIsLoadingActive] = useState(false);
  const [activeMarketsError, setActiveMarketsError] = useState(null);
  const [resolvingId, setResolvingId] = useState(null);

  useEffect(() => {
    if (isAdmin) {
      fetchPendingMarkets();
      loadUsers();
      loadActiveMarkets();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const data = await backendMarketService.getAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadActiveMarkets = async () => {
    setIsLoadingActive(true);
    setActiveMarketsError(null);
    try {
      const data = await backendMarketService.getActiveMarketsAdmin();
      setActiveMarkets(data);
    } catch (err) {
      console.error("Failed to load active markets:", err);
      const msg = err.message || "Failed to load active markets";
      setActiveMarketsError(msg);
      toast.error("Active markets: " + msg);
    } finally {
      setIsLoadingActive(false);
    }
  };

  const handleApprove = async (market) => {
    try {
      const script = scripts[market.id] || "";
      await approveMarket(market.id, script);
      toast.success("Market Approved & Deployed");
    } catch (err) {
      toast.error("Deploy failed: " + err.message);
    }
  };

  const handleReject = async (market) => {
    try {
      await rejectMarket(market.id);
      toast.success("Market Rejected");
    } catch (err) {
      toast.error("Reject failed: " + err.message);
    }
  };

  const handleResolve = async (market, outcome) => {
    setResolvingId(market.id + outcome);
    try {
      await backendMarketService.resolveMarket(market.id, outcome);
      toast.success('Market "' + market.title + '" resolved as ' + outcome);
      setActiveMarkets((prev) => prev.filter((m) => m.id !== market.id));
    } catch (err) {
      toast.error("Failed to resolve: " + err.message);
    } finally {
      setResolvingId(null);
    }
  };

  const handleUserClick = async (user) => {
    setSelectedUser(user);
    try {
      const data = await backendMarketService.getAdminUserDetail(user.user_id);
      setSelectedUserData(data);
    } catch (err) {
      console.error("Failed to load user detail:", err);
      setSelectedUserData(null);
    }
  };

  const filteredUsers = users.filter((u) =>
    (u.username || u.email || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  if (!isAdmin) {
    return (
      <div className="text-center py-20 text-cy-text-muted font-mono">
        Access denied. Admin privileges required.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {selectedUser && selectedUserData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <GlassCard className="w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setSelectedUser(null);
                setSelectedUserData(null);
              }}
              className="absolute top-4 right-4 text-cy-text-muted hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-display text-white mb-4 flex items-center gap-2">
              <Users size={20} className="text-cy-accent-cyan" />{" "}
              {selectedUserData.user.username || selectedUserData.user.email}{" "}
              Snapshot
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-black/30 p-4 rounded border border-cy-border/50">
                <div className="text-xs text-cy-text-muted uppercase font-mono tracking-wider mb-1">
                  Total Balance
                </div>
                <div className="text-2xl text-cy-accent-cyan font-mono">
                  {parseFloat(selectedUserData.user.balance).toLocaleString(
                    undefined,
                    { maximumFractionDigits: 2 },
                  )}{" "}
                  Cr
                </div>
              </div>
              <div className="bg-black/30 p-4 rounded border border-cy-border/50">
                <div className="text-xs text-cy-text-muted uppercase font-mono tracking-wider mb-1">
                  Active Positions
                </div>
                <div className="text-2xl text-white font-mono">
                  {selectedUserData.positions.length}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-mono text-cy-accent-cyan uppercase tracking-wider mb-3">
                  Current Portfolio
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {selectedUserData.positions.length === 0 ? (
                    <div className="text-xs font-mono text-cy-text-muted p-4 text-center border border-dashed border-cy-border/30 rounded">
                      No active positions.
                    </div>
                  ) : (
                    selectedUserData.positions.map((pos) => (
                      <div
                        key={pos.position_id}
                        className="bg-black/20 p-3 rounded text-sm font-mono border border-cy-border/20"
                      >
                        <div className="text-white text-xs mb-1 line-clamp-1">
                          {pos.market_title}
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span
                            className={
                              pos.outcome === "YES"
                                ? "text-cy-yes font-bold"
                                : "text-cy-no font-bold"
                            }
                          >
                            {pos.outcome}
                          </span>
                          <span className="text-cy-text-muted">
                            {parseFloat(pos.shares).toFixed(2)} Shares @{" "}
                            {Math.round(parseFloat(pos.avg_price) * 100)}¢
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-mono text-cy-text-muted uppercase tracking-wider mb-3">
                  Recent Transactions
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {selectedUserData.history.length === 0 ? (
                    <div className="text-xs font-mono text-cy-text-muted p-4 text-center border border-dashed border-cy-border/30 rounded">
                      No transactions found.
                    </div>
                  ) : (
                    selectedUserData.history.map((tx) => (
                      <div
                        key={tx.txn_id}
                        className="flex justify-between items-center bg-black/20 p-3 rounded text-sm font-mono border border-cy-border/20"
                      >
                        <div className="overflow-hidden mr-2">
                          <div className="text-white text-xs whitespace-nowrap">
                            {tx.type} {tx.outcome}
                          </div>
                          <div className="text-[10px] text-cy-text-muted truncate">
                            {tx.market_title}
                          </div>
                        </div>
                        <div
                          className={
                            tx.type === "BUY"
                              ? "text-cy-no whitespace-nowrap"
                              : "text-cy-yes whitespace-nowrap"
                          }
                        >
                          {tx.type === "BUY" ? "-" : "+"}
                          {parseFloat(tx.amount_credits).toLocaleString(
                            undefined,
                            { maximumFractionDigits: 2 },
                          )}{" "}
                          Cr
                        </div>
                      </div>
                    ))
                  )}
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
        <p className="text-cy-text-muted font-mono text-sm">
          System oversight and Oracle dispute resolution.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <GlassCard>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-display text-white flex items-center gap-2">
                <Database className="text-cy-accent-cyan" size={20} /> Pending
                Market Approvals
              </h3>
              <button
                onClick={fetchPendingMarkets}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-xs font-mono text-cy-text-muted hover:text-cy-accent-cyan transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  size={13}
                  className={isLoading ? "animate-spin" : ""}
                />
                {isLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {error ? (
              <div className="text-center py-10 text-cy-no font-mono border border-dashed border-cy-no/40 rounded-lg text-sm">
                ⚠ {error}
              </div>
            ) : isLoading ? (
              <div className="text-center py-10 text-cy-text-muted font-mono border border-dashed border-cy-border/50 rounded-lg">
                Loading markets...
              </div>
            ) : pendingMarkets.length === 0 ? (
              <div className="text-center py-10 text-cy-text-muted font-mono border border-dashed border-cy-border/50 rounded-lg">
                No markets awaiting approval.
              </div>
            ) : (
              <div className="space-y-6">
                {pendingMarkets.map((market) => (
                  <div
                    key={market.id}
                    className="border border-cy-border/40 p-4 rounded-lg bg-black/30"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-white font-display text-xl">
                        {market.title}
                      </h4>
                      <span className="text-xs font-mono uppercase bg-cy-no/20 text-cy-no px-2 py-1 rounded">
                        Awaiting
                      </span>
                    </div>
                    <p className="text-sm text-cy-text-muted font-mono mb-2 leading-relaxed">
                      {market.description}
                    </p>
                    {market.creatorEmail && (
                      <p className="text-[10px] text-cy-text-muted font-mono mb-4">
                        Proposed by:{" "}
                        {market.creatorUsername || market.creatorEmail}
                      </p>
                    )}

                    <div className="mb-4">
                      <label className="block text-[10px] text-cy-accent-cyan uppercase tracking-widest font-mono mb-2">
                        Oracle Resolution Script
                      </label>
                      <textarea
                        className="w-full bg-black/50 border border-cy-border rounded-lg p-3 text-cy-accent-cyan font-mono text-sm flex tracking-tight focus:outline-none focus:border-cy-accent-purple"
                        rows={3}
                        placeholder="Write fetch() logic for Oracle..."
                        value={scripts[market.id] || ""}
                        onChange={(e) =>
                          setScripts({
                            ...scripts,
                            [market.id]: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="flex gap-4">
                      <GlowButton
                        variant="success"
                        className="py-2 px-6 text-sm"
                        onClick={() => handleApprove(market)}
                      >
                        Approve & Deploy
                      </GlowButton>
                      <GlowButton
                        variant="danger"
                        className="py-2 px-6 text-sm"
                        onClick={() => handleReject(market)}
                      >
                        Reject
                      </GlowButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          <GlassCard>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-display text-white flex items-center gap-2">
                <Activity className="text-cy-yes" size={20} /> Active Markets
              </h3>
              <button
                onClick={loadActiveMarkets}
                disabled={isLoadingActive}
                className="flex items-center gap-1.5 text-xs font-mono text-cy-text-muted hover:text-cy-accent-cyan transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  size={13}
                  className={isLoadingActive ? "animate-spin" : ""}
                />
                {isLoadingActive ? "Loading..." : "Refresh"}
              </button>
            </div>

            {isLoadingActive ? (
              <div className="text-center py-8 text-cy-text-muted font-mono text-sm">
                Loading active markets...
              </div>
            ) : activeMarketsError ? (
              <div className="text-center py-8 font-mono border border-dashed border-cy-no/40 rounded-lg text-sm space-y-3">
                <div className="text-cy-no">⚠ {activeMarketsError}</div>
                <button
                  onClick={loadActiveMarkets}
                  className="text-xs text-cy-accent-cyan hover:underline font-mono"
                >
                  Try again
                </button>
              </div>
            ) : activeMarkets.length === 0 ? (
              <div className="text-center py-8 text-cy-text-muted font-mono border border-dashed border-cy-border/50 rounded-lg text-sm">
                No active markets found.
              </div>
            ) : (
              <div className="space-y-4">
                {activeMarkets.map((market) => (
                  <div
                    key={market.id}
                    className="border border-cy-border/40 p-4 rounded-lg bg-black/30"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-white font-display text-base flex-1 mr-4">
                        {market.title}
                      </h4>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono text-cy-yes">
                          {Math.round(market.yesPrice * 100)}¢ YES
                        </span>
                        <span className="text-xs font-mono text-cy-no">
                          {Math.round(market.noPrice * 100)}¢ NO
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-mono text-cy-text-muted uppercase">
                        {market.category}
                      </span>
                      {market.resolutionDate && (
                        <span className="text-[10px] font-mono text-cy-text-muted">
                          · Ends{" "}
                          {new Date(market.resolutionDate).toLocaleDateString()}
                        </span>
                      )}
                      {market.resolutionScript && (
                        <span className="text-[10px] font-mono text-cy-accent-purple">
                          · Auto-script set
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <GlowButton
                        variant="success"
                        className="py-1.5 px-5 text-xs"
                        onClick={() => handleResolve(market, "YES")}
                        disabled={resolvingId === market.id + "YES"}
                      >
                        {resolvingId === market.id + "YES"
                          ? "Resolving..."
                          : "Resolve YES"}
                      </GlowButton>
                      <GlowButton
                        variant="danger"
                        className="py-1.5 px-5 text-xs"
                        onClick={() => handleResolve(market, "NO")}
                        disabled={resolvingId === market.id + "NO"}
                      >
                        {resolvingId === market.id + "NO"
                          ? "Resolving..."
                          : "Resolve NO"}
                      </GlowButton>
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
                <Users className="text-cy-accent-purple" size={20} /> User
                Management
              </h3>
            </div>

            <div className="relative mb-4">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-cy-text-muted"
              />
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
                  {isLoadingUsers ? (
                    <tr>
                      <td
                        colSpan={2}
                        className="p-4 text-center text-xs font-mono text-cy-text-muted"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={2}
                        className="p-4 text-center text-xs font-mono text-cy-text-muted"
                      >
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr
                        key={user.user_id}
                        onClick={() => handleUserClick(user)}
                        className="border-b border-cy-border/20 last:border-0 hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <td className="p-3">
                          <div className="text-sm text-white font-mono">
                            {user.username || user.email}
                          </div>
                          <div className="text-[10px] text-cy-text-muted font-mono">
                            {user.active_positions || 0} positions
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="text-cy-accent-cyan font-mono text-sm">
                            {parseFloat(user.balance).toLocaleString(
                              undefined,
                              { maximumFractionDigits: 2 },
                            )}{" "}
                            Cr
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
