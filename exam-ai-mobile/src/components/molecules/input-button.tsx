import { useState } from 'react';
import { StyleSheet, View, type KeyboardTypeOptions } from 'react-native';

import { Button } from '@/components/atoms/button';
import { TextField } from '@/components/atoms/text-field';
import { Spacing } from '@/constants/theme';

export type InputButtonProps = {
  onSubmit: (value: string) => void;
  placeholder?: string;
  buttonTitle?: string;
  keyboardType?: KeyboardTypeOptions;
  /** Clear the input after submit. Defaults to true. */
  clearOnSubmit?: boolean;
};

/**
 * Text input with an inline submit button. Manages only its own draft text;
 * hands the value to `onSubmit`. Presentation-only otherwise.
 */
export function InputButton({
  onSubmit,
  placeholder,
  buttonTitle = 'Add',
  keyboardType,
  clearOnSubmit = true,
}: InputButtonProps) {
  const [value, setValue] = useState('');

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    if (clearOnSubmit) setValue('');
  };

  return (
    <View style={styles.row}>
      <View style={styles.input}>
        <TextField
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={submit}
          returnKeyType="done"
        />
      </View>
      <Button title={buttonTitle} onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  input: {
    flex: 1,
  },
});
