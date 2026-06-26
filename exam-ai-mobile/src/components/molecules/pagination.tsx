import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/atoms/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
};

/** Prev/next pager with a "page X of Y" label. Presentation-only. */
export function Pagination({
  currentPage,
  totalPages,
  onPrev,
  onNext,
}: PaginationProps) {
  return (
    <View style={styles.container}>
      <Button
        title="Previous"
        variant="secondary"
        onPress={onPrev}
        disabled={currentPage <= 1}
      />
      <ThemedText type="small" themeColor="textSecondary">
        Page {currentPage} of {Math.max(totalPages, 1)}
      </ThemedText>
      <Button
        title="Next"
        variant="secondary"
        onPress={onNext}
        disabled={currentPage >= totalPages}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
});
