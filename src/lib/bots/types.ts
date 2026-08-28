export enum BotProfileType {
  TAG = 'TAG',
  CALLING_STATION = 'CALLING_STATION',
}

/**
 * Behavioral parameters driving a bot's decisions. All thresholds are
 * expressed in equity terms (0-1 probability of winning at showdown, see
 * estimateEquity()) so the same policy function can drive every profile.
 */
export interface BotProfileConfig {
  type: BotProfileType;
  name: string;

  /** Minimum equity to voluntarily enter the pot preflop (raise or cold-call an open). */
  preflopEntryThreshold: number;
  /** Minimum equity, when opening the betting on any street, to bet/raise instead of checking. */
  bettingThreshold: number;
  /** Minimum equity required to call a bet/raise rather than fold. */
  callThreshold: number;
  /** Equity above which the bot prefers raising over just calling when facing a bet. */
  raiseOverCallThreshold: number;
  /** Probability [0-1] of raising (vs. calling) once raiseOverCallThreshold is met. */
  aggressionFactor: number;
  /** Probability [0-1] of bluff-betting/raising with a hand below bettingThreshold. */
  bluffFrequency: number;
  /** Fraction of the pot targeted when sizing a bet or raise. */
  betSizingPotFraction: number;
}
