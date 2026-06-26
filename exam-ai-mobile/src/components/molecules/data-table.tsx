import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type DataTableProps = {
  head: string[];
  body: string[][];
  deleteEnabled?: boolean;
  onDelete?: (rowIndex: number) => void;
  emptyText?: string;
};

/**
 * Simple data table: a header row plus body rows, with an optional delete
 * column. Theme-driven and presentation-only — the parent owns the data and the
 * `onDelete` handler.
 */
export function DataTable({
  head,
  body,
  deleteEnabled = false,
  onDelete,
  emptyText = 'No data',
}: DataTableProps) {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={styles.table}>
      <View style={[styles.row, styles.headRow, { borderBottomColor: theme.background }]}>
        {head.map((h) => (
          <View key={h} style={styles.cell}>
            <ThemedText type="smallBold">{h}</ThemedText>
          </View>
        ))}
        {deleteEnabled && <View style={styles.deleteCell} />}
      </View>

      {body.length === 0 ? (
        <View style={styles.row}>
          <ThemedText themeColor="textSecondary">{emptyText}</ThemedText>
        </View>
      ) : (
        body.map((cols, rowIndex) => (
          <View
            key={rowIndex}
            style={[styles.row, { borderBottomColor: theme.background }]}>
            {cols.map((c, i) => (
              <View key={i} style={styles.cell}>
                <ThemedText type="small">{c}</ThemedText>
              </View>
            ))}
            {deleteEnabled && (
              <Pressable
                accessibilityRole="button"
                onPress={() => onDelete?.(rowIndex)}
                style={styles.deleteCell}>
                <ThemedText style={{ color: '#e5484d' }}>Remove</ThemedText>
              </Pressable>
            )}
          </View>
        ))
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  table: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  headRow: {
    borderBottomWidth: 1,
  },
  cell: {
    flex: 1,
  },
  deleteCell: {
    paddingLeft: Spacing.two,
  },
});
