import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type MessageVariant = 'error' | 'success';

export type InlineMessageProps = {
  message?: string | null;
  variant?: MessageVariant;
};

const COLORS: Record<MessageVariant, { bg: string; text: string }> = {
  error: { bg: 'rgba(229,72,77,0.12)', text: '#e5484d' },
  success: { bg: 'rgba(48,164,108,0.12)', text: '#30a46c' },
};

/**
 * Inline error/success banner. Renders nothing when there's no message, so
 * callers can mount it unconditionally. Presentation-only.
 */
export function InlineMessage({ message, variant = 'error' }: InlineMessageProps) {
  if (!message) return null;
  const c = COLORS[variant];
  return (
    <ThemedView style={[styles.container, { backgroundColor: c.bg }]}>
      <ThemedText type="small" style={{ color: c.text }}>
        {message}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
