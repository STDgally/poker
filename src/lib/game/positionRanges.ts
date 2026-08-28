// Static reference table of typical 6-max opening ranges by position. This is
// generic poker theory (not derived from the bots' actual thresholds), shown
// in the UI as an indicative guide to how wide a real opponent in that seat
// would usually play, not a live read on any specific bot.
export interface PositionRangeInfo {
  label: string;
  approxPercent: number;
  description: string;
}

export const POSITION_RANGES: Record<string, PositionRangeInfo> = {
  BTN: {
    label: 'Bottone',
    approxPercent: 45,
    description: 'Range molto ampio: quasi tutte le coppie, assi, broadway, molti connettori e suited.',
  },
  SB: {
    label: 'Piccolo buio',
    approxPercent: 38,
    description: 'Ampio ma cauto: coppie, assi, broadway, alcuni suited connector.',
  },
  BB: {
    label: 'Grande buio',
    approxPercent: 65,
    description: 'Difende largo per pot odds contro un rilancio; range di difesa ampio ma spesso debole post-flop.',
  },
  UTG: {
    label: 'Under the Gun',
    approxPercent: 12,
    description: 'Range molto stretto: coppie medio-alte, AQ+, poche mani speculative.',
  },
  MP: {
    label: 'Middle Position',
    approxPercent: 18,
    description: 'Leggermente più ampio di UTG: coppie, broadway, alcuni suited connector.',
  },
  CO: {
    label: 'Cut-off',
    approxPercent: 28,
    description: 'Range ampio: coppie, assi, broadway, molti suited connector.',
  },
};
