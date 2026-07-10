import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/atoms/button';
import { Loader } from '@/components/atoms/loader';
import { InlineMessage } from '@/components/molecules/inline-message';
import { Pagination } from '@/components/molecules/pagination';
import { SearchBar } from '@/components/molecules/search-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Exam } from '@/models';
import { getExams } from '@/service/exams.service';
import { calcScore } from '@/utils';

const ITEMS_PER_PAGE = 10;

/**
 * Paginated, searchable list of a user's past exams, each showing its last 3
 * scores and a start/retake action. Feature-aware organism: fetches its own
 * data for the given userEmail.
 */
export function ExamHistory({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    if (!userEmail) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await getExams(userEmail);
        if (!cancelled) setExams(list ?? []);
      } catch {
        // A 404 ("Exams not found") just means an empty history.
        if (!cancelled) {
          setExams([]);
          setError(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userEmail]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return exams.filter(
      (exam) =>
        exam.category?.toLowerCase().includes(term) ||
        exam.subCategory?.toLowerCase().includes(term) ||
        (exam.subject?.toLowerCase() || '').includes(term),
    );
  }, [exams, search]);

  const totalPages = Math.max(Math.ceil(filtered.length / ITEMS_PER_PAGE), 1);
  const current = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const onSearchChange = (text: string) => {
    setSearch(text);
    setPage(1);
  };

  if (loading) return <Loader fullscreen={false} />;

  return (
    <View style={styles.container}>
      <SearchBar
        value={search}
        onChangeText={onSearchChange}
        placeholder="Search by category, subcategory or topic..."
      />

      <InlineMessage message={error} />

      {current.length === 0 ? (
        <ThemedText themeColor="textSecondary" style={styles.empty}>
          No exams yet.
        </ThemedText>
      ) : (
        current.map((exam) => {
          const scores = calcScore(exam).slice(-3);
          return (
            <ThemedView key={exam._id} type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">{exam.category}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {[exam.subject, exam.subCategory].filter(Boolean).join(' · ')}
              </ThemedText>

              <View style={styles.scores}>
                {scores.map((score, i) => (
                  <ThemedView
                    key={i}
                    style={[
                      styles.scoreBadge,
                      { backgroundColor: score >= 70 ? '#30a46c' : '#e5484d' },
                    ]}>
                    <ThemedText type="small" themeColor="background">
                      {Math.round(score)}%
                    </ThemedText>
                  </ThemedView>
                ))}
              </View>

              <Button
                title={exam.answers ? 'Retake' : 'Start exam'}
                size="full"
                onPress={() =>
                  router.push({
                    pathname: '/exam',
                    params: { examId: exam._id as string },
                  })
                }
              />
              <Button
                title="Start game"
                size="full"
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: '/game/new',
                    params: { examId: exam._id as string },
                  })
                }
              />
            </ThemedView>
          );
        })
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  scores: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  scoreBadge: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
});
