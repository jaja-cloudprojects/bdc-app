/**
 * Design System - Colors
 * Extracted from the Figma mockup of BDC app
 * Dark theme is primary; light theme variables also defined.
 */

export const Colors = {
  // Backgrounds
  background: '#0A0A0A',
  backgroundElevated: '#151515',
  backgroundCard: '#1C1C1E',
  backgroundOverlay: 'rgba(0, 0, 0, 0.6)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#B8B8B8',
  textMuted: '#7A7A7A',
  textInverse: '#0A0A0A',

  // Brand / Accent
  primary: '#E8586E',           // Pink "Connexion" button
  primaryDark: '#C8445A',
  primaryLight: '#F47A8E',

  // Semantic / Action tiles (dashboard)
  tilePink: '#F4B6C2',          // "Mes documents"
  tileYellow: '#F5DE9B',        // "J'ai besoin d'aide"
  tilePurple: '#9B95E8',        // "Gérer mon profil"
  tileTeal: '#3B6B7B',          // "Fiches pratiques"

  // Chat bubbles
  chatUser: '#2F4A6B',          // Dark blue
  chatBot: '#3B6D3E',           // Dark green

  // CTAs / special
  reserveBlue: '#1D8CF8',       // "Réserver un créneau"

  // Borders / dividers
  border: '#2A2A2A',
  borderLight: '#3A3A3A',
  divider: '#1F1F1F',

  // States
  success: '#4CAF50',
  warning: '#FFA726',
  error: '#EF5350',
  info: '#29B6F6',

  // Transparency helpers
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
