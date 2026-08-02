import { useState, useCallback } from 'react';
import { getAllEntries, saveEntry, deleteEntry, getSettings } from '../utils/storage';
import { getCosmosForDate } from '../utils/cosmos';
import { createEmptyEntry } from '../utils/storage';

export function useEntries() {
  const [entries, setEntries] = useState(() => getAllEntries());

  const refresh = useCallback(() => {
    setEntries(getAllEntries());
  }, []);

  const save = useCallback((entry) => {
    saveEntry(entry);
    setEntries(getAllEntries());
  }, []);

  const getOrCreate = useCallback((dateStr) => {
    const existing = entries[dateStr];
    if (existing) return existing;
    const settings = getSettings();
    const cosmos = getCosmosForDate(dateStr, settings.hemisphere, settings.latitude);
    return createEmptyEntry(dateStr, cosmos);
  }, [entries]);

  const remove = useCallback((dateStr) => {
    deleteEntry(dateStr);
    setEntries(getAllEntries());
  }, []);

  return { entries, save, remove, refresh, getOrCreate };
}
