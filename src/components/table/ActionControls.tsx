'use client';

import { useEffect, useState } from 'react';
import { useTableStore } from '@/store/tableStore';
import { useSettingsStore } from '@/store/settingsStore';
import { PlayerActionType } from '@/lib/game/types';
import { formatBetAmount } from '@/lib/format';
import { InfoPanel } from './InfoPanel';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.round(value), min), max);
}

export function ActionControls() {
  const engine = useTableStore((s) => s.engine);
  const gameState = useTableStore((s) => s.gameState);
  const heroId = useTableStore((s) => s.heroId);
  const humanFold = useTableStore((s) => s.humanFold);
  const humanCheckOrCall = useTableStore((s) => s.humanCheckOrCall);
  const humanBetOrRaise = useTableStore((s) => s.humanBetOrRaise);
  const betDisplayUnit = useSettingsStore((s) => s.betDisplayUnit);

  // Re-derived on every gameState change, which always follows an engine mutation.
  const legalActions = engine.getLegalActions(heroId);
  const potSize = engine.getDisplayPot();
  const [raiseAmount, setRaiseAmount] = useState(0);

  useEffect(() => {
    if (legalActions) setRaiseAmount(legalActions.minRaiseTo);
    // Only reset the slider when the minimum raise actually changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legalActions?.minRaiseTo]);

  if (gameState.handNumber === 0) {
    return (
      <div className="flex h-16 items-center justify-center text-sm text-slate-400">
        Premi &quot;Inizia&quot; per iniziare.
      </div>
    );
  }

  if (!legalActions) {
    return (
      <div className="flex h-16 items-center justify-center text-sm text-slate-400">
        {gameState.isHandComplete ? 'Mano conclusa — premi "Nuova mano"' : 'In attesa degli altri giocatori...'}
      </div>
    );
  }

  const canRaise = legalActions.actions.includes(PlayerActionType.RAISE) || legalActions.actions.includes(PlayerActionType.BET);
  const isOpenBet = gameState.currentBet === 0;
  const callLabel = legalActions.callAmount > 0 ? `Chiama ${formatBetAmount(legalActions.callAmount, gameState.bigBlind, betDisplayUnit)}` : 'Check';
  const isShoveOnly = legalActions.minRaiseTo >= legalActions.maxRaiseTo;
  const step = Math.max(1, gameState.bigBlind);

  const isPreflopUnraised = gameState.street === 'PREFLOP' && gameState.currentBet <= gameState.bigBlind;
  const standardPreset = isPreflopUnraised
    ? { label: '3 BB', value: clamp(3 * gameState.bigBlind, legalActions.minRaiseTo, legalActions.maxRaiseTo) }
    : { label: '½ Piatto', value: clamp(gameState.currentBet + (potSize + legalActions.callAmount) * 0.5, legalActions.minRaiseTo, legalActions.maxRaiseTo) };
  const potPreset = clamp(gameState.currentBet + potSize + legalActions.callAmount, legalActions.minRaiseTo, legalActions.maxRaiseTo);

  const presets = [
    { key: 'min', label: 'Min', value: legalActions.minRaiseTo },
    { key: 'standard', label: standardPreset.label, value: standardPreset.value },
    { key: 'pot', label: 'Piatto', value: potPreset },
    { key: 'max', label: 'Max', value: legalActions.maxRaiseTo },
  ];

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-700 bg-slate-900/90 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-slate-500">Le tue azioni</span>
        <InfoPanel />
      </div>

      {canRaise && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-4 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.key}
                onClick={() => setRaiseAmount(clamp(preset.value, legalActions.minRaiseTo, legalActions.maxRaiseTo))}
                disabled={isShoveOnly}
                className="rounded-md border border-slate-600 bg-slate-800 px-1 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-amber-400 hover:text-amber-300 disabled:opacity-40"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRaiseAmount((v) => clamp(v - step, legalActions.minRaiseTo, legalActions.maxRaiseTo))}
              disabled={isShoveOnly}
              className="h-8 w-8 shrink-0 rounded-full border border-slate-600 text-slate-200 transition hover:border-amber-400 hover:text-amber-300 disabled:opacity-40"
            >
              −
            </button>
            <input
              type="range"
              min={legalActions.minRaiseTo}
              max={legalActions.maxRaiseTo}
              value={raiseAmount}
              disabled={isShoveOnly}
              onChange={(e) => setRaiseAmount(Number(e.target.value))}
              className="w-full accent-amber-400 disabled:opacity-50"
            />
            <button
              onClick={() => setRaiseAmount((v) => clamp(v + step, legalActions.minRaiseTo, legalActions.maxRaiseTo))}
              disabled={isShoveOnly}
              className="h-8 w-8 shrink-0 rounded-full border border-slate-600 text-slate-200 transition hover:border-amber-400 hover:text-amber-300 disabled:opacity-40"
            >
              +
            </button>
          </div>
          <div className="text-center font-mono text-sm text-amber-300">
            {formatBetAmount(raiseAmount, gameState.bigBlind, betDisplayUnit)}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={humanFold}
          className="flex-1 rounded-md bg-rose-700 px-4 py-3 font-semibold text-white transition hover:bg-rose-600"
        >
          Fold
        </button>
        <button
          onClick={humanCheckOrCall}
          className="flex-1 rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-600"
        >
          {callLabel}
        </button>
        {canRaise && (
          <button
            onClick={() => humanBetOrRaise(raiseAmount)}
            className="flex-1 rounded-md bg-amber-500 px-4 py-3 font-semibold text-slate-900 transition hover:bg-amber-400"
          >
            {isShoveOnly ? `All-in ${formatBetAmount(legalActions.maxRaiseTo, gameState.bigBlind, betDisplayUnit)}` : isOpenBet ? `Punta ${formatBetAmount(raiseAmount, gameState.bigBlind, betDisplayUnit)}` : `Rilancia a ${formatBetAmount(raiseAmount, gameState.bigBlind, betDisplayUnit)}`}
          </button>
        )}
      </div>
    </div>
  );
}
