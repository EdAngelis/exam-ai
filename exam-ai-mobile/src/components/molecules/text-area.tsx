import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextAreaProps = Omit<TextInputProps, 'style' | 'multiline'> & {
  rows?: number;
};

/** Multi-line text input. Theme-driven, presentation-only. */
export function TextArea({ rows = 5, ...rest }: TextAreaProps) {
  const theme = useTheme();
  return (
    <TextInput
      multiline
      numberOfLines={rows}
      textAlignVertical="top"
      placeholderTextColor={theme.textSecondary}
      style={[
        styles.input,
        {
          color: theme.text,
          backgroundColor: theme.backgroundElement,
          borderColor: theme.backgroundElement,
          minHeight: rows * 24,
        },
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
});
