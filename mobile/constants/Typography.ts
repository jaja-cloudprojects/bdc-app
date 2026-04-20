/**
 * Typography System
 * The BDC brand uses an elegant serif with italic accents (see "BEAUTÉ DU CIL").
 * We use Playfair Display (serif) for branding + titles and Inter for body.
 * These are loaded via expo-font in _layout.tsx.
 */

import { Platform } from 'react-native';

export const FontFamily = {
  serif: 'PlayfairDisplay-Regular',
  serifBold: 'PlayfairDisplay-Bold',
  serifItalic: 'PlayfairDisplay-Italic',
  script: 'CormorantGaramond-Italic', // For "Collection" subtitle & "Elèves" etc.
  sans: Platform.select({
    ios: 'Inter-Regular',
    android: 'Inter-Regular',
    default: 'Inter-Regular',
  }) as string,
  sansMedium: 'Inter-Medium',
  sansSemibold: 'Inter-SemiBold',
  sansBold: 'Inter-Bold',
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 64,
} as const;

export const LineHeight = {
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.65,
} as const;

export const LetterSpacing = {
  tighter: -0.8,
  tight: -0.4,
  normal: 0,
  wide: 0.5,
  wider: 1.2,
  widest: 2.5, // used in "COLLECTION"
} as const;
