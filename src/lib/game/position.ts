// Fixed 6-max position naming, indexed by seat offset clockwise from the dealer button.
const SIX_MAX_POSITIONS = ['BTN', 'SB', 'BB', 'UTG', 'MP', 'CO'];

/** Returns a human-readable position label (BTN, SB, BB, UTG, ...) for a seat. */
export function getPositionLabel(seat: number, dealerSeat: number, totalSeats: number): string {
  const relative = ((seat - dealerSeat) % totalSeats + totalSeats) % totalSeats;

  if (totalSeats === SIX_MAX_POSITIONS.length) {
    return SIX_MAX_POSITIONS[relative];
  }

  if (relative === 0) return 'BTN';
  if (relative === 1) return 'SB';
  if (relative === 2) return 'BB';
  return `UTG+${relative - 3}`;
}
