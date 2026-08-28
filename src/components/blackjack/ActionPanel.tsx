'use client';

import { useEffect } from 'react';
import { useBlackjackStore } from '@/store/blackjackStore';
import { useSettingsStore } from '@/store/settingsStore';
import { describeRecommendation, getBasicStrategyAction } from '@/lib/blackjack/basicStrategy';
import { computeHandValue } from '@/lib/blackjack/handValue';
import { BlackjackPhase, BoxAction } from '@/lib/blackjack/types';

const ACTION_LABELS: Record<BoxAction, string> = {
  HIT: 'Carta',
  STAND: 'Sta',
  DOUBLE: 'Raddoppia',
  SPLIT: 'Dividi',
  SURRENDER: 'Arrenditi',
};

const ACTION_SHORTCUTS: Record<BoxAction, string> = {
  HIT: 'H',
  STAND: 'S',
  DOUBLE: 'D',
  SPLIT: 'P',
  SURRENDER: 'U',
};

export function ActionPanel() {
  const gameState = useBlackjackStore((s) => s.gameState);
  const engine = useBlackjackStore((s) => s.engine);
  const humanAction = useBlackjackStore((s) => s.humanAction);
  const humanInsuranceDecision = useBlackjackStore((s) => s.humanInsuranceDecision);
  const keyboardShortcutsEnabled = useSettingsStore((s) => s.keyboardShortcutsEnabled);

  // Reads fresh state via getState() at keydown time rather than closing over
  // component-scope values, so this effect only needs to be re-attached when
  // the setting itself changes.
  useEffect(() => {
    if (!keyboardShortcutsEnabled) return;

    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const state = useBlackjackStore.getState();
      const gs = state.gameState;
      const eng = state.engine;
      if (!gs || !eng || !gs.activeBoxId) return;

      const box = gs.seats.flatMap((s) => s.boxes).find((b) => b.id === gs.activeBoxId);
      const seat = gs.seats.find((s) => s.seat === box?.seat);
      if (!box || !seat || seat.occupant !== 'HERO') return;

      if (gs.phase === BlackjackPhase.INSURANCE) {
        if (e.key === 'y' || e.key === 'Y') state.humanInsuranceDecision(box.id, true);
        else if (e.key === 'n' || e.key === 'N') state.humanInsuranceDecision(box.id, false);
        return;
      }

      const legal = eng.getLegalActions(box.id);
      if (!legal) return;
      const keyMap: Record<string, BoxAction> = { h: 'HIT', s: 'STAND', d: 'DOUBLE', p: 'SPLIT', u: 'SURRENDER' };
      const action = keyMap[e.key.toLowerCase()];
      if (action && legal.actions.includes(action)) state.humanAction(box.id, action);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [keyboardShortcutsEnabled]);

  if (!gameState || !engine || !gameState.activeBoxId) return null;

  const box = gameState.seats.flatMap((s) => s.boxes).find((b) => b.id === gameState.activeBoxId);
  const seat = gameState.seats.find((s) => s.seat === box?.seat);
  if (!box || !seat || seat.occupant !== 'HERO') return null;

  const dealerUp = gameState.dealer.cards[0];
  const value = computeHandValue(box.cards);

  if (gameState.phase === BlackjackPhase.INSURANCE) {
    return (
      <div className="flex w-full max-w-md flex-col gap-3 rounded-lg border border-sky-700 bg-slate-900/90 p-4 text-center">
        <div className="text-sm text-slate-200">
          Il banco mostra un Asso. Vuoi assicurarti per {Math.floor(box.bet / 2)} chips? ({seat.name}, box {box.boxIndex + 1})
        </div>
        <p className="text-xs text-slate-500">La strategia base sconsiglia sempre l&apos;assicurazione: è una scommessa in perdita nel lungo periodo senza conteggio delle carte.</p>
        <div className="flex gap-3">
          <button
            onClick={() => humanInsuranceDecision(box.id, false)}
            className="flex-1 rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white transition hover:bg-emerald-600"
          >
            Rifiuta (consigliato){keyboardShortcutsEnabled ? ' (N)' : ''}
          </button>
          <button
            onClick={() => humanInsuranceDecision(box.id, true)}
            className="flex-1 rounded-md bg-rose-700 px-4 py-2 font-semibold text-white transition hover:bg-rose-600"
          >
            Assicurati{keyboardShortcutsEnabled ? ' (Y)' : ''}
          </button>
        </div>
      </div>
    );
  }

  const legal = engine.getLegalActions(box.id);
  if (!legal) return null;

  const recommendation = getBasicStrategyAction(box.cards, dealerUp, legal.actions);

  return (
    <div className="flex w-full max-w-md flex-col gap-3 rounded-lg border border-slate-700 bg-slate-900/90 p-4">
      <div className="text-center text-sm text-slate-300">
        {seat.name} — box {box.boxIndex + 1} — totale {value.total}
        {value.isSoft ? ' (soft)' : ''}
      </div>

      <div className="rounded-md border border-amber-700/50 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-200">
        {describeRecommendation(recommendation)}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {(['HIT', 'STAND', 'DOUBLE', 'SPLIT', 'SURRENDER'] as BoxAction[]).map((action) => {
          const isLegal = legal.actions.includes(action);
          const isRecommended = recommendation.action === action;
          return (
            <button
              key={action}
              disabled={!isLegal}
              onClick={() => humanAction(box.id, action)}
              aria-keyshortcuts={keyboardShortcutsEnabled ? ACTION_SHORTCUTS[action] : undefined}
              className={`rounded-md border px-2 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-30 ${
                isRecommended
                  ? 'border-amber-400 bg-amber-500 text-slate-900 hover:bg-amber-400'
                  : 'border-slate-600 bg-slate-800 text-slate-200 hover:border-amber-400 hover:text-amber-300'
              }`}
            >
              {ACTION_LABELS[action]}
              {keyboardShortcutsEnabled ? ` (${ACTION_SHORTCUTS[action]})` : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
}
