import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/atoms/button';
import { ExamHistory } from '@/components/organisms/exam-history';
import { QuestionsFilter } from '@/components/organisms/questions-filter';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, isTeacher } = useAuth();
  const email = user?.email ?? '';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          <View style={styles.headerRow}>
            <View style={styles.greeting}>
              <ThemedText type="subtitle">
                Hi{user?.name ? `, ${user.name}` : ''}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {email}
              </ThemedText>
            </View>
            <Button
              title="Account"
              variant="secondary"
              onPress={() => router.push('/settings')}
            />
          </View>

          {isTeacher && (
            <View style={styles.section}>
              <ThemedText type="smallBold">Teacher tools</ThemedText>
              <QuestionsFilter userEmail={email} />
            </View>
          )}

          <View style={styles.section}>
            <ThemedText type="smallBold">Exam history</ThemedText>
            <ExamHistory userEmail={email} />
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
    gap: Spacing.five,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  greeting: {
    flexShrink: 1,
    gap: Spacing.half,
  },
  section: {
    gap: Spacing.three,
  },
});
