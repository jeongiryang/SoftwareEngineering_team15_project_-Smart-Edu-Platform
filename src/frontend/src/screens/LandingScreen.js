import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, shadows } from '../styles/theme';

const icon = require('../assets/sagaksagak-app-icon.png');

const availableFeatures = [
  {
    label: 'AI 학습',
    title: '질문부터 오답 분석까지',
    description: '질문, 추천, 요약, 오답 분석 흐름을 한 화면에서 이어갑니다.'
  },
  {
    label: '일정/칸반',
    title: '계획과 태스크를 함께 관리',
    description: '학습 일정과 칸반 보드로 오늘 해야 할 일을 정리합니다.'
  },
  {
    label: '커뮤니티',
    title: '게시글과 댓글로 학습 공유',
    description: '질문과 기록을 나누고 반응, 북마크, 신고 흐름을 사용할 수 있습니다.'
  }
];

const flowSteps = [
  '회원가입으로 내 학습 공간을 만듭니다.',
  'AI, 일정, 칸반, 커뮤니티 중 필요한 도구를 선택합니다.',
  '기록과 피드백을 모아 오늘의 학습 방향을 다듬습니다.'
];

export default function LandingScreen({ onNavigate }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>개인화 학습 관리 플랫폼</Text>
          </View>
          <Text style={styles.title}>공부의 흔적을{'\n'}사각사각 쌓아가세요</Text>
          <Text style={styles.description}>
            질문하고, 요약하고, 틀린 이유를 되짚는 흐름을 한곳에서 관리하는
            학습 파트너입니다. AI 학습, 일정, 칸반, 커뮤니티로 오늘의 공부를 시작하세요.
          </Text>
          <View style={styles.heroActions}>
            <Pressable accessibilityRole="button" onPress={() => onNavigate('register')} style={styles.primaryButton}>
              <Text style={styles.primaryText}>무료로 시작하기</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => onNavigate('login')} style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>로그인</Text>
            </Pressable>
          </View>
        </View>
        <View style={[styles.visualCard, shadows.card]}>
          <Image source={icon} style={styles.heroIcon} />
          <View style={styles.miniPanel}>
            <View style={styles.dot} />
            <View>
              <Text style={styles.miniTitle}>오늘의 학습 지원</Text>
              <Text style={styles.miniDescription}>계획과 복습을 한 번에 이어가세요</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionEyebrow}>AVAILABLE NOW</Text>
        <Text style={styles.sectionTitle}>지금 연결된 학습 도구</Text>
        <Text style={styles.sectionDescription}>현재 구현된 API와 연결된 기능만 안내합니다.</Text>
      </View>
      <View style={styles.featureGrid}>
        {availableFeatures.map((feature) => (
          <View key={feature.title} style={[styles.featureCard, shadows.card]}>
            <Text style={styles.featureLabel}>{feature.label}</Text>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
          </View>
        ))}
      </View>

      <View style={styles.flow}>
        <View style={styles.flowCopy}>
          <Text style={styles.sectionEyebrow}>LEARNING FLOW</Text>
          <Text style={styles.flowTitle}>계획에서 복습까지,{'\n'}가볍게 시작하는 학습</Text>
          <Text style={styles.flowDescription}>
            사각사각은 다양한 학습자의 기록과 반복 학습을 돕는 서비스로 설계되었습니다.
            이번 화면에서는 현재 연결된 학습 도구와 시작 흐름을 함께 제공합니다.
          </Text>
        </View>
        <View style={styles.steps}>
          {flowSteps.map((step, index) => (
            <View key={step} style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    alignItems: 'center',
    paddingBottom: 58
  },
  hero: {
    width: '100%',
    maxWidth: 1180,
    paddingHorizontal: 18,
    paddingTop: 48,
    paddingBottom: 56,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 28
  },
  heroCopy: {
    flex: 1,
    maxWidth: 610,
    minWidth: 260
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.mintSoft,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 20,
    marginBottom: 22
  },
  pillText: {
    color: colors.mintDeep,
    fontWeight: '700',
    fontSize: 13
  },
  title: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 46,
    lineHeight: 58,
    letterSpacing: 0
  },
  description: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 30,
    marginTop: 20,
    maxWidth: 535
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 36
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 28,
    backgroundColor: colors.blue,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  primaryText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700'
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  secondaryText: {
    color: colors.blueDeep,
    fontSize: 16,
    fontWeight: '700'
  },
  visualCard: {
    width: '100%',
    maxWidth: 385,
    minHeight: 390,
    backgroundColor: colors.cream,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  heroIcon: {
    height: 238,
    width: '70%',
    maxWidth: 238,
    borderRadius: 61
  },
  miniPanel: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 17,
    marginTop: 20,
    flexDirection: 'row',
    gap: 13,
    alignItems: 'center'
  },
  dot: {
    height: 42,
    width: 42,
    borderRadius: 14,
    backgroundColor: colors.mintSoft,
    borderWidth: 10,
    borderColor: colors.mint
  },
  miniTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700'
  },
  miniDescription: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4
  },
  sectionHeading: {
    width: '100%',
    maxWidth: 1180,
    paddingHorizontal: 18,
    marginBottom: 28
  },
  sectionEyebrow: {
    color: colors.mintDeep,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 12
  },
  sectionTitle: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 30,
    letterSpacing: 0
  },
  sectionDescription: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 10
  },
  featureGrid: {
    width: '100%',
    maxWidth: 1180,
    paddingHorizontal: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 64
  },
  featureCard: {
    flex: 1,
    minWidth: 230,
    minHeight: 182,
    padding: 25,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface
  },
  featureLabel: {
    alignSelf: 'flex-start',
    color: colors.blue,
    backgroundColor: colors.blueSoft,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 18
  },
  featureTitle: {
    color: colors.ink,
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 10
  },
  featureDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22
  },
  flow: {
    width: '100%',
    maxWidth: 1180,
    paddingHorizontal: 22,
    paddingVertical: 48,
    borderRadius: 30,
    backgroundColor: colors.mintSoft,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 24
  },
  flowCopy: {
    flex: 1,
    maxWidth: 500
  },
  flowTitle: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 39
  },
  flowDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 24,
    marginTop: 15
  },
  steps: {
    flex: 1,
    minWidth: 230,
    gap: 12,
    justifyContent: 'center'
  },
  step: {
    minHeight: 62,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  stepNumber: {
    height: 34,
    width: 34,
    borderRadius: 17,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepNumberText: {
    color: colors.blue,
    fontWeight: '800'
  },
  stepText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
    flex: 1
  }
});
