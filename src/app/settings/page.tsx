'use client';

import { BOT_DELAY_PRESETS, FELT_COLOR_PRESETS, UI_SCALE_PRESETS, useSettingsStore } from '@/store/settingsStore';
import { NavBar } from '@/components/NavBar';

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-300">{title}</h2>
      {children}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between">
      <span className="text-sm text-slate-300">{label}</span>
      <input type="checkbox" checked={checked} onChange={onChange} className="h-5 w-5 accent-amber-400" />
    </label>
  );
}

export default function SettingsPage() {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const betDisplayUnit = useSettingsStore((s) => s.betDisplayUnit);
  const feltColor = useSettingsStore((s) => s.feltColor);
  const showOpponentRanges = useSettingsStore((s) => s.showOpponentRanges);
  const uiScale = useSettingsStore((s) => s.uiScale);
  const highContrast = useSettingsStore((s) => s.highContrast);
  const keyboardShortcutsEnabled = useSettingsStore((s) => s.keyboardShortcutsEnabled);
  const botDelayMs = useSettingsStore((s) => s.botDelayMs);
  const blackjackRules = useSettingsStore((s) => s.blackjackRules);
  const toggleSound = useSettingsStore((s) => s.toggleSound);
  const setBetDisplayUnit = useSettingsStore((s) => s.setBetDisplayUnit);
  const setFeltColor = useSettingsStore((s) => s.setFeltColor);
  const toggleShowOpponentRanges = useSettingsStore((s) => s.toggleShowOpponentRanges);
  const setUiScale = useSettingsStore((s) => s.setUiScale);
  const toggleHighContrast = useSettingsStore((s) => s.toggleHighContrast);
  const toggleKeyboardShortcuts = useSettingsStore((s) => s.toggleKeyboardShortcuts);
  const setBotDelayMs = useSettingsStore((s) => s.setBotDelayMs);
  const setBlackjackRule = useSettingsStore((s) => s.setBlackjackRule);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6 text-slate-100">
      <NavBar title="Impostazioni" />

      <SectionCard title="Audio">
        <ToggleRow label="Effetti sonori (fold, call, raise, vittoria, tuo turno)" checked={soundEnabled} onChange={toggleSound} />
      </SectionCard>

      <SectionCard title="Puntate">
        <div className="mb-1 text-sm text-slate-300">Mostra importi puntata in:</div>
        <div className="flex gap-2">
          <button
            onClick={() => setBetDisplayUnit('CHIPS')}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold transition ${
              betDisplayUnit === 'CHIPS' ? 'border-amber-400 bg-amber-500/20 text-amber-300' : 'border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
          >
            Chips (es. 40)
          </button>
          <button
            onClick={() => setBetDisplayUnit('BB')}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold transition ${
              betDisplayUnit === 'BB' ? 'border-amber-400 bg-amber-500/20 text-amber-300' : 'border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
          >
            Big Blind (es. 4BB)
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Pannello informazioni">
        <ToggleRow
          label="Mostra range indicativi degli avversari per posizione"
          checked={showOpponentRanges}
          onChange={toggleShowOpponentRanges}
        />
      </SectionCard>

      <SectionCard title="Colore tavolo">
        <div className="grid grid-cols-5 gap-3">
          {FELT_COLOR_PRESETS.map((preset) => (
            <button
              key={preset.key}
              onClick={() => setFeltColor(preset.value)}
              className={`flex flex-col items-center gap-1 rounded-md border p-2 transition ${
                feltColor === preset.value ? 'border-amber-400' : 'border-slate-700 hover:border-slate-500'
              }`}
              aria-label={preset.label}
            >
              <span className="h-8 w-8 rounded-full border border-black/30" style={{ backgroundColor: preset.value }} />
              <span className="text-[10px] text-slate-400">{preset.label}</span>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Velocità dei bot">
        <div className="mb-2 text-sm text-slate-300">
          Tempo di &quot;pensiero&quot; dei bot prima di agire — vale sia per il poker che per il blackjack.
        </div>
        <div className="grid grid-cols-5 gap-2">
          {BOT_DELAY_PRESETS.map((preset) => (
            <button
              key={preset.key}
              onClick={() => setBotDelayMs(preset.value)}
              className={`rounded-md border px-2 py-2 text-center text-xs font-semibold transition ${
                botDelayMs === preset.value ? 'border-amber-400 bg-amber-500/20 text-amber-300' : 'border-slate-700 text-slate-300 hover:border-slate-500'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Accessibilità">
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-2 text-sm text-slate-300">Dimensione testo e interfaccia</div>
            <div className="flex gap-2">
              {UI_SCALE_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => setUiScale(preset.value)}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                    uiScale === preset.value ? 'border-amber-400 bg-amber-500/20 text-amber-300' : 'border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <ToggleRow
            label="Alto contrasto e colori più distinguibili per il daltonismo"
            checked={highContrast}
            onChange={toggleHighContrast}
          />
          <ToggleRow
            label="Scorciatoie da tastiera per le azioni di gioco (F/C/R al poker, H/S/D/P/U al blackjack)"
            checked={keyboardShortcutsEnabled}
            onChange={toggleKeyboardShortcuts}
          />
          <p className="text-xs text-slate-500">
            L&apos;app usa inoltre etichette leggibili dagli screen reader su carte e pulsanti, e annuncia gli eventi di
            gioco tramite il pannello Log.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Regole del banco (Blackjack)">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Numero di mazzi</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBlackjackRule('numDecks', Math.max(1, blackjackRules.numDecks - 1))}
                className="h-7 w-7 rounded-full border border-slate-600 text-slate-200 hover:border-amber-400 hover:text-amber-300"
              >
                −
              </button>
              <span className="w-6 text-center font-mono text-amber-300">{blackjackRules.numDecks}</span>
              <button
                onClick={() => setBlackjackRule('numDecks', Math.min(8, blackjackRules.numDecks + 1))}
                className="h-7 w-7 rounded-full border border-slate-600 text-slate-200 hover:border-amber-400 hover:text-amber-300"
              >
                +
              </button>
            </div>
          </div>

          <ToggleRow
            label="Il banco pesca su 17 morbido (H17)"
            checked={blackjackRules.dealerHitsSoft17}
            onChange={() => setBlackjackRule('dealerHitsSoft17', !blackjackRules.dealerHitsSoft17)}
          />

          <div>
            <div className="mb-2 text-sm text-slate-300">Pagamento blackjack naturale</div>
            <div className="flex gap-2">
              <button
                onClick={() => setBlackjackRule('blackjackPayout', 1.5)}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                  blackjackRules.blackjackPayout === 1.5 ? 'border-amber-400 bg-amber-500/20 text-amber-300' : 'border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                3:2 (standard)
              </button>
              <button
                onClick={() => setBlackjackRule('blackjackPayout', 1.2)}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                  blackjackRules.blackjackPayout === 1.2 ? 'border-amber-400 bg-amber-500/20 text-amber-300' : 'border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                6:5 (peggiore per te)
              </button>
            </div>
          </div>

          <ToggleRow
            label="Raddoppio consentito dopo lo split"
            checked={blackjackRules.doubleAfterSplit}
            onChange={() => setBlackjackRule('doubleAfterSplit', !blackjackRules.doubleAfterSplit)}
          />
          <ToggleRow
            label="Resa tardiva consentita (surrender)"
            checked={blackjackRules.lateSurrender}
            onChange={() => setBlackjackRule('lateSurrender', !blackjackRules.lateSurrender)}
          />

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">Limiti di puntata</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={blackjackRules.minBet}
                onChange={(e) => setBlackjackRule('minBet', Math.max(1, Number(e.target.value)))}
                className="w-20 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-right text-slate-100"
              />
              <span className="text-slate-500">-</span>
              <input
                type="number"
                min={blackjackRules.minBet}
                value={blackjackRules.maxBet}
                onChange={(e) => setBlackjackRule('maxBet', Math.max(blackjackRules.minBet, Number(e.target.value)))}
                className="w-24 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-right text-slate-100"
              />
            </div>
          </div>

          <p className="text-xs text-slate-500">Le nuove regole si applicano dalla prossima volta che ti siedi al tavolo.</p>
        </div>
      </SectionCard>
    </main>
  );
}
