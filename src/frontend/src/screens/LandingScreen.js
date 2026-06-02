import { useCallback, useState } from 'react';
import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ParticlePencilIntro from '../components/ParticlePencilIntro';
import ScrollStorySection from '../components/ScrollStorySection';
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
  const { currentLanguage, t } = useLanguage();
  const [scrollY, setScrollY] = useState(0);
  const [showIntro, setShowIntro] = useState(shouldShowIntro);
  const [githubTooltipState, setGithubTooltipState] = useState({
    focused: false,
    hovered: false
  });
  const showGithubTooltip = githubTooltipState.focused || githubTooltipState.hovered;
  const writingWord = t('landing.hero.writingWord', '사각사각');
  const heroSuffix = t('landing.hero.suffix', '쌓아가세요');
  const heroLine1 = t('landing.hero.line1', t('landing.hero.prefix', '공부의 흔적을'));
  const heroLine2 = t('landing.hero.line2', `${writingWord}${heroSuffix ? ` ${heroSuffix}` : ''}`);
  const shouldAnimateHeroWord = currentLanguage === 'ko';
  const introProgress = Math.min(scrollY / 360, 1);

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
            {heroLine1}{'\n'}
            {shouldAnimateHeroWord ? (
              <>
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
              </>
            ) : heroLine2}
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
              <Text style={styles.carouselCounterText}>{t('landing.preview.badge', 'PREVIEW')}</Text>
            </View>
          </View>
          <Text style={styles.carouselEyebrow}>{t('landing.carousel.start.eyebrow')}</Text>
          <Text style={styles.carouselTitle}>{t('landing.carousel.start.title')}</Text>
          <Text style={styles.carouselDescription}>{t('landing.carousel.start.description')}</Text>
          <View style={styles.carouselList}>
            {[1, 2, 3].map((itemIndex) => (
              <View key={`preview-${itemIndex}`} style={styles.carouselListItem}>
                <View style={styles.carouselListDot} />
                <Text style={styles.carouselListText}>{t(`landing.carousel.start.item${itemIndex}`)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.carouselBadges}>
            <Text style={styles.carouselBadge}>{t('landing.carousel.start.primary')}</Text>
            <Text style={[styles.carouselBadge, styles.carouselBadgeAlt]}>{t('landing.carousel.start.secondary')}</Text>
          </View>
        </View>
      </View>

      <ScrollStorySection onNavigate={onNavigate} scrollY={scrollY} />

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
  sectionEyebrow: {
    color: colors.mintDeep,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 12
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
