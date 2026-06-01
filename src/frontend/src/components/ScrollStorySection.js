import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../i18n';
import { colors, interactiveStateStyles, shadows } from '../styles/theme';

const STORY_VIEWPORT_HEIGHT = 760;
const STORY_SCROLL_SPAN = 520;

const storySlides = [
  {
    id: 'learn',
    keyword: 'LEARN',
    eyebrowKey: 'landing.showcase.learn.eyebrow',
    titleKey: 'landing.showcase.learn.title',
    descriptionKey: 'landing.showcase.learn.description',
    metricKey: 'landing.showcase.learn.metric',
    mood: 'mint',
    cards: [
      {
        labelKey: 'landing.feature.ai.label',
        titleKey: 'landing.feature.ai.title',
        descriptionKey: 'landing.feature.ai.description',
        preview: 'chat'
      },
      {
        labelKey: 'landing.feature.focus.label',
        titleKey: 'landing.feature.focus.title',
        descriptionKey: 'landing.feature.focus.description',
        preview: 'timer'
      },
      {
        labelKey: 'landing.carousel.ask.secondary',
        titleKey: 'landing.carousel.ask.item3',
        descriptionKey: 'landing.carousel.ask.description',
        preview: 'quiz'
      }
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
      {
        labelKey: 'landing.feature.plan.label',
        titleKey: 'landing.feature.plan.title',
        descriptionKey: 'landing.feature.plan.description',
        preview: 'kanban'
      },
      {
        labelKey: 'landing.carousel.start.primary',
        titleKey: 'landing.carousel.start.item1',
        descriptionKey: 'landing.carousel.start.description',
        preview: 'dashboard'
      },
      {
        labelKey: 'landing.carousel.focus.secondary',
        titleKey: 'landing.showcase.record.title',
        descriptionKey: 'landing.showcase.record.description',
        preview: 'stats'
      }
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
      {
        labelKey: 'landing.feature.community.label',
        titleKey: 'landing.feature.community.title',
        descriptionKey: 'landing.feature.community.description',
        preview: 'post'
      },
      {
        labelKey: 'landing.feature.social.label',
        titleKey: 'landing.feature.social.title',
        descriptionKey: 'landing.feature.social.description',
        preview: 'presence'
      },
      {
        labelKey: 'landing.carousel.together.primary',
        titleKey: 'landing.carousel.together.item2',
        descriptionKey: 'landing.carousel.together.description',
        preview: 'message'
      }
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
      {
        labelKey: 'landing.feature.raid.label',
        titleKey: 'landing.feature.raid.title',
        descriptionKey: 'landing.feature.raid.description',
        preview: 'raid'
      },
      {
        labelKey: 'landing.feature.coop.label',
        titleKey: 'landing.feature.coop.title',
        descriptionKey: 'landing.feature.coop.description',
        preview: 'coop'
      },
      {
        labelKey: 'landing.feature.reward.label',
        titleKey: 'landing.feature.reward.title',
        descriptionKey: 'landing.feature.reward.description',
        preview: 'reward'
      }
    ]
  },
  {
    id: 'operate',
    keyword: 'CARE',
    eyebrowKey: 'landing.showcase.operate.eyebrow',
    titleKey: 'landing.showcase.operate.title',
    descriptionKey: 'landing.showcase.operate.description',
    metricKey: 'landing.showcase.operate.metric',
    mood: 'cream',
    cards: [
      {
        labelKey: 'landing.feature.accessibility.label',
        titleKey: 'landing.feature.accessibility.title',
        descriptionKey: 'landing.feature.accessibility.description',
        preview: 'accessibility'
      },
      {
        labelKey: 'landing.feature.admin.label',
        titleKey: 'landing.feature.admin.title',
        descriptionKey: 'landing.feature.admin.description',
        preview: 'admin'
      },
      {
        labelKey: 'landing.showcase.reward.eyebrow',
        titleKey: 'landing.showcase.reward.title',
        descriptionKey: 'landing.showcase.reward.description',
        preview: 'profile'
      }
    ]
  }
];

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function getStoryProgress(scrollY, layout, storyHeight) {
  if (!layout.height) {
    return 0;
  }

  const startY = Math.max(layout.y - 72, 0);
  const scrollableDistance = Math.max(storyHeight - STORY_VIEWPORT_HEIGHT, 1);
  return clamp((scrollY - startY) / scrollableDistance);
}

function getSceneState(index, sceneFloat) {
  const distance = index - sceneFloat;
  const focus = clamp(1 - Math.abs(distance), 0, 1);
  const direction = distance >= 0 ? 1 : -1;

  return { distance, focus, direction };
}

function MiniPreview({ type, focus }) {
  const fill = `${Math.round(34 + focus * 58)}%`;

  if (type === 'timer') {
    return (
      <View style={styles.timerPreview}>
        <View style={[styles.timerRing, { transform: [{ rotate: `${-28 + focus * 58}deg` }] }]}>
          <View style={styles.timerCenter} />
        </View>
        <View style={styles.previewStack}>
          <View style={styles.previewLineStrong} />
          <View style={styles.previewLineShort} />
        </View>
      </View>
    );
  }

  if (type === 'kanban' || type === 'dashboard') {
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

  if (type === 'presence' || type === 'message' || type === 'post') {
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

  if (type === 'raid' || type === 'coop' || type === 'reward' || type === 'stats') {
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
      <View style={styles.previewChipRow}>
        <View style={styles.previewChip} />
        <View style={styles.previewChipAlt} />
      </View>
    </View>
  );
}

function StoryCard({ card, index, focus, t }) {
  const side = index % 2 === 0 ? -1 : 1;
  const cardFocus = clamp(focus * 1.08 - index * 0.04);
  const depthOffset = index === 1 ? -18 : index === 2 ? 16 : 0;

  return (
    <View
      style={[
        styles.storyCard,
        shadows.card,
        index === 1 && styles.storyCardMint,
        index === 2 && styles.storyCardCream,
        {
          opacity: 0.34 + cardFocus * 0.66,
          transform: [
            { translateX: side * (1 - cardFocus) * (index === 1 ? 34 : 74) },
            { translateY: (1 - cardFocus) * 42 + depthOffset },
            { scale: 0.9 + cardFocus * 0.1 },
            { rotate: `${side * (1 - cardFocus) * 4}deg` }
          ]
        }
      ]}
    >
      <Text style={styles.storyCardLabel}>{t(card.labelKey)}</Text>
      <Text numberOfLines={2} style={styles.storyCardTitle}>{t(card.titleKey)}</Text>
      <MiniPreview focus={cardFocus} type={card.preview} />
      <Text numberOfLines={3} style={styles.storyCardDescription}>{t(card.descriptionKey)}</Text>
    </View>
  );
}

export default function ScrollStorySection({ scrollY }) {
  const { t } = useLanguage();
  const [layout, setLayout] = useState({ y: 0, height: STORY_VIEWPORT_HEIGHT });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const storyHeight = useMemo(() => STORY_VIEWPORT_HEIGHT + STORY_SCROLL_SPAN * (storySlides.length - 1), []);
  const progress = getStoryProgress(scrollY, layout, storyHeight);
  const sceneFloat = progress * (storySlides.length - 1);
  const scrollIndex = Math.min(storySlides.length - 1, Math.max(0, Math.round(sceneFloat)));
  const activeScene = storySlides[selectedIndex];
  const activeState = getSceneState(selectedIndex, sceneFloat);
  const progressPercent = `${Math.max(8, Math.round(progress * 100))}%`;

  useEffect(() => {
    setSelectedIndex(scrollIndex);
  }, [scrollIndex]);

  const moveSlide = (direction) => {
    setSelectedIndex((current) => (current + direction + storySlides.length) % storySlides.length);
  };

  return (
    <View
      onLayout={(event) => {
        const nextLayout = event.nativeEvent?.layout;
        if (nextLayout) {
          setLayout({ y: nextLayout.y || 0, height: nextLayout.height || storyHeight });
        }
      }}
      style={[styles.story, { minHeight: storyHeight }]}
    >
      <View style={styles.storySticky}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.backgroundLayer}>
          {storySlides.map((scene, index) => {
            const { distance, focus } = getSceneState(index, sceneFloat);

            return (
              <Text
                key={scene.id}
                style={[
                  styles.backgroundWord,
                  {
                    opacity: 0.06 + focus * 0.24,
                    transform: [
                      { translateX: distance * -30 },
                      { translateY: distance * 82 },
                      { scale: 1.02 + focus * 0.18 }
                    ]
                  }
                ]}
              >
                {scene.keyword}
              </Text>
            );
          })}
        </View>

        <View style={styles.heading}>
          <Text style={styles.sectionEyebrow}>{t('landing.showcase.eyebrow', 'SCROLL STORY')}</Text>
          <Text style={styles.sectionTitle}>{t('landing.showcase.title', '스크롤로 만나는 실제 기능 흐름')}</Text>
          <Text style={styles.sectionDescription}>
            {t('landing.showcase.description', '소개페이지에서 현재 구현된 핵심 기능을 순서대로 확인할 수 있습니다.')}
          </Text>
        </View>

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
            onPress={() => moveSlide(-1)}
            style={(state) => [styles.bannerArrow, styles.bannerArrowLeft, ...interactiveStateStyles(state)]}
          >
            <Text style={styles.bannerArrowText}>{'<'}</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={t('landing.carousel.next', '다음 소개 카드')}
            accessibilityRole="button"
            onPress={() => moveSlide(1)}
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
            <View style={styles.bannerProgressTrack}>
              <View style={[styles.bannerProgressFill, { width: progressPercent }]} />
            </View>
            <View style={styles.bannerDots}>
              {storySlides.map((scene, index) => (
                <Pressable
                  accessibilityLabel={t('landing.carousel.dotLabel', '소개 카드 선택')}
                  accessibilityRole="button"
                  key={scene.id}
                  onPress={() => setSelectedIndex(index)}
                  style={[styles.bannerDot, index === selectedIndex && styles.bannerDotActive]}
                />
              ))}
            </View>
          </View>

          <View style={styles.bannerVisual}>
            <View style={styles.visualPaper}>
              <View style={styles.visualHeader}>
                <View style={styles.visualIcon} />
                <View style={styles.visualTitleLines}>
                  <View style={styles.visualLineStrong} />
                  <View style={styles.visualLineShort} />
                </View>
              </View>
              <MiniPreview focus={Math.max(activeState.focus, 0.5)} type={activeScene.cards[0].preview} />
            </View>
            <View style={styles.visualBubbleLarge} />
            <View style={styles.visualBubbleSmall} />
          </View>
        </View>

        <View style={styles.cardGrid}>
          {activeScene.cards.map((card, index) => (
            <StoryCard card={card} focus={activeState.focus} index={index} key={`${activeScene.id}-${card.titleKey}`} t={t} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  story: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 48,
    backgroundColor: colors.background,
    overflow: 'hidden'
  },
  storySticky: {
    width: '100%',
    minHeight: STORY_VIEWPORT_HEIGHT,
    position: Platform.OS === 'web' ? 'sticky' : 'relative',
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 54
  },
  backgroundLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  backgroundWord: {
    position: 'absolute',
    color: colors.blueDeep,
    fontSize: 156,
    lineHeight: 176,
    fontWeight: '900',
    letterSpacing: 0
  },
  heading: {
    width: '100%',
    maxWidth: 1180,
    marginBottom: 22,
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
    zIndex: 2
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
  bannerProgressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    marginTop: 22
  },
  bannerProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.mint
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
  cardGrid: {
    width: '100%',
    maxWidth: 1180,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    marginTop: 18,
    zIndex: 2
  },
  storyCard: {
    flexGrow: 1,
    flexBasis: 265,
    minWidth: 240,
    maxWidth: 370,
    minHeight: 250,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 22,
    gap: 14,
    justifyContent: 'space-between',
    transitionDuration: '180ms',
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: 'ease-out'
  },
  storyCardMint: {
    backgroundColor: colors.mintSoft
  },
  storyCardCream: {
    backgroundColor: colors.cream
  },
  storyCardLabel: {
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
  storyCardTitle: {
    color: colors.ink,
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '900',
    letterSpacing: 0
  },
  storyCardDescription: {
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
  previewChipRow: {
    flexDirection: 'row',
    gap: 8
  },
  previewChip: {
    width: 76,
    height: 24,
    borderRadius: 999,
    backgroundColor: colors.mintSoft
  },
  previewChipAlt: {
    width: 102,
    height: 24,
    borderRadius: 999,
    backgroundColor: colors.blueSoft
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
