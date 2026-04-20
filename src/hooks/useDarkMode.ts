import { useState, useEffect, useCallback } from 'react';

const DARK_MODE_KEY = 'lincc-dark-mode';

function getStoredPreference(): boolean | null {
  try {
    const stored = localStorage.getItem(DARK_MODE_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return null;
  } catch {
    return null;
  }
}

function getSystemPreference(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    const stored = getStoredPreference();
    if (stored !== null) return stored;
    return getSystemPreference();
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem(DARK_MODE_KEY, String(isDark));
    } catch {
      // Storage unavailable — preference won't persist this session
    }
  }, [isDark]);

  const toggle = useCallback(() => setIsDark((prev) => !prev), []);

  return { isDark, toggle };
}
