'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ToolCardProps {
  title: string;
  description: string;
  imageUrl: string;
  variant: 'vamp' | 'volume' | 'wallet';
  onClick: () => void;
}

const variantStyles = {
  vamp: {
    base: 'border-vamp-red/30 hover:border-vamp-red/60',
    glow: 'hover:shadow-[0_0_30px_rgba(220,38,38,0.15)]',
    imageGlow: 'drop-shadow-[0_0_8px_rgba(220,38,38,0.6)]',
    title: 'text-vamp-red',
  },
  volume: {
    base: 'border-volume-blue/30 hover:border-volume-blue/60',
    glow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]',
    imageGlow: 'drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]',
    title: 'text-volume-blue',
  },
  wallet: {
    base: 'border-wallet-green/30 hover:border-wallet-green/60',
    glow: 'hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]',
    imageGlow: 'drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]',
    title: 'text-wallet-green',
  },
};

export function ToolCard({ title, description, imageUrl, variant, onClick }: ToolCardProps) {
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
            'relative w-16 h-16 md:w-20 md:h-20 transition-all duration-300',
            'group-hover:scale-110'
          )}
        >
          <Image
            src={imageUrl}
            alt={title}
            fill
            className={cn(
              'object-contain transition-all duration-300',
              'group-hover:' + styles.imageGlow
            )}
            style={{
              filter: 'drop-shadow(0 0 0px transparent)',
            }}
            onMouseEnter={(e) => {
              const color = variant === 'vamp' ? 'rgba(220,38,38,0.6)' : 
                           variant === 'volume' ? 'rgba(59,130,246,0.6)' : 
                           'rgba(34,197,94,0.6)';
              e.currentTarget.style.filter = `drop-shadow(0 0 12px ${color})`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'drop-shadow(0 0 0px transparent)';
            }}
            unoptimized
          />
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
