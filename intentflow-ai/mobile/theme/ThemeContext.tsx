import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import Colors from '../constants/Colors';
import { Typography } from './typography';

type ThemeMode = 'dark' | 'light';

interface ThemeContextValue {
  mode:      ThemeMode;
  colors:    typeof Colors.dark;
  typography: typeof Typography;
  toggleTheme: () => void;
  isDark:    boolean;
}

const ThemeContext = createContext<ThemeContextValue>({} as ThemeContextValue);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(deviceColorScheme || 'dark');

  const toggleTheme = () => {
    const newMode = mode === 'dark' ? 'light' : 'dark';
    setMode(newMode);
    AsyncStorage.setItem('theme-mode', newMode);
  };

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('theme-mode');
        if (savedMode && (savedMode === 'dark' || savedMode === 'light')) {
          setMode(savedMode);
        }
      } catch (error) {
        console.log('Error loading theme:', error);
      }
    };
    loadTheme();
  }, []);

  const colors = mode === 'dark' ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{
      mode,
      colors,
      typography: Typography,
      toggleTheme,
      isDark: mode === 'dark',
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
