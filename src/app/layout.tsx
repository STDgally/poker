import type { Metadata } from 'next';
import './globals.css';
import { SettingsHydrator } from '@/components/SettingsHydrator';
import { AccessibilityApplier } from '@/components/AccessibilityApplier';

export const metadata: Metadata = {
  title: 'Poker Simulator & Analytics',
  description: 'Texas Hold\'em offline trainer against AI bots, with hand-history analytics.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100">
        <SettingsHydrator />
        <AccessibilityApplier />
        {children}
      </body>
    </html>
  );
}
