import { useEffect, useRef, useState } from 'react';
import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (Platform.OS === 'web') {
  gsap.registerPlugin(ScrollTrigger);
}
import { Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '../i18n';
import { colors, interactiveStateStyles, shadows } from '../styles/theme';

const icon = require('../assets/sagaksagak-app-icon.png');
const GITHUB_REPOSITORY_URL = 'https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform';
const GITHUB_ICON_COLOR = '#24292f';
const INTRO_ENABLED_STORAGE_KEY = 'sagakLandingIntroEnabled';
const INTRO_TOGGLE_EVENT = 'sagak:intro-toggle';
const BGM_ENABLED_STORAGE_KEY = 'sagakLandingBgmEnabled';
const pencilCursorSvg = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
    <g transform="rotate(-35 22 22)">
      <rect x="8" y="18" width="23" height="8" rx="3" fill="#73C9BD" stroke="#173B63" stroke-width="2"/>
      <rect x="4" y="18" width="6" height="8" rx="2" fill="#F3D4A0" stroke="#173B63" stroke-width="2"/>
      <path d="M31 18L40 22L31 26Z" fill="#FFF1D9" stroke="#173B63" stroke-width="2"/>
      <path d="M38 21L42 22L38 23Z" fill="#183246"/>
    </g>
  </svg>`
);
const pencilCursor = `url("data:image/svg+xml,${pencilCursorSvg}") 38 22, auto`;
const githubSvgStyle = {
  display: 'block',
  flexShrink: 0
};

const webLandingAnimationCss = `
@keyframes sagakPencilSweep {
  0% { transform: translate3d(-46%, -22%, 0) rotate(-18deg); opacity: 0; }
  12% { opacity: 1; }
  44% { transform: translate3d(18%, 4%, 0) rotate(-10deg); opacity: 1; }
  72% { transform: translate3d(74%, 38%, 0) rotate(8deg); opacity: 1; }
  100% { transform: translate3d(122%, 4%, 0) rotate(16deg); opacity: 0; }
}

@keyframes sagakLineReveal {
  0%, 16% { transform: scaleX(0); opacity: 0; }
  38% { opacity: 1; }
  100% { transform: scaleX(1); opacity: 1; }
}

@keyframes sagakIntroRise {
  0% { transform: translateY(22px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

@keyframes sagakIntroFade {
  0%, 8% { opacity: 0; transform: translateY(16px); }
  28%, 78% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0.72; transform: translateY(-8px); }
}

@keyframes sagakCardFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes sagakIntroOut {
  0%, 76% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-18px); pointer-events: none; }
}

@keyframes sagakKeywordFocus {
  0%, 24% { opacity: 0; transform: translateY(-92px) scale(0.94); }
  43% { opacity: 0.26; transform: translateY(-28px) scale(0.98); }
  58% { opacity: 0.88; transform: translateY(0) scale(1); }
  74% { opacity: 0.34; transform: translateY(24px) scale(1.02); }
  100% { opacity: 0; transform: translateY(82px) scale(1.05); }
}

[data-sagak-scroll-section="true"] {
  animation: sagakIntroRise 720ms ease-out both;
}

[data-sagak-intro-logo="true"] {
  animation: sagakIntroFade 3600ms ease-in-out infinite;
}

[data-sagak-story-section="true"] {
  min-height: 100vh;
  scroll-snap-align: start;
}

[data-sagak-intro-screen="true"] {
  animation: sagakIntroOut 4200ms ease-in-out both;
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 2147483647 !important;
}

[data-sagak-story-section="true"] [data-sagak-preview-frame="true"] {
  transition: transform 220ms ease-out, box-shadow 220ms ease-out;
}

[data-sagak-story-section="true"]:hover [data-sagak-preview-frame="true"],
[data-sagak-story-section="true"]:focus-within [data-sagak-preview-frame="true"] {
  transform: scale(1.15);
}

[data-sagak-story-keyword="true"] {
  mix-blend-mode: multiply;
  animation: sagakKeywordFocus linear both;
  animation-timeline: view();
  animation-range: entry 0% exit 100%;
}

[data-sagak-story-section="true"]:hover [data-sagak-story-keyword="true"],
[data-sagak-story-section="true"]:focus-within [data-sagak-story-keyword="true"] {
  opacity: 0.86;
}

[data-sagak-pencil="true"] {
  animation: sagakPencilSweep 3600ms ease-in-out infinite;
}

[data-sagak-write-line="true"] {
  animation: sagakLineReveal 3600ms ease-out infinite;
  transform-origin: left center;
}

[data-sagak-float-card="true"] {
  animation: sagakCardFloat 5200ms ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  [data-sagak-intro-copy="true"],
  [data-sagak-scroll-section="true"],
  [data-sagak-intro-logo="true"],
  [data-sagak-pencil="true"],
  [data-sagak-write-line="true"],
  [data-sagak-preview-frame="true"],
  [data-sagak-story-keyword="true"],
  [data-sagak-float-card="true"] {
    animation: none !important;
    transform: none !important;
  }
}
`;

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
  }
];

const flowStepKeys = [
  'landing.flow.step1',
  'landing.flow.step2',
  'landing.flow.step3'
];

const heroSlides = [
  {
    eyebrowKey: 'landing.heroSlide.1.eyebrow',
    titleKey: 'landing.heroSlide.1.title',
    descriptionKey: 'landing.heroSlide.1.description',
    primaryKey: 'landing.heroSlide.1.primary',
    secondaryKey: 'landing.heroSlide.1.secondary',
    itemKeys: ['landing.heroSlide.1.item1', 'landing.heroSlide.1.item2', 'landing.heroSlide.1.item3']
  },
  {
    eyebrowKey: 'landing.heroSlide.2.eyebrow',
    titleKey: 'landing.heroSlide.2.title',
    descriptionKey: 'landing.heroSlide.2.description',
    primaryKey: 'landing.heroSlide.2.primary',
    secondaryKey: 'landing.heroSlide.2.secondary',
    itemKeys: ['landing.heroSlide.2.item1', 'landing.heroSlide.2.item2', 'landing.heroSlide.2.item3']
  },
  {
    eyebrowKey: 'landing.heroSlide.3.eyebrow',
    titleKey: 'landing.heroSlide.3.title',
    descriptionKey: 'landing.heroSlide.3.description',
    primaryKey: 'landing.heroSlide.3.primary',
    secondaryKey: 'landing.heroSlide.3.secondary',
    itemKeys: ['landing.heroSlide.3.item1', 'landing.heroSlide.3.item2', 'landing.heroSlide.3.item3']
  }
];

const promoSlides = [
  {
    labelKey: 'landing.promo.1.label',
    titleKey: 'landing.promo.1.title',
    descriptionKey: 'landing.promo.1.description',
    ctaKey: 'landing.promo.1.cta',
    mood: 'mint'
  },
  {
    labelKey: 'landing.promo.2.label',
    titleKey: 'landing.promo.2.title',
    descriptionKey: 'landing.promo.2.description',
    ctaKey: 'landing.promo.2.cta',
    mood: 'blue'
  },
  {
    labelKey: 'landing.promo.3.label',
    titleKey: 'landing.promo.3.title',
    descriptionKey: 'landing.promo.3.description',
    ctaKey: 'landing.promo.3.cta',
    mood: 'cream'
  },
  {
    labelKey: 'landing.promo.4.label',
    titleKey: 'landing.promo.4.title',
    descriptionKey: 'landing.promo.4.description',
    ctaKey: 'landing.promo.4.cta',
    mood: 'blue'
  }
];

const revealCards = [
  {
    titleKey: 'landing.reveal.1.title',
    descriptionKey: 'landing.reveal.1.description'
  },
  {
    titleKey: 'landing.reveal.2.title',
    descriptionKey: 'landing.reveal.2.description'
  },
  {
    titleKey: 'landing.reveal.3.title',
    descriptionKey: 'landing.reveal.3.description'
  },
  {
    titleKey: 'landing.reveal.4.title',
    descriptionKey: 'landing.reveal.4.description'
  }
];

const useCaseSteps = [
  'landing.useCase.step1',
  'landing.useCase.step2',
  'landing.useCase.step3',
  'landing.useCase.step4'
];

const trustItems = [
  'landing.trust.item1',
  'landing.trust.item2',
  'landing.trust.item3'
];

const storySections = [
  {
    keywordKey: 'landing.story.plan.keyword',
    titleKey: 'landing.story.plan.title',
    descriptionKey: 'landing.story.plan.description',
    chipKeys: ['landing.story.plan.chip1', 'landing.story.plan.chip2', 'landing.story.plan.chip3'],
    previewTitleKey: 'landing.story.plan.previewTitle',
    previewMetaKey: 'landing.story.plan.previewMeta',
    previewItemKeys: ['landing.story.plan.previewItem1', 'landing.story.plan.previewItem2', 'landing.story.plan.previewItem3'],
    accent: 'mint'
  },
  {
    keywordKey: 'landing.story.ai.keyword',
    titleKey: 'landing.story.ai.title',
    descriptionKey: 'landing.story.ai.description',
    chipKeys: ['landing.story.ai.chip1', 'landing.story.ai.chip2', 'landing.story.ai.chip3'],
    previewTitleKey: 'landing.story.ai.previewTitle',
    previewMetaKey: 'landing.story.ai.previewMeta',
    previewItemKeys: ['landing.story.ai.previewItem1', 'landing.story.ai.previewItem2', 'landing.story.ai.previewItem3'],
    accent: 'blue'
  },
  {
    keywordKey: 'landing.story.care.keyword',
    titleKey: 'landing.story.care.title',
    descriptionKey: 'landing.story.care.description',
    chipKeys: ['landing.story.care.chip1', 'landing.story.care.chip2', 'landing.story.care.chip3'],
    previewTitleKey: 'landing.story.care.previewTitle',
    previewMetaKey: 'landing.story.care.previewMeta',
    previewItemKeys: ['landing.story.care.previewItem1', 'landing.story.care.previewItem2', 'landing.story.care.previewItem3'],
    accent: 'cream'
  },
  {
    keywordKey: 'landing.story.together.keyword',
    titleKey: 'landing.story.together.title',
    descriptionKey: 'landing.story.together.description',
    chipKeys: ['landing.story.together.chip1', 'landing.story.together.chip2', 'landing.story.together.chip3'],
    previewTitleKey: 'landing.story.together.previewTitle',
    previewMetaKey: 'landing.story.together.previewMeta',
    previewItemKeys: ['landing.story.together.previewItem1', 'landing.story.together.previewItem2', 'landing.story.together.previewItem3'],
    accent: 'mint'
  }
];

function openGitHubRepository() {
  const browserWindow = typeof globalThis !== 'undefined' ? globalThis.window : null;

  if (browserWindow?.open) {
    browserWindow.open(GITHUB_REPOSITORY_URL, '_blank', 'noopener,noreferrer');
    return;
  }

  Linking.openURL(GITHUB_REPOSITORY_URL);
}

function LandingAnimationStyles() {
  if (Platform.OS !== 'web') {
    return null;
  }

  return <style dangerouslySetInnerHTML={{ __html: webLandingAnimationCss }} />;
}


function TopHeroCarousel({ activeIndex, onNext, onPrevious, onSelect, onNavigate }) {
  const slides = [
    {
      title: '공부의 흐름을\n사각사각 쌓아가세요',
      description: '질문하고, 요약하고, 틀린 이유가 되는 흐름을\n한곳에서 관리하는 학습 플랫폼입니다.',
      cta: '무료로 시작하기',
      action: 'register',
    },
    {
      title: 'AI가 오늘의 학습을\n한 번에 정리해줘요',
      description: '개념 요약, 오답 분석, 복습 루틴까지\n공부 흐름을 놓치지 않게 도와줍니다.',
      cta: 'AI 기능 보기',
      action: 'home',
    },
    {
      title: '나만의 학습 리듬을\n기록하고 관리하세요',
      description: '집중 시간, 학습 기록, 반복되는 실수까지\n사각사각 안에 쌓입니다.',
      cta: '학습 기록 시작하기',
      action: 'register',
    },
    {
      title: '사각사각 베타 오픈',
      description: '지금 시작하면 초기 학습 관리 기능을\n가장 먼저 경험할 수 있습니다.',
      cta: '무료로 시작하기',
      action: 'register',
    }
  ];

  const slide = slides[activeIndex];

  return (
    <View style={styles.topHeroCarousel}>
      <Pressable onPress={onPrevious} style={(state) => [styles.topHeroArrow, styles.topHeroArrowLeft, ...interactiveStateStyles(state)]}>
        <Text style={styles.topHeroArrowText}>‹</Text>
      </Pressable>
      <View style={styles.topHeroContent}>
        <Text style={styles.topHeroTitle}>{slide.title}</Text>
        <Text style={styles.topHeroDescription}>{slide.description}</Text>
        <Pressable onPress={() => onNavigate(slide.action)} style={(state) => [styles.topHeroCta, ...interactiveStateStyles(state)]}>
          <Text style={styles.topHeroCtaText}>{slide.cta}</Text>
        </Pressable>
      </View>
      <Pressable onPress={onNext} style={(state) => [styles.topHeroArrow, styles.topHeroArrowRight, ...interactiveStateStyles(state)]}>
        <Text style={styles.topHeroArrowText}>›</Text>
      </Pressable>
      <View style={styles.topHeroDots}>
        {slides.map((_, index) => (
          <Pressable key={index} onPress={() => onSelect(index)} style={[styles.topHeroDot, index === activeIndex && styles.topHeroDotActive]} />
        ))}
      </View>
    </View>
  );
}


function CinematicIntroVideo() {
  return (
    <View style={styles.introVideoSection} className="intro-video-section">
      {Platform.OS === 'web' ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }}
          src="https://www.w3schools.com/html/mov_bbb.mp4"
        />
      ) : (
        <View style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: '#081220' }} />
      )}
      <View style={styles.introOverlay} className="intro-overlay" />
      <View style={styles.introVideoContent}>
        <Text style={styles.introVideoBrand}>사각사각</Text>
        <Text style={styles.introVideoCopy}>
          공부의 흐름을\n조용히 기록하는 공간
        </Text>
      </View>
      <View style={styles.introVideoScroll}>
        <Text style={styles.introVideoScrollText}>Scroll ↓</Text>
      </View>
    </View>
  );
}

function readIntroEnabled() {
  try {
    return globalThis.localStorage?.getItem(INTRO_ENABLED_STORAGE_KEY) !== 'false';
  } catch (error) {
    return true;
  }
}

function readBgmEnabled() {
  try {
    return globalThis.localStorage?.getItem(BGM_ENABLED_STORAGE_KEY) === 'true';
  } catch (error) {
    return false;
  }
}

function saveBgmEnabled(enabled) {
  try {
    globalThis.localStorage?.setItem(BGM_ENABLED_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch (error) {
    // Local storage is optional; the BGM toggle still updates immediately.
  }
}

function createAmbientBgm() {
  const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;

  if (!AudioContext) {
    return null;
  }

  const context = new AudioContext();
  const gain = context.createGain();
  const low = context.createOscillator();
  const high = context.createOscillator();

  gain.gain.value = 0.0001;
  low.type = 'sine';
  high.type = 'triangle';
  low.frequency.value = 196;
  high.frequency.value = 329.63;
  low.connect(gain);
  high.connect(gain);
  gain.connect(context.destination);
  low.start();
  high.start();

  return { context, gain, nodes: [low, high] };
}

function StoryPreview({ section, t }) {
  return (
    <View style={[styles.storyPreview, section.accent === 'blue' && styles.storyPreviewBlue, section.accent === 'cream' && styles.storyPreviewCream]}>
      <View dataSet={{ sagakPreviewFrame: 'true' }} style={styles.storyPreviewFrame}>
        <View style={styles.storyPreviewHeader}>
          <View style={styles.storyPreviewIcon} />
          <View style={styles.storyPreviewTitleGroup}>
            <Text style={styles.storyPreviewTitle}>{t(section.previewTitleKey)}</Text>
            <Text style={styles.storyPreviewMeta}>{t(section.previewMetaKey)}</Text>
          </View>
        </View>
        <View style={styles.storyPreviewRows}>
          {section.previewItemKeys.map((itemKey, index) => (
            <View key={itemKey} style={[styles.storyPreviewRow, index === 1 && styles.storyPreviewRowMuted]}>
              <View style={styles.storyPreviewBullet} />
              <Text style={styles.storyPreviewItemText}>{t(itemKey)}</Text>
            </View>
          ))}
        </View>
        <View style={styles.storyPreviewInput}>
          <Text style={styles.storyPreviewInputText}>{t('landing.story.previewInput')}</Text>
        </View>
      </View>
    </View>
  );
}

function PromoCarousel({ activeIndex, onNavigate, onNext, onPauseChange, onPrevious, onSelect, t }) {
  const slide = promoSlides[activeIndex];

  return (
    <Pressable
      accessibilityLabel={t('landing.promo.ariaLabel', '사각사각 오픈 프로모션 슬라이더')}
      dataSet={{ sagakScrollSection: 'true' }}
      onHoverIn={() => onPauseChange(true)}
      onHoverOut={() => onPauseChange(false)}
      style={[styles.promo, slide.mood === 'blue' && styles.promoBlue, slide.mood === 'cream' && styles.promoCream, slide.mood === 'dark' && styles.promoDark]}
    >
      <Pressable
        accessibilityLabel={t('landing.promo.prev', '이전 프로모션 보기')}
        accessibilityRole="button"
        onPress={onPrevious}
        style={(state) => [styles.promoArrow, styles.promoArrowLeft, ...interactiveStateStyles(state)]}
      >
        <Text style={styles.promoArrowText}>‹</Text>
      </Pressable>
      <View style={styles.promoCopy}>
        <Text style={styles.promoLabel}>{t(slide.labelKey)}</Text>
        <Text style={styles.promoTitle}>{t(slide.titleKey)}</Text>
        <Text style={styles.promoDescription}>{t(slide.descriptionKey)}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => onNavigate('register')}
          style={(state) => [styles.promoCta, ...interactiveStateStyles(state)]}
        >
          <Text style={styles.promoCtaText}>{t(slide.ctaKey)}</Text>
        </Pressable>
      </View>
      <View style={styles.promoVisual}>
        <View style={styles.promoBubbleLarge} />
        <View style={styles.promoBubbleSmall} />
        <Image source={icon} style={styles.promoIcon} />
      </View>
      <Pressable
        accessibilityLabel={t('landing.promo.next', '다음 프로모션 보기')}
        accessibilityRole="button"
        onPress={onNext}
        style={(state) => [styles.promoArrow, styles.promoArrowRight, ...interactiveStateStyles(state)]}
      >
        <Text style={styles.promoArrowText}>›</Text>
      </Pressable>
      <View style={styles.promoDots}>
        {promoSlides.map((item, index) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('landing.promo.dotLabel', '{index}번째 프로모션 보기').replace('{index}', String(index + 1))}
            key={item.titleKey}
            onPress={() => onSelect(index)}
            style={[styles.promoDot, index === activeIndex && styles.promoDotActive]}
          />
        ))}
      </View>
    </Pressable>
  );
}

function HeroSlide({ slide, t }) {
  return (
    <View style={styles.heroSlide}>
      <Text style={styles.heroSlideEyebrow}>{t(slide.eyebrowKey)}</Text>
      <Text style={styles.heroSlideTitle}>{t(slide.titleKey)}</Text>
      <Text style={styles.heroSlideDescription}>{t(slide.descriptionKey)}</Text>
      <View style={styles.heroSlideBadges}>
        <View style={styles.heroSlideBadgePrimary}>
          <Text style={styles.heroSlideBadgePrimaryText}>{t(slide.primaryKey)}</Text>
        </View>
        <View style={styles.heroSlideBadgeSecondary}>
          <Text style={styles.heroSlideBadgeSecondaryText}>{t(slide.secondaryKey)}</Text>
        </View>
      </View>
      <View style={styles.heroSlideList}>
        {slide.itemKeys.map((itemKey) => (
          <View key={itemKey} style={styles.heroSlideItem}>
            <View style={styles.heroSlideBullet} />
            <Text style={styles.heroSlideItemText}>{t(itemKey)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
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
  const [writtenWord, setWrittenWord] = useState('');
  const [introPassed, setIntroPassed] = useState(false);
  const [topHeroIndex, setTopHeroIndex] = useState(0);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [promoSlideIndex, setPromoSlideIndex] = useState(0);
  const [promoPaused, setPromoPaused] = useState(false);
  const [bgmEnabled, setBgmEnabled] = useState(readBgmEnabled);
  const bgmRef = useRef(null);
  const [githubTooltipState, setGithubTooltipState] = useState({
    focused: false,
    hovered: false
  });
  const showGithubTooltip = githubTooltipState.focused || githubTooltipState.hovered;
  const writingWord = t('landing.hero.writingWord', '사각사각');
  const heroSuffix = t('landing.hero.suffix', '쌓아가세요');
  const currentHeroSlide = heroSlides[heroSlideIndex];

  const handleScroll = (e) => {
    if (Platform.OS === 'web' && !introPassed) {
      const scrollY = e.nativeEvent.contentOffset.y;
      const threshold = globalThis.window.innerHeight * 0.7;
      if (scrollY >= threshold) {
        setIntroPassed(true);
        globalThis.window.dispatchEvent(new CustomEvent('sagak:intro-passed'));
      }
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      const timer = setTimeout(() => {
        const sections = [
          { trigger: '.plan-section', target: '.bg-plan' },
          { trigger: '.question-section', target: '.bg-question' },
          { trigger: '.summary-section', target: '.bg-summary' },
          { trigger: '.report-section', target: '.bg-report' },
          { trigger: '.trust-section', target: '.bg-trust' }
        ];

        sections.forEach(({ trigger, target }) => {
          const el = document.querySelector(target);
          if (el) {
            gsap.timeline({
              scrollTrigger: {
                trigger: trigger,
                start: 'top 80%',
                end: 'bottom 20%',
                scrub: true,
              }
            })
            .fromTo(target,
              { opacity: 0, y: 80, scale: 0.92 },
              { opacity: 1, y: 0, scale: 1, duration: 0.4 }
            )
            .to(target,
              { opacity: 0, y: -80, scale: 1.08, duration: 0.4 }
            );
          }
        });
      }, 500);
      return () => {
        ScrollTrigger.getAll().forEach(t => t.kill());
      };
    }
  }, []);
  useEffect(() => {
    const timer = setInterval(() => {
      setTopHeroIndex((current) => (current + 1) % 4);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('sagak-fade-up-active');
          }
        });
      },
      { threshold: 0.1 }
    );
    const elements = document.querySelectorAll('.sagak-fade-up');
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    function handleBgmToggle(event) {
      setBgmEnabled(Boolean(event.detail?.enabled));
    }
    globalThis.window?.addEventListener('sagak:bgm-toggle', handleBgmToggle);
    return () => globalThis.window?.removeEventListener('sagak:bgm-toggle', handleBgmToggle);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlideIndex((current) => (current + 1) % heroSlides.length);
    }, 5200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (promoPaused) return undefined;
    const timer = setInterval(() => {
      setPromoSlideIndex((current) => (current + 1) % promoSlides.length);
    }, 5600);
    return () => clearInterval(timer);
  }, [promoPaused]);

  useEffect(() => {
    if (!bgmEnabled || Platform.OS !== 'web') return undefined;
    if (!bgmRef.current) bgmRef.current = createAmbientBgm();
    const ambient = bgmRef.current;
    if (!ambient) return undefined;
    ambient.context.resume?.();
    ambient.gain.gain.cancelScheduledValues(ambient.context.currentTime);
    ambient.gain.gain.linearRampToValueAtTime(0.14, ambient.context.currentTime + 1.5);
    return () => {
      ambient.gain.gain.cancelScheduledValues(ambient.context.currentTime);
      ambient.gain.gain.linearRampToValueAtTime(0.0001, ambient.context.currentTime + 0.8);
    };
  }, [bgmEnabled]);

  useEffect(() => {
    const timers = [];
    function schedule(callback, delay) {
      timers.push(setTimeout(callback, delay));
    }
    function runCycle() {
      setWrittenWord('');
      Array.from(writingWord).forEach((_, index) => {
        schedule(() => setWrittenWord(writingWord.slice(0, index + 1)), 170 * (index + 1));
      });
      schedule(runCycle, 4000);
    }
    runCycle();
    return () => timers.forEach(clearTimeout);
  }, [writingWord]);

function moveHeroSlide(direction) {
    setHeroSlideIndex((current) => (current + direction + heroSlides.length) % heroSlides.length);
  }

  function movePromoSlide(direction) {
    setPromoSlideIndex((current) => (current + direction + promoSlides.length) % promoSlides.length);
  }

  function toggleBgm() {
    const nextEnabled = !bgmEnabled;
    setBgmEnabled(nextEnabled);
    saveBgmEnabled(nextEnabled);
    if (Platform.OS === 'web' && globalThis.window) {
      globalThis.window.dispatchEvent(new CustomEvent('sagak:bgm-toggle', { detail: { enabled: nextEnabled } }));
    }
  }

  return (
    <ScrollView
      onScroll={handleScroll}
      scrollEventThrottle={16}
      dataSet={{ sagakI18nIgnore: 'true' }}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <style dangerouslySetInnerHTML={{__html: `
        .sagak-fade-up { opacity: 0; transform: translateY(40px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; }
        .sagak-fade-up-active { opacity: 1; transform: translateY(0); }
        .delay-1 { transition-delay: 0.12s; }
        .delay-2 { transition-delay: 0.24s; }
        .delay-3 { transition-delay: 0.36s; }
      `}} />
      <LandingAnimationStyles />

      {!introPassed && <CinematicIntroVideo />}

      <TopHeroCarousel
        activeIndex={topHeroIndex}
        onNext={() => setTopHeroIndex((c) => (c + 1) % 4)}
        onPrevious={() => setTopHeroIndex((c) => (c + 3) % 4)}
        onSelect={setTopHeroIndex}
        onNavigate={onNavigate}
      />

      <View dataSet={{ sagakScrollSection: 'true' }} style={styles.hero}>
        <View style={styles.heroCopy}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{t('landing.hero.pill', '개인화 학습 관리 플랫폼')}</Text>
          </View>
          <Text accessibilityLabel={t('landing.hero.fullLabel', '공부의 흔적을 사각사각 쌓아가세요')} style={styles.title}>
            {t('landing.hero.prefix', '공부의 흔적을')}{'\n'}
            <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.writingWord}>
              {writtenWord || ' '}
            </Text>
            <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.cursor}>
              {writtenWord.length < writingWord.length ? '|' : ''}
            </Text>
            {heroSuffix ? ` ${heroSuffix}` : ''}
          </Text>
          <Text style={styles.description}>
            질문, 요약, 오답, 복습까지 공부의 흐름을 한곳에서 관리하는 학습 파트너입니다.
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
          <View style={styles.heroCarouselTop}>
            <Image source={icon} style={styles.heroCarouselIcon} />
            <View style={styles.heroCarouselCounter}>
              <Text style={styles.heroCarouselCounterText}>{heroSlideIndex + 1} / {heroSlides.length}</Text>
            </View>
          </View>
          <HeroSlide slide={currentHeroSlide} t={t} />
          <View style={styles.heroCarouselControls}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="이전 소개 페이지"
              onPress={() => moveHeroSlide(-1)}
              style={(state) => [styles.heroCarouselButton, ...interactiveStateStyles(state)]}
            >
              <Text style={styles.heroCarouselButtonText}>‹</Text>
            </Pressable>
            <View style={styles.heroCarouselDots}>
              {heroSlides.map((slide, index) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('landing.heroSlide.dotLabel', `${t(slide.titleKey)} 소개 페이지로 이동`).replace('{title}', t(slide.titleKey))}
                  key={slide.titleKey}
                  onPress={() => setHeroSlideIndex(index)}
                  style={[styles.heroCarouselDot, index === heroSlideIndex && styles.heroCarouselDotActive]}
                />
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="다음 소개 페이지"
              onPress={() => moveHeroSlide(1)}
              style={(state) => [styles.heroCarouselButton, ...interactiveStateStyles(state)]}
            >
              <Text style={styles.heroCarouselButtonText}>›</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <PromoCarousel
        activeIndex={promoSlideIndex}
        onNavigate={onNavigate}
        onNext={() => movePromoSlide(1)}
        onPauseChange={setPromoPaused}
        onPrevious={() => movePromoSlide(-1)}
        onSelect={setPromoSlideIndex}
        t={t}
      />

      <View nativeID="features" className="sagak-fade-up" style={styles.revealSection}>
        <Text style={styles.largeSectionTitle}>기록</Text>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionEyebrow}>OPENING NOTES</Text>
          <Text style={styles.sectionTitle}>{t('landing.reveal.title', '사각사각이 학습을 여는 방식')}</Text>
          <Text style={styles.sectionDescription}>
            {t('landing.reveal.description', '조용한 기록, 다정한 피드백, 반복되는 복습을 한 페이지에서 이어갑니다.')}
          </Text>
        </View>
        <View style={styles.revealGrid}>
          {revealCards.map((card, index) => (
            <View dataSet={{ sagakScrollSection: 'true' }} key={card.titleKey} style={[styles.revealCard, index % 2 === 1 && styles.revealCardAlt]}>
              <Text style={styles.revealCardNumber}>{String(index + 1).padStart(2, '0')}</Text>
              <Text style={styles.revealCardTitle}>{t(card.titleKey)}</Text>
              <Text style={styles.revealCardDescription}>{t(card.descriptionKey)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View dataSet={{ sagakScrollSection: 'true' }} style={styles.sectionHeading}>
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

      
      {/* 1. 계획 섹션 */}
      <View nativeID="plan" className="plan-section sagak-fade-up" style={styles.newSection}>
        {Platform.OS === 'web' && <Text style={[styles.bgTitleText, { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }]} className="bg-plan">계획</Text>}
        <View style={styles.newSectionInner}>
          <View style={styles.newTextCol}>
            <Text style={styles.newSectionTitle}>하루 계획이{`\n`}흩어지지 않게</Text>
            <Text style={styles.newSectionDesc}>일정표와 타임라인으로 오늘의 목표를 한눈에 관리하세요.</Text>
            <View style={styles.tagWrap}><Text style={styles.tagText}>일정 관리</Text></View>
          </View>
          <View style={[styles.newVisualCol, { alignItems: 'flex-end' }]}>
            <View style={[styles.mockCard, styles.planMock]}>
              <View style={styles.planHeader}>
                <Text style={styles.planMonth}>May 2026</Text>
                <View style={styles.planDday}><Text style={styles.planDdayText}>D-12</Text></View>
              </View>
              <View style={styles.planTimeline}>
                <View style={styles.planTimeItem}>
                  <View style={styles.planTimeDot} />
                  <Text style={styles.planTimeText}>09:00 수학 개념 복습</Text>
                </View>
                <View style={styles.planTimeItem}>
                  <View style={[styles.planTimeDot, { backgroundColor: '#FF8A65' }]} />
                  <Text style={styles.planTimeText}>11:30 영어 단어 암기</Text>
                </View>
                <View style={styles.planTimeItem}>
                  <View style={styles.planTimeDot} />
                  <Text style={styles.planTimeText}>14:00 오답 노트 작성</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 2. 질문 섹션 */}
      <View nativeID="question" className="question-section sagak-fade-up delay-1" style={styles.newSection}>
        {Platform.OS === 'web' && <Text style={[styles.bgTitleText, { left: '10%', top: '40%' }]} className="bg-question">질문</Text>}
        <View style={[styles.newSectionInner, { flexDirection: 'column', alignItems: 'center', textAlign: 'center' }]}>
          <View style={[styles.newTextCol, { width: '100%', alignItems: 'center', marginBottom: 40 }]}>
            <Text style={[styles.newSectionTitle, { textAlign: 'center' }]}>질문하고, 요약하고,{`\n`}다시 보기</Text>
            <Text style={[styles.newSectionDesc, { textAlign: 'center' }]}>막히는 부분은 언제든 AI에게 질문하고 힌트를 얻으세요.</Text>
          </View>
          <View style={[styles.newVisualCol, { width: '100%', maxWidth: 600, position: 'relative' }]}>
            {/* 떠다니는 말풍선들 */}
            <View style={[styles.floatingBubble, { top: -20, left: -40, backgroundColor: '#FFFDF6' }]}><Text style={{fontSize:24}}>🤔</Text></View>
            <View style={[styles.floatingBubble, { bottom: -20, right: -40, backgroundColor: '#FF8A65' }]}><Text style={{fontSize:24}}>💡</Text></View>
            
            <View style={[styles.mockCard, styles.chatMock]}>
              <View style={styles.chatUserBubble}>
                <Text style={styles.chatUserText}>Q. 이 개념을 쉽게 설명해줘</Text>
              </View>
              <View style={styles.chatAiBubble}>
                <Text style={styles.chatAiText}>AI. 핵심만 정리하면 다음과 같습니다. 먼저 가장 중요한 공식은...</Text>
                <View style={styles.chatActions}>
                  <View style={styles.chatBtn}><Text style={styles.chatBtnText}>요약하기</Text></View>
                  <View style={[styles.chatBtn, { backgroundColor: '#F1F5F9' }]}><Text style={[styles.chatBtnText, { color: '#64748B' }]}>다시 보기</Text></View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 3. 요약 섹션 */}
      <View nativeID="summary" className="summary-section sagak-fade-up delay-2" style={styles.newSection}>
        {Platform.OS === 'web' && <Text style={[styles.bgTitleText, { right: '10%', top: '50%' }]} className="bg-summary">요약</Text>}
        <View style={[styles.newSectionInner, { flexDirection: 'row-reverse' }]}>
          <View style={styles.newTextCol}>
            <Text style={styles.newSectionTitle}>긴 내용을{`\n`}핵심만 남기세요</Text>
            <Text style={styles.newSectionDesc}>노트 필기와 문서 하이라이트로 배운 것을 온전히 내 것으로 만듭니다.</Text>
          </View>
          <View style={[styles.newVisualCol, { alignItems: 'flex-start' }]}>
            <View style={[styles.mockCard, styles.noteMock]}>
              <View style={styles.noteBadge}><Text style={styles.noteBadgeText}>AI 요약 완료</Text></View>
              <Text style={styles.noteTitle}>수학 미적분 핵심 개념</Text>
              <View style={styles.noteLines}>
                <View style={[styles.noteLine, { width: '90%' }]} />
                <View style={[styles.noteLine, { width: '80%' }]} />
                {/* 하이라이트 줄 */}
                <View style={{ position: 'relative', width: '70%', height: 16, marginBottom: 12 }}>
                  <View style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 8, backgroundColor: 'rgba(244, 190, 100, 0.4)' }} />
                  <View style={[styles.noteLine, { width: '100%', position: 'absolute', top: 0, marginBottom: 0 }]} />
                </View>
                <View style={[styles.noteLine, { width: '50%' }]} />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 4. 오답 섹션 */}
      <View nativeID="report" className="report-section sagak-fade-up delay-1" style={styles.newSection}>
        {Platform.OS === 'web' && <Text style={[styles.bgTitleText, { left: '50%', bottom: '-10%', transform: 'translateX(-50%)' }]} className="bg-report">오답</Text>}
        <View style={styles.newSectionInner}>
          <View style={styles.newTextCol}>
            <Text style={styles.newSectionTitle}>틀린 이유를{`\n`}정확히 이해하세요</Text>
            <Text style={styles.newSectionDesc}>내 답안과 정답을 비교하고 AI가 분석해주는 오답 리포트를 확인하세요.</Text>
          </View>
          <View style={[styles.newVisualCol, { position: 'relative', height: 320 }]}>
            {/* 겹쳐진 카드들 */}
            <View style={[styles.mockCard, styles.reportCardBg2]} />
            <View style={[styles.mockCard, styles.reportCardBg1]} />
            <View style={[styles.mockCard, styles.reportCardMain]}>
              <View style={styles.reportHeader}>
                <Text style={styles.reportTitle}>오답 분석 리포트</Text>
                <Text style={styles.reportScore}>-5점</Text>
              </View>
              <View style={styles.reportRow}>
                <Text style={styles.reportLabel}>내 답안</Text>
                <Text style={styles.reportWrong}>④</Text>
              </View>
              <View style={styles.reportRow}>
                <Text style={styles.reportLabel}>정답</Text>
                <Text style={styles.reportCorrect}>②</Text>
              </View>
              <View style={styles.reportReason}>
                <Text style={styles.reportReasonTitle}>틀린 이유</Text>
                <Text style={styles.reportReasonText}>개념 A와 B의 차이를 혼동했습니다. 다시 복습을 추천합니다.</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 5. 신뢰/TRUST 섹션 */}
      <View nativeID="trust" className="trust-section sagak-fade-up delay-2" style={styles.newSection}>
        {Platform.OS === 'web' && <Text style={[styles.bgTitleText, { left: '-5%', top: '10%', opacity: 0.12, fontSize: 160 }]} className="bg-trust">신뢰</Text>}
        <View style={[styles.newSectionInner, { alignItems: 'flex-start' }]}>
          <View style={[styles.newTextCol, { paddingTop: 40 }]}>
            <View style={styles.tagWrap}><Text style={styles.tagText}>TRUST</Text></View>
            <Text style={[styles.newSectionTitle, { marginTop: 20 }]}>차분하지만{`\n`}믿을 수 있는{`\n`}학습 공간</Text>
            <Text style={styles.newSectionDesc}>화려한 효과보다 실제 학습 흐름, 접근성, 기존 API 안정성을 우선합니다.</Text>
          </View>
          <View style={[styles.newVisualCol, { flex: 1.2 }]}>
            <View style={styles.trustCardsContainer}>
              <View style={[styles.mockCard, styles.trustCard]}>
                <View style={styles.trustIconWrap}><Text style={styles.trustIcon}>🔗</Text></View>
                <View style={styles.trustCardContent}>
                  <Text style={styles.trustCardTitle}>기존 흐름 유지</Text>
                  <Text style={styles.trustCardDesc}>로그인/회원가입/라우팅 구조를 무리 없이 이어갑니다.</Text>
                </View>
              </View>
              <View style={[styles.mockCard, styles.trustCard]}>
                <View style={styles.trustIconWrap}><Text style={styles.trustIcon}>👁️</Text></View>
                <View style={styles.trustCardContent}>
                  <Text style={styles.trustCardTitle}>접근성 대응</Text>
                  <Text style={styles.trustCardDesc}>모션 민감 사용자를 위한 reduced motion 설정을 지원합니다.</Text>
                </View>
              </View>
              <View style={[styles.mockCard, styles.trustCard]}>
                <View style={styles.trustIconWrap}><Text style={styles.trustIcon}>🛡️</Text></View>
                <View style={styles.trustCardContent}>
                  <Text style={styles.trustCardTitle}>안정적인 확장성</Text>
                  <Text style={styles.trustCardDesc}>기존 백엔드 흐름을 유지하며 안정적으로 기능을 확장합니다.</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
<View dataSet={{ sagakScrollSection: 'true' }} style={styles.finalCta}>
        <Text style={styles.finalCtaTitle}>{t('landing.final.title', '오늘의 공부를 사각사각 시작해 보세요')}</Text>
        <Text style={styles.finalCtaDescription}>
          {t('landing.final.description', '계획, 질문, 기록, 복습을 한 흐름으로 연결하는 나만의 학습 공간을 만들 수 있습니다.')}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => onNavigate('register')}
          style={(state) => [styles.finalCtaButton, ...interactiveStateStyles(state)]}
        >
          <Text style={styles.finalCtaButtonText}>{t('landing.cta.primary', '무료로 시작하기')}</Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityLabel={bgmEnabled ? t('landing.bgm.offLabel', 'BGM 끄기') : t('landing.bgm.onLabel', 'BGM 켜기')}
        accessibilityRole="button"
        onPress={toggleBgm}
        style={(state) => [styles.bgmButton, bgmEnabled && styles.bgmButtonActive, ...interactiveStateStyles(state)]}
      >
        <Text style={[styles.bgmButtonText, bgmEnabled && styles.bgmButtonTextActive]}>
          ♪ BGM {bgmEnabled ? 'ON' : 'OFF'}
        </Text>
      </Pressable>

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
  trustCardsContainer: {
    gap: 16,
  },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    gap: 20,
    backgroundColor: '#FFFFFF',
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  trustIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(92, 198, 184, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustIcon: {
    fontSize: 20,
  },
  trustCardContent: {
    flex: 1,
  },
  trustCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#15202B',
    marginBottom: 6,
  },
  trustCardDesc: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
  },

  newSection: {
    width: '100%',
    maxWidth: 1180,
    paddingVertical: 140,
    position: 'relative',
  },
  newSectionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 40,
  },
  newTextCol: {
    flex: 1,
    maxWidth: 500,
    zIndex: 10,
  },
  newVisualCol: {
    flex: 1,
    zIndex: 10,
    position: 'relative',
  },
  newSectionTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#15202B',
    lineHeight: 56,
    marginBottom: 20,
  },
  newSectionDesc: {
    fontSize: 18,
    color: '#475569',
    lineHeight: 28,
    marginBottom: 32,
  },
  tagWrap: {
    backgroundColor: 'rgba(92, 198, 184, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  tagText: {
    color: '#0F766E',
    fontWeight: '700',
    fontSize: 14,
  },
  bgTitleText: {
    position: 'absolute',
    fontSize: 180,
    fontWeight: '900',
    color: 'rgba(244, 190, 100, 0.22)',
    zIndex: 0,
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
  },
  mockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#0F1B2D',
    shadowOpacity: 0.1,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
    borderWidth: 1,
    borderColor: 'rgba(21, 32, 43, 0.04)',
  },
  planMock: {
    width: '100%',
    maxWidth: 400,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  planMonth: {
    fontSize: 24,
    fontWeight: '800',
    color: '#15202B',
  },
  planDday: {
    backgroundColor: '#FF8A65',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  planDdayText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
  },
  planTimeline: {
    gap: 24,
  },
  planTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  planTimeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#5CC6B8',
  },
  planTimeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  chatMock: {
    width: '100%',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  chatUserBubble: {
    backgroundColor: '#15202B',
    padding: 16,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
    marginBottom: 16,
    maxWidth: '80%',
  },
  chatUserText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
  chatAiBubble: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  chatAiText: {
    color: '#334155',
    lineHeight: 24,
    fontSize: 15,
    marginBottom: 16,
  },
  chatActions: {
    flexDirection: 'row',
    gap: 12,
  },
  chatBtn: {
    backgroundColor: '#5CC6B8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  chatBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  floatingBubble: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    zIndex: 20,
  },
  noteMock: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFDF6',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noteBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#15202B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
  },
  noteBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  noteTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#15202B',
    marginBottom: 24,
  },
  noteLines: {
    gap: 12,
  },
  noteLine: {
    height: 16,
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
  },
  reportCardBg2: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: '100%',
    height: 300,
    opacity: 0.4,
    transform: [{ rotate: '4deg' }],
  },
  reportCardBg1: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: '100%',
    height: 300,
    opacity: 0.7,
    transform: [{ rotate: '2deg' }],
  },
  reportCardMain: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 300,
    zIndex: 10,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 16,
    marginBottom: 24,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#15202B',
  },
  reportScore: {
    fontSize: 20,
    fontWeight: '900',
    color: '#EF4444',
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reportLabel: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
  },
  reportWrong: {
    fontSize: 18,
    fontWeight: '800',
    color: '#EF4444',
  },
  reportCorrect: {
    fontSize: 18,
    fontWeight: '800',
    color: '#5CC6B8',
  },
  reportReason: {
    marginTop: 16,
    backgroundColor: '#FFFDF6',
    padding: 16,
    borderRadius: 12,
  },
  reportReasonTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F59E0B',
    marginBottom: 8,
  },
  reportReasonText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  communityGrid: {
    width: '100%',
    height: 400,
    position: 'relative',
  },
  comCard1: {
    position: 'absolute',
    top: 0,
    left: '10%',
    width: 320,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    padding: 24,
  },
  comAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#5CC6B8',
  },
  comName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15202B',
    marginBottom: 4,
  },
  comText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  comCard2: {
    position: 'absolute',
    top: 140,
    right: '5%',
    width: 300,
    padding: 24,
  },
  comBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
  },
  comCard3: {
    position: 'absolute',
    bottom: 20,
    left: '20%',
    width: 340,
    padding: 24,
    backgroundColor: '#15202B',
  },
  comLike: {
    position: 'absolute',
    top: -16,
    right: 20,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#EF4444',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },

  introVideoSection: {
    width: '100%',
    height: '100dvh',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#081220',
  },
  introOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 18, 32, 0.35)',
    zIndex: 1,
  },
  introVideoContent: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
    zIndex: 2,
    alignItems: 'center',
    width: '100%',
  },
  introVideoBrand: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 2,
  },
  introVideoCopy: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 64,
  },
  introVideoScroll: {
    position: 'absolute',
    bottom: 40,
    left: '50%',
    transform: [{ translateX: '-50%' }],
    zIndex: 2,
  },
  introVideoScrollText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.8,
  },
  planBgTitle: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
    fontSize: 180,
    fontWeight: '900',
    color: 'rgba(244, 190, 100, 0.28)',
    zIndex: 0,
    pointerEvents: 'none',
  },

  topHeroCarousel: {
    width: '100%',
    backgroundColor: '#FFFDF6',
    paddingVertical: 120,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(21, 32, 43, 0.08)',
  },
  topHeroContent: {
    maxWidth: 800,
    alignItems: 'center',
    textAlign: 'center',
  },
  topHeroTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#15202B',
    textAlign: 'center',
    lineHeight: 56,
    marginBottom: 24,
  },
  topHeroDescription: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 32,
  },
  topHeroCta: {
    backgroundColor: '#5CC6B8',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 999,
  },
  topHeroCtaText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  topHeroArrow: {
    position: 'absolute',
    top: '50%',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#15202B',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    zIndex: 10,
  },
  topHeroArrowLeft: { left: 24 },
  topHeroArrowRight: { right: 24 },
  topHeroArrowText: { fontSize: 32, color: '#15202B' },
  topHeroDots: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 40,
  },
  topHeroDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(21, 32, 43, 0.1)',
  },
  topHeroDotActive: {
    width: 24,
    backgroundColor: '#5CC6B8',
  },
  largeSectionTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#15202B',
    marginBottom: 40,
    textAlign: 'center',
  },

  cinematicIntro: {
    width: '100%',
    height: '100dvh',
    position: 'relative',
    backgroundColor: '#08182A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cinematicOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 24, 42, 0.35)',
  },
  cinematicContent: {
    position: 'relative',
    zIndex: 2,
    alignItems: 'center',
  },
  cinematicBrand: {
    color: '#FFF',
    fontSize: 48,
    fontWeight: '900',
    marginBottom: 24,
    letterSpacing: -1,
  },
  cinematicCopy: {
    color: '#FFF',
    fontSize: 20,
    lineHeight: 32,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.9,
  },
  cinematicScroll: {
    position: 'absolute',
    bottom: 60,
    left: '50%',
    transform: [{ translateX: -30 }],
    alignItems: 'center',
    zIndex: 2,
  },
  cinematicScrollText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    opacity: 0.7,
    marginBottom: 8,
  },
  cinematicScrollArrow: {
    color: '#FFF',
    fontSize: 18,
    opacity: 0.7,
  },
  cinematicControls: {
    position: 'absolute',
    bottom: 40,
    right: 40,
    flexDirection: 'row',
    gap: 16,
    zIndex: 2,
  },
  cinematicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  cinematicButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },

  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    alignItems: 'center',
    paddingBottom: 58
  },
  intro: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    paddingHorizontal: 18,
    backgroundColor: colors.blueDeep,
    cursor: pencilCursor,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2147483647,
    elevation: 2147483647
  },
  introVisual: {
    width: '100%',
    maxWidth: 860,
    minWidth: 290,
    minHeight: 640,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  introMark: {
    position: 'absolute',
    top: 36,
    color: colors.cream,
    fontSize: 72,
    lineHeight: 86,
    fontWeight: '900',
    letterSpacing: 0,
    opacity: 0.9,
    zIndex: 2
  },
  paper: {
    width: '90%',
    maxWidth: 620,
    minHeight: 390,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 38,
    overflow: 'hidden',
    transform: [{ rotate: '-3deg' }],
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 30,
    elevation: 5
  },
  paperHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 38
  },
  paperDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.creamStrong
  },
  paperLineGroup: {
    gap: 24,
    marginTop: 92
  },
  writeLine: {
    height: 18,
    borderRadius: 999,
    backgroundColor: colors.mint
  },
  writeLineLong: {
    width: '82%'
  },
  writeLineMedium: {
    width: '68%',
    backgroundColor: colors.blue
  },
  writeLineShort: {
    width: '48%',
    backgroundColor: colors.creamStrong
  },
  pencil: {
    position: 'absolute',
    left: 42,
    top: 270,
    width: 340,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center'
  },
  pencilEraser: {
    width: 36,
    height: 50,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    backgroundColor: colors.creamStrong,
    borderWidth: 2,
    borderColor: colors.blueDeep
  },
  pencilBody: {
    width: 214,
    height: 50,
    backgroundColor: colors.mint,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.blueDeep,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pencilText: {
    color: colors.blueDeep,
    fontSize: 14,
    fontWeight: '900'
  },
  pencilWood: {
    width: 48,
    height: 50,
    backgroundColor: colors.cream,
    borderTopWidth: 25,
    borderBottomWidth: 25,
    borderLeftWidth: 0,
    borderRightWidth: 36,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: colors.blueDeep
  },
  pencilLead: {
    width: 0,
    height: 0,
    borderTopWidth: 11,
    borderBottomWidth: 11,
    borderLeftWidth: 22,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: colors.ink,
    marginLeft: -18
  },
  introFloatingCard: {
    position: 'absolute',
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 18,
    paddingVertical: 14
  },
  introFloatingCardTop: {
    top: 170,
    right: 48
  },
  introFloatingCardBottom: {
    left: 54,
    bottom: 96
  },
  introFloatingNumber: {
    color: colors.blueDeep,
    fontSize: 20,
    fontWeight: '900'
  },
  introFloatingText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3
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
  cursor: {
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
    minHeight: 430,
    backgroundColor: colors.mintSoft,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: 'space-between',
    padding: 24,
    overflow: 'hidden'
  },
  heroCarouselTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18
  },
  heroCarouselIcon: {
    width: 58,
    height: 58,
    borderRadius: 16
  },
  heroCarouselCounter: {
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  heroCarouselCounterText: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '900'
  },
  heroSlide: {
    flex: 1,
    justifyContent: 'center'
  },
  heroSlideEyebrow: {
    color: colors.mintDeep,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 10
  },
  heroSlideTitle: {
    color: colors.ink,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: 0
  },
  heroSlideDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 23,
    marginTop: 12
  },
  heroSlideBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 18
  },
  heroSlideBadgePrimary: {
    borderRadius: 999,
    backgroundColor: colors.blueDeep,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  heroSlideBadgePrimaryText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '900'
  },
  heroSlideBadgeSecondary: {
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  heroSlideBadgeSecondaryText: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '900'
  },
  heroSlideList: {
    gap: 9,
    marginTop: 18
  },
  heroSlideItem: {
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13
  },
  heroSlideBullet: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.mint
  },
  heroSlideItemText: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800'
  },
  heroCarouselControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18
  },
  heroCarouselButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroCarouselButtonText: {
    color: colors.blueDeep,
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '900'
  },
  heroCarouselDots: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  heroCarouselDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.line
  },
  heroCarouselDotActive: {
    width: 26,
    backgroundColor: colors.mintDeep
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
  promo: {
    width: '100%',
    maxWidth: 1180,
    minHeight: 390,
    borderRadius: 32,
    backgroundColor: colors.mintSoft,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 64,
    padding: 34,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden'
  },
  promoBlue: {
    backgroundColor: colors.blueSoft
  },
  promoCream: {
    backgroundColor: colors.cream
  },
  promoDark: {
    backgroundColor: colors.blueDeep
  },
  promoCopy: {
    flex: 1,
    minWidth: 260,
    maxWidth: 560,
    zIndex: 2
  },
  promoLabel: {
    color: colors.mintDeep,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 14
  },
  promoTitle: {
    color: colors.ink,
    fontSize: 40,
    lineHeight: 50,
    fontWeight: '900',
    letterSpacing: 0
  },
  promoDescription: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 27,
    marginTop: 14,
    maxWidth: 500
  },
  promoCta: {
    alignSelf: 'flex-start',
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: colors.blueDeep,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24
  },
  promoCtaText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '900'
  },
  promoVisual: {
    flex: 1,
    minWidth: 250,
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  promoBubbleLarge: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: colors.surface,
    opacity: 0.72
  },
  promoBubbleSmall: {
    position: 'absolute',
    right: 34,
    bottom: 34,
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.creamStrong,
    opacity: 0.75
  },
  promoIcon: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 38
  },
  promoArrow: {
    position: 'absolute',
    top: '48%',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5
  },
  promoArrowLeft: {
    left: 14
  },
  promoArrowRight: {
    right: 14
  },
  promoArrowText: {
    color: colors.blueDeep,
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '900'
  },
  promoDots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8
  },
  promoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surface
  },
  promoDotActive: {
    width: 28,
    backgroundColor: colors.mintDeep
  },
  revealSection: {
    width: '100%',
    maxWidth: 1180,
    paddingVertical: 120,
  },
  revealGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingHorizontal: 18
  },
  revealCard: {
    flex: 1,
    minWidth: 250,
    minHeight: 230,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 24
  },
  revealCardAlt: {
    backgroundColor: colors.mintSoft
  },
  revealCardNumber: {
    color: colors.creamStrong,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 28
  },
  revealCardTitle: {
    color: colors.ink,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: 0
  },
  revealCardDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 23,
    marginTop: 12
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
  storyList: {
    width: '100%',
    alignItems: 'center',
    gap: 0,
    marginBottom: 0
  },
  storySection: {
    width: '100%',
    minHeight: 720,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  storyKeyword: {
    position: 'absolute',
    left: -12,
    right: -12,
    top: 96,
    color: colors.creamStrong,
    fontSize: 158,
    lineHeight: 174,
    fontWeight: '900',
    textAlign: 'center',
    opacity: 0,
    letterSpacing: 0,
    zIndex: 2,
    pointerEvents: 'none'
  },
  storyContent: {
    width: '100%',
    maxWidth: 1180,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 26,
    zIndex: 1
  },
  storyCopy: {
    flex: 1,
    minWidth: 270,
    maxWidth: 430,
    backgroundColor: colors.background,
    paddingVertical: 22,
    paddingHorizontal: 6,
    zIndex: 3
  },
  storyTitle: {
    color: colors.ink,
    fontSize: 34,
    lineHeight: 44,
    fontWeight: '900',
    letterSpacing: 0
  },
  storyDescription: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 27,
    marginTop: 14
  },
  storyChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: 24
  },
  storyChip: {
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 13,
    paddingVertical: 8
  },
  storyChipText: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '800'
  },
  storyPreview: {
    flex: 1,
    minWidth: 260,
    maxWidth: 520,
    minHeight: 360,
    borderRadius: 34,
    backgroundColor: colors.mintSoft,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 26,
    justifyContent: 'space-between',
    overflow: 'hidden',
    zIndex: 1
  },
  storyPreviewBlue: {
    backgroundColor: colors.blueSoft
  },
  storyPreviewCream: {
    backgroundColor: colors.cream
  },
  storyPreviewFrame: {
    flex: 1,
    justifyContent: 'space-between'
  },
  storyPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  storyPreviewIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 10,
    borderColor: colors.mint
  },
  storyPreviewTitleGroup: {
    flex: 1,
    gap: 6
  },
  storyPreviewTitle: {
    color: colors.blueDeep,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0
  },
  storyPreviewMeta: {
    color: colors.mintDeep,
    fontSize: 13,
    fontWeight: '800'
  },
  storyPreviewRows: {
    gap: 12
  },
  storyPreviewRow: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  storyPreviewRowMuted: {
    backgroundColor: colors.surfaceWarm
  },
  storyPreviewBullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.mint
  },
  storyPreviewItemText: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21
  },
  storyPreviewInput: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: 'center',
    paddingHorizontal: 18
  },
  storyPreviewInputText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700'
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
  useCaseSection: {
    width: '100%',
    maxWidth: 1180,
    paddingHorizontal: 22,
    paddingVertical: 58,
    marginTop: 28,
    borderRadius: 30,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 26,
    justifyContent: 'space-between'
  },
  useCaseCopy: {
    flex: 1,
    minWidth: 260,
    maxWidth: 460
  },
  useCaseSteps: {
    flex: 1,
    minWidth: 260,
    gap: 12
  },
  useCaseStep: {
    minHeight: 62,
    borderRadius: 18,
    backgroundColor: colors.mintSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16
  },
  useCaseStepNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    color: colors.blueDeep,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 34,
    textAlign: 'center'
  },
  useCaseStepText: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 21
  },
  trustSection: {
    width: '100%',
    maxWidth: 1180,
    paddingHorizontal: 22,
    paddingVertical: 58,
    marginTop: 24,
    borderRadius: 30,
    backgroundColor: colors.blueDeep,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 28,
    justifyContent: 'space-between'
  },
  trustCopy: {
    flex: 1,
    minWidth: 260,
    maxWidth: 500
  },
  trustTitle: {
    color: colors.surface,
    fontSize: 32,
    lineHeight: 42,
    fontWeight: '900',
    letterSpacing: 0
  },
  trustDescription: {
    color: colors.cream,
    fontSize: 15,
    lineHeight: 25,
    marginTop: 14
  },
  trustItems: {
    flex: 1,
    minWidth: 260,
    gap: 12,
    justifyContent: 'center'
  },
  trustItem: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16
  },
  trustCheck: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.mint
  },
  trustItemText: {
    flex: 1,
    color: colors.surface,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 21
  },
  finalCta: {
    width: '100%',
    maxWidth: 1180,
    marginTop: 24,
    paddingHorizontal: 22,
    paddingVertical: 64,
    alignItems: 'center'
  },
  finalCtaTitle: {
    color: colors.ink,
    fontSize: 36,
    lineHeight: 46,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0
  },
  finalCtaDescription: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 26,
    marginTop: 14,
    maxWidth: 620,
    textAlign: 'center'
  },
  finalCtaButton: {
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: colors.blue,
    paddingHorizontal: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28
  },
  finalCtaButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '900'
  },
  bgmButton: {
    position: 'fixed',
    right: 22,
    bottom: 22,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50
  },
  bgmButtonActive: {
    backgroundColor: colors.mintSoft,
    borderColor: colors.mintDeep
  },
  bgmButtonText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900'
  },
  bgmButtonTextActive: {
    color: colors.mintDeep
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
