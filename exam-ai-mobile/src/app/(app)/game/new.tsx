import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/atoms/button';
import { Label } from '@/components/atoms/label';
import { TextField } from '@/components/atoms/text-field';
import { InlineMessage } from '@/components/molecules/inline-message';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { createGame } from '@/service/game.service';

type InviteMethod = 'email' | 'code';

const CODE_LENGTH = 6;

export default function NewGameScreen() {
  const router = useRouter();
  const { examId } = useLocalSearchParams<{ examId?: string }>();

  const [method, setMethod] = useState<InviteMethod>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedCode = code.trim();

  const onSubmit = async () => {
    setError(null);
    if (!examId) {
      setError('Missing exam. Return to the previous screen and try again.');
      return;
    }
    if (method === 'email' && !trimmedEmail) {
      setError("Enter the opponent's email address.");
      return;
    }
    if (method === 'code' && !/^\d{6}$/.test(trimmedCode)) {
      setError('Enter the 6-digit user code.');
      return;
    }

    setSubmitting(true);
    try {
      const game = await createGame({
        examId,
        inviteeEmail: method === 'email' ? trimmedEmail : undefined,
        inviteeCode: method === 'code' ? trimmedCode : undefined,
      });
      router.replace({
        pathname: '/game/[gameId]/lobby',
        params: { gameId: game._id },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create game.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          <ThemedText type="subtitle">Invite an opponent</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Choose exactly one way to invite the other player.
          </ThemedText>

          <View style={styles.tabs}>
            <Button
              title="By email"
              variant={method === 'email' ? 'primary' : 'secondary'}
              onPress={() => {
                setMethod('email');
                setError(null);
              }}
            />
            <Button
              title="By 6-digit code"
              variant={method === 'code' ? 'primary' : 'secondary'}
              onPress={() => {
                setMethod('code');
                setError(null);
              }}
            />
          </View>

          {method === 'email' ? (
            <View style={styles.field}>
              <Label text="Opponent email" />
              <TextField
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          ) : (
            <View style={styles.field}>
              <Label text="Opponent 6-digit code" />
              <TextField
                value={code}
                onChangeText={(text) =>
                  setCode(text.replace(/\D/g, '').slice(0, CODE_LENGTH))
                }
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={CODE_LENGTH}
              />
            </View>
          )}

          <InlineMessage message={error} />

          <View style={styles.actions}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={() => router.back()}
              disabled={submitting}
            />
            <Button
              title="Send invitation"
              onPress={onSubmit}
              loading={submitting}
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
  tabs: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  field: {
    gap: Spacing.one,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
});
