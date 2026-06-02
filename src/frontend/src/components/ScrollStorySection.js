import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../i18n';
import { colors, interactiveStateStyles, shadows } from '../styles/theme';

const icon = require('../assets/sagaksagak-app-icon.png');
const DEMO_PHASE_COUNT = 6;
const DEMO_FINAL_PHASE = DEMO_PHASE_COUNT - 1;
const DEMO_VISUAL_FINAL_PHASE = 4;
const DEMO_PHASE_SEQUENCE = [0, 0, 1, 2, 3, 4, 5, 5, 4, 3, 2, 1];
const DEMO_PHASE_INTERVAL_MS = 660;

const promoSlides = [
  {
    id: 'scope-auth',
    labelKey: 'landing.scope.auth.label',
    titleKey: 'landing.scope.auth.title',
    descriptionKey: 'landing.scope.auth.description',
    ctaKey: 'landing.cta.primary',
    labelFallback: 'ACCOUNT',
    titleFallback: 'User registration and login',
    descriptionFallback: 'Separate learning records by account and enter the study flow after login.',
    ctaFallback: 'Start for free',
    mood: 'mint'
  },
  {
    id: 'scope-schedule',
    labelKey: 'landing.scope.schedule.label',
    titleKey: 'landing.scope.schedule.title',
    descriptionKey: 'landing.scope.schedule.description',
    ctaKey: 'landing.cta.primary',
    labelFallback: 'SCHEDULE',
    titleFallback: 'Learning schedule management',
    descriptionFallback: 'Organize today’s plan with schedules, D-Day items, and Kanban tasks.',
    ctaFallback: 'Start for free',
    mood: 'blue'
  },
  {
    id: 'scope-note-quiz',
    labelKey: 'landing.scope.noteQuiz.label',
    titleKey: 'landing.scope.noteQuiz.title',
    descriptionKey: 'landing.scope.noteQuiz.description',
    ctaKey: 'landing.cta.primary',
    labelFallback: 'NOTE & QUIZ',
    titleFallback: 'Note and quiz creation/management',
    descriptionFallback: 'Create and revisit study notes and review quizzes as a continuous record flow.',
    ctaFallback: 'Start for free',
    mood: 'cream'
  },
  {
    id: 'scope-recommendation',
    labelKey: 'landing.scope.recommendation.label',
    titleKey: 'landing.scope.recommendation.title',
    descriptionKey: 'landing.scope.recommendation.description',
    ctaKey: 'landing.cta.primary',
    labelFallback: 'AI GUIDE',
    titleFallback: 'AI-based learning recommendation',
    descriptionFallback: 'Use questions, summaries, wrong-answer analysis, and recommendations to suggest the next study direction.',
    ctaFallback: 'Start for free',
    mood: 'blue'
  },
  {
    id: 'scope-visualization',
    labelKey: 'landing.scope.visualization.label',
    titleKey: 'landing.scope.visualization.title',
    descriptionKey: 'landing.scope.visualization.description',
    ctaKey: 'landing.cta.primary',
    labelFallback: 'INSIGHT',
    titleFallback: 'Data visualization',
    descriptionFallback: 'Visualize focus time, activity statistics, and study progress.',
    ctaFallback: 'Start for free',
    mood: 'cream'
  },
  {
    id: 'scope-privacy',
    labelKey: 'landing.scope.privacy.label',
    titleKey: 'landing.scope.privacy.title',
    descriptionKey: 'landing.scope.privacy.description',
    ctaKey: 'landing.cta.primary',
    labelFallback: 'TRUST',
    titleFallback: 'Security and privacy considerations',
    descriptionFallback: 'Handle personal learning data with authentication, authorization, and account-status policies.',
    ctaFallback: 'Start for free',
    mood: 'mint'
  }
];

const serviceSections = [
  {
    id: 'plan',
    keyword: 'PLAN',
    titleKey: 'landing.story.plan.title',
    titleFallback: '하루 계획이 흩어지지 않게',
    descriptionKey: 'landing.story.plan.description',
    descriptionFallback: '일정과 칸반을 한 흐름으로 이어 오늘 해야 할 공부를 또렷하게 보여줍니다.',
    chipKey: 'landing.story.plan.chip1',
    chipFallback: '일정',
    layout: 'row',
    visual: 'plan'
  },
  {
    id: 'focus',
    keyword: 'FOCUS',
    titleKey: 'landing.focus.title',
    titleFallback: '집중 시간을 기록하고 흐름을 확인하세요',
    descriptionKey: 'landing.focus.description',
    descriptionFallback: '타이머로 학습 시간을 기록하고, 주간 통계와 집중 패턴으로 나만의 학습 리듬을 확인합니다.',
    chipKey: 'landing.focus.chip',
    chipFallback: 'FOCUS TIMER',
    layout: 'reverse',
    visual: 'focus'
  },
  {
    id: 'question',
    keyword: 'AI',
    titleKey: 'landing.story.ai.title',
    titleFallback: '질문하고, 요약하고, 다시 보기',
    descriptionKey: 'landing.story.ai.description',
    descriptionFallback: 'AI 학습 화면에서 질문, 요약, 오답 점검을 이어가며 막힌 부분을 빠르게 정리합니다.',
    chipKey: 'landing.story.ai.chip1',
    chipFallback: '질문',
    layout: 'center',
    visual: 'chat'
  },
  {
    id: 'summary',
    keyword: 'SUMMARY',
    titleKey: 'landing.summary.title',
    titleFallback: '긴 내용을 핵심만 남기세요',
    descriptionKey: 'landing.summary.description',
    descriptionFallback: '노트 필기와 문서 하이라이트로 배운 것을 온전히 내 것으로 만듭니다.',
    chipKey: 'landing.story.ai.chip2',
    chipFallback: '요약',
    layout: 'reverse',
    visual: 'note'
  },
  {
    id: 'report',
    keyword: 'REVIEW',
    titleKey: 'landing.report.title',
    titleFallback: '틀린 이유를 정확히 이해하세요',
    descriptionKey: 'landing.report.description',
    descriptionFallback: '내 답안과 정답을 비교하고 AI가 분석해주는 오답 리포트를 확인하세요.',
    chipKey: 'landing.story.ai.chip3',
    chipFallback: '오답 분석',
    layout: 'row',
    visual: 'report'
  },
  {
    id: 'message',
    keyword: 'MESSAGE',
    titleKey: 'landing.message.title',
    titleFallback: '실시간 쪽지로 이어지는 학습 소통',
    descriptionKey: 'landing.message.description',
    descriptionFallback: '친구 접속 상태와 읽지 않은 쪽지를 확인하고, 1:1 대화로 학습 흐름을 이어갑니다.',
    chipKey: 'landing.message.chip',
    chipFallback: 'MESSAGE',
    layout: 'row',
    visual: 'message'
  },
  {
    id: 'community',
    keyword: 'COMMUNITY',
    titleKey: 'landing.community.title',
    titleFallback: '질문과 기록을 나누는 학습 게시판',
    descriptionKey: 'landing.community.description',
    descriptionFallback: '게시글, 댓글, 반응, 북마크, 공유 흐름으로 학습 기록을 함께 나눕니다.',
    chipKey: 'landing.community.chip',
    chipFallback: 'COMMUNITY',
    layout: 'reverse',
    visual: 'community'
  },
  {
    id: 'coop',
    keyword: 'COOP',
    titleFallback: '같이 목표를 달성하는 쾌감',
    descriptionFallback: '등록된 보스 레이드에 참여하고, 팀원과 직접 협동 퀘스트를 만들어 함께 목표를 달성하고 포인트를 받으세요.',
    chipFallback: '협동',
    layout: 'reverse',
    visual: 'coop'
  },
  {
    id: 'reward',
    keyword: 'REWARD',
    titleFallback: '노력한 만큼 쌓이는 보상',
    descriptionFallback: '퀘스트와 목표 달성으로 모은 포인트로 나만의 프로필을 꾸미고, 학습 성취감을 높여보세요.',
    chipFallback: '포인트 상점',
    layout: 'row',
    visual: 'reward'
  },
  {
    id: 'language',
    keyword: 'LANG',
    titleKey: 'landing.language.title',
    titleFallback: '네 언어로 가볍게 시작하는 학습',
    descriptionKey: 'landing.language.description',
    descriptionFallback: '한국어를 기본으로, English / 日本語 / 中文 Beta 화면을 함께 제공합니다.',
    chipKey: 'landing.language.chip',
    chipFallback: 'LANGUAGE BETA',
    layout: 'reverse',
    visual: 'language'
  },
  {
    id: 'trust',
    keyword: 'TRUST',
    titleKey: 'landing.trust.title',
    titleFallback: '차분하지만 믿을 수 있는 학습 공간',
    descriptionKey: 'landing.trust.description',
    descriptionFallback: '사각사각은 화려한 효과보다 실제 학습 흐름, 접근성, 기존 API 안정성을 우선합니다.',
    chipFallback: '안정성',
    layout: 'reverse',
    visual: 'trust'
  }
];

function SectionKeyword({ label, style }) {
  return (
    <Text
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[styles.bgTitleText, style]}
    >
      {label}
    </Text>
  );
}

function getPrefersReducedMotion() {
  const browserWindow = typeof globalThis !== 'undefined' ? globalThis.window : null;

  if (!browserWindow?.matchMedia) {
    return false;
  }

  return browserWindow.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function animatedStyle(style, reducedMotion) {
  return reducedMotion ? null : style;
}

function getMicroDelayStyle(index) {
  return styles[`microDelay${index}`] || styles.microDelay0;
}

function isPhaseReached(index, demoPhase, reducedMotion) {
  return reducedMotion || index <= demoPhase;
}

function getStepStyle(index, demoPhase, reducedMotion) {
  return isPhaseReached(index, demoPhase, reducedMotion) ? styles.demoStepActive : styles.demoStepWaiting;
}

function getCurrentStepStyle(index, demoPhase, reducedMotion) {
  return reducedMotion || index === demoPhase ? styles.demoStepActive : styles.demoStepDimmed;
}

function getCurrentOrCompleteStyle(index, demoPhase, reducedMotion) {
  return [
    getStepStyle(index, demoPhase, reducedMotion),
    !reducedMotion && index === demoPhase && styles.demoCurrentStep
  ];
}

function getBarHeightForPhase(targetHeight, index, demoPhase, reducedMotion) {
  if (reducedMotion) {
    return targetHeight;
  }

  const targetValue = Number.parseInt(String(targetHeight).replace('%', ''), 10) || 50;
  const activeCount = [1, 2, 3, 4, 5][demoPhase] || 5;

  if (index >= activeCount) {
    return '10%';
  }

  const scale = [0.26, 0.48, 0.68, 0.84, 1][demoPhase] || 1;
  return `${Math.max(16, Math.round(targetValue * scale))}%`;
}

function getCoopProgressWidth(demoPhase, reducedMotion) {
  if (reducedMotion) {
    return '24%';
  }

  const phase = Math.min(demoPhase, DEMO_VISUAL_FINAL_PHASE);
  return ['82%', '68%', '55%', '39%', '24%'][phase] || '55%';
}

function PromoCarousel({ activeIndex, onCtaPress, onNext, onPauseChange, onPrevious, onSelect, t }) {
  const slide = promoSlides[activeIndex];
  const pauseAutoSlide = () => onPauseChange(true);
  const resumeAutoSlide = () => onPauseChange(false);

  return (
    <Pressable
      onBlur={resumeAutoSlide}
      onFocus={pauseAutoSlide}
      onHoverIn={pauseAutoSlide}
      onHoverOut={resumeAutoSlide}
      style={[
        styles.promo,
        slide.mood === 'blue' && styles.promoBlue,
        slide.mood === 'cream' && styles.promoCream
      ]}
    >
      <Pressable
        accessibilityLabel={t('landing.carousel.prev')}
        accessibilityRole="button"
        onBlur={resumeAutoSlide}
        onFocus={pauseAutoSlide}
        onHoverIn={pauseAutoSlide}
        onHoverOut={resumeAutoSlide}
        onPress={onPrevious}
        style={(state) => [styles.promoArrow, styles.promoArrowLeft, ...interactiveStateStyles(state)]}
      >
        <Text style={styles.promoArrowText}>{'<'}</Text>
      </Pressable>
      <View style={styles.promoCopy}>
        <Text style={styles.promoLabel}>{t(slide.labelKey, slide.labelFallback)}</Text>
        <Text style={styles.promoTitle}>{t(slide.titleKey, slide.titleFallback)}</Text>
        <Text style={styles.promoDescription}>{t(slide.descriptionKey, slide.descriptionFallback)}</Text>
        {slide.detailKeys?.length ? (
          <View style={styles.promoDetailRow}>
            {slide.detailKeys.map((detailKey, index) => (
              <Text key={detailKey} style={styles.promoDetailChip}>
                {t(detailKey, slide.detailFallbacks[index])}
              </Text>
            ))}
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={onCtaPress}
          style={(state) => [styles.promoCta, ...interactiveStateStyles(state)]}
        >
          <Text style={styles.promoCtaText}>{t(slide.ctaKey, slide.ctaFallback)}</Text>
        </Pressable>
      </View>
      <View style={styles.promoVisual}>
        <View style={styles.promoBubbleLarge} />
        <View style={styles.promoBubbleSmall} />
        <Image source={icon} style={styles.promoIcon} />
      </View>
      <Pressable
        accessibilityLabel={t('landing.carousel.next')}
        accessibilityRole="button"
        onBlur={resumeAutoSlide}
        onFocus={pauseAutoSlide}
        onHoverIn={pauseAutoSlide}
        onHoverOut={resumeAutoSlide}
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
            onBlur={resumeAutoSlide}
            onFocus={pauseAutoSlide}
            onHoverIn={pauseAutoSlide}
            onHoverOut={resumeAutoSlide}
            onPress={() => onSelect(index)}
            style={[styles.promoDot, index === activeIndex && styles.promoDotActive]}
          />
        ))}
      </View>
    </Pressable>
  );
}

function DesignNotesRecordCards({ demoPhase, reducedMotion, t }) {
  const phase = Math.min(reducedMotion ? DEMO_VISUAL_FINAL_PHASE : demoPhase, DEMO_VISUAL_FINAL_PHASE);
  const dateValues = ['05/24', '05/25', '05/26', '05/27', '05/28'];
  const streakValues = ['연속 1일째', '연속 2일째', '연속 3일째', '연속 4일째', t('landing.designRecord.streak', '연속 5일째')];
  const rows = [
    t('landing.designRecord.row1', '자료구조 DFS 복습 완료 · 42분'),
    t('landing.designRecord.row2', '미적분 문제풀이 · 1시간 10분'),
    t('landing.designRecord.row3', '영어 단어 암기 · 25분'),
    t('landing.designRecord.row4', '오늘 질문 3개 / 요약 2개 저장')
  ];

  return (
    <View style={styles.recordExperience}>
      <View style={[styles.recordMainCard, shadows.card]}>
        <View style={styles.recordHeaderRow}>
          <Text style={styles.recordCardTitle}>{t('landing.designRecord.mainTitle', '오늘의 학습 기록')}</Text>
          <Text style={[styles.recordStreak, styles.recordStreakLive]}>{streakValues[phase]}</Text>
        </View>
        {rows.map((item, index) => (
          <View key={item} style={[styles.recordLogRow, getCurrentOrCompleteStyle(index, demoPhase, reducedMotion)]}>
            <View style={[
              styles.recordLogDot,
              index === 1 && styles.recordLogDotWarm,
              isPhaseReached(index, demoPhase, reducedMotion) && styles.recordLogDotActive
            ]} />
            <Text style={[styles.recordLogText, isPhaseReached(index, demoPhase, reducedMotion) && styles.recordLogTextActive]}>{item}</Text>
          </View>
        ))}
      </View>
      <View style={styles.recordSideStack}>
        <View style={[styles.recordMiniCard, styles.recordMiniCardMint, demoPhase >= 1 && styles.demoMiniActive]}>
          <Text style={styles.recordMiniLabel}>{t('landing.designRecord.mini1Label', 'Opening Notes')}</Text>
          <Text style={styles.recordMiniValue}>{dateValues[phase]}</Text>
          <Text style={styles.recordMiniText}>{t('landing.designRecord.mini1Text', '학습 목표와 오늘의 기록을 한눈에 정리합니다.')}</Text>
        </View>
        <View style={[styles.recordMiniCard, styles.recordMiniCardCream, demoPhase >= 3 && styles.demoMiniActive]}>
          <Text style={styles.recordMiniLabel}>{t('landing.designRecord.mini2Label', 'Saved Questions')}</Text>
          <Text style={styles.recordMiniValue}>{String(phase)}</Text>
          <Text style={styles.recordMiniText}>{t('landing.designRecord.mini2Text', '질문과 요약을 다시 볼 수 있게 모아둡니다.')}</Text>
        </View>
      </View>
    </View>
  );
}

function PlanMock({ demoPhase, reducedMotion, t }) {
  const rows = [
    t('landing.story.plan.previewItem1', '09:00 자료구조 복습'),
    t('landing.story.plan.previewItem2', '14:00 알고리즘 과제'),
    t('landing.story.plan.previewItem3', '20:00 오답 노트 정리')
  ];
  const activeScheduleIndex = Math.min(demoPhase, rows.length - 1);

  return (
    <View style={[styles.mockCard, styles.planMock]}>
      <View style={styles.planHeader}>
        <Text style={styles.planMonth}>{t('landing.story.plan.previewTitle', '오늘의 학습 일정')}</Text>
        <View style={[styles.planDday, animatedStyle(styles.microBadgePulse, reducedMotion), demoPhase >= 4 && styles.demoBadgeActive]}><Text style={styles.planDdayText}>D-12</Text></View>
      </View>
      <View style={styles.planTimeline}>
        {rows.map((item, index) => (
          <View key={item} style={[styles.planTimeItem, getStepStyle(index, demoPhase, reducedMotion), index === activeScheduleIndex && styles.demoCurrentStep]}>
            <View
              style={[
                styles.planTimeDot,
                index === 1 && styles.planTimeDotWarm,
                index === 2 && styles.planTimeDotBlue,
                isPhaseReached(index, demoPhase, reducedMotion) && styles.planTimeDotActive,
                animatedStyle(styles.microDotPulse, reducedMotion),
                animatedStyle(getMicroDelayStyle(index), reducedMotion)
              ]}
            />
            <Text style={[styles.planTimeText, isPhaseReached(index, demoPhase, reducedMotion) && styles.planTimeTextActive]}>{item}</Text>
          </View>
        ))}
      </View>
      <View style={[styles.planPriorityBox, demoPhase >= 4 && styles.demoPanelActive]}>
        <Text style={styles.planPriorityTitle}>{t('landing.story.plan.previewMeta', '중간고사 D-12')}</Text>
        <Text style={styles.planPriorityText}>오늘 할 일을 정리하고 우선순위를 확인합니다.</Text>
      </View>
    </View>
  );
}

function FocusMock({ demoPhase, reducedMotion, t }) {
  const phase = Math.min(reducedMotion ? DEMO_VISUAL_FINAL_PHASE : demoPhase, DEMO_VISUAL_FINAL_PHASE);
  const weeklyBars = [
    ['landing.focus.week.mon', '62%'],
    ['landing.focus.week.tue', '48%'],
    ['landing.focus.week.wed', '78%'],
    ['landing.focus.week.thu', '56%'],
    ['landing.focus.week.fri', '84%']
  ];
  const timerValues = [
    t('landing.focus.timerValue', '25:00'),
    t('landing.focus.timerValue', '25:00'),
    '24:59',
    '24:58',
    '24:57'
  ];

  return (
    <View style={[styles.mockCard, styles.simpleMockCard, styles.focusMock]}>
      <View style={styles.focusHeader}>
        <View style={[styles.focusTimerCircle, animatedStyle(styles.microTimerPulse, reducedMotion), styles[`focusTimerPhase${phase}`]]}>
          <Text style={styles.focusTimerValue}>{timerValues[phase]}</Text>
          <Text style={styles.focusTimerLabel}>{t('landing.focus.timerLabel', '집중 타이머')}</Text>
        </View>
        <View style={styles.focusSummaryStack}>
          <Text style={styles.focusSummaryLabel}>{t('landing.focus.todayLabel', '오늘 집중')}</Text>
          <Text style={styles.focusSummaryValue}>{t('landing.focus.todayValue', '2시간 10분')}</Text>
          <Text style={styles.focusStreakChip}>{t('landing.focus.streak', '이번 주 학습 5일 연속')}</Text>
        </View>
      </View>
      <View style={styles.focusBarGroup}>
        {weeklyBars.map(([labelKey, height], index) => (
          <View key={labelKey} style={styles.focusBarItem}>
            <View style={styles.focusBarTrack}>
              <View
                style={[
                  styles.focusBarFill,
                  { height: getBarHeightForPhase(height, index, phase, reducedMotion) },
                  isPhaseReached(index, phase + 1, reducedMotion) && styles.focusBarFillActive,
                  animatedStyle(getMicroDelayStyle(index), reducedMotion)
                ]}
              />
            </View>
            <Text style={styles.focusBarLabel}>{t(labelKey)}</Text>
          </View>
        ))}
      </View>
      <View style={[styles.focusSavedBox, phase >= 4 && styles.demoPanelActive]}>
        <Text style={styles.focusSavedText}>{t('landing.focus.saved', '집중 기록 저장 완료')}</Text>
      </View>
    </View>
  );
}

function ChatMock({ demoPhase, reducedMotion, t }) {
  return (
    <View style={[styles.mockCard, styles.chatMock]}>
      <View style={[styles.chatUserBubble, animatedStyle(styles.microBubbleLift, reducedMotion), getCurrentOrCompleteStyle(0, demoPhase, reducedMotion)]}>
        <Text style={styles.chatUserText}>{t('landing.story.ai.previewItem1', '이 개념을 한 문단으로 요약해줘')}</Text>
      </View>
      <View style={[styles.aiWaitRow, getCurrentStepStyle(1, demoPhase, reducedMotion)]}>
        <Text style={styles.aiWaitText}>AI가 질문을 읽는 중</Text>
      </View>
      <View style={[styles.typingDotsRow, getCurrentStepStyle(2, demoPhase, reducedMotion)]}>
        <View style={[styles.typingDot, animatedStyle(styles.microDotPulse, reducedMotion)]} />
        <View style={[styles.typingDot, animatedStyle(styles.microDotPulse, reducedMotion), animatedStyle(styles.microDelay1, reducedMotion)]} />
        <View style={[styles.typingDot, animatedStyle(styles.microDotPulse, reducedMotion), animatedStyle(styles.microDelay2, reducedMotion)]} />
      </View>
      <View style={[styles.chatAiBubble, animatedStyle(styles.microBubbleLift, reducedMotion), animatedStyle(styles.microDelay1, reducedMotion), getCurrentOrCompleteStyle(3, demoPhase, reducedMotion)]}>
        <Text style={styles.chatAiText}>막히는 부분을 질문하면 요약과 복습 힌트로 이어집니다.</Text>
      </View>
      <View style={[styles.chatUserBubble, styles.chatUserBubbleFollowup, animatedStyle(styles.microBubbleLift, reducedMotion), getStepStyle(4, demoPhase, reducedMotion)]}>
        <Text style={styles.chatUserText}>예시도 같이 보여줘</Text>
      </View>
      <View style={[styles.chatAiBubble, styles.chatAiBubbleFollowup, animatedStyle(styles.microBubbleLift, reducedMotion), animatedStyle(styles.microDelay1, reducedMotion), getStepStyle(5, demoPhase, reducedMotion)]}>
        <Text style={styles.chatAiText}>복습 질문으로 이어가면 요약, 다시 보기, 예시 보기 순서로 정리됩니다.</Text>
        <View style={styles.chatActions}>
          <View style={[styles.chatBtn, animatedStyle(styles.microChipHighlight, reducedMotion), demoPhase >= 3 && styles.demoChipActive]}><Text style={styles.chatBtnText}>요약하기</Text></View>
          <View style={[styles.chatBtn, styles.chatBtnMuted, animatedStyle(styles.microChipHighlight, reducedMotion), animatedStyle(styles.microDelay1, reducedMotion), demoPhase >= 5 && styles.demoChipActive]}><Text style={[styles.chatBtnText, styles.chatBtnMutedText]}>다시 보기</Text></View>
          <View style={[styles.chatBtn, styles.chatBtnCream, animatedStyle(styles.microChipHighlight, reducedMotion), animatedStyle(styles.microDelay2, reducedMotion), demoPhase >= 5 && styles.demoChipActive]}><Text style={[styles.chatBtnText, styles.chatBtnCreamText]}>예시 보기</Text></View>
        </View>
      </View>
    </View>
  );
}

function NoteMock({ demoPhase, reducedMotion, t }) {
  const bullets = [
    '미분 = 순간 변화율',
    '도함수 = 접선의 기울기',
    '적분 = 누적량',
    '기본정리 = 미분·적분 연결'
  ];

  return (
    <View style={[styles.mockCard, styles.noteMock]}>
      <View style={[styles.noteBadge, demoPhase >= 4 && styles.demoBadgeActive]}><Text style={styles.noteBadgeText}>AI 요약 완료</Text></View>
      <Text style={styles.noteTitle}>수학 미적분 핵심 개념</Text>
      <View style={styles.summaryBulletList}>
        {bullets.map((item, index) => (
          <View
            key={item}
            style={[
              styles.summaryBulletRow,
              getCurrentOrCompleteStyle(index, demoPhase, reducedMotion),
              animatedStyle(styles.microSummaryRow, reducedMotion),
              animatedStyle(getMicroDelayStyle(index), reducedMotion)
            ]}
          >
            <Text
              style={[
                styles.summaryBulletNumber,
                animatedStyle(styles.microBulletHighlight, reducedMotion),
                animatedStyle(getMicroDelayStyle(index), reducedMotion)
              ]}
            >
              {index + 1}
            </Text>
            <Text style={[styles.summaryBulletText, index === 2 && styles.summaryHighlightText]}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ReportMock({ demoPhase, reducedMotion, t }) {
  return (
    <View style={styles.reportStack}>
      <View style={[styles.mockCard, styles.reportCardBg2, animatedStyle(styles.microStackFloat, reducedMotion), animatedStyle(styles.microDelay1, reducedMotion)]} />
      <View style={[styles.mockCard, styles.reportCardBg1, animatedStyle(styles.microStackFloat, reducedMotion)]} />
      <View style={[styles.mockCard, styles.reportCardMain]}>
        <View style={styles.reportHeader}>
          <Text style={styles.reportTitle}>{t('landing.feature.ai.title')}</Text>
          <Text style={[styles.reportScore, animatedStyle(styles.microScorePulse, reducedMotion), getCurrentOrCompleteStyle(0, demoPhase, reducedMotion)]}>-5</Text>
        </View>
        <View style={[styles.reportRow, styles.reportAnalysisRow, getCurrentOrCompleteStyle(1, demoPhase, reducedMotion)]}>
          <View style={styles.reportAnalysisCopy}>
            <Text style={styles.reportLabel}>내 답안</Text>
            <Text style={styles.reportDetailText}>조건식을 반대로 해석했다</Text>
          </View>
          <Text style={[styles.reportWrong, animatedStyle(styles.microScorePulse, reducedMotion), animatedStyle(styles.microDelay1, reducedMotion)]}>4</Text>
        </View>
        <View style={[styles.reportRow, styles.reportAnalysisRow, getCurrentOrCompleteStyle(2, demoPhase, reducedMotion)]}>
          <View style={styles.reportAnalysisCopy}>
            <Text style={styles.reportLabel}>정답</Text>
            <Text style={styles.reportDetailText}>탐색 순서를 먼저 확인해야 한다</Text>
          </View>
          <Text style={[styles.reportCorrect, animatedStyle(styles.microScorePulse, reducedMotion), animatedStyle(styles.microDelay2, reducedMotion)]}>2</Text>
        </View>
        <View style={[styles.reportReason, animatedStyle(styles.microSoftGlow, reducedMotion), getStepStyle(4, demoPhase, reducedMotion)]}>
          <Text style={styles.reportReasonTitle}>틀린 이유</Text>
          <Text style={styles.reportReasonText}>조건식을 반대로 해석해 탐색 순서를 잘못 판단했습니다.</Text>
        </View>
      </View>
    </View>
  );
}

function MessageMock({ demoPhase, reducedMotion, t }) {
  return (
    <View style={[styles.mockCard, styles.simpleMockCard, styles.messageMock]}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportTitle}>{t('landing.message.previewTitle', '1:1 쪽지 대화')}</Text>
        <Text style={[styles.reportScore, styles.messageScore]}>{t('landing.message.realtimePill', 'Realtime')}</Text>
      </View>
      <View style={styles.socialStatusRow}>
        <Text style={[styles.socialStatusText, animatedStyle(styles.microChipHighlight, reducedMotion), getCurrentOrCompleteStyle(0, demoPhase, reducedMotion)]}>{t('landing.message.onlineCount', '친구 3명 접속중')}</Text>
        <Text style={[styles.socialUnreadPill, animatedStyle(styles.microUnreadPulse, reducedMotion), getCurrentOrCompleteStyle(1, demoPhase, reducedMotion)]}>{t('landing.message.unreadBadge', '읽지 않은 쪽지 2개')}</Text>
      </View>
      <View style={[styles.messageBubbleRow, getStepStyle(2, demoPhase, reducedMotion)]}>
        <View style={styles.friendAvatar} />
        <View style={[styles.messageBubble, animatedStyle(styles.microMessageLift, reducedMotion)]}>
          <Text style={styles.messageAuthor}>이량</Text>
          <Text style={styles.messageBubbleText}>소공 과제 PR 확인했어?</Text>
        </View>
      </View>
      <View style={[styles.messageBubbleRow, styles.messageBubbleRowRight, getStepStyle(3, demoPhase, reducedMotion)]}>
        <View style={[styles.messageBubble, styles.messageBubbleMint, animatedStyle(styles.microMessageLift, reducedMotion), animatedStyle(styles.microDelay1, reducedMotion)]}>
          <Text style={styles.messageAuthor}>지환</Text>
          <Text style={styles.messageBubbleText}>지금 PR 확인하고 리뷰 남길게.</Text>
        </View>
        <View style={[styles.friendAvatar, styles.friendAvatarMint]} />
      </View>
      <View style={[styles.messageBubbleRow, getStepStyle(4, demoPhase, reducedMotion)]}>
        <View style={[styles.friendAvatar, styles.friendAvatarCream]} />
        <View style={[styles.messageBubble, styles.messageBubbleCream, animatedStyle(styles.microMessageLift, reducedMotion), animatedStyle(styles.microDelay2, reducedMotion)]}>
          <Text style={styles.messageAuthor}>대겸</Text>
          <Text style={styles.messageBubbleText}>너무 힘들어요 ㅠㅠ 코멘트 남겼어요.</Text>
        </View>
      </View>
      <Text style={styles.socialFooterText}>{t('landing.message.footer', '친구 접속 상태 · 읽지 않은 메시지 · 실시간 흐름')}</Text>
    </View>
  );
}

function CommunityMock({ demoPhase, reducedMotion, t }) {
  const items = [
    t('landing.community.previewPost', '게시글'),
    t('landing.community.previewComment', '댓글'),
    t('landing.community.previewReaction', '반응'),
    t('landing.community.previewBookmark', '북마크'),
    t('landing.community.previewShare', '공유')
  ];

  return (
    <View style={[styles.mockCard, styles.simpleMockCard, styles.communityMock]}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportTitle}>{t('landing.community.previewTitle', '학습 게시판')}</Text>
        <Text style={[styles.reportScore, styles.communityScore]}>{t('landing.community.previewPill', 'Share')}</Text>
      </View>
      <View style={[styles.communityPostPreview, getCurrentOrCompleteStyle(0, demoPhase, reducedMotion)]}>
        <Text style={styles.communityPostTitle}>질문: DFS 방문 순서가 헷갈려요</Text>
        <Text style={[styles.communityPostComment, getStepStyle(1, demoPhase, reducedMotion)]}>댓글: 스택 흐름으로 다시 보면 쉬워요</Text>
      </View>
      <View style={styles.communityActionGrid}>
        {items.map((item, index) => (
          <View
            key={item}
            style={[
              styles.communityActionPill,
              isPhaseReached(index, demoPhase, reducedMotion) && styles.demoChipActive,
              animatedStyle(styles.microChipHighlight, reducedMotion),
              animatedStyle(getMicroDelayStyle(index), reducedMotion)
            ]}
          >
            <Text style={styles.communityActionText}>{item}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.socialFooterText}>{t('landing.community.footer', '질문과 학습 기록을 게시글 중심으로 정리합니다.')}</Text>
    </View>
  );
}

function CoopMock({ demoPhase, reducedMotion, t }) {
  const phase = Math.min(reducedMotion ? DEMO_VISUAL_FINAL_PHASE : demoPhase, DEMO_VISUAL_FINAL_PHASE);
  const hpValues = ['HP 82%', 'HP 68%', 'HP 55%', 'HP 39%', 'HP 24%'];
  const contributionLabels = ['이량 +12분', '지환 +18분', '대겸 +15분'];

  return (
    <View style={[styles.mockCard, styles.simpleMockCard, styles.coopMock]}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportTitle}>중간고사 집중 레이드</Text>
        <Text style={[styles.reportScore, animatedStyle(styles.microScorePulse, reducedMotion), demoPhase >= 1 && styles.demoTextActive]}>{hpValues[phase]}</Text>
      </View>
      <View style={styles.raidProgressBar}>
        <View style={[styles.raidProgressFill, { width: getCoopProgressWidth(demoPhase, reducedMotion) }]} />
      </View>
      <View style={styles.coopContributionRow}>
        {contributionLabels.map((item, index) => (
          <Text key={item} style={[styles.coopContributionChip, isPhaseReached(index + 1, demoPhase, reducedMotion) && styles.demoChipActive]}>
            {item}
          </Text>
        ))}
      </View>
      <Text style={styles.raidProgressText}>레이드 진행률과 협동 기여 시간이 함께 반영됩니다.</Text>
    </View>
  );
}

function RewardMock({ demoPhase, reducedMotion, t }) {
  const phase = Math.min(reducedMotion ? DEMO_VISUAL_FINAL_PHASE : demoPhase, DEMO_VISUAL_FINAL_PHASE);
  const pointValues = ['4,200P', '4,200P', '4,200P', '3,400P', '3,400P'];

  return (
    <View style={[styles.mockCard, styles.simpleMockCard, styles.rewardMock]}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportTitle}>포인트 상점</Text>
        <Text style={[styles.reportScore, styles.rewardScore, animatedStyle(styles.microRewardGlow, reducedMotion), getStepStyle(0, demoPhase, reducedMotion)]}>{pointValues[phase]}</Text>
      </View>
      <View style={styles.rewardPreviewRow}>
        <View style={[styles.rewardAvatarPreview, animatedStyle(styles.microAvatarPulse, reducedMotion), getStepStyle(1, demoPhase, reducedMotion)]}>
          <View style={[styles.rewardAvatarInner, demoPhase >= 3 && styles.rewardAvatarInnerActive]} />
        </View>
        <View style={styles.rewardCopy}>
          <View style={styles.rewardItemRow}>
            <Text style={[styles.rewardItemChip, getStepStyle(1, demoPhase, reducedMotion)]}>달빛 배경 선택</Text>
            <Text style={[styles.rewardItemChip, getStepStyle(2, demoPhase, reducedMotion)]}>구매하기</Text>
            <Text style={[styles.rewardItemChip, getStepStyle(3, demoPhase, reducedMotion)]}>800P 차감</Text>
            <Text style={[styles.rewardItemChip, getStepStyle(4, demoPhase, reducedMotion)]}>적용 완료</Text>
          </View>
          <Text style={[styles.raidProgressText, getStepStyle(4, demoPhase, reducedMotion)]}>달빛 테마를 프로필 배경에 적용합니다.</Text>
        </View>
      </View>
    </View>
  );
}

function LanguageMock({ demoPhase, reducedMotion, t }) {
  const rows = [
    t('landing.language.previewKo', '한국어 기본'),
    t('landing.language.previewEn', 'English Beta'),
    t('landing.language.previewJa', '日本語 Beta'),
    t('landing.language.previewZh', '中文 Beta')
  ];
  const selectedLanguageIndex = Math.min(reducedMotion ? DEMO_FINAL_PHASE : demoPhase, rows.length - 1);
  const sampleSentences = [
    '오늘 학습 기록을 정리했어요.',
    'Today’s study log is ready.',
    '今日の学習記録を整理しました。',
    '今天的学习记录已整理。'
  ];

  return (
    <View style={[styles.mockCard, styles.simpleMockCard, styles.languageMock]}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportTitle}>{t('landing.language.previewTitle', 'Language Beta')}</Text>
        <Text style={[styles.reportScore, styles.languageScore]}>Beta</Text>
      </View>
      <View style={styles.languageList}>
        {rows.map((item, index) => (
          <View
            key={item}
            style={[
              styles.languageRow,
              getCurrentStepStyle(index, selectedLanguageIndex, reducedMotion),
              index === selectedLanguageIndex && styles.languageRowSelected,
              animatedStyle(styles.microLanguageHighlight, reducedMotion),
              animatedStyle(getMicroDelayStyle(index), reducedMotion)
            ]}
          >
            <View style={[styles.languageDot, index === 0 && styles.languageDotPrimary]} />
            <Text style={styles.languageText}>{item}</Text>
          </View>
        ))}
      </View>
      <View style={[styles.languageSampleBox, styles.demoPanelActive]}>
        <Text style={styles.languageSampleText}>{sampleSentences[selectedLanguageIndex]}</Text>
      </View>
      <Text style={styles.languageNote}>{t('landing.language.note', '정식 검수 전 1차 지원 언어로 가볍게 제공합니다.')}</Text>
    </View>
  );
}

function TrustMock({ demoPhase, reducedMotion, t }) {
  const activeTrustIndex = Math.min(demoPhase, 2);

  return (
    <View style={styles.trustCardsContainer}>
      <View style={[styles.mockCard, styles.trustCard, getCurrentStepStyle(0, activeTrustIndex, reducedMotion)]}>
        <View style={[styles.trustIconWrap, animatedStyle(styles.microTrustPulse, reducedMotion)]}><Text style={styles.trustIcon}>↔</Text></View>
        <View style={styles.trustCardContent}>
          <Text style={styles.trustCardTitle}>{t('landing.trust.item1', '기존 로그인/회원가입/라우팅 흐름 유지')}</Text>
          <Text style={styles.trustCardDesc}>{t('landing.trust.description1', '로그인, 회원가입, 화면 이동 구조를 무리 없이 이어갑니다.')}</Text>
        </View>
        <Text style={[styles.trustCheck, isPhaseReached(0, demoPhase, reducedMotion) && styles.trustCheckActive]}>✓</Text>
      </View>
      <View style={[styles.mockCard, styles.trustCard, getCurrentStepStyle(1, activeTrustIndex, reducedMotion)]}>
        <View style={[styles.trustIconWrap, animatedStyle(styles.microTrustPulse, reducedMotion), animatedStyle(styles.microDelay1, reducedMotion)]}><Text style={styles.trustIcon}>Aa</Text></View>
        <View style={styles.trustCardContent}>
          <Text style={styles.trustCardTitle}>{t('landing.trust.item2', '모션 민감 사용자를 위한 감소 설정 대응')}</Text>
          <Text style={styles.trustCardDesc}>{t('landing.trust.description2', '글자 크기, 고대비, 읽어주기 같은 접근성 흐름을 함께 고려합니다.')}</Text>
        </View>
        <Text style={[styles.trustCheck, isPhaseReached(1, demoPhase, reducedMotion) && styles.trustCheckActive]}>✓</Text>
      </View>
      <View style={[styles.mockCard, styles.trustCard, getCurrentStepStyle(2, activeTrustIndex, reducedMotion)]}>
        <View style={[styles.trustIconWrap, animatedStyle(styles.microTrustPulse, reducedMotion), animatedStyle(styles.microDelay2, reducedMotion)]}><Text style={styles.trustIcon}>API</Text></View>
        <View style={styles.trustCardContent}>
          <Text style={styles.trustCardTitle}>{t('landing.trust.item3', '백엔드 API 변경 없이 현재 기능 흐름 재사용')}</Text>
          <Text style={styles.trustCardDesc}>{t('landing.trust.description3', '현재 API 흐름을 유지하면서 소개 화면과 기능 예시를 안정적으로 확장합니다.')}</Text>
        </View>
        <Text style={[styles.trustCheck, isPhaseReached(2, demoPhase, reducedMotion) && styles.trustCheckActive]}>✓</Text>
      </View>
    </View>
  );
}

function SectionVisual({ demoPhase, reducedMotion, type, t }) {
  if (type === 'plan') return <PlanMock demoPhase={demoPhase} reducedMotion={reducedMotion} t={t} />;
  if (type === 'focus') return <FocusMock demoPhase={demoPhase} reducedMotion={reducedMotion} t={t} />;
  if (type === 'chat') return <ChatMock demoPhase={demoPhase} reducedMotion={reducedMotion} t={t} />;
  if (type === 'note') return <NoteMock demoPhase={demoPhase} reducedMotion={reducedMotion} t={t} />;
  if (type === 'report') return <ReportMock demoPhase={demoPhase} reducedMotion={reducedMotion} t={t} />;
  if (type === 'message') return <MessageMock demoPhase={demoPhase} reducedMotion={reducedMotion} t={t} />;
  if (type === 'community') return <CommunityMock demoPhase={demoPhase} reducedMotion={reducedMotion} t={t} />;
  if (type === 'coop') return <CoopMock demoPhase={demoPhase} reducedMotion={reducedMotion} t={t} />;
  if (type === 'reward') return <RewardMock demoPhase={demoPhase} reducedMotion={reducedMotion} t={t} />;
  if (type === 'language') return <LanguageMock demoPhase={demoPhase} reducedMotion={reducedMotion} t={t} />;
  return <TrustMock demoPhase={demoPhase} reducedMotion={reducedMotion} t={t} />;
}

function ProjectGroundedCopySection({ demoPhase, reducedMotion, t }) {
  return (
    <View style={styles.projectSection}>
      <SectionKeyword label="NOTES" style={[styles.bgSubtleKeyword, styles.bgNotes]} />
      <View style={styles.projectHeading}>
        <Text style={styles.sectionEyebrow}>{t('landing.projectNotes.eyebrow', 'DESIGN NOTES')}</Text>
        <Text style={styles.sectionTitle}>{t('landing.projectNotes.title', '사각사각이 학습을 여는 방식')}</Text>
        <Text style={styles.sectionDescription}>
          {t('landing.projectNotes.description', '초기 요구사항에서 출발한 학습 흐름을 실제 사용자가 바로 이해할 수 있는 기능 구조로 정리했습니다.')}
        </Text>
      </View>
      <DesignNotesRecordCards demoPhase={demoPhase} reducedMotion={reducedMotion} t={t} />
    </View>
  );
}

function ServiceSection({ demoPhase, reducedMotion, section, t }) {
  const reverse = section.layout === 'reverse';
  const center = section.layout === 'center';

  return (
    <View style={styles.newSection}>
      <SectionKeyword label={section.keyword} style={styles[`bg${section.id}`]} />
      <View style={[styles.newSectionInner, reverse && styles.newSectionInnerReverse, center && styles.newSectionInnerCenter]}>
        <View style={[styles.newTextCol, center && styles.newTextColCenter]}>
          <Text style={[styles.newSectionTitle, center && styles.textCenter]}>
            {section.titleKey ? t(section.titleKey, section.titleFallback) : section.titleFallback}
          </Text>
          <Text style={[styles.newSectionDesc, center && styles.textCenter]}>
            {section.descriptionKey ? t(section.descriptionKey, section.descriptionFallback) : section.descriptionFallback}
          </Text>
          <View style={styles.tagWrap}>
            <Text style={styles.tagText}>{section.chipKey ? t(section.chipKey, section.chipFallback) : section.chipFallback}</Text>
          </View>
        </View>
        <View style={[styles.newVisualCol, center && styles.newVisualColCenter]}>
          <SectionVisual demoPhase={demoPhase} reducedMotion={reducedMotion} t={t} type={section.visual} />
        </View>
      </View>
    </View>
  );
}

export default function ScrollStorySection({ onNavigate }) {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPromoPaused, setIsPromoPaused] = useState(false);
  const [promoTimerKey, setPromoTimerKey] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(getPrefersReducedMotion);
  const [demoPhaseIndex, setDemoPhaseIndex] = useState(DEMO_PHASE_SEQUENCE.indexOf(DEMO_FINAL_PHASE));
  const demoPhase = reducedMotion ? DEMO_FINAL_PHASE : DEMO_PHASE_SEQUENCE[demoPhaseIndex] ?? 0;

  useEffect(() => {
    const browserWindow = typeof globalThis !== 'undefined' ? globalThis.window : null;
    const mediaQuery = browserWindow?.matchMedia?.('(prefers-reduced-motion: reduce)');

    if (!mediaQuery) {
      return undefined;
    }

    const handleReducedMotionChange = (event) => {
      setReducedMotion(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleReducedMotionChange);
    } else {
      mediaQuery.addListener(handleReducedMotionChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleReducedMotionChange);
      } else {
        mediaQuery.removeListener(handleReducedMotionChange);
      }
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setDemoPhaseIndex(DEMO_PHASE_SEQUENCE.indexOf(DEMO_FINAL_PHASE));
      return undefined;
    }

    setDemoPhaseIndex(0);
    const timer = setInterval(() => {
      setDemoPhaseIndex((current) => (current + 1) % DEMO_PHASE_SEQUENCE.length);
    }, DEMO_PHASE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [reducedMotion]);

  useEffect(() => {
    if (isPromoPaused || reducedMotion) {
      return undefined;
    }

    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % promoSlides.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [isPromoPaused, promoTimerKey, reducedMotion]);

  const resetPromoTimer = () => {
    setPromoTimerKey((current) => current + 1);
  };

  const moveSlide = (direction) => {
    setActiveIndex((current) => (current + direction + promoSlides.length) % promoSlides.length);
    resetPromoTimer();
  };

  const selectSlide = (index) => {
    setActiveIndex(index);
    resetPromoTimer();
  };

  const moveToRegister = () => {
    onNavigate?.('register');
  };

  return (
    <View style={styles.story}>
      <PromoCarousel
        activeIndex={activeIndex}
        onCtaPress={moveToRegister}
        onNext={() => moveSlide(1)}
        onPauseChange={setIsPromoPaused}
        onPrevious={() => moveSlide(-1)}
        onSelect={selectSlide}
        t={t}
      />

      <ProjectGroundedCopySection demoPhase={demoPhase} reducedMotion={reducedMotion} t={t} />

      {serviceSections.map((section) => (
        <ServiceSection
          demoPhase={demoPhase}
          key={section.id}
          reducedMotion={reducedMotion}
          section={section}
          t={t}
        />
      ))}

      <View style={styles.finalCta}>
        <Text style={styles.finalCtaTitle}>{t('landing.final.title', '오늘의 공부를 사각사각 시작해 보세요')}</Text>
        <Text style={styles.finalCtaDescription}>
          {t('landing.final.description', '계획, 질문, 기록, 복습을 한 흐름으로 연결하는 나만의 학습 공간을 만들 수 있습니다.')}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={moveToRegister}
          style={(state) => [styles.finalCtaButton, ...interactiveStateStyles(state)]}
        >
          <Text style={styles.finalCtaButtonText}>지금 시작하기</Text>
        </Pressable>
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
    paddingHorizontal: 24,
    paddingTop: 28,
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
    paddingHorizontal: 20,
    marginBottom: 32,
    zIndex: 5
  },
  sectionEyebrow: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 12,
    textTransform: 'uppercase',
    includeFontPadding: false
  },
  sectionTitle: {
    color: colors.ink,
    fontWeight: '900',
    fontSize: 32,
    lineHeight: 41,
    letterSpacing: 0,
    maxWidth: 760,
    wordBreak: 'keep-all',
    overflowWrap: 'normal',
    includeFontPadding: false
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
    borderColor: 'rgba(23, 59, 99, 0.1)',
    marginBottom: 72,
    padding: 40,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 30,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#173B63',
    shadowOpacity: 0.1,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 }
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
    zIndex: 2,
    paddingLeft: 32,
    paddingRight: 16
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
    lineHeight: 52,
    fontWeight: '900',
    letterSpacing: 0,
    maxWidth: 580,
    wordBreak: 'keep-all',
    overflowWrap: 'normal',
    includeFontPadding: false
  },
  promoDescription: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 27,
    marginTop: 14,
    maxWidth: 500
  },
  promoDetailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 18,
    maxWidth: 520
  },
  promoDetailChip: {
    color: colors.blueDeep,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(23, 59, 99, 0.1)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden'
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
    top: '50%',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(23, 59, 99, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    shadowColor: '#173B63',
    shadowOpacity: 0.13,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    transform: [{ translateY: -23 }]
  },
  promoArrowLeft: {
    left: 18
  },
  promoArrowRight: {
    right: 18
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
    backgroundColor: 'rgba(23, 59, 99, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)'
  },
  promoDotActive: {
    width: 30,
    backgroundColor: colors.mintDeep,
    borderColor: colors.mintDeep
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
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(23, 59, 99, 0.1)',
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
    fontWeight: '900',
    wordBreak: 'keep-all',
    overflowWrap: 'normal'
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
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(23, 59, 99, 0.1)',
    shadowColor: '#173B63',
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 }
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
  projectSection: {
    width: '100%',
    maxWidth: 1180,
    position: 'relative',
    overflow: 'hidden',
    paddingVertical: 94,
    paddingHorizontal: 24,
    borderRadius: 32,
    backgroundColor: '#FFFDF6',
    borderWidth: 1,
    borderColor: 'rgba(23, 59, 99, 0.1)',
    marginBottom: 64,
    shadowColor: '#173B63',
    shadowOpacity: 0.07,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 }
  },
  projectHeading: {
    maxWidth: 720,
    marginBottom: 26,
    position: 'relative',
    zIndex: 5
  },
  projectCardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    position: 'relative',
    zIndex: 5
  },
  projectCard: {
    flex: 1,
    minWidth: 240,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(23, 59, 99, 0.1)',
    padding: 24
  },
  projectCardRule: {
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.mint,
    marginBottom: 18
  },
  projectCardTitle: {
    color: colors.ink,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '900',
    marginBottom: 10,
    wordBreak: 'keep-all',
    overflowWrap: 'normal'
  },
  projectCardDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600'
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
    minWidth: 248,
    minHeight: 182,
    padding: 25,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(23, 59, 99, 0.1)',
    backgroundColor: colors.surface
  },
  featureLabel: {
    alignSelf: 'flex-start',
    color: '#173B63',
    backgroundColor: '#E8FAF6',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 18,
    letterSpacing: 0.3,
    overflow: 'hidden'
  },
  featureTitle: {
    color: colors.ink,
    fontWeight: '900',
    fontSize: 18,
    lineHeight: 25,
    marginBottom: 10,
    letterSpacing: 0,
    wordBreak: 'keep-all',
    overflowWrap: 'normal'
  },
  featureDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22
  },
  newSection: {
    width: '100%',
    maxWidth: 1180,
    paddingVertical: 132,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden'
  },
  newSectionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    flexWrap: 'wrap',
    gap: 48,
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
    minWidth: 300,
    maxWidth: 520,
    zIndex: 10
  },
  newTextColCenter: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40
  },
  newVisualCol: {
    flex: 1,
    minWidth: 300,
    zIndex: 10,
    position: 'relative'
  },
  newVisualColCenter: {
    width: '100%',
    maxWidth: 600
  },
  textCenter: {
    textAlign: 'center',
    maxWidth: 760
  },
  newSectionTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#15202B',
    lineHeight: 52,
    marginBottom: 20,
    letterSpacing: 0,
    maxWidth: 560,
    wordBreak: 'keep-all',
    overflowWrap: 'normal',
    includeFontPadding: false
  },
  newSectionDesc: {
    fontSize: 18,
    color: '#475569',
    lineHeight: 28,
    marginBottom: 32
  },
  demoStepActive: {
    opacity: 1,
    transform: [{ translateY: 0 }, { scale: 1 }],
    transitionDuration: '560ms',
    transitionTimingFunction: 'ease-in-out'
  },
  demoStepWaiting: {
    opacity: 0.18,
    transform: [{ translateY: 12 }, { scale: 0.97 }],
    transitionDuration: '560ms',
    transitionTimingFunction: 'ease-in-out'
  },
  demoStepDimmed: {
    opacity: 0.34,
    transform: [{ translateY: 5 }, { scale: 0.985 }],
    transitionDuration: '560ms',
    transitionTimingFunction: 'ease-in-out'
  },
  demoCurrentStep: {
    borderColor: 'rgba(15, 118, 110, 0.32)',
    backgroundColor: '#E8FAF6',
    shadowColor: '#173B63',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    transform: [{ translateY: -3 }, { scale: 1.02 }],
    transitionDuration: '560ms',
    transitionTimingFunction: 'ease-in-out'
  },
  demoMiniActive: {
    borderColor: 'rgba(15, 118, 110, 0.32)',
    transform: [{ translateY: -4 }, { scale: 1.02 }],
    transitionDuration: '560ms',
    transitionTimingFunction: 'ease-in-out'
  },
  demoBadgeActive: {
    transform: [{ scale: 1.08 }]
  },
  demoPanelActive: {
    borderColor: 'rgba(15, 118, 110, 0.3)',
    backgroundColor: '#F1FDF9'
  },
  demoChipActive: {
    borderColor: 'rgba(15, 118, 110, 0.34)',
    backgroundColor: '#CDEFE9',
    transform: [{ translateY: -3 }, { scale: 1.03 }]
  },
  demoTextActive: {
    color: colors.mintDeep,
    transform: [{ scale: 1.04 }]
  },
  recordLogDotActive: {
    transform: [{ scale: 1.38 }]
  },
  recordLogTextActive: {
    color: colors.ink,
    fontWeight: '900'
  },
  recordStreakLive: {
    minWidth: 82,
    textAlign: 'center'
  },
  planTimeDotActive: {
    transform: [{ scale: 1.45 }]
  },
  planTimeTextActive: {
    color: colors.ink,
    fontWeight: '900'
  },
  focusTimerPhase0: {
    borderColor: '#BDE0FE'
  },
  focusTimerPhase1: {
    borderColor: '#CDEFE9',
    transform: [{ scale: 1.02 }]
  },
  focusTimerPhase2: {
    borderColor: '#73C9BD',
    transform: [{ scale: 1.05 }]
  },
  focusTimerPhase3: {
    borderColor: '#0F766E',
    transform: [{ scale: 1.07 }]
  },
  focusTimerPhase4: {
    borderColor: '#0B5F59',
    backgroundColor: '#E8FAF6',
    transform: [{ scale: 1.09 }]
  },
  focusBarFillActive: {
    backgroundColor: '#0F766E'
  },
  typingDotsRow: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    shadowColor: '#173B63',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  aiWaitRow: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#E8FAF6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 12
  },
  aiWaitText: {
    color: colors.mintDeep,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '900'
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: colors.mintDeep
  },
  languageRowSelected: {
    borderColor: 'rgba(15, 118, 110, 0.36)',
    backgroundColor: '#CDEFE9'
  },
  microDelay0: {
    animationDelay: '0s'
  },
  microDelay1: {
    animationDelay: '0.7s'
  },
  microDelay2: {
    animationDelay: '1.4s'
  },
  microDelay3: {
    animationDelay: '2.1s'
  },
  microDelay4: {
    animationDelay: '2.8s'
  },
  microDotPulse: {
    animationDuration: '6.6s',
    animationIterationCount: 'infinite',
    animationKeyframes: [
      {
        '0%': { opacity: 0.55, transform: 'scale(1)' },
        '22%': { opacity: 1, transform: 'scale(2.05)' },
        '44%': { opacity: 0.82, transform: 'scale(1.18)' },
        '72%': { opacity: 0.55, transform: 'scale(1)' },
        '100%': { opacity: 0.55, transform: 'scale(1)' }
      }
    ],
    animationTimingFunction: 'ease-in-out'
  },
  microBadgePulse: {
    animationDuration: '6.8s',
    animationIterationCount: 'infinite',
    animationKeyframes: [
      {
        '0%': { opacity: 1, transform: 'scale(1)' },
        '35%': { opacity: 0.82, transform: 'scale(1.1)' },
        '64%': { opacity: 1, transform: 'scale(1.03)' },
        '100%': { opacity: 0.65, transform: 'scale(1)' }
      }
    ],
    animationTimingFunction: 'ease-in-out'
  },
  microTimerPulse: {
    animationDuration: '7s',
    animationIterationCount: 'infinite',
    animationKeyframes: [
      {
        '0%': { borderColor: '#CDEFE9', transform: 'scale(0.96)' },
        '38%': { borderColor: '#0F766E', transform: 'scale(1.08)' },
        '68%': { borderColor: '#73C9BD', transform: 'scale(1)' },
        '100%': { borderColor: '#CDEFE9', transform: 'scale(0.96)' }
      }
    ],
    animationTimingFunction: 'ease-in-out'
  },
  microBarRise: {
    animationDuration: '7s',
    animationIterationCount: 'infinite',
    animationKeyframes: [
      {
        '0%': { opacity: 0.45, transform: 'scaleY(0.18)' },
        '36%': { opacity: 1, transform: 'scaleY(1.08)' },
        '68%': { opacity: 0.92, transform: 'scaleY(0.82)' },
        '100%': { opacity: 0.45, transform: 'scaleY(0.18)' }
      }
    ],
    animationTimingFunction: 'ease-in-out',
    transformOrigin: 'bottom center'
  },
  microBubbleLift: {
    animationDuration: '7.2s',
    animationIterationCount: 'infinite',
    animationKeyframes: [
      {
        '0%': { opacity: 0.38, transform: 'translateY(12px) scale(0.98)' },
        '28%': { opacity: 1, transform: 'translateY(0) scale(1)' },
        '76%': { opacity: 1, transform: 'translateY(-3px) scale(1)' },
        '100%': { opacity: 0.38, transform: 'translateY(12px) scale(0.98)' }
      }
    ],
    animationTimingFunction: 'ease-in-out'
  },
  microChipHighlight: {
    animationDuration: '6.8s',
    animationIterationCount: 'infinite',
    animationKeyframes: [
      {
        '0%': { opacity: 0.62, transform: 'translateY(0) scale(1)' },
        '26%': { opacity: 1, transform: 'translateY(-4px) scale(1.06)' },
        '54%': { opacity: 0.86, transform: 'translateY(0) scale(1.02)' },
        '100%': { opacity: 0.62, transform: 'translateY(0) scale(1)' }
      }
    ],
    animationTimingFunction: 'ease-in-out'
  },
  microBulletHighlight: {
    animationDuration: '7s',
    animationIterationCount: 'infinite',
    animationKeyframes: [
      {
        '0%': { backgroundColor: '#E8FAF6', transform: 'scale(1)' },
        '30%': { backgroundColor: '#73C9BD', transform: 'scale(1.16)' },
        '58%': { backgroundColor: '#CDEFE9', transform: 'scale(1.04)' },
        '100%': { backgroundColor: '#E8FAF6', transform: 'scale(1)' }
      }
    ],
    animationTimingFunction: 'ease-in-out'
  },
  microSummaryRow: {
    animationDuration: '7s',
    animationIterationCount: 'infinite',
    animationKeyframes: [
      {
        '0%': { opacity: 0.66, transform: 'translateX(0)' },
        '30%': { opacity: 1, transform: 'translateX(6px)' },
        '62%': { opacity: 0.84, transform: 'translateX(2px)' },
        '100%': { opacity: 0.66, transform: 'translateX(0)' }
      }
    ],
    animationTimingFunction: 'ease-in-out'
  },
  microStackFloat: {
    animationDuration: '7.4s',
    animationIterationCount: 'infinite',
    animationKeyframes: [
      {
        '0%': { opacity: 0.5 },
        '42%': { opacity: 0.92 },
        '100%': { opacity: 0.5 }
      }
    ],
    animationTimingFunction: 'ease-in-out'
  },
  microScorePulse: {
    animationDuration: '6.8s',
    animationIterationCount: 'infinite',
    animationKeyframes: [
      {
        '0%': { opacity: 0.65, transform: 'scale(1)' },
        '30%': { opacity: 1, transform: 'scale(1.14)' },
        '62%': { opacity: 0.86, transform: 'scale(1.04)' },
        '100%': { opacity: 0.72, transform: 'scale(1)' }
      }
    ],
    animationTimingFunction: 'ease-in-out'
  },
  microSoftGlow: {
    animationDuration: '7.4s',
    animationIterationCount: 'infinite',
    animationKeyframes: [
      {
        '0%': { backgroundColor: '#F8FAFC' },
        '42%': { backgroundColor: '#DDF8F3' },
        '72%': { backgroundColor: '#F1F9F7' },
        '100%': { backgroundColor: '#F8FAFC' }
      }
    ],
    animationTimingFunction: 'ease-in-out'
  },
  microUnreadPulse: {
    animationDuration: '6.6s',
    animationIterationCount: 'infinite',
    animationKeyframes: [
      {
        '0%': { opacity: 0.72, transform: 'scale(1)' },
        '32%': { opacity: 1, transform: 'scale(1.1)' },
        '62%': { opacity: 0.88, transform: 'scale(1.03)' },
        '100%': { opacity: 1, transform: 'scale(1)' }
      }
    ],
    animationTimingFunction: 'ease-in-out'
  },
  microMessageLift: {
    animationDuration: '7s',
    animationIterationCount: 'infinite',
    animationKeyframes: [
      {
        '0%': { opacity: 0.38, transform: 'translateY(12px)' },
        '28%': { opacity: 1, transform: 'translateY(0)' },
        '74%': { opacity: 1, transform: 'translateY(-3px)' },
        '100%': { opacity: 0.38, transform: 'translateY(12px)' }
      }
    ],
    animationTimingFunction: 'ease-in-out'
  },
  microProgressBreathe: {
    animationDuration: '7.2s',
    animationIterationCount: 'infinite',
    animationKeyframes: [
      {
        '0%': { opacity: 0.62, transform: 'scaleX(0.28)' },
        '42%': { opacity: 1, transform: 'scaleX(1.06)' },
        '72%': { opacity: 0.9, transform: 'scaleX(0.74)' },
        '100%': { opacity: 0.62, transform: 'scaleX(0.28)' }
      }
    ],
    animationTimingFunction: 'ease-in-out',
    transformOrigin: 'left center'
  },
  microRewardGlow: {
    animationDuration: '6.8s',
    animationIterationCount: 'infinite',
    animationKeyframes: [
      {
        '0%': { opacity: 0.68, transform: 'scale(1)' },
        '36%': { opacity: 1, transform: 'scale(1.16)' },
        '68%': { opacity: 0.88, transform: 'scale(1.04)' },
        '100%': { opacity: 0.68, transform: 'scale(1)' }
      }
    ],
    animationTimingFunction: 'ease-in-out'
  },
  microAvatarPulse: {
    animationDuration: '7s',
    animationIterationCount: 'infinite',
    animationKeyframes: [
      {
        '0%': { transform: 'scale(0.96)' },
        '42%': { transform: 'scale(1.12)' },
        '70%': { transform: 'scale(1.03)' },
        '100%': { transform: 'scale(0.96)' }
      }
    ],
    animationTimingFunction: 'ease-in-out'
  },
  microLanguageHighlight: {
    animationDuration: '7.2s',
    animationIterationCount: 'infinite',
    animationKeyframes: [
      {
        '0%': { backgroundColor: '#FFFFFF', transform: 'translateX(0) scale(1)' },
        '32%': { backgroundColor: '#CDEFE9', transform: 'translateX(8px) scale(1.025)' },
        '66%': { backgroundColor: '#E8FAF6', transform: 'translateX(2px) scale(1)' },
        '100%': { backgroundColor: '#FFFFFF', transform: 'translateX(0) scale(1)' }
      }
    ],
    animationTimingFunction: 'ease-in-out'
  },
  microTrustPulse: {
    animationDuration: '6.8s',
    animationIterationCount: 'infinite',
    animationKeyframes: [
      {
        '0%': { opacity: 0.72, transform: 'scale(1)' },
        '34%': { opacity: 1, transform: 'scale(1.13)' },
        '64%': { opacity: 0.9, transform: 'scale(1.04)' },
        '100%': { opacity: 0.72, transform: 'scale(1)' }
      }
    ],
    animationTimingFunction: 'ease-in-out'
  },
  tagWrap: {
    backgroundColor: 'rgba(92, 198, 184, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(92, 198, 184, 0.18)'
  },
  tagText: {
    color: '#0F766E',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.2
  },
  bgTitleText: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '46%',
    fontSize: 198,
    lineHeight: 220,
    fontWeight: '900',
    color: 'rgba(23, 59, 99, 0.08)',
    zIndex: 0,
    pointerEvents: 'none',
    textAlign: 'center',
    letterSpacing: 0,
    includeFontPadding: false
  },
  bgRecord: {
    top: '46%'
  },
  bgSubtleKeyword: {
    color: 'rgba(23, 59, 99, 0.045)',
    fontSize: 168,
    lineHeight: 190
  },
  bgScope: {
    top: 58
  },
  bgNotes: {
    top: 72
  },
  bgplan: {
    top: '50%'
  },
  bgfocus: {
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
  bgmessage: {
    top: '50%'
  },
  bgcommunity: {
    top: '50%'
  },
  bgcoop: {
    top: '50%'
  },
  bgreward: {
    top: '50%'
  },
  bglanguage: {
    top: '50%'
  },
  bgtrust: {
    top: '50%'
  },
  bgaccess: {
    top: '50%'
  },
  mockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 32,
    shadowColor: '#173B63',
    shadowOpacity: 0.14,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 18 },
    borderWidth: 1,
    borderColor: 'rgba(23, 59, 99, 0.08)'
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
    color: '#15202B',
    wordBreak: 'keep-all',
    overflowWrap: 'normal'
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
  focusMock: {
    borderColor: '#CDEFE9',
    borderWidth: 2,
    backgroundColor: '#F8FFFD',
    minHeight: 300
  },
  focusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    flexWrap: 'wrap',
    marginBottom: 24
  },
  focusTimerCircle: {
    width: 136,
    height: 136,
    borderRadius: 68,
    borderWidth: 12,
    borderColor: '#73C9BD',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#173B63',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    transitionDuration: '620ms',
    transitionTimingFunction: 'ease-in-out'
  },
  focusTimerValue: {
    color: '#173B63',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900'
  },
  focusTimerLabel: {
    color: '#0F766E',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    marginTop: 6
  },
  focusSummaryStack: {
    flex: 1,
    minWidth: 170
  },
  focusSummaryLabel: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    marginBottom: 6
  },
  focusSummaryValue: {
    color: '#173B63',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
    marginBottom: 12
  },
  focusStreakChip: {
    alignSelf: 'flex-start',
    color: '#0F766E',
    backgroundColor: '#E8FAF6',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
    overflow: 'hidden'
  },
  focusBarGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
    minHeight: 110,
    marginBottom: 16
  },
  focusBarItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8
  },
  focusBarTrack: {
    width: '100%',
    maxWidth: 34,
    height: 84,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    justifyContent: 'flex-end'
  },
  focusBarFill: {
    width: '100%',
    backgroundColor: '#73C9BD',
    borderRadius: 999,
    transitionDuration: '680ms',
    transitionProperty: 'height, opacity, background-color',
    transitionTimingFunction: 'ease-in-out'
  },
  focusBarLabel: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '900'
  },
  focusSavedBox: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.16)',
    padding: 14
  },
  focusSavedText: {
    color: '#173B63',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
    textAlign: 'center'
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
  chatUserBubbleFollowup: {
    marginBottom: 12,
    backgroundColor: '#173B63'
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
  chatAiBubbleFollowup: {
    maxWidth: '94%',
    marginTop: 2
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
  chatBtnCream: {
    backgroundColor: '#FFF5D6'
  },
  chatBtnCreamText: {
    color: '#A15C00'
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
    height: 372,
    position: 'relative'
  },
  reportCardBg1: {
    position: 'absolute',
    top: 18,
    left: 18,
    right: 0,
    height: 350,
    backgroundColor: '#E8FAF6',
    opacity: 0.75,
    transform: [{ rotate: '-2deg' }]
  },
  reportCardBg2: {
    position: 'absolute',
    top: 34,
    left: 34,
    right: -10,
    height: 350,
    backgroundColor: '#FFF5D6',
    opacity: 0.7,
    transform: [{ rotate: '2deg' }]
  },
  reportCardMain: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    minHeight: 350,
    zIndex: 10
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 14,
    marginBottom: 14,
    gap: 12
  },
  reportTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#15202B',
    wordBreak: 'keep-all',
    overflowWrap: 'normal'
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
  reportAnalysisRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(23, 59, 99, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10
  },
  reportAnalysisCopy: {
    flex: 1,
    gap: 3
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
  reportDetailText: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800'
  },
  reportReason: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginTop: 2,
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.12)'
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
  messageMock: {
    borderColor: '#BDE0FE',
    borderWidth: 2,
    backgroundColor: '#F0F8FF'
  },
  messageScore: {
    color: '#173B63',
    fontSize: 15
  },
  communityMock: {
    borderColor: '#CDEFE9',
    borderWidth: 2,
    backgroundColor: '#F8FFFD'
  },
  communityScore: {
    color: '#0F766E',
    fontSize: 15
  },
  communityActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14
  },
  communityPostPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.16)',
    padding: 14,
    marginBottom: 14
  },
  communityPostTitle: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '900',
    marginBottom: 7
  },
  communityPostComment: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800'
  },
  communityActionPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(23, 59, 99, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  communityActionText: {
    color: '#173B63',
    fontSize: 13,
    fontWeight: '900'
  },
  socialStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14
  },
  socialStatusText: {
    color: '#173B63',
    backgroundColor: '#E8FAF6',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 13,
    fontWeight: '900',
    overflow: 'hidden'
  },
  socialUnreadPill: {
    color: '#0F766E',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 13,
    fontWeight: '900',
    overflow: 'hidden'
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
  friendAvatarCream: {
    backgroundColor: '#FFE4B5'
  },
  messageBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginBottom: 10
  },
  messageBubbleRowRight: {
    justifyContent: 'flex-end'
  },
  messageBubble: {
    flex: 1,
    maxWidth: '82%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderBottomLeftRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(23, 59, 99, 0.08)',
    shadowColor: '#173B63',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  messageBubbleMint: {
    backgroundColor: '#E8FAF6',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 5
  },
  messageBubbleCream: {
    backgroundColor: '#FFF5D6'
  },
  messageAuthor: {
    color: '#0F766E',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    marginBottom: 3
  },
  messageBubbleText: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '800'
  },
  socialFooterText: {
    color: '#173B63',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '800',
    marginTop: 2
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
    borderRadius: 8,
    transitionDuration: '720ms',
    transitionProperty: 'width, opacity',
    transitionTimingFunction: 'ease-in-out'
  },
  coopContributionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14
  },
  coopContributionChip: {
    color: '#7F1D1D',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.14)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    overflow: 'hidden'
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
    borderColor: '#73C9BD',
    alignItems: 'center',
    justifyContent: 'center',
    transitionDuration: '640ms',
    transitionTimingFunction: 'ease-in-out'
  },
  rewardAvatarInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    opacity: 0.72
  },
  rewardAvatarInnerActive: {
    backgroundColor: '#173B63',
    shadowColor: '#FFE4B5',
    shadowOpacity: 0.42,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    transform: [{ scale: 1.26 }]
  },
  rewardCopy: {
    flex: 1
  },
  rewardItemRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 2
  },
  rewardItemChip: {
    color: '#A15C00',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(161, 92, 0, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    overflow: 'hidden'
  },
  languageMock: {
    borderColor: '#CDEFE9',
    borderWidth: 2,
    backgroundColor: '#F8FFFD'
  },
  languageScore: {
    color: '#0F766E',
    fontSize: 16
  },
  languageList: {
    gap: 10
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(23, 59, 99, 0.08)',
    transitionDuration: '580ms',
    transitionTimingFunction: 'ease-in-out'
  },
  languageDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#BDE0FE'
  },
  languageDotPrimary: {
    backgroundColor: colors.mintDeep
  },
  languageText: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
    flex: 1
  },
  languageNote: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
    marginTop: 14
  },
  languageSampleBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.18)',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
    transitionDuration: '580ms',
    transitionTimingFunction: 'ease-in-out'
  },
  languageSampleText: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '900'
  },
  trustCardsContainer: {
    gap: 16
  },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20
  },
  trustCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    color: '#94A3B8',
    backgroundColor: '#F1F5F9',
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 14,
    fontWeight: '900',
    overflow: 'hidden'
  },
  trustCheckActive: {
    color: '#FFFFFF',
    backgroundColor: colors.mintDeep,
    transform: [{ scale: 1.04 }],
    transitionDuration: '520ms',
    transitionTimingFunction: 'ease-in-out'
  },
  trustIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#E8FAF6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  trustIcon: {
    color: '#173B63',
    fontSize: 15,
    fontWeight: '900'
  },
  trustCardContent: {
    flex: 1
  },
  trustCardTitle: {
    color: colors.ink,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '900',
    marginBottom: 4,
    wordBreak: 'keep-all',
    overflowWrap: 'normal'
  },
  trustCardDesc: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600'
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
  },
  finalCta: {
    width: '100%',
    maxWidth: 1180,
    borderRadius: 32,
    backgroundColor: '#173B63',
    paddingVertical: 60,
    paddingHorizontal: 28,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#173B63',
    shadowOpacity: 0.18,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 16 }
  },
  finalCtaTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 44,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0,
    wordBreak: 'keep-all',
    overflowWrap: 'normal',
    includeFontPadding: false
  },
  finalCtaDescription: {
    color: '#D7E7F4',
    fontSize: 16,
    lineHeight: 25,
    maxWidth: 620,
    textAlign: 'center',
    marginTop: 14
  },
  finalCtaButton: {
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: colors.mint,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24
  },
  finalCtaButtonText: {
    color: '#173B63',
    fontSize: 15,
    fontWeight: '900'
  }
});
