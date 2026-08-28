'use client';

import { useBlackjackStore } from '@/store/blackjackStore';
import { useSettingsStore } from '@/store/settingsStore';
import { NavBar } from '@/components/NavBar';
import { BlackjackPhase } from '@/lib/blackjack/types';
import { SetupPanel } from './SetupPanel';
import { DealerHand } from './DealerHand';
import { SeatBoxes } from './SeatBoxes';
import { BettingControls } from './BettingControls';
import { ActionPanel } from './ActionPanel';

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
          <div
            className="flex w-full max-w-4xl flex-col items-center gap-8 rounded-3xl border-8 border-black/40 p-8 shadow-2xl"
            style={{ backgroundColor: feltColor }}
          >
            <DealerHand dealer={gameState.dealer} />

            <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
              {gameState.seats.map((seat) => (
                <SeatBoxes key={seat.seat} seat={seat} activeBoxId={gameState.activeBoxId} />
              ))}
            </div>
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
            Lascia il tavolo (riconfigura postazioni)
          </button>

          <div className="w-full max-w-md rounded-md border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400">
            <div className="mb-1 font-semibold text-slate-300">Log</div>
            <ul className="max-h-32 space-y-0.5 overflow-y-auto">
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
