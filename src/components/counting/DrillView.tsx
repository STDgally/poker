'use client';

import { useState } from 'react';
import { useCountingTrainerStore } from '@/store/countingTrainerStore';
import { PlayingCard } from '@/components/table/PlayingCard';

export function DrillView() {
  const currentCard = useCountingTrainerStore((s) => s.currentCard);
  const dealtCards = useCountingTrainerStore((s) => s.dealtCards);
  const shoe = useCountingTrainerStore((s) => s.shoe);
  const isPaused = useCountingTrainerStore((s) => s.isPaused);
  const isCheckpointPending = useCountingTrainerStore((s) => s.isCheckpointPending);
  const practiceMode = useCountingTrainerStore((s) => s.practiceMode);
  const checkpoints = useCountingTrainerStore((s) => s.checkpoints);
  const pause = useCountingTrainerStore((s) => s.pause);
  const resume = useCountingTrainerStore((s) => s.resume);
  const stopDrill = useCountingTrainerStore((s) => s.stopDrill);
  const submitCheckpointGuess = useCountingTrainerStore((s) => s.submitCheckpointGuess);

  const [guessInput, setGuessInput] = useState('0');

  const totalCards = dealtCards.length + shoe.length;
  const progressPct = totalCards > 0 ? (dealtCards.length / totalCards) * 100 : 0;
  const lastCheckpoint = checkpoints[checkpoints.length - 1];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const guess = Number(guessInput);
    if (Number.isNaN(guess)) return;
    submitCheckpointGuess(guess);
    setGuessInput('0');
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-slate-700 bg-slate-900/90 p-6">
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div className="h-full bg-amber-400 transition-all" style={{ width: `${progressPct}%` }} />
      </div>
      <div className="text-xs text-slate-500">
        {dealtCards.length} / {totalCards} carte
      </div>

      {isCheckpointPending ? (
        <form onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-3">
          <div className="text-center text-sm text-slate-200">
            Qual è il tuo {practiceMode === 'TRUE_COUNT' ? 'true count' : 'conteggio corrente'}?
          </div>
          <input
            autoFocus
            type="number"
            value={guessInput}
            onChange={(e) => setGuessInput(e.target.value)}
            className="w-32 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-center text-lg text-slate-100"
          />
          <button type="submit" className="rounded-md bg-emerald-700 px-6 py-2 font-semibold text-white transition hover:bg-emerald-600">
            Conferma
          </button>
        </form>
      ) : (
        <>
          <div className="flex h-32 items-center justify-center">
            {currentCard ? <PlayingCard card={currentCard} size="lg" /> : <div className="text-slate-500">In attesa...</div>}
          </div>

          <div className="flex gap-3">
            <button
              onClick={isPaused ? resume : pause}
              className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-amber-400 hover:text-amber-300"
            >
              {isPaused ? 'Riprendi' : 'Pausa'}
            </button>
            <button
              onClick={stopDrill}
              className="rounded-md border border-rose-700 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-900/30"
            >
              Termina
            </button>
          </div>
        </>
      )}

      {lastCheckpoint && !isCheckpointPending && (
        <div className={`text-xs ${lastCheckpoint.correct ? 'text-emerald-400' : 'text-rose-400'}`}>
          Ultimo checkpoint: {lastCheckpoint.correct ? 'corretto' : `sbagliato (atteso ${lastCheckpoint.expected}, hai detto ${lastCheckpoint.guess})`}
        </div>
      )}
    </div>
  );
}
