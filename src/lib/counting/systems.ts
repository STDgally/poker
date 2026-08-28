import { Card } from '@/lib/blackjack/types';
import { TEN_VALUE_RANKS } from '@/lib/blackjack/handValue';

export type CountingSystemKey = 'HI_LO' | 'KO' | 'OMEGA_II' | 'RED_7' | 'HI_OPT_I';

export interface CountingSystemDef {
  key: CountingSystemKey;
  label: string;
  description: string;
  /** Balanced systems sum to 0 across a full deck (true-count conversion is meaningful);
   * unbalanced ones (KO, Red 7) are designed to be used as a running count only. */
  isBalanced: boolean;
  pointValue: (card: Card) => number;
}

const RED_SUITS = new Set(['h', 'd']);

export const COUNTING_SYSTEMS: Record<CountingSystemKey, CountingSystemDef> = {
  HI_LO: {
    key: 'HI_LO',
    label: 'Hi-Lo',
    description: 'Il sistema più diffuso e insegnato. 2-6: +1, 7-9: 0, 10-A: -1. Bilanciato (livello 1).',
    isBalanced: true,
    pointValue: (card) => {
      const r = card[0];
      if ('23456'.includes(r)) return 1;
      if ('789'.includes(r)) return 0;
      return -1; // T,J,Q,K,A
    },
  },
  KO: {
    key: 'KO',
    label: 'KO (Knock-Out)',
    description: 'Simile a Hi-Lo ma anche il 7 vale +1. Sbilanciato: niente conversione a true count, più semplice da imparare.',
    isBalanced: false,
    pointValue: (card) => {
      const r = card[0];
      if ('234567'.includes(r)) return 1;
      if (r === '8' || r === '9') return 0;
      return -1;
    },
  },
  OMEGA_II: {
    key: 'OMEGA_II',
    label: 'Omega II',
    description: 'Sistema di livello 2 (valori fino a ±2), più preciso ma più difficile da tenere a mente.',
    isBalanced: true,
    pointValue: (card) => {
      const r = card[0];
      if (r === '2' || r === '3' || r === '7') return 1;
      if (r === '4' || r === '5' || r === '6') return 2;
      if (r === '9') return -1;
      if (TEN_VALUE_RANKS.has(r)) return -2;
      return 0; // 8, A
    },
  },
  RED_7: {
    key: 'RED_7',
    label: 'Red 7',
    description: 'Variante di Hi-Lo sensibile al colore: il 7 vale +1 solo se rosso (cuori/quadri), altrimenti 0. Sbilanciato.',
    isBalanced: false,
    pointValue: (card) => {
      const r = card[0];
      if ('23456'.includes(r)) return 1;
      if (r === '7') return RED_SUITS.has(card[1]) ? 1 : 0;
      if (r === '8' || r === '9') return 0;
      return -1;
    },
  },
  HI_OPT_I: {
    key: 'HI_OPT_I',
    label: 'Hi-Opt I',
    description: "Sistema bilanciato che ignora l'Asso (utile per chi vuole contare gli assi a parte). 3-6: +1, 10: -1, resto 0.",
    isBalanced: true,
    pointValue: (card) => {
      const r = card[0];
      if ('3456'.includes(r)) return 1;
      if (TEN_VALUE_RANKS.has(r)) return -1;
      return 0; // 2,7,8,9,A
    },
  },
};

export function getCountingSystem(key: CountingSystemKey): CountingSystemDef {
  return COUNTING_SYSTEMS[key];
}
