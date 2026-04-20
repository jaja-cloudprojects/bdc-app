/**
 * Layout constants + responsive breakpoints.
 * The app supports phones of any size AND tablets.
 */

export const Breakpoints = {
  sm: 380,   // small phones
  md: 480,   // standard phones
  lg: 768,   // tablets portrait
  xl: 1024,  // tablets landscape / small laptop
  '2xl': 1280,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
  '5xl': 80,
} as const;

export const Radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 22,
  '3xl': 28,
  full: 9999,
} as const;

export const Elevation = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
} as const;

export const HeaderHeight = 56;
export const MaxContentWidth = 1100; // for tablet/web constrained layout
