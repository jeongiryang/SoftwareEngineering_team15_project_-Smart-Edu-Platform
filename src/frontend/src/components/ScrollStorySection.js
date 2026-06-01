import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../i18n';
import { colors, interactiveStateStyles, shadows } from '../styles/theme';

const VIEWPORT_HEIGHT = 760;

const serviceScenes = [
  {
    id: 'learn',
    keyword: 'LEARN',
    eyebrowKey: 'landing.showcase.learn.eyebrow',
    titleKey: 'landing.showcase.learn.title',
    descriptionKey: 'landing.showcase.learn.description',
    metricKey: 'landing.showcase.learn.metric',
    mood: 'mint',
    cards: [
      ['landing.feature.ai.label', 'landing.feature.ai.title', 'landing.feature.ai.description', 'chat'],
      ['landing.feature.focus.label', 'landing.feature.focus.title', 'landing.feature.focus.description', 'timer'],
      ['landing.carousel.ask.secondary', 'landing.carousel.ask.item3', 'landing.carousel.ask.description', 'quiz']
    ]
  },
  {
    id: 'organize',
    keyword: 'PLAN',
    eyebrowKey: 'landing.showcase.organize.eyebrow',
    titleKey: 'landing.showcase.organize.title',
    descriptionKey: 'landing.showcase.organize.description',
    metricKey: 'landing.showcase.organize.metric',
    mood: 'cream',
    cards: [
      ['landing.feature.plan.label', 'landing.feature.plan.title', 'landing.feature.plan.description', 'kanban'],
      ['landing.carousel.start.primary', 'landing.carousel.start.item1', 'landing.carousel.start.description', 'dashboard'],
      ['landing.carousel.focus.secondary', 'landing.showcase.record.title', 'landing.showcase.record.description', 'stats']
    ]
  },
  {
    id: 'connect',
    keyword: 'LINK',
    eyebrowKey: 'landing.showcase.connect.eyebrow',
    titleKey: 'landing.showcase.connect.title',
    descriptionKey: 'landing.showcase.connect.description',
    metricKey: 'landing.showcase.connect.metric',
    mood: 'blue',
    cards: [
      ['landing.feature.community.label', 'landing.feature.community.title', 'landing.feature.community.description', 'post'],
      ['landing.feature.social.label', 'landing.feature.social.title', 'landing.feature.social.description', 'presence'],
      ['landing.carousel.together.primary', 'landing.carousel.together.item2', 'landing.carousel.together.description', 'message']
    ]
  },
  {
    id: 'challenge',
    keyword: 'QUEST',
    eyebrowKey: 'landing.showcase.challenge.eyebrow',
    titleKey: 'landing.showcase.challenge.title',
    descriptionKey: 'landing.showcase.challenge.description',
    metricKey: 'landing.showcase.challenge.metric',
    mood: 'mint',
    cards: [
      ['landing.feature.raid.label', 'landing.feature.raid.title', 'landing.feature.raid.description', 'raid'],
      ['landing.feature.coop.label', 'landing.feature.coop.title', 'landing.feature.coop.description', 'coop'],
      ['landing.feature.reward.label', 'landing.feature.reward.title', 'landing.feature.reward.description', 'reward']
    ]
  },
  {
    id: 'care',
    keyword: 'CARE',
    eyebrowKey: 'landing.showcase.access.eyebrow',
    titleKey: 'landing.showcase.access.title',
    descriptionKey: 'landing.showcase.access.description',
    metricKey: 'landing.showcase.access.metric',
    mood: 'cream',
    cards: [
      ['landing.feature.accessibility.label', 'landing.feature.accessibility.title', 'landing.feature.accessibility.description', 'accessibility'],
      ['landing.showcase.reward.eyebrow', 'landing.showcase.reward.title', 'landing.showcase.reward.description', 'profile'],
      ['landing.feature.reward.label', 'landing.feature.reward.title', 'landing.feature.reward.description', 'reward']
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

function calculateMotion(scrollY, layout) {
  if (!layout?.height) {
    return { focus: 0, enter: 0, distance: 0 };
  }

  const viewportCenter = scrollY + VIEWPORT_HEIGHT / 2;
  const sectionCenter = layout.y + layout.height / 2;
  const distance = sectionCenter - viewportCenter;
  const focusRange = Math.max(layout.height * 0.72, VIEWPORT_HEIGHT * 0.62);
  const focus = smoothStep(1 - Math.abs(distance) / focusRange);
  const enter = smoothStep((scrollY + VIEWPORT_HEIGHT * 0.72 - layout.y) / Math.max(layout.height * 0.72, 1));

  return {
    focus,
    enter,
    distance: clamp(distance / focusRange, -1, 1)
  };
}

function MiniPreview({ type, progress }) {
  const fill = `${Math.round(36 + progress * 55)}%`;

  if (type === 'timer') {
    return (
      <View style={styles.timerPreview}>
        <View style={[styles.timerRing, { transform: [{ rotate: `${-22 + progress * 56}deg` }] }]}>
          <View style={styles.timerCenter} />
        </View>
        <View style={styles.previewStack}>
          <View style={styles.previewLineStrong} />
          <View style={styles.previewLineShort} />
        </View>
      </View>
    );
  }

  if (['kanban', 'dashboard'].includes(type)) {
    return (
      <View style={styles.kanbanPreview}>
        {[0, 1, 2].map((column) => (
          <View key={column} style={styles.kanbanColumn}>
            <View style={styles.kanbanHeader} />
            <View style={[styles.kanbanItem, column === 1 && styles.kanbanItemActive]} />
            <View style={styles.kanbanItemSmall} />
          </View>
        ))}
      </View>
    );
  }

  if (['presence', 'message', 'post'].includes(type)) {
    return (
      <View style={styles.presencePreview}>
        {[0, 1, 2].map((item) => (
          <View key={item} style={styles.presenceRow}>
            <View style={[styles.avatar, item === 0 && styles.avatarActive]} />
            <View style={styles.presenceCopy}>
              <View style={styles.previewLineStrong} />
              <View style={styles.previewLineShort} />
            </View>
            <View style={item === 2 ? styles.messageDot : styles.onlineDot} />
          </View>
        ))}
      </View>
    );
  }

  if (['raid', 'coop', 'reward', 'stats', 'profile'].includes(type)) {
    return (
      <View style={styles.progressPreview}>
        <View style={styles.progressTop}>
          <View style={styles.previewPill} />
          <View style={styles.previewPillAlt} />
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: fill }]} />
        </View>
        <View style={styles.progressBars}>
          <View style={[styles.smallBar, { width: '68%' }]} />
          <View style={[styles.smallBar, styles.smallBarAlt, { width: '46%' }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.defaultPreview}>
      <View style={styles.previewTop}>
        <View style={styles.previewDot} />
        <View style={styles.previewLineStrong} />
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: fill }]} />
      </View>
    </View>
  );
}

function ServiceCard({ card, index, motion, t }) {
  const [labelKey, titleKey, descriptionKey, preview] = card;
  const side = index % 2 === 0 ? -1 : 1;
  const stagger = clamp(motion.enter * 1.18 - index * 0.1);

  return (
    <View
      style={[
        styles.serviceCard,
        shadows.card,
        index === 1 && styles.serviceCardMint,
        index === 2 && styles.serviceCardCream,
        {
          opacity: 0.28 + stagger * 0.72,
          transform: [
            { translateX: side * (1 - stagger) * 124 },
            { translateY: (1 - stagger) * 34 + (index === 1 ? -14 : index === 2 ? 14 : 0) },
            { scale: 0.9 + stagger * 0.1 },
            { rotate: `${side * (1 - stagger) * 4}deg` }
          ]
        }
      ]}
    >
      <Text style={styles.cardLabel}>{t(labelKey)}</Text>
      <Text numberOfLines={2} style={styles.cardTitle}>{t(titleKey)}</Text>
      <MiniPreview progress={Math.max(stagger, motion.focus)} type={preview} />
      <Text numberOfLines={3} style={styles.cardDescription}>{t(descriptionKey)}</Text>
    </View>
  );
}

function HeroBanner({ activeScene, activeIndex, onMove, onSelect, t }) {
  return (
    <View
      style={[
        styles.banner,
        activeScene.mood === 'blue' && styles.bannerBlue,
        activeScene.mood === 'cream' && styles.bannerCream
      ]}
    >
      <Pressable
        accessibilityLabel={t('landing.carousel.prev', '이전 소개 카드')}
        accessibilityRole="button"
        onPress={() => onMove(-1)}
        style={(state) => [styles.bannerArrow, styles.bannerArrowLeft, ...interactiveStateStyles(state)]}
      >
        <Text style={styles.bannerArrowText}>{'<'}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel={t('landing.carousel.next', '다음 소개 카드')}
        accessibilityRole="button"
        onPress={() => onMove(1)}
        style={(state) => [styles.bannerArrow, styles.bannerArrowRight, ...interactiveStateStyles(state)]}
      >
        <Text style={styles.bannerArrowText}>{'>'}</Text>
      </Pressable>
      <View style={styles.bannerCopy}>
        <Text style={styles.bannerLabel}>{t(activeScene.eyebrowKey)}</Text>
        <Text style={styles.bannerTitle}>{t(activeScene.titleKey)}</Text>
        <Text style={styles.bannerDescription}>{t(activeScene.descriptionKey)}</Text>
        <View style={styles.bannerMetric}>
          <View style={styles.bannerMetricDot} />
          <Text style={styles.bannerMetricText}>{t(activeScene.metricKey)}</Text>
        </View>
        <View style={styles.bannerDots}>
          {serviceScenes.map((scene, index) => (
            <Pressable
              accessibilityLabel={t('landing.carousel.dotLabel', '소개 카드 선택')}
              accessibilityRole="button"
              key={scene.id}
              onPress={() => onSelect(index)}
              style={[styles.bannerDot, index === activeIndex && styles.bannerDotActive]}
            />
          ))}
        </View>
      </View>
      <View style={styles.bannerVisual}>
        <View style={styles.visualBubbleLarge} />
        <View style={styles.visualBubbleSmall} />
        <View style={styles.visualPaper}>
          <View style={styles.visualHeader}>
            <View style={styles.visualIcon} />
            <View style={styles.visualTitleLines}>
              <View style={styles.visualLineStrong} />
              <View style={styles.visualLineShort} />
            </View>
          </View>
          <MiniPreview progress={0.86} type={activeScene.cards[0][3]} />
        </View>
      </View>
    </View>
  );
}

function ServiceScene({ scene, index, layout, onLayout, scrollY, t }) {
  const motion = calculateMotion(scrollY, layout);

  return (
    <View
      onLayout={(event) => onLayout(scene.id, event.nativeEvent?.layout)}
      style={[
        styles.scene,
        index % 2 === 1 && styles.sceneAlt
      ]}
    >
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={[
          styles.backgroundWord,
          {
            opacity: 0.06 + motion.focus * 0.26,
            transform: [
              { translateY: motion.distance * 74 },
              { translateX: motion.distance * -26 },
              { scale: 0.96 + motion.focus * 0.18 }
            ]
          }
        ]}
      >
        {scene.keyword}
      </Text>
      <View style={styles.sceneInner}>
        <View style={styles.sceneCopy}>
          <Text style={styles.sceneEyebrow}>{t(scene.eyebrowKey)}</Text>
          <Text style={styles.sceneTitle}>{t(scene.titleKey)}</Text>
          <Text style={styles.sceneDescription}>{t(scene.descriptionKey)}</Text>
          <View style={styles.sceneMetric}>
            <View style={styles.sceneMetricDot} />
            <Text style={styles.sceneMetricText}>{t(scene.metricKey)}</Text>
          </View>
        </View>
        <View style={styles.cardGrid}>
          {scene.cards.map((card, cardIndex) => (
            <ServiceCard card={card} index={cardIndex} key={`${scene.id}-${card[1]}`} motion={motion} t={t} />
          ))}
        </View>
      </View>
    </View>
  );
}

export default function ScrollStorySection({ scrollY }) {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [storyY, setStoryY] = useState(0);
  const [sceneLayouts, setSceneLayouts] = useState({});
  const activeScene = serviceScenes[activeIndex];

  const handleSceneLayout = (id, layout) => {
    if (!layout) {
      return;
    }

    setSceneLayouts((current) => ({
      ...current,
      [id]: layout
    }));
  };

  const moveSlide = (direction) => {
    setActiveIndex((current) => (current + direction + serviceScenes.length) % serviceScenes.length);
  };

  return (
    <View
      onLayout={(event) => {
        const nextLayout = event.nativeEvent?.layout;
        if (nextLayout) {
          setStoryY(nextLayout.y || 0);
        }
      }}
      style={styles.story}
    >
      <View style={styles.heading}>
        <Text style={styles.sectionEyebrow}>{t('landing.showcase.eyebrow', 'SCROLL STORY')}</Text>
        <Text style={styles.sectionTitle}>{t('landing.showcase.title', '스크롤로 만나는 실제 기능 흐름')}</Text>
        <Text style={styles.sectionDescription}>
          {t('landing.showcase.description', '소개페이지에서 현재 구현된 핵심 기능을 순서대로 확인할 수 있습니다.')}
        </Text>
      </View>

      <HeroBanner
        activeIndex={activeIndex}
        activeScene={activeScene}
        onMove={moveSlide}
        onSelect={setActiveIndex}
        t={t}
      />

      {serviceScenes.map((scene, index) => (
        <ServiceScene
          index={index}
          key={scene.id}
          layout={sceneLayouts[scene.id] ? { ...sceneLayouts[scene.id], y: storyY + sceneLayouts[scene.id].y } : undefined}
          onLayout={handleSceneLayout}
          scene={scene}
          scrollY={scrollY}
          t={t}
        />
      ))}
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
    marginBottom: 24,
    zIndex: 2
  },
  sectionEyebrow: {
    color: colors.mintDeep,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginBottom: 10
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 34,
    lineHeight: 43,
    fontWeight: '900',
    letterSpacing: 0
  },
  sectionDescription: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 25,
    marginTop: 10,
    maxWidth: 620
  },
  banner: {
    width: '100%',
    maxWidth: 1180,
    minHeight: 360,
    borderRadius: 34,
    backgroundColor: colors.mintSoft,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 34,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 26,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 2,
    marginBottom: 48
  },
  bannerBlue: {
    backgroundColor: colors.blueSoft
  },
  bannerCream: {
    backgroundColor: colors.cream
  },
  bannerCopy: {
    flex: 1,
    minWidth: 265,
    maxWidth: 560,
    zIndex: 3
  },
  bannerLabel: {
    color: colors.mintDeep,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 14
  },
  bannerTitle: {
    color: colors.ink,
    fontSize: 38,
    lineHeight: 48,
    fontWeight: '900',
    letterSpacing: 0
  },
  bannerDescription: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 27,
    marginTop: 14
  },
  bannerMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20
  },
  bannerMetricDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.mint
  },
  bannerMetricText: {
    color: colors.blueDeep,
    fontSize: 14,
    fontWeight: '900'
  },
  bannerDots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18
  },
  bannerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line
  },
  bannerDotActive: {
    width: 30,
    backgroundColor: colors.mint,
    borderColor: colors.mint
  },
  bannerVisual: {
    flex: 1,
    minWidth: 260,
    minHeight: 275,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 2
  },
  visualPaper: {
    width: '86%',
    maxWidth: 350,
    minHeight: 250,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 22,
    gap: 20,
    justifyContent: 'space-between',
    zIndex: 3,
    transform: [{ rotate: '-3deg' }]
  },
  visualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  visualIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: colors.mintSoft,
    borderWidth: 11,
    borderColor: colors.mint
  },
  visualTitleLines: {
    flex: 1,
    gap: 8
  },
  visualLineStrong: {
    height: 13,
    borderRadius: 999,
    backgroundColor: colors.blueSoft
  },
  visualLineShort: {
    width: '62%',
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.mintSoft
  },
  visualBubbleLarge: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: colors.surface,
    opacity: 0.54
  },
  visualBubbleSmall: {
    position: 'absolute',
    right: 22,
    bottom: 22,
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.creamStrong,
    opacity: 0.62
  },
  bannerArrow: {
    position: 'absolute',
    top: '48%',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 8
  },
  bannerArrowLeft: {
    left: 16
  },
  bannerArrowRight: {
    right: 16
  },
  bannerArrowText: {
    color: colors.blueDeep,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900'
  },
  scene: {
    width: '100%',
    maxWidth: 1180,
    minHeight: 650,
    borderRadius: 34,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    paddingVertical: 70,
    marginBottom: 26,
    backgroundColor: colors.surfaceWarm
  },
  sceneAlt: {
    backgroundColor: colors.background
  },
  backgroundWord: {
    position: 'absolute',
    left: -16,
    right: -16,
    top: 58,
    color: colors.blueDeep,
    fontSize: 156,
    lineHeight: 176,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
    zIndex: 0
  },
  sceneInner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 26,
    paddingHorizontal: 28,
    zIndex: 2
  },
  sceneCopy: {
    flex: 0.9,
    minWidth: 270,
    maxWidth: 390,
    backgroundColor: 'rgba(255, 253, 246, 0.78)',
    borderRadius: 24,
    padding: 22
  },
  sceneEyebrow: {
    alignSelf: 'flex-start',
    color: colors.mintDeep,
    backgroundColor: colors.mintSoft,
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 16
  },
  sceneTitle: {
    color: colors.ink,
    fontSize: 31,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: 0
  },
  sceneDescription: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 26,
    marginTop: 14
  },
  sceneMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20
  },
  sceneMetricDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.mint
  },
  sceneMetricText: {
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '900'
  },
  cardGrid: {
    flex: 1.2,
    minWidth: 300,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center'
  },
  serviceCard: {
    flexGrow: 1,
    flexBasis: 218,
    minWidth: 210,
    maxWidth: 300,
    minHeight: 242,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 20,
    gap: 13,
    justifyContent: 'space-between',
    transitionDuration: '180ms',
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: 'ease-out'
  },
  serviceCardMint: {
    backgroundColor: colors.mintSoft
  },
  serviceCardCream: {
    backgroundColor: colors.cream
  },
  cardLabel: {
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
  cardTitle: {
    color: colors.ink,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '900',
    letterSpacing: 0
  },
  cardDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700'
  },
  defaultPreview: {
    gap: 12
  },
  previewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  previewDot: {
    width: 34,
    height: 34,
    borderRadius: 13,
    backgroundColor: colors.mintSoft,
    borderWidth: 8,
    borderColor: colors.mint
  },
  previewLineStrong: {
    flex: 1,
    height: 13,
    borderRadius: 999,
    backgroundColor: colors.blueSoft
  },
  previewLineShort: {
    width: '58%',
    height: 9,
    borderRadius: 999,
    backgroundColor: colors.mintSoft
  },
  timerPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  timerRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 10,
    borderColor: colors.mint,
    borderRightColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  timerCenter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface
  },
  previewStack: {
    flex: 1,
    gap: 10
  },
  kanbanPreview: {
    flexDirection: 'row',
    gap: 7
  },
  kanbanColumn: {
    flex: 1,
    minHeight: 88,
    borderRadius: 14,
    padding: 7,
    gap: 7,
    backgroundColor: colors.blueSoft
  },
  kanbanHeader: {
    height: 9,
    borderRadius: 999,
    backgroundColor: colors.blue
  },
  kanbanItem: {
    height: 22,
    borderRadius: 10,
    backgroundColor: colors.surface
  },
  kanbanItemActive: {
    backgroundColor: colors.mintSoft
  },
  kanbanItemSmall: {
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.surface
  },
  presencePreview: {
    gap: 8
  },
  presenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.blueSoft
  },
  avatarActive: {
    backgroundColor: colors.mint
  },
  presenceCopy: {
    flex: 1,
    gap: 6
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
  progressTop: {
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
  progressBars: {
    gap: 7
  },
  smallBar: {
    height: 9,
    borderRadius: 999,
    backgroundColor: colors.blueSoft
  },
  smallBarAlt: {
    backgroundColor: colors.mintSoft
  }
});
