'use client';

import { FELT_COLOR_PRESETS, useSettingsStore } from '@/store/settingsStore';
import { NavBar } from '@/components/NavBar';

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-300">{title}</h2>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const betDisplayUnit = useSettingsStore((s) => s.betDisplayUnit);
  const feltColor = useSettingsStore((s) => s.feltColor);
  const showOpponentRanges = useSettingsStore((s) => s.showOpponentRanges);
  const toggleSound = useSettingsStore((s) => s.toggleSound);
  const setBetDisplayUnit = useSettingsStore((s) => s.setBetDisplayUnit);
  const setFeltColor = useSettingsStore((s) => s.setFeltColor);
  const toggleShowOpponentRanges = useSettingsStore((s) => s.toggleShowOpponentRanges);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6 text-slate-100">
      <NavBar title="Impostazioni" />

      <SectionCard title="Audio">
        <label className="flex cursor-pointer items-center justify-between">
          <span className="text-sm text-slate-300">Effetti sonori (fold, call, raise, vittoria, tuo turno)</span>
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={toggleSound}
            className="h-5 w-5 accent-amber-400"
          />
        </label>
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
        <label className="flex cursor-pointer items-center justify-between">
          <span className="text-sm text-slate-300">Mostra range indicativi degli avversari per posizione</span>
          <input
            type="checkbox"
            checked={showOpponentRanges}
            onChange={toggleShowOpponentRanges}
            className="h-5 w-5 accent-amber-400"
          />
        </label>
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
    </main>
  );
}
