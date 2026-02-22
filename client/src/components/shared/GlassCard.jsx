// src/components/shared/GlassCard.jsx
import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export function GlassCard({ children, className, hoverGlow = false, ...props }) {
  return (
    <motion.div
      whileHover={hoverGlow ? { scale: 1.01, boxShadow: '0 0 15px -3px rgba(0, 240, 255, 0.15)' } : {}}
      className={cn(
        "bg-cy-surface border border-cy-border backdrop-blur-md rounded-xl p-5 transition-all",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
