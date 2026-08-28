'use client';

import { useMemo, useState } from 'react';
import { useTableStore } from '@/store/tableStore';
import { useSettingsStore } from '@/store/settingsStore';
import { estimateEquity } from '@/lib/bots/equity';
import { computePotOdds } from '@/lib/game/potOdds';
import { countOuts } from '@/lib/game/outs';
import { getPositionLabel } from '@/lib/game/position';
import { POSITION_RANGES } from '@/lib/game/positionRanges';

export function InfoPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const engine = useTableStore((s) => s.engine);
  const gameState = useTableStore((s) => s.gameState);
  const heroId = useTableStore((s) => s.heroId);
  const showOpponentRanges = useSettingsStore((s) => s.showOpponentRanges);

  const hero = gameState.players.find((p) => p.id === heroId);
  const legalActions = engine.getLegalActions(heroId);
  const potSize = engine.getDisplayPot();

  const analysis = useMemo(() => {
    if (!isOpen || !hero || hero.holeCards.length !== 2) return null;

    const opponents = gameState.players.filter((p) => p.id !== heroId && !p.isFolded);
    const equity = estimateEquity(hero.holeCards, gameState.board, opponents.length);
    const outsResult = countOuts(hero.holeCards, gameState.board);
    const potOdds = computePotOdds(potSize, legalActions?.callAmount ?? 0);
    const opponentPositions = opponents.map((p) => ({
      name: p.name,
      position: getPositionLabel(p.seat, gameState.dealerSeat, gameState.players.length),
    }));

    return { equity, outsResult, potOdds, opponentPositions };
    // Recompute only when the panel opens or the hand actually progresses, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, hero?.holeCards.join(','), gameState.board.join(','), gameState.actionOnSeat]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-500 text-xs font-bold text-slate-300 transition hover:border-sky-400 hover:text-sky-300"
        aria-label="Informazioni mano: equity, pot odds, outs, range avversari"
      >
        i
      </button>

      {isOpen && (
        <div className="absolute right-0 top-8 z-10 w-72 rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs shadow-xl">
          {!analysis ? (
            <div className="text-slate-500">Nessuna mano in corso.</div>
          ) : (
            <>
              <div className="mb-2">
                <div className="font-semibold text-slate-200">La tua equity stimata</div>
                <div className="text-lg font-bold text-amber-300">{(analysis.equity * 100).toFixed(1)}%</div>
                <div className="text-slate-500">
                  Simulazione Monte Carlo contro {analysis.opponentPositions.length} avversari ancora in mano.
                </div>
              </div>

              {analysis.potOdds.callAmount > 0 && (
                <div className="mb-2 border-t border-slate-800 pt-2">
                  <div className="font-semibold text-slate-200">Pot odds</div>
                  <div className="text-slate-300">
                    Devi vincere almeno{' '}
                    <span className="font-bold text-amber-300">{analysis.potOdds.breakEvenPercent.toFixed(1)}%</span> delle
                    volte per chiamare in pareggio ({analysis.potOdds.ratioToOne.toFixed(1)} : 1).
                  </div>
                </div>
              )}

              {analysis.outsResult.outs > 0 && (
                <div className="mb-2 border-t border-slate-800 pt-2">
                  <div className="font-semibold text-slate-200">I tuoi outs</div>
                  <div className="text-slate-300">
                    <span className="font-bold text-amber-300">{analysis.outsResult.outs}</span> carte migliorano la tua
                    mano (~{analysis.outsResult.approxPercent}% entro il river, regola del 4-2).
                  </div>
                </div>
              )}

              {showOpponentRanges && analysis.opponentPositions.length > 0 && (
                <div className="border-t border-slate-800 pt-2">
                  <div className="mb-1 font-semibold text-slate-200">Range indicativi avversari</div>
                  <ul className="space-y-1">
                    {analysis.opponentPositions.map((o) => {
                      const range = POSITION_RANGES[o.position];
                      return (
                        <li key={o.name}>
                          <span className="font-semibold text-slate-300">
                            {o.name} ({o.position})
                          </span>
                          {range && (
                            <span className="text-slate-500">
                              {' '}
                              — ~{range.approxPercent}% mani: {range.description}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
