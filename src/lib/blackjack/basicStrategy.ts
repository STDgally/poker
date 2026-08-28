import { BoxAction, Card } from './types';
import { computeHandValue, isPair, TEN_VALUE_RANKS } from './handValue';

// Standard published multi-deck basic strategy, dealer hits soft 17 (matches
// this app's default rules — see DEFAULT_RULES.dealerHitsSoft17). It is the
// mathematically optimal play against an unknown hand, ignoring card
// counting; it's used both as the bots' "brain" and as the in-game hint
// shown to the hero (Step B3).

type DealerCol = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'A';

/** D = double if allowed else hit; Ds = double if allowed else stand;
 * Rh = surrender if allowed else hit; P = split. */
type StrategyCode = 'H' | 'S' | 'D' | 'Ds' | 'P' | 'Rh';

export interface StrategyRecommendation {
  /** What to actually do right now, given which actions are currently legal. */
  action: BoxAction;
  /** The textbook-perfect action, ignoring whether it's currently legal (for the hint UI). */
  idealAction: BoxAction;
  code: StrategyCode;
}

function dealerColumn(upCard: Card): DealerCol {
  const rank = upCard[0];
  if (rank === 'A') return 'A';
  if (TEN_VALUE_RANKS.has(rank)) return 'T';
  return rank as DealerCol;
}

const HARD_TOTALS: Record<number, Record<DealerCol, StrategyCode>> = {
  9: { '2': 'H', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', T: 'H', A: 'H' },
  10: { '2': 'D', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'D', '8': 'D', '9': 'D', T: 'H', A: 'H' },
  11: { '2': 'D', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'D', '8': 'D', '9': 'D', T: 'D', A: 'H' },
  12: { '2': 'H', '3': 'H', '4': 'S', '5': 'S', '6': 'S', '7': 'H', '8': 'H', '9': 'H', T: 'H', A: 'H' },
  13: { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'H', '8': 'H', '9': 'H', T: 'H', A: 'H' },
  14: { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'H', '8': 'H', '9': 'H', T: 'H', A: 'H' },
  15: { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'H', '8': 'H', '9': 'H', T: 'Rh', A: 'Rh' },
  16: { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'H', '8': 'H', '9': 'Rh', T: 'Rh', A: 'Rh' },
};

/** Keyed by total (soft 13 = A+2 through soft 19 = A+8). Soft 12 (A,A unsplit) and soft 20+ are handled outside the table. */
const SOFT_TOTALS: Record<number, Record<DealerCol, StrategyCode>> = {
  13: { '2': 'H', '3': 'H', '4': 'H', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', T: 'H', A: 'H' },
  14: { '2': 'H', '3': 'H', '4': 'H', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', T: 'H', A: 'H' },
  15: { '2': 'H', '3': 'H', '4': 'D', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', T: 'H', A: 'H' },
  16: { '2': 'H', '3': 'H', '4': 'D', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', T: 'H', A: 'H' },
  17: { '2': 'H', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', T: 'H', A: 'H' },
  18: { '2': 'S', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'S', '8': 'S', '9': 'H', T: 'H', A: 'H' },
  19: { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'Ds', '7': 'S', '8': 'S', '9': 'S', T: 'S', A: 'S' },
};

/** Keyed by rank ('2'-'9', 'A'). 5s and 10-value pairs are never split — they fall through to the hard-total table. */
const PAIRS: Record<string, Record<DealerCol, StrategyCode>> = {
  '2': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'H', '9': 'H', T: 'H', A: 'H' },
  '3': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'H', '9': 'H', T: 'H', A: 'H' },
  '4': { '2': 'H', '3': 'H', '4': 'H', '5': 'P', '6': 'P', '7': 'H', '8': 'H', '9': 'H', T: 'H', A: 'H' },
  '6': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'H', '8': 'H', '9': 'H', T: 'H', A: 'H' },
  '7': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'H', '9': 'H', T: 'H', A: 'H' },
  '8': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'P', '9': 'P', T: 'P', A: 'P' },
  '9': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'S', '8': 'P', '9': 'P', T: 'S', A: 'S' },
  A: { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'P', '9': 'P', T: 'P', A: 'P' },
};

function codeToIdealAction(code: StrategyCode): BoxAction {
  switch (code) {
    case 'D':
    case 'Ds':
      return 'DOUBLE';
    case 'Rh':
      return 'SURRENDER';
    case 'P':
      return 'SPLIT';
    case 'H':
      return 'HIT';
    case 'S':
    default:
      return 'STAND';
  }
}

function finalize(code: StrategyCode, legalActions: BoxAction[]): StrategyRecommendation {
  let action: BoxAction;
  switch (code) {
    case 'D':
      action = legalActions.includes('DOUBLE') ? 'DOUBLE' : 'HIT';
      break;
    case 'Ds':
      action = legalActions.includes('DOUBLE') ? 'DOUBLE' : 'STAND';
      break;
    case 'Rh':
      action = legalActions.includes('SURRENDER') ? 'SURRENDER' : 'HIT';
      break;
    case 'P':
      action = legalActions.includes('SPLIT') ? 'SPLIT' : 'HIT';
      break;
    case 'H':
      action = 'HIT';
      break;
    case 'S':
    default:
      action = 'STAND';
      break;
  }
  return { action, idealAction: codeToIdealAction(code), code };
}

function resolveByTotal(cards: Card[], dealerCol: DealerCol, legalActions: BoxAction[]): StrategyRecommendation {
  const value = computeHandValue(cards);

  if (value.isSoft) {
    if (value.total < 13) return finalize('H', legalActions); // soft 12 (A,A left unsplit)
    if (value.total >= 20) return finalize('S', legalActions);
    return finalize(SOFT_TOTALS[value.total][dealerCol], legalActions);
  }

  if (value.total <= 8) return finalize('H', legalActions);
  if (value.total >= 17) return finalize('S', legalActions);
  return finalize(HARD_TOTALS[value.total][dealerCol], legalActions);
}

/** Recommends the mathematically optimal play for this hand against the dealer's up card. */
export function getBasicStrategyAction(cards: Card[], dealerUpCard: Card, legalActions: BoxAction[]): StrategyRecommendation {
  const dealerCol = dealerColumn(dealerUpCard);

  if (isPair(cards)) {
    const rank = cards[0][0];
    const pairKey = rank === 'A' ? 'A' : TEN_VALUE_RANKS.has(rank) ? null : rank;
    const pairRow = pairKey ? PAIRS[pairKey] : undefined;

    if (pairRow) {
      const code = pairRow[dealerCol];
      if (code === 'P') {
        if (legalActions.includes('SPLIT')) {
          return { action: 'SPLIT', idealAction: 'SPLIT', code };
        }
        return resolveByTotal(cards, dealerCol, legalActions);
      }
      return finalize(code, legalActions);
    }
  }

  return resolveByTotal(cards, dealerCol, legalActions);
}

/** Basic strategy's answer to insurance is always the same regardless of the hand: never take it without a card count — it loses money in the long run. */
export function shouldTakeInsurance(): boolean {
  return false;
}

const ACTION_LABELS_IT: Record<BoxAction, string> = {
  HIT: 'chiedere carta',
  STAND: 'stare',
  DOUBLE: 'raddoppiare',
  SPLIT: 'dividere',
  SURRENDER: 'arrendersi',
};

/** Short Italian explanation for the in-game hint UI (Step B3). */
export function describeRecommendation(rec: StrategyRecommendation): string {
  if (rec.action === rec.idealAction) {
    return `La strategia base consiglia di ${ACTION_LABELS_IT[rec.action]}.`;
  }
  return `La strategia base consiglierebbe di ${ACTION_LABELS_IT[rec.idealAction]}, ma qui non è disponibile: la scelta migliore è ${ACTION_LABELS_IT[rec.action]}.`;
}
