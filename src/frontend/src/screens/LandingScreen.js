import { useCallback, useState } from 'react';
import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ParticlePencilIntro from '../components/ParticlePencilIntro';
import WritingEraseText from '../components/WritingEraseText';
import { useLanguage } from '../i18n';
import { colors, interactiveStateStyles, shadows } from '../styles/theme';

const icon = require('../assets/sagaksagak-app-icon.png');
const GITHUB_REPOSITORY_URL = 'https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform';
const GITHUB_ICON_COLOR = '#24292f';
const INTRO_SESSION_KEY = 'sagaksagakLandingIntroSeenV281';
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
  }
];

const heroSlideKeys = ['start', 'ask', 'focus', 'together', 'challenge'];

const showcaseKeys = [
  {
    eyebrowKey: 'landing.showcase.record.eyebrow',
    titleKey: 'landing.showcase.record.title',
    descriptionKey: 'landing.showcase.record.description',
    keywordKey: 'landing.showcase.record.keyword',
    metricKey: 'landing.showcase.record.metric'
  },
  {
    eyebrowKey: 'landing.showcase.plan.eyebrow',
    titleKey: 'landing.showcase.plan.title',
    descriptionKey: 'landing.showcase.plan.description',
    keywordKey: 'landing.showcase.plan.keyword',
    metricKey: 'landing.showcase.plan.metric'
  },
  {
    eyebrowKey: 'landing.showcase.ask.eyebrow',
    titleKey: 'landing.showcase.ask.title',
    descriptionKey: 'landing.showcase.ask.description',
    keywordKey: 'landing.showcase.ask.keyword',
    metricKey: 'landing.showcase.ask.metric'
  },
  {
    eyebrowKey: 'landing.showcase.focus.eyebrow',
    titleKey: 'landing.showcase.focus.title',
    descriptionKey: 'landing.showcase.focus.description',
    keywordKey: 'landing.showcase.focus.keyword',
    metricKey: 'landing.showcase.focus.metric'
  },
  {
    eyebrowKey: 'landing.showcase.community.eyebrow',
    titleKey: 'landing.showcase.community.title',
    descriptionKey: 'landing.showcase.community.description',
    keywordKey: 'landing.showcase.community.keyword',
    metricKey: 'landing.showcase.community.metric'
  },
  {
    eyebrowKey: 'landing.showcase.social.eyebrow',
    titleKey: 'landing.showcase.social.title',
    descriptionKey: 'landing.showcase.social.description',
    keywordKey: 'landing.showcase.social.keyword',
    metricKey: 'landing.showcase.social.metric'
  },
  {
    eyebrowKey: 'landing.showcase.challenge.eyebrow',
    titleKey: 'landing.showcase.challenge.title',
    descriptionKey: 'landing.showcase.challenge.description',
    keywordKey: 'landing.showcase.challenge.keyword',
    metricKey: 'landing.showcase.challenge.metric'
  },
  {
    eyebrowKey: 'landing.showcase.reward.eyebrow',
    titleKey: 'landing.showcase.reward.title',
    descriptionKey: 'landing.showcase.reward.description',
    keywordKey: 'landing.showcase.reward.keyword',
    metricKey: 'landing.showcase.reward.metric'
  },
  {
    eyebrowKey: 'landing.showcase.access.eyebrow',
    titleKey: 'landing.showcase.access.title',
    descriptionKey: 'landing.showcase.access.description',
    keywordKey: 'landing.showcase.access.keyword',
    metricKey: 'landing.showcase.access.metric'
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

function getBrowserSessionStorage() {
  const browserWindow = typeof globalThis !== 'undefined' ? globalThis.window : null;

  try {
    return Platform.OS === 'web' ? browserWindow?.sessionStorage : null;
  } catch {
    return null;
  }
}

function shouldShowIntro() {
  const storage = getBrowserSessionStorage();

  if (!storage) {
    return true;
  }

  try {
    return storage.getItem(INTRO_SESSION_KEY) !== 'done';
  } catch {
    return true;
  }
}

function markIntroSeen() {
  const storage = getBrowserSessionStorage();

  if (storage) {
    try {
      storage.setItem(INTRO_SESSION_KEY, 'done');
    } catch {
      // Session storage can be unavailable in restricted browser modes.
    }
  }
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
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
  const [showIntro, setShowIntro] = useState(shouldShowIntro);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [githubTooltipState, setGithubTooltipState] = useState({
    focused: false,
    hovered: false
  });
  const showGithubTooltip = githubTooltipState.focused || githubTooltipState.hovered;
  const writingWord = t('landing.hero.writingWord', '사각사각');
  const heroSuffix = t('landing.hero.suffix', '쌓아가세요');
  const introProgress = Math.min(scrollY / 360, 1);
  const heroSlideKey = heroSlideKeys[heroSlideIndex];

  const handleLandingScroll = (event) => {
    setScrollY(event.nativeEvent?.contentOffset?.y || 0);
  };

  const handleIntroDone = useCallback(() => {
    markIntroSeen();
    setShowIntro(false);
  }, []);

  const handleIntroReplay = useCallback(() => {
    setShowIntro(true);
  }, []);

  const moveHeroSlide = (direction) => {
    setHeroSlideIndex((current) => (current + direction + heroSlideKeys.length) % heroSlideKeys.length);
  };

  const selectHeroSlide = (index) => {
    setHeroSlideIndex(index);
  };

  const getShowcaseProgress = (index) => {
    const start = 520 + index * 280;
    return clamp((scrollY - start) / 340);
  };

  return (
    <>
      <ParticlePencilIntro visible={showIntro} onDone={handleIntroDone} />
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
          <Pressable
            accessibilityRole="button"
            onPress={handleIntroReplay}
            style={(state) => [styles.replayIntroButton, ...interactiveStateStyles(state)]}
          >
            <Text style={styles.replayIntroText}>{t('landing.intro.replay', '인트로 다시 보기')}</Text>
          </Pressable>
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
          <View style={styles.carouselTopRow}>
            <Image source={icon} style={styles.carouselIcon} />
            <View style={styles.carouselCounter}>
              <Text style={styles.carouselCounterText}>{heroSlideIndex + 1}/{heroSlideKeys.length}</Text>
            </View>
          </View>
          <Text style={styles.carouselEyebrow}>{t(`landing.carousel.${heroSlideKey}.eyebrow`)}</Text>
          <Text style={styles.carouselTitle}>{t(`landing.carousel.${heroSlideKey}.title`)}</Text>
          <Text style={styles.carouselDescription}>{t(`landing.carousel.${heroSlideKey}.description`)}</Text>
          <View style={styles.carouselList}>
            {[1, 2, 3].map((itemIndex) => (
              <View key={`${heroSlideKey}-${itemIndex}`} style={styles.carouselListItem}>
                <View style={styles.carouselListDot} />
                <Text style={styles.carouselListText}>{t(`landing.carousel.${heroSlideKey}.item${itemIndex}`)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.carouselBadges}>
            <Text style={styles.carouselBadge}>{t(`landing.carousel.${heroSlideKey}.primary`)}</Text>
            <Text style={[styles.carouselBadge, styles.carouselBadgeAlt]}>{t(`landing.carousel.${heroSlideKey}.secondary`)}</Text>
          </View>
          <View style={styles.carouselControls}>
            <Pressable
              accessibilityLabel={t('landing.carousel.prev', '이전 소개 카드')}
              accessibilityRole="button"
              onPress={() => moveHeroSlide(-1)}
              style={(state) => [styles.carouselControlButton, ...interactiveStateStyles(state)]}
            >
              <Text style={styles.carouselControlText}>‹</Text>
            </Pressable>
            <View style={styles.carouselDots}>
              {heroSlideKeys.map((slideKey, index) => (
                <Pressable
                  accessibilityLabel={t('landing.carousel.dotLabel', '소개 카드 선택')}
                  accessibilityRole="button"
                  key={slideKey}
                  onPress={() => selectHeroSlide(index)}
                  style={[styles.carouselDot, index === heroSlideIndex && styles.carouselDotActive]}
                />
              ))}
            </View>
            <Pressable
              accessibilityLabel={t('landing.carousel.next', '다음 소개 카드')}
              accessibilityRole="button"
              onPress={() => moveHeroSlide(1)}
              style={(state) => [styles.carouselControlButton, ...interactiveStateStyles(state)]}
            >
              <Text style={styles.carouselControlText}>›</Text>
            </Pressable>
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
          const progress = getShowcaseProgress(index);
          const side = index % 2 === 0 ? -1 : 1;
          const rowMotionStyle = {
            opacity: 0.38 + progress * 0.62,
            transform: [
              { translateX: side * (1 - progress) * 64 },
              { translateY: (1 - progress) * 18 },
              { scale: 0.96 + progress * 0.04 }
            ]
          };
          const keywordMotionStyle = {
            opacity: 0.18 + progress * 0.58,
            transform: [{ translateY: (1 - progress) * -16 }, { scale: 0.92 + progress * 0.16 }]
          };
          const copyMotionStyle = {
            transform: [{ translateX: side * (1 - progress) * 22 }]
          };
          const mockupMotionStyle = {
            transform: [{ translateX: side * -1 * (1 - progress) * 28 }, { rotate: `${side * (1 - progress) * 1.4}deg` }]
          };

          return (
            <View
              key={item.titleKey}
              style={[
                styles.showcaseRow,
                index % 2 === 1 && styles.showcaseRowReverse,
                rowMotionStyle
              ]}
            >
              <Text
                accessibilityElementsHidden
                importantForAccessibility="no"
                style={[styles.showcaseKeyword, keywordMotionStyle]}
              >
                {t(item.keywordKey)}
              </Text>
              <View style={[styles.showcaseCopy, copyMotionStyle]}>
                <Text style={styles.showcaseEyebrow}>{t(item.eyebrowKey)}</Text>
                <Text style={styles.showcaseTitle}>{t(item.titleKey)}</Text>
                <Text style={styles.showcaseDescription}>{t(item.descriptionKey)}</Text>
              </View>
              <View style={[styles.showcaseMockup, shadows.card, mockupMotionStyle]}>
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
    </>
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
  replayIntroButton: {
    alignSelf: 'flex-start',
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    justifyContent: 'center',
    marginBottom: 18
  },
  replayIntroText: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '900'
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
    justifyContent: 'space-between',
    alignItems: 'stretch',
    padding: 24,
    gap: 16
  },
  carouselTopRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  carouselIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: colors.surface
  },
  carouselCounter: {
    borderRadius: 999,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.line
  },
  carouselCounterText: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '900'
  },
  carouselEyebrow: {
    color: colors.mintDeep,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2
  },
  carouselTitle: {
    color: colors.ink,
    fontSize: 25,
    lineHeight: 33,
    fontWeight: '900',
    letterSpacing: 0
  },
  carouselDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 23
  },
  carouselList: {
    gap: 9
  },
  carouselListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9
  },
  carouselListDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.mint
  },
  carouselListText: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19
  },
  carouselBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  carouselBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.mintSoft,
    color: colors.mintDeep,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    fontWeight: '900'
  },
  carouselBadgeAlt: {
    backgroundColor: colors.blueSoft,
    color: colors.blueDeep
  },
  carouselControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  carouselControlButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center'
  },
  carouselControlText: {
    color: colors.blueDeep,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 26
  },
  carouselDots: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7
  },
  carouselDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line
  },
  carouselDotActive: {
    width: 28,
    backgroundColor: colors.mint,
    borderColor: colors.mint
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
