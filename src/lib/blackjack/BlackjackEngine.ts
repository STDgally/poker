import { createShoe, needsReshuffle as computeNeedsReshuffle } from './shoe';
import { computeHandValue, isPair, TEN_VALUE_RANKS } from './handValue';
import {
  BlackjackGameState,
  BlackjackPhase,
  BlackjackRules,
  BoxAction,
  BoxState,
  Card,
  DEFAULT_RULES,
  LegalBoxActions,
  SeatState,
} from './types';

/** The table always has exactly 3 betting spots the hero can claim by sitting down. */
const SEAT_COUNT = 3;

/**
 * Drives a single Blackjack table: seating, shoe management, dealing,
 * insurance, hit/stand/double/split/surrender per box, dealer play, and
 * payout settlement. Mirrors the poker GameEngine's design: in-place
 * mutated state and a single getState() accessor. There are no bots — every
 * occupied seat belongs to the hero, and all seats share one bankroll.
 */
export class BlackjackEngine {
  private state: BlackjackGameState;

  constructor(heroStartingBankroll: number, rulesOverride: Partial<BlackjackRules> = {}) {
    const rules: BlackjackRules = { ...DEFAULT_RULES, ...rulesOverride };
    const shoe = createShoe(rules.numDecks);

    const seats: SeatState[] = Array.from({ length: SEAT_COUNT }, (_, i) => ({
      seat: i,
      occupant: 'EMPTY',
      name: '',
      boxes: [],
    }));

    this.state = {
      rules,
      shoe,
      shoeSize: shoe.length,
      seats,
      dealer: { cards: [], holeCardRevealed: false },
      phase: BlackjackPhase.BETTING,
      activeBoxId: null,
      roundNumber: 0,
      needsReshuffle: false,
      heroBankroll: heroStartingBankroll,
    };
  }

  getState(): Readonly<BlackjackGameState> {
    return this.state;
  }

  // ---------------------------------------------------------------------
  // Seating
  // ---------------------------------------------------------------------

  claimSeat(seatIndex: number, name: string): void {
    if (this.state.phase !== BlackjackPhase.BETTING) throw new Error('Puoi sederti solo mentre si punta');
    const seat = this.state.seats.find((s) => s.seat === seatIndex);
    if (!seat) throw new Error('Postazione inesistente');
    if (seat.occupant !== 'EMPTY') throw new Error('Postazione già occupata');
    seat.occupant = 'HERO';
    seat.name = name;
  }

  leaveSeat(seatIndex: number): void {
    if (this.state.phase !== BlackjackPhase.BETTING) throw new Error('Non puoi alzarti a mano in corso');
    const seat = this.state.seats.find((s) => s.seat === seatIndex);
    if (!seat) throw new Error('Postazione inesistente');
    seat.occupant = 'EMPTY';
    seat.name = '';
    seat.boxes = [];
  }

  // ---------------------------------------------------------------------
  // Betting & dealing
  // ---------------------------------------------------------------------

  /** Places the same bet amount on every seat the hero occupies, then deals the round. */
  startRound(betAmount: number): void {
    if (this.state.phase !== BlackjackPhase.BETTING) throw new Error('Not in betting phase');

    const occupiedSeats = this.state.seats.filter((s) => s.occupant === 'HERO');
    if (occupiedSeats.length === 0) throw new Error('Occupa almeno una postazione prima di distribuire');
    if (betAmount < this.state.rules.minBet || betAmount > this.state.rules.maxBet) {
      throw new Error(`Puntata ${betAmount} fuori dai limiti del tavolo (${this.state.rules.minBet}-${this.state.rules.maxBet})`);
    }
    if (betAmount * occupiedSeats.length > this.state.heroBankroll) {
      throw new Error('Saldo insufficiente per coprire la puntata su tutte le postazioni');
    }

    if (this.state.needsReshuffle) {
      this.state.shoe = createShoe(this.state.rules.numDecks);
      this.state.shoeSize = this.state.shoe.length;
      this.state.needsReshuffle = false;
    }

    this.state.roundNumber += 1;
    this.state.dealer = { cards: [], holeCardRevealed: false };

    for (const seat of this.state.seats) {
      seat.boxes = [];
      if (seat.occupant !== 'HERO') continue;
      this.state.heroBankroll -= betAmount;
      seat.boxes.push(this.createBox(seat.seat, 0, betAmount));
    }

    // Standard casino deal order: one card to every box then the dealer, twice.
    for (let round = 0; round < 2; round++) {
      for (const seat of this.state.seats) {
        for (const box of seat.boxes) box.cards.push(this.drawCard());
      }
      this.state.dealer.cards.push(this.drawCard());
    }

    for (const seat of this.state.seats) {
      for (const box of seat.boxes) {
        box.isBlackjack = computeHandValue(box.cards).isBlackjack;
      }
    }

    const dealerUp = this.state.dealer.cards[0];
    if (dealerUp[0] === 'A') {
      this.state.phase = BlackjackPhase.INSURANCE;
      this.state.activeBoxId = this.findNextInsuranceBoxId(null);
      if (!this.state.activeBoxId) {
        // No boxes at all (shouldn't happen — startRound requires at least the hero) — settle straight away.
        this.beginPlayerTurns();
      }
      return;
    }

    if (TEN_VALUE_RANKS.has(dealerUp[0]) && computeHandValue(this.state.dealer.cards).isBlackjack) {
      this.resolveDealerBlackjack();
      return;
    }

    this.beginPlayerTurns();
  }

  /** Call after ROUND_COMPLETE to return to the betting phase for the next round. */
  prepareNextRound(): void {
    if (this.state.phase !== BlackjackPhase.ROUND_COMPLETE) throw new Error('Round is not complete yet');
    this.state.needsReshuffle = computeNeedsReshuffle(this.state.shoe, this.state.rules.numDecks, this.state.rules.penetration);
    this.state.phase = BlackjackPhase.BETTING;
    this.state.activeBoxId = null;
  }

  // ---------------------------------------------------------------------
  // Insurance
  // ---------------------------------------------------------------------

  applyInsuranceDecision(boxId: string, takeInsurance: boolean): void {
    if (this.state.phase !== BlackjackPhase.INSURANCE) throw new Error('Not in the insurance phase');
    if (this.state.activeBoxId !== boxId) throw new Error("It is not this box's insurance decision");

    const { seat, box } = this.findBoxOrThrow(boxId);
    box.insuranceDecided = true;

    if (takeInsurance) {
      const insuranceAmount = Math.floor(box.bet / 2);
      if (insuranceAmount > this.state.heroBankroll) throw new Error('Insufficient bankroll for insurance');
      this.state.heroBankroll -= insuranceAmount;
      box.insuranceBet = insuranceAmount;
    }

    const next = this.findNextInsuranceBoxId(boxId);
    if (next) {
      this.state.activeBoxId = next;
      return;
    }

    if (computeHandValue(this.state.dealer.cards).isBlackjack) {
      this.resolveDealerBlackjack();
    } else {
      this.beginPlayerTurns();
    }
  }

  // ---------------------------------------------------------------------
  // Player turns
  // ---------------------------------------------------------------------

  getLegalActions(boxId: string): LegalBoxActions | null {
    if (this.state.phase !== BlackjackPhase.PLAYER_TURNS || this.state.activeBoxId !== boxId) return null;
    const { box } = this.findBoxOrThrow(boxId);

    const actions: BoxAction[] = ['HIT', 'STAND'];
    const isFirstDecision = box.cards.length === 2;

    if (isFirstDecision && this.state.heroBankroll >= box.bet && (!box.isFromSplit || this.state.rules.doubleAfterSplit)) {
      actions.push('DOUBLE');
    }
    if (isFirstDecision && isPair(box.cards) && this.state.heroBankroll >= box.bet && box.splitDepth < this.state.rules.maxSplits) {
      actions.push('SPLIT');
    }
    if (isFirstDecision && !box.isFromSplit && this.state.rules.lateSurrender) {
      actions.push('SURRENDER');
    }

    return { actions, minBet: this.state.rules.minBet, maxBet: this.state.rules.maxBet };
  }

  applyAction(boxId: string, action: BoxAction): void {
    if (this.state.phase !== BlackjackPhase.PLAYER_TURNS) throw new Error('Not in the player-turns phase');
    if (this.state.activeBoxId !== boxId) throw new Error("It is not this box's turn");

    const { seat, box } = this.findBoxOrThrow(boxId);
    let shouldAdvance = false;

    switch (action) {
      case 'HIT': {
        box.cards.push(this.drawCard());
        const value = computeHandValue(box.cards);
        if (value.isBust) {
          box.isBust = true;
          box.isStanding = true;
          box.isResolved = true;
          box.result = 'LOSE';
          box.payout = -box.bet - box.insuranceBet;
        }
        shouldAdvance = value.isBust;
        break;
      }

      case 'STAND': {
        box.isStanding = true;
        shouldAdvance = true;
        break;
      }

      case 'DOUBLE': {
        if (this.state.heroBankroll < box.bet) throw new Error('Insufficient bankroll to double');
        this.state.heroBankroll -= box.bet;
        box.bet *= 2;
        box.isDoubled = true;
        box.cards.push(this.drawCard());
        box.isStanding = true;
        const value = computeHandValue(box.cards);
        if (value.isBust) {
          box.isBust = true;
          box.isResolved = true;
          box.result = 'LOSE';
          box.payout = -box.bet - box.insuranceBet;
        }
        shouldAdvance = true;
        break;
      }

      case 'SPLIT': {
        if (!isPair(box.cards)) throw new Error('Cannot split a non-pair');
        if (this.state.heroBankroll < box.bet) throw new Error('Insufficient bankroll to split');

        const isAcesSplit = box.cards[0][0] === 'A';
        const secondCard = box.cards.pop()!;
        this.state.heroBankroll -= box.bet;

        const newBoxIndex = this.nextBoxIndexForSeat(seat);
        const newBox: BoxState = {
          id: `${seat.seat}-${newBoxIndex}`,
          seat: seat.seat,
          boxIndex: newBoxIndex,
          cards: [secondCard],
          bet: box.bet,
          insuranceBet: 0,
          insuranceDecided: true,
          isDoubled: false,
          isFromSplit: true,
          isSplitAces: isAcesSplit,
          splitDepth: box.splitDepth + 1,
          isBlackjack: false,
          isBust: false,
          isSurrendered: false,
          isStanding: false,
          isResolved: false,
          result: null,
          payout: 0,
        };

        box.isFromSplit = true;
        box.isSplitAces = isAcesSplit;
        box.splitDepth += 1;

        const boxArrayIndex = seat.boxes.findIndex((b) => b.id === box.id);
        seat.boxes.splice(boxArrayIndex + 1, 0, newBox);

        box.cards.push(this.drawCard());
        newBox.cards.push(this.drawCard());

        if (isAcesSplit) {
          box.isStanding = true;
          newBox.isStanding = true;
        }
        shouldAdvance = isAcesSplit;
        break;
      }

      case 'SURRENDER': {
        box.isSurrendered = true;
        box.isStanding = true;
        box.isResolved = true;
        box.result = 'SURRENDER';
        box.payout = -box.bet / 2 - box.insuranceBet;
        this.state.heroBankroll += box.bet / 2;
        shouldAdvance = true;
        break;
      }

      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    if (shouldAdvance) this.advanceTurn();
  }

  // ---------------------------------------------------------------------
  // Dealer turn & settlement
  // ---------------------------------------------------------------------

  private advanceTurn(): void {
    const next = this.findNextActionableBoxId(this.state.activeBoxId);
    if (next) {
      this.state.activeBoxId = next;
      return;
    }
    this.state.activeBoxId = null;
    this.runDealerTurn();
  }

  private runDealerTurn(): void {
    this.state.phase = BlackjackPhase.DEALER_TURN;
    this.state.dealer.holeCardRevealed = true;

    const anyLiveBox = this.getAllBoxesInTurnOrder().some((b) => !b.isResolved);
    if (anyLiveBox) {
      let value = computeHandValue(this.state.dealer.cards);
      while (!value.isBust && (value.total < 17 || (value.total === 17 && value.isSoft && this.state.rules.dealerHitsSoft17))) {
        this.state.dealer.cards.push(this.drawCard());
        value = computeHandValue(this.state.dealer.cards);
      }
    }

    this.settleRound();
  }

  private settleRound(): void {
    const dealerValue = computeHandValue(this.state.dealer.cards);

    for (const seat of this.state.seats) {
      for (const box of seat.boxes) {
        if (box.isResolved) continue;

        const boxValue = computeHandValue(box.cards);

        if (dealerValue.isBust || boxValue.total > dealerValue.total) {
          box.result = 'WIN';
          box.payout = box.bet - box.insuranceBet;
          this.state.heroBankroll += box.bet * 2;
        } else if (boxValue.total < dealerValue.total) {
          box.result = 'LOSE';
          box.payout = -box.bet - box.insuranceBet;
        } else {
          box.result = 'PUSH';
          box.payout = -box.insuranceBet;
          this.state.heroBankroll += box.bet;
        }

        box.isResolved = true;
      }
    }

    this.state.phase = BlackjackPhase.ROUND_COMPLETE;
    this.state.activeBoxId = null;
  }

  private resolveDealerBlackjack(): void {
    this.state.dealer.holeCardRevealed = true;

    for (const seat of this.state.seats) {
      for (const box of seat.boxes) {
        let payout = 0;

        if (box.insuranceBet > 0) {
          this.state.heroBankroll += box.insuranceBet * 3; // stake back + 2:1 profit
          payout += box.insuranceBet * 2;
        }

        if (box.isBlackjack) {
          this.state.heroBankroll += box.bet; // push: original bet returned
          box.result = 'PUSH';
        } else {
          box.result = 'LOSE';
          payout -= box.bet;
        }

        box.isResolved = true;
        box.payout = payout;
      }
    }

    this.state.phase = BlackjackPhase.ROUND_COMPLETE;
    this.state.activeBoxId = null;
  }

  private beginPlayerTurns(): void {
    // Resolve every natural blackjack immediately now that we know the dealer doesn't have one.
    for (const seat of this.state.seats) {
      for (const box of seat.boxes) {
        if (box.isBlackjack) {
          box.isResolved = true;
          box.result = 'BLACKJACK';
          const winnings = box.bet * this.state.rules.blackjackPayout;
          box.payout = winnings - box.insuranceBet;
          this.state.heroBankroll += box.bet + winnings;
        }
      }
    }

    this.state.phase = BlackjackPhase.PLAYER_TURNS;
    const next = this.findNextActionableBoxId(null);
    if (next) {
      this.state.activeBoxId = next;
    } else {
      this.state.activeBoxId = null;
      this.runDealerTurn();
    }
  }

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------

  private createBox(seat: number, boxIndex: number, bet: number): BoxState {
    return {
      id: `${seat}-${boxIndex}`,
      seat,
      boxIndex,
      cards: [],
      bet,
      insuranceBet: 0,
      insuranceDecided: false,
      isDoubled: false,
      isFromSplit: false,
      isSplitAces: false,
      splitDepth: 0,
      isBlackjack: false,
      isBust: false,
      isSurrendered: false,
      isStanding: false,
      isResolved: false,
      result: null,
      payout: 0,
    };
  }

  private nextBoxIndexForSeat(seat: SeatState): number {
    return Math.max(-1, ...seat.boxes.map((b) => b.boxIndex)) + 1;
  }

  private getAllBoxesInTurnOrder(): BoxState[] {
    const boxes: BoxState[] = [];
    for (const seat of this.state.seats) {
      for (const box of seat.boxes) boxes.push(box);
    }
    return boxes;
  }

  private findNextActionableBoxId(afterId: string | null): string | null {
    const order = this.getAllBoxesInTurnOrder();
    const startIdx = afterId ? order.findIndex((b) => b.id === afterId) : -1;
    for (let i = startIdx + 1; i < order.length; i++) {
      if (!order[i].isResolved && !order[i].isStanding) return order[i].id;
    }
    return null;
  }

  private findNextInsuranceBoxId(afterId: string | null): string | null {
    const order = this.getAllBoxesInTurnOrder();
    const startIdx = afterId ? order.findIndex((b) => b.id === afterId) : -1;
    for (let i = startIdx + 1; i < order.length; i++) {
      if (!order[i].insuranceDecided) return order[i].id;
    }
    return null;
  }

  private findBoxOrThrow(boxId: string): { seat: SeatState; box: BoxState } {
    for (const seat of this.state.seats) {
      const box = seat.boxes.find((b) => b.id === boxId);
      if (box) return { seat, box };
    }
    throw new Error(`Unknown box id: ${boxId}`);
  }

  private drawCard(): Card {
    const card = this.state.shoe.pop();
    if (!card) throw new Error('Shoe is empty');
    return card;
  }
}
