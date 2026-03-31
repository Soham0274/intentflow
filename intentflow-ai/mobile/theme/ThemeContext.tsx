import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkColors, LightColors, ColorScheme } from './colors';
import { Typography } from './typography';

type ThemeMode = 'dark' | 'light';

interface ThemeContextValue {
  mode:      ThemeMode;
  colors:    ColorScheme;
  typography: typeof Typography;
  toggleTheme: () => void;
  isDark:    boolean;
}

const ThemeContext = createContext<ThemeContextValue>({} as ThemeContextValue);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('themeMode').then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setMode(saved);
      }
      setIsLoaded(true);
    });
  }, []);

  const toggleTheme = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    AsyncStorage.setItem('themeMode', next);
  };

  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={{
      mode,
      colors:     mode === 'dark' ? DarkColors : LightColors,
      typography: Typography,
      toggleTheme,
      isDark:     mode === 'dark',
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
