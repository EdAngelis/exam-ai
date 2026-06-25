import { yupResolver } from '@hookform/resolvers/yup';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as yup from 'yup';

import { Button } from '@/components/atoms/button';
import { FormInput } from '@/components/molecules/form-input';
import { InlineMessage } from '@/components/molecules/inline-message';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { resetPassword } from '@/service/auth.service';

type ResetForm = {
  password: string;
  confirmPassword: string;
};

const schema = yup.object({
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm your password'),
});

export default function ResetPasswordScreen() {
  const router = useRouter();
  // `token` arrives via deep link from the reset email (?token=...).
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: yupResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setSuccess(null);
    if (!token) {
      setError('Missing or invalid reset token. Use the link from your email.');
      return;
    }
    try {
      const message = await resetPassword(token, values.password);
      setSuccess(message || 'Password updated. You can now sign in.');
      setTimeout(() => router.replace('/sign-in'), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reset password');
    }
  });

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText type="title">New password</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Choose a new password for your account.
            </ThemedText>
          </View>

          <View style={styles.form}>
            <FormInput
              control={control}
              name="password"
              label="New password"
              placeholder="At least 6 characters"
              password
              error={errors.password?.message}
            />
            <FormInput
              control={control}
              name="confirmPassword"
              label="Confirm password"
              placeholder="Re-enter your password"
              password
              error={errors.confirmPassword?.message}
            />

            <InlineMessage message={error} />
            <InlineMessage message={success} variant="success" />

            <Button
              title="Update password"
              size="full"
              onPress={onSubmit}
              loading={isSubmitting}
            />
          </View>

          <View style={styles.footer}>
            <Link href="/sign-in">
              <ThemedText type="linkPrimary">Back to sign in</ThemedText>
            </Link>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.five,
  },
  header: { alignItems: 'center', gap: Spacing.one },
  subtitle: { textAlign: 'center' },
  form: { gap: Spacing.three },
  footer: { alignItems: 'center' },
});
