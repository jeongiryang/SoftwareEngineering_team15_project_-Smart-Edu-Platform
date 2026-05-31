import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../i18n';
import { colors, interactiveStateStyles, shadows } from '../styles/theme';
import { readIntroAutoPlayEnabled } from '../constants/introPreference';

const icon = require('../assets/sagaksagak-app-icon.png');
const GITHUB_REPOSITORY_URL = 'https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform';
const GITHUB_ICON_COLOR = '#24292f';
const BGM_ENABLED_STORAGE_KEY = 'sagakLandingBgmEnabled';
const INTRO_DURATION_MS = 8600;
const INTRO_WRITE_START_SECONDS = 4.62;
const INTRO_WRITE_DURATION_SECONDS = 3.36;
const pencilCursorSvg = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
    <g transform="translate(44 0) scale(-1 1)">
      <g transform="rotate(-35 22 22)">
        <rect x="8" y="18" width="23" height="8" rx="3" fill="#73C9BD" stroke="#173B63" stroke-width="2"/>
        <rect x="4" y="18" width="6" height="8" rx="2" fill="#F3D4A0" stroke="#173B63" stroke-width="2"/>
        <path d="M31 18L40 22L31 26Z" fill="#FFF1D9" stroke="#173B63" stroke-width="2"/>
        <path d="M38 21L42 22L38 23Z" fill="#183246"/>
      </g>
    </g>
  </svg>`
);
const pencilCursorImage = `data:image/svg+xml,${pencilCursorSvg}`;
const githubSvgStyle = {
  display: 'block',
  flexShrink: 0
};

const webLandingAnimationCss = `
@keyframes sagakIntroRise {
  0% { transform: translateY(22px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

@keyframes sagakIntroOut {
  0%, 96% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-18px); pointer-events: none; }
}

@keyframes sagakIntroParticleAssemble {
  0%, 5% {
    opacity: 0;
    transform: translate3d(var(--scatter-x), var(--scatter-y), 0) scale(0.45);
  }
  18% { opacity: 0.74; }
  35%, 53% {
    opacity: 0.98;
    transform: translate3d(0, 0, 0) scale(1);
  }
  55%, 100% {
    opacity: 0;
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes sagakIntroTrace {
  0%, 53.6% { opacity: 0; }
  53.8%, 95% { opacity: 0.96; }
  100% { opacity: 0; }
}

@keyframes sagakIntroSolidPencil {
  0%, 53.2% { opacity: 0; }
  53.7%, 95% { opacity: 1; }
  100% { opacity: 0; }
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

[data-sagak-story-section="true"] {
  min-height: 100vh;
  scroll-snap-align: start;
}

[data-sagak-intro-screen="true"] {
  animation: sagakIntroOut ${INTRO_DURATION_MS}ms ease-in-out both;
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100dvh !important;
  z-index: 2147483647 !important;
}

.sagak-pencil-interactive,
.sagak-pencil-interactive *,
.sagak-hover-zoom,
.sagak-hover-zoom *,
.sagak-landing-scroll button,
.sagak-landing-scroll button *,
.sagak-landing-scroll [role="button"],
.sagak-landing-scroll [role="button"] *,
.sagak-landing-scroll [role="link"],
.sagak-landing-scroll [role="link"] *,
.sagak-landing-scroll [role="switch"],
.sagak-landing-scroll [role="switch"] *,
.sagak-landing-scroll a,
.sagak-landing-scroll a *,
.sagak-header-visible button,
.sagak-header-visible button *,
.sagak-header-visible [role="button"],
.sagak-header-visible [role="button"] *,
.language-dropdown,
.language-dropdown * {
  cursor: none !important;
}

.keyword-bg {
  font-size: clamp(140px, 22vw, 360px) !important;
  z-index: 40 !important;
  color: rgba(67, 73, 81, 0.48) !important;
  -webkit-text-stroke: 0;
  text-shadow: none;
  mix-blend-mode: multiply;
}

.keyword-section,
.report-section,
.trust-section {
  isolation: isolate;
}

.sagak-hover-zoom {
  transition: transform 420ms cubic-bezier(.2, .72, .25, 1), box-shadow 420ms ease-out;
  transform-origin: center center;
  will-change: transform;
}

.sagak-hover-zoom:hover,
.sagak-hover-zoom:focus-within {
  transform: translateY(-5px) scale(1.06);
  box-shadow: 0 24px 54px rgba(21, 32, 43, 0.15);
}

.sagak-pencil-follower {
  position: fixed;
  left: 0;
  top: 0;
  width: 34px;
  height: 34px;
  z-index: 2147483646;
  opacity: 0;
  pointer-events: none;
  transition: transform 120ms cubic-bezier(.2, .72, .25, 1), opacity 140ms ease-out;
  will-change: transform, opacity;
}

.sagak-pencil-follower img {
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0.92;
  filter: drop-shadow(0 6px 7px rgba(23, 59, 99, 0.18));
}

.value-keyword-scroll-section {
  background:
    radial-gradient(circle at center, rgba(80, 180, 160, 0.10), transparent 42%),
    linear-gradient(180deg, #061522 0%, #081827 52%, #061522 100%);
}

.value-keyword-scene {
  position: sticky !important;
  top: 0;
  height: 100dvh;
}

.value-keyword {
  font-size: clamp(48px, 10vw, 140px) !important;
  will-change: opacity, transform, filter;
  letter-spacing: 0;
}

.sagak-intro-particle {
  animation: sagakIntroParticleAssemble ${INTRO_DURATION_MS}ms cubic-bezier(.2, .72, .25, 1) both;
  animation-delay: var(--particle-delay);
  transform-box: fill-box;
  transform-origin: center;
}

.sagak-intro-trace {
  animation: sagakIntroTrace ${INTRO_DURATION_MS}ms ease-in-out both;
}

.sagak-intro-solid-pencil {
  animation: sagakIntroSolidPencil ${INTRO_DURATION_MS}ms cubic-bezier(.2, .72, .25, 1) both;
}

.sagak-intro-equation {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 700;
  letter-spacing: 0;
  text-shadow: 0 0 12px rgba(115, 201, 189, 0.22);
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

@media (prefers-reduced-motion: reduce) {
  [data-sagak-intro-copy="true"],
  [data-sagak-scroll-section="true"],
  [data-sagak-preview-frame="true"],
  [data-sagak-story-keyword="true"],
  .value-keyword,
	  .sagak-hover-zoom,
	  .sagak-intro-particle,
	  .sagak-intro-trace,
	  .sagak-intro-solid-pencil {
    animation: none !important;
    transform: none !important;
    filter: none !important;
  }

  .sagak-pencil-follower {
    transition: none !important;
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

const sectionVisualKeywords = {
  record: 'RECORD',
  plan: 'PLAN',
  question: 'ASK',
  summary: 'SUMMARY',
  report: 'REVIEW',
  trust: 'TRUST'
};

const projectCopySets = {
  ko: {
    eyebrow: 'PROJECT NOTES',
    title: '회의록과 설계 문서에서 이어진 사각사각의 방향',
    description: '요구사항과 설계 문서에는 사각사각이 전 연령층을 위한 개인화 학습 관리 앱으로, 일정·칸반·AI 학습·커뮤니티·접근성·보상을 하나의 학습 흐름으로 연결해야 한다고 정리되어 있습니다.',
    cards: [
      {
        title: '계획은 작게, 실행은 분명하게',
        description: '캘린더와 칸반으로 오늘 할 일을 나누고, D-Day와 집중 시간으로 학습 리듬을 확인합니다.'
      },
      {
        title: 'AI는 답변보다 복습 흐름으로',
        description: '질문, 요약, 오답노트, 추천, 퀴즈가 다시 볼 기록으로 남아 다음 학습을 준비합니다.'
      },
      {
        title: '모두가 쓰는 학습 공간',
        description: '큰 글씨, 고대비, TTS/STT, 커뮤니티와 보상 흐름까지 고려해 연령과 목적이 달라도 이어 쓸 수 있게 설계했습니다.'
      },
      {
        title: '운영 가능한 플랫폼',
        description: '게시판, 신고, 관리자, 데이터 보호 기준을 문서화해 수업 프로젝트 데모 이후에도 확장 가능한 구조를 남겼습니다.'
      }
    ]
  },
  en: {
    eyebrow: 'PROJECT NOTES',
    title: 'The direction shaped by meeting notes and design docs',
    description: 'The requirements and design documents define Sagak Sagak as a personalized learning platform for all ages, connecting schedules, boards, AI study, community, accessibility, and rewards into one study flow.',
    cards: [
      {
        title: 'Smaller plans, clearer action',
        description: 'Use calendars and boards to break down today’s tasks, then check rhythm through D-Day and focus time.'
      },
      {
        title: 'AI as a review flow',
        description: 'Questions, summaries, wrong-answer notes, recommendations, and quizzes stay as records for the next study session.'
      },
      {
        title: 'A study space for everyone',
        description: 'Large text, high contrast, TTS/STT, community, and rewards support different ages and learning goals.'
      },
      {
        title: 'A platform ready to operate',
        description: 'Board moderation, reports, admin roles, and data protection are documented for growth beyond the class demo.'
      }
    ]
  },
  ja: {
    eyebrow: 'PROJECT NOTES',
    title: '議事録と設計文書から続くサガクサガクの方向',
    description: '要件定義と設計文書では、サガクサガクを全年齢向けのパーソナライズ学習管理アプリとして、予定・カンバン・AI学習・コミュニティ・アクセシビリティ・報酬を一つの学習フローにつなげる方針で整理しています。',
    cards: [
      {
        title: '計画は小さく、実行は明確に',
        description: 'カレンダーとカンバンで今日のタスクを分け、D-Dayと集中時間で学習リズムを確認します。'
      },
      {
        title: 'AIは答えより復習の流れへ',
        description: '質問、要約、誤答ノート、推薦、クイズを見返せる記録として残し、次の学習につなげます。'
      },
      {
        title: '誰でも使える学習空間',
        description: '大きな文字、高コントラスト、TTS/STT、コミュニティ、報酬まで考慮し、年齢や目的が違っても使い続けられるようにします。'
      },
      {
        title: '運用できるプラットフォーム',
        description: '掲示板、通報、管理者、データ保護の基準を文書化し、授業デモ後の拡張余地も残しています。'
      }
    ]
  },
  zh: {
    eyebrow: 'PROJECT NOTES',
    title: '从会议记录和设计文档延伸出的方向',
    description: '需求和设计文档将沙沙学习定位为面向全年龄段的个性化学习管理平台，把日程、看板、AI 学习、社区、无障碍和奖励连接成一个学习流程。',
    cards: [
      {
        title: '计划更小，行动更清楚',
        description: '用日历和看板拆分今天的任务，并通过 D-Day 和专注时间确认学习节奏。'
      },
      {
        title: 'AI 不止回答，更连接复习',
        description: '提问、总结、错题笔记、推荐和测验会留下可回看的记录，帮助准备下一次学习。'
      },
      {
        title: '人人都能使用的学习空间',
        description: '大字、高对比度、TTS/STT、社区和奖励流程，让不同年龄和目标的用户都能持续使用。'
      },
      {
        title: '可运营的平台结构',
        description: '帖子、举报、管理员和数据保护标准已文档化，为课程演示之后的扩展保留空间。'
      }
    ]
  }
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function smoothStep(value) {
  const p = clamp(value, 0, 1);
  return p * p * (3 - 2 * p);
}

function calculateSectionKeywordMotion(scrollY, layout, viewportHeight) {
  const sectionHeight = Number(layout?.height) || 0;
  const sectionY = Number(layout?.y) || 0;

  if (!sectionHeight) {
    return { opacity: 0, blur: 14, y: 72, scale: 0.94 };
  }

  const sectionCenter = sectionY + sectionHeight / 2;
  const viewportCenter = scrollY + viewportHeight / 2;
  const distance = sectionCenter - viewportCenter;
  const range = Math.max(sectionHeight * 0.76, viewportHeight * 0.72);
  const proximity = smoothStep(1 - clamp(Math.abs(distance) / range, 0, 1));
  const direction = clamp(distance / range, -1, 1);

  return {
    opacity: proximity,
    blur: 14 * (1 - proximity),
    y: 84 * direction * (1 - proximity * 0.4),
    scale: 0.94 + 0.06 * proximity + (direction < 0 ? 0.04 * (1 - proximity) : 0)
  };
}

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

const topHeroSlides = [
  {
    key: 'question',
    eyebrow: 'AI STUDY',
    title: 'AI가 오늘의 학습을\n한 번에 정리해줘요',
    description: '개념 요약, 오답 분석, 복습 루틴까지 공부 흐름을 놓치지 않게 도와줍니다.',
    cta: 'AI 기능 보기',
    action: 'home'
  },
  {
    key: 'plan',
    eyebrow: 'PLAN',
    title: 'D-day와 오늘 계획을\n한 장에 정리하세요',
    description: '시간표, 우선순위, 완료 상태가 함께 보이는 학습 계획 흐름을 제공합니다.',
    cta: '계획 흐름 보기',
    action: 'register'
  },
  {
    key: 'record',
    eyebrow: 'RECORD',
    title: '공부의 흔적을\n사각사각 쌓아가세요',
    description: '오늘 저장한 노트, 질문, 오답과 집중 시간을 실제 학습 기록처럼 한눈에 확인합니다.',
    cta: '무료로 시작하기',
    action: 'register'
  },
  {
    key: 'summary',
    eyebrow: 'SUMMARY',
    title: '긴 내용은 핵심만\n선명하게 남기세요',
    description: '미적분 핵심 개념처럼 실제 요약 결과와 키워드 태그가 노트 카드에 남습니다.',
    cta: '요약 예시 보기',
    action: 'register'
  }
];

const topHeroCopySets = {
  ko: {
    question: {
      eyebrow: 'AI STUDY',
      title: 'AI가 오늘의 학습을\n한 번에 정리해줘요',
      description: '개념 요약, 오답 분석, 복습 루틴까지 공부 흐름을 놓치지 않게 도와줍니다.',
      cta: 'AI 기능 보기'
    },
    plan: {
      eyebrow: 'PLAN',
      title: 'D-day와 오늘 계획을\n한 장에 정리하세요',
      description: '시간표, 우선순위, 완료 상태가 함께 보이는 학습 계획 흐름을 제공합니다.',
      cta: '계획 흐름 보기'
    },
    record: {
      eyebrow: 'RECORD',
      title: '공부의 흔적을\n사각사각 쌓아가세요',
      description: '오늘 저장한 노트, 질문, 오답과 집중 시간을 실제 학습 기록처럼 한눈에 확인합니다.',
      cta: '무료로 시작하기'
    },
    summary: {
      eyebrow: 'SUMMARY',
      title: '긴 내용은 핵심만\n선명하게 남기세요',
      description: '미적분 핵심 개념처럼 실제 요약 결과와 키워드 태그가 노트 카드에 남습니다.',
      cta: '요약 예시 보기'
    }
  },
  en: {
    question: {
      eyebrow: 'AI STUDY',
      title: 'Let AI organize\ntoday’s learning',
      description: 'Concept summaries, error reviews, and review routines stay connected in one study flow.',
      cta: 'View AI features'
    },
    plan: {
      eyebrow: 'PLAN',
      title: 'Keep D-day and\ntoday’s plan together',
      description: 'Schedules, priorities, and completion status are shown as one clear planning flow.',
      cta: 'View planning flow'
    },
    record: {
      eyebrow: 'RECORD',
      title: 'Build your learning traces\none note at a time',
      description: 'See saved notes, questions, mistakes, and focus time as real study records.',
      cta: 'Start for free'
    },
    summary: {
      eyebrow: 'SUMMARY',
      title: 'Leave long material\nas clear key points',
      description: 'Summary results and keyword tags remain in a note card, just like a calculus concept review.',
      cta: 'View summary example'
    }
  },
  ja: {
    question: {
      eyebrow: 'AI STUDY',
      title: 'AIが今日の学習を\n一度に整理します',
      description: '概念要約、誤答分析、復習ルーティンまで学習の流れをつなげます。',
      cta: 'AI機能を見る'
    },
    plan: {
      eyebrow: 'PLAN',
      title: 'D-dayと今日の計画を\n一枚で整理',
      description: '時間割、優先順位、完了状態が一緒に見える学習計画フローを提供します。',
      cta: '計画フローを見る'
    },
    record: {
      eyebrow: 'RECORD',
      title: '学びの足跡を\n少しずつ積み上げよう',
      description: '今日保存したノート、質問、誤答、集中時間を学習記録として確認します。',
      cta: '無料で始める'
    },
    summary: {
      eyebrow: 'SUMMARY',
      title: '長い内容は要点だけ\nはっきり残しましょう',
      description: '微積分の要点のように、実際の要約結果とキーワードタグがノートに残ります。',
      cta: '要約例を見る'
    }
  },
  zh: {
    question: {
      eyebrow: 'AI STUDY',
      title: '让 AI 一次整理\n今天的学习',
      description: '概念总结、错题分析和复习节奏会连接成一个学习流程。',
      cta: '查看 AI 功能'
    },
    plan: {
      eyebrow: 'PLAN',
      title: '把 D-day 和今日计划\n整理在一张卡片里',
      description: '时间表、优先级和完成状态会一起展示为清晰的学习计划。',
      cta: '查看计划流程'
    },
    record: {
      eyebrow: 'RECORD',
      title: '一点点积累\n学习的痕迹',
      description: '今天保存的笔记、问题、错题和专注时间都会成为真实学习记录。',
      cta: '免费开始'
    },
    summary: {
      eyebrow: 'SUMMARY',
      title: '长内容只留下\n清晰重点',
      description: '像微积分核心概念一样，实际总结结果和关键词标签会保存在笔记卡片中。',
      cta: '查看总结示例'
    }
  }
};

const exampleCopySets = {
  ko: {
    topHeroPlanRows: ['09:00 수학 개념 복습', '11:30 영어 단어 30개', '14:00 자료구조 과제', '20:00 오답 노트'],
    topHeroQuestion: 'Q. DFS를 쉽게 설명해줘',
    topHeroAnswerTitle: 'AI 답변 요약',
    topHeroAnswer: '한 방향으로 끝까지 탐색한 뒤 막히면 되돌아오는 방식입니다.',
    summarize: '요약하기',
    review: '다시 보기',
    example: '예시 보기',
    summaryDone: 'AI 요약 완료',
    summarySubject: '수학 미적분 핵심 개념',
    topHeroSummaryRows: ['미분 = 순간 변화율', '도함수 = 접선의 기울기', '적분 = 누적량', '기본정리 = 미분·적분 연결'],
    recordTitle: '오늘의 학습 기록',
    recordStreak: '연속 5일째',
    topHeroRecordRows: ['자료구조 복습 42분', '미적분 문제풀이 1시간 10분', '오늘 질문 3개 저장', 'AI 요약 2개 다시보기'],
    recordRows: ['자료구조 DFS 복습 완료 · 42분', '미적분 문제풀이 · 1시간 10분', '영어 단어 암기 · 25분', '오늘 질문 3개 / 요약 2개 저장'],
    openingNotes: 'Opening Notes',
    recordMiniText: '개념 정리 완료 · 오답 노트 저장',
    savedQuestions: '다시 볼 질문',
    savedQuestionsValue: '2건',
    savedQuestionsText: '극한과 도함수 관계, DFS 탐색 순서',
    month: 'May 2026',
    planRows: ['09:00 수학 개념 복습', '11:30 영어 단어 암기', '14:00 오답 노트 작성', '20:00 자료구조 과제 정리'],
    priorityTitle: '오늘 목표 4개 중 2개 완료',
    priorityRows: ['1. 미적분 요약 보기', '2. DFS 문제 2개 풀기'],
    chatQuestion: 'Q. 이 개념을 쉽게 설명해줘',
    chatAnswer: 'AI. DFS는 그래프를 한 방향으로 끝까지 탐색한 뒤, 막다른 지점에서 되돌아오는 방식입니다. 스택이나 재귀로 구현할 수 있어요.',
    summaryBullets: ['미분은 함수의 순간 변화율을 구하는 방법입니다.', '도함수는 원함수의 기울기 변화를 나타냅니다.', 'f(x)=x²의 도함수는 2x입니다.', '접선의 기울기는 해당 지점의 미분값으로 구할 수 있습니다.', '복습 추천: 극한과 도함수의 관계'],
    summaryTags: ['변화율', '도함수', '접선 기울기'],
    reportTitle: '오답 분석 리포트',
    myAnswer: '내 답안',
    correctAnswer: '정답',
    wrongReason: '틀린 이유',
    wrongReasonText: '개념 A와 B의 차이를 혼동했습니다. 다시 복습을 추천합니다.',
    trustTag: 'TRUST'
  },
  en: {
    topHeroPlanRows: ['09:00 Math concept review', '11:30 30 English words', '14:00 Data structure task', '20:00 Wrong-answer notes'],
    topHeroQuestion: 'Q. Explain DFS simply',
    topHeroAnswerTitle: 'AI answer summary',
    topHeroAnswer: 'Explore one path to the end, then backtrack when it is blocked.',
    summarize: 'Summarize',
    review: 'Review',
    example: 'See example',
    summaryDone: 'AI summary done',
    summarySubject: 'Core calculus concepts',
    topHeroSummaryRows: ['Derivative = instant rate of change', 'Derivative function = tangent slope', 'Integral = accumulated amount', 'Fundamental theorem connects them'],
    recordTitle: 'Today’s study record',
    recordStreak: '5-day streak',
    topHeroRecordRows: ['Data structures · 42 min', 'Calculus practice · 1h 10m', '3 questions saved today', '2 AI summaries to revisit'],
    recordRows: ['DFS review complete · 42 min', 'Calculus problem solving · 1h 10m', 'English vocabulary · 25 min', '3 questions / 2 summaries saved'],
    openingNotes: 'Opening Notes',
    recordMiniText: 'Concept notes complete · wrong-answer note saved',
    savedQuestions: 'Questions to revisit',
    savedQuestionsValue: '2',
    savedQuestionsText: 'Limits and derivatives, DFS traversal order',
    month: 'May 2026',
    planRows: ['09:00 Math concept review', '11:30 English vocabulary', '14:00 Wrong-answer notes', '20:00 Data structure assignment'],
    priorityTitle: '2 of 4 goals completed today',
    priorityRows: ['1. Review calculus summary', '2. Solve 2 DFS problems'],
    chatQuestion: 'Q. Explain this concept simply',
    chatAnswer: 'AI. DFS explores a graph deeply in one direction, then backtracks at a dead end. You can implement it with a stack or recursion.',
    summaryBullets: ['A derivative measures a function’s instant rate of change.', 'The derivative function shows how the slope changes.', 'The derivative of f(x)=x² is 2x.', 'A tangent slope is found from the derivative value at that point.', 'Review tip: connect limits with derivatives.'],
    summaryTags: ['Rate of change', 'Derivative', 'Tangent slope'],
    reportTitle: 'Wrong-answer report',
    myAnswer: 'My answer',
    correctAnswer: 'Correct answer',
    wrongReason: 'Why it was wrong',
    wrongReasonText: 'You mixed up the difference between concepts A and B. A quick review is recommended.',
    trustTag: 'TRUST'
  },
  ja: {
    topHeroPlanRows: ['09:00 数学概念の復習', '11:30 英単語30個', '14:00 データ構造課題', '20:00 誤答ノート'],
    topHeroQuestion: 'Q. DFSを簡単に説明して',
    topHeroAnswerTitle: 'AI回答要約',
    topHeroAnswer: '一方向に最後まで探索し、行き止まりなら戻る方式です。',
    summarize: '要約する',
    review: 'もう一度見る',
    example: '例を見る',
    summaryDone: 'AI要約完了',
    summarySubject: '微積分の核心概念',
    topHeroSummaryRows: ['微分 = 瞬間変化率', '導関数 = 接線の傾き', '積分 = 累積量', '基本定理 = 微分と積分の接続'],
    recordTitle: '今日の学習記録',
    recordStreak: '5日連続',
    topHeroRecordRows: ['データ構造復習 42分', '微積分演習 1時間10分', '今日の質問3件保存', 'AI要約2件を再確認'],
    recordRows: ['DFS復習完了 · 42分', '微積分問題演習 · 1時間10分', '英単語暗記 · 25分', '今日の質問3件 / 要約2件保存'],
    openingNotes: 'Opening Notes',
    recordMiniText: '概念整理完了 · 誤答ノート保存',
    savedQuestions: 'もう一度見る質問',
    savedQuestionsValue: '2件',
    savedQuestionsText: '極限と導関数の関係、DFS探索順序',
    month: '2026年5月',
    planRows: ['09:00 数学概念の復習', '11:30 英単語暗記', '14:00 誤答ノート作成', '20:00 データ構造課題整理'],
    priorityTitle: '今日の目標4個中2個完了',
    priorityRows: ['1. 微積分要約を見る', '2. DFS問題を2問解く'],
    chatQuestion: 'Q. この概念を簡単に説明して',
    chatAnswer: 'AI. DFSはグラフを一方向に深く探索し、行き止まりで戻る方式です。スタックや再帰で実装できます。',
    summaryBullets: ['微分は関数の瞬間変化率を求める方法です。', '導関数は元の関数の傾きの変化を表します。', 'f(x)=x²の導関数は2xです。', '接線の傾きはその点の微分値で求められます。', '復習推奨: 極限と導関数の関係'],
    summaryTags: ['変化率', '導関数', '接線の傾き'],
    reportTitle: '誤答分析レポート',
    myAnswer: '自分の答え',
    correctAnswer: '正解',
    wrongReason: '間違えた理由',
    wrongReasonText: '概念AとBの違いを混同しました。もう一度復習することをおすすめします。',
    trustTag: 'TRUST'
  },
  zh: {
    topHeroPlanRows: ['09:00 复习数学概念', '11:30 英语单词30个', '14:00 数据结构作业', '20:00 错题笔记'],
    topHeroQuestion: 'Q. 简单说明 DFS',
    topHeroAnswerTitle: 'AI 回答摘要',
    topHeroAnswer: '沿一个方向探索到尽头，遇到阻塞时再回退。',
    summarize: '总结',
    review: '再看',
    example: '看示例',
    summaryDone: 'AI 总结完成',
    summarySubject: '微积分核心概念',
    topHeroSummaryRows: ['微分 = 瞬时变化率', '导函数 = 切线斜率', '积分 = 累积量', '基本定理 = 连接微分和积分'],
    recordTitle: '今天的学习记录',
    recordStreak: '连续5天',
    topHeroRecordRows: ['数据结构复习 42分钟', '微积分练习 1小时10分', '今天保存3个问题', '2个 AI 总结待复习'],
    recordRows: ['DFS 复习完成 · 42分钟', '微积分题目练习 · 1小时10分', '英语单词记忆 · 25分钟', '今天保存3个问题 / 2个总结'],
    openingNotes: 'Opening Notes',
    recordMiniText: '概念整理完成 · 错题笔记已保存',
    savedQuestions: '待回看的问题',
    savedQuestionsValue: '2条',
    savedQuestionsText: '极限与导函数关系，DFS 遍历顺序',
    month: '2026年5月',
    planRows: ['09:00 复习数学概念', '11:30 记忆英语单词', '14:00 写错题笔记', '20:00 整理数据结构作业'],
    priorityTitle: '今日4个目标已完成2个',
    priorityRows: ['1. 查看微积分总结', '2. 完成2道 DFS 题'],
    chatQuestion: 'Q. 简单解释这个概念',
    chatAnswer: 'AI. DFS 会沿着图的一个方向深入探索，走到尽头后再回退。可以用栈或递归实现。',
    summaryBullets: ['微分表示函数的瞬时变化率。', '导函数表示原函数斜率的变化。', 'f(x)=x² 的导函数是 2x。', '切线斜率可由该点的微分值求出。', '复习建议：极限与导函数的关系'],
    summaryTags: ['变化率', '导函数', '切线斜率'],
    reportTitle: '错题分析报告',
    myAnswer: '我的答案',
    correctAnswer: '正确答案',
    wrongReason: '错误原因',
    wrongReasonText: '你混淆了概念 A 和 B 的差异。建议再次复习。',
    trustTag: 'TRUST'
  }
};

function TopHeroCarousel({ activeIndex, onNext, onPrevious, onSelect, onNavigate, language }) {
  const baseSlide = topHeroSlides[activeIndex];
  const slide = {
    ...baseSlide,
    ...(topHeroCopySets[language]?.[baseSlide.key] || topHeroCopySets.ko[baseSlide.key])
  };
  const exampleCopy = exampleCopySets[language] || exampleCopySets.ko;

  return (
    <View style={styles.topHeroCarousel}>
      <Pressable className="sagak-pencil-interactive" onPress={onPrevious} style={(state) => [styles.topHeroArrow, styles.topHeroArrowLeft, ...interactiveStateStyles(state)]}>
        <Text style={styles.topHeroArrowText}>‹</Text>
      </Pressable>
      <View style={styles.topHeroContent}>
        <View style={styles.topHeroCopy}>
          <Text style={styles.topHeroEyebrow}>{slide.eyebrow}</Text>
          <Text style={styles.topHeroTitle}>{slide.title}</Text>
          <Text style={styles.topHeroDescription}>{slide.description}</Text>
          <Pressable className="sagak-pencil-interactive" onPress={() => onNavigate(slide.action)} style={(state) => [styles.topHeroCta, ...interactiveStateStyles(state)]}>
            <Text style={styles.topHeroCtaText}>{slide.cta}</Text>
          </Pressable>
        </View>
        <TopHeroMockup copy={exampleCopy} kind={slide.key} />
      </View>
      <Pressable className="sagak-pencil-interactive" onPress={onNext} style={(state) => [styles.topHeroArrow, styles.topHeroArrowRight, ...interactiveStateStyles(state)]}>
        <Text style={styles.topHeroArrowText}>›</Text>
      </Pressable>
      <View style={styles.topHeroDots}>
        {topHeroSlides.map((item, index) => (
          <Pressable className="sagak-pencil-interactive" key={item.key} onPress={() => onSelect(index)} style={[styles.topHeroDot, index === activeIndex && styles.topHeroDotActive]} />
        ))}
      </View>
    </View>
  );
}

function TopHeroMockup({ copy, kind }) {
  if (kind === 'plan') {
    return (
      <View className="sagak-hover-zoom" style={[styles.topHeroMockup, styles.topHeroMockupPlan]}>
        <View style={styles.topHeroMockupHeader}>
          <Text style={styles.topHeroMockupTitle}>{copy.month}</Text>
          <Text style={styles.topHeroMockupBadge}>D-12</Text>
        </View>
        {copy.topHeroPlanRows.map((item, index) => (
          <View key={item} style={styles.topHeroMockupRow}>
            <View style={[styles.topHeroMockupCheck, index < 2 && styles.topHeroMockupCheckDone]} />
            <Text style={styles.topHeroMockupRowText}>{item}</Text>
          </View>
        ))}
      </View>
    );
  }

  if (kind === 'question') {
    return (
      <View className="sagak-hover-zoom" style={[styles.topHeroMockup, styles.topHeroMockupChat]}>
        <View style={styles.topHeroQuestionBubble}>
          <Text style={styles.topHeroQuestionText}>{copy.topHeroQuestion}</Text>
        </View>
        <View style={styles.topHeroAnswerCard}>
          <Text style={styles.topHeroAnswerTitle}>{copy.topHeroAnswerTitle}</Text>
          <Text style={styles.topHeroAnswerText}>{copy.topHeroAnswer}</Text>
        </View>
        <View style={styles.topHeroActionRow}>
          <Text style={styles.topHeroActionPill}>{copy.summarize}</Text>
          <Text style={styles.topHeroActionPillMuted}>{copy.review}</Text>
        </View>
      </View>
    );
  }

  if (kind === 'summary') {
    return (
      <View className="sagak-hover-zoom" style={[styles.topHeroMockup, styles.topHeroMockupSummary]}>
        <Text style={styles.topHeroMockupTitle}>{copy.summaryDone}</Text>
        <Text style={styles.topHeroSummarySubject}>{copy.summarySubject}</Text>
        {copy.topHeroSummaryRows.map((item) => (
          <View key={item} style={styles.topHeroSummaryLine}>
            <View style={styles.heroSlideBullet} />
            <Text style={styles.topHeroMockupRowText}>{item}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View className="sagak-hover-zoom" style={[styles.topHeroMockup, styles.topHeroMockupRecord]}>
      <View style={styles.topHeroMockupHeader}>
        <Text style={styles.topHeroMockupTitle}>{copy.recordTitle}</Text>
        <Text style={styles.topHeroMockupBadge}>{copy.recordStreak}</Text>
      </View>
      {copy.topHeroRecordRows.map((item) => (
        <View key={item} style={styles.topHeroMockupRow}>
          <View style={styles.topHeroMockupCheckDone} />
          <Text style={styles.topHeroMockupRowText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}


function createIntroLogoParticles() {
  const particles = [];
  const mathTokens = ['f(x)', 'x^2', 'dy/dx', '∫', 'Σ', 'lim', '√x', 'π', 'a_n', 'Δ', 'log', 'y='];

  function addParticle(x, y, fill, fontSize = 10) {
    const index = particles.length;
    const angle = (index * 137.5 * Math.PI) / 180;
    const distance = 150 + (index % 11) * 22;

    particles.push({
      delay: (index % 19) * 24,
      fill,
      fontSize,
      id: `intro-particle-${index}`,
      label: mathTokens[index % mathTokens.length],
      scatterX: Math.round(Math.cos(angle) * distance),
      scatterY: Math.round(Math.sin(angle) * distance * 0.72),
      x,
      y
    });
  }

  function addLine(x1, y1, x2, y2, count, fill, fontSize = 10, offsets = [0]) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy) || 1;
    const normalX = -dy / length;
    const normalY = dx / length;

    offsets.forEach((offset) => {
      for (let index = 0; index < count; index += 1) {
        const progress = count === 1 ? 0 : index / (count - 1);
        addParticle(
          x1 + dx * progress + normalX * offset,
          y1 + dy * progress + normalY * offset,
          fill,
          fontSize
        );
      }
    });
  }

  addLine(704, 238, 526, 410, 25, '#73C9BD', 10, [-18, -6, 6, 18]);
  addLine(718, 224, 686, 255, 8, '#F3D4A0', 9, [-15, -5, 5, 15]);
  addLine(526, 410, 478, 456, 13, '#FFF1D9', 9, [-12, 0, 12]);
  addLine(486, 448, 468, 466, 6, '#6EA6E8', 8, [-5, 5]);

  return particles;
}

const introLogoParticles = createIntroLogoParticles();

function CinematicIntroVideo({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, INTRO_DURATION_MS);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <View dataSet={{ sagakIntroScreen: 'true' }} style={styles.introVideoSection} className="intro-video-section">
      <View style={styles.introFilm} className="sagak-intro-film">
        {Platform.OS === 'web' && (
          <svg aria-hidden="true" viewBox="0 0 1200 720" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            {introLogoParticles.map((particle) => (
              <text
                className="sagak-intro-particle sagak-intro-equation"
                dominantBaseline="central"
                fill={particle.fill}
                fontSize={particle.fontSize}
                key={particle.id}
                style={{
                  '--particle-delay': `${particle.delay}ms`,
                  '--scatter-x': `${particle.scatterX}px`,
                  '--scatter-y': `${particle.scatterY}px`
                }}
                textAnchor="middle"
                x={particle.x}
                y={particle.y}
              >
                {particle.label}
              </text>
            ))}
            <path
              className="sagak-intro-trace"
              d="M468 466 C514 446 558 488 608 466 C652 446 684 478 726 462 C736 458 744 460 752 464"
              fill="none"
              id="sagak-intro-write-path"
              pathLength="1"
              stroke="#6EA6E8"
              strokeDasharray="1"
              strokeDashoffset="1"
              strokeLinecap="butt"
              strokeWidth="8"
            >
              <animate
                attributeName="stroke-dashoffset"
                begin={`${INTRO_WRITE_START_SECONDS}s`}
                calcMode="linear"
                dur={`${INTRO_WRITE_DURATION_SECONDS}s`}
                fill="freeze"
                from="1"
                to="0"
              />
            </path>
            <g className="sagak-intro-solid-pencil">
              <g>
                <polygon fill="#F3D4A0" points="236,-259 270,-225 254,-210 220,-244" />
                <polygon fill="#73C9BD" points="220,-244 254,-210 67,-29 33,-63" />
                <polygon fill="rgba(255,255,255,0.2)" points="232,-232 243,-221 56,-40 45,-51" />
                <polygon fill="#FFF1D9" points="33,-63 67,-29 0,0" />
                <polygon fill="#173B63" points="0,0 17,-18 25,-9" />
                <animateTransform
                  attributeName="transform"
                  begin={`${INTRO_WRITE_START_SECONDS}s`}
                  calcMode="spline"
                  dur={`${INTRO_WRITE_DURATION_SECONDS}s`}
                  fill="freeze"
                  keySplines=".37 0 .63 1;.37 0 .63 1;.37 0 .63 1;.37 0 .63 1;.37 0 .63 1"
                  keyTimes="0;0.18;0.38;0.58;0.78;1"
                  type="rotate"
                  values="0 0 0;-2.4 0 0;2 0 0;-1.8 0 0;1.4 0 0;0 0 0"
                />
              </g>
              <animateMotion
                begin={`${INTRO_WRITE_START_SECONDS}s`}
                calcMode="linear"
                dur={`${INTRO_WRITE_DURATION_SECONDS}s`}
                fill="freeze"
                keyPoints="0;1"
                keyTimes="0;1"
              >
                <mpath href="#sagak-intro-write-path" />
              </animateMotion>
            </g>
          </svg>
        )}
      </View>
    </View>
  );
}

function readBgmEnabled() {
  try {
    return globalThis.localStorage?.getItem(BGM_ENABLED_STORAGE_KEY) === 'true';
  } catch (error) {
    return false;
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

function PencilCursorFollower() {
  const followerRef = useRef(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !globalThis.window?.matchMedia?.('(pointer: fine)').matches) {
      return undefined;
    }

    const follower = followerRef.current;
    const documentRef = globalThis.document;
    let lastX = 0;
    let lastY = 0;

    function handlePointerMove(event) {
      const interactiveTarget = event.target?.closest?.('.sagak-pencil-interactive, .sagak-hover-zoom, .language-dropdown, button, [role="button"], [role="link"], [role="switch"], a');
      const tilt = clamp((event.clientX - lastX) * 0.7 + (event.clientY - lastY) * 0.22, -14, 14);

      lastX = event.clientX;
      lastY = event.clientY;
      follower.style.opacity = interactiveTarget ? '1' : '0';
      follower.style.transform = `translate3d(${event.clientX + 8}px, ${event.clientY + 9}px, 0) rotate(${tilt - 8}deg) scale(${interactiveTarget ? 1.06 : 0.92})`;
    }

    function hideFollower() {
      follower.style.opacity = '0';
    }

    documentRef.addEventListener('pointermove', handlePointerMove);
    documentRef.addEventListener('pointerleave', hideFollower);
    globalThis.window.addEventListener('blur', hideFollower);

    return () => {
      documentRef.removeEventListener('pointermove', handlePointerMove);
      documentRef.removeEventListener('pointerleave', hideFollower);
      globalThis.window.removeEventListener('blur', hideFollower);
    };
  }, []);

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <div aria-hidden="true" className="sagak-pencil-follower" ref={followerRef}>
      <img alt="" src={pencilCursorImage} />
    </div>
  );
}

function SectionKeyword({ label, motion, style }) {
  const keywordMotion = motion || { opacity: 0, blur: 14, y: 72, scale: 0.94 };

  return (
    <Text
      className="keyword-bg"
      style={[
        styles.bgTitleText,
        style,
        {
          opacity: keywordMotion.opacity,
          filter: `blur(${keywordMotion.blur}px)`,
          transform: [{ translateY: keywordMotion.y - 115 }, { scale: keywordMotion.scale }]
        }
      ]}
    >
      {label}
    </Text>
  );
}

function ProjectGroundedCopySection({ copy }) {
  return (
    <View dataSet={{ sagakScrollSection: 'true' }} style={styles.projectSection}>
      <View style={styles.projectHeading}>
        <Text style={styles.sectionEyebrow}>{copy.eyebrow}</Text>
        <Text style={styles.sectionTitle}>{copy.title}</Text>
        <Text style={styles.sectionDescription}>{copy.description}</Text>
      </View>
      <View style={styles.projectCardGrid}>
        {copy.cards.map((card) => (
          <View className="sagak-hover-zoom sagak-project-card" key={card.title} style={[styles.projectCard, shadows.card]}>
            <View style={styles.projectCardRule} />
            <Text style={styles.projectCardTitle}>{card.title}</Text>
            <Text style={styles.projectCardDescription}>{card.description}</Text>
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
  const { currentLanguage, t } = useLanguage();
  const [writtenWord, setWrittenWord] = useState('');
  const [introPassed, setIntroPassed] = useState(() => !readIntroAutoPlayEnabled());
  const [topHeroIndex, setTopHeroIndex] = useState(0);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [bgmEnabled, setBgmEnabled] = useState(readBgmEnabled);
  const [sectionLayouts, setSectionLayouts] = useState({});
  const [sectionKeywordMotions, setSectionKeywordMotions] = useState({});
  const scrollRef = useRef(null);
  const scrollYRef = useRef(0);
  const bgmRef = useRef(null);
  const [githubTooltipState, setGithubTooltipState] = useState({
    focused: false,
    hovered: false
  });
  const showGithubTooltip = githubTooltipState.focused || githubTooltipState.hovered;
  const writingWord = t('landing.hero.writingWord', '사각사각');
  const heroSuffix = t('landing.hero.suffix', '쌓아가세요');
  const currentHeroSlide = heroSlides[heroSlideIndex];
  const currentSectionKeywords = sectionVisualKeywords;
  const exampleCopy = exampleCopySets[currentLanguage] || exampleCopySets.ko;
  const projectCopy = projectCopySets[currentLanguage] || projectCopySets.ko;

  const updateSectionKeywordMotions = useCallback((scrollY, layoutOverride) => {
    const layouts = layoutOverride || sectionLayouts;
    const viewportHeight = Platform.OS === 'web'
      ? (globalThis.window?.innerHeight || 800)
      : 800;
    const nextMotions = {};

    Object.entries(layouts).forEach(([key, layout]) => {
      nextMotions[key] = calculateSectionKeywordMotion(scrollY, layout, viewportHeight);
    });

    setSectionKeywordMotions(nextMotions);
  }, [sectionLayouts]);

  const completeIntro = useCallback(() => {
    if (introPassed) return;
    setIntroPassed(true);
    if (Platform.OS === 'web') {
      globalThis.window?.dispatchEvent(new CustomEvent('sagak:intro-passed'));
    }
  }, [introPassed]);

  useEffect(() => {
    if (Platform.OS !== 'web' || introPassed) return undefined;

    const documentRef = globalThis.document;
    const windowRef = globalThis.window;
    const previousBodyOverflow = documentRef?.body?.style.overflow;
    const previousHtmlOverflow = documentRef?.documentElement?.style.overflow;
    const scrollKeys = new Set(['ArrowDown', 'ArrowUp', 'End', 'Home', 'PageDown', 'PageUp', ' ']);
    const preventScroll = (event) => event.preventDefault();
    const preventScrollKey = (event) => {
      if (scrollKeys.has(event.key)) event.preventDefault();
    };

    scrollRef.current?.scrollTo({ y: 0, animated: false });
    windowRef?.scrollTo?.({ top: 0, left: 0, behavior: 'auto' });
    if (documentRef?.body) documentRef.body.style.overflow = 'hidden';
    if (documentRef?.documentElement) documentRef.documentElement.style.overflow = 'hidden';
    windowRef?.addEventListener('wheel', preventScroll, { passive: false });
    windowRef?.addEventListener('touchmove', preventScroll, { passive: false });
    windowRef?.addEventListener('keydown', preventScrollKey);

    return () => {
      if (documentRef?.body) documentRef.body.style.overflow = previousBodyOverflow || '';
      if (documentRef?.documentElement) documentRef.documentElement.style.overflow = previousHtmlOverflow || '';
      windowRef?.removeEventListener('wheel', preventScroll);
      windowRef?.removeEventListener('touchmove', preventScroll);
      windowRef?.removeEventListener('keydown', preventScrollKey);
    };
  }, [introPassed]);

  const handleScroll = (e) => {
    const scrollY = e.nativeEvent.contentOffset.y || 0;
    scrollYRef.current = scrollY;
    updateSectionKeywordMotions(scrollY);

  };

  const handleSectionLayout = useCallback((sectionKey, event) => {
    const nextLayout = event.nativeEvent.layout;
    setSectionLayouts((current) => {
      const nextLayouts = { ...current, [sectionKey]: nextLayout };
      updateSectionKeywordMotions(scrollYRef.current, nextLayouts);
      return nextLayouts;
    });
  }, [updateSectionKeywordMotions]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTopHeroIndex((current) => (current + 1) % topHeroSlides.length);
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

  return (
    <>
      <PencilCursorFollower />
      <ScrollView
      className="sagak-landing-scroll"
      ref={scrollRef}
      onScroll={handleScroll}
      scrollEnabled={introPassed}
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

      {!introPassed && <CinematicIntroVideo onComplete={completeIntro} />}

      <TopHeroCarousel
        activeIndex={topHeroIndex}
        onNext={() => setTopHeroIndex((c) => (c + 1) % topHeroSlides.length)}
        onPrevious={() => setTopHeroIndex((c) => (c + topHeroSlides.length - 1) % topHeroSlides.length)}
        onSelect={setTopHeroIndex}
        onNavigate={onNavigate}
        language={currentLanguage}
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
            {t('landing.hero.description', '질문, 요약, 오답, 복습까지 공부의 흐름을 한곳에서 관리하는 학습 파트너입니다.')}
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
        <View className="sagak-hover-zoom" style={[styles.visualCard, shadows.card]}>
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

      <View nativeID="features" className="keyword-section record-section sagak-fade-up" onLayout={(event) => handleSectionLayout('record', event)} style={styles.revealSection}>
        <SectionKeyword label={currentSectionKeywords.record} motion={sectionKeywordMotions.record} style={styles.bgRecord} />
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionEyebrow}>OPENING NOTES</Text>
          <Text style={styles.sectionTitle}>{t('landing.reveal.title', '사각사각이 학습을 여는 방식')}</Text>
          <Text style={styles.sectionDescription}>
            {t('landing.reveal.description', '조용한 기록, 다정한 피드백, 반복되는 복습을 한 페이지에서 이어갑니다.')}
          </Text>
        </View>
        <View style={styles.recordExperience}>
          <View className="sagak-hover-zoom" dataSet={{ sagakScrollSection: 'true' }} style={[styles.recordMainCard, shadows.card]}>
            <View style={styles.recordHeaderRow}>
              <Text style={styles.recordCardTitle}>{exampleCopy.recordTitle}</Text>
              <Text style={styles.recordStreak}>{exampleCopy.recordStreak}</Text>
            </View>
            {exampleCopy.recordRows.map((item) => (
              <View key={item} style={styles.recordLogRow}>
                <View style={styles.recordLogDot} />
                <Text style={styles.recordLogText}>{item}</Text>
              </View>
            ))}
          </View>
          <View style={styles.recordSideStack}>
            <View className="sagak-hover-zoom" style={[styles.recordMiniCard, styles.recordMiniCardMint]}>
              <Text style={styles.recordMiniLabel}>{exampleCopy.openingNotes}</Text>
              <Text style={styles.recordMiniValue}>05/28</Text>
              <Text style={styles.recordMiniText}>{exampleCopy.recordMiniText}</Text>
            </View>
            <View className="sagak-hover-zoom" style={[styles.recordMiniCard, styles.recordMiniCardCream]}>
              <Text style={styles.recordMiniLabel}>{exampleCopy.savedQuestions}</Text>
              <Text style={styles.recordMiniValue}>{exampleCopy.savedQuestionsValue}</Text>
              <Text style={styles.recordMiniText}>{exampleCopy.savedQuestionsText}</Text>
            </View>
          </View>
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

      <ProjectGroundedCopySection copy={projectCopy} />

      
      {/* 1. 계획 섹션 */}
      <View nativeID="plan" className="keyword-section plan-section sagak-fade-up" onLayout={(event) => handleSectionLayout('plan', event)} style={styles.newSection}>
        <SectionKeyword label={currentSectionKeywords.plan} motion={sectionKeywordMotions.plan} style={styles.bgPlan} />
        <View style={styles.newSectionInner}>
          <View style={styles.newTextCol}>
            <Text style={styles.newSectionTitle}>{t('landing.story.plan.title', '하루 계획이 흩어지지 않게')}</Text>
            <Text style={styles.newSectionDesc}>{t('landing.story.plan.description', '일정표와 타임라인으로 오늘의 목표를 한눈에 관리하세요.')}</Text>
            <View style={styles.tagWrap}><Text style={styles.tagText}>{t('landing.story.plan.chip1', '일정')}</Text></View>
          </View>
          <View style={[styles.newVisualCol, { alignItems: 'flex-end' }]}>
            <View className="sagak-hover-zoom" style={[styles.mockCard, styles.planMock]}>
              <View style={styles.planHeader}>
                <Text style={styles.planMonth}>{exampleCopy.month}</Text>
                <View style={styles.planDday}><Text style={styles.planDdayText}>D-12</Text></View>
              </View>
              <View style={styles.planTimeline}>
                {exampleCopy.planRows.map((item, index) => (
                  <View key={item} style={styles.planTimeItem}>
                    <View style={[styles.planTimeDot, index === 1 && { backgroundColor: '#FF8A65' }, index === 3 && { backgroundColor: '#173B63' }]} />
                    <Text style={styles.planTimeText}>{item}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.planPriorityBox}>
                <Text style={styles.planPriorityTitle}>{exampleCopy.priorityTitle}</Text>
                {exampleCopy.priorityRows.map((item) => (
                  <Text key={item} style={styles.planPriorityText}>{item}</Text>
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 2. 질문 섹션 */}
      <View nativeID="question" className="keyword-section question-section sagak-fade-up delay-1" onLayout={(event) => handleSectionLayout('question', event)} style={styles.newSection}>
        <SectionKeyword label={currentSectionKeywords.question} motion={sectionKeywordMotions.question} style={styles.bgQuestion} />
        <View style={[styles.newSectionInner, { flexDirection: 'column', alignItems: 'center', textAlign: 'center' }]}>
          <View style={[styles.newTextCol, { width: '100%', alignItems: 'center', marginBottom: 40 }]}>
            <Text style={[styles.newSectionTitle, { textAlign: 'center' }]}>{t('landing.story.ai.title', '질문하고, 요약하고, 다시 보기')}</Text>
            <Text style={[styles.newSectionDesc, { textAlign: 'center' }]}>{t('landing.story.ai.description', '막히는 부분은 언제든 AI에게 질문하고 힌트를 얻으세요.')}</Text>
          </View>
          <View style={[styles.newVisualCol, { width: '100%', maxWidth: 600, position: 'relative' }]}>
            <View style={[styles.floatingBubble, { top: -20, left: -40, backgroundColor: '#FFFDF6' }]}><Text style={styles.floatingBubbleIcon}>?</Text></View>
            <View style={[styles.floatingBubble, { bottom: -20, right: -40, backgroundColor: '#FF8A65' }]}><Text style={styles.floatingBubbleIconLight}>AI</Text></View>
            
            <View className="sagak-hover-zoom" style={[styles.mockCard, styles.chatMock]}>
              <View style={styles.chatUserBubble}>
                <Text style={styles.chatUserText}>{exampleCopy.chatQuestion}</Text>
              </View>
              <View style={styles.chatAiBubble}>
                <Text style={styles.chatAiText}>{exampleCopy.chatAnswer}</Text>
                <View style={styles.chatActions}>
                  <View style={styles.chatBtn} className="sagak-pencil-interactive"><Text style={styles.chatBtnText}>{exampleCopy.summarize}</Text></View>
                  <View style={[styles.chatBtn, { backgroundColor: '#F1F5F9' }]} className="sagak-pencil-interactive"><Text style={[styles.chatBtnText, { color: '#64748B' }]}>{exampleCopy.review}</Text></View>
                  <View style={[styles.chatBtn, { backgroundColor: '#FFF5D6' }]} className="sagak-pencil-interactive"><Text style={[styles.chatBtnText, { color: '#A15C00' }]}>{exampleCopy.example}</Text></View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 3. 요약 섹션 */}
      <View nativeID="summary" className="keyword-section summary-section sagak-fade-up delay-2" onLayout={(event) => handleSectionLayout('summary', event)} style={styles.newSection}>
        <SectionKeyword label={currentSectionKeywords.summary} motion={sectionKeywordMotions.summary} style={styles.bgSummary} />
        <View style={[styles.newSectionInner, { flexDirection: 'row-reverse' }]}>
          <View style={styles.newTextCol}>
            <Text style={styles.newSectionTitle}>{t('landing.summary.title', '긴 내용을 핵심만 남기세요')}</Text>
            <Text style={styles.newSectionDesc}>{t('landing.summary.description', '노트 필기와 문서 하이라이트로 배운 것을 온전히 내 것으로 만듭니다.')}</Text>
          </View>
          <View style={[styles.newVisualCol, { alignItems: 'flex-start' }]}>
            <View className="sagak-hover-zoom" style={[styles.mockCard, styles.noteMock]}>
              <View style={styles.noteBadge}><Text style={styles.noteBadgeText}>{exampleCopy.summaryDone}</Text></View>
              <Text style={styles.noteTitle}>{exampleCopy.summarySubject}</Text>
              <View style={styles.summaryBulletList}>
                {exampleCopy.summaryBullets.map((item, index) => (
                  <View key={item} style={styles.summaryBulletRow}>
                    <Text style={styles.summaryBulletNumber}>{index + 1}</Text>
                    <Text style={[styles.summaryBulletText, index === 2 && styles.summaryHighlightText]}>{item}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.summaryTagRow}>
                {exampleCopy.summaryTags.map((tag) => (
                  <Text key={tag} style={styles.summaryTag}>{tag}</Text>
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 4. 오답 섹션 */}
      <View nativeID="report" className="report-section sagak-fade-up delay-1" onLayout={(event) => handleSectionLayout('report', event)} style={styles.newSection}>
        <SectionKeyword label={currentSectionKeywords.report} motion={sectionKeywordMotions.report} style={styles.bgReport} />
        <View style={styles.newSectionInner}>
          <View style={styles.newTextCol}>
            <Text style={styles.newSectionTitle}>{t('landing.report.title', '틀린 이유를 정확히 이해하세요')}</Text>
            <Text style={styles.newSectionDesc}>{t('landing.report.description', '내 답안과 정답을 비교하고 AI가 분석해주는 오답 리포트를 확인하세요.')}</Text>
          </View>
          <View style={[styles.newVisualCol, { position: 'relative', height: 320 }]}>
            {/* 겹쳐진 카드들 */}
            <View style={[styles.mockCard, styles.reportCardBg2]} />
            <View style={[styles.mockCard, styles.reportCardBg1]} />
            <View className="sagak-hover-zoom" style={[styles.mockCard, styles.reportCardMain]}>
              <View style={styles.reportHeader}>
                <Text style={styles.reportTitle}>{exampleCopy.reportTitle}</Text>
                <Text style={styles.reportScore}>-5점</Text>
              </View>
              <View style={styles.reportRow}>
                <Text style={styles.reportLabel}>{exampleCopy.myAnswer}</Text>
                <Text style={styles.reportWrong}>④</Text>
              </View>
              <View style={styles.reportRow}>
                <Text style={styles.reportLabel}>{exampleCopy.correctAnswer}</Text>
                <Text style={styles.reportCorrect}>②</Text>
              </View>
              <View style={styles.reportReason}>
                <Text style={styles.reportReasonTitle}>{exampleCopy.wrongReason}</Text>
                <Text style={styles.reportReasonText}>{exampleCopy.wrongReasonText}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 5. 신뢰/TRUST 섹션 */}
      <View nativeID="trust" className="trust-section sagak-fade-up delay-2" onLayout={(event) => handleSectionLayout('trust', event)} style={styles.newSection}>
        <SectionKeyword label={currentSectionKeywords.trust} motion={sectionKeywordMotions.trust} style={styles.bgTrust} />
        <View style={[styles.newSectionInner, { alignItems: 'flex-start' }]}>
          <View style={[styles.newTextCol, { paddingTop: 40 }]}>
            <View style={styles.tagWrap}><Text style={styles.tagText}>{exampleCopy.trustTag}</Text></View>
            <Text style={[styles.newSectionTitle, { marginTop: 20 }]}>{t('landing.trust.title', '차분하지만 믿을 수 있는 학습 공간')}</Text>
            <Text style={styles.newSectionDesc}>{t('landing.trust.description', '화려한 효과보다 실제 학습 흐름, 접근성, 기존 API 안정성을 우선합니다.')}</Text>
          </View>
          <View style={[styles.newVisualCol, { flex: 1.2 }]}>
            <View style={styles.trustCardsContainer}>
              <View className="sagak-hover-zoom" style={[styles.mockCard, styles.trustCard]}>
                <View style={styles.trustIconWrap}><Text style={styles.trustIcon}>🔗</Text></View>
                <View style={styles.trustCardContent}>
                  <Text style={styles.trustCardTitle}>{t('landing.trust.item1', '기존 흐름 유지')}</Text>
                  <Text style={styles.trustCardDesc}>{t('landing.trust.description1', '로그인/회원가입/라우팅 구조를 무리 없이 이어갑니다.')}</Text>
                </View>
              </View>
              <View className="sagak-hover-zoom" style={[styles.mockCard, styles.trustCard]}>
                <View style={styles.trustIconWrap}><Text style={styles.trustIcon}>👁️</Text></View>
                <View style={styles.trustCardContent}>
                  <Text style={styles.trustCardTitle}>{t('landing.trust.item2', '접근성 대응')}</Text>
                  <Text style={styles.trustCardDesc}>{t('landing.trust.description2', '모션 민감 사용자를 위한 reduced motion 설정을 지원합니다.')}</Text>
                </View>
              </View>
              <View className="sagak-hover-zoom" style={[styles.mockCard, styles.trustCard]}>
                <View style={styles.trustIconWrap}><Text style={styles.trustIcon}>🛡️</Text></View>
                <View style={styles.trustCardContent}>
                  <Text style={styles.trustCardTitle}>{t('landing.trust.item3', '안정적인 확장성')}</Text>
                  <Text style={styles.trustCardDesc}>{t('landing.trust.description3', '기존 백엔드 흐름을 유지하며 안정적으로 기능을 확장합니다.')}</Text>
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
    overflow: 'hidden',
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
    left: 0,
    right: 0,
    top: '50%',
    fontSize: 210,
    lineHeight: 230,
    fontWeight: '900',
    color: 'rgba(82, 89, 98, 0.28)',
    zIndex: 40,
    opacity: 0,
    filter: 'blur(8px)',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    textAlign: 'center',
  },
  bgRecord: {
    top: '50%',
  },
  bgPlan: {
    top: '50%',
  },
  bgQuestion: {
    top: '50%',
  },
  bgSummary: {
    top: '50%',
  },
  bgReport: {
    top: '50%',
  },
  bgTrust: {
    top: '50%',
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
  planPriorityBox: {
    marginTop: 28,
    backgroundColor: '#FFF8E7',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(244, 190, 100, 0.35)',
    gap: 8,
  },
  planPriorityTitle: {
    color: '#173B63',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
  },
  planPriorityText: {
    color: '#5A6472',
    fontSize: 14,
    fontWeight: '700',
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
    flexWrap: 'wrap',
    gap: 12,
  },
  chatBtn: {
    backgroundColor: '#5CC6B8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    cursor: 'pointer',
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
  floatingBubbleIcon: {
    color: '#173B63',
    fontSize: 28,
    fontWeight: '900',
  },
  floatingBubbleIconLight: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
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
  summaryBulletList: {
    gap: 11,
  },
  summaryBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  summaryBulletNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DDF4F0',
    color: '#0F766E',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 24,
  },
  summaryBulletText: {
    flex: 1,
    color: '#334155',
    fontSize: 14,
    lineHeight: 23,
    fontWeight: '700',
  },
  summaryHighlightText: {
    backgroundColor: 'rgba(244, 190, 100, 0.28)',
    borderRadius: 8,
    paddingHorizontal: 6,
  },
  summaryTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 22,
  },
  summaryTag: {
    backgroundColor: '#F1F5F9',
    color: '#173B63',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '900',
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
    width: '100vw',
    height: '100dvh',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#071827',
  },
  introFilm: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#071827',
    zIndex: 0,
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
    paddingVertical: 104,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(21, 32, 43, 0.08)',
  },
  topHeroContent: {
    width: '100%',
    maxWidth: 1060,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 34,
  },
  topHeroCopy: {
    flex: 1,
    minWidth: 280,
    maxWidth: 520,
  },
  topHeroEyebrow: {
    alignSelf: 'flex-start',
    color: '#0F766E',
    backgroundColor: 'rgba(115, 201, 189, 0.18)',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 18,
  },
  topHeroTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#15202B',
    textAlign: 'left',
    lineHeight: 56,
    marginBottom: 24,
  },
  topHeroDescription: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'left',
    lineHeight: 28,
    marginBottom: 32,
  },
  topHeroCta: {
    backgroundColor: '#5CC6B8',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 999,
    cursor: 'pointer',
    alignSelf: 'flex-start',
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
    cursor: 'pointer',
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
    cursor: 'pointer',
  },
  topHeroDotActive: {
    width: 24,
    backgroundColor: '#5CC6B8',
  },
  topHeroMockup: {
    flex: 1,
    minWidth: 290,
    maxWidth: 430,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(21, 32, 43, 0.08)',
    padding: 26,
    shadowColor: '#0F1B2D',
    shadowOpacity: 0.11,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
  },
  topHeroMockupRecord: {
    backgroundColor: '#FFFFFF',
  },
  topHeroMockupPlan: {
    backgroundColor: '#F8FFFD',
  },
  topHeroMockupChat: {
    backgroundColor: '#F6F8FB',
  },
  topHeroMockupSummary: {
    backgroundColor: '#FFFDF6',
  },
  topHeroMockupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  topHeroMockupTitle: {
    color: '#173B63',
    fontSize: 18,
    fontWeight: '900',
  },
  topHeroMockupBadge: {
    color: '#FFFFFF',
    backgroundColor: '#FF8A65',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '900',
  },
  topHeroMockupRow: {
    minHeight: 43,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  topHeroMockupCheck: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  topHeroMockupCheckDone: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#73C9BD',
  },
  topHeroMockupRowText: {
    flex: 1,
    color: '#334155',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '800',
  },
  topHeroQuestionBubble: {
    alignSelf: 'flex-end',
    maxWidth: '84%',
    backgroundColor: '#173B63',
    borderRadius: 20,
    borderBottomRightRadius: 4,
    padding: 16,
    marginBottom: 16,
  },
  topHeroQuestionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  topHeroAnswerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    padding: 18,
    marginBottom: 15,
  },
  topHeroAnswerTitle: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 7,
  },
  topHeroAnswerText: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
  },
  topHeroActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  topHeroActionPill: {
    color: '#FFFFFF',
    backgroundColor: '#73C9BD',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '900',
  },
  topHeroActionPillMuted: {
    color: '#64748B',
    backgroundColor: '#EAF0F5',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '900',
  },
  topHeroSummarySubject: {
    color: '#15202B',
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '900',
    marginTop: 14,
    marginBottom: 18,
  },
  topHeroSummaryLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 11,
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
    cursor: 'pointer',
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
    alignItems: 'center',
    cursor: 'pointer'
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
    alignItems: 'center',
    cursor: 'pointer'
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
    justifyContent: 'center',
    cursor: 'pointer'
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
    backgroundColor: colors.line,
    cursor: 'pointer'
  },
  heroCarouselDotActive: {
    width: 26,
    backgroundColor: colors.mintDeep
  },
  projectSection: {
    width: '100%',
    maxWidth: 1180,
    paddingHorizontal: 18,
    paddingTop: 82,
    paddingBottom: 34,
    gap: 28,
  },
  projectHeading: {
    maxWidth: 820,
  },
  projectCardGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  projectCard: {
    flexGrow: 1,
    flexBasis: 250,
    minWidth: 240,
    backgroundColor: '#FFFDF6',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(21, 32, 43, 0.06)',
    padding: 24,
    overflow: 'hidden',
  },
  projectCardRule: {
    width: 52,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#73C9BD',
    marginBottom: 20,
  },
  projectCardTitle: {
    color: '#15202B',
    fontSize: 19,
    lineHeight: 27,
    fontWeight: '900',
    marginBottom: 10,
  },
  projectCardDescription: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '600',
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
    marginTop: 24,
    cursor: 'pointer'
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
    zIndex: 5,
    cursor: 'pointer'
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
    backgroundColor: colors.surface,
    cursor: 'pointer'
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
    overflow: 'hidden',
  },
  revealGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingHorizontal: 18
  },
  recordExperience: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    paddingHorizontal: 18,
    position: 'relative',
    zIndex: 2,
  },
  recordMainCard: {
    flex: 1.25,
    minWidth: 290,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.line,
    padding: 26,
  },
  recordHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  recordCardTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
  },
  recordStreak: {
    color: '#FFFFFF',
    backgroundColor: '#173B63',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '900',
  },
  recordLogRow: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  recordLogDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#73C9BD',
  },
  recordLogText: {
    flex: 1,
    color: '#334155',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '800',
  },
  recordSideStack: {
    flex: 0.75,
    minWidth: 250,
    gap: 14,
  },
  recordMiniCard: {
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.line,
  },
  recordMiniCardMint: {
    backgroundColor: '#E8FAF6',
  },
  recordMiniCardCream: {
    backgroundColor: '#FFF5D6',
  },
  recordMiniLabel: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  recordMiniValue: {
    color: '#173B63',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    marginBottom: 8,
  },
  recordMiniText: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
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
    backgroundColor: colors.surface,
    cursor: 'pointer'
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
    marginTop: 28,
    cursor: 'pointer'
  },
  finalCtaButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '900'
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
    position: 'relative',
    cursor: 'pointer'
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
