import { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../i18n';
import { colors, shadows } from '../styles/theme';

const STORY_VIEWPORT_HEIGHT = 720;
const STORY_SCROLL_SPAN = 430;

const storyScenes = [
  {
    id: 'ask',
    keyword: 'ASK',
    eyebrowKey: 'landing.showcase.ask.eyebrow',
    titleKey: 'landing.showcase.ask.title',
    descriptionKey: 'landing.showcase.ask.description',
    metricKey: 'landing.showcase.ask.metric',
    cards: [
      {
        labelKey: 'landing.carousel.ask.primary',
        titleKey: 'landing.feature.ai.title',
        lines: ['landing.carousel.ask.item1', 'landing.carousel.ask.item2'],
        variant: 'chat'
      },
      {
        labelKey: 'landing.carousel.ask.secondary',
        titleKey: 'landing.feature.ai.description',
        lines: ['landing.carousel.ask.item3'],
        variant: 'analysis'
      },
      {
        labelKey: 'landing.feature.ai.label',
        titleKey: 'landing.showcase.ask.metric',
        lines: ['landing.showcase.ask.description'],
        variant: 'summary'
      }
    ]
  },
  {
    id: 'plan',
    keyword: 'PLAN',
    eyebrowKey: 'landing.showcase.plan.eyebrow',
    titleKey: 'landing.showcase.plan.title',
    descriptionKey: 'landing.showcase.plan.description',
    metricKey: 'landing.showcase.plan.metric',
    cards: [
      {
        labelKey: 'landing.feature.plan.label',
        titleKey: 'landing.carousel.start.item1',
        lines: ['landing.carousel.start.item2', 'landing.carousel.start.item3'],
        variant: 'checklist'
      },
      {
        labelKey: 'landing.carousel.start.secondary',
        titleKey: 'landing.feature.plan.title',
        lines: ['landing.feature.plan.description'],
        variant: 'kanban'
      },
      {
        labelKey: 'landing.showcase.plan.eyebrow',
        titleKey: 'landing.showcase.plan.metric',
        lines: ['landing.showcase.plan.description'],
        variant: 'timeline'
      }
    ]
  },
  {
    id: 'focus',
    keyword: 'FOCUS',
    eyebrowKey: 'landing.showcase.focus.eyebrow',
    titleKey: 'landing.showcase.focus.title',
    descriptionKey: 'landing.showcase.focus.description',
    metricKey: 'landing.showcase.focus.metric',
    cards: [
      {
        labelKey: 'landing.carousel.focus.primary',
        titleKey: 'landing.carousel.focus.item1',
        lines: ['landing.feature.focus.description'],
        variant: 'timer'
      },
      {
        labelKey: 'landing.carousel.focus.secondary',
        titleKey: 'landing.carousel.focus.item2',
        lines: ['landing.carousel.focus.item3'],
        variant: 'heatmap'
      },
      {
        labelKey: 'landing.feature.focus.label',
        titleKey: 'landing.showcase.focus.metric',
        lines: ['landing.showcase.focus.description'],
        variant: 'summary'
      }
    ]
  },
  {
    id: 'share',
    keyword: 'SHARE',
    eyebrowKey: 'landing.showcase.social.eyebrow',
    titleKey: 'landing.showcase.social.title',
    descriptionKey: 'landing.showcase.social.description',
    metricKey: 'landing.showcase.social.metric',
    cards: [
      {
        labelKey: 'landing.feature.community.label',
        titleKey: 'landing.showcase.community.title',
        lines: ['landing.showcase.community.description'],
        variant: 'post'
      },
      {
        labelKey: 'landing.feature.social.label',
        titleKey: 'landing.carousel.together.item2',
        lines: ['landing.carousel.together.item1', 'landing.carousel.together.item3'],
        variant: 'presence'
      },
      {
        labelKey: 'landing.showcase.community.eyebrow',
        titleKey: 'landing.showcase.community.metric',
        lines: ['landing.showcase.social.metric'],
        variant: 'message'
      }
    ]
  },
  {
    id: 'quest',
    keyword: 'QUEST',
    eyebrowKey: 'landing.showcase.challenge.eyebrow',
    titleKey: 'landing.showcase.challenge.title',
    descriptionKey: 'landing.showcase.challenge.description',
    metricKey: 'landing.showcase.challenge.metric',
    cards: [
      {
        labelKey: 'landing.feature.raid.label',
        titleKey: 'landing.feature.raid.title',
        lines: ['landing.carousel.challenge.item1', 'landing.carousel.challenge.item3'],
        variant: 'raid'
      },
      {
        labelKey: 'landing.feature.coop.label',
        titleKey: 'landing.feature.coop.title',
        lines: ['landing.carousel.challenge.item2', 'landing.feature.coop.description'],
        variant: 'contribution'
      },
      {
        labelKey: 'landing.carousel.challenge.secondary',
        titleKey: 'landing.showcase.challenge.metric',
        lines: ['landing.showcase.challenge.description'],
        variant: 'reward'
      }
    ]
  },
  {
    id: 'care',
    keyword: 'CARE',
    eyebrowKey: 'landing.showcase.access.eyebrow',
    titleKey: 'landing.showcase.access.title',
    descriptionKey: 'landing.showcase.access.description',
    metricKey: 'landing.showcase.access.metric',
    cards: [
      {
        labelKey: 'landing.feature.reward.label',
        titleKey: 'landing.showcase.reward.title',
        lines: ['landing.showcase.reward.description'],
        variant: 'profile'
      },
      {
        labelKey: 'landing.feature.accessibility.label',
        titleKey: 'landing.feature.accessibility.title',
        lines: ['landing.feature.accessibility.description'],
        variant: 'accessibility'
      },
      {
        labelKey: 'landing.showcase.access.eyebrow',
        titleKey: 'landing.showcase.access.metric',
        lines: ['landing.showcase.access.description'],
        variant: 'settings'
      }
    ]
  }
];

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function getStoryProgress(scrollY, layout) {
  if (!layout.height) {
    return 0;
  }

  const startY = Math.max(layout.y - 72, 0);
  const scrollableDistance = Math.max(layout.height - STORY_VIEWPORT_HEIGHT, 1);
  return clamp((scrollY - startY) / scrollableDistance);
}

function getSceneDistance(index, sceneFloat) {
  return index - sceneFloat;
}

function MiniUIPreview({ variant, progress }) {
  const fillWidth = `${Math.round(42 + progress * 45)}%`;

  if (variant === 'timer') {
    return (
      <View style={styles.timerPreview}>
        <View style={[styles.timerRing, { transform: [{ rotate: `${-18 + progress * 34}deg` }] }]}>
          <View style={styles.timerCenter} />
        </View>
        <View style={styles.previewStack}>
          <View style={styles.previewLineStrong} />
          <View style={styles.previewLineShort} />
        </View>
      </View>
    );
  }

  if (variant === 'kanban') {
    return (
      <View style={styles.kanbanPreview}>
        {[0, 1, 2].map((column) => (
          <View key={column} style={styles.kanbanColumn}>
            <View style={styles.kanbanHeader} />
            <View style={[styles.kanbanItem, column === 1 && styles.kanbanItemAlt]} />
            <View style={styles.kanbanItemSmall} />
          </View>
        ))}
      </View>
    );
  }

  if (variant === 'heatmap') {
    return (
      <View style={styles.heatmapPreview}>
        {Array.from({ length: 18 }, (_, index) => (
          <View key={index} style={[styles.heatmapCell, index % 4 === 0 && styles.heatmapCellActive]} />
        ))}
      </View>
    );
  }

  if (variant === 'presence') {
    return (
      <View style={styles.presencePreview}>
        {[0, 1, 2].map((item) => (
          <View key={item} style={styles.presenceRow}>
            <View style={[styles.avatar, item === 0 && styles.avatarActive]} />
            <View style={styles.presenceCopy}>
              <View style={styles.previewLineStrong} />
              <View style={styles.previewLineShort} />
            </View>
            <View style={styles.onlineDot} />
          </View>
        ))}
      </View>
    );
  }

  if (variant === 'raid' || variant === 'contribution' || variant === 'reward') {
    return (
      <View style={styles.progressPreview}>
        <View style={styles.progressHeader}>
          <View style={styles.previewPill} />
          <View style={styles.previewPillAlt} />
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: fillWidth }]} />
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
        <View style={[styles.progressFill, { width: fillWidth }]} />
      </View>
      <View style={styles.previewChipRow}>
        <View style={styles.previewChip} />
        <View style={styles.previewChipAlt} />
      </View>
    </View>
  );
}

function FloatingStoryCard({ card, index, localProgress, t }) {
  const cardProgress = clamp(localProgress * 1.45 + 0.54 - index * 0.16);
  const side = index % 2 === 0 ? -1 : 1;
  const depth = index === 1 ? 1 : 0;
  const motionStyle = {
    opacity: 0.42 + cardProgress * 0.58,
    transform: [
      { translateX: side * (1 - cardProgress) * (index === 2 ? 72 : 46) },
      { translateY: (1 - cardProgress) * (index === 1 ? -34 : 38) + index * 10 },
      { scale: 0.9 + cardProgress * 0.1 - depth * 0.02 },
      { rotate: `${side * (1 - cardProgress) * 4 + (index - 1) * 1.2}deg` }
    ]
  };

  return (
    <View style={[styles.storyCard, shadows.card, index === 1 && styles.storyCardRaised, motionStyle]}>
      <Text style={styles.storyCardLabel}>{t(card.labelKey)}</Text>
      <Text numberOfLines={2} style={styles.storyCardTitle}>{t(card.titleKey)}</Text>
      <MiniUIPreview progress={cardProgress} variant={card.variant} />
      <View style={styles.storyCardLines}>
        {card.lines.map((lineKey) => (
          <View key={lineKey} style={styles.storyCardLine}>
            <View style={styles.storyCardBullet} />
            <Text numberOfLines={2} style={styles.storyCardLineText}>{t(lineKey)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ScrollStorySection({ scrollY }) {
  const { t } = useLanguage();
  const [layout, setLayout] = useState({ y: 0, height: STORY_VIEWPORT_HEIGHT });
  const progress = getStoryProgress(scrollY, layout);
  const sceneFloat = progress * (storyScenes.length - 1);
  const activeIndex = Math.min(storyScenes.length - 1, Math.floor(sceneFloat + 0.0001));
  const activeScene = storyScenes[activeIndex];
  const localProgress = clamp(sceneFloat - activeIndex);
  const progressPercent = `${Math.max(8, Math.round(progress * 100))}%`;

  const storyHeight = useMemo(() => STORY_VIEWPORT_HEIGHT + STORY_SCROLL_SPAN * (storyScenes.length - 1), []);

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
        <View style={styles.storyHeading}>
          <Text style={styles.storyEyebrow}>{t('landing.showcase.eyebrow', 'SCROLL STORY')}</Text>
          <Text style={styles.storyTitle}>{t('landing.showcase.title', '스크롤로 만나는 실제 기능 흐름')}</Text>
          <Text style={styles.storyDescription}>
            {t('landing.showcase.description', '소개페이지에서 현재 구현된 핵심 기능을 순서대로 확인할 수 있습니다.')}
          </Text>
        </View>

        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.backgroundLayer}>
          {storyScenes.map((scene, index) => {
            const distance = getSceneDistance(index, sceneFloat);
            const wordOpacity = clamp(0.2 - Math.abs(distance) * 0.11, 0, 0.2);

            return (
              <Text
                key={scene.id}
                style={[
                  styles.backgroundWord,
                  {
                    opacity: wordOpacity,
                    transform: [
                      { translateY: distance * 72 },
                      { translateX: distance * -18 },
                      { scale: 1.12 - Math.min(Math.abs(distance), 1) * 0.12 }
                    ]
                  }
                ]}
              >
                {scene.keyword}
              </Text>
            );
          })}
        </View>

        <View style={styles.storyContent}>
          <View style={styles.sceneCopy}>
            <Text style={styles.sceneEyebrow}>{t(activeScene.eyebrowKey)}</Text>
            <Text style={styles.sceneTitle}>{t(activeScene.titleKey)}</Text>
            <Text style={styles.sceneDescription}>{t(activeScene.descriptionKey)}</Text>
            <View style={styles.sceneMetric}>
              <View style={styles.sceneMetricDot} />
              <Text style={styles.sceneMetricText}>{t(activeScene.metricKey)}</Text>
            </View>
            <View style={styles.sceneProgressTrack}>
              <View style={[styles.sceneProgressFill, { width: progressPercent }]} />
            </View>
          </View>

          <View style={styles.cardStage}>
            {activeScene.cards.map((card, index) => (
              <FloatingStoryCard card={card} index={index} key={`${activeScene.id}-${card.titleKey}`} localProgress={localProgress} t={t} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  story: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 72,
    backgroundColor: colors.surfaceWarm,
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
    paddingVertical: 48
  },
  storyHeading: {
    width: '100%',
    maxWidth: 1180,
    marginBottom: 24,
    zIndex: 2
  },
  storyEyebrow: {
    color: colors.mintDeep,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginBottom: 10
  },
  storyTitle: {
    color: colors.ink,
    fontSize: 32,
    lineHeight: 41,
    fontWeight: '900',
    letterSpacing: 0
  },
  storyDescription: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 25,
    marginTop: 10,
    maxWidth: 560
  },
  backgroundLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },
  backgroundWord: {
    position: 'absolute',
    color: colors.blue,
    fontSize: 154,
    lineHeight: 170,
    fontWeight: '900',
    letterSpacing: 0
  },
  storyContent: {
    width: '100%',
    maxWidth: 1180,
    minHeight: 430,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 28,
    zIndex: 2
  },
  sceneCopy: {
    flex: 1,
    minWidth: 270,
    maxWidth: 470
  },
  sceneEyebrow: {
    alignSelf: 'flex-start',
    color: colors.blue,
    backgroundColor: colors.blueSoft,
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
    fontSize: 36,
    lineHeight: 46,
    fontWeight: '900',
    letterSpacing: 0
  },
  sceneDescription: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 28,
    marginTop: 16
  },
  sceneMetric: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  sceneMetricDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.mint
  },
  sceneMetricText: {
    color: colors.blueDeep,
    fontSize: 14,
    fontWeight: '900'
  },
  sceneProgressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.cream,
    overflow: 'hidden',
    marginTop: 22
  },
  sceneProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.mint
  },
  cardStage: {
    flex: 1.15,
    minWidth: 300,
    minHeight: 420,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16
  },
  storyCard: {
    width: 244,
    minHeight: 244,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 18,
    gap: 12,
    justifyContent: 'space-between',
    transitionDuration: '180ms',
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: 'ease-out'
  },
  storyCardRaised: {
    marginTop: -28,
    backgroundColor: colors.cream
  },
  storyCardLabel: {
    alignSelf: 'flex-start',
    color: colors.mintDeep,
    backgroundColor: colors.mintSoft,
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    fontWeight: '900'
  },
  storyCardTitle: {
    color: colors.ink,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900'
  },
  storyCardLines: {
    gap: 7
  },
  storyCardLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8
  },
  storyCardBullet: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.mint,
    marginTop: 6
  },
  storyCardLineText: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
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
  kanbanItemAlt: {
    backgroundColor: colors.mintSoft
  },
  kanbanItemSmall: {
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.surface
  },
  heatmapPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5
  },
  heatmapCell: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: colors.blueSoft
  },
  heatmapCellActive: {
    backgroundColor: colors.mint
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
  progressPreview: {
    gap: 12
  },
  progressHeader: {
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
