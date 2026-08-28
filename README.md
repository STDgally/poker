# Poker Simulator & Analytics

Texas Hold'em offline trainer contro bot AI, con tracking delle hand history e statistiche.

Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Zustand (front-end),
Prisma + MySQL (persistenza), `pokersolver` (valutazione mani).

## Stato del progetto

- **STEP 1 (completato):** schema Prisma (`User`, `Session`, `HandHistory`, `ActionLog`) e classe
  `GameEngine` (mazzo, blind, turni di puntata, side pot, showdown).
- **STEP 2 (completato):** profili bot TAG / Calling Station e logica di decisione basata su
  equity (Monte Carlo).
- **STEP 3 (completato):** tavolo React (Zustand + `GameEngine`), HUD bot, controlli umani.
- **STEP 4 (completato):** persistenza hand history su MySQL via Prisma + dashboard `/dashboard`
  con grafico bankroll e statistiche aggregate (VPIP, PFR, BB/100).
- **Extra (completato):** controlli di puntata in stile client PokerStars (preset Min/BB/Piatto/
  Max, stepper, slider), effetti sonori, pagina `/settings` (unità BB/chips, colore tavolo,
  audio), pannello info in-game con equity/pot odds/outs/range avversari per posizione.

## Setup ambiente locale

### Prerequisiti

- Node.js 18.18+ (consigliato 20 o 22)
- Un server MySQL 8.x raggiungibile localmente (nativo, Docker, o servizio gestito)

### 1. Installa le dipendenze

```bash
npm install
```

### 2. Configura le variabili d'ambiente

```bash
cp .env.example .env
```

Modifica `.env` con le credenziali del tuo MySQL:

```
DATABASE_URL="mysql://poker_user:poker_password@localhost:3306/poker_simulator"
```

Se non hai già un'istanza MySQL locale, puoi avviarne una rapidamente con Docker:

```bash
docker run --name poker-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=poker_simulator \
  -e MYSQL_USER=poker_user \
  -e MYSQL_PASSWORD=poker_password \
  -p 3306:3306 -d mysql:8
```

### 3. Genera il client Prisma e applica lo schema al database

```bash
npm run prisma:generate
npm run prisma:migrate
```

Il comando `prisma:migrate` chiederà un nome per la migrazione (es. `init`) e creerà le tabelle
`User`, `Session`, `HandHistory`, `ActionLog` nel database configurato.

Per ispezionare i dati via GUI:

```bash
npm run prisma:studio
```

### 4. Avvia l'app in sviluppo

```bash
npm run dev
```

App disponibile su http://localhost:3000.

### Altri comandi utili

```bash
npm run build       # build di produzione
npm run start        # avvia il build di produzione
npm run lint          # ESLint
npm run typecheck    # controllo tipi TypeScript senza emettere output
```

## Struttura del codice (Step 1)

```
prisma/
  schema.prisma          # modelli User, Session, HandHistory, ActionLog
src/
  lib/
    prisma.ts             # singleton PrismaClient
    game/
      types.ts             # tipi di dominio condivisi (Card, GameState, PlayerAction, ...)
      deck.ts               # creazione/shuffle del mazzo
      handEvaluator.ts   # wrapper tipizzato su pokersolver
      GameEngine.ts       # motore di gioco: blind, turni, pot, showdown
    bots/
      types.ts               # BotProfileConfig, BotProfileType
      profiles.ts             # profili TAG_PROFILE e CALLING_STATION_PROFILE
      equity.ts                # stima equity via simulazione Monte Carlo
      botPolicy.ts             # decideBotAction(): sceglie fold/check/call/bet/raise
      runBot.ts                 # playBotAction(engine, playerId, profile): integra con GameEngine
  types/
    pokersolver.d.ts     # dichiarazione di tipo per pokersolver (non tipizzato upstream)
  store/
    tableStore.ts          # Zustand: avvolge GameEngine, guida i bot in automatico, log azioni
  components/table/
    PokerTable.tsx          # composizione principale del tavolo (6-max)
    PlayerSeat.tsx           # seat: carte, stack, dealer button, HUD bot
    PlayingCard.tsx          # singola carta (fronte/retro/slot vuoto)
    PotDisplay.tsx           # board + pot centrale
    ActionControls.tsx      # Fold, Check/Call, slider Raise per l'utente umano
  app/
    layout.tsx, page.tsx, globals.css   # rende <PokerTable /> come home page
    api/
      sessions/route.ts    # POST: crea una Session (avvio tavolo)
      hands/route.ts         # POST: salva una HandHistory + i suoi ActionLog
    dashboard/page.tsx      # Server Component: legge le statistiche via Prisma
  components/dashboard/
    BankrollChart.tsx        # grafico Recharts: bankroll cumulativo vs mani giocate
    StatsTable.tsx             # tabella: mani giocate, BB/100, VPIP, PFR, ...
  lib/
    analytics.ts               # getUserStats(): aggregazione Prisma per la dashboard
    localUser.ts                # profilo locale unico (nessun sistema di auth nell'MVP)
    hands/types.ts              # contratti condivisi client/API per il tracking mani
```

### `GameEngine`: uso di base

```ts
import { GameEngine } from '@/lib/game/GameEngine';
import { PlayerActionType } from '@/lib/game/types';

const engine = new GameEngine(
  [
    { id: 'hero', name: 'Hero', seat: 0, stack: 1000, isBot: false },
    { id: 'bot1', name: 'Bot TAG', seat: 1, stack: 1000, isBot: true },
  ],
  5,   // small blind
  10,  // big blind
);

engine.startHand();
engine.getState();                      // stato immutabile corrente
engine.getLegalActions('hero');         // azioni legali + call/raise amount per il giocatore di turno
engine.applyAction('hero', { type: PlayerActionType.CALL });
```

Il motore gestisce automaticamente: rotazione del bottone, regola heads-up (dealer = SB),
apertura/chiusura dei giri di puntata, calcolo dei side pot in caso di all-in multipli, e
valutazione dello showdown tramite `pokersolver`.

### Bot: uso di base

```ts
import { playBotAction } from '@/lib/bots/runBot';
import { TAG_PROFILE, CALLING_STATION_PROFILE } from '@/lib/bots/profiles';

// Quando è il turno del bot 'bot1' (verificabile con engine.getState().actionOnSeat):
playBotAction(engine, 'bot1', TAG_PROFILE);
```

`playBotAction` legge stato e azioni legali dall'engine, decide un'azione tramite
`decideBotAction()` e la applica con `engine.applyAction()`.

**Come decide un bot:** ad ogni turno stima la propria *equity* (probabilità di vincere lo
showdown) con una simulazione Monte Carlo che pesca carte casuali per gli avversari e per il
board mancante (`estimateEquity`, in `equity.ts`) — non "vede" mai le carte reali degli
avversari. L'equity viene confrontata con le soglie del profilo (`BotProfileConfig`) per
decidere fold/check/call/bet/raise e la dimensione della puntata (frazione del pot).

- **TAG (Tight-Aggressive):** entra in mano solo con equity preflop ≥ 0.40 (~15-20% VPIP),
  preferisce rilanciare a chiamare quando è forte, bluffa occasionalmente.
- **Calling Station:** entra in mano con equity preflop ≥ 0.22 (~55-60% VPIP), chiama quasi
  tutto (soglia di call molto bassa), rilancia raramente e non bluffa mai.

Verificato con simulazioni di centinaia di mani complete (4 bot, fold/call/raise/all-in,
side pot multipli): nessun errore, conservazione delle chips corretta, e i due profili
mostrano VPIP nettamente diversi come atteso dall'archetipo.

### Tavolo (Step 3)

`npm run dev` e apri http://localhost:3000: tavolo 6-max con 1 utente umano (seat 0) e 5 bot
(alternanza TAG/Calling Station). Il bottone "Inizia"/"Nuova mano" avvia una mano; i bot agiscono
automaticamente (con un piccolo ritardo per leggibilità) finché non tocca all'utente o la mano
finisce; alla fine le carte dei bot non foldati vengono rivelate insieme al vincitore e alla mano.

Lo store Zustand (`useTableStore`) incapsula un'istanza di `GameEngine` e ne pubblica uno
snapshot immutabile (`gameState`) ad ogni azione, cosa necessaria perché l'engine muta il proprio
stato interno in place. L'HUD sotto ogni bot mostra VPIP/PFR **placeholder** fissi (19%/15% per i
TAG, 58%/3% per i Calling Station) — i valori reali arriveranno allo Step 4 dal database.

Verificato in un browser reale (Playwright, non solo build/typecheck): mano completa dall'avvio
allo showdown, click su Fold/Call/Raise, e un bug di hydration SSR reale è stato trovato e
corretto (`toLocaleString('it-IT')` produceva testo diverso lato server rispetto al client per
via dei dati ICU limitati di Node — sostituito con un formatter manuale in `src/lib/format.ts`).

### Hand history & Dashboard (Step 4)

Ogni mano completata al tavolo viene salvata in background su MySQL via due route handler:

- `POST /api/sessions` — crea la `Session` (blind, buy-in) alla prima mano della sessione browser.
- `POST /api/hands` — salva `HandHistory` (carte hero, board, pot, risultato netto, VPIP/PFR/
  showdown/vittoria) e i relativi `ActionLog` (inclusi i post di piccolo/grande buio), e
  incrementa `Session.handsPlayed`.

Il salvataggio è "best-effort" e asincrono: se il server/DB non è raggiungibile, il tavolo
continua a funzionare normalmente (solo senza tracciare quella mano), non blocca mai il gioco.
Non essendoci ancora un sistema di autenticazione, tutte le mani vengono attribuite a un unico
profilo locale (`getOrCreateLocalUser`, username `local_player`).

`/dashboard` è un Server Component che interroga Prisma direttamente (`getUserStats` in
`src/lib/analytics.ts`) e mostra:
- un grafico Recharts del bankroll cumulativo (chips) rispetto alle mani giocate;
- una tabella con mani giocate, risultato netto, **BB/100** (calcolato normalizzando il risultato
  di ogni mano sul big blind della propria sessione), **VPIP%**, **PFR%** e % Went-to-Showdown.

**Verificato end-to-end con un database reale**, non solo a livello di build: ho installato
MariaDB in locale, applicato la migration Prisma (`prisma migrate dev`), e con Playwright ho
giocato più mani complete dal tavolo verificando via query SQL dirette che `HandHistory` e
`ActionLog` contenessero i dati corretti (posizione, pot, risultato netto, sequenza di azioni
per street), e che `/dashboard` mostrasse il grafico e le statistiche coerenti con quei dati.

### Controlli di puntata, suoni, impostazioni e pannello info (Extra)

**Controlli di puntata** (`ActionControls.tsx`) in stile client da tavolo reale: 4 pulsanti
preimpostati (Min / 3BB o ½ Piatto a seconda dello street / Piatto / Max), stepper `−`/`+` a
passo di un big blind, slider, e pulsanti Fold / Chiama X / Rilancia a X con l'importo mostrato
direttamente sul pulsante.

**Suoni** (`src/lib/sound/sounds.ts`): sintetizzati via Web Audio API (oscillatori + rumore
bianco) invece di file audio esterni — funzionano offline e senza asset da scaricare. Un suono
diverso per fold, check, call/puntata, rilancio, "tocca a te" e vittoria; disattivabili da
`/settings`.

**`/settings`**: unità di visualizzazione delle puntate (chips o BB — riflessa ovunque, dai
pulsanti preimpostati ai pulsanti Fold/Call/Raise), attivazione suoni, visibilità dei range
avversari nel pannello info, colore del tavolo (persistiti in `localStorage` via lo store Zustand
`useSettingsStore`, con `skipHydration` + rehydrate post-mount per evitare mismatch di hydration
SSR come quello risolto nello Step 3).

**Pannello info in-game** (pulsante "i" accanto ai controlli, `InfoPanel.tsx`) mostra, calcolati
dal vero stato della mano (non placeholder):
- **La tua equity stimata** — riusa `estimateEquity` (Monte Carlo) già scritto per i bot nello
  Step 2, contro il numero di avversari ancora in mano;
- **Pot odds** — % minima di vittoria necessaria per chiamare in pareggio, dato pot e importo da
  chiamare (`src/lib/game/potOdds.ts`);
- **I tuoi outs** — carte rimanenti che migliorano la mano del giocatore rispetto al suo hand
  rank attuale (`src/lib/game/outs.ts`), con stima percentuale via la regola del 4-2;
- **Range indicativi avversari per posizione** — tabella statica di riferimento (range di
  apertura tipici 6-max per BTN/CO/MP/UTG/SB/BB, `src/lib/game/positionRanges.ts`): è una guida
  teorica generica, non una lettura live dei bot specifici al tavolo.

Verificato in browser con Playwright: cambio impostazioni (unità BB, colore tavolo) persistito e
riflesso al tavolo, pannello info aperto durante una mano reale con equity/pot odds/range
effettivamente calcolati, click sui preset di puntata e sui pulsanti azione senza errori console.

### Carte più grandi, delay realistico sui bot, pannello info a schermo intero (Extra 2)

- **Carte più grandi**: `PlayingCard` ora ha tre taglie (`sm`/`md`/`lg`); le carte dell'eroe sono
  visibilmente più grandi (`lg`) di quelle — coperte — dei bot (`sm`), il board resta a taglia
  media. Facile da ritoccare in `SIZE_CLASSES` in `PlayingCard.tsx`.
- **Delay realistico sui bot** (`getBotThinkDelayMs` in `tableStore.ts`): niente più risposta
  istantanea. Il ritardo è randomizzato e dipende dall'azione — un fold è rapido, una bet/raise
  fa "pensare" più a lungo — con un indicatore visivo (puntini animati + "sta pensando") sul
  seat del bot che sta decidendo.
- **Pannello info ridisegnato**: non più un piccolo dropdown, ma una finestra fissa e grande
  (`fixed left-6`, ~26rem) ancorata a **sinistra** dello schermo, mentre i controlli di puntata
  restano a **destra** — così si possono leggere entrambi insieme. Ogni sezione (equity, mano
  attuale via `pokersolver`, pot odds, outs con le carte elencate, range avversari) include ora
  una spiegazione testuale di cosa significa il numero e come usarlo, non solo il valore nudo.

Verificato in browser con Playwright: carte dell'eroe visibilmente più grandi di quelle dei bot,
indicatore "sta pensando" visibile durante il turno di un bot, tempo reale fino al turno
dell'eroe superiore a 1 secondo (prima era istantaneo), pannello info aperto a sinistra con tutte
le sezioni popolate correttamente durante una mano reale, zero errori console.

## Blackjack (nuova modalità di gioco)

Roadmap in step verificabili, come per il poker:

- **B1 (completato):** motore `BlackjackEngine` (shoe multi-mazzo, dealing, assicurazione con
  "peek" per il blackjack del banco, hit/stand/double/split anche multiplo/surrender, regole del
  banco configurabili) + schema Prisma (`BlackjackSession`, `BlackjackRound`,
  `BlackjackBoxResult`, `BlackjackActionLog`).
- **B2 (completato):** motore strategia base (le mosse "da libro"), usato sia come hint per te
  che come cervello dei bot.
- B3: tavolo `/blackjack` con 6 postazioni, multi-box, bot, area scommesse — da fare.
- B4: statistiche persistite (aderenza alla strategia, win rate) + dashboard — da fare.
- B5: trainer conteggio carte (più sistemi, livelli di difficoltà) — da fare.
- B6: impostazioni estese (regole banco) + accessibilità (tastiera, screen reader, alto
  contrasto, testo ridimensionabile) — da fare.

### `BlackjackEngine` (Step B1)

`src/lib/blackjack/`:
- `types.ts` — modello dati: `SeatState`/`BoxState` (un seat può avere più box, per il multi-box
  dell'eroe), `BlackjackRules` (mazzi, regole banco, limiti di puntata), fasi (`BETTING` →
  `INSURANCE` se il banco mostra un Asso → `PLAYER_TURNS` → `DEALER_TURN` → `ROUND_COMPLETE`).
- `shoe.ts` — shoe multi-mazzo con tracking della penetrazione per il reshuffle.
- `handValue.ts` — valore della mano (Assi 1/11, bust, soft, blackjack naturale).
- `BlackjackEngine.ts` — il motore: `startRound()` gestisce puntate, dealing, e il "peek" per il
  blackjack del banco (se il banco mostra Asso o figura, controlla subito se ha blackjack e
  risolve la mano immediatamente saltando i turni, come nei casinò veri); `applyAction()` gestisce
  hit/stand/double/split (con split multipli fino al limite configurato, regola speciale per lo
  split degli assi)/surrender; `applyInsuranceDecision()` per l'assicurazione.

Il motore non sa nulla di *come* un bot decide (stessa architettura del poker): il chiamante
(store, Step B3) pilota anche i box dei bot tramite `applyAction()`, usando la strategia base
dello Step B2.

**Verificato con simulazioni approfondite** (non solo build/typecheck): 3000+ mani con logica
totale-based su tutti i seat (umano e bot), con controllo di conservazione ad ogni mano (la
variazione di bankroll di ogni seat deve corrispondere esattamente alla somma dei payout dei suoi
box) — **ho trovato e corretto un bug reale**: quando l'assicurazione veniva presa ma il banco
non aveva blackjack, la puntata assicurativa persa non veniva riflessa nel `payout` netto del box
(solo scalata dal bankroll). Corretto in tutti e 5 i punti dove un payout diventa definitivo.
Testati anche esplicitamente: split multipli fino al limite configurato, e la regola per cui lo
split degli assi dà una sola carta aggiuntiva senza ulteriori azioni.

### Strategia base (Step B2)

`src/lib/blackjack/basicStrategy.ts` — tabelle standard pubblicate di strategia base per mazzo
multiplo con banco che pesca su 17 morbido (le regole di default): totali fissi (9-16), totali
morbidi (A+2 fino a A+8) e coppie (2,2 fino ad A,A). `getBasicStrategyAction(cards, dealerUpCard,
legalActions)` restituisce l'azione ottimale **tra quelle effettivamente legali in quel momento**
(es. se la strategia consiglierebbe di raddoppiare ma non è disponibile, ripiega su hit o stay a
seconda del caso specifico), più l'azione "ideale" teorica per l'hint UI. `shouldTakeInsurance()`
restituisce sempre `false` (l'assicurazione è matematicamente sconsigliata senza conteggio carte).
`describeRecommendation()` genera la spiegazione testuale in italiano per il pannello hint dello
Step B3.

Questo stesso motore verrà usato sia per il suggerimento "mossa da libro" mostrato all'utente, sia
come cervello decisionale dei bot (che quindi giocano sempre in modo matematicamente corretto).

**Verificato in due modi**: (1) 20 controlli mirati contro fatti noti di strategia base (8,8 e A,A
si dividono sempre, 10,10 non si divide mai, 11 raddoppia contro tutto tranne l'Asso con banco che
pesca su 17 morbido, 16 contro 10 si arrende, ecc.), inclusi i casi di fallback quando
raddoppio/split/resa non sono legali in quel momento; (2) una simulazione di **300.000 mani**
usando la strategia reale su tutti i seat (umano e bot), che converge a un vantaggio del banco
dello **0,255%** — coerente con il valore teorico atteso per queste regole (6 mazzi, H17,
blackjack 3:2, raddoppio dopo split, resa tardiva), a conferma che il motore si comporta
matematicamente come un vero tavolo di blackjack.
