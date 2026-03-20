// src/pages/Login.jsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';
import { GlassCard } from '../components/shared/GlassCard';
import { GlowButton } from '../components/shared/GlowButton';
import { toast } from 'sonner';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Must be at least 6 characters")
});

export function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });
  const login = useUserStore(state => state.login);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    await login(data);
    toast.success('Access Granted. Welcome back, User.');
    navigate('/markets');
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <GlassCard className="p-8">
        <h2 className="text-2xl font-display text-white mb-2">Initialize Session</h2>
        <p className="text-xs font-mono text-cy-text-muted mb-6">Authenticate to access your portfolio.</p>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input 
              {...register("email")} 
              placeholder="Email" 
              className="w-full bg-black/50 border border-cy-border rounded py-3 px-4 text-white font-mono focus:outline-none focus:border-cy-accent-cyan transition-colors" 
            />
            {errors.email && <span className="text-cy-no text-xs font-mono mt-1 block">{errors.email.message}</span>}
          </div>
          <div>
            <input 
              {...register("password")} 
              type="password" 
              placeholder="Password" 
              className="w-full bg-black/50 border border-cy-border rounded py-3 px-4 text-white font-mono focus:outline-none focus:border-cy-accent-cyan transition-colors" 
            />
            {errors.password && <span className="text-cy-no text-xs font-mono mt-1 block">{errors.password.message}</span>}
          </div>
          <GlowButton variant="cyan" type="submit" className="w-full py-3" disabled={isSubmitting}>
            {isSubmitting ? 'Authenticating...' : 'Login'}
          </GlowButton>
        </form>
        <div className="mt-4 text-center text-xs font-mono text-cy-text-muted">
          Don't have an account? <Link to="/register" className="text-cy-accent-cyan hover:underline">Register here</Link>.
        </div>
      </GlassCard>
    </div>
  );
}
