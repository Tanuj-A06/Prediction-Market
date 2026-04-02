// src/components/Layout.jsx
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Activity, LayoutDashboard, PlusCircle, Hexagon, ShieldAlert, LogOut } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { Toaster } from 'sonner';

import { Footer } from './shared/Footer';

export function Layout() {
  const { balance, isAuthenticated, logout, isAdmin } = useUserStore();
  const location = useLocation();

  const navLinks = isAuthenticated ? [
    { name: 'Markets', path: '/markets', icon: Activity },
    { name: 'Portfolio', path: '/portfolio', icon: LayoutDashboard },
    { name: 'Create', path: '/create', icon: PlusCircle },
    ...(isAdmin ? [{ name: 'Admin', path: '/admin', icon: ShieldAlert }] : [])
  ] : [
    { name: 'Markets', path: '/markets', icon: Activity },
    { name: 'Login', path: '/login', icon: LayoutDashboard },
    { name: 'Register', path: '/register', icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen bg-cy-bg text-cy-text-primary flex flex-col font-body selection:bg-cy-accent-cyan selection:text-black">
      <Toaster theme="dark" closeButton richColors toastOptions={{ style: { background: 'rgba(5,5,5,0.9)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' } }} />
      
      {/* Futuristic Header */}
      <header className="sticky top-0 z-50 border-b border-cy-border/30 bg-cy-bg/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 grid grid-cols-[1fr_auto_1fr] items-center">
          <div className="flex justify-start">
            <Link to="/" className="flex items-center gap-2 text-white hover:text-cy-accent-cyan transition-colors">
              <Hexagon size={24} className="text-cy-accent-cyan" />
              <span className="font-display font-bold tracking-widest uppercase hidden sm:block">Nexus Markets</span>
            </Link>
          </div>

          <div className="flex justify-center">
            <nav className="flex items-center gap-1 sm:gap-6 bg-black/40 px-4 py-1.5 rounded-full border border-cy-border/50">
              {navLinks.map(link => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center gap-2 text-sm font-mono uppercase px-3 py-1.5 rounded-full transition-all duration-300 ${
                      isActive 
                        ? 'text-cy-accent-cyan bg-cy-accent-cyan/10 shadow-glow-cyan' 
                        : 'text-cy-text-muted hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="hidden md:block">{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex justify-end items-center gap-4">
            {isAuthenticated ? (
              <>
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-[10px] text-cy-text-muted uppercase font-mono tracking-widest">Balance</span>
                  <span className="text-sm font-mono text-cy-accent-cyan">{balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} Cr</span>
                </div>
                <button 
                  onClick={logout} 
                  title="Logout" 
                  className="cursor-pointer h-8 w-8 rounded-full border border-cy-border flex items-center justify-center transition-all duration-300 bg-black/50 text-cy-text-muted hover:text-cy-accent-cyan hover:border-cy-accent-cyan hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                >
                   <LogOut size={14} />
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
