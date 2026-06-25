import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type DropdownProps = {
  options: string[];
  selectedValue?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

/**
 * Select-from-list control. React Native has no native <select>, so the list
 * opens in a modal sheet. Theme-driven and presentation-only — the caller owns
 * the options and selection.
 */
export function Dropdown({
  options,
  selectedValue,
  onChange,
  placeholder = 'Select...',
  disabled = false,
}: DropdownProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const select = (value: string) => {
    onChange(value);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[
          styles.trigger,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.backgroundElement,
          },
          disabled && styles.disabled,
        ]}>
        <ThemedText themeColor={selectedValue ? 'text' : 'textSecondary'}>
          {selectedValue || placeholder}
        </ThemedText>
        <ThemedText themeColor="textSecondary">▾</ThemedText>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <ThemedView type="backgroundElement" style={styles.sheet}>
            <FlatList
              data={options}
              keyExtractor={(item, i) => `${item}-${i}`}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => select(item)}
                  style={({ pressed }) => [
                    styles.option,
                    { borderBottomColor: theme.background },
                    pressed && { backgroundColor: theme.backgroundSelected },
                  ]}>
                  <ThemedText
                    themeColor={item === selectedValue ? 'text' : 'textSecondary'}>
                    {item}
                  </ThemedText>
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={styles.option}>
                  <ThemedText themeColor="textSecondary">No options</ThemedText>
                </View>
              }
            />
          </ThemedView>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  disabled: {
    opacity: 0.5,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  sheet: {
    borderRadius: Spacing.three,
    maxHeight: '60%',
    overflow: 'hidden',
  },
  option: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
