'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

/** Applies UI-scale and high-contrast preferences to the document root.
 * Renders nothing; mounted once in the root layout alongside SettingsHydrator. */
export function AccessibilityApplier() {
  const uiScale = useSettingsStore((s) => s.uiScale);
  const highContrast = useSettingsStore((s) => s.highContrast);

  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * uiScale}px`;
  }, [uiScale]);

  useEffect(() => {
    document.documentElement.setAttribute('data-high-contrast', String(highContrast));
  }, [highContrast]);

  return null;
}
