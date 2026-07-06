import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/atoms/button';
import { DataTable } from '@/components/molecules/data-table';
import { InlineMessage } from '@/components/molecules/inline-message';
import { Pagination } from '@/components/molecules/pagination';
import { SearchBar } from '@/components/molecules/search-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import type { Exam } from '@/models';
import { insertStudentsExams } from '@/service/exams.service';
import { getUser } from '@/service/user.service';
import { clearAssignExamDraft, loadAssignExamDraft } from '@/utils';

const ITEMS_PER_PAGE = 10;

export default function AssignExamScreen() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const userEmail = authUser?.email ?? '';

  const [exam, setExam] = useState<Exam | null>(null);
  const [students, setStudents] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const draft = loadAssignExamDraft();
      if (!draft) {
        router.replace('/');
        return;
      }
      setExam(draft);

      if (!userEmail) return;
      let cancelled = false;
      (async () => {
        try {
          const data = await getUser(userEmail);
          if (!cancelled) setStudents(data.students ?? []);
        } catch (e) {
          if (!cancelled)
            setError(e instanceof Error ? e.message : 'Could not load students');
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [router, userEmail]),
  );

  const filtered = useMemo(
    () => students.filter((s) => s.toLowerCase().includes(search.toLowerCase())),
    [students, search],
  );

  const onSearchChange = (text: string) => {
    setSearch(text);
    setPage(1);
  };

  const totalPages = Math.max(Math.ceil(filtered.length / ITEMS_PER_PAGE), 1);
  const firstIndex = (page - 1) * ITEMS_PER_PAGE;
  const current = filtered.slice(firstIndex, firstIndex + ITEMS_PER_PAGE);

  const toggleStudent = (rowIndex: number) => {
    const email = current[rowIndex];
    if (!email) return;
    setSelected((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email],
    );
  };

  const onConfirm = async () => {
    setError(null);
    setSuccess(null);
    if (!exam) return;
    if (selected.length === 0) {
      setError('Select at least one student.');
      return;
    }
    setSubmitting(true);
    try {
      const resp = await insertStudentsExams(selected, exam);
      setSuccess(resp.message || 'Exam assigned successfully.');
      clearAssignExamDraft();
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not assign exam.');
    } finally {
      setSubmitting(false);
    }
  };

  const onCancel = () => {
    clearAssignExamDraft();
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          <ThemedText type="subtitle">Select students for the exam</ThemedText>

          <SearchBar value={search} onChangeText={onSearchChange} placeholder="Search students..." />

          <DataTable
            head={['Email']}
            body={current.map((s) => [s])}
            selectable
            selectedRows={current.map((s) => selected.includes(s))}
            onToggleRow={toggleStudent}
            emptyText="No students yet"
          />

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />

          <ThemedText type="small" themeColor="textSecondary">
            {selected.length} student(s) selected
          </ThemedText>

          <InlineMessage message={error} />
          <InlineMessage message={success} variant="success" />

          <View style={styles.actions}>
            <Button title="Cancel" variant="secondary" onPress={onCancel} disabled={submitting} />
            <Button title="Confirm" onPress={onConfirm} loading={submitting} />
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
});
