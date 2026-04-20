import { useWindowDimensions } from 'react-native';
import { Breakpoints } from '@/constants/Layout';

export type DeviceClass = 'phone-sm' | 'phone' | 'tablet-sm' | 'tablet' | 'desktop';

/**
 * Central responsive hook.
 * Provides consistent breakpoints + helpful aliases so layouts can adapt from
 * very small phones up to tablets / landscape tablets.
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isPhoneSm = width < Breakpoints.sm;
  const isPhone = width >= Breakpoints.sm && width < Breakpoints.lg;
  const isTablet = width >= Breakpoints.lg && width < Breakpoints.xl;
  const isTabletLg = width >= Breakpoints.xl;
  const isLandscape = width > height;

  let deviceClass: DeviceClass = 'phone';
  if (isPhoneSm) deviceClass = 'phone-sm';
  else if (isPhone) deviceClass = 'phone';
  else if (isTablet) deviceClass = 'tablet-sm';
  else if (isTabletLg && !isLandscape) deviceClass = 'tablet';
  else if (isTabletLg && isLandscape) deviceClass = 'desktop';

  /**
   * Scale a value across devices.
   * e.g. scale({ phone: 16, tablet: 20 })
   */
  function scale<T>(values: {
    phoneSm?: T;
    phone: T;
    tabletSm?: T;
    tablet?: T;
    desktop?: T;
  }): T {
    if (isPhoneSm && values.phoneSm !== undefined) return values.phoneSm;
    if (isPhone) return values.phone;
    if (isTablet && values.tabletSm !== undefined) return values.tabletSm;
    if (isTabletLg && !isLandscape && values.tablet !== undefined) return values.tablet;
    if (isTabletLg && isLandscape && values.desktop !== undefined) return values.desktop;
    return values.tablet ?? values.tabletSm ?? values.phone;
  }

  /**
   * Columns count for grid layouts.
   */
  function columns(options?: { min?: number; target?: number }): number {
    const min = options?.min ?? 2;
    if (isPhoneSm) return Math.max(min, 2);
    if (isPhone) return Math.max(min, 2);
    if (isTablet) return Math.max(min, 3);
    return Math.max(min, 4);
  }

  return {
    width,
    height,
    isPhoneSm,
    isPhone,
    isTablet,
    isTabletLg,
    isLandscape,
    deviceClass,
    scale,
    columns,
  };
}
