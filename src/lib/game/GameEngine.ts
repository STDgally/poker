import { createDeck, shuffle } from './deck';
import { determineWinners } from './handEvaluator';
import {
  Card,
  GameState,
  HandResult,
  LegalActions,
  PlayerAction,
  PlayerActionType,
  PlayerState,
  PotShare,
  SeedPlayer,
  Street,
} from './types';

/**
 * Drives a single Texas Hold'em table: shuffles/deals the deck, validates and
 * applies player actions, advances betting rounds (Preflop -> Flop -> Turn ->
 * River -> Showdown), and settles the pot (including side pots).
 *
 * The engine is intentionally UI- and bot-agnostic: callers (a human via the
 * UI, or a bot policy in Step 2) drive it exclusively through applyAction().
 */
export class GameEngine {
  private state: GameState;

  constructor(seedPlayers: SeedPlayer[], smallBlind: number, bigBlind: number, dealerSeat = 0) {
    if (seedPlayers.length < 2) {
      throw new Error('GameEngine requires at least 2 players');
    }

    this.state = {
      handNumber: 0,
      street: Street.PREFLOP,
      deck: [],
      board: [],
      players: seedPlayers.map((p) => ({
        ...p,
        holeCards: [],
        isFolded: false,
        isAllIn: false,
        currentStreetBet: 0,
        totalHandContribution: 0,
        hasActedThisStreet: false,
      })),
      dealerSeat,
      sbSeat: dealerSeat,
      bbSeat: dealerSeat,
      smallBlind,
      bigBlind,
      pots: [],
      currentBet: 0,
      minRaise: bigBlind,
      actionOnSeat: null,
      lastAggressorSeat: null,
      isHandComplete: false,
      winners: [],
    };
  }

  getState(): Readonly<GameState> {
    return this.state;
  }

  /** Total chips committed so far this hand, i.e. the pot shown on the table mid-hand. */
  getDisplayPot(): number {
    return this.state.players.reduce((sum, p) => sum + p.totalHandContribution, 0);
  }

  getLegalActions(playerId: string): LegalActions | null {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || player.seat !== this.state.actionOnSeat || player.isFolded || player.isAllIn) {
      return null;
    }

    const callAmount = Math.min(this.state.currentBet - player.currentStreetBet, player.stack);
    const actions: PlayerActionType[] = [PlayerActionType.FOLD];
    actions.push(callAmount <= 0 ? PlayerActionType.CHECK : PlayerActionType.CALL);

    const minRaiseTo = this.state.currentBet + this.state.minRaise;
    const maxRaiseTo = player.currentStreetBet + player.stack;
    if (maxRaiseTo > this.state.currentBet) {
      actions.push(this.state.currentBet === 0 ? PlayerActionType.BET : PlayerActionType.RAISE);
    }
    actions.push(PlayerActionType.ALL_IN);

    return { actions, callAmount: Math.max(callAmount, 0), minRaiseTo, maxRaiseTo };
  }

  /** Resets and deals a new hand. Rotates the dealer button before dealing, except for the very first hand. */
  startHand(): void {
    if (this.state.handNumber > 0) {
      this.state.dealerSeat = this.findNextSeat(this.state.dealerSeat, (p) => p.stack > 0) ?? this.state.dealerSeat;
    }

    this.state.handNumber += 1;
    this.state.street = Street.PREFLOP;
    this.state.board = [];
    this.state.deck = shuffle(createDeck());
    this.state.pots = [];
    this.state.winners = [];
    this.state.currentBet = 0;
    this.state.minRaise = this.state.bigBlind;
    this.state.lastAggressorSeat = null;
    this.state.isHandComplete = false;

    this.state.players.forEach((p) => {
      p.holeCards = [];
      p.isFolded = p.stack <= 0;
      p.isAllIn = false;
      p.currentStreetBet = 0;
      p.totalHandContribution = 0;
      p.hasActedThisStreet = false;
    });

    this.dealHoleCards();
    this.postBlinds();

    const liveCount = this.state.players.filter((p) => !p.isFolded).length;
    this.state.actionOnSeat =
      liveCount === 2 ? this.state.sbSeat : this.findNextSeat(this.state.bbSeat, (p) => !p.isFolded && !p.isAllIn);
  }

  /** Applies a single player action and advances the hand (next actor, next street, or showdown). */
  applyAction(playerId: string, action: PlayerAction): void {
    if (this.state.isHandComplete) {
      throw new Error('Hand is already complete; call startHand() to begin a new one');
    }

    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) throw new Error(`Unknown player: ${playerId}`);
    if (this.state.actionOnSeat !== player.seat) {
      throw new Error(`It is not ${player.name}'s turn to act`);
    }
    if (player.isFolded || player.isAllIn) {
      throw new Error(`${player.name} cannot act (folded or all-in)`);
    }

    const callAmount = this.state.currentBet - player.currentStreetBet;

    switch (action.type) {
      case PlayerActionType.FOLD:
        player.isFolded = true;
        break;

      case PlayerActionType.CHECK:
        if (callAmount > 0) throw new Error(`${player.name} cannot check, must call ${callAmount} or fold`);
        break;

      case PlayerActionType.CALL: {
        if (callAmount <= 0) throw new Error(`${player.name} has nothing to call, use CHECK instead`);
        this.commitChips(player, Math.min(callAmount, player.stack));
        break;
      }

      case PlayerActionType.BET:
      case PlayerActionType.RAISE: {
        if (action.amount === undefined) throw new Error('BET/RAISE requires an amount (the total raise-to value)');
        const minRaiseTo = this.state.currentBet + this.state.minRaise;
        const maxRaiseTo = player.currentStreetBet + player.stack;
        if (action.amount < minRaiseTo && action.amount < maxRaiseTo) {
          throw new Error(`${player.name}'s raise must be at least ${minRaiseTo} (or shove ${maxRaiseTo} all-in)`);
        }
        this.raiseTo(player, Math.min(action.amount, maxRaiseTo));
        break;
      }

      case PlayerActionType.ALL_IN: {
        this.raiseTo(player, player.currentStreetBet + player.stack);
        break;
      }

      default:
        throw new Error(`Unsupported action type: ${action.type}`);
    }

    player.hasActedThisStreet = true;
    this.advanceAfterAction(player.seat);
  }

  // ---------------------------------------------------------------------
  // Internal betting mechanics
  // ---------------------------------------------------------------------

  /** Commits chips for a raise/bet/all-in and, if it actually increases currentBet, reopens the action. */
  private raiseTo(player: PlayerState, raiseToAmount: number): void {
    const delta = raiseToAmount - player.currentStreetBet;
    this.commitChips(player, delta);

    if (raiseToAmount > this.state.currentBet) {
      const increment = raiseToAmount - this.state.currentBet;
      // A short all-in below the standard minimum raise commits chips but does not reopen the action.
      if (increment >= this.state.minRaise) {
        this.state.minRaise = increment;
        this.resetActedFlagsExcept(player.seat);
      }
      this.state.currentBet = raiseToAmount;
      this.state.lastAggressorSeat = player.seat;
    }
  }

  private commitChips(player: PlayerState, amount: number): void {
    const actual = Math.min(amount, player.stack);
    player.stack -= actual;
    player.currentStreetBet += actual;
    player.totalHandContribution += actual;
    if (player.stack === 0) player.isAllIn = true;
  }

  private resetActedFlagsExcept(seat: number): void {
    this.state.players.forEach((p) => {
      if (p.seat !== seat) p.hasActedThisStreet = false;
    });
  }

  private advanceAfterAction(actingSeat: number): void {
    if (this.activePlayers().length === 1) {
      this.awardPotToLastRemaining();
      return;
    }

    if (this.isBettingRoundComplete()) {
      this.moveToNextStreet();
      return;
    }

    const next = this.findNextSeat(actingSeat, (p) => !p.isFolded && !p.isAllIn);
    if (next === null) {
      this.moveToNextStreet();
      return;
    }
    this.state.actionOnSeat = next;
  }

  private isBettingRoundComplete(): boolean {
    const contenders = this.activePlayers().filter((p) => !p.isAllIn);
    if (contenders.length === 0) return true;
    return contenders.every((p) => p.hasActedThisStreet && p.currentStreetBet === this.state.currentBet);
  }

  private moveToNextStreet(): void {
    this.state.players.forEach((p) => {
      p.currentStreetBet = 0;
      p.hasActedThisStreet = false;
    });
    this.state.currentBet = 0;
    this.state.minRaise = this.state.bigBlind;
    this.state.lastAggressorSeat = null;

    switch (this.state.street) {
      case Street.PREFLOP:
        this.state.board.push(...this.burnAndDeal(3));
        this.state.street = Street.FLOP;
        break;
      case Street.FLOP:
        this.state.board.push(...this.burnAndDeal(1));
        this.state.street = Street.TURN;
        break;
      case Street.TURN:
        this.state.board.push(...this.burnAndDeal(1));
        this.state.street = Street.RIVER;
        break;
      case Street.RIVER:
        this.state.street = Street.SHOWDOWN;
        this.resolveShowdown();
        return;
      case Street.SHOWDOWN:
        return;
    }

    // If at most one player still has chips to act with, no more betting is possible this
    // hand (there is nobody left who could call or fold to a bet) — deal the rest of the
    // board out automatically instead of asking that lone player for a decision.
    const nextActor = this.canBettingContinue()
      ? this.findNextSeat(this.state.dealerSeat, (p) => !p.isFolded && !p.isAllIn)
      : null;
    if (nextActor === null) {
      this.moveToNextStreet();
      return;
    }
    this.state.actionOnSeat = nextActor;
  }

  private canBettingContinue(): boolean {
    return this.activePlayers().filter((p) => !p.isAllIn).length > 1;
  }

  // ---------------------------------------------------------------------
  // Dealing
  // ---------------------------------------------------------------------

  private dealHoleCards(): void {
    const liveCount = this.state.players.filter((p) => p.stack > 0).length;
    const startSeat =
      liveCount === 2
        ? this.state.dealerSeat
        : this.findNextSeat(this.state.dealerSeat, (p) => p.stack > 0) ?? this.state.dealerSeat;
    const order = this.seatsInOrderFrom(startSeat).filter((p) => p.stack > 0);

    for (let i = 0; i < 2; i++) {
      for (const p of order) {
        p.holeCards.push(this.state.deck.pop() as Card);
      }
    }
  }

  private postBlinds(): void {
    const liveCount = this.state.players.filter((p) => p.stack > 0).length;
    let sbSeat: number;
    let bbSeat: number;

    if (liveCount === 2) {
      // Heads-up exception: the dealer posts the small blind and acts first preflop.
      sbSeat = this.state.dealerSeat;
      bbSeat = this.findNextSeat(sbSeat, (p) => p.stack > 0) ?? sbSeat;
    } else {
      sbSeat = this.findNextSeat(this.state.dealerSeat, (p) => p.stack > 0) ?? this.state.dealerSeat;
      bbSeat = this.findNextSeat(sbSeat, (p) => p.stack > 0) ?? sbSeat;
    }

    this.state.sbSeat = sbSeat;
    this.state.bbSeat = bbSeat;
    this.commitChips(this.getPlayerBySeat(sbSeat), this.state.smallBlind);
    this.commitChips(this.getPlayerBySeat(bbSeat), this.state.bigBlind);
    this.state.currentBet = this.state.bigBlind;
  }

  private burnAndDeal(count: number): Card[] {
    this.state.deck.pop(); // burn
    const dealt: Card[] = [];
    for (let i = 0; i < count; i++) {
      dealt.push(this.state.deck.pop() as Card);
    }
    return dealt;
  }

  // ---------------------------------------------------------------------
  // Showdown & pot settlement
  // ---------------------------------------------------------------------

  private awardPotToLastRemaining(): void {
    const winner = this.activePlayers()[0];
    const potTotal = this.state.players.reduce((sum, p) => sum + p.totalHandContribution, 0);
    winner.stack += potTotal;
    this.state.pots = [{ amount: potTotal, eligiblePlayerIds: [winner.id] }];
    this.state.winners = [{ playerId: winner.id, amountWon: potTotal }];
    this.state.actionOnSeat = null;
    this.state.isHandComplete = true;
  }

  private resolveShowdown(): void {
    const pots = this.computePots();
    const results = new Map<string, HandResult>();

    for (const pot of pots) {
      const contestants = pot.eligiblePlayerIds.map((id) => {
        const p = this.getPlayerById(id);
        return { playerId: p.id, holeCards: p.holeCards };
      });

      const winners = determineWinners(contestants, this.state.board);
      const share = Math.floor(pot.amount / winners.length);
      let remainder = pot.amount - share * winners.length;

      // Deterministic remainder assignment: give odd chips to winners in seat order after the dealer.
      const orderedWinners = this.seatsInOrderFrom(this.state.dealerSeat).filter((p) =>
        winners.some((w) => w.playerId === p.id),
      );

      for (const w of orderedWinners) {
        const winnerEval = winners.find((x) => x.playerId === w.id)!;
        const extra = remainder > 0 ? 1 : 0;
        if (remainder > 0) remainder -= 1;
        const amountWon = share + extra;
        w.stack += amountWon;

        const existing = results.get(w.id);
        results.set(w.id, {
          playerId: w.id,
          amountWon: (existing?.amountWon ?? 0) + amountWon,
          handDescription: winnerEval.hand.descr,
        });
      }
    }

    this.state.pots = pots;
    this.state.winners = Array.from(results.values());
    this.state.actionOnSeat = null;
    this.state.isHandComplete = true;
  }

  /** Standard side-pot algorithm based on cumulative contribution levels. */
  private computePots(): PotShare[] {
    const contributors = this.state.players.filter((p) => p.totalHandContribution > 0);
    const levels = Array.from(new Set(contributors.map((p) => p.totalHandContribution))).sort((a, b) => a - b);

    const pots: PotShare[] = [];
    let previousLevel = 0;

    for (const level of levels) {
      const layerContributors = contributors.filter((p) => p.totalHandContribution >= level);
      const eligible = layerContributors.filter((p) => !p.isFolded).map((p) => p.id);
      const amount = (level - previousLevel) * layerContributors.length;

      if (amount > 0 && eligible.length > 0) {
        pots.push({ amount, eligiblePlayerIds: eligible });
      }
      previousLevel = level;
    }

    return pots;
  }

  // ---------------------------------------------------------------------
  // Seat helpers
  // ---------------------------------------------------------------------

  private activePlayers(): PlayerState[] {
    return this.state.players.filter((p) => !p.isFolded);
  }

  private getPlayerBySeat(seat: number): PlayerState {
    const player = this.state.players.find((p) => p.seat === seat);
    if (!player) throw new Error(`No player at seat ${seat}`);
    return player;
  }

  private getPlayerById(id: string): PlayerState {
    const player = this.state.players.find((p) => p.id === id);
    if (!player) throw new Error(`Unknown player id ${id}`);
    return player;
  }

  private getOrderedPlayers(): PlayerState[] {
    return [...this.state.players].sort((a, b) => a.seat - b.seat);
  }

  private seatsInOrderFrom(seat: number): PlayerState[] {
    const ordered = this.getOrderedPlayers();
    const idx = ordered.findIndex((p) => p.seat === seat);
    if (idx === -1) return ordered;
    return [...ordered.slice(idx), ...ordered.slice(0, idx)];
  }

  /** Finds the next seat clockwise from (but excluding) `fromSeat` that satisfies `predicate`. */
  private findNextSeat(fromSeat: number, predicate: (p: PlayerState) => boolean): number | null {
    const ordered = this.getOrderedPlayers();
    const n = ordered.length;
    const startIdx = ordered.findIndex((p) => p.seat === fromSeat);
    if (startIdx === -1) return null;

    for (let i = 1; i <= n; i++) {
      const candidate = ordered[(startIdx + i) % n];
      if (predicate(candidate)) return candidate.seat;
    }
    return null;
  }
}
