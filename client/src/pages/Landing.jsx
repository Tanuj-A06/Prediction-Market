// src/pages/Landing.jsx
import React from 'react';
import { GlowButton } from '../components/shared/GlowButton';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6">
          The <span className="text-cy-accent-cyan">Future</span> is Immutable.
        </h1>
        <p className="text-lg text-cy-text-muted font-mono max-w-2xl mx-auto mb-8">
          Welcome to Nexus Markets. Trade on the outcomes of global events, technological breakthroughs, and politics. Powered by the Zeta-Testnet.
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <GlowButton variant="cyan" onClick={() => navigate('/markets')} className="px-8 py-4 text-lg">
            Get Started
          </GlowButton>
          <GlowButton variant="outline" onClick={() => navigate('/login')} className="px-8 py-4 text-lg">
            Login
          </GlowButton>
        </div>
      </motion.div>
      <div className="mt-20 max-w-4xl mx-auto text-left">
        <h3 className="text-xl font-display text-white mb-4">About Us</h3>
        <p className="text-sm text-cy-text-muted font-mono leading-relaxed">
          Nexus Markets is a futuristic Prediction Market simulator. While all markets and credits are simulated, it offers realistic order-entry interfaces, latency simulation, and portfolio management. Built for strict Cyber-Glass aesthetic exploration.
        </p>
      </div>
    </div>
  );
}
