import { createContext, useContext, useState } from 'react';
import { applyTheme, getStoredTheme } from '../styles/tokens.js';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => getStoredTheme());

  function setTheme(name) {
    const resolved = applyTheme(name);
    setThemeState(resolved);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme moet binnen ThemeProvider gebruikt worden.');
  return ctx;
}
