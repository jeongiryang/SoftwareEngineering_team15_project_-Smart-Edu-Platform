import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import FeatureGuideModal from '../components/FeatureGuideModal';
import { colors, shadows } from '../styles/theme';

const AI_GUIDE_STORAGE_KEY = 'sagaksagakAiGuideDismissed';

const featureCards = [
  { label: 'AI 학습 센터', summary: '질문, 맞춤 추천, 요약, 오답 분석', status: '사용 가능', screen: 'aiLearning', featured: true },
  { label: '학습 일정', summary: '학습 계획과 마감 일정 관리', status: 'API 준비됨' },
  { label: '칸반 보드', summary: '할 일과 진행 상태 관리', status: 'API 준비됨' },
  { label: '학습 노트', summary: '학습 기록 작성과 보관', status: 'API 준비됨' },
  { label: '커뮤니티', summary: '게시판 학습 기록 공유', status: 'API 준비됨' }
];

export default function DashboardScreen({ onNavigate, user }) {
  const hasAdminRole = user?.role === 'ADMIN';
  const [showAIGuide, setShowAIGuide] = useState(false);

  function isGuideDismissed() {
    try {
      return globalThis.localStorage?.getItem(AI_GUIDE_STORAGE_KEY) === 'true';
    } catch (error) {
      return false;
    }
  }

  function openAILearning() {
    if (isGuideDismissed()) {
      onNavigate('aiLearning');
      return;
    }

    setShowAIGuide(true);
  }

  function continueToAILearning(doNotShowAgain) {
    if (doNotShowAgain) {
      try {
        globalThis.localStorage?.setItem(AI_GUIDE_STORAGE_KEY, 'true');
      } catch (error) {
        // Browsers with disabled storage can still proceed without persisting preference.
      }
    }

    setShowAIGuide(false);
    onNavigate('aiLearning');
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.welcome}>
        <View style={styles.welcomeCopy}>
          <Text style={styles.eyebrow}>MY LEARNING SPACE</Text>
          <Text style={styles.title}>{user?.name}님, 오늘도{'\n'}사각사각 기록해요</Text>
          <Text style={styles.subtitle}>현재 연결된 AI 학습 지원으로 질문과 복습을 바로 시작할 수 있습니다.</Text>
          <Pressable onPress={openAILearning} style={styles.startButton}>
            <Text style={styles.startButtonText}>AI 학습 시작하기</Text>
          </Pressable>
        </View>
        <View style={[styles.profileCard, shadows.card]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.slice(0, 1) || '학'}</Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.memberBadge}>
            <Text style={styles.memberBadgeText}>{hasAdminRole ? 'ADMIN ACCOUNT' : 'LEARNER ACCOUNT'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>학습 기능</Text>
          <Text style={styles.sectionSub}>현재 화면에서 바로 이용 가능한 기능을 먼저 확인하세요.</Text>
        </View>
      </View>
      <View style={styles.grid}>
        {featureCards.map((card) => (
          <Pressable
            key={card.label}
            disabled={!card.screen}
            onPress={card.screen ? openAILearning : undefined}
            style={[styles.card, card.featured && styles.featuredCard, shadows.card]}
          >
            <View style={[styles.status, card.featured ? styles.availableStatus : styles.apiStatus]}>
              <Text style={[styles.statusText, card.featured && styles.availableStatusText]}>{card.status}</Text>
            </View>
            <Text style={[styles.cardTitle, card.featured && styles.featuredTitle]}>{card.label}</Text>
            <Text style={styles.cardDescription}>{card.summary}</Text>
            {card.featured ? <Text style={styles.enterText}>바로 이동  →</Text> : null}
          </Pressable>
        ))}
        {hasAdminRole ? (
          <Pressable onPress={() => onNavigate('admin')} style={[styles.card, styles.adminCard, shadows.card]}>
            <View style={styles.adminStatus}>
              <Text style={styles.adminStatusText}>ADMIN</Text>
            </View>
            <Text style={styles.cardTitle}>관리자 콘솔</Text>
            <Text style={styles.cardDescription}>사용자 상태와 신고 콘텐츠 조치</Text>
            <Text style={styles.enterText}>콘솔 이동  →</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>현재 제공 범위 안내</Text>
        <Text style={styles.noticeText}>
          AI 학습 센터와 관리자 계정용 콘솔은 화면에서 이용할 수 있습니다. 일정, 보드, 노트,
          커뮤니티 API는 구현되어 있으며 사용자 화면 연결은 후속 작업 범위입니다.
        </Text>
      </View>
      </ScrollView>
      <FeatureGuideModal
        onClose={() => setShowAIGuide(false)}
        onContinue={continueToAILearning}
        visible={showAIGuide}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 1120, alignSelf: 'center', paddingHorizontal: 26, paddingVertical: 40, paddingBottom: 60, gap: 36 },
  welcome: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'stretch', gap: 26 },
  welcomeCopy: {
    flex: 1,
    borderRadius: 28,
    paddingHorizontal: 38,
    paddingVertical: 36,
    backgroundColor: colors.mintSoft
  },
  eyebrow: { color: colors.mintDeep, fontSize: 12, fontWeight: '800', letterSpacing: 1.4, marginBottom: 16 },
  title: { color: colors.ink, fontSize: 34, lineHeight: 46, letterSpacing: -1.2, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 24, marginTop: 13, marginBottom: 29 },
  startButton: { alignSelf: 'flex-start', backgroundColor: colors.blue, minHeight: 49, borderRadius: 25, justifyContent: 'center', paddingHorizontal: 23 },
  startButtonText: { color: colors.surface, fontWeight: '700', fontSize: 14 },
  profileCard: {
    width: 267,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 27,
    padding: 29,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatar: { width: 67, height: 67, borderRadius: 34, backgroundColor: colors.cream, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarText: { color: colors.blue, fontSize: 26, fontWeight: '800' },
  userName: { color: colors.ink, fontWeight: '800', fontSize: 19 },
  userEmail: { color: colors.muted, fontSize: 13, marginTop: 6, marginBottom: 17 },
  memberBadge: { backgroundColor: colors.blueSoft, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 7 },
  memberBadgeText: { color: colors.blue, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  sectionTitle: { fontSize: 25, color: colors.ink, fontWeight: '800' },
  sectionSub: { color: colors.muted, fontSize: 14, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  card: {
    width: '31.9%',
    minHeight: 172,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 20
  },
  featuredCard: { backgroundColor: colors.blue, borderColor: colors.blue },
  adminCard: { backgroundColor: colors.surfaceWarm },
  status: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 11, marginBottom: 17 },
  apiStatus: { backgroundColor: colors.mintSoft },
  availableStatus: { backgroundColor: 'rgba(255,255,255,0.18)' },
  statusText: { color: colors.mintDeep, fontSize: 11, fontWeight: '700' },
  availableStatusText: { color: colors.surface },
  cardTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginBottom: 9 },
  featuredTitle: { color: colors.surface },
  cardDescription: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  enterText: { color: colors.mint, marginTop: 17, fontWeight: '700', fontSize: 13 },
  adminStatus: { alignSelf: 'flex-start', backgroundColor: colors.cream, borderRadius: 11, paddingVertical: 6, paddingHorizontal: 10, marginBottom: 17 },
  adminStatusText: { color: colors.blue, fontSize: 11, fontWeight: '800' },
  notice: { backgroundColor: colors.surface, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', gap: 28 },
  noticeTitle: { color: colors.blueDeep, fontWeight: '800', fontSize: 14, minWidth: 130 },
  noticeText: { color: colors.muted, fontSize: 13, lineHeight: 21, flex: 1 }
});
