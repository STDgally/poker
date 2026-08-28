'use client';

import Link from 'next/link';
import { useTableStore } from '@/store/tableStore';
import { useSettingsStore } from '@/store/settingsStore';
import { PlayerSeat } from './PlayerSeat';
import { PotDisplay } from './PotDisplay';
import { ActionControls } from './ActionControls';

// Six seats arranged clockwise around the felt, starting at bottom-center (the hero).
// Top/bottom seats are kept a little inside the oval's edge so their cards
// (which extend upward from the seat's center) don't poke out above the table.
const SEAT_POSITIONS = [
  { top: '84%', left: '50%' },
  { top: '64%', left: '4%' },
  { top: '16%', left: '10%' },
  { top: '6%', left: '50%' },
  { top: '16%', left: '90%' },
  { top: '64%', left: '96%' },
];

export function PokerTable() {
  const gameState = useTableStore((s) => s.gameState);
  const engine = useTableStore((s) => s.engine);
  const heroId = useTableStore((s) => s.heroId);
  const botProfiles = useTableStore((s) => s.botProfiles);
  const startNewHand = useTableStore((s) => s.startNewHand);
  const log = useTableStore((s) => s.log);
  const isBotActing = useTableStore((s) => s.isBotActing);
  const feltColor = useSettingsStore((s) => s.feltColor);

  const orderedPlayers = [...gameState.players].sort((a, b) => a.seat - b.seat);
  const pot = engine.getDisplayPot();
  const canStartNewHand = gameState.handNumber === 0 || gameState.isHandComplete;

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-slate-950 p-6 text-slate-100">
      <div className="mb-4 flex w-full max-w-4xl items-center justify-between">
        <h1 className="text-2xl font-bold">Poker Simulator &amp; Analytics — Tavolo 6-max</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/settings" className="text-sky-400 hover:text-sky-300">
            Impostazioni
          </Link>
          <Link href="/dashboard" className="text-sky-400 hover:text-sky-300">
            Dashboard &rarr;
          </Link>
        </div>
      </div>

      <div
        className="relative mt-8 aspect-[16/9] w-full max-w-4xl rounded-[50%] border-8 border-black/40 shadow-2xl"
        style={{ backgroundColor: feltColor }}
      >
        {orderedPlayers.map((player) => {
          const pos = SEAT_POSITIONS[player.seat] ?? SEAT_POSITIONS[0];
          const cardsVisible = player.id === heroId || (gameState.isHandComplete && !player.isFolded);
          const isActing = gameState.actionOnSeat === player.seat && !gameState.isHandComplete;

          return (
            <div key={player.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ top: pos.top, left: pos.left }}>
              <PlayerSeat
                player={player}
                isDealer={gameState.dealerSeat === player.seat}
                isActing={isActing}
                isHero={player.id === heroId}
                isThinking={isActing && player.isBot && isBotActing}
                cardsVisible={cardsVisible}
                profile={player.isBot ? botProfiles[player.id] : undefined}
              />
            </div>
          );
        })}

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <PotDisplay board={gameState.board} pot={pot} />
        </div>
      </div>

      {gameState.isHandComplete && gameState.winners.length > 0 && (
        <div className="w-full max-w-md rounded-md bg-slate-800 px-4 py-2 text-center text-sm text-amber-300">
          {gameState.winners.map((w) => {
            const name = gameState.players.find((p) => p.id === w.playerId)?.name ?? w.playerId;
            return (
              <div key={w.playerId}>
                {name} vince {w.amountWon} {w.handDescription ? `(${w.handDescription})` : '(avversari passati)'}
              </div>
            );
          })}
        </div>
      )}

      <div className="w-full max-w-md">
        <ActionControls />
      </div>

      <button
        onClick={startNewHand}
        disabled={!canStartNewHand}
        className="rounded-md bg-sky-600 px-6 py-2 font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {gameState.handNumber === 0 ? 'Inizia' : 'Nuova mano'}
      </button>

      <div className="w-full max-w-md rounded-md border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400">
        <div className="mb-1 font-semibold text-slate-300">Log</div>
        <ul className="max-h-32 space-y-0.5 overflow-y-auto">
          {log.map((entry, i) => (
            <li key={i}>{entry}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
