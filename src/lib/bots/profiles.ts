import { BotProfileConfig, BotProfileType } from './types';

/**
 * Tight-Aggressive: plays a narrow range of strong hands (high preflop
 * entry bar), but plays them fast — prefers raising over calling and bets
 * for value/protection, with just enough bluffs to stay unpredictable.
 * Roughly targets a real-player-like ~20% VPIP / ~16% PFR.
 */
export const TAG_PROFILE: BotProfileConfig = {
  type: BotProfileType.TAG,
  name: 'TAG Bot',
  preflopEntryThreshold: 0.4,
  bettingThreshold: 0.62,
  callThreshold: 0.45,
  raiseOverCallThreshold: 0.68,
  aggressionFactor: 0.75,
  bluffFrequency: 0.12,
  betSizingPotFraction: 0.7,
};

/**
 * Calling Station: loose-passive. Plays almost any two cards (low preflop
 * bar) and calls down with very little equity, but almost never raises or
 * bluffs — it puts chips in reactively, not proactively.
 * Roughly targets a ~55%+ VPIP / <5% PFR.
 */
export const CALLING_STATION_PROFILE: BotProfileConfig = {
  type: BotProfileType.CALLING_STATION,
  name: 'Calling Station',
  preflopEntryThreshold: 0.22,
  bettingThreshold: 0.8,
  callThreshold: 0.2,
  raiseOverCallThreshold: 0.9,
  aggressionFactor: 0.1,
  bluffFrequency: 0,
  betSizingPotFraction: 0.5,
};

export const BOT_PROFILES: Record<BotProfileType, BotProfileConfig> = {
  [BotProfileType.TAG]: TAG_PROFILE,
  [BotProfileType.CALLING_STATION]: CALLING_STATION_PROFILE,
};

export function getBotProfile(type: BotProfileType): BotProfileConfig {
  return BOT_PROFILES[type];
}
