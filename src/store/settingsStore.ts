'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BetDisplayUnit = 'BB' | 'CHIPS';

export const FELT_COLOR_PRESETS = [
  { key: 'green', label: 'Verde classico', value: '#0b4d3a' },
  { key: 'blue', label: 'Blu notte', value: '#1e3a5f' },
  { key: 'bordeaux', label: 'Bordeaux', value: '#5a1f2a' },
  { key: 'black', label: 'Nero', value: '#1c1c1c' },
  { key: 'purple', label: 'Viola', value: '#3b2a5c' },
] as const;

interface SettingsState {
  soundEnabled: boolean;
  betDisplayUnit: BetDisplayUnit;
  feltColor: string;
  showOpponentRanges: boolean;
  toggleSound: () => void;
  setBetDisplayUnit: (unit: BetDisplayUnit) => void;
  setFeltColor: (color: string) => void;
  toggleShowOpponentRanges: () => void;
}

// skipHydration avoids an SSR/client mismatch: the store starts with these
// defaults on both server and first client render, then a <SettingsHydrator>
// (mounted once in the root layout) rehydrates from localStorage in an
// effect, which is a normal post-mount state update rather than a hydration
// error (see the toLocaleString hydration bug fixed earlier in this project).
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      betDisplayUnit: 'CHIPS',
      feltColor: FELT_COLOR_PRESETS[0].value,
      showOpponentRanges: true,
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      setBetDisplayUnit: (unit) => set({ betDisplayUnit: unit }),
      setFeltColor: (color) => set({ feltColor: color }),
      toggleShowOpponentRanges: () => set((s) => ({ showOpponentRanges: !s.showOpponentRanges })),
    }),
    { name: 'poker-settings', skipHydration: true },
  ),
);
