import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { StyleSheet, View, type KeyboardTypeOptions } from 'react-native';

import { Label } from '@/components/atoms/label';
import { TextField } from '@/components/atoms/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export type FormInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  placeholder?: string;
  password?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
};

/**
 * React Hook Form-bound text field: Label + TextField + inline error. Generic
 * over the form's value type, so it's fully reusable across every form. Holds
 * no business logic — the parent owns the schema and the `control`.
 */
export function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  password = false,
  keyboardType,
  autoCapitalize = 'none',
  error,
}: FormInputProps<T>) {
  return (
    <View style={styles.field}>
      {label && <Label text={label} />}
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            value={value ?? ''}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            password={password}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            hasError={!!error}
          />
        )}
      />
      {error && (
        <ThemedText type="small" style={styles.error}>
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
  error: {
    color: '#e5484d',
  },
});
