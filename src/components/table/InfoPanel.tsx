'use client';

import { useMemo, useState } from 'react';
import { useTableStore } from '@/store/tableStore';
import { useSettingsStore } from '@/store/settingsStore';
import { estimateEquity } from '@/lib/bots/equity';
import { evaluateHand } from '@/lib/game/handEvaluator';
import { computePotOdds } from '@/lib/game/potOdds';
import { countOuts } from '@/lib/game/outs';
import { getPositionLabel } from '@/lib/game/position';
import { POSITION_RANGES } from '@/lib/game/positionRanges';
import { Card } from '@/lib/game/types';
import { formatChips } from '@/lib/format';

const SUIT_SYMBOLS: Record<string, string> = { s: '♠', h: '♥', d: '♦', c: '♣' };

function CardChip({ card }: { card: Card }) {
  const isRed = card[1] === 'h' || card[1] === 'd';
  return (
    <span className={`inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded border border-slate-600 bg-slate-900 px-1 text-xs font-bold ${isRed ? 'text-red-400' : 'text-slate-100'}`}>
      {card[0]}
      {SUIT_SYMBOLS[card[1]]}
    </span>
  );
}

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
      isBot: p.isBot,
      position: getPositionLabel(p.seat, gameState.dealerSeat, gameState.players.length),
    }));
    const currentHandDescription = gameState.board.length >= 3 ? evaluateHand(hero.holeCards, gameState.board).descr : null;

    return { equity, outsResult, potOdds, opponentPositions, currentHandDescription };
    // Recompute only when the panel opens or the hand actually progresses, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, hero?.holeCards.join(','), gameState.board.join(','), gameState.actionOnSeat]);

  return (
    <>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-500 text-xs font-bold text-slate-300 transition hover:border-sky-400 hover:text-sky-300"
        aria-label="Informazioni mano: equity, pot odds, outs, range avversari"
      >
        i
      </button>

      {isOpen && (
        <div className="fixed left-6 top-1/2 z-20 max-h-[85vh] w-[26rem] -translate-y-1/2 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950 p-5 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100">Analisi della mano</h2>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Chiudi pannello informazioni"
              className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 text-slate-400 hover:border-rose-400 hover:text-rose-300"
            >
              ✕
            </button>
          </div>

          {!analysis ? (
            <div className="text-sm text-slate-500">Nessuna mano in corso. Premi &quot;Inizia&quot; per vedere qui l&apos;analisi in tempo reale.</div>
          ) : (
            <div className="flex flex-col gap-4 text-sm">
              <section>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">La tua equity stimata</h3>
                <div className="text-3xl font-bold text-amber-300">{(analysis.equity * 100).toFixed(1)}%</div>
                <p className="mt-1 text-slate-400">
                  Probabilità stimata di vincere lo showdown contro i {analysis.opponentPositions.length} avversari ancora in
                  mano, calcolata simulando centinaia di combinazioni casuali di carte per loro e per il resto del board
                  (simulazione Monte Carlo — la stessa logica che usano i bot per decidere). Più il numero è alto, più la
                  tua mano è forte in questo momento.
                </p>
              </section>

              {analysis.currentHandDescription && (
                <section className="border-t border-slate-800 pt-3">
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">La tua mano attuale</h3>
                  <div className="font-semibold text-slate-100">{analysis.currentHandDescription}</div>
                </section>
              )}

              <section className="border-t border-slate-800 pt-3">
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Pot odds</h3>
                {analysis.potOdds.callAmount > 0 ? (
                  <>
                    <p className="text-slate-300">
                      Piatto attuale: <span className="font-semibold text-slate-100">{formatChips(potSize)}</span> — costo
                      della call: <span className="font-semibold text-slate-100">{formatChips(analysis.potOdds.callAmount)}</span>
                    </p>
                    <p className="mt-1 text-slate-300">
                      Rapporto <span className="font-semibold text-amber-300">{analysis.potOdds.ratioToOne.toFixed(1)} : 1</span> —
                      devi vincere almeno{' '}
                      <span className="font-semibold text-amber-300">{analysis.potOdds.breakEvenPercent.toFixed(1)}%</span>{' '}
                      delle volte perché chiamare sia in pareggio nel lungo periodo.
                    </p>
                    <p className="mt-1 text-slate-500">
                      Confronta questo numero con la tua equity qui sopra: se la tua equity è{' '}
                      <span className="font-semibold text-emerald-400">maggiore</span> della % di pot odds, chiamare è
                      matematicamente profittevole; se è <span className="font-semibold text-rose-400">minore</span>, stai
                      pagando più di quanto la mano valga in media.
                    </p>
                  </>
                ) : (
                  <p className="text-slate-500">Nessuna puntata da pagare in questo momento: puoi checkare gratis.</p>
                )}
              </section>

              <section className="border-t border-slate-800 pt-3">
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">I tuoi outs</h3>
                {analysis.outsResult.outs > 0 ? (
                  <>
                    <p className="text-slate-300">
                      <span className="font-semibold text-amber-300">{analysis.outsResult.outs}</span> carte rimanenti
                      migliorano la tua mano rispetto a quella attuale:
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {analysis.outsResult.outCards.map((c) => (
                        <CardChip key={c} card={c} />
                      ))}
                    </div>
                    <p className="mt-2 text-slate-500">
                      Regola del 4 e 2: con {gameState.board.length === 3 ? 'due carte ancora da vedere (moltiplica per 4)' : 'una carta ancora da vedere (moltiplica per 2)'}, hai
                      circa <span className="font-semibold text-amber-300">{analysis.outsResult.approxPercent}%</span> di
                      probabilità di completare la mano entro il river. È una stima rapida, non sostituisce l&apos;equity
                      esatta calcolata sopra.
                    </p>
                  </>
                ) : (
                  <p className="text-slate-500">
                    {gameState.board.length < 3
                      ? 'Disponibile solo dal flop in poi.'
                      : gameState.board.length >= 5
                        ? 'Il board è completo: non ci sono più carte da vedere.'
                        : 'Nessuna carta migliora la tua mano attuale rispetto a quella che hai già.'}
                  </p>
                )}
              </section>

              {showOpponentRanges && analysis.opponentPositions.length > 0 && (
                <section className="border-t border-slate-800 pt-3">
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Range indicativi avversari</h3>
                  <p className="mb-2 text-slate-500">
                    Range di apertura tipici per un giocatore in quella posizione a un tavolo 6-max — una guida teorica
                    generica, non una lettura in tempo reale delle carte o della strategia specifica di questi bot.
                  </p>
                  <ul className="space-y-2">
                    {analysis.opponentPositions.map((o) => {
                      const range = POSITION_RANGES[o.position];
                      return (
                        <li key={o.name} className="rounded-md border border-slate-800 bg-slate-900/60 p-2">
                          <div className="font-semibold text-slate-200">
                            {o.name} <span className="text-slate-500">— {o.position}</span>
                            {range && <span className="ml-2 text-amber-300">~{range.approxPercent}% mani</span>}
                          </div>
                          {range && <div className="mt-0.5 text-slate-400">{range.description}</div>}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
