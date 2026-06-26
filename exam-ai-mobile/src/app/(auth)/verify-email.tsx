import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/atoms/button';
import { Label } from '@/components/atoms/label';
import { TextField } from '@/components/atoms/text-field';
import { InlineMessage } from '@/components/molecules/inline-message';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { verifyEmail } from '@/service/auth.service';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setSuccess(null);
    if (code.trim().length !== 6) {
      setError('Enter the 6-digit code from your email');
      return;
    }
    setLoading(true);
    try {
      const message = await verifyEmail(code.trim());
      setSuccess(message || 'Email verified. You can now sign in.');
      setTimeout(() => router.replace('/sign-in'), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText type="title">Verify email</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Enter the 6-digit code we sent to your email address.
            </ThemedText>
          </View>

          <View style={styles.form}>
            <Label text="Verification code" />
            <TextField
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
              hasError={!!error}
            />

            <InlineMessage message={error} />
            <InlineMessage message={success} variant="success" />

            <Button
              title="Verify"
              size="full"
              onPress={onSubmit}
              loading={loading}
            />
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
});
