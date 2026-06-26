import { yupResolver } from '@hookform/resolvers/yup';
import { Link } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as yup from 'yup';

import { Button } from '@/components/atoms/button';
import { FormInput } from '@/components/molecules/form-input';
import { GoogleSignInButton } from '@/components/molecules/google-sign-in-button';
import { InlineMessage } from '@/components/molecules/inline-message';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useGoogleAuth } from '@/hooks/use-google-auth';

type SignInForm = {
  email: string;
  password: string;
};

const schema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

export default function SignInScreen() {
  const { signIn, signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInForm>({
    resolver: yupResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await signIn(values.email.trim(), values.password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed');
    }
  });

  const { promptAsync, isReady } = useGoogleAuth(async (idToken) => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle(idToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  });

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText type="title">Exam-AI</ThemedText>
            <ThemedText themeColor="textSecondary">Sign in to continue</ThemedText>
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
            <FormInput
              control={control}
              name="password"
              label="Password"
              placeholder="Your password"
              password
              error={errors.password?.message}
            />

            <InlineMessage message={error} />

            <Button
              title="Sign in"
              size="full"
              onPress={onSubmit}
              loading={isSubmitting}
            />

            <View style={styles.divider}>
              <ThemedText type="small" themeColor="textSecondary">
                or
              </ThemedText>
            </View>

            <GoogleSignInButton
              onPress={promptAsync}
              disabled={!isReady}
              loading={googleLoading}
            />
          </View>

          <View style={styles.footer}>
            <Link href="/forgot-password">
              <ThemedText type="linkPrimary">Forgot password?</ThemedText>
            </Link>
            <View style={styles.signupRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Don&apos;t have an account?{' '}
              </ThemedText>
              <Link href="/sign-up">
                <ThemedText type="linkPrimary">Sign up</ThemedText>
              </Link>
            </View>
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
  divider: {
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  footer: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
