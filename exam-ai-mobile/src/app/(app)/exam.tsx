import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/atoms/button';
import { Loader } from '@/components/atoms/loader';
import { Dropdown } from '@/components/molecules/dropdown';
import { InlineMessage } from '@/components/molecules/inline-message';
import { TextArea } from '@/components/molecules/text-area';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import type { Exam, Question } from '@/models';
import { getExam, updateResult } from '@/service/exams.service';
import { regenerateQuestions } from '@/service/questions.service';
import { calcScore, shuffleArray } from '@/utils';

const APPLY_THIS = 'This question';
const APPLY_ALL = 'All questions';

export default function ExamScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user } = useAuth();
  const { examId } = useLocalSearchParams<{ examId?: string }>();
  const examIdRef = useRef<string | null>(null);

  const [exam, setExam] = useState<Exam | null>(null);
  const [result, setResult] = useState<number[]>([]);
  const [index, setIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showRegenerate, setShowRegenerate] = useState(false);
  const [regenPrompt, setRegenPrompt] = useState('');
  const [regenScope, setRegenScope] = useState(APPLY_THIS);
  const [regenLoading, setRegenLoading] = useState(false);

  const fetchExam = async (id: string) => {
    setError(null);
    const resp = await getExam(id);
    const shuffled = resp.questions?.map((q) => ({
      ...q,
      options: shuffleArray(q.options),
    }));
    resp.questions = shuffled;

    if (
      resp.userEmail === user?.email &&
      (user?.level ?? 0) !== 0 &&
      !resp.answers
    ) {
      setShowRegenerate(true);
    }

    setResult(new Array(resp.questions?.length ?? 0).fill(-1));
    setExam(resp);
  };

  useEffect(() => {
    if (!examId) return;
    examIdRef.current = examId;
    let cancelled = false;
    (async () => {
      try {
        await fetchExam(examId);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Could not load exam');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  if (!exam || !exam.questions || exam.questions.length === 0) {
    return error ? (
      <ThemedView style={styles.centered}>
        <InlineMessage message={error} />
      </ThemedView>
    ) : (
      <Loader />
    );
  }

  const questions = exam.questions;
  const question = questions[index];
  const lastAnswers = exam.answers?.[exam.answers.length - 1];

  const isCorrect = (qIndex: number) =>
    !!lastAnswers && lastAnswers[qIndex] === questions[qIndex].answer;

  const select = (optionIndex: number) => {
    if (submitted) return;
    setResult((prev) => {
      const next = [...prev];
      next[index] = optionIndex;
      return next;
    });
  };

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      const resp = await updateResult(examIdRef.current!, result);
      const scores = calcScore(resp.exam);
      setExam(resp.exam);
      setScore(Math.round(scores[scores.length - 1] ?? 0));
      setSubmitted(true);
      setIndex(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit exam');
    } finally {
      setBusy(false);
    }
  };

  const onRegenerate = async () => {
    const target: Question[] =
      regenScope === APPLY_THIS ? [question] : questions;
    setRegenLoading(true);
    setError(null);
    try {
      const resp = await regenerateQuestions(regenPrompt, target);
      if (resp.message === 'success') {
        await fetchExam(examIdRef.current!);
        setRegenPrompt('');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not regenerate');
    } finally {
      setRegenLoading(false);
    }
  };

  const optionStyle = (optionIndex: number) => {
    const selected = result[index] === optionIndex;
    if (!submitted) {
      return selected
        ? { borderColor: theme.text, backgroundColor: theme.backgroundSelected }
        : { borderColor: theme.backgroundElement, backgroundColor: theme.backgroundElement };
    }
    if (optionIndex === question.answer) {
      return { borderColor: '#30a46c', backgroundColor: 'rgba(48,164,108,0.15)' };
    }
    if (lastAnswers?.[index] === optionIndex) {
      return { borderColor: '#e5484d', backgroundColor: 'rgba(229,72,77,0.15)' };
    }
    return { borderColor: theme.backgroundElement, backgroundColor: theme.backgroundElement };
  };

  const isLast = index === questions.length - 1;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          {submitted && (
            <ThemedView type="backgroundElement" style={styles.scoreBox}>
              <ThemedText type="title">{score}%</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Your score
              </ThemedText>
            </ThemedView>
          )}

          <ThemedText type="subtitle">{question.question}</ThemedText>

          <View style={styles.options}>
            {question.options.map((option) => (
              <Pressable
                key={option.index}
                onPress={() => select(option.index)}
                style={[styles.option, optionStyle(option.index)]}>
                <ThemedText>{option.label}</ThemedText>
              </Pressable>
            ))}
          </View>

          {submitted && question.whenWrong && (
            <ThemedView
              style={[
                styles.feedback,
                {
                  backgroundColor: isCorrect(index)
                    ? 'rgba(48,164,108,0.12)'
                    : 'rgba(229,72,77,0.12)',
                },
              ]}>
              <ThemedText
                type="smallBold"
                style={{ color: isCorrect(index) ? '#30a46c' : '#e5484d' }}>
                {isCorrect(index) ? 'CORRECT!' : 'INCORRECT'}
              </ThemedText>
              <ThemedText type="small">{question.whenWrong}</ThemedText>
            </ThemedView>
          )}

          {showRegenerate && !submitted && (
            <ThemedView type="backgroundElement" style={styles.regenerate}>
              <ThemedText type="smallBold">Regenerate questions</ThemedText>
              <Dropdown
                options={[APPLY_THIS, APPLY_ALL]}
                selectedValue={regenScope}
                onChange={setRegenScope}
              />
              <TextArea
                value={regenPrompt}
                onChangeText={setRegenPrompt}
                placeholder="Describe how to change the question(s)..."
                rows={3}
              />
              <Button
                title="Regenerate"
                variant="secondary"
                onPress={onRegenerate}
                loading={regenLoading}
              />
            </ThemedView>
          )}

          <InlineMessage message={error} />

          <ThemedText type="small" themeColor="textSecondary" style={styles.counter}>
            Question {index + 1} of {questions.length}
          </ThemedText>

          <View style={styles.nav}>
            <Button
              title="Previous"
              variant="secondary"
              onPress={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0 || busy}
            />
            {!isLast ? (
              <Button
                title="Next"
                onPress={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
                disabled={busy}
              />
            ) : !submitted ? (
              <Button title="Submit" onPress={onSubmit} loading={busy} />
            ) : (
              <Button title="Home" onPress={() => router.replace('/')} />
            )}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  content: {
    padding: Spacing.three,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
  scoreBox: {
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.four,
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
  feedback: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  regenerate: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
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
