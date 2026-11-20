import { useWindowDimensions } from 'react-native';

export const breakpoints = { tablet: 768, desktop: 1024 } as const;

/** Recomputes on browser resize, device rotation, and split-screen changes. */
export function useResponsive() {
  const { width, height, fontScale } = useWindowDimensions();
  const isDesktop = width >= breakpoints.desktop;
  const isTablet = width >= breakpoints.tablet && !isDesktop;
  return {
    width, height, fontScale, isDesktop, isTablet,
    isMobile: width < breakpoints.tablet,
    gutter: width < 360 ? 12 : width < breakpoints.tablet ? 16 : 32,
    columns: isDesktop ? 3 : isTablet ? 2 : 1,
  };
}
