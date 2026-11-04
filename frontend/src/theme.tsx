import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react';

// Theme system (presentation only): 'light' | 'dark', persisted in
// localStorage under 'lrms-theme'. Falls back to the OS preference when
// nothing is stored. Toggling adds/removes the 'dark' class on
// document.documentElement, which Tailwind (darkMode: 'class') uses.
export type Theme = 'light' | 'dark';
type Ctx = { theme: Theme; toggle: () => void };
const C = createContext<Ctx>({ theme: 'light', toggle: () => {} });
export const useTheme = () => useContext(C);

function initialTheme(): Theme {
  try {
    const stored = localStorage.getItem('lrms-theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch { /* storage unavailable — fall through to OS preference */ }
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem('lrms-theme', theme); } catch { /* ignore */ }
  }, [theme]);
  // Keep the theme in sync if another tab changes it.
  useEffect(() => {
    const h = (e: StorageEvent) => {
      if (e.key === 'lrms-theme' && (e.newValue === 'light' || e.newValue === 'dark')) setTheme(e.newValue);
    };
    window.addEventListener('storage', h);
    return () => window.removeEventListener('storage', h);
  }, []);
  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  return <C.Provider value={{ theme, toggle }}>{children}</C.Provider>;
}
