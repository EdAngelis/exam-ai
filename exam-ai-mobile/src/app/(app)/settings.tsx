import { yupResolver } from '@hookform/resolvers/yup';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, View } from 'react-native';
import * as yup from 'yup';

import { Button } from '@/components/atoms/button';
import { FormInput } from '@/components/molecules/form-input';
import { InlineMessage } from '@/components/molecules/inline-message';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { updateUser } from '@/service/user.service';

type AccountForm = {
  name: string;
  email: string;
  password: string;
};

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  // Stays a required string (default '') so the resolver's input/output types
  // match; the test makes it effectively optional — blank keeps the current
  // password, otherwise it must be at least 6 characters.
  password: yup
    .string()
    .default('')
    .test(
      'len',
      'Password must be at least 6 characters',
      (v) => !v || v.length >= 6,
    ),
});

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const userId = user?._id ?? user?.id;
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccountForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setSuccess(null);
    if (!userId) {
      setError('Cannot update account: missing user id.');
      return;
    }
    try {
      await updateUser(userId, {
        name: values.name.trim(),
        email: values.email.trim(),
        ...(values.password ? { password: values.password } : {}),
      });
      setSuccess('Account updated.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update account');
    }
  });

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          <ThemedText type="smallBold">Profile</ThemedText>

          <FormInput
            control={control}
            name="name"
            label="Name"
            autoCapitalize="words"
            error={errors.name?.message}
          />
          <FormInput
            control={control}
            name="email"
            label="Email"
            keyboardType="email-address"
            error={errors.email?.message}
          />
          <FormInput
            control={control}
            name="password"
            label="New password (optional)"
            placeholder="Leave blank to keep current"
            password
            error={errors.password?.message}
          />

          <InlineMessage message={error} />
          <InlineMessage message={success} variant="success" />

          <Button
            title="Save changes"
            size="full"
            onPress={onSubmit}
            loading={isSubmitting}
          />

          <View style={styles.signOut}>
            <Button
              title="Sign out"
              size="full"
              variant="secondary"
              onPress={() => signOut()}
            />
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: Spacing.three,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
  signOut: {
    marginTop: Spacing.four,
  },
});
