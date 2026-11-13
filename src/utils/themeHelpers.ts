import { ThemeName } from '../context/ThemeContext';

export const AVAILABLE_THEMES: ThemeName[] = ['light', 'dark'];

export const getThemeLabel = (theme: ThemeName): string => {
  const labels: Record<ThemeName, string> = {
    light: 'Claro',
    dark: 'Escuro'
  };
  return labels[theme];
};

export const getNextTheme = (currentTheme: ThemeName): ThemeName => {
  const index = AVAILABLE_THEMES.indexOf(currentTheme);
  return AVAILABLE_THEMES[(index + 1) % AVAILABLE_THEMES.length];
};

