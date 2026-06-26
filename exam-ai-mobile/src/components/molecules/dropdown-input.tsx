import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Label } from '@/components/atoms/label';
import { TextField } from '@/components/atoms/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type DropdownInputProps = {
  label?: string;
  name: string;
  value: string;
  options: string[];
  onChange: (name: string, value: string) => void;
  error?: string;
  placeholder?: string;
};

/**
 * Free-text input with a filterable suggestion list — the caller can type a new
 * value or pick an existing one. Mirrors the web app's DropdownInput. Theme-
 * driven and presentation-only.
 */
export function DropdownInput({
  label,
  name,
  value,
  options,
  onChange,
  error,
  placeholder,
}: DropdownInputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const filtered = options.filter(
    (o) => o && o.toLowerCase().includes(value.toLowerCase()) && o !== value,
  );
  const showList = focused && filtered.length > 0;

  return (
    <View style={styles.field}>
      {label && <Label text={label} />}
      <TextField
        value={value}
        onChangeText={(text) => onChange(name, text)}
        onFocus={() => setFocused(true)}
        // Delay so a tap on a suggestion registers before the list unmounts.
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder={placeholder}
        autoCapitalize="none"
        hasError={!!error}
      />
      {showList && (
        <ThemedView type="backgroundElement" style={styles.list}>
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.scroll}>
            {filtered.map((option, i) => (
              <Pressable
                key={`${option}-${i}`}
                onPress={() => {
                  onChange(name, option);
                  setFocused(false);
                }}
                style={({ pressed }) => [
                  styles.option,
                  { borderBottomColor: theme.background },
                  pressed && { backgroundColor: theme.backgroundSelected },
                ]}>
                <ThemedText type="small">{option}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </ThemedView>
      )}
      {error && (
        <ThemedText type="small" style={{ color: '#e5484d' }}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.one,
  },
  list: {
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  scroll: {
    maxHeight: 160,
  },
  option: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
