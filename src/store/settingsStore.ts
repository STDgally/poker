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

export const UI_SCALE_PRESETS = [
  { key: 'normal', label: 'Normale', value: 1 },
  { key: 'large', label: 'Grande', value: 1.15 },
  { key: 'xlarge', label: 'Molto grande', value: 1.3 },
] as const;

/** Base "thinking" delay for bots, shared by poker and blackjack — each game
 * scales its own randomized range proportionally around this base value. */
export const BOT_DELAY_PRESETS = [
  { key: 'instant', label: 'Istantaneo', value: 150 },
  { key: 'fast', label: 'Veloce', value: 600 },
  { key: 'normal', label: 'Normale', value: 1000 },
  { key: 'slow', label: 'Lento', value: 1800 },
  { key: 'veryslow', label: 'Molto lento', value: 3000 },
] as const;

export interface BlackjackRuleSettings {
  numDecks: number;
  dealerHitsSoft17: boolean;
  blackjackPayout: number;
  doubleAfterSplit: boolean;
  lateSurrender: boolean;
  minBet: number;
  maxBet: number;
}

export const DEFAULT_BLACKJACK_RULE_SETTINGS: BlackjackRuleSettings = {
  numDecks: 6,
  dealerHitsSoft17: true,
  blackjackPayout: 1.5,
  doubleAfterSplit: true,
  lateSurrender: true,
  minBet: 5,
  maxBet: 500,
};

interface SettingsState {
  soundEnabled: boolean;
  betDisplayUnit: BetDisplayUnit;
  feltColor: string;
  showOpponentRanges: boolean;
  uiScale: number;
  highContrast: boolean;
  keyboardShortcutsEnabled: boolean;
  botDelayMs: number;
  blackjackRules: BlackjackRuleSettings;

  toggleSound: () => void;
  setBetDisplayUnit: (unit: BetDisplayUnit) => void;
  setFeltColor: (color: string) => void;
  toggleShowOpponentRanges: () => void;
  setUiScale: (scale: number) => void;
  toggleHighContrast: () => void;
  toggleKeyboardShortcuts: () => void;
  setBotDelayMs: (ms: number) => void;
  setBlackjackRule: <K extends keyof BlackjackRuleSettings>(key: K, value: BlackjackRuleSettings[K]) => void;
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
      uiScale: 1,
      highContrast: false,
      keyboardShortcutsEnabled: true,
      botDelayMs: 1000,
      blackjackRules: DEFAULT_BLACKJACK_RULE_SETTINGS,

      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      setBetDisplayUnit: (unit) => set({ betDisplayUnit: unit }),
      setFeltColor: (color) => set({ feltColor: color }),
      toggleShowOpponentRanges: () => set((s) => ({ showOpponentRanges: !s.showOpponentRanges })),
      setUiScale: (scale) => set({ uiScale: scale }),
      toggleHighContrast: () => set((s) => ({ highContrast: !s.highContrast })),
      toggleKeyboardShortcuts: () => set((s) => ({ keyboardShortcutsEnabled: !s.keyboardShortcutsEnabled })),
      setBotDelayMs: (ms) => set({ botDelayMs: ms }),
      setBlackjackRule: (key, value) => set((s) => ({ blackjackRules: { ...s.blackjackRules, [key]: value } })),
    }),
    { name: 'poker-settings', skipHydration: true },
  ),
);
