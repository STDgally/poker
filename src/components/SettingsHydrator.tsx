'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

/** Rehydrates persisted settings from localStorage after mount (see the
 * skipHydration note in settingsStore.ts). Renders nothing. */
export function SettingsHydrator() {
  useEffect(() => {
    void useSettingsStore.persist.rehydrate();
  }, []);

  return null;
}
