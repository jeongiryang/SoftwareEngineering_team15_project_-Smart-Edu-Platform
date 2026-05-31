import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ProfileAvatar, ProfileBackground, ProfileTitleChip } from '../components/ProfileAppearance';
import { PanelSkeleton } from '../components/Skeleton';
import { useThemeMode } from '../contexts/ThemeContext';
import { useLanguage } from '../i18n';
import { getPublicProfile } from '../services/api';
import { colors, interactiveStateStyles, shadows } from '../styles/theme';

function readProfileUserId() {
  const search = globalThis.window?.location?.search || '';
  const params = new URLSearchParams(search);

  return params.get('userId') || '';
}

function formatMinutes(value, language = 'ko') {
  const minutes = Number(value || 0);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hourUnit = language === 'en' ? 'h' : language === 'zh' ? '小时' : '시간';
  const minuteUnit = language === 'en' ? 'min' : language === 'zh' ? '分' : '분';

  if (hours <= 0) {
    return language === 'en' ? `${rest} ${minuteUnit}` : `${rest}${minuteUnit}`;
  }

  if (rest === 0) {
    return language === 'en' ? `${hours} ${hourUnit}` : `${hours}${hourUnit}`;
  }

  return language === 'en'
    ? `${hours} ${hourUnit} ${rest} ${minuteUnit}`
    : `${hours}${hourUnit} ${rest}${minuteUnit}`;
}

export default function PublicProfileScreen({ onNavigate, token }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { palette } = useThemeMode();
  const { currentLanguage, t, translateText } = useLanguage();
  const userId = readProfileUserId();

  async function loadProfile() {
    if (!token || !userId) {
      setError(t('publicProfile.error.missingUser', '프로필 대상을 찾지 못했습니다.'));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await getPublicProfile(token, userId);
      setProfile(result.profile || null);
    } catch (loadError) {
      setError(loadError.message || t('publicProfile.error.loadFailed', '공개 프로필을 불러오지 못했습니다.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, [token, userId]);

  const stats = profile?.stats || {};
  const appearance = profile?.appearance || {};

  return (
    <ScrollView style={[styles.container, { backgroundColor: palette.background }]} contentContainerStyle={styles.content}>
      <View style={styles.topActions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onNavigate?.('community')}
          style={(state) => [styles.backButton, { borderColor: palette.line }, ...interactiveStateStyles(state)]}
        >
          <Text style={[styles.backButtonText, { color: palette.ink }]}>
            {t('publicProfile.back', '커뮤니티로 돌아가기')}
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.skeletonWrap}>
          <PanelSkeleton rows={5} />
          <PanelSkeleton rows={3} />
        </View>
      ) : error ? (
        <View style={[styles.errorCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.errorTitle, { color: palette.ink }]}>
            {t('publicProfile.error.title', '프로필을 확인할 수 없습니다.')}
          </Text>
          <Text style={[styles.errorText, { color: palette.muted }]}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={loadProfile}
            style={(state) => [styles.primaryButton, ...interactiveStateStyles(state)]}
          >
            <Text style={styles.primaryButtonText}>{t('publicProfile.retry', '다시 불러오기')}</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ProfileBackground appearance={appearance} style={[styles.hero, shadows.card]}>
            <View style={styles.heroContent}>
              <ProfileAvatar appearance={appearance} name={profile?.name} size="lg" />
              <View style={styles.heroCopy}>
                <Text style={styles.eyebrow}>{t('publicProfile.eyebrow', '공개 학습 프로필')}</Text>
                <Text style={styles.name}>{profile?.name || translateText('학습자')}</Text>
                <Text style={styles.loginId}>{profile?.displayLoginId}</Text>
                <ProfileTitleChip animated title={appearance.titleText} translateText={translateText} />
              </View>
            </View>
          </ProfileBackground>

          <View style={styles.grid}>
            <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>
              <Text style={[styles.cardLabel, { color: palette.muted }]}>{t('publicProfile.goal', '학습 목표')}</Text>
              <Text style={[styles.cardValue, { color: palette.ink }]}>
                {profile?.learningGoal || t('publicProfile.goal.empty', '아직 공개된 목표가 없습니다.')}
              </Text>
            </View>
            <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>
              <Text style={[styles.cardLabel, { color: palette.muted }]}>{t('publicProfile.subject', '관심 과목')}</Text>
              <Text style={[styles.cardValue, { color: palette.ink }]}>
                {profile?.preferredSubject || t('publicProfile.subject.empty', '아직 공개된 과목이 없습니다.')}
              </Text>
            </View>
          </View>

          <View style={[styles.statsCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
            <Text style={[styles.sectionTitle, { color: palette.ink }]}>
              {t('publicProfile.stats.title', '학습 요약')}
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatMinutes(stats.todayFocusMinutes, currentLanguage)}</Text>
                <Text style={[styles.statLabel, { color: palette.muted }]}>{t('publicProfile.stats.today', '오늘 집중')}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatMinutes(stats.weeklyFocusMinutes, currentLanguage)}</Text>
                <Text style={[styles.statLabel, { color: palette.muted }]}>{t('publicProfile.stats.week', '최근 7일')}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Number(stats.completedTaskCount || 0)}</Text>
                <Text style={[styles.statLabel, { color: palette.muted }]}>{t('publicProfile.stats.tasks', '완료 태스크')}</Text>
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '800'
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minWidth: 220,
    padding: 18
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 23
  },
  container: {
    flex: 1
  },
  content: {
    gap: 18,
    marginHorizontal: 'auto',
    maxWidth: 960,
    padding: 24,
    width: '100%'
  },
  errorCard: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 24
  },
  errorText: {
    fontSize: 14,
    lineHeight: 21
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '900'
  },
  eyebrow: {
    color: colors.mintDeep,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14
  },
  hero: {
    borderColor: '#DDEADD',
    borderRadius: 22,
    borderWidth: 1,
    minHeight: 220
  },
  heroContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 18,
    padding: 28
  },
  heroCopy: {
    flex: 1,
    gap: 8,
    minWidth: 0
  },
  loginId: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700'
  },
  name: {
    color: colors.blue,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 38
  },
  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.blue,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900'
  },
  skeletonWrap: {
    gap: 14
  },
  statItem: {
    backgroundColor: '#F8FBF7',
    borderRadius: 16,
    flex: 1,
    minWidth: 160,
    padding: 16
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6
  },
  statsCard: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 16,
    padding: 20
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  statValue: {
    color: colors.blue,
    fontSize: 22,
    fontWeight: '900'
  },
  topActions: {
    flexDirection: 'row'
  }
});
