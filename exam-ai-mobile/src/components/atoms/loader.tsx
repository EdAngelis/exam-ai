import { ActivityIndicator, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export type LoaderProps = {
  /** Fill and center within the parent. Defaults to true. */
  fullscreen?: boolean;
  size?: 'small' | 'large';
};

/** Centered spinner. Theme-driven; presentation-only. */
export function Loader({ fullscreen = true, size = 'large' }: LoaderProps) {
  const theme = useTheme();
  return (
    <ThemedView style={fullscreen ? styles.fullscreen : styles.inline}>
      <ActivityIndicator size={size} color={theme.text} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
