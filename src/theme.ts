import { MD3LightTheme as DefaultTheme, configureFonts } from 'react-native-paper';

export const BRAND_COLORS = {
  primary: '#f07e0e',
  black: '#000000',
  white: '#FFFFFF',
  gray700: '#2d2d2d',
  gray900: '#1a1a1a',
  red: '#e53935',
  yellow: '#fdd835',
  green: '#43a047',
  blue: '#1e88e5',
};

const fontConfig = configureFonts({
  config: {
    fontFamily: 'System',
  },
});

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: BRAND_COLORS.primary,
    background: BRAND_COLORS.white,
    surface: '#ffffff',
    text: BRAND_COLORS.gray900,
  },
  fonts: fontConfig,
};

export const COLOR_LABELS: Record<string, string> = {
  '#e53935': 'IMPORTANTE',
  '#fdd835': 'URGENTE',
  '#f07e0e': 'PRIORIDAD',
  '#1e88e5': 'INFO',
  '#43a047': 'NORMAL',
};

export const COLOR_OPTIONS: { color: string; label: string }[] = [
  { color: BRAND_COLORS.red, label: 'IMPORTANTE' },
  { color: BRAND_COLORS.yellow, label: 'URGENTE' },
  { color: BRAND_COLORS.primary, label: 'PRIORIDAD' },
  { color: BRAND_COLORS.blue, label: 'INFO' },
  { color: BRAND_COLORS.green, label: 'NORMAL' },
];


