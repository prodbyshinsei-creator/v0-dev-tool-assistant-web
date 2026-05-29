import type { Metadata } from 'next';
import './globals.css';
import { SolanaWalletProvider } from '@/components/wallet-provider';

export const metadata: Metadata = {
  title: 'DEV TOOL ASSISTANT',
  description: 'Advanced Solana Dev Tools',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SolanaWalletProvider>
          {children}
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
