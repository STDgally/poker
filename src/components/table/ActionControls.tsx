'use client';

import { useEffect, useState } from 'react';
import { useTableStore } from '@/store/tableStore';
import { PlayerActionType } from '@/lib/game/types';

export function ActionControls() {
  const engine = useTableStore((s) => s.engine);
  const gameState = useTableStore((s) => s.gameState);
  const heroId = useTableStore((s) => s.heroId);
  const humanFold = useTableStore((s) => s.humanFold);
  const humanCheckOrCall = useTableStore((s) => s.humanCheckOrCall);
  const humanBetOrRaise = useTableStore((s) => s.humanBetOrRaise);

  // Re-derived on every gameState change, which always follows an engine mutation.
  const legalActions = engine.getLegalActions(heroId);
  const [raiseAmount, setRaiseAmount] = useState(0);

  useEffect(() => {
    if (legalActions) setRaiseAmount(legalActions.minRaiseTo);
    // Only reset the slider when the minimum raise actually changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legalActions?.minRaiseTo]);

  if (gameState.handNumber === 0) {
    return (
      <div className="flex h-16 items-center justify-center text-sm text-slate-400">
        Premi &quot;Nuova mano&quot; per iniziare.
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
  const callLabel = legalActions.callAmount > 0 ? `Call ${legalActions.callAmount}` : 'Check';
  const isShoveOnly = legalActions.minRaiseTo >= legalActions.maxRaiseTo;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-700 bg-slate-900/90 p-4">
      <div className="flex gap-3">
        <button
          onClick={humanFold}
          className="flex-1 rounded-md bg-rose-700 px-4 py-2 font-semibold text-white transition hover:bg-rose-600"
        >
          Fold
        </button>
        <button
          onClick={humanCheckOrCall}
          className="flex-1 rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white transition hover:bg-emerald-600"
        >
          {callLabel}
        </button>
      </div>

      {canRaise && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>{gameState.currentBet === 0 ? 'Bet' : 'Raise'}</span>
            <span className="font-mono">{raiseAmount}</span>
          </div>
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
            onClick={() => humanBetOrRaise(raiseAmount)}
            className="rounded-md bg-amber-500 px-4 py-2 font-semibold text-slate-900 transition hover:bg-amber-400"
          >
            {isShoveOnly
              ? `All-in ${legalActions.maxRaiseTo}`
              : gameState.currentBet === 0
                ? `Bet ${raiseAmount}`
                : `Raise to ${raiseAmount}`}
          </button>
        </div>
      )}
    </div>
  );
}
