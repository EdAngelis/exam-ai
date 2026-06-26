import { yupResolver } from '@hookform/resolvers/yup';
import { Link } from 'expo-router';
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
import { sendResetPasswordToken } from '@/service/auth.service';

type ForgotForm = { email: string };

const schema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
});

export default function ForgotPasswordScreen() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: yupResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setSuccess(null);
    try {
      const message = await sendResetPasswordToken(values.email.trim());
      setSuccess(message || 'Check your email for a reset link.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send reset email');
    }
  });

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText type="title">Reset password</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Enter your email and we&apos;ll send you a reset link.
            </ThemedText>
          </View>

          <View style={styles.form}>
            <FormInput
              control={control}
              name="email"
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              error={errors.email?.message}
            />

            <InlineMessage message={error} />
            <InlineMessage message={success} variant="success" />

            <Button
              title="Send reset link"
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
