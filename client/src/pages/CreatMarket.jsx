// src/pages/CreateMarket.jsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/shared/GlassCard';
import { GlowButton } from '../components/shared/GlowButton';
import { marketService } from '../services/mockApi';
import { toast } from 'sonner';

const schema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(100),
  category: z.enum(['Crypto', 'Tech', 'Politics', 'Science']),
  description: z.string().min(20, 'Provide a clear resolution description'),
  resolutionSource: z.string().min(3, 'Required'),
  resolutionDate: z.string().min(1, 'Required'),
  initialProbability: z.number().min(0.01).max(0.99)
});

export function CreateMarket() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      category: 'Tech',
      initialProbability: 0.5
    }
  });

  const onSubmit = async (data) => {
    try {
      const newMarket = await marketService.createMarket(data);
      toast.success('Market Synced to Network');
      navigate(`/market/${newMarket.id}`);
    } catch (err) {
      toast.error('Failed to create market');
    }
  };

  const InputField = ({ label, name, type = "text", ...props }) => (
    <div className="mb-4">
      <label className="block text-xs font-mono uppercase text-cy-text-muted mb-2">{label}</label>
      <input
        type={type}
        {...register(name, { valueAsNumber: type === 'number' })}
        className={`w-full bg-black/50 border ${errors[name] ? 'border-cy-no' : 'border-cy-border'} rounded-lg py-3 px-4 text-white font-mono focus:outline-none focus:border-cy-accent-cyan transition-colors placeholder:text-cy-text-muted/50`}
        {...props}
      />
      {errors[name] && <span className="text-cy-no text-xs mt-1 block font-mono">{errors[name].message}</span>}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-display font-bold text-white mb-2">Propose Market</h1>
      <p className="text-cy-text-muted font-mono mb-8 text-sm">Deploy an oracle contract for a future event.</p>

      <GlassCard className="p-8 border-cy-accent-purple/30">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <InputField label="Market Title" name="title" placeholder="Will SpaceX land on Mars by 2028?" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-xs font-mono uppercase text-cy-text-muted mb-2">Category</label>
              <select 
                {...register("category")}
                className="w-full bg-black/50 border border-cy-border rounded-lg py-3 px-4 text-white font-mono focus:outline-none focus:border-cy-accent-cyan appearance-none"
              >
                <option value="Tech">Tech</option>
                <option value="Crypto">Crypto</option>
                <option value="Politics">Politics</option>
                <option value="Science">Science</option>
              </select>
            </div>
            
            <InputField label="Resolution Date" name="resolutionDate" type="date" />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-mono uppercase text-cy-text-muted mb-2">Description / Rules</label>
            <textarea
              {...register("description")}
              rows={4}
              className="w-full bg-black/50 border border-cy-border rounded-lg py-3 px-4 text-white font-mono focus:outline-none focus:border-cy-accent-cyan resize-none"
              placeholder="Resolves to YES if..."
            />
            {errors.description && <span className="text-cy-no text-xs mt-1 block font-mono">{errors.description.message}</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Resolution Source URL" name="resolutionSource" placeholder="bloomberg.com/..." />
            <InputField label="Initial Prob. (0.01 - 0.99)" name="initialProbability" type="number" step="0.01" />
          </div>

          <div className="pt-4 border-t border-cy-border/50">
            <GlowButton variant="purple" type="submit" className="w-full py-4 text-base" disabled={isSubmitting}>
               {isSubmitting ? 'Syncing...' : 'Deploy Market'}
            </GlowButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
