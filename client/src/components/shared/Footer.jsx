// src/components/shared/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-cy-border/30 py-6 mt-auto bg-black/50 z-50">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-cy-text-muted">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cy-yes animate-glow-pulse shadow-glow-cyan"></div>
          <span>Status: Operational</span>
        </div>
        <div className="flex gap-6">
          <Link to="/markets" className="hover:text-white transition-colors">Markets</Link>
          <Link to="/portfolio" className="hover:text-white transition-colors">Portfolio</Link>
          <a href="mailto:contact@nexus.markets" className="hover:text-white transition-colors">Contact</a>
        </div>
        <span className="uppercase tracking-widest text-[#B026FF]">Mock Network: Zeta-Testnet | v2.0.26</span>
      </div>
    </footer>
  );
}
