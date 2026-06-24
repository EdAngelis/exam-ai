/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();
  // React Native's useColorScheme can return null/undefined; fall back to light
  // so we never index Colors with a missing key.
  return Colors[scheme === 'dark' ? 'dark' : 'light'];
}
