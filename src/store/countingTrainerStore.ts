'use client';

import { create } from 'zustand';
import { Card } from '@/lib/blackjack/types';
import { createShoe } from '@/lib/blackjack/shoe';
import { CountingSystemKey, getCountingSystem } from '@/lib/counting/systems';
import { getCountingLevel } from '@/lib/counting/levels';
import { CountingPracticeMode, RecordCountingSessionPayload } from '@/lib/counting/persistenceTypes';
import { playCheckSound, playChipSound } from '@/lib/sound/sounds';

export interface CountingCheckpoint {
  atCardIndex: number;
  expected: number;
  guess: number;
  correct: boolean;
  absError: number;
}

interface CountingTrainerStore {
  system: CountingSystemKey | null;
  level: number;
  practiceMode: CountingPracticeMode;
  shoe: Card[];
  dealtCards: Card[];
  currentCard: Card | null;
  trueRunningCount: number;
  totalDeckCount: number;
  isRunning: boolean;
  isPaused: boolean;
  isCheckpointPending: boolean;
  checkpoints: CountingCheckpoint[];
  isFinished: boolean;

  startDrill: (system: CountingSystemKey, level: number, practiceMode: CountingPracticeMode) => void;
  pause: () => void;
  resume: () => void;
  stopDrill: () => void;
  submitCheckpointGuess: (guess: number) => void;
  resetToSetup: () => void;
}

export const useCountingTrainerStore = create<CountingTrainerStore>((set, get) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  function clearScheduledDeal() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  function scheduleNextCard() {
    const state = get();
    if (!state.isRunning || state.isPaused || state.isCheckpointPending || state.isFinished) return;
    const levelCfg = getCountingLevel(state.level);
    timeoutId = setTimeout(dealOneCard, levelCfg.msPerCard);
  }

  function dealOneCard() {
    const state = get();
    if (!state.system) return;

    if (state.shoe.length === 0) {
      finishDrill();
      return;
    }

    const card = state.shoe[state.shoe.length - 1];
    const newShoe = state.shoe.slice(0, -1);
    const system = getCountingSystem(state.system);
    const newCount = state.trueRunningCount + system.pointValue(card);
    const newDealt = [...state.dealtCards, card];
    const levelCfg = getCountingLevel(state.level);

    playChipSound();
    set({ shoe: newShoe, dealtCards: newDealt, currentCard: card, trueRunningCount: newCount });

    if (newDealt.length % levelCfg.cardsPerCheckpoint === 0) {
      set({ isCheckpointPending: true });
      playCheckSound();
      return;
    }

    scheduleNextCard();
  }

  async function persistSession() {
    const state = get();
    if (!state.system || state.checkpoints.length === 0) return;

    const correctCount = state.checkpoints.filter((c) => c.correct).length;
    const avgAbsError = state.checkpoints.reduce((sum, c) => sum + c.absError, 0) / state.checkpoints.length;

    const payload: RecordCountingSessionPayload = {
      system: state.system,
      practiceMode: state.practiceMode,
      level: state.level,
      deckCount: state.totalDeckCount,
      cardsSeen: state.dealtCards.length,
      checkpoints: state.checkpoints.length,
      correctCheckpoints: correctCount,
      avgAbsoluteError: avgAbsError,
    };

    try {
      const res = await fetch('/api/counting/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error('Impossibile salvare la sessione di allenamento:', err);
    }
  }

  function finishDrill() {
    clearScheduledDeal();
    set({ isRunning: false, isFinished: true, currentCard: null, isCheckpointPending: false });
    void persistSession();
  }

  return {
    system: null,
    level: 1,
    practiceMode: 'RUNNING_COUNT',
    shoe: [],
    dealtCards: [],
    currentCard: null,
    trueRunningCount: 0,
    totalDeckCount: 1,
    isRunning: false,
    isPaused: false,
    isCheckpointPending: false,
    checkpoints: [],
    isFinished: false,

    startDrill: (system, level, practiceMode) => {
      clearScheduledDeal();
      const levelCfg = getCountingLevel(level);
      const shoe = createShoe(levelCfg.deckCount);
      set({
        system,
        level,
        practiceMode,
        shoe,
        dealtCards: [],
        currentCard: null,
        trueRunningCount: 0,
        totalDeckCount: levelCfg.deckCount,
        isRunning: true,
        isPaused: false,
        isCheckpointPending: false,
        checkpoints: [],
        isFinished: false,
      });
      scheduleNextCard();
    },

    pause: () => {
      clearScheduledDeal();
      set({ isPaused: true });
    },

    resume: () => {
      set({ isPaused: false });
      scheduleNextCard();
    },

    stopDrill: () => {
      finishDrill();
    },

    submitCheckpointGuess: (guess) => {
      const state = get();
      const decksRemaining = Math.max(state.shoe.length, 1) / 52;
      const expectedRaw = state.practiceMode === 'TRUE_COUNT' ? state.trueRunningCount / decksRemaining : state.trueRunningCount;
      const expected = Math.round(expectedRaw * 10) / 10;
      const absError = Math.abs(guess - expectedRaw);
      const correct = state.practiceMode === 'TRUE_COUNT' ? absError <= 1 : guess === state.trueRunningCount;

      set((s) => ({
        checkpoints: [...s.checkpoints, { atCardIndex: s.dealtCards.length, expected, guess, correct, absError }],
        isCheckpointPending: false,
      }));

      scheduleNextCard();
    },

    resetToSetup: () => {
      clearScheduledDeal();
      set({
        system: null,
        shoe: [],
        dealtCards: [],
        currentCard: null,
        trueRunningCount: 0,
        isRunning: false,
        isPaused: false,
        isCheckpointPending: false,
        checkpoints: [],
        isFinished: false,
      });
    },
  };
});
