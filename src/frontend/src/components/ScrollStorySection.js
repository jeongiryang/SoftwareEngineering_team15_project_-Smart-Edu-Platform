import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../i18n';
import { colors, interactiveStateStyles, shadows } from '../styles/theme';

const icon = require('../assets/sagaksagak-app-icon.png');

const promoSlides = [
  {
    id: 'open',
    labelKey: 'landing.promo.1.label',
    titleKey: 'landing.promo.1.title',
    descriptionKey: 'landing.promo.1.description',
    ctaKey: 'landing.promo.1.cta',
    labelFallback: 'SERVICE OPEN',
    titleFallback: '사각사각 정식 오픈',
    descriptionFallback: '계획과 질문, 복습 기록을 한 흐름으로 이어보세요.',
    ctaFallback: '지금 시작하기',
    mood: 'mint'
  },
  {
    id: 'ai',
    labelKey: 'landing.promo.2.label',
    titleKey: 'landing.promo.2.title',
    descriptionKey: 'landing.promo.2.description',
    ctaKey: 'landing.promo.2.cta',
    labelFallback: 'AI STUDY',
    titleFallback: '질문을 이해하는 학습 파트너',
    descriptionFallback: '단순 답변이 아니라 요약과 오답 점검까지 이어갑니다.',
    ctaFallback: '기능 보기',
    mood: 'blue'
  },
  {
    id: 'record',
    labelKey: 'landing.promo.3.label',
    titleKey: 'landing.promo.3.title',
    descriptionKey: 'landing.promo.3.description',
    ctaKey: 'landing.promo.3.cta',
    labelFallback: 'RECORD',
    titleFallback: '하루의 공부 기록',
    descriptionFallback: '오늘의 일정, 질문, 복습 힌트를 나만의 기록으로 남깁니다.',
    ctaFallback: '기록 시작하기',
    mood: 'cream'
  },
  {
    id: 'early',
    labelKey: 'landing.promo.4.label',
    titleKey: 'landing.promo.4.title',
    descriptionKey: 'landing.promo.4.description',
    ctaKey: 'landing.promo.4.cta',
    labelFallback: 'EARLY ACCESS',
    titleFallback: '초기 사용자 학습 루틴',
    descriptionFallback: '지금 가입하고 사각사각의 핵심 학습 흐름을 먼저 경험하세요.',
    ctaFallback: '체험하기',
    mood: 'blue'
  }
];

const availableFeatureKeys = [
  ['landing.feature.ai.label', 'landing.feature.ai.title', 'landing.feature.ai.description', 'AI 학습', '질문부터 오답 분석까지', '질문, 추천, 요약, 오답 분석 흐름을 한 화면에서 이어갑니다.'],
  ['landing.feature.plan.label', 'landing.feature.plan.title', 'landing.feature.plan.description', '일정/칸반', '계획과 태스크를 함께 관리', '학습 일정과 칸반 보드로 오늘 해야 할 일을 정리합니다.'],
  ['landing.feature.timer.label', 'landing.feature.timer.title', 'landing.feature.timer.description', '집중 타이머 & 통계', '25분 집중부터 주간 통계까지', '집중 타이머로 학습 시간을 재고, 주간 집중 통계로 나만의 학습 패턴을 파악하세요.'],
  ['landing.feature.community.label', 'landing.feature.community.title', 'landing.feature.community.description', '커뮤니티', '게시글과 댓글로 학습 공유', '질문과 기록을 나누고 반응, 북마크, 신고 흐름을 사용할 수 있습니다.'],
  ['landing.feature.coop.label', 'landing.feature.coop.title', 'landing.feature.coop.description', '보스 레이드 & 쿠스트', '팀원과 함께 목표를 달성', '보스 레이드에 파티를 맞쳐 참여하고, 협동 쿠스트로 함께 포인트를 받으세요.'],
  ['landing.feature.shop.label', 'landing.feature.shop.title', 'landing.feature.shop.description', '포인트 상점', '달성한 만큼 프로필을 꽈미고', '쿠스트와 보스 레이드로 모은 포인트로 프로필 이미지, 배경, 배지를 업데이트하세요.']
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
    id: 'question',
    keyword: 'ASK',
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
    id: 'social',
    keyword: 'SOCIAL',
    titleFallback: '함께 공부하는 학습 커뮤니티',
    descriptionFallback: '혼자 하는 공부의 외로움을 넘어서, 친구들과 실시간 쪽지를 나누고 접속 상태를 확인하며 동기부여를 얻으세요.',
    chipFallback: '커뮤니티',
    layout: 'row',
    visual: 'social'
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
        <Text style={styles.promoLabel}>{t(slide.labelKey, slide.labelFallback)}</Text>
        <Text style={styles.promoTitle}>{t(slide.titleKey, slide.titleFallback)}</Text>
        <Text style={styles.promoDescription}>{t(slide.descriptionKey, slide.descriptionFallback)}</Text>
        <View style={styles.promoCta}>
          <Text style={styles.promoCtaText}>{t(slide.ctaKey, slide.ctaFallback)}</Text>
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
      <Text style={styles.sectionTitle}>{t(titleKey, '사각사각이 학습을 여는 방식')}</Text>
      <Text style={styles.sectionDescription}>{t(descriptionKey, '조용한 기록, 다정한 피드백, 반복되는 복습을 한 페이지에서 이어갑니다.')}</Text>
    </View>
  );
}

function RecordSection({ t }) {
  const rows = [
    '자료구조 DFS 복습 완료 · 42분',
    '미적분 문제풀이 · 1시간 10분',
    '영어 단어 암기 · 25분',
    '오늘 질문 3개 / 요약 2개 저장'
  ];

  return (
    <View style={styles.revealSection}>
      <SectionKeyword label="RECORD" style={styles.bgRecord} />
      <SectionHeading
        descriptionKey="landing.reveal.description"
        eyebrow="OPENING NOTES"
        titleKey="landing.reveal.title"
        t={t}
      />
      <View style={styles.recordExperience}>
        <View style={[styles.recordMainCard, shadows.card]}>
          <View style={styles.recordHeaderRow}>
            <Text style={styles.recordCardTitle}>오늘의 학습 기록</Text>
            <Text style={styles.recordStreak}>연속 5일째</Text>
          </View>
          {rows.map((item, index) => (
            <View key={item} style={styles.recordLogRow}>
              <View style={[styles.recordLogDot, index === 1 && styles.recordLogDotWarm]} />
              <Text style={styles.recordLogText}>{item}</Text>
            </View>
          ))}
        </View>
        <View style={styles.recordSideStack}>
          <View style={[styles.recordMiniCard, styles.recordMiniCardMint]}>
            <Text style={styles.recordMiniLabel}>Opening Notes</Text>
            <Text style={styles.recordMiniValue}>05/28</Text>
            <Text style={styles.recordMiniText}>학습 목표와 오늘의 기록을 한눈에 정리합니다.</Text>
          </View>
          <View style={[styles.recordMiniCard, styles.recordMiniCardCream]}>
            <Text style={styles.recordMiniLabel}>Saved Questions</Text>
            <Text style={styles.recordMiniValue}>3</Text>
            <Text style={styles.recordMiniText}>질문과 요약을 다시 볼 수 있게 모아둡니다.</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function FeatureGridSection({ t }) {
  return (
    <View style={styles.availableSection}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionEyebrow}>AVAILABLE NOW</Text>
        <Text style={styles.sectionTitle}>{t('landing.section.available.title', '지금 연결된 학습 도구')}</Text>
        <Text style={styles.sectionDescription}>
          {t('landing.section.available.description', '현재 구현된 API와 연결된 기능만 안내합니다.')}
        </Text>
      </View>
      <View style={styles.featureGrid}>
        {availableFeatureKeys.map(([labelKey, titleKey, descriptionKey, labelFallback, titleFallback, descriptionFallback]) => {
          const label = t(labelKey, labelFallback);
          const title = t(titleKey, titleFallback);

          return (
            <Pressable
              accessibilityLabel={`${label}: ${title}`}
              accessibilityRole="text"
              key={titleKey}
              style={(state) => [
                styles.featureCard,
                shadows.card,
                ...interactiveStateStyles(state, { kind: 'card' })
              ]}
            >
              <Text style={styles.featureLabel}>{label}</Text>
              <Text style={styles.featureTitle}>{title}</Text>
              <Text style={styles.featureDescription}>{t(descriptionKey, descriptionFallback)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function PlanMock({ t }) {
  const rows = [
    t('landing.story.plan.previewItem1', '09:00 자료구조 복습'),
    t('landing.story.plan.previewItem2', '14:00 알고리즘 과제'),
    t('landing.story.plan.previewItem3', '20:00 오답 노트 정리')
  ];

  return (
    <View style={[styles.mockCard, styles.planMock]}>
      <View style={styles.planHeader}>
        <Text style={styles.planMonth}>{t('landing.story.plan.previewTitle', '오늘의 학습 일정')}</Text>
        <View style={styles.planDday}><Text style={styles.planDdayText}>D-12</Text></View>
      </View>
      <View style={styles.planTimeline}>
        {rows.map((item, index) => (
          <View key={item} style={styles.planTimeItem}>
            <View style={[styles.planTimeDot, index === 1 && styles.planTimeDotWarm, index === 2 && styles.planTimeDotBlue]} />
            <Text style={styles.planTimeText}>{item}</Text>
          </View>
        ))}
      </View>
      <View style={styles.planPriorityBox}>
        <Text style={styles.planPriorityTitle}>{t('landing.story.plan.previewMeta', '중간고사 D-12')}</Text>
        <Text style={styles.planPriorityText}>오늘 할 일을 정리하고 우선순위를 확인합니다.</Text>
      </View>
    </View>
  );
}

function ChatMock({ t }) {
  return (
    <View style={[styles.mockCard, styles.chatMock]}>
      <View style={styles.chatUserBubble}>
        <Text style={styles.chatUserText}>{t('landing.story.ai.previewItem1', '이 개념을 한 문단으로 요약해줘')}</Text>
      </View>
      <View style={styles.chatAiBubble}>
        <Text style={styles.chatAiText}>막히는 부분을 질문하면 요약과 복습 힌트로 이어집니다.</Text>
        <View style={styles.chatActions}>
          <View style={styles.chatBtn}><Text style={styles.chatBtnText}>요약하기</Text></View>
          <View style={[styles.chatBtn, styles.chatBtnMuted]}><Text style={[styles.chatBtnText, styles.chatBtnMutedText]}>다시 보기</Text></View>
          <View style={[styles.chatBtn, styles.chatBtnCream]}><Text style={[styles.chatBtnText, styles.chatBtnCreamText]}>예시 보기</Text></View>
        </View>
      </View>
    </View>
  );
}

function NoteMock({ t }) {
  const bullets = [
    '미분 = 순간 변화율',
    '도함수 = 접선의 기울기',
    '적분 = 누적량',
    '기본정리 = 미분·적분 연결'
  ];

  return (
    <View style={[styles.mockCard, styles.noteMock]}>
      <View style={styles.noteBadge}><Text style={styles.noteBadgeText}>AI 요약 완료</Text></View>
      <Text style={styles.noteTitle}>수학 미적분 핵심 개념</Text>
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
          <Text style={styles.reportLabel}>내 답안</Text>
          <Text style={styles.reportWrong}>4</Text>
        </View>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>정답</Text>
          <Text style={styles.reportCorrect}>2</Text>
        </View>
        <View style={styles.reportReason}>
          <Text style={styles.reportReasonTitle}>틀린 이유</Text>
          <Text style={styles.reportReasonText}>조건식을 반대로 해석해 탐색 순서를 잘못 판단했습니다.</Text>
        </View>
      </View>
    </View>
  );
}

function SocialMock({ t }) {
  return (
    <View style={[styles.mockCard, styles.simpleMockCard, styles.socialMock]}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportTitle}>실시간 쪽지함</Text>
        <Text style={[styles.reportScore, styles.socialScore]}>WebSocket</Text>
      </View>
      <View style={styles.friendRow}><View style={styles.friendAvatar} /><Text style={styles.reportLabel}>친구가 오늘 목표를 시작했어요.</Text></View>
      <View style={styles.friendRow}><View style={[styles.friendAvatar, styles.friendAvatarMint]} /><Text style={styles.reportLabel}>대화에서 학습 응원을 주고받습니다.</Text></View>
    </View>
  );
}

function CoopMock({ t }) {
  return (
    <View style={[styles.mockCard, styles.simpleMockCard, styles.coopMock]}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportTitle}>중간고사 집중 레이드</Text>
        <Text style={styles.reportScore}>HP 진행률</Text>
      </View>
      <View style={styles.raidProgressBar}>
        <View style={[styles.raidProgressFill, { width: '55%' }]} />
      </View>
      <Text style={styles.raidProgressText}>남은 HP 45% · 팀 기여도 반영 중</Text>
    </View>
  );
}

function RewardMock({ t }) {
  return (
    <View style={[styles.mockCard, styles.simpleMockCard, styles.rewardMock]}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportTitle}>포인트 상점</Text>
        <Text style={[styles.reportScore, styles.rewardScore]}>4,200P</Text>
      </View>
      <View style={styles.rewardPreviewRow}>
        <View style={styles.rewardAvatarPreview} />
        <View style={styles.rewardCopy}>
          <Text style={styles.reportLabel}>프로필 이미지 · 배경 · 칭호</Text>
          <Text style={styles.raidProgressText}>학습 성취를 프로필 꾸미기로 이어갑니다.</Text>
        </View>
      </View>
    </View>
  );
}

function TrustMock({ t }) {
  return (
    <View style={styles.trustCardsContainer}>
      <View style={[styles.mockCard, styles.trustCard]}>
        <View style={styles.trustIconWrap}><Text style={styles.trustIcon}>↔</Text></View>
        <View style={styles.trustCardContent}>
          <Text style={styles.trustCardTitle}>{t('landing.trust.item1', '기존 로그인/회원가입/라우팅 흐름 유지')}</Text>
          <Text style={styles.trustCardDesc}>{t('landing.trust.description1', '로그인, 회원가입, 화면 이동 구조를 무리 없이 이어갑니다.')}</Text>
        </View>
      </View>
      <View style={[styles.mockCard, styles.trustCard]}>
        <View style={styles.trustIconWrap}><Text style={styles.trustIcon}>Aa</Text></View>
        <View style={styles.trustCardContent}>
          <Text style={styles.trustCardTitle}>{t('landing.trust.item2', '모션 민감 사용자를 위한 감소 설정 대응')}</Text>
          <Text style={styles.trustCardDesc}>{t('landing.trust.description2', '글자 크기, 고대비, 읽어주기 같은 접근성 흐름을 함께 고려합니다.')}</Text>
        </View>
      </View>
      <View style={[styles.mockCard, styles.trustCard]}>
        <View style={styles.trustIconWrap}><Text style={styles.trustIcon}>API</Text></View>
        <View style={styles.trustCardContent}>
          <Text style={styles.trustCardTitle}>{t('landing.trust.item3', '백엔드 API 변경 없이 현재 기능 흐름 재사용')}</Text>
          <Text style={styles.trustCardDesc}>{t('landing.trust.description3', '현재 API 흐름을 유지하면서 소개 화면과 기능 예시를 안정적으로 확장합니다.')}</Text>
        </View>
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
  return <TrustMock t={t} />;
}

function ProjectGroundedCopySection() {
  const cards = [
    ['계획은 작게, 실행은 분명하게', '캘린더와 칸반으로 오늘 할 일을 나누고, D-Day와 집중 시간으로 학습 리듬을 확인합니다.'],
    ['AI는 답변보다 복습 흐름으로', '질문, 요약, 오답노트, 추천, 퀴즈가 다시 볼 기록으로 남아 다음 학습을 준비합니다.'],
    ['모두가 쓰는 학습 공간', '큰 글씨, 고대비, TTS/STT, 커뮤니티와 보상 흐름까지 고려해 이어 쓸 수 있게 설계했습니다.']
  ];

  return (
    <View style={styles.projectSection}>
      <View style={styles.projectHeading}>
        <Text style={styles.sectionEyebrow}>PROJECT NOTES</Text>
        <Text style={styles.sectionTitle}>회의록과 설계 문서에서 이어진 사각사각의 방향</Text>
        <Text style={styles.sectionDescription}>
          요구사항과 설계 문서에는 사각사각이 전 연령층을 위한 개인화 학습 관리 앱으로, 일정·칸반·AI 학습·커뮤니티·접근성·보상을 하나의 학습 흐름으로 연결해야 한다고 정리되어 있습니다.
        </Text>
      </View>
      <View style={styles.projectCardGrid}>
        {cards.map(([title, description]) => (
          <View key={title} style={[styles.projectCard, shadows.card]}>
            <View style={styles.projectCardRule} />
            <Text style={styles.projectCardTitle}>{title}</Text>
            <Text style={styles.projectCardDescription}>{description}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ServiceSection({ section, t }) {
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
          <SectionVisual t={t} type={section.visual} />
        </View>
      </View>
    </View>
  );
}

export default function ScrollStorySection() {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);

  const moveSlide = (direction) => {
    setActiveIndex((current) => (current + direction + promoSlides.length) % promoSlides.length);
  };

  return (
    <View style={styles.story}>
      <PromoCarousel
        activeIndex={activeIndex}
        onNext={() => moveSlide(1)}
        onPrevious={() => moveSlide(-1)}
        onSelect={setActiveIndex}
        t={t}
      />

      <RecordSection t={t} />

      <FeatureGridSection t={t} />

      <ProjectGroundedCopySection />

      {serviceSections.map((section) => (
        <ServiceSection
          key={section.id}
          section={section}
          t={t}
        />
      ))}

      <View style={styles.finalCta}>
        <Text style={styles.finalCtaTitle}>{t('landing.final.title', '오늘의 공부를 사각사각 시작해 보세요')}</Text>
        <Text style={styles.finalCtaDescription}>
          {t('landing.final.description', '계획, 질문, 기록, 복습을 한 흐름으로 연결하는 나만의 학습 공간을 만들 수 있습니다.')}
        </Text>
        <View style={styles.finalCtaButton}>
          <Text style={styles.finalCtaButtonText}>지금 시작하기</Text>
        </View>
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
  projectSection: {
    width: '100%',
    maxWidth: 1180,
    paddingVertical: 94,
    paddingHorizontal: 18,
    borderRadius: 32,
    backgroundColor: '#FFFDF6',
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 64
  },
  projectHeading: {
    maxWidth: 720,
    marginBottom: 26
  },
  projectCardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  projectCard: {
    flex: 1,
    minWidth: 240,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.line,
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
    marginBottom: 10
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
  bgtrust: {
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
  trustCardsContainer: {
    gap: 16
  },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20
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
    marginBottom: 4
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
    marginTop: 24
  },
  finalCtaTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 44,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0
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
