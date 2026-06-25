import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  /** Renders a password input with a Show/Hide visibility toggle. */
  password?: boolean;
  /** Draws the error border state. */
  hasError?: boolean;
};

/**
 * Styled single-line text input. Theme-driven and presentation-only — fully
 * controlled by the caller via `value`/`onChangeText`. The password visibility
 * toggle is self-contained UI, so it lives here.
 */
export function TextField({ password = false, hasError = false, ...rest }: TextFieldProps) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.backgroundElement,
            borderColor: hasError ? '#e5484d' : theme.backgroundElement,
          },
          password && styles.inputWithToggle,
        ]}
        placeholderTextColor={theme.textSecondary}
        secureTextEntry={password && !visible}
        {...rest}
      />
      {password && (
        <Pressable
          accessibilityRole="button"
          onPress={() => setVisible((v) => !v)}
          style={styles.toggle}>
          <ThemedText type="small" themeColor="textSecondary">
            {visible ? 'Hide' : 'Show'}
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  inputWithToggle: {
    paddingRight: Spacing.six,
  },
  toggle: {
    position: 'absolute',
    right: Spacing.three,
    paddingVertical: Spacing.one,
  },
});
