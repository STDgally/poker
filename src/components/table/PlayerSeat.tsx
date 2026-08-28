import { PlayerState } from '@/lib/game/types';
import { BotProfileConfig, BotProfileType } from '@/lib/bots/types';
import { formatChips } from '@/lib/format';
import { PlayingCard } from './PlayingCard';

// Placeholder HUD numbers only — Step 4 wires this up to real VPIP/PFR
// computed from HandHistory/ActionLog via Prisma.
const PLACEHOLDER_STATS: Record<BotProfileType, { vpip: number; pfr: number }> = {
  [BotProfileType.TAG]: { vpip: 19, pfr: 15 },
  [BotProfileType.CALLING_STATION]: { vpip: 58, pfr: 3 },
};

interface PlayerSeatProps {
  player: PlayerState;
  isDealer: boolean;
  isActing: boolean;
  cardsVisible: boolean;
  profile?: BotProfileConfig;
}

export function PlayerSeat({ player, isDealer, isActing, cardsVisible, profile }: PlayerSeatProps) {
  const stats = profile ? PLACEHOLDER_STATS[profile.type] : null;
  const hasCards = player.holeCards.length === 2;

  return (
    <div className={`flex w-28 flex-col items-center gap-1 ${player.isFolded ? 'opacity-40' : ''}`}>
      <div className="flex gap-1">
        <PlayingCard card={hasCards ? player.holeCards[0] : undefined} hidden={hasCards && !cardsVisible} small />
        <PlayingCard card={hasCards ? player.holeCards[1] : undefined} hidden={hasCards && !cardsVisible} small />
      </div>

      <div
        className={`relative w-full rounded-lg border px-2 py-1 text-center text-xs shadow ${
          isActing ? 'border-amber-400 bg-slate-800 ring-2 ring-amber-400' : 'border-slate-700 bg-slate-800/90'
        }`}
      >
        {isDealer && (
          <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-slate-900">
            D
          </span>
        )}
        <div className="truncate font-semibold text-slate-100">{player.name}</div>
        <div className="text-slate-300">{formatChips(player.stack)}</div>
        {player.currentStreetBet > 0 && <div className="mt-0.5 text-amber-300">bet {player.currentStreetBet}</div>}
        {player.isAllIn && <div className="mt-0.5 font-semibold text-rose-400">ALL-IN</div>}
      </div>

      {stats && (
        <div className="flex gap-2 rounded bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-400">
          <span>VPIP {stats.vpip}%</span>
          <span>PFR {stats.pfr}%</span>
        </div>
      )}
    </div>
  );
}
