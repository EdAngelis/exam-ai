import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export type LabelProps = {
  text: string;
};

/** Form field label. Presentation-only. */
export function Label({ text }: LabelProps) {
  return (
    <ThemedText type="smallBold" style={styles.label}>
      {text}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: Spacing.one,
  },
});
