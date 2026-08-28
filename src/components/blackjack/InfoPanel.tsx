'use client';

import { useMemo, useState } from 'react';
import { useBlackjackStore } from '@/store/blackjackStore';
import { describeRecommendation, getBasicStrategyAction } from '@/lib/blackjack/basicStrategy';
import { computeHandValue } from '@/lib/blackjack/handValue';
import { classifyDealerUpCard, computeBustProbability, estimateStandOutcome } from '@/lib/blackjack/oddsCalculator';

const UPCARD_STRENGTH_LABEL: Record<string, string> = {
  weak: 'debole — il banco sballa spesso partendo da qui, i giocatori tendono a stare presto',
  medium: 'media — situazione più equilibrata',
  strong: 'forte — il banco arriva a un totale alto molto spesso, conviene rischiare di più',
};

export function InfoPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const engine = useBlackjackStore((s) => s.engine);
  const gameState = useBlackjackStore((s) => s.gameState);

  const analysis = useMemo(() => {
    if (!isOpen || !engine || !gameState || !gameState.activeBoxId) return null;

    // Read the LIVE (unredacted) engine state — the InfoPanel needs the true
    // shoe/hole card to compute honest probabilities, unlike the snapshot
    // exposed to the rest of the UI (see blackjackStore's snapshot()).
    const liveState = engine.getState();
    const box = liveState.seats.flatMap((s) => s.boxes).find((b) => b.id === liveState.activeBoxId);
    const seat = liveState.seats.find((s) => s.seat === box?.seat);
    if (!box || !seat || seat.occupant !== 'HERO') return null;

    const dealerUpCard = liveState.dealer.cards[0];
    const hiddenHoleCard = liveState.dealer.holeCardRevealed ? undefined : liveState.dealer.cards[1];
    const value = computeHandValue(box.cards);
    const legal = engine.getLegalActions(box.id);
    const recommendation = legal ? getBasicStrategyAction(box.cards, dealerUpCard, legal.actions) : null;
    const bustRisk = computeBustProbability(box.cards, liveState.shoe);
    const standOutcome = estimateStandOutcome(box.cards, dealerUpCard, liveState.shoe, hiddenHoleCard, liveState.rules);
    const upCardStrength = classifyDealerUpCard(dealerUpCard);

    return { value, recommendation, bustRisk, standOutcome, upCardStrength, dealerUpCard };
    // Recompute only when the panel opens or the active box/board actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, gameState?.activeBoxId, gameState?.dealer.cards.length]);

  return (
    <>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-500 text-xs font-bold text-slate-300 transition hover:border-sky-400 hover:text-sky-300"
        aria-label="Informazioni sulla mano: probabilità e mossa consigliata"
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
            <div className="text-sm text-slate-500">Non è il tuo turno in questo momento.</div>
          ) : (
            <div className="flex flex-col gap-4 text-sm">
              <section>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">La tua mano</h3>
                <div className="text-2xl font-bold text-amber-300">
                  {analysis.value.total}
                  {analysis.value.isSoft ? ' (soft)' : ''}
                </div>
              </section>

              <section className="border-t border-slate-800 pt-3">
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Carta del banco</h3>
                <p className="text-slate-300">
                  {analysis.dealerUpCard} — {UPCARD_STRENGTH_LABEL[analysis.upCardStrength]}.
                </p>
              </section>

              {analysis.recommendation && (
                <section className="border-t border-slate-800 pt-3">
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Mossa consigliata</h3>
                  <p className="text-slate-300">{describeRecommendation(analysis.recommendation)}</p>
                </section>
              )}

              <section className="border-t border-slate-800 pt-3">
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Rischio se chiedi carta</h3>
                <p className="text-slate-300">
                  <span className="font-bold text-amber-300">{analysis.bustRisk.percent.toFixed(1)}%</span> delle carte non
                  ancora viste ti farebbero sballare ({analysis.bustRisk.bustCount} su {analysis.bustRisk.total}).
                </p>
              </section>

              <section className="border-t border-slate-800 pt-3">
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Se stai adesso</h3>
                <div className="flex justify-between text-slate-300">
                  <span>
                    Vittoria <span className="font-bold text-emerald-400">{analysis.standOutcome.winPct.toFixed(0)}%</span>
                  </span>
                  <span>
                    Pareggio <span className="font-bold text-slate-200">{analysis.standOutcome.pushPct.toFixed(0)}%</span>
                  </span>
                  <span>
                    Sconfitta <span className="font-bold text-rose-400">{analysis.standOutcome.losePct.toFixed(0)}%</span>
                  </span>
                </div>
                <p className="mt-2 text-slate-500">
                  Simulazione Monte Carlo che gioca il banco secondo le sue regole fisse, pescando dalle carte non ancora
                  viste — la carta coperta del banco non viene mai &quot;sbirciata&quot;, viene trattata come sconosciuta
                  esattamente come lo è per te.
                </p>
              </section>
            </div>
          )}
        </div>
      )}
    </>
  );
}
