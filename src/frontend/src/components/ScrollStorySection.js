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
    ctaKey: 'landing.showcase.learn.metric',
    mood: 'mint'
  },
  {
    id: 'organize',
    labelKey: 'landing.showcase.organize.eyebrow',
    titleKey: 'landing.showcase.organize.title',
    descriptionKey: 'landing.showcase.organize.description',
    ctaKey: 'landing.showcase.organize.metric',
    mood: 'cream'
  },
  {
    id: 'connect',
    labelKey: 'landing.showcase.connect.eyebrow',
    titleKey: 'landing.showcase.connect.title',
    descriptionKey: 'landing.showcase.connect.description',
    ctaKey: 'landing.showcase.connect.metric',
    mood: 'blue'
  },
  {
    id: 'challenge',
    labelKey: 'landing.showcase.challenge.eyebrow',
    titleKey: 'landing.showcase.challenge.title',
    descriptionKey: 'landing.showcase.challenge.description',
    ctaKey: 'landing.showcase.challenge.metric',
    mood: 'blue'
  }
];

const availableFeatureKeys = [
  ['landing.feature.ai.label', 'landing.feature.ai.title', 'landing.feature.ai.description'],
  ['landing.feature.plan.label', 'landing.feature.plan.title', 'landing.feature.plan.description'],
  ['landing.feature.focus.label', 'landing.feature.focus.title', 'landing.feature.focus.description'],
  ['landing.feature.community.label', 'landing.feature.community.title', 'landing.feature.community.description'],
  ['landing.feature.social.label', 'landing.feature.social.title', 'landing.feature.social.description'],
  ['landing.feature.reward.label', 'landing.feature.reward.title', 'landing.feature.reward.description'],
  ['landing.feature.coop.label', 'landing.feature.coop.title', 'landing.feature.coop.description'],
  ['landing.feature.accessibility.label', 'landing.feature.accessibility.title', 'landing.feature.accessibility.description']
];

const serviceSections = [
  {
    id: 'plan',
    keywordKey: 'landing.showcase.plan.keyword',
    titleKey: 'landing.showcase.plan.title',
    descriptionKey: 'landing.showcase.plan.description',
    chipKey: 'landing.feature.plan.label',
    layout: 'row',
    visual: 'plan'
  },
  {
    id: 'question',
    keywordKey: 'landing.showcase.ask.keyword',
    titleKey: 'landing.showcase.ask.title',
    descriptionKey: 'landing.showcase.ask.description',
    chipKey: 'landing.feature.ai.label',
    layout: 'center',
    visual: 'chat'
  },
  {
    id: 'summary',
    keywordKey: 'landing.showcase.learn.keyword',
    titleKey: 'landing.feature.ai.title',
    descriptionKey: 'landing.feature.ai.description',
    chipKey: 'landing.showcase.ask.metric',
    layout: 'reverse',
    visual: 'note'
  },
  {
    id: 'report',
    keywordKey: 'landing.showcase.ask.keyword',
    titleKey: 'landing.showcase.ask.title',
    descriptionKey: 'landing.showcase.ask.description',
    chipKey: 'landing.feature.ai.label',
    layout: 'row',
    visual: 'report'
  },
  {
    id: 'social',
    keywordKey: 'landing.showcase.social.keyword',
    titleKey: 'landing.showcase.social.title',
    descriptionKey: 'landing.showcase.social.description',
    chipKey: 'landing.feature.social.label',
    layout: 'row',
    visual: 'social'
  },
  {
    id: 'coop',
    keywordKey: 'landing.showcase.challenge.keyword',
    titleKey: 'landing.showcase.challenge.title',
    descriptionKey: 'landing.showcase.challenge.description',
    chipKey: 'landing.feature.coop.label',
    layout: 'reverse',
    visual: 'coop'
  },
  {
    id: 'reward',
    keywordKey: 'landing.showcase.reward.keyword',
    titleKey: 'landing.showcase.reward.title',
    descriptionKey: 'landing.showcase.reward.description',
    chipKey: 'landing.feature.reward.label',
    layout: 'row',
    visual: 'reward'
  },
  {
    id: 'access',
    keywordKey: 'landing.showcase.access.keyword',
    titleKey: 'landing.showcase.access.title',
    descriptionKey: 'landing.showcase.access.description',
    chipKey: 'landing.feature.accessibility.label',
    layout: 'reverse',
    visual: 'access'
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
    return { enter: 1, focus: 0, distance: 0 };
  }

  const enter = smoothStep((scrollY + VIEWPORT_HEIGHT * 0.82 - layout.y) / Math.max(layout.height * 0.72, 1));
  const sectionCenter = layout.y + layout.height / 2;
  const viewportCenter = scrollY + VIEWPORT_HEIGHT / 2;
  const focusRange = Math.max(layout.height * 0.72, VIEWPORT_HEIGHT * 0.68);
  const distance = clamp((sectionCenter - viewportCenter) / focusRange, -1, 1);
  const focus = smoothStep(1 - Math.abs(distance));

  return { enter, focus, distance };
}

function entranceStyle(motion, side = 1, index = 0) {
  const progress = smoothStep(motion.enter * 1.16 - index * 0.08);

  return {
    opacity: 0.34 + progress * 0.66,
    transform: [
      { translateX: side * (1 - progress) * 132 },
      { translateY: (1 - progress) * 24 },
      { scale: 0.96 + progress * 0.04 }
    ]
  };
}

function SectionKeyword({ label, motion, style }) {
  return (
    <Text
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[
        styles.bgTitleText,
        style,
        {
          opacity: 0.04 + motion.focus * 0.24,
          transform: [
            { translateY: motion.distance * 72 },
            { scale: 0.94 + motion.focus * 0.08 }
          ]
        }
      ]}
    >
      {label}
    </Text>
  );
}

function PromoCarousel({ activeIndex, onNext, onPrevious, onSelect, t }) {
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
        onPress={onPrevious}
        style={(state) => [styles.promoArrow, styles.promoArrowLeft, ...interactiveStateStyles(state)]}
      >
        <Text style={styles.promoArrowText}>{'<'}</Text>
      </Pressable>
      <View style={styles.promoCopy}>
        <Text style={styles.promoLabel}>{t(slide.labelKey)}</Text>
        <Text style={styles.promoTitle}>{t(slide.titleKey)}</Text>
        <Text style={styles.promoDescription}>{t(slide.descriptionKey)}</Text>
        <View style={styles.promoCta}>
          <Text style={styles.promoCtaText}>{t(slide.ctaKey)}</Text>
        </View>
      </View>
      <View style={styles.promoVisual}>
        <View style={styles.promoBubbleLarge} />
        <View style={styles.promoBubbleSmall} />
        <Image source={icon} style={styles.promoIcon} />
      </View>
      <Pressable
        accessibilityLabel={t('landing.carousel.next')}
        accessibilityRole="button"
        onPress={onNext}
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

function SectionHeading({ descriptionKey, eyebrow, titleKey, t }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{t(titleKey)}</Text>
      <Text style={styles.sectionDescription}>{t(descriptionKey)}</Text>
    </View>
  );
}

function RecordSection({ layout, onLayout, scrollY, storyY, t }) {
  const absoluteLayout = layout ? { ...layout, y: storyY + layout.y } : undefined;
  const motion = getMotion(scrollY, absoluteLayout);

  const rows = [
    t('landing.feature.plan.title'),
    t('landing.feature.focus.title'),
    t('landing.feature.coop.title')
  ];

  return (
    <View onLayout={(event) => onLayout('record', event.nativeEvent?.layout)} style={styles.revealSection}>
      <SectionKeyword label={t('landing.showcase.record.keyword')} motion={motion} style={styles.bgRecord} />
      <SectionHeading
        descriptionKey="landing.showcase.record.description"
        eyebrow="OPENING NOTES"
        titleKey="landing.showcase.record.title"
        t={t}
      />
      <View style={styles.recordExperience}>
        <View style={[styles.recordMainCard, shadows.card, entranceStyle(motion, -1, 0)]}>
          <View style={styles.recordHeaderRow}>
            <Text style={styles.recordCardTitle}>{t('landing.showcase.record.title')}</Text>
            <Text style={styles.recordStreak}>{t('landing.showcase.record.metric')}</Text>
          </View>
          {rows.map((item, index) => (
            <View key={item} style={styles.recordLogRow}>
              <View style={[styles.recordLogDot, index === 1 && styles.recordLogDotWarm]} />
              <Text style={styles.recordLogText}>{item}</Text>
            </View>
          ))}
        </View>
        <View style={styles.recordSideStack}>
          <View style={[styles.recordMiniCard, styles.recordMiniCardMint, entranceStyle(motion, 1, 1)]}>
            <Text style={styles.recordMiniLabel}>{t('landing.feature.focus.label')}</Text>
            <Text style={styles.recordMiniValue}>82%</Text>
            <Text style={styles.recordMiniText}>{t('landing.feature.focus.description')}</Text>
          </View>
          <View style={[styles.recordMiniCard, styles.recordMiniCardCream, entranceStyle(motion, 1, 2)]}>
            <Text style={styles.recordMiniLabel}>{t('landing.feature.coop.label')}</Text>
            <Text style={styles.recordMiniValue}>74%</Text>
            <Text style={styles.recordMiniText}>{t('landing.feature.coop.description')}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function FeatureGridSection({ layout, onLayout, scrollY, storyY, t }) {
  const absoluteLayout = layout ? { ...layout, y: storyY + layout.y } : undefined;
  const motion = getMotion(scrollY, absoluteLayout);

  return (
    <View onLayout={(event) => onLayout('available', event.nativeEvent?.layout)} style={styles.availableSection}>
      <SectionKeyword label="SERVICE" motion={motion} style={styles.bgAvailable} />
      <SectionHeading
        descriptionKey="landing.section.available.description"
        eyebrow={t('landing.section.available.eyebrow')}
        titleKey="landing.section.available.title"
        t={t}
      />
      <View style={styles.featureGrid}>
        {availableFeatureKeys.map(([labelKey, titleKey, descriptionKey], index) => {
          const label = t(labelKey);
          const title = t(titleKey);

          return (
            <Pressable
              accessibilityLabel={`${label}: ${title}`}
              accessibilityRole="text"
              key={titleKey}
              style={(state) => [
                styles.featureCard,
                shadows.card,
                entranceStyle(motion, index % 2 === 0 ? -1 : 1, index % 4),
                ...interactiveStateStyles(state, { kind: 'card' })
              ]}
            >
              <Text style={styles.featureLabel}>{label}</Text>
              <Text style={styles.featureTitle}>{title}</Text>
              <Text style={styles.featureDescription}>{t(descriptionKey)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function PlanMock({ t }) {
  return (
    <View style={[styles.mockCard, styles.planMock]}>
      <View style={styles.planHeader}>
        <Text style={styles.planMonth}>{t('landing.feature.plan.label')}</Text>
        <View style={styles.planDday}><Text style={styles.planDdayText}>D-12</Text></View>
      </View>
      <View style={styles.planTimeline}>
        {[t('landing.feature.plan.title'), t('landing.feature.focus.title'), t('landing.feature.coop.title')].map((item, index) => (
          <View key={item} style={styles.planTimeItem}>
            <View style={[styles.planTimeDot, index === 1 && styles.planTimeDotWarm, index === 2 && styles.planTimeDotBlue]} />
            <Text style={styles.planTimeText}>{item}</Text>
          </View>
        ))}
      </View>
      <View style={styles.planPriorityBox}>
        <Text style={styles.planPriorityTitle}>{t('landing.showcase.organize.metric')}</Text>
        <Text style={styles.planPriorityText}>{t('landing.showcase.organize.description')}</Text>
      </View>
    </View>
  );
}

function ChatMock({ t }) {
  return (
    <View style={[styles.mockCard, styles.chatMock]}>
      <View style={styles.chatUserBubble}>
        <Text style={styles.chatUserText}>{t('landing.showcase.ask.title')}</Text>
      </View>
      <View style={styles.chatAiBubble}>
        <Text style={styles.chatAiText}>{t('landing.showcase.ask.description')}</Text>
        <View style={styles.chatActions}>
          <View style={styles.chatBtn}><Text style={styles.chatBtnText}>{t('landing.feature.ai.label')}</Text></View>
          <View style={[styles.chatBtn, styles.chatBtnMuted]}><Text style={[styles.chatBtnText, styles.chatBtnMutedText]}>{t('landing.showcase.ask.metric')}</Text></View>
        </View>
      </View>
    </View>
  );
}

function NoteMock({ t }) {
  const bullets = [
    t('landing.feature.ai.description'),
    t('landing.feature.focus.description'),
    t('landing.feature.community.description')
  ];

  return (
    <View style={[styles.mockCard, styles.noteMock]}>
      <View style={styles.noteBadge}><Text style={styles.noteBadgeText}>{t('landing.feature.ai.label')}</Text></View>
      <Text style={styles.noteTitle}>{t('landing.feature.ai.title')}</Text>
      <View style={styles.summaryBulletList}>
        {bullets.map((item, index) => (
          <View key={item} style={styles.summaryBulletRow}>
            <Text style={styles.summaryBulletNumber}>{index + 1}</Text>
            <Text style={[styles.summaryBulletText, index === 2 && styles.summaryHighlightText]}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ReportMock({ t }) {
  return (
    <View style={styles.reportStack}>
      <View style={[styles.mockCard, styles.reportCardBg2]} />
      <View style={[styles.mockCard, styles.reportCardBg1]} />
      <View style={[styles.mockCard, styles.reportCardMain]}>
        <View style={styles.reportHeader}>
          <Text style={styles.reportTitle}>{t('landing.feature.ai.title')}</Text>
          <Text style={styles.reportScore}>-5</Text>
        </View>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>{t('landing.feature.ai.label')}</Text>
          <Text style={styles.reportWrong}>4</Text>
        </View>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>{t('landing.showcase.ask.metric')}</Text>
          <Text style={styles.reportCorrect}>2</Text>
        </View>
        <View style={styles.reportReason}>
          <Text style={styles.reportReasonTitle}>{t('landing.showcase.ask.title')}</Text>
          <Text style={styles.reportReasonText}>{t('landing.showcase.ask.description')}</Text>
        </View>
      </View>
    </View>
  );
}

function SocialMock({ t }) {
  return (
    <View style={[styles.mockCard, styles.simpleMockCard, styles.socialMock]}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportTitle}>{t('landing.feature.social.title')}</Text>
        <Text style={[styles.reportScore, styles.socialScore]}>WebSocket</Text>
      </View>
      <View style={styles.friendRow}><View style={styles.friendAvatar} /><Text style={styles.reportLabel}>{t('landing.feature.social.description')}</Text></View>
      <View style={styles.friendRow}><View style={[styles.friendAvatar, styles.friendAvatarMint]} /><Text style={styles.reportLabel}>{t('landing.showcase.community.metric')}</Text></View>
    </View>
  );
}

function CoopMock({ t }) {
  return (
    <View style={[styles.mockCard, styles.simpleMockCard, styles.coopMock]}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportTitle}>{t('landing.feature.raid.title')}</Text>
        <Text style={styles.reportScore}>74%</Text>
      </View>
      <View style={styles.raidProgressBar}>
        <View style={styles.raidProgressFill} />
      </View>
      <Text style={styles.raidProgressText}>{t('landing.feature.coop.description')}</Text>
    </View>
  );
}

function RewardMock({ t }) {
  return (
    <View style={[styles.mockCard, styles.simpleMockCard, styles.rewardMock]}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportTitle}>{t('landing.feature.reward.title')}</Text>
        <Text style={[styles.reportScore, styles.rewardScore]}>4,200P</Text>
      </View>
      <View style={styles.rewardPreviewRow}>
        <View style={styles.rewardAvatarPreview} />
        <View style={styles.rewardCopy}>
          <Text style={styles.reportLabel}>{t('landing.feature.reward.label')}</Text>
          <Text style={styles.raidProgressText}>{t('landing.feature.reward.description')}</Text>
        </View>
      </View>
    </View>
  );
}

function AccessMock({ t }) {
  return (
    <View style={[styles.mockCard, styles.simpleMockCard, styles.accessMock]}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportTitle}>{t('landing.feature.accessibility.title')}</Text>
        <Text style={[styles.reportScore, styles.accessScore]}>2.0x</Text>
      </View>
      <View style={styles.accessLineLarge} />
      <View style={styles.accessLineMedium} />
      <View style={styles.accessControlRow}>
        <View style={styles.accessSwitchActive} />
        <View style={styles.accessSwitch} />
      </View>
    </View>
  );
}

function SectionVisual({ type, t }) {
  if (type === 'plan') return <PlanMock t={t} />;
  if (type === 'chat') return <ChatMock t={t} />;
  if (type === 'note') return <NoteMock t={t} />;
  if (type === 'report') return <ReportMock t={t} />;
  if (type === 'social') return <SocialMock t={t} />;
  if (type === 'coop') return <CoopMock t={t} />;
  if (type === 'reward') return <RewardMock t={t} />;
  return <AccessMock t={t} />;
}

function ServiceSection({ layout, onLayout, scrollY, section, storyY, t }) {
  const absoluteLayout = layout ? { ...layout, y: storyY + layout.y } : undefined;
  const motion = getMotion(scrollY, absoluteLayout);
  const reverse = section.layout === 'reverse';
  const center = section.layout === 'center';

  return (
    <View onLayout={(event) => onLayout(section.id, event.nativeEvent?.layout)} style={styles.newSection}>
      <SectionKeyword label={t(section.keywordKey)} motion={motion} style={styles[`bg${section.id}`]} />
      <View style={[styles.newSectionInner, reverse && styles.newSectionInnerReverse, center && styles.newSectionInnerCenter]}>
        <View style={[styles.newTextCol, center && styles.newTextColCenter]}>
          <Text style={[styles.newSectionTitle, center && styles.textCenter]}>{t(section.titleKey)}</Text>
          <Text style={[styles.newSectionDesc, center && styles.textCenter]}>{t(section.descriptionKey)}</Text>
          <View style={styles.tagWrap}><Text style={styles.tagText}>{t(section.chipKey)}</Text></View>
        </View>
        <View style={[styles.newVisualCol, center && styles.newVisualColCenter, entranceStyle(motion, reverse ? -1 : 1, 0)]}>
          <SectionVisual t={t} type={section.visual} />
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

  const handleLayout = (id, layout) => {
    if (!layout) return;
    setSectionLayouts((current) => ({ ...current, [id]: layout }));
  };

  const moveSlide = (direction) => {
    setActiveIndex((current) => (current + direction + promoSlides.length) % promoSlides.length);
  };

  return (
    <View
      onLayout={(event) => {
        const layout = event.nativeEvent?.layout;
        if (layout) setStoryY(layout.y || 0);
      }}
      style={styles.story}
    >
      <View style={styles.heading}>
        <Text style={styles.sectionEyebrow}>{t('landing.showcase.eyebrow')}</Text>
        <Text style={styles.sectionTitle}>{t('landing.showcase.title')}</Text>
        <Text style={styles.sectionDescription}>{t('landing.showcase.description')}</Text>
      </View>

      <PromoCarousel
        activeIndex={activeIndex}
        onNext={() => moveSlide(1)}
        onPrevious={() => moveSlide(-1)}
        onSelect={setActiveIndex}
        t={t}
      />

      <RecordSection
        layout={sectionLayouts.record}
        onLayout={handleLayout}
        scrollY={scrollY}
        storyY={storyY}
        t={t}
      />

      <FeatureGridSection
        layout={sectionLayouts.available}
        onLayout={handleLayout}
        scrollY={scrollY}
        storyY={storyY}
        t={t}
      />

      {serviceSections.map((section) => (
        <ServiceSection
          key={section.id}
          layout={sectionLayouts[section.id]}
          onLayout={handleLayout}
          scrollY={scrollY}
          section={section}
          storyY={storyY}
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
    marginBottom: 26
  },
  sectionHeading: {
    width: '100%',
    maxWidth: 1180,
    paddingHorizontal: 18,
    marginBottom: 28,
    zIndex: 5
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
    position: 'relative',
    overflow: 'hidden'
  },
  recordExperience: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    paddingHorizontal: 18,
    position: 'relative',
    zIndex: 2
  },
  recordMainCard: {
    flex: 1.25,
    minWidth: 290,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.line,
    padding: 26
  },
  recordHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20
  },
  recordCardTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900'
  },
  recordStreak: {
    color: '#FFFFFF',
    backgroundColor: '#173B63',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '900'
  },
  recordLogRow: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    marginBottom: 10
  },
  recordLogDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.mint
  },
  recordLogDotWarm: {
    backgroundColor: '#FF8A65'
  },
  recordLogText: {
    flex: 1,
    color: '#334155',
    fontSize: 14,
    fontWeight: '700'
  },
  recordSideStack: {
    flex: 0.75,
    minWidth: 250,
    gap: 14
  },
  recordMiniCard: {
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.line
  },
  recordMiniCardMint: {
    backgroundColor: '#E8FAF6'
  },
  recordMiniCardCream: {
    backgroundColor: '#FFF5D6'
  },
  recordMiniLabel: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8
  },
  recordMiniValue: {
    color: '#173B63',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    marginBottom: 8
  },
  recordMiniText: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700'
  },
  availableSection: {
    width: '100%',
    maxWidth: 1180,
    position: 'relative',
    overflow: 'hidden'
  },
  featureGrid: {
    width: '100%',
    maxWidth: 1180,
    paddingHorizontal: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 64,
    zIndex: 5
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
    marginBottom: 18,
    overflow: 'hidden'
  },
  featureTitle: {
    color: colors.ink,
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 25,
    marginBottom: 10,
    letterSpacing: 0
  },
  featureDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22
  },
  newSection: {
    width: '100%',
    maxWidth: 1180,
    paddingVertical: 140,
    position: 'relative',
    overflow: 'hidden'
  },
  newSectionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 40,
    zIndex: 5
  },
  newSectionInnerReverse: {
    flexDirection: 'row-reverse'
  },
  newSectionInnerCenter: {
    flexDirection: 'column',
    alignItems: 'center'
  },
  newTextCol: {
    flex: 1,
    maxWidth: 500,
    zIndex: 10
  },
  newTextColCenter: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40
  },
  newVisualCol: {
    flex: 1,
    zIndex: 10,
    position: 'relative'
  },
  newVisualColCenter: {
    width: '100%',
    maxWidth: 600
  },
  textCenter: {
    textAlign: 'center'
  },
  newSectionTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#15202B',
    lineHeight: 56,
    marginBottom: 20,
    letterSpacing: 0
  },
  newSectionDesc: {
    fontSize: 18,
    color: '#475569',
    lineHeight: 28,
    marginBottom: 32
  },
  tagWrap: {
    backgroundColor: 'rgba(92, 198, 184, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start'
  },
  tagText: {
    color: '#0F766E',
    fontWeight: '700',
    fontSize: 14
  },
  bgTitleText: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    fontSize: 210,
    lineHeight: 230,
    fontWeight: '900',
    color: 'rgba(82, 89, 98, 0.28)',
    zIndex: 1,
    pointerEvents: 'none',
    textAlign: 'center',
    letterSpacing: 0
  },
  bgRecord: {
    top: '50%'
  },
  bgAvailable: {
    top: 110
  },
  bgplan: {
    top: '50%'
  },
  bgquestion: {
    top: '50%'
  },
  bgsummary: {
    top: '50%'
  },
  bgreport: {
    top: '50%'
  },
  bgsocial: {
    top: '50%'
  },
  bgcoop: {
    top: '50%'
  },
  bgreward: {
    top: '50%'
  },
  bgaccess: {
    top: '50%'
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
    borderColor: 'rgba(21, 32, 43, 0.04)'
  },
  planMock: {
    width: '100%',
    maxWidth: 400
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30
  },
  planMonth: {
    fontSize: 24,
    fontWeight: '800',
    color: '#15202B'
  },
  planDday: {
    backgroundColor: '#FF8A65',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  planDdayText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 13
  },
  planTimeline: {
    gap: 16,
    marginBottom: 24
  },
  planTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  planTimeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#73C9BD'
  },
  planTimeDotWarm: {
    backgroundColor: '#FF8A65'
  },
  planTimeDotBlue: {
    backgroundColor: '#173B63'
  },
  planTimeText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 15,
    flex: 1
  },
  planPriorityBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  planPriorityTitle: {
    color: '#173B63',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8
  },
  planPriorityText: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700'
  },
  chatMock: {
    width: '100%',
    padding: 24,
    backgroundColor: '#F8FAFC'
  },
  chatUserBubble: {
    backgroundColor: '#15202B',
    padding: 16,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
    marginBottom: 16,
    maxWidth: '80%'
  },
  chatUserText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15
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
    shadowRadius: 10
  },
  chatAiText: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 16
  },
  chatActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chatBtn: {
    backgroundColor: '#E8FAF6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12
  },
  chatBtnMuted: {
    backgroundColor: '#F1F5F9'
  },
  chatBtnText: {
    color: '#0F766E',
    fontWeight: '800',
    fontSize: 12
  },
  chatBtnMutedText: {
    color: '#64748B'
  },
  noteMock: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFDF6',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  noteBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#15202B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20
  },
  noteBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800'
  },
  noteTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#15202B',
    marginBottom: 24
  },
  summaryBulletList: {
    gap: 11
  },
  summaryBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12
  },
  summaryBulletNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8FAF6',
    color: '#0F766E',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '800'
  },
  summaryBulletText: {
    flex: 1,
    color: '#475569',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600'
  },
  summaryHighlightText: {
    color: '#173B63',
    fontWeight: '900'
  },
  reportStack: {
    width: '100%',
    height: 320,
    position: 'relative'
  },
  reportCardBg1: {
    position: 'absolute',
    top: 18,
    left: 18,
    right: 0,
    height: 300,
    backgroundColor: '#E8FAF6',
    opacity: 0.75,
    transform: [{ rotate: '-2deg' }]
  },
  reportCardBg2: {
    position: 'absolute',
    top: 34,
    left: 34,
    right: -10,
    height: 300,
    backgroundColor: '#FFF5D6',
    opacity: 0.7,
    transform: [{ rotate: '2deg' }]
  },
  reportCardMain: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 300,
    zIndex: 10
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 16,
    marginBottom: 24,
    gap: 12
  },
  reportTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#15202B'
  },
  reportScore: {
    fontSize: 20,
    fontWeight: '900',
    color: '#EF4444'
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 14
  },
  reportLabel: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    flex: 1
  },
  reportWrong: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '900'
  },
  reportCorrect: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: '900'
  },
  reportReason: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16
  },
  reportReasonTitle: {
    color: '#173B63',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 8
  },
  reportReasonText: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600'
  },
  simpleMockCard: {
    width: '100%',
    position: 'relative',
    height: 'auto',
    minHeight: 250
  },
  socialMock: {
    borderColor: '#BDE0FE',
    borderWidth: 2,
    backgroundColor: '#F0F8FF'
  },
  socialScore: {
    color: '#173B63',
    fontSize: 15
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12
  },
  friendAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#BDE0FE'
  },
  friendAvatarMint: {
    backgroundColor: '#73C9BD'
  },
  coopMock: {
    borderColor: '#FFC8C8',
    borderWidth: 2,
    backgroundColor: '#FFF7F7'
  },
  raidProgressBar: {
    width: '100%',
    height: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 20
  },
  raidProgressFill: {
    width: '74%',
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 8
  },
  raidProgressText: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
    fontWeight: '700'
  },
  rewardMock: {
    borderColor: '#FFE4B5',
    borderWidth: 2,
    backgroundColor: '#FFFDF0'
  },
  rewardScore: {
    color: '#A15C00'
  },
  rewardPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  rewardAvatarPreview: {
    width: 72,
    height: 72,
    borderRadius: 26,
    backgroundColor: '#E8FAF6',
    borderWidth: 12,
    borderColor: '#73C9BD'
  },
  rewardCopy: {
    flex: 1
  },
  accessMock: {
    borderColor: '#CDEFE9',
    borderWidth: 2,
    backgroundColor: '#F8FFFD'
  },
  accessScore: {
    color: '#0F766E'
  },
  accessLineLarge: {
    width: '100%',
    height: 18,
    borderRadius: 999,
    backgroundColor: '#CDEFE9',
    marginBottom: 12
  },
  accessLineMedium: {
    width: '68%',
    height: 13,
    borderRadius: 999,
    backgroundColor: '#BDE0FE',
    marginBottom: 18
  },
  accessControlRow: {
    flexDirection: 'row',
    gap: 10
  },
  accessSwitchActive: {
    width: 46,
    height: 26,
    borderRadius: 999,
    backgroundColor: '#73C9BD'
  },
  accessSwitch: {
    width: 46,
    height: 26,
    borderRadius: 999,
    backgroundColor: '#FFF5D6'
  }
});
