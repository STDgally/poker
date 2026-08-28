'use client';

import { useBlackjackStore } from '@/store/blackjackStore';
import { useSettingsStore } from '@/store/settingsStore';
import { NavBar } from '@/components/NavBar';
import { BlackjackPhase } from '@/lib/blackjack/types';
import { formatChips } from '@/lib/format';
import { SetupPanel } from './SetupPanel';
import { DealerHand } from './DealerHand';
import { SeatBoxes } from './SeatBoxes';
import { SeatSlot } from './SeatSlot';
import { BettingControls } from './BettingControls';
import { ActionPanel } from './ActionPanel';

// Three seats arranged along the felt's curved bottom rail, like a real
// casino blackjack table fanned out below the dealer.
const SEAT_ARC_POSITIONS = [
  { top: '80%', left: '18%' },
  { top: '88%', left: '50%' },
  { top: '80%', left: '82%' },
];

export function BlackjackTable() {
  const gameState = useBlackjackStore((s) => s.gameState);
  const resetTable = useBlackjackStore((s) => s.resetTable);
  const nextRound = useBlackjackStore((s) => s.nextRound);
  const log = useBlackjackStore((s) => s.log);
  const feltColor = useSettingsStore((s) => s.feltColor);

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-slate-950 p-6 text-slate-100">
      <NavBar title="Blackjack" />

      {!gameState ? (
        <SetupPanel />
      ) : (
        <>
          <div className="text-sm text-slate-300">
            Saldo: <span className="font-mono font-semibold text-amber-300">{formatChips(gameState.heroBankroll)}</span>
          </div>

          <div
            className="relative aspect-[16/11] w-full max-w-4xl border-8 border-black/40 shadow-2xl"
            style={{ backgroundColor: feltColor, borderRadius: '4% 4% 50% 50% / 4% 4% 100% 100%' }}
          >
            <div className="absolute left-1/2 top-[6%] -translate-x-1/2">
              <DealerHand dealer={gameState.dealer} />
            </div>

            <div className="absolute left-1/2 top-[40%] w-full -translate-x-1/2 -translate-y-1/2 px-4 text-center">
              <div className="text-base font-bold tracking-wide text-amber-300/80 sm:text-lg">
                BLACKJACK PAGA {gameState.rules.blackjackPayout === 1.5 ? '3 A 2' : '6 A 5'}
              </div>
              <div className="text-[10px] text-amber-100/50 sm:text-xs">
                Il banco {gameState.rules.dealerHitsSoft17 ? 'pesca sul 17 morbido' : 'sta sempre su 17'}
              </div>
            </div>

            {gameState.seats.map((seat) => {
              const pos = SEAT_ARC_POSITIONS[seat.seat] ?? SEAT_ARC_POSITIONS[0];
              return (
                <div key={seat.seat} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ top: pos.top, left: pos.left }}>
                  {gameState.phase === BlackjackPhase.BETTING ? (
                    <SeatSlot seat={seat} />
                  ) : (
                    <SeatBoxes seat={seat} activeBoxId={gameState.activeBoxId} />
                  )}
                </div>
              );
            })}

            {gameState.phase === BlackjackPhase.ROUND_COMPLETE && (
              <div className="absolute inset-0 flex items-start justify-center pt-4">
                <div className="rounded-md bg-black/70 px-4 py-2 text-center text-sm font-bold uppercase tracking-widest text-white shadow-lg">
                  Attendi la prossima mano
                </div>
              </div>
            )}
          </div>

          {gameState.phase === BlackjackPhase.BETTING && <BettingControls />}
          {(gameState.phase === BlackjackPhase.INSURANCE || gameState.phase === BlackjackPhase.PLAYER_TURNS) && <ActionPanel />}

          {gameState.phase === BlackjackPhase.ROUND_COMPLETE && (
            <button
              onClick={nextRound}
              className="rounded-md bg-sky-600 px-6 py-2 font-semibold text-white transition hover:bg-sky-500"
            >
              Nuova mano
            </button>
          )}

          <button onClick={resetTable} className="text-xs text-slate-500 hover:text-slate-300">
            Lascia il tavolo
          </button>

          <div className="w-full max-w-md rounded-md border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400">
            <div className="mb-1 font-semibold text-slate-300">Log</div>
            <ul className="max-h-32 space-y-0.5 overflow-y-auto" aria-live="polite" aria-atomic="false">
              {log.map((entry, i) => (
                <li key={i}>{entry}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
