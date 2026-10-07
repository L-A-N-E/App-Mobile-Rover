// Paleta do Figma do Rover (tema claro) + variação para o tema escuro.

export type ColorTokens = {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  primaryText: string; // azul para textos/ícones (mais claro no tema escuro, para ter contraste)
  onPrimary: string;
  accent: string;
  accentPressed: string;
  accentSoft: string;
  accentText: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  overlay: string;
  scrim: string;
  shadow: string;
  tabBar: string;
};

export const palette = {
  navy900: '#12263A',
  navy700: '#1E3A57',
  blue700: '#01448A',
  blue800: '#013670',
  orange400: '#F49B67',
  orange500: '#E8854D',
  gray50: '#F5F8FB',
  gray100: '#EEF2F7',
  gray200: '#E2E8F0',
  white: '#FFFFFF',
  black: '#000000',
};

export const lightColors: ColorTokens = {
  background: palette.gray50,
  surface: palette.white,
  surfaceAlt: palette.gray100,
  border: palette.gray200,
  text: palette.navy900,
  textSecondary: '#52637A',
  textTertiary: '#8494A8',
  textInverse: palette.white,
  primary: palette.blue700,
  primaryPressed: palette.blue800,
  primarySoft: '#E5EDF7',
  primaryText: palette.blue700,
  onPrimary: '#F2F6FA',
  accent: palette.orange400,
  accentPressed: palette.orange500,
  accentSoft: '#FEF0E7',
  accentText: '#B95A22',
  success: '#17946A',
  successSoft: '#E3F5EE',
  danger: '#D64545',
  dangerSoft: '#FCEBEB',
  overlay: 'rgba(18, 38, 58, 0.45)',
  scrim: 'rgba(8, 18, 30, 0.5)',
  shadow: '#0B1B2E',
  tabBar: palette.white,
};

export const darkColors: ColorTokens = {
  background: '#0A1420',
  surface: '#111F30',
  surfaceAlt: '#182A3E',
  border: '#22364C',
  text: '#EAF0F6',
  textSecondary: '#A6B4C5',
  textTertiary: '#708399',
  textInverse: palette.white,
  primary: '#2F72C4',
  primaryPressed: '#255FA6',
  primarySoft: '#173356',
  primaryText: '#8CBCF5',
  onPrimary: '#F2F6FA',
  accent: palette.orange400,
  accentPressed: palette.orange500,
  accentSoft: '#3A2618',
  accentText: '#F7B086',
  success: '#3CC48E',
  successSoft: '#123326',
  danger: '#F07171',
  dangerSoft: '#3A1A1D',
  overlay: 'rgba(3, 9, 16, 0.55)',
  scrim: 'rgba(0, 0, 0, 0.6)',
  shadow: palette.black,
  tabBar: '#13243A',
};
