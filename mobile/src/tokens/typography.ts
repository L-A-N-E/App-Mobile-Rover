import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
  Archivo_800ExtraBold,
} from '@expo-google-fonts/archivo';

export const fontAssets = {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
  Archivo_800ExtraBold,
};

export const fonts = {
  regular: 'Archivo_400Regular',
  medium: 'Archivo_500Medium',
  semiBold: 'Archivo_600SemiBold',
  bold: 'Archivo_700Bold',
  extraBold: 'Archivo_800ExtraBold',
};

export const typography = {
  hero: { fontFamily: fonts.extraBold, fontSize: 34, lineHeight: 40, letterSpacing: -0.6 },
  h1: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.4 },
  h2: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.2 },
  h3: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24 },
  title: { fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodySm: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 18 },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
  overline: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14, letterSpacing: 1, textTransform: 'uppercase' as const },
};

export type TypographyVariant = keyof typeof typography;
