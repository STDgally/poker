export interface PotOdds {
  callAmount: number;
  potAfterCall: number;
  /** Minimum win probability (%) needed for a call to break even. */
  breakEvenPercent: number;
  /** Same information expressed as "N : 1" pot odds. */
  ratioToOne: number;
}

export function computePotOdds(potSize: number, callAmount: number): PotOdds {
  if (callAmount <= 0) {
    return { callAmount: 0, potAfterCall: potSize, breakEvenPercent: 0, ratioToOne: 0 };
  }
  const potAfterCall = potSize + callAmount;
  return {
    callAmount,
    potAfterCall,
    breakEvenPercent: (callAmount / potAfterCall) * 100,
    ratioToOne: potSize / callAmount,
  };
}
