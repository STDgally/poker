# Poker Simulator & Analytics

Texas Hold'em offline trainer contro bot AI, con tracking delle hand history e statistiche.

Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Zustand (front-end),
Prisma + MySQL (persistenza), `pokersolver` (valutazione mani).

## Stato del progetto

- **STEP 1 (completato):** schema Prisma (`User`, `Session`, `HandHistory`, `ActionLog`) e classe
  `GameEngine` (mazzo, blind, turni di puntata, side pot, showdown).
- **STEP 2 (completato):** profili bot TAG / Calling Station e logica di decisione basata su
  equity (Monte Carlo).
- STEP 3: componente React del tavolo — da fare.
- STEP 4: dashboard `/dashboard` con grafici — da fare.

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
  app/
    layout.tsx, page.tsx, globals.css   # scaffold Next.js (sostituito dallo Step 3)
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
