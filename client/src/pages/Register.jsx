// src/pages/Register.jsx
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
  username: z.string().min(3, "User handle must be at least 3 chars"),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export function Register() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });
  const registerUser = useUserStore(state => state.register);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      await registerUser(data);
      toast.success('User profile created.');
      navigate('/markets');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <GlassCard className="p-8 border-cy-accent-purple/30">
        <h2 className="text-2xl font-display text-white mb-2">Create New Profile</h2>
        <p className="text-xs font-mono text-cy-text-muted mb-6">Create credentials to deploy into Nexus Markets.</p>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input 
              {...register("username")} 
              placeholder="User Handle" 
              className="w-full bg-black/50 border border-cy-border rounded py-3 px-4 text-white font-mono focus:outline-none focus:border-cy-accent-purple transition-colors" 
            />
            {errors.username && <span className="text-cy-no text-xs font-mono mt-1 block">{errors.username.message}</span>}
          </div>
          <div>
            <input 
              {...register("email")} 
              placeholder="Email" 
              className="w-full bg-black/50 border border-cy-border rounded py-3 px-4 text-white font-mono focus:outline-none focus:border-cy-accent-purple transition-colors" 
            />
            {errors.email && <span className="text-cy-no text-xs font-mono mt-1 block">{errors.email.message}</span>}
          </div>
          <div>
            <input 
              {...register("password")} 
              type="password" 
              placeholder="Password" 
              className="w-full bg-black/50 border border-cy-border rounded py-3 px-4 text-white font-mono focus:outline-none focus:border-cy-accent-purple transition-colors" 
            />
            {errors.password && <span className="text-cy-no text-xs font-mono mt-1 block">{errors.password.message}</span>}
          </div>
          <GlowButton variant="purple" type="submit" className="w-full py-3" disabled={isSubmitting}>
            {isSubmitting ? 'Synthesizing...' : 'Register'}
          </GlowButton>
        </form>
        <div className="mt-4 text-center text-xs font-mono text-cy-text-muted">
          Already registered? <Link to="/login" className="text-cy-accent-purple hover:underline">Login here</Link>.
        </div>
      </GlassCard>
    </div>
  );
}
