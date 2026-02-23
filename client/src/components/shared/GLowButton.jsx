// src/components/shared/GlowButton.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function GlowButton({ variant = 'cyan', children, className, disabled, onClick, type = "button" }) {
  const baseClasses = "relative overflow-hidden font-mono uppercase tracking-wider text-sm px-6 py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2";
  
  const variants = {
    cyan: "bg-cy-surface border border-cy-accent-cyan text-cy-accent-cyan hover:bg-cy-accent-cyan/10 hover:shadow-glow-cyan",
    purple: "bg-cy-surface border border-cy-accent-purple text-cy-accent-purple hover:bg-cy-accent-purple/10 hover:shadow-glow-purple",
    outline: "border border-cy-border text-cy-text-primary hover:bg-white/5",
    danger: "bg-cy-surface border border-cy-no text-cy-no hover:bg-cy-no/10 focus:ring-1 focus:ring-cy-no",
    success: "bg-cy-surface border border-cy-yes text-cy-yes hover:bg-cy-yes/10 focus:ring-1 focus:ring-cy-yes"
  };

  return (
    <motion.button
      type={type}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={cn(baseClasses, variants[variant], disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:shadow-none", className)}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
}
