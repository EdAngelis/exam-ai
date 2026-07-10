import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/atoms/button';
import { Label } from '@/components/atoms/label';
import { Dropdown } from '@/components/molecules/dropdown';
import { InlineMessage } from '@/components/molecules/inline-message';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Exam, Question, User } from '@/models';
import { insertExam } from '@/service/exams.service';
import {
  getCategory,
  getQuestions,
  getSubcategory,
} from '@/service/questions.service';
import { getUser } from '@/service/user.service';
import { saveAssignExamDraft } from '@/utils';

const SELECT_CATEGORY = 'Select Category';
const SELECT_SUBCATEGORY = 'Select SubCategory';
const SELECT_SUBJECT = 'Select Subject';

/**
 * Teacher-only tools: cascading category/subcategory/topic filters that build an
 * exam from the matching questions, plus actions to start it, assign it to
 * students, or jump to the generator. Feature-aware organism.
 */
export function QuestionsFilter({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filtered, setFiltered] = useState<Question[]>([]);

  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState(SELECT_CATEGORY);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [subCategory, setSubCategory] = useState(SELECT_SUBCATEGORY);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subject, setSubject] = useState(SELECT_SUBJECT);

  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!userEmail) return;
    let cancelled = false;
    (async () => {
      try {
        const [cats, u] = await Promise.all([
          getCategory(userEmail),
          getUser(userEmail),
        ]);
        if (cancelled) return;
        setCategories([SELECT_CATEGORY, ...(cats ?? [])]);
        setUser(u);
      } catch {
        // Leave defaults; the dropdowns simply stay empty.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userEmail]);

  const onCategoryChange = async (value: string) => {
    setCategory(value);
    setSubCategory(SELECT_SUBCATEGORY);
    setSubject(SELECT_SUBJECT);
    setSubjects([]);
    setQuestions([]);
    setFiltered([]);
    if (value === SELECT_CATEGORY) {
      setSubCategories([]);
      return;
    }
    try {
      const subs = await getSubcategory(value, userEmail);
      setSubCategories([SELECT_SUBCATEGORY, ...(subs ?? [])]);
    } catch {
      setSubCategories([]);
    }
  };

  const onSubCategoryChange = async (value: string) => {
    setSubCategory(value);
    setSubject(SELECT_SUBJECT);
    if (value === SELECT_SUBCATEGORY) {
      setSubjects([]);
      setQuestions([]);
      setFiltered([]);
      return;
    }
    try {
      const qs = await getQuestions(userEmail, category, value);
      const list = qs ?? [];
      const distinct = Array.from(
        new Set(list.map((q) => (q.subject || q.subJect || '') as string)),
      ).filter(Boolean);
      setSubjects([SELECT_SUBJECT, ...distinct]);
      setQuestions(list);
      setFiltered(list);
    } catch {
      setQuestions([]);
      setFiltered([]);
    }
  };

  const onSubjectChange = (value: string) => {
    setSubject(value);
    if (value === SELECT_SUBJECT) {
      setFiltered(questions);
      return;
    }
    setFiltered(questions.filter((q) => (q.subject || q.subJect) === value));
  };

  const buildExam = (): Exam =>
    ({
      userEmail,
      questionsId: filtered.map((q) => q._id),
      category,
      subCategory,
      subject: subject === SELECT_SUBJECT ? undefined : subject,
    }) as Exam;

  const startExam = async () => {
    setMessage(null);
    if (filtered.length === 0) {
      setMessage('Select at least one question to start an exam.');
      return;
    }
    try {
      const resp = await insertExam(buildExam());
      router.push({
        pathname: '/exam',
        params: { examId: resp.exam.insertedId },
      });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not create exam.');
    }
  };

  const startGame = async () => {
    setMessage(null);
    if (filtered.length === 0) {
      setMessage('Select at least one question to start a game.');
      return;
    }
    try {
      const resp = await insertExam(buildExam());
      router.push({
        pathname: '/game/new',
        params: { examId: resp.exam.insertedId },
      });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not create exam.');
    }
  };

  const goToAssignExam = () => {
    setMessage(null);
    if (filtered.length === 0) {
      setMessage('Select at least one question first.');
      return;
    }
    const students = user?.students ?? [];
    if (students.length === 0) {
      setMessage('You have no students to assign this exam to.');
      return;
    }
    saveAssignExamDraft(buildExam());
    router.push('/assign-exam');
  };

  const goToGenerator = () => {
    router.push({
      pathname: '/generator',
      params: {
        category: category === SELECT_CATEGORY ? '' : category,
        subCategory: subCategory === SELECT_SUBCATEGORY ? '' : subCategory,
        subject: subject === SELECT_SUBJECT ? '' : subject,
      },
    });
  };

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <View style={styles.menu}>
        <Button
          title="Manage students"
          variant="secondary"
          onPress={() => router.push('/student')}
        />
        <Button title="Generate questions" variant="secondary" onPress={goToGenerator} />
      </View>

      <View style={styles.field}>
        <Label text="Category" />
        <Dropdown
          options={categories}
          selectedValue={category}
          onChange={onCategoryChange}
        />
      </View>

      <View style={styles.field}>
        <Label text="Subcategory" />
        <Dropdown
          options={subCategories}
          selectedValue={subCategory}
          onChange={onSubCategoryChange}
          disabled={subCategories.length === 0}
        />
      </View>

      <View style={styles.field}>
        <Label text="Topic" />
        <Dropdown
          options={subjects}
          selectedValue={subject}
          onChange={onSubjectChange}
          disabled={subjects.length === 0}
        />
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        Questions: {filtered.length}
      </ThemedText>

      <InlineMessage message={message} />

      <Button title="Start exam" size="full" onPress={startExam} />
      <Button
        title="Start game"
        size="full"
        variant="secondary"
        onPress={startGame}
      />
      <Button
        title="Assign exam to students"
        size="full"
        variant="secondary"
        onPress={goToAssignExam}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  menu: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  field: {
    gap: Spacing.one,
  },
});
