import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/atoms/button';
import { Label } from '@/components/atoms/label';
import { TextField } from '@/components/atoms/text-field';
import { Dropdown } from '@/components/molecules/dropdown';
import { DropdownInput } from '@/components/molecules/dropdown-input';
import { InlineMessage } from '@/components/molecules/inline-message';
import { TextArea } from '@/components/molecules/text-area';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import {
  generateQuestions,
  getCategory,
  getQuestions,
  getSubcategory,
  type GenerateQuestionsParams,
} from '@/service/questions.service';

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export default function GeneratorScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user } = useAuth();
  const userEmail = user?.email ?? '';
  const params = useLocalSearchParams<{
    category?: string;
    subCategory?: string;
    subject?: string;
  }>();

  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);

  const [form, setForm] = useState({
    category: params.category ?? '',
    subCategory: params.subCategory ?? '',
    subject: params.subject ?? '',
    lang: 'English',
    numberOfQuestions: '8',
    prompt: '',
    difficulty: 'medium' as Difficulty,
  });
  const [errors, setErrors] = useState({ category: '', subCategory: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setField = (name: string, value: string) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  useEffect(() => {
    if (!userEmail) return;
    let cancelled = false;
    (async () => {
      try {
        const [cats, subs, qs] = await Promise.all([
          getCategory(userEmail),
          form.category
            ? getSubcategory(form.category, userEmail)
            : Promise.resolve([]),
          form.category
            ? getQuestions(userEmail, form.category, form.subCategory)
            : Promise.resolve([]),
        ]);
        if (cancelled) return;
        setCategories(cats ?? []);
        setSubCategories(subs ?? []);
        setSubjects(
          Array.from(
            new Set((qs ?? []).map((q) => String(q.subject || q.subJect || ''))),
          ).filter(Boolean),
        );
      } catch {
        // Non-fatal: the inputs still accept free text.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userEmail, form.category, form.subCategory]);

  const onSubmit = async () => {
    const newErrors = {
      category: form.category ? '' : 'Category is required',
      subCategory: form.subCategory ? '' : 'Subcategory is required',
    };
    setErrors(newErrors);
    if (newErrors.category || newErrors.subCategory) return;

    setError(null);
    setLoading(true);
    const data: GenerateQuestionsParams = {
      userEmail,
      category: form.category,
      subCategory: form.subCategory,
      subject: form.subject,
      lang: form.lang,
      numberOfQuestions: Math.min(
        20,
        parseInt(form.numberOfQuestions, 10) || 8,
      ),
      prompt: form.prompt,
      difficulty: form.difficulty,
    };
    try {
      const examId = await generateQuestions(data);
      router.replace({ pathname: '/exam', params: { examId } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate questions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          <DropdownInput
            label="Category *"
            name="category"
            value={form.category}
            options={categories}
            onChange={setField}
            error={errors.category}
          />
          <DropdownInput
            label="Subcategory *"
            name="subCategory"
            value={form.subCategory}
            options={subCategories}
            onChange={setField}
            error={errors.subCategory}
          />
          <DropdownInput
            label="Specific topic"
            name="subject"
            value={form.subject}
            options={subjects}
            onChange={setField}
          />

          <View style={styles.field}>
            <Label text="Language" />
            <TextField
              value={form.lang}
              onChangeText={(v) => setField('lang', v)}
              placeholder="e.g. English"
            />
          </View>

          <View style={styles.field}>
            <Label text="Number of questions (max 20)" />
            <TextField
              value={form.numberOfQuestions}
              onChangeText={(v) => setField('numberOfQuestions', v)}
              keyboardType="number-pad"
              placeholder="8"
            />
          </View>

          <View style={styles.field}>
            <Label text="Difficulty" />
            <Dropdown
              options={DIFFICULTIES.map((d) => d.label)}
              selectedValue={
                DIFFICULTIES.find((d) => d.value === form.difficulty)?.label
              }
              onChange={(label) => {
                const match = DIFFICULTIES.find((d) => d.label === label);
                if (match) setField('difficulty', match.value);
              }}
            />
          </View>

          <View style={styles.field}>
            <Label text="Prompt / source text" />
            <TextArea
              value={form.prompt}
              onChangeText={(v) => setField('prompt', v)}
              placeholder="Paste an article, a URL, or describe how the questions should be written."
            />
          </View>

          <InlineMessage message={error} />

          <Button
            title="Generate"
            size="full"
            onPress={onSubmit}
            loading={loading}
          />
          <Pressable onPress={() => router.back()} style={styles.cancel}>
            <ThemedText type="small" themeColor="textSecondary" style={{ color: theme.textSecondary }}>
              Cancel
            </ThemedText>
          </Pressable>
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
  field: {
    gap: Spacing.one,
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
});
