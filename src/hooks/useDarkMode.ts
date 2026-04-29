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

    // Keep the mobile browser chrome (Safari address bar, Android status bar) in
    // sync with the in-app theme. Without this the bar uses the system-level
    // colour-scheme media query and clashes when the user manually toggled the
    // opposite mode.
    const colour = isDark ? '#0F0F1A' : '#FAFAFA';
    const liveTags = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
    if (liveTags.length === 0) {
      const m = document.createElement('meta');
      m.name = 'theme-color';
      m.content = colour;
      document.head.appendChild(m);
    } else {
      // Drop any media-scoped theme-color tags (so our active tag wins) and
      // set the chosen colour on the first.
      liveTags.forEach((tag, i) => {
        if (i === 0) {
          tag.removeAttribute('media');
          tag.content = colour;
        } else {
          tag.remove();
        }
      });
    }
  }, [isDark]);

  const toggle = useCallback(() => setIsDark((prev) => !prev), []);

  return { isDark, toggle };
}
