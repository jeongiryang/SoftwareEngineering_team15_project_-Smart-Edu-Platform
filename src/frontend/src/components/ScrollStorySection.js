import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../i18n';
import { colors, interactiveStateStyles, shadows } from '../styles/theme';

const icon = require('../assets/sagaksagak-app-icon.png');

const VIEWPORT_HEIGHT = 760;

const promoSlides = [
  {
    id: 'learn',
    labelKey: 'landing.showcase.learn.eyebrow',
    titleKey: 'landing.showcase.learn.title',
    descriptionKey: 'landing.showcase.learn.description',
    metricKey: 'landing.showcase.learn.metric',
    mood: 'mint',
    preview: 'ai'
  },
  {
    id: 'organize',
    labelKey: 'landing.showcase.organize.eyebrow',
    titleKey: 'landing.showcase.organize.title',
    descriptionKey: 'landing.showcase.organize.description',
    metricKey: 'landing.showcase.organize.metric',
    mood: 'cream',
    preview: 'plan'
  },
  {
    id: 'connect',
    labelKey: 'landing.showcase.connect.eyebrow',
    titleKey: 'landing.showcase.connect.title',
    descriptionKey: 'landing.showcase.connect.description',
    metricKey: 'landing.showcase.connect.metric',
    mood: 'blue',
    preview: 'social'
  },
  {
    id: 'challenge',
    labelKey: 'landing.showcase.challenge.eyebrow',
    titleKey: 'landing.showcase.challenge.title',
    descriptionKey: 'landing.showcase.challenge.description',
    metricKey: 'landing.showcase.challenge.metric',
    mood: 'mint',
    preview: 'quest'
  }
];

const availableFeatureKeys = [
  {
    labelKey: 'landing.feature.ai.label',
    titleKey: 'landing.feature.ai.title',
    descriptionKey: 'landing.feature.ai.description',
    preview: 'ai'
  },
  {
    labelKey: 'landing.feature.plan.label',
    titleKey: 'landing.feature.plan.title',
    descriptionKey: 'landing.feature.plan.description',
    preview: 'plan'
  },
  {
    labelKey: 'landing.feature.focus.label',
    titleKey: 'landing.feature.focus.title',
    descriptionKey: 'landing.feature.focus.description',
    preview: 'focus'
  },
  {
    labelKey: 'landing.feature.community.label',
    titleKey: 'landing.feature.community.title',
    descriptionKey: 'landing.feature.community.description',
    preview: 'community'
  },
  {
    labelKey: 'landing.feature.social.label',
    titleKey: 'landing.feature.social.title',
    descriptionKey: 'landing.feature.social.description',
    preview: 'social'
  },
  {
    labelKey: 'landing.feature.reward.label',
    titleKey: 'landing.feature.reward.title',
    descriptionKey: 'landing.feature.reward.description',
    preview: 'reward'
  },
  {
    labelKey: 'landing.feature.coop.label',
    titleKey: 'landing.feature.coop.title',
    descriptionKey: 'landing.feature.coop.description',
    preview: 'quest'
  },
  {
    labelKey: 'landing.feature.accessibility.label',
    titleKey: 'landing.feature.accessibility.title',
    descriptionKey: 'landing.feature.accessibility.description',
    preview: 'access'
  }
];

const storySections = [
  {
    id: 'record',
    keywordKey: 'landing.showcase.record.keyword',
    eyebrowKey: 'landing.showcase.record.eyebrow',
    titleKey: 'landing.showcase.record.title',
    descriptionKey: 'landing.showcase.record.description',
    metricKey: 'landing.showcase.record.metric',
    accent: 'mint',
    align: 'right',
    cards: [
      availableFeatureKeys[1],
      availableFeatureKeys[2],
      availableFeatureKeys[6]
    ]
  },
  {
    id: 'ask',
    keywordKey: 'landing.showcase.ask.keyword',
    eyebrowKey: 'landing.showcase.ask.eyebrow',
    titleKey: 'landing.showcase.ask.title',
    descriptionKey: 'landing.showcase.ask.description',
    metricKey: 'landing.showcase.ask.metric',
    accent: 'blue',
    align: 'left',
    cards: [
      availableFeatureKeys[0],
      availableFeatureKeys[2],
      availableFeatureKeys[3]
    ]
  },
  {
    id: 'social',
    keywordKey: 'landing.showcase.social.keyword',
    eyebrowKey: 'landing.showcase.social.eyebrow',
    titleKey: 'landing.showcase.social.title',
    descriptionKey: 'landing.showcase.social.description',
    metricKey: 'landing.showcase.social.metric',
    accent: 'cream',
    align: 'right',
    cards: [
      availableFeatureKeys[4],
      availableFeatureKeys[3],
      availableFeatureKeys[5]
    ]
  },
  {
    id: 'quest',
    keywordKey: 'landing.showcase.challenge.keyword',
    eyebrowKey: 'landing.showcase.challenge.eyebrow',
    titleKey: 'landing.showcase.challenge.title',
    descriptionKey: 'landing.showcase.challenge.description',
    metricKey: 'landing.showcase.challenge.metric',
    accent: 'mint',
    align: 'left',
    cards: [
      availableFeatureKeys[6],
      {
        labelKey: 'landing.feature.raid.label',
        titleKey: 'landing.feature.raid.title',
        descriptionKey: 'landing.feature.raid.description',
        preview: 'raid'
      },
      availableFeatureKeys[7]
    ]
  }
];

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function smoothStep(value) {
  const p = clamp(value);
  return p * p * (3 - 2 * p);
}

function getMotion(scrollY = 0, layout) {
  if (!layout?.height) {
    return { enter: 0, focus: 0, distance: 0 };
  }

  const enter = smoothStep((scrollY + VIEWPORT_HEIGHT * 0.78 - layout.y) / Math.max(layout.height * 0.72, 1));
  const sectionCenter = layout.y + layout.height / 2;
  const viewportCenter = scrollY + VIEWPORT_HEIGHT / 2;
  const focusRange = Math.max(layout.height * 0.7, VIEWPORT_HEIGHT * 0.68);
  const distance = clamp((sectionCenter - viewportCenter) / focusRange, -1, 1);
  const focus = smoothStep(1 - Math.abs(distance));

  return { enter, focus, distance };
}

function getSlideMotion(motion, index, side) {
  const progress = smoothStep(motion.enter * 1.18 - index * 0.08);

  return {
    opacity: 0.34 + progress * 0.66,
    transform: [
      { translateX: side * (1 - progress) * 126 },
      { translateY: (1 - progress) * 22 },
      { scale: 0.94 + progress * 0.06 }
    ]
  };
}

function PreviewLines({ variant = 'default', progress = 1 }) {
  if (variant === 'plan') {
    return (
      <View style={styles.planPreview}>
        {[0, 1, 2].map((column) => (
          <View key={column} style={styles.planColumn}>
            <View style={styles.planColumnHeader} />
            <View style={[styles.planCardLine, column === 1 && styles.planCardLineActive]} />
            <View style={styles.planCardShort} />
          </View>
        ))}
      </View>
    );
  }

  if (variant === 'focus') {
    return (
      <View style={styles.focusPreview}>
        <View style={[styles.focusRing, { transform: [{ rotate: `${-20 + progress * 60}deg` }] }]}>
          <View style={styles.focusRingInner} />
        </View>
        <View style={styles.previewStack}>
          <View style={styles.previewLineStrong} />
          <View style={styles.previewLineShort} />
        </View>
      </View>
    );
  }

  if (['community', 'social'].includes(variant)) {
    return (
      <View style={styles.socialPreview}>
        {[0, 1, 2].map((item) => (
          <View key={item} style={styles.socialRow}>
            <View style={[styles.socialAvatar, item === 0 && styles.socialAvatarActive]} />
            <View style={styles.previewStack}>
              <View style={styles.previewLineStrong} />
              <View style={styles.previewLineShort} />
            </View>
            <View style={item === 2 ? styles.messageDot : styles.onlineDot} />
          </View>
        ))}
      </View>
    );
  }

  if (['quest', 'raid', 'reward'].includes(variant)) {
    const fill = `${Math.round(42 + progress * 46)}%`;

    return (
      <View style={styles.progressPreview}>
        <View style={styles.progressTopRow}>
          <View style={styles.previewPill} />
          <View style={styles.previewPillAlt} />
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: fill }]} />
        </View>
        <View style={styles.progressMiniLines}>
          <View style={[styles.progressMiniLine, { width: '66%' }]} />
          <View style={[styles.progressMiniLine, styles.progressMiniLineAlt, { width: '48%' }]} />
        </View>
      </View>
    );
  }

  if (variant === 'access') {
    return (
      <View style={styles.accessPreview}>
        <View style={styles.accessScaleLarge} />
        <View style={styles.accessScaleMedium} />
        <View style={styles.accessSwitchRow}>
          <View style={styles.accessSwitchActive} />
          <View style={styles.accessSwitch} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.defaultPreview}>
      <View style={styles.previewTop}>
        <View style={styles.previewIconDot} />
        <View style={styles.previewStack}>
          <View style={styles.previewLineStrong} />
          <View style={styles.previewLineShort} />
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(48 + progress * 38)}%` }]} />
      </View>
    </View>
  );
}

function PromoCarousel({ activeIndex, onMove, onSelect, t }) {
  const slide = promoSlides[activeIndex];

  return (
    <View
      style={[
        styles.promo,
        slide.mood === 'blue' && styles.promoBlue,
        slide.mood === 'cream' && styles.promoCream
      ]}
    >
      <Pressable
        accessibilityLabel={t('landing.carousel.prev')}
        accessibilityRole="button"
        onPress={() => onMove(-1)}
        style={(state) => [styles.promoArrow, styles.promoArrowLeft, ...interactiveStateStyles(state)]}
      >
        <Text style={styles.promoArrowText}>{'<'}</Text>
      </Pressable>

      <View style={styles.promoCopy}>
        <Text style={styles.promoLabel}>{t(slide.labelKey)}</Text>
        <Text style={styles.promoTitle}>{t(slide.titleKey)}</Text>
        <Text style={styles.promoDescription}>{t(slide.descriptionKey)}</Text>
        <View style={styles.promoCta}>
          <View style={styles.promoCtaDot} />
          <Text style={styles.promoCtaText}>{t(slide.metricKey)}</Text>
        </View>
      </View>

      <View style={styles.promoVisual}>
        <View style={styles.promoBubbleLarge} />
        <View style={styles.promoBubbleSmall} />
        <Image source={icon} style={styles.promoIcon} />
        <View style={[styles.promoMockCard, shadows.card]}>
          <Text style={styles.promoMockLabel}>{t(slide.labelKey)}</Text>
          <PreviewLines progress={0.88} variant={slide.preview} />
        </View>
      </View>

      <Pressable
        accessibilityLabel={t('landing.carousel.next')}
        accessibilityRole="button"
        onPress={() => onMove(1)}
        style={(state) => [styles.promoArrow, styles.promoArrowRight, ...interactiveStateStyles(state)]}
      >
        <Text style={styles.promoArrowText}>{'>'}</Text>
      </Pressable>

      <View style={styles.promoDots}>
        {promoSlides.map((item, index) => (
          <Pressable
            accessibilityLabel={t('landing.carousel.dotLabel')}
            accessibilityRole="button"
            key={item.id}
            onPress={() => onSelect(index)}
            style={[styles.promoDot, index === activeIndex && styles.promoDotActive]}
          />
        ))}
      </View>
    </View>
  );
}

function FeatureCard({ feature, index, motion, t }) {
  const side = index % 2 === 0 ? -1 : 1;
  const animatedStyle = getSlideMotion(motion, index % 4, side);
  const progress = smoothStep(motion.enter * 1.15 - index * 0.04);

  return (
    <Pressable
      accessibilityLabel={`${t(feature.labelKey)}: ${t(feature.titleKey)}`}
      accessibilityRole="text"
      style={(state) => [
        styles.featureCard,
        shadows.card,
        index % 3 === 1 && styles.featureCardMint,
        index % 3 === 2 && styles.featureCardCream,
        animatedStyle,
        ...interactiveStateStyles(state, { kind: 'card' })
      ]}
    >
      <Text style={styles.featureLabel}>{t(feature.labelKey)}</Text>
      <Text numberOfLines={2} style={styles.featureTitle}>{t(feature.titleKey)}</Text>
      <Text numberOfLines={3} style={styles.featureDescription}>{t(feature.descriptionKey)}</Text>
      <PreviewLines progress={Math.max(progress, motion.focus)} variant={feature.preview} />
    </Pressable>
  );
}

function FeatureGridSection({ layout, onLayout, scrollY, storyY, t }) {
  const absoluteLayout = layout ? { ...layout, y: storyY + layout.y } : undefined;
  const motion = getMotion(scrollY, absoluteLayout);

  return (
    <View
      onLayout={(event) => onLayout('features', event.nativeEvent?.layout)}
      style={styles.featureSection}
    >
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={[
          styles.sectionBackgroundWord,
          {
            opacity: 0.04 + motion.focus * 0.22,
            transform: [{ translateY: motion.distance * 42 }]
          }
        ]}
      >
        SERVICE
      </Text>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionEyebrow}>{t('landing.section.available.eyebrow')}</Text>
        <Text style={styles.sectionTitle}>{t('landing.section.available.title')}</Text>
        <Text style={styles.sectionDescription}>{t('landing.section.available.description')}</Text>
      </View>
      <View style={styles.featureGrid}>
        {availableFeatureKeys.map((feature, index) => (
          <FeatureCard feature={feature} index={index} key={feature.titleKey} motion={motion} t={t} />
        ))}
      </View>
    </View>
  );
}

function StoryPreviewCard({ feature, index, motion, t }) {
  const side = index % 2 === 0 ? 1 : -1;
  const animatedStyle = getSlideMotion(motion, index, side);

  return (
    <View
      style={[
        styles.storyPreviewCard,
        index === 1 && styles.storyPreviewCardMint,
        index === 2 && styles.storyPreviewCardCream,
        shadows.card,
        animatedStyle
      ]}
    >
      <Text style={styles.storyPreviewLabel}>{t(feature.labelKey)}</Text>
      <Text numberOfLines={2} style={styles.storyPreviewTitle}>{t(feature.titleKey)}</Text>
      <PreviewLines progress={Math.max(motion.enter, motion.focus)} variant={feature.preview} />
    </View>
  );
}

function StorySection({ layout, onLayout, scene, scrollY, storyY, t }) {
  const absoluteLayout = layout ? { ...layout, y: storyY + layout.y } : undefined;
  const motion = getMotion(scrollY, absoluteLayout);
  const reverse = scene.align === 'left';

  return (
    <View
      onLayout={(event) => onLayout(scene.id, event.nativeEvent?.layout)}
      style={styles.storySection}
    >
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={[
          styles.storyKeyword,
          {
            opacity: 0.05 + motion.focus * 0.24,
            transform: [
              { translateY: motion.distance * 60 },
              { scale: 0.96 + motion.focus * 0.08 }
            ]
          }
        ]}
      >
        {t(scene.keywordKey)}
      </Text>

      <View style={[styles.storyContent, reverse && styles.storyContentReverse]}>
        <View style={styles.storyCopy}>
          <Text style={styles.storyEyebrow}>{t(scene.eyebrowKey)}</Text>
          <Text style={styles.storyTitle}>{t(scene.titleKey)}</Text>
          <Text style={styles.storyDescription}>{t(scene.descriptionKey)}</Text>
          <View
            style={[
              styles.storyChip,
              scene.accent === 'blue' && styles.storyChipBlue,
              scene.accent === 'cream' && styles.storyChipCream
            ]}
          >
            <Text style={styles.storyChipText}>{t(scene.metricKey)}</Text>
          </View>
        </View>

        <View style={[styles.storyCards, reverse && styles.storyCardsReverse]}>
          {scene.cards.map((feature, index) => (
            <StoryPreviewCard feature={feature} index={index} key={`${scene.id}-${feature.titleKey}`} motion={motion} t={t} />
          ))}
        </View>
      </View>
    </View>
  );
}

export default function ScrollStorySection({ scrollY = 0 }) {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [storyY, setStoryY] = useState(0);
  const [sectionLayouts, setSectionLayouts] = useState({});

  const moveSlide = (direction) => {
    setActiveIndex((current) => (current + direction + promoSlides.length) % promoSlides.length);
  };

  const handleLayout = (id, layout) => {
    if (!layout) {
      return;
    }

    setSectionLayouts((current) => ({
      ...current,
      [id]: layout
    }));
  };

  return (
    <View
      onLayout={(event) => {
        const layout = event.nativeEvent?.layout;
        if (layout) {
          setStoryY(layout.y || 0);
        }
      }}
      style={styles.story}
    >
      <View style={styles.heading}>
        <Text style={styles.sectionEyebrow}>{t('landing.showcase.eyebrow')}</Text>
        <Text style={styles.sectionTitle}>{t('landing.showcase.title')}</Text>
        <Text style={styles.sectionDescription}>{t('landing.showcase.description')}</Text>
      </View>

      <PromoCarousel activeIndex={activeIndex} onMove={moveSlide} onSelect={setActiveIndex} t={t} />

      <FeatureGridSection
        layout={sectionLayouts.features}
        onLayout={handleLayout}
        scrollY={scrollY}
        storyY={storyY}
        t={t}
      />

      <View style={styles.storyList}>
        {storySections.map((scene) => (
          <StorySection
            key={scene.id}
            layout={sectionLayouts[scene.id]}
            onLayout={handleLayout}
            scene={scene}
            scrollY={scrollY}
            storyY={storyY}
            t={t}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  story: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: colors.background,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 28
  },
  heading: {
    width: '100%',
    maxWidth: 1180,
    marginBottom: 26
  },
  sectionHeading: {
    width: '100%',
    maxWidth: 1180,
    paddingHorizontal: 18,
    marginBottom: 28,
    zIndex: 4
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
    lineHeight: 38,
    letterSpacing: 0
  },
  sectionDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 23,
    marginTop: 10,
    maxWidth: 640
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
    maxWidth: 560
  },
  promoCta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 22,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: colors.blueDeep
  },
  promoCtaDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.mint
  },
  promoCtaText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '900'
  },
  promoVisual: {
    flex: 1,
    minWidth: 260,
    minHeight: 275,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1
  },
  promoBubbleLarge: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: colors.surface,
    opacity: 0.56
  },
  promoBubbleSmall: {
    position: 'absolute',
    right: 28,
    bottom: 18,
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.creamStrong,
    opacity: 0.66
  },
  promoIcon: {
    width: 106,
    height: 106,
    borderRadius: 30,
    zIndex: 3,
    transform: [{ rotate: '-8deg' }]
  },
  promoMockCard: {
    position: 'absolute',
    right: 14,
    bottom: 20,
    width: 228,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 18,
    gap: 14,
    zIndex: 4
  },
  promoMockLabel: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '900'
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
    zIndex: 8
  },
  promoArrowLeft: {
    left: 16
  },
  promoArrowRight: {
    right: 16
  },
  promoArrowText: {
    color: colors.blueDeep,
    fontSize: 23,
    lineHeight: 27,
    fontWeight: '900'
  },
  promoDots: {
    position: 'absolute',
    bottom: 22,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    zIndex: 6
  },
  promoDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line
  },
  promoDotActive: {
    width: 30,
    backgroundColor: colors.mint,
    borderColor: colors.mint
  },
  featureSection: {
    width: '100%',
    maxWidth: 1180,
    minHeight: 620,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 28
  },
  sectionBackgroundWord: {
    position: 'absolute',
    left: -12,
    right: -12,
    top: 86,
    color: colors.blueDeep,
    fontSize: 156,
    lineHeight: 176,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0,
    zIndex: 0
  },
  featureGrid: {
    width: '100%',
    maxWidth: 1180,
    paddingHorizontal: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 64,
    zIndex: 3
  },
  featureCard: {
    flex: 1,
    minWidth: 230,
    minHeight: 216,
    padding: 24,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    justifyContent: 'space-between',
    gap: 14
  },
  featureCardMint: {
    backgroundColor: colors.mintSoft
  },
  featureCardCream: {
    backgroundColor: colors.cream
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
    marginBottom: 2
  },
  featureTitle: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 2,
    letterSpacing: 0
  },
  featureDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22
  },
  storyList: {
    width: '100%',
    alignItems: 'center'
  },
  storySection: {
    width: '100%',
    maxWidth: 1180,
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
    color: colors.blueDeep,
    fontSize: 158,
    lineHeight: 174,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0,
    zIndex: 0
  },
  storyContent: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 40,
    zIndex: 3
  },
  storyContentReverse: {
    flexDirection: 'row-reverse'
  },
  storyCopy: {
    flex: 1,
    minWidth: 270,
    maxWidth: 500,
    backgroundColor: 'rgba(255, 253, 246, 0.82)',
    borderRadius: 28,
    paddingVertical: 24,
    paddingHorizontal: 8,
    zIndex: 5
  },
  storyEyebrow: {
    alignSelf: 'flex-start',
    color: colors.mintDeep,
    backgroundColor: colors.mintSoft,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 20
  },
  storyTitle: {
    color: colors.ink,
    fontSize: 42,
    lineHeight: 56,
    fontWeight: '900',
    letterSpacing: 0
  },
  storyDescription: {
    color: colors.muted,
    fontSize: 18,
    lineHeight: 28,
    marginTop: 20,
    marginBottom: 26
  },
  storyChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: colors.mintSoft,
    paddingHorizontal: 16,
    paddingVertical: 9
  },
  storyChipBlue: {
    backgroundColor: colors.blueSoft
  },
  storyChipCream: {
    backgroundColor: colors.cream
  },
  storyChipText: {
    color: colors.blueDeep,
    fontSize: 14,
    fontWeight: '900'
  },
  storyCards: {
    flex: 1,
    minWidth: 300,
    alignItems: 'flex-end',
    gap: 16
  },
  storyCardsReverse: {
    alignItems: 'flex-start'
  },
  storyPreviewCard: {
    width: '100%',
    maxWidth: 400,
    minHeight: 176,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 24,
    gap: 14,
    justifyContent: 'space-between'
  },
  storyPreviewCardMint: {
    backgroundColor: colors.mintSoft
  },
  storyPreviewCardCream: {
    backgroundColor: colors.cream
  },
  storyPreviewLabel: {
    alignSelf: 'flex-start',
    color: colors.mintDeep,
    backgroundColor: colors.surface,
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    fontWeight: '900'
  },
  storyPreviewTitle: {
    color: colors.ink,
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '900',
    letterSpacing: 0
  },
  defaultPreview: {
    gap: 12
  },
  previewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  previewIconDot: {
    width: 34,
    height: 34,
    borderRadius: 13,
    backgroundColor: colors.mintSoft,
    borderWidth: 8,
    borderColor: colors.mint
  },
  previewStack: {
    flex: 1,
    gap: 8
  },
  previewLineStrong: {
    width: '100%',
    height: 12,
    borderRadius: 999,
    backgroundColor: colors.blueSoft
  },
  previewLineShort: {
    width: '62%',
    height: 9,
    borderRadius: 999,
    backgroundColor: colors.mintSoft
  },
  planPreview: {
    flexDirection: 'row',
    gap: 7
  },
  planColumn: {
    flex: 1,
    minHeight: 82,
    borderRadius: 14,
    padding: 7,
    gap: 7,
    backgroundColor: colors.blueSoft
  },
  planColumnHeader: {
    height: 9,
    borderRadius: 999,
    backgroundColor: colors.blue
  },
  planCardLine: {
    height: 22,
    borderRadius: 10,
    backgroundColor: colors.surface
  },
  planCardLineActive: {
    backgroundColor: colors.mintSoft
  },
  planCardShort: {
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.surface
  },
  focusPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  focusRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 9,
    borderColor: colors.mint,
    borderRightColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  focusRingInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface
  },
  socialPreview: {
    gap: 8
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9
  },
  socialAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.blueSoft
  },
  socialAvatarActive: {
    backgroundColor: colors.mint
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success
  },
  messageDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.creamStrong
  },
  progressPreview: {
    gap: 12
  },
  progressTopRow: {
    flexDirection: 'row',
    gap: 8
  },
  previewPill: {
    width: 70,
    height: 24,
    borderRadius: 999,
    backgroundColor: colors.mintSoft
  },
  previewPillAlt: {
    width: 96,
    height: 24,
    borderRadius: 999,
    backgroundColor: colors.blueSoft
  },
  progressTrack: {
    width: '100%',
    height: 13,
    borderRadius: 999,
    backgroundColor: colors.cream,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.mint
  },
  progressMiniLines: {
    gap: 7
  },
  progressMiniLine: {
    height: 9,
    borderRadius: 999,
    backgroundColor: colors.blueSoft
  },
  progressMiniLineAlt: {
    backgroundColor: colors.mintSoft
  },
  accessPreview: {
    gap: 10
  },
  accessScaleLarge: {
    width: '100%',
    height: 18,
    borderRadius: 999,
    backgroundColor: colors.blueSoft
  },
  accessScaleMedium: {
    width: '68%',
    height: 13,
    borderRadius: 999,
    backgroundColor: colors.mintSoft
  },
  accessSwitchRow: {
    flexDirection: 'row',
    gap: 8
  },
  accessSwitchActive: {
    width: 42,
    height: 24,
    borderRadius: 999,
    backgroundColor: colors.mint
  },
  accessSwitch: {
    width: 42,
    height: 24,
    borderRadius: 999,
    backgroundColor: colors.cream
  }
});
