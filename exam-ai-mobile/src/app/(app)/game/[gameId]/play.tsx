import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/atoms/button';
import { Loader } from '@/components/atoms/loader';
import { InlineMessage } from '@/components/molecules/inline-message';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  getGame,
  getPlayableGame,
  submitGameAnswers,
} from '@/service/game.service';
import type {
  GameSummary,
  PlayableGame,
  PlayableQuestion,
  SubmittedAnswer,
} from '@/types/game';

const RESULT_POLL_INTERVAL_MS = 3000;

const formatTime = (seconds: number): string => {
  const safe = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const ss = (safe % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
};

const computeRemainingSeconds = (game: GameSummary): number => {
  if (!game.startedAt) return game.timeLimitSeconds;
  const startMs = new Date(game.startedAt).getTime();
  const endMs = startMs + game.timeLimitSeconds * 1000;
  return Math.max(0, Math.floor((endMs - Date.now()) / 1000));
};

export default function GamePlayScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { gameId } = useLocalSearchParams<{ gameId?: string }>();

  const [playable, setPlayable] = useState<PlayableGame | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [awaitingOpponent, setAwaitingOpponent] = useState(false);
  const autoSubmittedRef = useRef(false);

  const submit = useCallback(
    async ({ auto }: { auto: boolean }) => {
      if (!gameId || !playable || submitting || submitted) return;
      setSubmitting(true);
      setError(null);
      try {
        const payload: SubmittedAnswer[] = playable.exam.questions.map(
          (question) => ({
            questionId: question._id,
            answer: answers[question._id] ?? -1,
          }),
        );
        const res = await submitGameAnswers(gameId, payload);
        setSubmitted(true);
        if (res.result) {
          router.replace({
            pathname: '/game/[gameId]/result',
            params: { gameId },
          });
        } else {
          setAwaitingOpponent(true);
        }
      } catch (e) {
        if (!auto) {
          setError(e instanceof Error ? e.message : 'Could not submit answers.');
        }
      } finally {
        setSubmitting(false);
      }
    },
    [answers, gameId, playable, router, submitted, submitting],
  );

  // Initial load: fetch playable exam. If the game is already completed on
  // arrival (e.g. time expired between screens), jump straight to the result.
  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPlayableGame(gameId);
        if (cancelled) return;
        setPlayable(data);
        setRemaining(computeRemainingSeconds(data.game));
      } catch (e) {
        if (cancelled) return;
        try {
          const game = await getGame(gameId);
          if (cancelled) return;
          if (game.status === 'completed') {
            router.replace({
              pathname: '/game/[gameId]/result',
              params: { gameId },
            });
            return;
          }
          setError(e instanceof Error ? e.message : 'Could not load game.');
        } catch {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : 'Could not load game.');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gameId, router]);

  // Countdown tick: recompute from the authoritative startedAt so it doesn't
  // drift when the tab is backgrounded.
  useEffect(() => {
    if (!playable || submitted || awaitingOpponent) return;
    const tick = () => setRemaining(computeRemainingSeconds(playable.game));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [playable, submitted, awaitingOpponent]);

  // Auto-submit when the countdown hits zero. The backend also finalises on
  // expiry, but submitting client-side captures whatever the user picked.
  useEffect(() => {
    if (
      !playable ||
      submitted ||
      submitting ||
      autoSubmittedRef.current ||
      remaining > 0
    ) {
      return;
    }
    autoSubmittedRef.current = true;
    void submit({ auto: true });
  }, [remaining, playable, submitted, submitting, submit]);

  // Waiting for the opponent: poll the game until it's completed, then jump
  // to the result screen.
  useEffect(() => {
    if (!awaitingOpponent || !gameId) return;
    let cancelled = false;
    const check = async () => {
      try {
        const game = await getGame(gameId);
        if (!cancelled && game.status === 'completed') {
          router.replace({
            pathname: '/game/[gameId]/result',
            params: { gameId },
          });
        }
      } catch {
        // Keep polling; a transient error shouldn't abort the wait.
      }
    };
    void check();
    const interval = setInterval(check, RESULT_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [awaitingOpponent, gameId, router]);

  const questions: PlayableQuestion[] = useMemo(
    () => playable?.exam.questions ?? [],
    [playable],
  );
  const answered = useMemo(() => Object.keys(answers).length, [answers]);

  if (loading) return <Loader />;

  if (error && !playable) {
    return (
      <ThemedView style={styles.centered}>
        <InlineMessage message={error} />
        <Button title="Back" variant="secondary" onPress={() => router.back()} />
      </ThemedView>
    );
  }

  if (awaitingOpponent) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle">Waiting for opponent</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Your answers have been submitted. This screen will update once the
          other player finishes or the timer runs out.
        </ThemedText>
        <Loader fullscreen={false} />
      </ThemedView>
    );
  }

  const question = questions[index];
  if (!question) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">
          This game has no questions.
        </ThemedText>
        <Button title="Back" variant="secondary" onPress={() => router.back()} />
      </ThemedView>
    );
  }

  const options = question.options ?? [];
  const selected = answers[question._id];

  const select = (optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [question._id]: optionIndex }));
  };

  const isLast = index === questions.length - 1;

  const optionStyle = (optionIndex: number) => {
    const isSelected = selected === optionIndex;
    return isSelected
      ? { borderColor: theme.text, backgroundColor: theme.backgroundSelected }
      : {
          borderColor: theme.backgroundElement,
          backgroundColor: theme.backgroundElement,
        };
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          <ThemedView type="backgroundElement" style={styles.timerRow}>
            <ThemedText type="smallBold">Time remaining</ThemedText>
            <ThemedText type="title">{formatTime(remaining)}</ThemedText>
          </ThemedView>

          <ThemedText type="subtitle">{question.question}</ThemedText>

          <View style={styles.options}>
            {options.map((option) => (
              <Pressable
                key={option.index}
                onPress={() => select(option.index)}
                style={[styles.option, optionStyle(option.index)]}>
                <ThemedText>{option.label}</ThemedText>
              </Pressable>
            ))}
          </View>

          <InlineMessage message={error} />

          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.counter}>
            Question {index + 1} of {questions.length} · {answered} answered
          </ThemedText>

          <View style={styles.nav}>
            <Button
              title="Previous"
              variant="secondary"
              onPress={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0 || submitting}
            />
            {!isLast ? (
              <Button
                title="Next"
                onPress={() =>
                  setIndex((i) => Math.min(questions.length - 1, i + 1))
                }
                disabled={submitting}
              />
            ) : (
              <Button
                title="Submit"
                onPress={() => submit({ auto: false })}
                loading={submitting}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  content: {
    padding: Spacing.three,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
  timerRow: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    alignItems: 'center',
    gap: Spacing.one,
  },
  options: {
    gap: Spacing.two,
  },
  option: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  counter: {
    textAlign: 'center',
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
});
