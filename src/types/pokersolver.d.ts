// pokersolver ships no type definitions; this is a minimal ambient declaration
// covering the subset of the API GameEngine relies on.
declare module 'pokersolver' {
  export class Hand {
    static solve(cards: string[], game?: string, canDisqualify?: boolean): Hand;
    static winners(hands: Hand[]): Hand[];

    cards: unknown[];
    name: string;
    descr: string;
    rank: number;

    toString(): string;
  }
}
