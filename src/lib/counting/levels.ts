export interface CountingLevel {
  level: number;
  label: string;
  deckCount: number;
  msPerCard: number;
  cardsPerCheckpoint: number;
}

export const COUNTING_LEVELS: CountingLevel[] = [
  { level: 1, label: 'Principiante', deckCount: 1, msPerCard: 2500, cardsPerCheckpoint: 15 },
  { level: 2, label: 'Facile', deckCount: 2, msPerCard: 1800, cardsPerCheckpoint: 15 },
  { level: 3, label: 'Medio', deckCount: 4, msPerCard: 1200, cardsPerCheckpoint: 20 },
  { level: 4, label: 'Difficile', deckCount: 6, msPerCard: 800, cardsPerCheckpoint: 20 },
  { level: 5, label: 'Esperto', deckCount: 8, msPerCard: 500, cardsPerCheckpoint: 25 },
];

export function getCountingLevel(level: number): CountingLevel {
  return COUNTING_LEVELS.find((l) => l.level === level) ?? COUNTING_LEVELS[0];
}
