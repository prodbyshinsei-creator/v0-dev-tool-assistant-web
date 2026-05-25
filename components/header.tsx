'use client';

import { ArrowLeft, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  variant?: 'default' | 'vamp' | 'volume' | 'wallet';
}

const variantStyles = {
  default: 'text-foreground',
  vamp: 'text-vamp-red',
  volume: 'text-volume-blue',
  wallet: 'text-wallet-green',
};

export function Header({ title = 'DEV TOOL ASSISTANT', showBack, onBack, variant = 'default' }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="container flex h-14 items-center justify-center px-4">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="absolute left-4 hover:bg-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="sr-only">Go back</span>
          </Button>
        )}
        <div className="flex items-center gap-2">
          {variant === 'default' ? (
            <img src="/vamp-blood.png" alt="Blood Drop" className="w-8 h-8" />
          ) : (
            <Terminal className={cn('w-5 h-5', variantStyles[variant])} />
          )}
          <h1 className={cn('text-lg font-mono font-bold tracking-wider', variantStyles[variant])}>
            {title}
          </h1>
        </div>
      </div>
    </header>
  );
}
