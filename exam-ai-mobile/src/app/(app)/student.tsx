import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { DataTable } from '@/components/molecules/data-table';
import { InlineMessage } from '@/components/molecules/inline-message';
import { InputButton } from '@/components/molecules/input-button';
import { Pagination } from '@/components/molecules/pagination';
import { SearchBar } from '@/components/molecules/search-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import type { User } from '@/models';
import { addStudent, getUser, removeStudent } from '@/service/user.service';

const ITEMS_PER_PAGE = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function StudentScreen() {
  const { user: authUser } = useAuth();
  const userEmail = authUser?.email ?? '';
  const [user, setUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userEmail) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getUser(userEmail);
        if (!cancelled) setUser(data);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Could not load students');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userEmail]);

  const onAdd = async (studentEmail: string) => {
    setError(null);
    if (!EMAIL_RE.test(studentEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    try {
      const updated = await addStudent(userEmail, studentEmail);
      setUser(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add student');
    }
  };

  const students = useMemo(() => user?.students ?? [], [user]);
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

  const onRemove = async (rowIndex: number) => {
    setError(null);
    const studentEmail = current[rowIndex];
    if (!studentEmail) return;
    try {
      const updated = await removeStudent(userEmail, studentEmail);
      setUser(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove student');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          <ThemedText type="smallBold">Add a student</ThemedText>
          <InputButton
            onSubmit={onAdd}
            placeholder="student@example.com"
            buttonTitle="Add"
            keyboardType="email-address"
          />

          <InlineMessage message={error} />

          <ThemedText type="smallBold">Students</ThemedText>
          <SearchBar value={search} onChangeText={onSearchChange} placeholder="Search students..." />

          <DataTable
            head={['Email']}
            body={current.map((s) => [s])}
            deleteEnabled
            onDelete={onRemove}
            emptyText="No students yet"
          />

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
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
});
