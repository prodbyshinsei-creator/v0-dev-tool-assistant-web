'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  variant: 'vamp' | 'volume' | 'wallet';
  onClick: () => void;
}

const variantStyles = {
  vamp: {
    base: 'border-vamp-red/30 hover:border-vamp-red/60',
    glow: 'hover:shadow-[0_0_30px_rgba(220,38,38,0.15)]',
    icon: 'text-vamp-red group-hover:text-vamp-red-glow',
    title: 'text-vamp-red',
  },
  volume: {
    base: 'border-volume-blue/30 hover:border-volume-blue/60',
    glow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]',
    icon: 'text-volume-blue group-hover:text-volume-blue-glow',
    title: 'text-volume-blue',
  },
  wallet: {
    base: 'border-wallet-green/30 hover:border-wallet-green/60',
    glow: 'hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]',
    icon: 'text-wallet-green group-hover:text-wallet-green-glow',
    title: 'text-wallet-green',
  },
};

export function ToolCard({ title, description, icon: Icon, variant, onClick }: ToolCardProps) {
  const styles = variantStyles[variant];

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative w-full p-6 md:p-8 rounded-lg border bg-card transition-all duration-300 ease-out',
        'hover:scale-[1.02] active:scale-[0.98]',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background',
        styles.base,
        styles.glow
      )}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className={cn(
            'p-4 rounded-lg bg-secondary/50 transition-all duration-300',
            'group-hover:bg-secondary'
          )}
        >
          <Icon className={cn('w-10 h-10 md:w-12 md:h-12 transition-colors duration-300', styles.icon)} />
        </div>
        <div className="space-y-2">
          <h2 className={cn('text-xl md:text-2xl font-bold tracking-wide', styles.title)}>
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </button>
  );
}
