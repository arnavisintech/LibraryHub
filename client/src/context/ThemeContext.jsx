import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme] = useState('light');

  useEffect(() => {
    document.documentElement.dataset.theme = 'light';
    localStorage.setItem('theme', 'light');
  }, []);

  function toggleTheme() {
    // Disabled
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
