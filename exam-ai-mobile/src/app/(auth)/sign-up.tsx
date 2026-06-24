import { yupResolver } from '@hookform/resolvers/yup';
import { Link, useRouter } from 'expo-router';
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
import { useAuth } from '@/context/auth-context';

type SignUpForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm your password'),
});

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpForm>({
    resolver: yupResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await signUp({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      // Account created but inactive; backend emailed a verification code.
      router.push('/verify-email');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-up failed');
    }
  });

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText type="title">Create account</ThemedText>
            <ThemedText themeColor="textSecondary">
              Sign up to get started
            </ThemedText>
          </View>

          <View style={styles.form}>
            <FormInput
              control={control}
              name="name"
              label="Name"
              placeholder="Your name"
              autoCapitalize="words"
              error={errors.name?.message}
            />
            <FormInput
              control={control}
              name="email"
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              error={errors.email?.message}
            />
            <FormInput
              control={control}
              name="password"
              label="Password"
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

            <Button
              title="Sign up"
              size="full"
              onPress={onSubmit}
              loading={isSubmitting}
            />
          </View>

          <View style={styles.footer}>
            <ThemedText type="small" themeColor="textSecondary">
              Already have an account?{' '}
            </ThemedText>
            <Link href="/sign-in">
              <ThemedText type="linkPrimary">Sign in</ThemedText>
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
  header: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  form: {
    gap: Spacing.three,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
