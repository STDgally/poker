'use client';

import { useSettingsStore } from '@/store/settingsStore';

// All sounds are synthesized with the Web Audio API rather than loaded from
// audio files, so the app has working sound with zero external assets and
// works fully offline.
let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioContext = new Ctor();
  }
  // Browsers start an AudioContext suspended until a user gesture; every
  // play*() call happens from a click (or shortly after one), so resuming
  // here is always within a valid gesture-derived call chain.
  if (audioContext.state === 'suspended') void audioContext.resume();
  return audioContext;
}

function isEnabled(): boolean {
  return useSettingsStore.getState().soundEnabled;
}

function tone(freq: number, duration: number, type: OscillatorType = 'sine', gainValue = 0.15, delay = 0) {
  const ctx = getContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const start = ctx.currentTime + delay;
  gain.gain.setValueAtTime(gainValue, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.start(start);
  osc.stop(start + duration);
}

function noiseBurst(duration: number, gainValue = 0.12, delay = 0) {
  const ctx = getContext();
  if (!ctx) return;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = gainValue;
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(ctx.currentTime + delay);
}

export function playChipSound(): void {
  if (!isEnabled()) return;
  noiseBurst(0.12, 0.18);
  tone(1200, 0.05, 'square', 0.05, 0.02);
}

export function playFoldSound(): void {
  if (!isEnabled()) return;
  tone(220, 0.18, 'sine', 0.08);
}

export function playCheckSound(): void {
  if (!isEnabled()) return;
  tone(700, 0.07, 'triangle', 0.1);
}

export function playRaiseSound(): void {
  if (!isEnabled()) return;
  noiseBurst(0.15, 0.2);
  tone(320, 0.1, 'sawtooth', 0.05, 0.05);
  tone(520, 0.1, 'sawtooth', 0.05, 0.1);
}

export function playYourTurnSound(): void {
  if (!isEnabled()) return;
  tone(880, 0.12, 'sine', 0.07);
}

export function playWinSound(): void {
  if (!isEnabled()) return;
  [523, 659, 784].forEach((freq, i) => tone(freq, 0.25, 'sine', 0.1, i * 0.1));
}
