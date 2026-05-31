import { useState } from 'react';
import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import WritingEraseText from '../components/WritingEraseText';
import { useLanguage } from '../i18n';
import { colors, interactiveStateStyles, shadows } from '../styles/theme';

const icon = require('../assets/sagaksagak-app-icon.png');
const GITHUB_REPOSITORY_URL = 'https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform';
const GITHUB_ICON_COLOR = '#24292f';
const githubSvgStyle = {
  display: 'block',
  flexShrink: 0
};

const availableFeatureKeys = [
  {
    labelKey: 'landing.feature.ai.label',
    titleKey: 'landing.feature.ai.title',
    descriptionKey: 'landing.feature.ai.description'
  },
  {
    labelKey: 'landing.feature.plan.label',
    titleKey: 'landing.feature.plan.title',
    descriptionKey: 'landing.feature.plan.description'
  },
  {
    labelKey: 'landing.feature.community.label',
    titleKey: 'landing.feature.community.title',
    descriptionKey: 'landing.feature.community.description'
  },
  {
    labelKey: 'landing.feature.focus.label',
    titleKey: 'landing.feature.focus.title',
    descriptionKey: 'landing.feature.focus.description'
  },
  {
    labelKey: 'landing.feature.social.label',
    titleKey: 'landing.feature.social.title',
    descriptionKey: 'landing.feature.social.description'
  },
  {
    labelKey: 'landing.feature.reward.label',
    titleKey: 'landing.feature.reward.title',
    descriptionKey: 'landing.feature.reward.description'
  },
  {
    labelKey: 'landing.feature.raid.label',
    titleKey: 'landing.feature.raid.title',
    descriptionKey: 'landing.feature.raid.description'
  },
  {
    labelKey: 'landing.feature.coop.label',
    titleKey: 'landing.feature.coop.title',
    descriptionKey: 'landing.feature.coop.description'
  },
  {
    labelKey: 'landing.feature.accessibility.label',
    titleKey: 'landing.feature.accessibility.title',
    descriptionKey: 'landing.feature.accessibility.description'
  },
  {
    labelKey: 'landing.feature.admin.label',
    titleKey: 'landing.feature.admin.title',
    descriptionKey: 'landing.feature.admin.description'
  }
];

const showcaseKeys = [
  {
    eyebrowKey: 'landing.showcase.learn.eyebrow',
    titleKey: 'landing.showcase.learn.title',
    descriptionKey: 'landing.showcase.learn.description',
    keywordKey: 'landing.showcase.learn.keyword',
    metricKey: 'landing.showcase.learn.metric'
  },
  {
    eyebrowKey: 'landing.showcase.organize.eyebrow',
    titleKey: 'landing.showcase.organize.title',
    descriptionKey: 'landing.showcase.organize.description',
    keywordKey: 'landing.showcase.organize.keyword',
    metricKey: 'landing.showcase.organize.metric'
  },
  {
    eyebrowKey: 'landing.showcase.connect.eyebrow',
    titleKey: 'landing.showcase.connect.title',
    descriptionKey: 'landing.showcase.connect.description',
    keywordKey: 'landing.showcase.connect.keyword',
    metricKey: 'landing.showcase.connect.metric'
  },
  {
    eyebrowKey: 'landing.showcase.challenge.eyebrow',
    titleKey: 'landing.showcase.challenge.title',
    descriptionKey: 'landing.showcase.challenge.description',
    keywordKey: 'landing.showcase.challenge.keyword',
    metricKey: 'landing.showcase.challenge.metric'
  },
  {
    eyebrowKey: 'landing.showcase.operate.eyebrow',
    titleKey: 'landing.showcase.operate.title',
    descriptionKey: 'landing.showcase.operate.description',
    keywordKey: 'landing.showcase.operate.keyword',
    metricKey: 'landing.showcase.operate.metric'
  }
];

const flowStepKeys = [
  'landing.flow.step1',
  'landing.flow.step2',
  'landing.flow.step3'
];

function openGitHubRepository() {
  const browserWindow = typeof globalThis !== 'undefined' ? globalThis.window : null;

  if (browserWindow?.open) {
    browserWindow.open(GITHUB_REPOSITORY_URL, '_blank', 'noopener,noreferrer');
    return;
  }

  Linking.openURL(GITHUB_REPOSITORY_URL);
}

function GitHubMark() {
  if (Platform.OS === 'web') {
    return (
      <svg
        aria-hidden="true"
        focusable="false"
        height="28"
        style={githubSvgStyle}
        viewBox="0 0 16 16"
        width="28"
      >
        <path
          d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.65 7.65 0 0 1 8 3.87c.68 0 1.36.09 2 .27 1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.06-1.86 3.75-3.64 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.15.45.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
          fill={GITHUB_ICON_COLOR}
        />
      </svg>
    );
  }

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.githubNativeMark}>
      <View style={styles.githubNativeEarRow}>
        <View style={styles.githubNativeEar} />
        <View style={styles.githubNativeEar} />
      </View>
      <View style={styles.githubNativeHead} />
    </View>
  );
}

export default function LandingScreen({ onNavigate }) {
  const { t } = useLanguage();
  const [scrollY, setScrollY] = useState(0);
  const [githubTooltipState, setGithubTooltipState] = useState({
    focused: false,
    hovered: false
  });
  const showGithubTooltip = githubTooltipState.focused || githubTooltipState.hovered;
  const writingWord = t('landing.hero.writingWord', '사각사각');
  const heroSuffix = t('landing.hero.suffix', '쌓아가세요');
  const introProgress = Math.min(scrollY / 360, 1);
  const activeShowcaseIndex = Math.max(0, Math.min(showcaseKeys.length - 1, Math.floor((scrollY - 430) / 260)));

  const handleLandingScroll = (event) => {
    setScrollY(event.nativeEvent?.contentOffset?.y || 0);
  };

  return (
    <ScrollView
      dataSet={{ sagakI18nIgnore: 'true' }}
      onScroll={handleLandingScroll}
      scrollEventThrottle={80}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View
        style={[
          styles.hero,
          {
            opacity: 1 - introProgress * 0.08,
            transform: [{ translateY: introProgress * -14 }]
          }
        ]}
      >
        <View style={styles.heroCopy}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{t('landing.hero.pill', '개인화 학습 관리 플랫폼')}</Text>
          </View>
          <Text accessibilityLabel={t('landing.hero.fullLabel', '공부의 흔적을 사각사각 쌓아가세요')} style={styles.title}>
            {t('landing.hero.prefix', '공부의 흔적을')}{'\n'}
            <WritingEraseText
              accessibilityElementsHidden
              cursorStyle={styles.writingCursor}
              eraseInterval={58}
              holdMs={1300}
              importantForAccessibility="no"
              pauseMs={500}
              style={styles.writingWord}
              text={writingWord}
              writeInterval={150}
            />
            {heroSuffix ? ` ${heroSuffix}` : ''}
          </Text>
          <Text style={styles.description}>
            {t(
              'landing.hero.description',
              '질문하고, 요약하고, 틀린 이유를 되짚는 흐름을 한곳에서 관리하는 학습 파트너입니다. AI 학습, 일정, 칸반, 커뮤니티로 오늘의 공부를 시작하세요.'
            )}
          </Text>
          <View style={styles.heroActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => onNavigate('register')}
              style={(state) => [styles.primaryButton, ...interactiveStateStyles(state)]}
            >
              <Text style={styles.primaryText}>{t('landing.cta.primary', '무료로 시작하기')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => onNavigate('login')}
              style={(state) => [styles.secondaryButton, ...interactiveStateStyles(state)]}
            >
              <Text style={styles.secondaryText}>{t('landing.cta.secondary', '로그인')}</Text>
            </Pressable>
          </View>
        </View>
        <View style={[styles.visualCard, shadows.card]}>
          <View style={styles.introOrbit}>
            <Text style={styles.introOrbitText}>AI</Text>
            <Text style={styles.introOrbitText}>LIVE</Text>
            <Text style={styles.introOrbitText}>QUEST</Text>
          </View>
          <Image source={icon} style={styles.heroIcon} />
          <View style={styles.miniPanel}>
            <View style={styles.dot} />
            <View>
              <Text style={styles.miniTitle}>{t('landing.mini.title', '오늘의 학습 지원')}</Text>
              <Text style={styles.miniDescription}>{t('landing.mini.description', '계획과 복습을 한 번에 이어가세요')}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionEyebrow}>AVAILABLE NOW</Text>
        <Text style={styles.sectionTitle}>{t('landing.section.available.title', '지금 연결된 학습 도구')}</Text>
        <Text style={styles.sectionDescription}>
          {t('landing.section.available.description', '현재 구현된 API와 연결된 기능만 안내합니다.')}
        </Text>
      </View>
      <View style={styles.featureGrid}>
        {availableFeatureKeys.map((feature) => {
          const featureLabel = t(feature.labelKey);
          const featureTitle = t(feature.titleKey);
          const featureDescription = t(feature.descriptionKey);

          return (
            <Pressable
              accessibilityLabel={`${featureLabel}: ${featureTitle}`}
              key={feature.titleKey}
              style={(state) => [styles.featureCard, shadows.card, ...interactiveStateStyles(state, { kind: 'card' })]}
            >
              <Text style={styles.featureLabel}>{featureLabel}</Text>
              <Text style={styles.featureTitle}>{featureTitle}</Text>
              <Text style={styles.featureDescription}>{featureDescription}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.showcase}>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionEyebrow}>SCROLL TOUR</Text>
          <Text style={styles.sectionTitle}>{t('landing.showcase.title', '스크롤로 만나는 실제 기능 흐름')}</Text>
          <Text style={styles.sectionDescription}>
            {t('landing.showcase.description', 'PR #264의 방향을 최신 기능 구성에 맞춰 정리한 소개 섹션입니다.')}
          </Text>
        </View>
        {showcaseKeys.map((item, index) => {
          const isActive = index === activeShowcaseIndex;

          return (
            <View
              key={item.titleKey}
              style={[
                styles.showcaseRow,
                index % 2 === 1 && styles.showcaseRowReverse,
                isActive ? styles.showcaseRowActive : styles.showcaseRowRest
              ]}
            >
              <Text
                accessibilityElementsHidden
                importantForAccessibility="no"
                style={[styles.showcaseKeyword, isActive && styles.showcaseKeywordActive]}
              >
                {t(item.keywordKey)}
              </Text>
              <View style={styles.showcaseCopy}>
                <Text style={styles.showcaseEyebrow}>{t(item.eyebrowKey)}</Text>
                <Text style={styles.showcaseTitle}>{t(item.titleKey)}</Text>
                <Text style={styles.showcaseDescription}>{t(item.descriptionKey)}</Text>
              </View>
              <View style={[styles.showcaseMockup, shadows.card]}>
                <View style={styles.mockupTopRow}>
                  <View style={styles.mockupDot} />
                  <View style={styles.mockupLineStrong} />
                </View>
                <Text style={styles.mockupMetric}>{t(item.metricKey)}</Text>
                <View style={styles.mockupProgressTrack}>
                  <View style={[styles.mockupProgressFill, { width: `${58 + index * 8}%` }]} />
                </View>
                <View style={styles.mockupChipRow}>
                  <View style={styles.mockupChip} />
                  <View style={[styles.mockupChip, styles.mockupChipAlt]} />
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.flow}>
        <View style={styles.flowCopy}>
          <Text style={styles.sectionEyebrow}>LEARNING FLOW</Text>
          <Text style={styles.flowTitle}>{t('landing.flow.title', '계획에서 복습까지,\n가볍게 시작하는 학습')}</Text>
          <Text style={styles.flowDescription}>
            {t(
              'landing.flow.description',
              '사각사각은 다양한 학습자의 기록과 반복 학습을 돕는 서비스로 설계되었습니다. 이번 화면에서는 현재 연결된 학습 도구와 시작 흐름을 함께 제공합니다.'
            )}
          </Text>
        </View>
        <View style={styles.steps}>
          {flowStepKeys.map((stepKey, index) => (
            <View key={stepKey} style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{t(stepKey)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View dataSet={{ sagakI18nIgnore: 'true' }} style={styles.footer}>
        <View style={styles.footerInner}>
          <View style={styles.footerCopy}>
            <Text style={styles.footerCopyright}>© 2026 CWNU Software Engineering Team 15 · 사각사각</Text>
            <Text style={styles.footerDescription}>Personalized Smart Edu Platform</Text>
          </View>
          <Pressable
            accessibilityLabel="GitHub Repository"
            accessibilityRole="link"
            onBlur={() => setGithubTooltipState((current) => ({ ...current, focused: false }))}
            onFocus={() => setGithubTooltipState((current) => ({ ...current, focused: true }))}
            onHoverIn={() => setGithubTooltipState((current) => ({ ...current, hovered: true }))}
            onHoverOut={() => setGithubTooltipState((current) => ({ ...current, hovered: false }))}
            onPress={openGitHubRepository}
            style={(state) => [styles.githubButton, ...interactiveStateStyles(state)]}
          >
            <View pointerEvents="none" style={[styles.githubTooltip, showGithubTooltip && styles.githubTooltipVisible]}>
              <Text style={styles.githubTooltipText}>GitHub</Text>
              <View style={styles.githubTooltipTail} />
            </View>
            <GitHubMark />
          </Pressable>
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
  writingWord: {
    color: colors.mintDeep
  },
  writingCursor: {
    color: colors.creamStrong,
    fontWeight: '700'
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
    borderWidth: 1,
    borderColor: colors.blue,
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
  introOrbit: {
    position: 'absolute',
    top: 18,
    left: 18,
    right: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8
  },
  introOrbitText: {
    color: colors.blue,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0
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
  showcase: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 64
  },
  showcaseRow: {
    width: '100%',
    maxWidth: 1180,
    minHeight: 260,
    paddingHorizontal: 18,
    paddingVertical: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 22,
    position: 'relative',
    transitionDuration: '220ms',
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: 'ease-out'
  },
  showcaseRowReverse: {
    flexDirection: 'row-reverse'
  },
  showcaseRowActive: {
    opacity: 1,
    transform: [{ translateY: 0 }]
  },
  showcaseRowRest: {
    opacity: 0.72,
    transform: [{ translateY: 14 }]
  },
  showcaseKeyword: {
    position: 'absolute',
    right: 20,
    top: 8,
    color: colors.blueSoft,
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: 0,
    opacity: 0.42
  },
  showcaseKeywordActive: {
    color: colors.mintSoft,
    opacity: 0.9
  },
  showcaseCopy: {
    flex: 1,
    minWidth: 260,
    maxWidth: 520,
    zIndex: 1
  },
  showcaseEyebrow: {
    color: colors.mintDeep,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 10
  },
  showcaseTitle: {
    color: colors.ink,
    fontSize: 26,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: 0
  },
  showcaseDescription: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 25,
    marginTop: 12
  },
  showcaseMockup: {
    width: '100%',
    maxWidth: 390,
    minWidth: 260,
    minHeight: 210,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 22,
    justifyContent: 'center',
    gap: 18,
    zIndex: 1
  },
  mockupTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  mockupDot: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.mintSoft,
    borderWidth: 9,
    borderColor: colors.mint
  },
  mockupLineStrong: {
    flex: 1,
    height: 16,
    borderRadius: 999,
    backgroundColor: colors.blueSoft
  },
  mockupMetric: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900'
  },
  mockupProgressTrack: {
    height: 14,
    borderRadius: 999,
    backgroundColor: colors.cream,
    overflow: 'hidden'
  },
  mockupProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.mint
  },
  mockupChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  mockupChip: {
    width: 96,
    height: 30,
    borderRadius: 999,
    backgroundColor: colors.mintSoft
  },
  mockupChipAlt: {
    width: 132,
    backgroundColor: colors.blueSoft
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
  },
  footer: {
    width: '100%',
    maxWidth: 1180,
    marginTop: 28,
    paddingHorizontal: 22,
    paddingVertical: 22,
    borderTopWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center'
  },
  footerInner: {
    maxWidth: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  footerCopy: {
    minWidth: 0,
    maxWidth: '100%',
    flexShrink: 1,
    gap: 5
  },
  footerCopyright: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800'
  },
  footerDescription: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700'
  },
  githubButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  githubTooltip: {
    position: 'absolute',
    left: -13,
    bottom: 50,
    width: 68,
    alignItems: 'center',
    opacity: 0,
    transform: [{ translateY: 5 }],
    zIndex: 10,
    transitionDuration: '150ms',
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: 'ease-out'
  },
  githubTooltipVisible: {
    opacity: 1,
    transform: [{ translateY: 0 }]
  },
  githubTooltipText: {
    backgroundColor: colors.ink,
    borderRadius: 10,
    color: colors.surface,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    textAlign: 'center'
  },
  githubTooltipTail: {
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderLeftWidth: 5,
    borderRightColor: 'transparent',
    borderRightWidth: 5,
    borderTopColor: colors.ink,
    borderTopWidth: 6,
    marginTop: -1
  },
  githubNativeMark: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },
  githubNativeEarRow: {
    position: 'absolute',
    top: 3,
    width: 24,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  githubNativeEar: {
    width: 9,
    height: 9,
    borderRadius: 2,
    backgroundColor: GITHUB_ICON_COLOR,
    transform: [{ rotate: '45deg' }]
  },
  githubNativeHead: {
    width: 25,
    height: 22,
    borderRadius: 11,
    backgroundColor: GITHUB_ICON_COLOR,
    marginTop: 6
  }
});
