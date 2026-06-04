import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import {
  askAIQuestion,
  createAIChatMessage,
  createAIChatRoom,
  deleteAIChatRoom,
  getAIChatRooms,
  getAIRecommendation,
  reviewAIImageAttachment,
  summarizeText,
  analyzeWrongAnswer,
  analyzeAIStudyMaterialAttachment,
  updateAIChatRoom
} from '../services/api';
import AccessibleTextInput from '../components/AccessibleTextInput';
import FieldFeedback from '../components/FieldFeedback';
import ReadableText from '../components/ReadableText';
import { PanelSkeleton } from '../components/Skeleton';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { useLanguage } from '../i18n';
import { colors, interactions, interactiveStateStyles, shadows } from '../styles/theme';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_REVIEW_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_REVIEW_FILE_TYPES = [...SUPPORTED_IMAGE_TYPES, 'application/pdf'];
const AI_MOCK_MODE_STORAGE_KEY = 'smartEdu.aiMockMode';
const AI_AUDIO_BRIEFING_READING_ID = 'ai-audio-briefing';
const SPEECH_LANG_BY_LANGUAGE = {
  ko: 'ko-KR',
  en: 'en-US',
  ja: 'ja-JP',
  zh: 'zh-CN'
};
const VOICE_LABEL_BY_LANGUAGE = {
  ADULT_MALE: {
    ko: '차분한 낮은 톤',
    en: 'calm low tone',
    ja: '落ち着いた低めの声',
    zh: '沉稳低音'
  },
  ADULT_FEMALE: {
    ko: '또렷한 기본 톤',
    en: 'clear default tone',
    ja: 'はっきりした標準の声',
    zh: '清晰默认音色'
  },
  CHILD_FRIENDLY: {
    ko: '밝은 친근한 톤',
    en: 'bright friendly tone',
    ja: '明るく親しみやすい声',
    zh: '明快亲切音色'
  }
};

function createRoomTitle(question) {
  const cleanQuestion = String(question || '').replace(/\s+/g, ' ').trim();

  if (!cleanQuestion) {
    return 'AI 대화';
  }

  return cleanQuestion.length > 22 ? `${cleanQuestion.slice(0, 22)}...` : cleanQuestion;
}

function normalizeChatMessage(message) {
  return {
    id: message.id,
    question: message.question,
    answer: message.answer,
    isTruncated: Boolean(message.isTruncated),
    isMock: Boolean(message.isMock),
    source: message.source || 'AI_QNA',
    createdAt: message.createdAt || new Date().toISOString()
  };
}

function normalizeChatRoom(room) {
  return {
    id: room.id,
    title: room.title || 'AI 대화',
    isPinned: Boolean(room.isPinned),
    messages: Array.isArray(room.messages) ? room.messages.map(normalizeChatMessage) : [],
    updatedAt: room.updatedAt || new Date().toISOString()
  };
}

function sortChatRooms(rooms) {
  return [...rooms].sort((a, b) => {
    const pinnedDiff = Number(b.isPinned) - Number(a.isPinned);

    if (pinnedDiff !== 0) {
      return pinnedDiff;
    }

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function applyChatRoomUpdate(rooms, nextRoom) {
  const otherRooms = rooms.filter((room) => room.id !== nextRoom.id);
  return sortChatRooms([nextRoom, ...otherRooms]).slice(0, 8);
}

function readStoredMockMode() {
  try {
    return globalThis.localStorage?.getItem(AI_MOCK_MODE_STORAGE_KEY) === 'true';
  } catch (error) {
    return false;
  }
}

function writeStoredMockMode(enabled) {
  try {
    globalThis.localStorage?.setItem(AI_MOCK_MODE_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch (error) {
    // localStorage is unavailable in some native or restricted browser contexts.
  }
}

function formatFileSize(bytes = 0) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

const AI_LOCALIZED_COPY = {
  ko: {
    imageAttached: '이미지 파일을 선택했어요. 분석 요청 시 서버에서 임시 검토한 뒤 보관하지 않습니다.',
    imageHelp: (size) => `PNG, JPG, WEBP, GIF 이미지를 ${size} 이하로 첨부할 수 있어요.`,
    pdfPreview: '텍스트 기반 PDF는 텍스트 추출을 시도합니다. 스캔 PDF는 추출되지 않을 수 있어요.',
    reviewImageAttached: '이미지 파일을 선택했어요. 이번 버전에서는 형식·용량·메타데이터만 검토합니다.',
    reviewHelp: (size) => `이미지 또는 텍스트 기반 PDF를 ${size} 이하로 선택할 수 있어요.`,
    pdfSource: 'PDF 자료',
    imageSource: '이미지 자료',
    fallbackFile: '학습 자료',
    noteTitle: (source) => `${source} 학습 노트 초안`,
    reviewSummary: (fileName) => [
      `${fileName}에서 추출 가능한 학습 내용을 기준으로 정리한 초안입니다.`,
      '핵심 개념을 2~3개 문장으로 압축하고, 복습할 질문을 함께 제안합니다.',
      '생성된 내용은 화면에서 확인하는 초안이며, 파일은 서버에 보관하지 않습니다.'
    ],
    reviewQuizzes: [
      {
        question: '이 자료에서 먼저 확인해야 할 핵심 개념은 무엇인가요?',
        answer: '자료 제목, 단원명, 반복 등장하는 키워드를 먼저 찾습니다.'
      },
      {
        question: '자동 퀴즈 생성 전 사용자가 확인해야 할 점은 무엇인가요?',
        answer: '개인정보가 포함되지 않았는지 확인하고, 추출된 텍스트와 생성 초안을 직접 검토합니다.'
      },
      {
        question: '생성된 노트와 퀴즈는 어떻게 활용하면 좋나요?',
        answer: '핵심 개념을 빠르게 훑은 뒤, 복습 퀴즈를 풀며 부족한 단원을 다시 확인합니다.'
      }
    ],
    mockAnswer: (question) => [
      `예시 응답입니다. 질문의 핵심은 "${question.slice(0, 80)}${question.length > 80 ? '...' : ''}"로 확인됩니다.`,
      '먼저 개념을 한 문장으로 정리하고, 교재 예제 1개를 풀어 본 뒤, 헷갈린 부분만 다시 질문해 보세요.',
      '연습 모드에서는 실제 요청 대신 안전한 예시 응답으로 학습 흐름을 확인합니다.'
    ].join(' '),
    recommendation: {
      recommendedSubject: '오늘의 복습 루틴',
      tips: [
        '마감이 가까운 일정 1개를 먼저 확인하세요.',
        '25분 집중 세션을 시작하고 끝난 뒤 완료한 내용을 기록하세요.',
        '오답노트에서 같은 유형 문제를 1개만 다시 풀어 보세요.'
      ]
    },
    recommendationBasis: {
      label: '실제 학습 데이터 기준',
      empty: '저장된 일정이나 태스크가 부족해 기본 복습 루틴을 함께 제안했습니다.',
      counts: ({ scheduleCount, taskCount }) => `일정 ${scheduleCount}개 · 태스크 ${taskCount}개를 기준으로 분석했습니다.`,
      recentSchedules: '최근 일정',
      recentTasks: '최근 태스크',
      noData: '기록 없음'
    },
    summary: (preview) => [
      '- 연습 요약입니다. 본문에서 핵심 개념과 연결 단어를 먼저 분리합니다.',
      '- 예시나 문제 풀이가 있다면 개념 적용 순서를 따로 표시합니다.',
      `- 다시 볼 부분: ${preview}`
    ].join('\n'),
    weakCalculation: 'calculation mistake',
    weakConcept: 'concept misunderstanding',
    wrongAnalysis: (problem, userAnswer) => [
      '연습 분석입니다. 오답 점검 흐름을 따라 문제 핵심과 풀이 과정을 정리합니다.',
      `문제 핵심: ${problem.slice(0, 80)}${problem.length > 80 ? '...' : ''}`,
      userAnswer ? `작성한 답: ${userAnswer.slice(0, 80)}${userAnswer.length > 80 ? '...' : ''}` : '작성한 답이 없어 풀이 과정 중심으로 점검합니다.',
      '정답을 바로 외우기보다 왜 그 선택을 했는지 한 단계만 다시 적어 보세요.'
    ].join(' '),
    audioBriefing: {
      eyebrow: '브라우저 음성 안내',
      title: '오늘의 오디오 브리핑',
      description: '현재 AI 학습 화면의 기록을 짧게 정리해 접근성 목소리 설정으로 읽어줍니다.',
      play: '브리핑 듣기',
      stop: '정지',
      playing: '오디오 브리핑을 재생합니다.',
      stopped: '오디오 브리핑을 멈췄습니다.',
      notSupported: '현재 브라우저는 오디오 브리핑 읽어주기를 지원하지 않습니다.',
      notice: '화면에 표시된 학습 상태를 읽어 주는 로컬 브리핑입니다.',
      voiceLabel: (voice) => `접근성 목소리 설정: ${voice}`,
      actionLabel: '오늘의 AI 학습 오디오 브리핑 재생 또는 정지',
      lines: ({ mockMode, chatCount, hasRecommendation, hasSummary, hasWrongAnalysis, hasReviewMock, hasImageInsight }) => [
        mockMode ? 'AI 연습 모드가 켜져 있어 예시 응답으로 학습 흐름을 확인 중입니다.' : 'AI 학습 API 흐름을 사용할 준비가 되어 있습니다. 민감정보는 질문에 포함하지 않는 것이 원칙입니다.',
        chatCount > 0 ? `최근 AI 대화 ${chatCount}개가 이 브리핑에 반영됩니다.` : '아직 AI 질문 기록이 없어 첫 질문부터 가볍게 시작하면 좋습니다.',
        hasRecommendation ? '맞춤 학습 추천 결과가 있어 오늘의 복습 루틴을 바로 확인할 수 있습니다.' : '맞춤 추천을 한 번 실행하면 오늘의 복습 방향을 더 쉽게 잡을 수 있습니다.',
        hasSummary ? '문서 요약 결과가 준비되어 있어 핵심 개념을 다시 훑기 좋습니다.' : '긴 글 요약을 사용하면 자료의 핵심 개념을 빠르게 정리할 수 있습니다.',
        hasWrongAnalysis ? '오답 분석 기록이 있어 헷갈린 풀이 과정을 다시 볼 수 있습니다.' : '오답 원인 분석을 사용하면 취약한 풀이 단계를 확인할 수 있습니다.',
        hasReviewMock || hasImageInsight ? '첨부 파일 분석 결과가 준비되어 있어 추출 상태와 생성 초안을 확인할 수 있습니다.' : '이미지와 PDF 첨부는 임시 분석 요청으로 처리되며 파일은 보관하지 않습니다.'
      ]
    },
    errors: {
      token: '로그인 정보가 만료되었을 수 있습니다. 다시 로그인하거나 연습 모드로 학습 흐름을 확인해 주세요.',
      quota: 'AI 사용 한도가 모두 소진되었거나 요청이 너무 많습니다. 잠시 후 다시 시도하거나 연습 모드로 흐름을 이어가세요.',
      quotaFallback: 'AI 사용 한도 문제로 안전한 기본 응답을 표시했습니다. 잠시 후 다시 시도하거나 연습 모드를 사용할 수 있습니다.',
      provider: 'AI 제공자 설정이나 API key 상태를 확인해야 합니다. 현재 화면에서는 연습 모드로 흐름을 확인할 수 있습니다.',
      providerFallback: 'AI 제공자 연결이 불안정해 안전한 기본 응답을 표시했습니다. 실제 학습 흐름은 계속 확인할 수 있습니다.',
      network: '네트워크 연결이 불안정해 AI 응답을 가져오지 못했습니다. 연결을 확인하거나 연습 모드로 전환해 주세요.',
      fallback: 'AI 응답을 불러오지 못했습니다. 민감정보를 포함하지 않았는지 확인하고, 필요하면 연습 모드로 흐름을 확인해 주세요.'
    },
    imageInsightQuestion: (name) => `[이미지 첨부 검토] ${name}`,
    imageInsightAnswer: ({ format, dimensions, warnings }) => [
      `이미지 파일을 임시로 검토했습니다. 형식과 크기는 정상입니다. 형식: ${format}, 크기: ${dimensions}.`,
      '선택한 파일은 서버에 저장되지 않습니다.',
      '이번 버전에서는 이미지 OCR과 AI Vision 분석을 지원하지 않습니다. 자동 노트·퀴즈 생성을 원하면 텍스트 기반 PDF를 사용해 주세요.',
      ...(warnings || [])
    ].join('\n'),
    imageInsightSuccess: '이미지 1차 검토 결과를 AI 대화방에 추가했습니다.',
    selectImageFirst: '먼저 이미지를 첨부해 주세요.',
    selectReviewFileFirst: '먼저 이미지 또는 텍스트 기반 PDF 파일을 선택해 주세요.',
    reviewResultSuccess: '첨부 파일 분석 결과를 생성했습니다.',
    reviewFileRemoved: '첨부 파일을 제거했습니다.',
    reviewFileAttached: '검토용 파일을 선택했습니다. 분석 요청 시 서버에서 임시 처리한 뒤 보관하지 않습니다.',
    imageReviewTitle: '이미지 파일 검토',
    imageReviewResultTitle: '이미지 검토 결과',
    imageReviewDescription: (size) => `PNG, JPG, WEBP, GIF 파일을 최대 ${size}까지 선택해 형식, 용량, 이미지 메타데이터를 검토합니다. 이미지 OCR과 AI Vision 분석은 지원하지 않습니다.`,
    materialReviewTitle: '텍스트 기반 PDF 노트·퀴즈 생성',
    materialReviewDescription: (size) => `텍스트 기반 PDF를 최대 ${size}까지 선택해 학습 내용을 추출하고 요약·노트·퀴즈 초안을 생성합니다. 이미지는 OCR 없이 형식 검토만 지원합니다.`,
    attachmentPrivacyNotice: '민감정보가 포함된 학습 자료는 첨부하지 마세요. 선택한 파일은 분석 요청 처리에만 사용되며 별도 보관하지 않습니다.',
    imageStoredNotice: '분석 요청 시 파일 형식, 크기, 이미지 메타데이터를 서버에서 임시 검토합니다.',
    reviewStoredNotice: '텍스트 기반 PDF는 텍스트 추출 후 요약·노트·퀴즈 초안을 생성합니다. 스캔 PDF와 이미지는 OCR을 지원하지 않아 자동 생성에 사용할 수 없습니다.',
    analyzeImageButton: '이미지 검토 실행',
    analyzeMaterialButton: '노트·퀴즈 생성',
    removeAttachment: '첨부 제거',
    analysisResultBadge: '분석 결과',
    extractedTextTitle: '추출 텍스트 미리보기',
    summaryTitle: '노트 요약',
    notesTitle: '학습 노트',
    quizTitle: '복습 퀴즈',
    keywordsTitle: '주요 키워드',
    warningsTitle: '확인 필요',
    noGeneratedResult: '텍스트를 추출하지 못했습니다. 자동 노트·퀴즈 생성을 원하면 텍스트 기반 PDF를 사용해 주세요.',
    unknownImageSize: '확인 불가',
    attachmentErrors: {
      tooLarge: '파일 용량이 허용 범위를 초과했습니다.',
      unsupported: '지원하지 않는 파일 형식입니다. 허용 형식과 확장자를 확인해 주세요.',
      failed: '첨부 파일을 분석하지 못했습니다. 파일을 다시 선택해 주세요.'
    },
    mockModeTitle: 'AI 연습 모드',
    mockModeDescription: 'AI 사용 한도나 제공자 연결이 불안정할 때 안전한 예시 응답으로 화면 흐름을 확인합니다.',
    mockModeActive: '연습 모드 사용 중',
    mockModeEnable: '연습 모드 켜기',
    mockQuestionSuccess: '연습 모드 응답을 추가했습니다.',
    mockRecommendationSuccess: '연습 모드 추천을 표시했습니다.',
    mockSummarySuccess: '연습 모드 요약을 표시했습니다.',
    mockWrongAnswerSuccess: '연습 모드 오답 분석을 표시했습니다.',
    mockModeOn: 'AI 연습 모드를 켰습니다. 안전한 예시 응답으로 흐름을 확인합니다.',
    mockModeOff: 'AI 연습 모드를 껐습니다. 기존 AI 학습 API 흐름을 사용합니다.',
    selectImageButton: '이미지 선택',
    selectMaterialButton: '파일 선택',
    selectMaterialFileAccessibilityLabel: '텍스트 기반 PDF 또는 이미지 파일 선택',
    practiceBadgeRecommendation: '연습 추천',
    practiceBadgeSummary: '연습 요약',
    practiceBadgeWrongAnswer: '연습 분석'
  },
  en: {
    imageAttached: 'Image file selected. It will be processed temporarily on request and not retained.',
    imageHelp: (size) => `You can attach PNG, JPG, WEBP, or GIF images up to ${size}.`,
    pdfPreview: 'Text-based PDFs will be parsed when possible. Scanned PDFs may not provide extractable text.',
    reviewImageAttached: 'Image file selected. This version checks only file type, size, and metadata.',
    reviewHelp: (size) => `You can choose an image or text-based PDF up to ${size}.`,
    pdfSource: 'PDF material',
    imageSource: 'Image material',
    fallbackFile: 'study material',
    noteTitle: (source) => `${source} study note draft`,
    reviewSummary: (fileName) => [
      `This is a draft organized from extractable learning content in ${fileName}.`,
      'It compresses key ideas into two or three sentences and suggests review questions.',
      'Generated content is a draft for on-screen review, and the file is not retained on the server.'
    ],
    reviewQuizzes: [
      {
        question: 'What core concept should be checked first in this material?',
        answer: 'Start with the title, unit name, and repeated keywords.'
      },
      {
        question: 'What should the user check before automatic quiz generation?',
        answer: 'Check that no personal information is included, then review the extracted text and generated draft yourself.'
      },
      {
        question: 'How should the generated notes and quizzes be used?',
        answer: 'Review the core concepts quickly, then solve the review quiz to find units that need another pass.'
      }
    ],
    mockAnswer: (question) => [
      `This is a practice response. The question appears to focus on "${question.slice(0, 80)}${question.length > 80 ? '...' : ''}".`,
      'First summarize the concept in one sentence, solve one textbook example, and then ask again only about the confusing part.',
      'Practice mode uses a safe sample response to confirm the learning flow.'
    ].join(' '),
    recommendation: {
      recommendedSubject: 'Today’s review routine',
      tips: [
        'Check one schedule item with an upcoming deadline first.',
        'Start a 25-minute focus session and record what you completed afterward.',
        'Redo just one similar problem from your wrong-answer notes.'
      ]
    },
    recommendationBasis: {
      label: 'Based on your learning data',
      empty: 'There is not enough saved schedule or task data yet, so a default review routine is included.',
      counts: ({ scheduleCount, taskCount }) => `Analyzed ${scheduleCount} schedule item${scheduleCount === 1 ? '' : 's'} and ${taskCount} task${taskCount === 1 ? '' : 's'}.`,
      recentSchedules: 'Recent schedules',
      recentTasks: 'Recent tasks',
      noData: 'No records'
    },
    summary: (preview) => [
      '- This is a practice summary. It first separates key concepts and linking words from the text.',
      '- If there is an example or solution, it marks the order for applying the concept.',
      `- Review again: ${preview}`
    ].join('\n'),
    weakCalculation: 'calculation mistake',
    weakConcept: 'concept misunderstanding',
    wrongAnalysis: (problem, userAnswer) => [
      'This is a practice analysis. It follows the wrong-answer review flow and organizes the problem focus and solving process.',
      `Problem focus: ${problem.slice(0, 80)}${problem.length > 80 ? '...' : ''}`,
      userAnswer ? `Your answer: ${userAnswer.slice(0, 80)}${userAnswer.length > 80 ? '...' : ''}` : 'No answer was entered, so the review focuses on the solving process.',
      'Before memorizing the correct answer, write one step explaining why you chose that answer.'
    ].join(' '),
    audioBriefing: {
      eyebrow: 'Browser voice guide',
      title: "Today's audio briefing",
      description: 'Summarizes the current AI learning screen and reads it with your accessibility voice setting.',
      play: 'Play briefing',
      stop: 'Stop',
      playing: 'Playing the audio briefing.',
      stopped: 'Audio briefing stopped.',
      notSupported: 'This browser does not support audio briefing playback.',
      notice: 'This is a local briefing based on the learning state shown on the screen.',
      voiceLabel: (voice) => `Accessibility voice setting: ${voice}`,
      actionLabel: "Play or stop today's AI learning audio briefing",
      lines: ({ mockMode, chatCount, hasRecommendation, hasSummary, hasWrongAnalysis, hasReviewMock, hasImageInsight }) => [
        mockMode ? 'AI practice mode is on, so the flow uses sample responses.' : 'The AI learning API flow is ready. Do not include sensitive information in prompts.',
        chatCount > 0 ? `${chatCount} recent AI chat item${chatCount === 1 ? '' : 's'} will be reflected in this briefing.` : 'There are no AI questions yet, so start with one small question.',
        hasRecommendation ? 'A personalized recommendation is ready for today’s review routine.' : 'Run a recommendation once to make today’s review direction clearer.',
        hasSummary ? 'A document summary is ready, so you can review the key ideas quickly.' : 'Use long-text summary to organize key ideas from your material.',
        hasWrongAnalysis ? 'Wrong-answer analysis is ready, so you can revisit the confusing step.' : 'Use wrong-answer analysis to find the weak step in your solution.',
        hasReviewMock || hasImageInsight ? 'Attachment analysis results are ready, including extraction status and generated drafts.' : 'Image and PDF attachments are processed temporarily and are not retained.'
      ]
    },
    errors: {
      token: 'Your login session may have expired. Log in again or use practice mode to review the flow.',
      quota: 'The AI usage quota is exhausted or too many requests were sent. Try again later or use practice mode.',
      quotaFallback: 'The AI quota was unavailable, so a safe fallback response is shown. Try again later or use practice mode.',
      provider: 'The AI provider or API key setting needs to be checked. You can review the flow with practice mode.',
      providerFallback: 'The AI provider connection was unavailable, so a safe fallback response is shown while the learning flow remains usable.',
      network: 'The network connection is unstable, so the AI response could not be loaded. Check the connection or switch to practice mode.',
      fallback: 'Could not load the AI response. Check that no sensitive information is included, or use practice mode for the flow.'
    },
    imageInsightQuestion: (name) => `[Image attachment review] ${name}`,
    imageInsightAnswer: ({ format, dimensions, warnings }) => [
      `The image file was reviewed temporarily. Type and size are valid. Format: ${format}, dimensions: ${dimensions}.`,
      'The selected file is not stored on the server.',
      'This version does not support image OCR or AI Vision analysis. Use a text-based PDF for automatic note and quiz drafts.',
      ...(warnings || [])
    ].join('\n'),
    imageInsightSuccess: 'Image first-review result was added to the AI chat room.',
    selectImageFirst: 'Attach an image first.',
    selectReviewFileFirst: 'Choose an image or text-based PDF file first.',
    reviewResultSuccess: 'Attachment analysis result generated.',
    reviewFileRemoved: 'Attachment removed.',
    reviewFileAttached: 'Review file selected. It will be processed temporarily on request and not retained.',
    imageReviewTitle: 'Image file review',
    imageReviewResultTitle: 'Image review result',
    imageReviewDescription: (size) => `Select a PNG, JPG, WEBP, or GIF image up to ${size} to validate file type, size, and image metadata. Image OCR and AI Vision analysis are not supported.`,
    materialReviewTitle: 'Text-based PDF notes and quizzes',
    materialReviewDescription: (size) => `Select a text-based PDF up to ${size} to extract learning content and draft summaries, notes, and quizzes. Images are supported only for non-OCR file review.`,
    attachmentPrivacyNotice: 'Do not attach materials that include sensitive information. Selected files are used only for the analysis request and are not stored.',
    imageStoredNotice: 'When requested, the server temporarily validates the file type, size, and image metadata.',
    reviewStoredNotice: 'Text-based PDFs can be extracted and turned into draft summaries, notes, and quizzes. Scanned PDFs and images do not support OCR, so they cannot be used for automatic generation.',
    analyzeImageButton: 'Run image review',
    analyzeMaterialButton: 'Generate notes and quiz',
    removeAttachment: 'Remove attachment',
    analysisResultBadge: 'Analysis result',
    extractedTextTitle: 'Extracted text preview',
    summaryTitle: 'Note summary',
    notesTitle: 'Study notes',
    quizTitle: 'Review quiz',
    keywordsTitle: 'Keywords',
    warningsTitle: 'Needs review',
    noGeneratedResult: 'Could not extract text. Use a text-based PDF for automatic note and quiz generation.',
    unknownImageSize: 'unknown',
    attachmentErrors: {
      tooLarge: 'The file exceeds the allowed size.',
      unsupported: 'This file type is not supported. Check the allowed formats and extension.',
      failed: 'Could not analyze the attachment. Select the file again.'
    },
    mockModeTitle: 'AI practice mode',
    mockModeDescription: 'When the AI quota or provider connection is unstable, use safe sample responses to review the screen flow.',
    mockModeActive: 'Practice mode on',
    mockModeEnable: 'Enable practice mode',
    mockQuestionSuccess: 'Practice mode response added.',
    mockRecommendationSuccess: 'Practice mode recommendation shown.',
    mockSummarySuccess: 'Practice mode summary shown.',
    mockWrongAnswerSuccess: 'Practice mode wrong-answer analysis shown.',
    mockModeOn: 'AI practice mode is on. The flow will use safe sample responses.',
    mockModeOff: 'AI practice mode is off. The existing AI learning API flow will be used.',
    selectImageButton: 'Choose image',
    selectMaterialButton: 'Choose file',
    selectMaterialFileAccessibilityLabel: 'Choose a text-based PDF or image file',
    practiceBadgeRecommendation: 'Practice recommendation',
    practiceBadgeSummary: 'Practice summary',
    practiceBadgeWrongAnswer: 'Practice analysis'
  },
  ja: {
    imageAttached: '画像ファイルを選択しました。分析時に一時処理され、保存されません。',
    imageHelp: (size) => `PNG、JPG、WEBP、GIF画像を${size}以下で添付できます。`,
    pdfPreview: 'テキストベースのPDFは抽出を試みます。スキャンPDFでは抽出できない場合があります。',
    reviewImageAttached: '画像ファイルを選択しました。このバージョンでは形式・容量・メタデータのみ確認します。',
    reviewHelp: (size) => `画像またはテキストベースPDFを${size}以下で選択できます。`,
    pdfSource: 'PDF資料',
    imageSource: '画像資料',
    fallbackFile: '学習資料',
    noteTitle: (source) => `${source}学習ノート案`,
    reviewSummary: (fileName) => [
      `${fileName}から抽出できる学習内容を基に整理した下書きです。`,
      '重要な概念を2〜3文に圧縮し、復習用の質問も提案します。',
      '生成内容は画面で確認する下書きであり、ファイルはサーバーに保存されません。'
    ],
    reviewQuizzes: [
      {
        question: 'この資料で最初に確認すべき重要概念は何ですか？',
        answer: '資料タイトル、単元名、繰り返し出てくるキーワードを先に探します。'
      },
      {
        question: '自動クイズ生成の前にユーザーが確認すべき点は何ですか？',
        answer: '個人情報が含まれていないかを確認し、抽出テキストと生成下書きを自分で見直します。'
      },
      {
        question: '生成されたノートとクイズはどう使えばよいですか？',
        answer: '重要概念をすばやく確認し、復習クイズで見直す単元を見つけます。'
      }
    ],
    mockAnswer: (question) => [
      `練習応答です。質問の要点は「${question.slice(0, 80)}${question.length > 80 ? '...' : ''}」として確認できます。`,
      'まず概念を一文で整理し、教材の例題を1つ解いてから、迷った部分だけをもう一度質問してみましょう。',
      '練習モードでは安全なサンプル応答で学習の流れを確認します。'
    ].join(' '),
    recommendation: {
      recommendedSubject: '今日の復習ルーティン',
      tips: [
        '締切が近い予定を1つ先に確認しましょう。',
        '25分の集中セッションを始め、終わったら完了内容を記録しましょう。',
        '誤答ノートから同じタイプの問題を1問だけ解き直しましょう。'
      ]
    },
    recommendationBasis: {
      label: '実際の学習データに基づく',
      empty: '保存された予定やタスクがまだ少ないため、基本の復習ルーティンも合わせて提示しています。',
      counts: ({ scheduleCount, taskCount }) => `予定${scheduleCount}件・タスク${taskCount}件を基準に分析しました。`,
      recentSchedules: '最近の予定',
      recentTasks: '最近のタスク',
      noData: '記録なし'
    },
    summary: (preview) => [
      '- 練習要約です。本文から重要概念とつながり語を先に分けます。',
      '- 例や解法があれば、概念を適用する順序を別に示します。',
      `- もう一度見る部分: ${preview}`
    ].join('\n'),
    weakCalculation: '計算ミス',
    weakConcept: '概念理解のずれ',
    wrongAnalysis: (problem, userAnswer) => [
      '練習分析です。誤答確認の流れに沿って問題の要点と解き方を整理します。',
      `問題の要点: ${problem.slice(0, 80)}${problem.length > 80 ? '...' : ''}`,
      userAnswer ? `入力した答え: ${userAnswer.slice(0, 80)}${userAnswer.length > 80 ? '...' : ''}` : '入力した答えがないため、解き方の流れを中心に確認します。',
      '正解を覚える前に、なぜその選択をしたのかを一段階だけ書き直してみましょう。'
    ].join(' '),
    audioBriefing: {
      eyebrow: 'ブラウザ音声ガイド',
      title: '今日のオーディオブリーフィング',
      description: '現在のAI学習画面の記録を短く整理し、アクセシビリティの音声設定で読み上げます。',
      play: 'ブリーフィングを聞く',
      stop: '停止',
      playing: 'オーディオブリーフィングを再生します。',
      stopped: 'オーディオブリーフィングを停止しました。',
      notSupported: '現在のブラウザはオーディオブリーフィングの読み上げに対応していません。',
      notice: '画面に表示された学習状態を読み上げるローカルブリーフィングです。',
      voiceLabel: (voice) => `アクセシビリティ音声設定: ${voice}`,
      actionLabel: '今日のAI学習オーディオブリーフィングを再生または停止',
      lines: ({ mockMode, chatCount, hasRecommendation, hasSummary, hasWrongAnalysis, hasReviewMock, hasImageInsight }) => [
        mockMode ? 'AI練習モードがオンのため、サンプル応答で学習の流れを確認しています。' : 'AI学習APIフローを使う準備ができています。機密情報は質問に含めないことが原則です。',
        chatCount > 0 ? `最近のAI会話${chatCount}件をこのブリーフィングに反映します。` : 'まだAI質問の記録がないため、小さな質問から始めるとよいです。',
        hasRecommendation ? 'パーソナル推薦があり、今日の復習ルーティンを確認できます。' : '推薦を一度実行すると、今日の復習方向が見えやすくなります。',
        hasSummary ? '文書要約が準備されているため、重要概念をすばやく見直せます。' : '長文要約を使うと、資料の重要概念を整理できます。',
        hasWrongAnalysis ? '誤答分析があり、迷った解き方をもう一度確認できます。' : '誤答原因分析を使うと、弱い解法ステップを確認できます。',
        hasReviewMock || hasImageInsight ? '添付ファイルの分析結果が準備され、抽出状態と生成案を確認できます。' : '画像とPDF添付は一時分析として処理され、ファイルは保存されません。'
      ]
    },
    errors: {
      token: 'ログイン情報の有効期限が切れた可能性があります。再ログインするか、練習モードで流れを確認してください。',
      quota: 'AI利用上限に達したか、リクエストが多すぎます。しばらくしてから再試行するか、練習モードを使用してください。',
      quotaFallback: 'AI利用上限の問題により、安全な基本応答を表示しました。しばらくしてから再試行するか、練習モードを使用できます。',
      provider: 'AIプロバイダー設定またはAPI keyの状態確認が必要です。現在の画面は練習モードで流れを確認できます。',
      providerFallback: 'AIプロバイダー接続が利用できないため、安全な基本応答を表示しました。学習の流れはそのまま確認できます。',
      network: 'ネットワーク接続が不安定でAI応答を取得できませんでした。接続を確認するか練習モードに切り替えてください。',
      fallback: 'AI応答を読み込めませんでした。機密情報が含まれていないか確認し、必要なら練習モードで流れを確認してください。'
    },
    imageInsightQuestion: (name) => `[画像添付レビュー] ${name}`,
    imageInsightAnswer: ({ format, dimensions, warnings }) => [
      `画像ファイルを一時的に確認しました。形式とサイズは有効です。形式: ${format}、サイズ: ${dimensions}。`,
      '選択したファイルはサーバーに保存されません。',
      'このバージョンでは画像OCRとAI Vision分析に対応していません。自動ノート・クイズ生成にはテキストベースPDFを使用してください。',
      ...(warnings || [])
    ].join('\n'),
    imageInsightSuccess: '画像の一次確認結果をAIチャットルームに追加しました。',
    selectImageFirst: '先に画像を添付してください。',
    selectReviewFileFirst: '先に画像またはテキストベースPDFファイルを選択してください。',
    reviewResultSuccess: '添付ファイルの分析結果を生成しました。',
    reviewFileRemoved: '添付ファイルを削除しました。',
    reviewFileAttached: '確認用ファイルを選択しました。分析時に一時処理され、保存されません。',
    imageReviewTitle: '画像ファイル確認',
    imageReviewResultTitle: '画像確認結果',
    imageReviewDescription: (size) => `PNG、JPG、WEBP、GIF画像を${size}以下で選択し、形式、容量、画像メタデータを確認します。画像OCRとAI Vision分析には対応していません。`,
    materialReviewTitle: 'テキストベースPDFノート・クイズ生成',
    materialReviewDescription: (size) => `テキストベースPDFを${size}以下で選択し、学習内容を抽出して要約・ノート・クイズ案を生成します。画像はOCRなしのファイル確認のみ対応します。`,
    attachmentPrivacyNotice: '機密情報を含む学習資料は添付しないでください。選択したファイルは分析リクエストの処理にのみ使われ、保存されません。',
    imageStoredNotice: '分析時にファイル形式、サイズ、画像メタデータをサーバーで一時確認します。',
    reviewStoredNotice: 'テキストベースPDFは抽出後に要約・ノート・クイズ案を生成できます。スキャンPDFや画像はOCR非対応のため自動生成には使用できません。',
    analyzeImageButton: '画像確認を実行',
    analyzeMaterialButton: 'ノート・クイズ生成',
    removeAttachment: '添付を削除',
    analysisResultBadge: '分析結果',
    extractedTextTitle: '抽出テキストのプレビュー',
    summaryTitle: 'ノート要約',
    notesTitle: '学習ノート',
    quizTitle: '復習クイズ',
    keywordsTitle: '主要キーワード',
    warningsTitle: '確認が必要',
    noGeneratedResult: 'テキストを抽出できませんでした。自動ノート・クイズ生成にはテキストベースPDFを使用してください。',
    unknownImageSize: '確認不可',
    attachmentErrors: {
      tooLarge: 'ファイル容量が許容範囲を超えています。',
      unsupported: '対応していないファイル形式です。許可された形式と拡張子を確認してください。',
      failed: '添付ファイルを分析できませんでした。もう一度ファイルを選択してください。'
    },
    mockModeTitle: 'AI練習モード',
    mockModeDescription: 'AI利用上限やプロバイダー接続が不安定なとき、安全なサンプル応答で画面の流れを確認します。',
    mockModeActive: '練習モード使用中',
    mockModeEnable: '練習モードをオン',
    mockQuestionSuccess: '練習モード応答を追加しました。',
    mockRecommendationSuccess: '練習モード推薦を表示しました。',
    mockSummarySuccess: '練習モード要約を表示しました。',
    mockWrongAnswerSuccess: '練習モード誤答分析を表示しました。',
    mockModeOn: 'AI練習モードをオンにしました。安全なサンプル応答で流れを確認します。',
    mockModeOff: 'AI練習モードをオフにしました。既存のAI学習APIフローを使用します。',
    selectImageButton: '画像を選択',
    selectMaterialButton: 'ファイルを選択',
    selectMaterialFileAccessibilityLabel: 'テキストベースPDFまたは画像ファイルを選択',
    practiceBadgeRecommendation: '練習推薦',
    practiceBadgeSummary: '練習要約',
    practiceBadgeWrongAnswer: '練習分析'
  },
  zh: {
    imageAttached: '已选择图片文件。分析请求时会临时处理，且不会保存。',
    imageHelp: (size) => `可以附加 ${size} 以下的 PNG、JPG、WEBP、GIF 图片。`,
    pdfPreview: '将尝试提取文本型 PDF。扫描版 PDF 可能无法提取文本。',
    reviewImageAttached: '已选择图片文件。本版本仅检查格式、大小和元数据。',
    reviewHelp: (size) => `可以选择 ${size} 以下的图片或文本型 PDF。`,
    pdfSource: 'PDF 资料',
    imageSource: '图片资料',
    fallbackFile: '学习资料',
    noteTitle: (source) => `${source}学习笔记草稿`,
    reviewSummary: (fileName) => [
      `这是根据 ${fileName} 中可提取的学习内容整理出的草稿。`,
      '会把核心概念压缩成 2 到 3 句话，并一起提出复习问题。',
      '生成内容是屏幕上确认用的草稿，文件不会保存在服务器上。'
    ],
    reviewQuizzes: [
      {
        question: '这份资料中应先确认的核心概念是什么？',
        answer: '先查看资料标题、单元名和反复出现的关键词。'
      },
      {
        question: '自动生成测验前，用户需要确认什么？',
        answer: '确认不包含个人信息，并自行检查提取文本和生成草稿。'
      },
      {
        question: '生成的笔记和测验应该如何使用？',
        answer: '先快速查看核心概念，再通过复习测验找出需要重新学习的单元。'
      }
    ],
    mockAnswer: (question) => [
      `这是练习回复。问题重点可理解为“${question.slice(0, 80)}${question.length > 80 ? '...' : ''}”。`,
      '先用一句话整理概念，再做一道教材例题，最后只针对不清楚的部分继续提问。',
      '练习模式会使用安全的示例回复来确认学习流程。'
    ].join(' '),
    recommendation: {
      recommendedSubject: '今日复习节奏',
      tips: [
        '先确认一个临近截止的日程。',
        '开始 25 分钟专注，结束后记录完成内容。',
        '从错题笔记中只重做一道相同类型的问题。'
      ]
    },
    recommendationBasis: {
      label: '基于实际学习数据',
      empty: '已保存的日程或任务还不够多，因此同时提供默认复习节奏。',
      counts: ({ scheduleCount, taskCount }) => `已基于 ${scheduleCount} 个日程和 ${taskCount} 个任务进行分析。`,
      recentSchedules: '最近日程',
      recentTasks: '最近任务',
      noData: '暂无记录'
    },
    summary: (preview) => [
      '- 这是练习摘要。先从正文中分离核心概念和连接词。',
      '- 如果有示例或解题过程，会另外标出概念应用顺序。',
      `- 需要再看的部分：${preview}`
    ].join('\n'),
    weakCalculation: '计算失误',
    weakConcept: '概念理解偏差',
    wrongAnalysis: (problem, userAnswer) => [
      '这是练习分析。会沿着错题检查流程整理题目重点和解题过程。',
      `题目重点：${problem.slice(0, 80)}${problem.length > 80 ? '...' : ''}`,
      userAnswer ? `填写的答案：${userAnswer.slice(0, 80)}${userAnswer.length > 80 ? '...' : ''}` : '没有填写答案，因此会以解题过程为中心检查。',
      '不要急着背正确答案，先写下一步你为什么会这样选择。'
    ].join(' '),
    audioBriefing: {
      eyebrow: '浏览器语音指南',
      title: '今日音频简报',
      description: '把当前 AI 学习页面的记录简短整理，并用无障碍语音设置朗读。',
      play: '播放简报',
      stop: '停止',
      playing: '正在播放音频简报。',
      stopped: '已停止音频简报。',
      notSupported: '当前浏览器不支持音频简报朗读。',
      notice: '这是根据当前屏幕学习状态朗读的本地简报。',
      voiceLabel: (voice) => `无障碍语音设置：${voice}`,
      actionLabel: '播放或停止今日 AI 学习音频简报',
      lines: ({ mockMode, chatCount, hasRecommendation, hasSummary, hasWrongAnalysis, hasReviewMock, hasImageInsight }) => [
        mockMode ? 'AI 练习模式已开启，因此会使用示例回复确认学习流程。' : 'AI 学习 API 流程已准备就绪。请不要在问题中包含敏感信息。',
        chatCount > 0 ? `最近 ${chatCount} 条 AI 对话会反映在这份简报中。` : '目前还没有 AI 提问记录，可以先从一个小问题开始。',
        hasRecommendation ? '已有个性化推荐，可以直接确认今日复习节奏。' : '执行一次推荐后，今日复习方向会更清楚。',
        hasSummary ? '已有文档摘要，可以快速回顾核心概念。' : '使用长文摘要可以快速整理资料中的核心概念。',
        hasWrongAnalysis ? '已有错题分析，可以回顾卡住的解题步骤。' : '使用错题原因分析可以确认薄弱的解题步骤。',
        hasReviewMock || hasImageInsight ? '附件分析结果已准备好，可查看提取状态和生成草稿。' : '图片和 PDF 附件会临时处理，文件不会保存。'
      ]
    },
    errors: {
      token: '登录信息可能已过期。请重新登录，或使用练习模式确认流程。',
      quota: 'AI 使用额度已耗尽，或请求过于频繁。请稍后重试，或使用练习模式。',
      quotaFallback: '由于 AI 额度问题，已显示安全的默认回复。请稍后重试，或使用练习模式。',
      provider: '需要检查 AI 服务提供方设置或 API key 状态。当前页面可使用练习模式确认流程。',
      providerFallback: 'AI 服务提供方连接不可用，因此显示安全的默认回复，学习流程仍可继续查看。',
      network: '网络连接不稳定，无法获取 AI 回复。请检查连接或切换到练习模式。',
      fallback: '无法加载 AI 回复。请确认未包含敏感信息，必要时使用练习模式查看流程。'
    },
    imageInsightQuestion: (name) => `[图片附加评估] ${name}`,
    imageInsightAnswer: ({ format, dimensions, warnings }) => [
      `已临时检查图片文件。格式和大小有效。格式：${format}，尺寸：${dimensions}。`,
      '所选文件不会保存在服务器上。',
      '本版本不支持图片 OCR 和 AI Vision 分析。如需自动生成笔记和测验，请使用文本型 PDF。',
      ...(warnings || [])
    ].join('\n'),
    imageInsightSuccess: '已将图片初步评估结果添加到 AI 对话房间。',
    selectImageFirst: '请先附加图片。',
    selectReviewFileFirst: '请先选择图片或文本型 PDF 文件。',
    reviewResultSuccess: '已生成附件分析结果。',
    reviewFileRemoved: '已移除附件。',
    reviewFileAttached: '已选择评估用文件。分析请求时会临时处理，且不会保存。',
    imageReviewTitle: '图片文件检查',
    imageReviewResultTitle: '图片检查结果',
    imageReviewDescription: (size) => `可选择 ${size} 以下的 PNG、JPG、WEBP 或 GIF 图片，检查格式、大小和图片元数据。不支持图片 OCR 和 AI Vision 分析。`,
    materialReviewTitle: '文本型 PDF 笔记与测验生成',
    materialReviewDescription: (size) => `可选择 ${size} 以下的文本型 PDF，提取学习内容并生成摘要、笔记与测验草稿。图片仅支持不含 OCR 的文件检查。`,
    attachmentPrivacyNotice: '请勿附加包含敏感信息的学习资料。所选文件仅用于本次分析请求处理，不会另行保存。',
    imageStoredNotice: '分析请求时，服务器会临时检查文件类型、大小和图片元数据。',
    reviewStoredNotice: '文本型 PDF 可提取后生成摘要、笔记和测验草稿。扫描 PDF 和图片不支持 OCR，不能用于自动生成。',
    analyzeImageButton: '执行图片评估',
    analyzeMaterialButton: '生成笔记与测验',
    removeAttachment: '移除附件',
    analysisResultBadge: '分析结果',
    extractedTextTitle: '提取文本预览',
    summaryTitle: '笔记摘要',
    notesTitle: '学习笔记',
    quizTitle: '复习测验',
    keywordsTitle: '关键词',
    warningsTitle: '需要确认',
    noGeneratedResult: '未能提取文本。如需自动生成笔记和测验，请使用文本型 PDF。',
    unknownImageSize: '无法确认',
    attachmentErrors: {
      tooLarge: '文件大小超过允许范围。',
      unsupported: '不支持该文件类型。请确认允许的格式和扩展名。',
      failed: '无法分析附件。请重新选择文件。'
    },
    mockModeTitle: 'AI 练习模式',
    mockModeDescription: '当 AI 额度或服务连接不稳定时，使用安全示例回复确认页面流程。',
    mockModeActive: '练习模式使用中',
    mockModeEnable: '开启练习模式',
    mockQuestionSuccess: '已添加练习模式回复。',
    mockRecommendationSuccess: '已显示练习模式推荐。',
    mockSummarySuccess: '已显示练习模式摘要。',
    mockWrongAnswerSuccess: '已显示练习模式错题分析。',
    mockModeOn: '已开启 AI 练习模式。将使用安全示例回复确认流程。',
    mockModeOff: '已关闭 AI 练习模式。将使用现有 AI 学习 API 流程。',
    selectImageButton: '选择图片',
    selectMaterialButton: '选择文件',
    selectMaterialFileAccessibilityLabel: '选择文本型 PDF 或图片文件',
    practiceBadgeRecommendation: '练习推荐',
    practiceBadgeSummary: '练习摘要',
    practiceBadgeWrongAnswer: '练习分析'
  }
};

const AI_CHAT_LAYOUT_COPY = {
  ko: {
    title: 'AI 대화방',
    description: '대화방별 질문 흐름을 저장하고 이어서 확인합니다.',
    newChat: '새 대화',
    searchPlaceholder: '대화방 검색',
    loadingRooms: 'AI 대화방을 불러오는 중입니다.',
    noRooms: '검색 결과가 없습니다.',
    messageCount: (count) => `${count}개 대화`,
    activeMeta: (count) => `${count}개 메시지 저장됨`,
    pinnedRooms: '고정한 대화',
    recentRooms: '최근 대화',
    collapseSidebar: '대화방 접기',
    expandSidebar: '대화방 펼치기',
    sidebarRailLabel: 'AI 대화방 빠른 메뉴',
    renameRoom: '이름 변경',
    renamePlaceholder: '대화방 이름',
    saveTitle: '저장',
    cancelEdit: '취소',
    pinRoom: '상단 고정',
    unpinRoom: '고정 해제',
    pinnedBadge: '고정',
    deleteRoom: '삭제',
    deleteCurrent: '현재 대화방 삭제',
    deleteConfirm: '이 AI 대화방을 삭제할까요?',
    renameRequired: '대화방 이름을 입력해 주세요.',
    roomUpdated: 'AI 대화방 설정을 저장했습니다.',
    roomUpdateFailed: 'AI 대화방 설정을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    emptyTitle: '아직 질문 내역이 없습니다.',
    emptyText: '오늘 헷갈린 개념 하나를 입력하면 대화가 시작됩니다.',
    readyPrompt: '질문 입력 준비',
    userLabel: '내 질문',
    aiLabel: 'AI 답변',
    mockBadge: '연습 응답',
    truncateBadge: '자동 요약됨',
    composerTitle: '메시지 입력',
    composerPlaceholder: '공부하다가 모르는 개념이나 공식, 질문 사항을 입력하세요.',
    send: '전송',
    charCount: (current, max) => `${current} / ${max}자`,
    imageToolsTitle: '첨부·검토 도구',
    imageToolsDescription: '이미지는 형식·용량·메타데이터를 확인하고, 텍스트 기반 PDF는 요약·노트·퀴즈 초안 생성을 도와줍니다.'
  },
  en: {
    title: 'AI chat rooms',
    description: 'Save each question flow by room and continue later.',
    newChat: 'New chat',
    searchPlaceholder: 'Search chats',
    loadingRooms: 'Loading AI chat rooms.',
    noRooms: 'No matching chat rooms.',
    messageCount: (count) => `${count} chat item${count === 1 ? '' : 's'}`,
    activeMeta: (count) => `${count} message${count === 1 ? '' : 's'} saved`,
    pinnedRooms: 'Pinned chats',
    recentRooms: 'Recent chats',
    collapseSidebar: 'Collapse chat sidebar',
    expandSidebar: 'Expand chat sidebar',
    sidebarRailLabel: 'AI chat quick menu',
    renameRoom: 'Rename',
    renamePlaceholder: 'Chat room title',
    saveTitle: 'Save',
    cancelEdit: 'Cancel',
    pinRoom: 'Pin to top',
    unpinRoom: 'Unpin',
    pinnedBadge: 'Pinned',
    deleteRoom: 'Delete',
    deleteCurrent: 'Delete current chat',
    deleteConfirm: 'Delete this AI chat room?',
    renameRequired: 'Enter a chat room title.',
    roomUpdated: 'AI chat room settings saved.',
    roomUpdateFailed: 'Could not save AI chat room settings. Try again shortly.',
    emptyTitle: 'No questions yet.',
    emptyText: 'Enter one confusing concept to start the conversation.',
    readyPrompt: 'Prepare a question',
    userLabel: 'My question',
    aiLabel: 'AI answer',
    mockBadge: 'Practice response',
    truncateBadge: 'Auto summarized',
    composerTitle: 'Message input',
    composerPlaceholder: 'Enter a concept, formula, or question you are studying.',
    send: 'Send',
    charCount: (current, max) => `${current} / ${max} chars`,
    imageToolsTitle: 'Attachment and review tools',
    imageToolsDescription: 'Images are checked for type, size, and metadata, while text-based PDFs can produce summary, note, and quiz drafts.'
  },
  ja: {
    title: 'AIチャットルーム',
    description: '質問の流れをルームごとに保存して続けられます。',
    newChat: '新しい会話',
    searchPlaceholder: '会話を検索',
    loadingRooms: 'AIチャットルームを読み込んでいます。',
    noRooms: '一致する会話がありません。',
    messageCount: (count) => `${count}件の会話`,
    activeMeta: (count) => `${count}件のメッセージを保存`,
    pinnedRooms: '固定した会話',
    recentRooms: '最近の会話',
    collapseSidebar: '会話一覧を折りたたむ',
    expandSidebar: '会話一覧を開く',
    sidebarRailLabel: 'AIチャットのクイックメニュー',
    renameRoom: '名前を変更',
    renamePlaceholder: '会話名',
    saveTitle: '保存',
    cancelEdit: 'キャンセル',
    pinRoom: '上部に固定',
    unpinRoom: '固定を解除',
    pinnedBadge: '固定',
    deleteRoom: '削除',
    deleteCurrent: '現在の会話を削除',
    deleteConfirm: 'このAIチャットルームを削除しますか？',
    renameRequired: '会話名を入力してください。',
    roomUpdated: 'AIチャットルーム設定を保存しました。',
    roomUpdateFailed: 'AIチャットルーム設定を保存できませんでした。しばらくしてから再試行してください。',
    emptyTitle: 'まだ質問履歴がありません。',
    emptyText: '気になる概念を1つ入力すると会話を始められます。',
    readyPrompt: '質問を準備',
    userLabel: '自分の質問',
    aiLabel: 'AI回答',
    mockBadge: '練習応答',
    truncateBadge: '自動要約',
    composerTitle: 'メッセージ入力',
    composerPlaceholder: '学習中に分からない概念、公式、質問を入力してください。',
    send: '送信',
    charCount: (current, max) => `${current} / ${max}字`,
    imageToolsTitle: '添付・確認ツール',
    imageToolsDescription: '画像は形式・容量・メタデータを確認し、テキストベースPDFは要約・ノート・クイズ案の作成を支援します。'
  },
  zh: {
    title: 'AI 对话房间',
    description: '按房间保存提问流程，并可继续查看。',
    newChat: '新对话',
    searchPlaceholder: '搜索对话',
    loadingRooms: '正在加载 AI 对话房间。',
    noRooms: '没有匹配的对话房间。',
    messageCount: (count) => `${count} 条对话`,
    activeMeta: (count) => `已保存 ${count} 条消息`,
    pinnedRooms: '置顶对话',
    recentRooms: '最近对话',
    collapseSidebar: '收起对话侧边栏',
    expandSidebar: '展开对话侧边栏',
    sidebarRailLabel: 'AI 对话快捷菜单',
    renameRoom: '重命名',
    renamePlaceholder: '对话房间名称',
    saveTitle: '保存',
    cancelEdit: '取消',
    pinRoom: '置顶',
    unpinRoom: '取消置顶',
    pinnedBadge: '置顶',
    deleteRoom: '删除',
    deleteCurrent: '删除当前对话',
    deleteConfirm: '要删除这个 AI 对话房间吗？',
    renameRequired: '请输入对话房间名称。',
    roomUpdated: '已保存 AI 对话房间设置。',
    roomUpdateFailed: '无法保存 AI 对话房间设置。请稍后再试。',
    emptyTitle: '还没有提问记录。',
    emptyText: '输入一个不清楚的概念即可开始对话。',
    readyPrompt: '准备提问',
    userLabel: '我的问题',
    aiLabel: 'AI 回答',
    mockBadge: '练习回复',
    truncateBadge: '自动摘要',
    composerTitle: '消息输入',
    composerPlaceholder: '输入学习中不清楚的概念、公式或问题。',
    send: '发送',
    charCount: (current, max) => `${current} / ${max} 字`,
    imageToolsTitle: '附件与检查工具',
    imageToolsDescription: '图片会检查格式、大小和元数据；文本型 PDF 可生成摘要、笔记与测验草稿。'
  }
};

function getAILocalizedCopy(language) {
  return AI_LOCALIZED_COPY[language] || AI_LOCALIZED_COPY.ko;
}

function getAIChatLayoutCopy(language) {
  return AI_CHAT_LAYOUT_COPY[language] || AI_CHAT_LAYOUT_COPY.ko;
}

function getSpeechLanguage(language) {
  return SPEECH_LANG_BY_LANGUAGE[language] || SPEECH_LANG_BY_LANGUAGE.ko;
}

function getVoiceLabel(voiceType, language) {
  const labels = VOICE_LABEL_BY_LANGUAGE[voiceType] || VOICE_LABEL_BY_LANGUAGE.ADULT_FEMALE;
  return labels[language] || labels.ko;
}

function getImageAttachmentFeedback({ attachment, error, language }) {
  if (error) {
    return { tone: 'error', message: error };
  }

  const copy = getAILocalizedCopy(language);

  if (attachment) {
    return { tone: 'success', message: copy.imageAttached };
  }

  return { tone: 'info', message: copy.imageHelp(formatFileSize(MAX_IMAGE_SIZE_BYTES)) };
}

function getReviewAttachmentFeedback({ attachment, error, language }) {
  if (error) {
    return { tone: 'error', message: error };
  }

  const copy = getAILocalizedCopy(language);

  if (attachment?.isPdf) {
    return { tone: 'warning', message: copy.pdfPreview };
  }

  if (attachment) {
    return { tone: 'success', message: copy.reviewImageAttached };
  }

  return { tone: 'info', message: copy.reviewHelp(formatFileSize(MAX_REVIEW_FILE_SIZE_BYTES)) };
}

function isImageFile(file) {
  return SUPPORTED_IMAGE_TYPES.includes(file?.type);
}

function isPdfFile(file) {
  return file?.type === 'application/pdf' || String(file?.name || '').toLowerCase().endsWith('.pdf');
}

function isSupportedReviewFile(file) {
  return isImageFile(file) || isPdfFile(file);
}

function createMockReviewResult(file, language) {
  const copy = getAILocalizedCopy(language);
  const sourceLabel = isPdfFile(file) ? copy.pdfSource : copy.imageSource;
  const fileName = file?.name || copy.fallbackFile;

  return {
    sourceLabel,
    noteTitle: copy.noteTitle(sourceLabel),
    summary: copy.reviewSummary(fileName),
    quizzes: copy.reviewQuizzes
  };
}

function createMockQuestionAnswer(question, language) {
  return getAILocalizedCopy(language).mockAnswer(question);
}

function createMockRecommendation(language) {
  return getAILocalizedCopy(language).recommendation;
}

function createMockSummary(content, language) {
  const preview = content.length > 80 ? `${content.slice(0, 80)}...` : content;

  return getAILocalizedCopy(language).summary(preview);
}

function createMockWrongAnswerAnalysis(problem, userAnswer, language) {
  const copy = getAILocalizedCopy(language);
  const weakType = /[+\-*/=]/.test(problem) ? copy.weakCalculation : copy.weakConcept;

  return {
    weakType,
    explanation: copy.wrongAnalysis(problem, userAnswer)
  };
}

function getAIErrorMessage(error, language) {
  const message = String(error?.message || '').toLowerCase();
  const code = String(error?.code || '').toLowerCase();
  const status = error?.status;
  const { errors } = getAILocalizedCopy(language);

  if (status === 401 || message.includes('token') || message.includes('unauthorized')) {
    return errors.token;
  }

  if (status === 429
    || code.includes('too_many')
    || message.includes('quota')
    || message.includes('rate limit')
    || message.includes('too many')
    || message.includes('insufficient')
    || message.includes('billing')) {
    return errors.quota;
  }

  if (status === 503 || code.includes('ai_provider') || message.includes('provider') || message.includes('api key') || message.includes('configured')) {
    return errors.provider;
  }

  if (message.includes('network') || message.includes('failed to fetch')) {
    return errors.network;
  }

  return errors.fallback;
}

function getAIProviderFallbackMessage(providerFallback, language) {
  if (!providerFallback) {
    return '';
  }

  const { errors } = getAILocalizedCopy(language);
  const fallbackType = String(providerFallback.type || '').toLowerCase();

  if (fallbackType === 'quota') {
    return errors.quotaFallback || errors.quota;
  }

  return errors.providerFallback || errors.provider;
}

function getAttachmentErrorMessage(error, language) {
  const copy = getAILocalizedCopy(language);
  const attachmentErrors = copy.attachmentErrors || {};
  const code = String(error?.code || '').toLowerCase();
  const status = error?.status;
  const details = error?.details || {};

  if (status === 401) {
    return copy.errors.token;
  }

  if (details.maxSizeBytes || status === 413) {
    return attachmentErrors.tooLarge || copy.errors.fallback;
  }

  if (code.includes('validation') || Array.isArray(details.allowedTypes)) {
    return attachmentErrors.unsupported || copy.errors.fallback;
  }

  if (String(error?.message || '').toLowerCase().includes('network')) {
    return copy.errors.network;
  }

  return attachmentErrors.failed || copy.errors.fallback;
}

function buildImageReviewChatAnswer(result, language) {
  const copy = getAILocalizedCopy(language);
  const image = result?.image || {};
  const dimensions = image.width && image.height
    ? `${image.width} x ${image.height}`
    : copy.unknownImageSize;
  const warnings = Array.isArray(result?.warnings) ? result.warnings : [];

  return copy.imageInsightAnswer({
    format: image.format || result?.file?.type || 'unknown',
    dimensions,
    warnings
  });
}

function getRecommendationBasisCounts(basis = {}) {
  const scheduleCount = Number.isFinite(Number(basis.scheduleCount)) ? Number(basis.scheduleCount) : 0;
  const taskCount = Number.isFinite(Number(basis.taskCount)) ? Number(basis.taskCount) : 0;

  return {
    scheduleCount,
    taskCount,
    hasData: scheduleCount + taskCount > 0
  };
}

function RecommendationBasisPanel({ basis, copy }) {
  if (!basis) {
    return null;
  }

  const basisCopy = copy.recommendationBasis;
  const { scheduleCount, taskCount, hasData } = getRecommendationBasisCounts(basis);
  const recentSchedules = Array.isArray(basis.recentSchedules) ? basis.recentSchedules.slice(0, 3) : [];
  const recentTasks = Array.isArray(basis.recentTasks) ? basis.recentTasks.slice(0, 3) : [];

  return (
    <View style={styles.recommendBasisBox}>
      <Text style={styles.recommendBasisLabel}>{basisCopy.label}</Text>
      <Text style={styles.recommendBasisText}>
        {hasData ? basisCopy.counts({ scheduleCount, taskCount }) : basisCopy.empty}
      </Text>

      <View style={styles.recommendBasisGrid}>
        <View style={styles.recommendBasisColumn}>
          <Text style={styles.recommendBasisColumnTitle}>{basisCopy.recentSchedules}</Text>
          {recentSchedules.length > 0 ? recentSchedules.map((schedule, index) => (
            <Text key={`${schedule.title || 'schedule'}-${index}`} style={styles.recommendBasisItem} numberOfLines={1}>
              {schedule.subject ? `${schedule.subject} · ${schedule.title}` : schedule.title}
            </Text>
          )) : (
            <Text style={styles.recommendBasisItemMuted}>{basisCopy.noData}</Text>
          )}
        </View>

        <View style={styles.recommendBasisColumn}>
          <Text style={styles.recommendBasisColumnTitle}>{basisCopy.recentTasks}</Text>
          {recentTasks.length > 0 ? recentTasks.map((task, index) => (
            <Text key={`${task.title || 'task'}-${index}`} style={styles.recommendBasisItem} numberOfLines={1}>
              {task.status ? `${task.status} · ${task.title}` : task.title}
            </Text>
          )) : (
            <Text style={styles.recommendBasisItemMuted}>{basisCopy.noData}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

function PinIcon({ active = false, compact = false, inverse = false }) {
  return (
    <View style={[styles.pinIcon, compact && styles.pinIconCompact]}>
      <View
        style={[
          styles.pinIconHead,
          compact && styles.pinIconHeadCompact,
          active && styles.pinIconHeadActive,
          inverse && styles.pinIconHeadInverse
        ]}
      />
      <View
        style={[
          styles.pinIconStem,
          compact && styles.pinIconStemCompact,
          active && styles.pinIconStemActive,
          inverse && styles.pinIconStemInverse
        ]}
      />
      <View
        style={[
          styles.pinIconPoint,
          compact && styles.pinIconPointCompact,
          active && styles.pinIconPointActive,
          inverse && styles.pinIconPointInverse
        ]}
      />
    </View>
  );
}

export default function AILearningScreen({ onNavigate, token, user }) {
  const { currentLanguage } = useLanguage();
  const { reading, speakText, stopSpeech, voiceType } = useAccessibility();
  const [activeTab, setActiveTab] = useState('qna'); // 'qna' | 'recommend' | 'summarize' | 'wrong'
  const previewUrlRef = useRef(null);

  // Loading, Success & Error States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [imageUploadError, setImageUploadError] = useState('');
  const [imageAttachment, setImageAttachment] = useState(null);
  const [reviewUploadError, setReviewUploadError] = useState('');
  const [reviewAttachment, setReviewAttachment] = useState(null);
  const [reviewAnalysisResult, setReviewAnalysisResult] = useState(null);
  const [imageAnalysisResult, setImageAnalysisResult] = useState(null);
  const [isAttachmentAnalyzing, setIsAttachmentAnalyzing] = useState(false);
  const [isMockMode, setIsMockMode] = useState(readStoredMockMode);
  const reviewPreviewUrlRef = useRef(null);

  // Tab 1: AI 학습 질의 (Q&A) States
  const [questionInput, setQuestionInput] = useState('');
  const [chatRooms, setChatRooms] = useState([]);
  const [activeChatRoomId, setActiveChatRoomId] = useState(null);
  const [recentQnaList, setRecentQnaList] = useState([]); // [{ question, answer, isTruncated }]
  const [isChatRoomsLoading, setIsChatRoomsLoading] = useState(false);
  const [chatRoomSearch, setChatRoomSearch] = useState('');
  const [isChatSidebarCollapsed, setIsChatSidebarCollapsed] = useState(false);
  const [editingChatRoomId, setEditingChatRoomId] = useState(null);
  const [editingChatRoomTitle, setEditingChatRoomTitle] = useState('');
  const [savingChatRoomId, setSavingChatRoomId] = useState(null);
  const questionCompositionRef = useRef(false);

  // Tab 2: 맞춤 학습 추천 (Recommendation) States
  const [recommendationResult, setRecommendationResult] = useState(null); // { recommendedSubject, tips }

  // Tab 3: 긴 글 요약 (Summarize) States
  const [summarizeInput, setSummarizeInput] = useState('');
  const [summaryResult, setSummaryResult] = useState(null); // { summary, isTruncated }

  // Tab 4: 오답 원인 분석 (Wrong Answer) States
  const [wrongProblemInput, setWrongProblemInput] = useState('');
  const [wrongUserAnswerInput, setWrongUserAnswerInput] = useState('');
  const [wrongAnalysisResult, setWrongAnalysisResult] = useState(null); // { problem, userAnswer, explanation, weakType }

  // Clear messages helper
  const resetFeedback = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setImageUploadError('');
    setReviewUploadError('');
  };

  // Enforce Max Lengths Constants
  const MAX_QUESTION_LENGTH = 1000;
  const MAX_SUMMARY_LENGTH = 3000;
  const MAX_PROBLEM_LENGTH = 1000;
  const MAX_ANSWER_LENGTH = 1000;

  useEffect(() => {
    writeStoredMockMode(isMockMode);
  }, [isMockMode]);

  useEffect(() => {
    let ignore = false;

    async function loadChatRooms() {
      if (!token) {
        return;
      }

      setIsChatRoomsLoading(true);

      try {
        const result = await getAIChatRooms(token);
        let nextRooms = sortChatRooms((result.chatRooms || []).map(normalizeChatRoom));

        if (nextRooms.length === 0) {
          const created = await createAIChatRoom(token);
          nextRooms = [normalizeChatRoom(created.chatRoom)];
        }

        if (ignore) {
          return;
        }

        setChatRooms(nextRooms);
        setActiveChatRoomId(nextRooms[0]?.id || null);
        setRecentQnaList(nextRooms[0]?.messages || []);
      } catch (error) {
        if (!ignore) {
          setErrorMsg('AI 대화방을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
        }
      } finally {
        if (!ignore) {
          setIsChatRoomsLoading(false);
        }
      }
    }

    loadChatRooms();

    return () => {
      ignore = true;
    };
  }, [token]);

  useEffect(() => () => {
    if (previewUrlRef.current && globalThis.URL?.revokeObjectURL) {
      globalThis.URL.revokeObjectURL(previewUrlRef.current);
    }
    if (reviewPreviewUrlRef.current && globalThis.URL?.revokeObjectURL) {
      globalThis.URL.revokeObjectURL(reviewPreviewUrlRef.current);
    }
  }, []);

  function clearImageAttachment({ showMessage = true } = {}) {
    if (previewUrlRef.current && globalThis.URL?.revokeObjectURL) {
      globalThis.URL.revokeObjectURL(previewUrlRef.current);
    }

    previewUrlRef.current = null;
    setImageAttachment(null);
    setImageAnalysisResult(null);
    setImageUploadError('');

    if (showMessage) {
      setSuccessMsg('첨부 이미지를 제거했습니다.');
    }
  }

  function attachImageFile(file) {
    if (!file) {
      return;
    }

    resetFeedback();
    setImageUploadError('');
    const copy = getAILocalizedCopy(currentLanguage);

    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      setImageUploadError(copy.attachmentErrors.unsupported);
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setImageUploadError(copy.attachmentErrors.tooLarge);
      return;
    }

    if (!globalThis.URL?.createObjectURL) {
      setImageUploadError(copy.attachmentErrors.failed);
      return;
    }

    if (previewUrlRef.current && globalThis.URL?.revokeObjectURL) {
      globalThis.URL.revokeObjectURL(previewUrlRef.current);
    }

    const previewUrl = globalThis.URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;

    setImageAttachment({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl
    });
    setImageAnalysisResult(null);
    setSuccessMsg(getAILocalizedCopy(currentLanguage).imageAttached);
  }

  function openImagePicker() {
    if (!globalThis.document?.createElement) {
      setImageUploadError(getAILocalizedCopy(currentLanguage).attachmentErrors.failed);
      return;
    }

    const input = globalThis.document.createElement('input');
    input.type = 'file';
    input.accept = SUPPORTED_IMAGE_TYPES.join(',');
    input.onchange = (event) => {
      const file = event.target?.files?.[0];
      attachImageFile(file);
    };
    input.click();
  }

  function clearReviewAttachment({ showMessage = true } = {}) {
    if (reviewPreviewUrlRef.current && globalThis.URL?.revokeObjectURL) {
      globalThis.URL.revokeObjectURL(reviewPreviewUrlRef.current);
    }

    reviewPreviewUrlRef.current = null;
    setReviewAttachment(null);
    setReviewAnalysisResult(null);
    setReviewUploadError('');

    if (showMessage) {
      setSuccessMsg(getAILocalizedCopy(currentLanguage).reviewFileRemoved);
    }
  }

  function attachReviewFile(file) {
    if (!file) {
      return;
    }

    resetFeedback();
    setReviewAnalysisResult(null);
    const copy = getAILocalizedCopy(currentLanguage);

    if (!isSupportedReviewFile(file)) {
      setReviewUploadError(copy.attachmentErrors.unsupported);
      return;
    }

    if (isImageFile(file) && file.size > MAX_IMAGE_SIZE_BYTES) {
      setReviewUploadError(copy.attachmentErrors.tooLarge);
      return;
    }

    if (isPdfFile(file) && file.size > MAX_REVIEW_FILE_SIZE_BYTES) {
      setReviewUploadError(copy.attachmentErrors.tooLarge);
      return;
    }

    let previewUrl = null;
    if (isImageFile(file)) {
      if (!globalThis.URL?.createObjectURL) {
        setReviewUploadError(copy.attachmentErrors.failed);
        return;
      }

      previewUrl = globalThis.URL.createObjectURL(file);
    }

    if (reviewPreviewUrlRef.current && globalThis.URL?.revokeObjectURL) {
      globalThis.URL.revokeObjectURL(reviewPreviewUrlRef.current);
    }

    reviewPreviewUrlRef.current = previewUrl;
    setReviewAttachment({
      file,
      name: file.name,
      size: file.size,
      type: file.type || (isPdfFile(file) ? 'application/pdf' : 'unknown'),
      previewUrl,
      isPdf: isPdfFile(file)
    });
    setSuccessMsg(getAILocalizedCopy(currentLanguage).reviewFileAttached);
  }

  function openReviewFilePicker() {
    if (!globalThis.document?.createElement) {
      setReviewUploadError(getAILocalizedCopy(currentLanguage).attachmentErrors.failed);
      return;
    }

    const input = globalThis.document.createElement('input');
    input.type = 'file';
    input.accept = SUPPORTED_REVIEW_FILE_TYPES.join(',');
    input.onchange = (event) => {
      const file = event.target?.files?.[0];
      attachReviewFile(file);
    };
    input.click();
  }

  async function analyzeReviewAttachment() {
    if (!reviewAttachment) {
      setReviewUploadError(getAILocalizedCopy(currentLanguage).selectReviewFileFirst);
      return;
    }

    resetFeedback();
    setIsAttachmentAnalyzing(true);

    try {
      const result = await analyzeAIStudyMaterialAttachment(token, reviewAttachment.file);
      setReviewAnalysisResult(result);
      const providerFallbackMessage = getAIProviderFallbackMessage(result.generation?.providerFallback, currentLanguage);
      setSuccessMsg(getAILocalizedCopy(currentLanguage).reviewResultSuccess);
      if (providerFallbackMessage) {
        setErrorMsg(providerFallbackMessage);
      }
    } catch (error) {
      setReviewUploadError(getAttachmentErrorMessage(error, currentLanguage));
    } finally {
      setIsAttachmentAnalyzing(false);
    }
  }

  async function addQnaEntry(entry) {
    if (!activeChatRoomId) {
      throw new Error('AI chat room is not ready');
    }

    const result = await createAIChatMessage(token, activeChatRoomId, {
      question: entry.question,
      answer: entry.answer,
      isTruncated: entry.isTruncated === true,
      isMock: entry.isMock === true,
      source: entry.isImageInsight ? 'IMAGE_INSIGHT' : (entry.isMock ? 'MOCK_QNA' : 'AI_QNA'),
      allowTruncate: true
    });
    const nextRoom = normalizeChatRoom(result.chatRoom);
    const normalizedEntry = normalizeChatMessage(result.message);

    setRecentQnaList(nextRoom.messages);
    setChatRooms((prevRooms) => applyChatRoomUpdate(prevRooms, nextRoom));

    return normalizedEntry;
  }

  async function createChatRoom() {
    resetFeedback();
    setIsChatRoomsLoading(true);

    try {
      const result = await createAIChatRoom(token);
      const nextRoom = normalizeChatRoom(result.chatRoom);

      setChatRooms((prevRooms) => sortChatRooms([nextRoom, ...prevRooms]).slice(0, 8));
      setActiveChatRoomId(nextRoom.id);
      setRecentQnaList([]);
      setSuccessMsg('새 AI 대화방을 열었습니다.');
    } catch (error) {
      setErrorMsg('AI 대화방을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsChatRoomsLoading(false);
    }
  }

  async function handleDeleteChatRoom(roomId) {
    resetFeedback();

    if (globalThis.confirm && !globalThis.confirm(chatCopy.deleteConfirm)) {
      return;
    }

    try {
      await deleteAIChatRoom(token, roomId);
      const remainingRooms = chatRooms.filter((room) => room.id !== roomId);

      if (remainingRooms.length === 0) {
        const result = await createAIChatRoom(token);
        const nextRoom = normalizeChatRoom(result.chatRoom);
        setChatRooms([nextRoom]);
        setActiveChatRoomId(nextRoom.id);
        setRecentQnaList([]);
      } else {
        setChatRooms(remainingRooms);

        if (roomId === activeChatRoomId) {
          setActiveChatRoomId(remainingRooms[0].id);
          setRecentQnaList(remainingRooms[0].messages || []);
        }
      }

      setSuccessMsg('AI 대화방을 삭제했습니다.');
    } catch (error) {
      setErrorMsg('AI 대화방을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }

  function beginRenameChatRoom(room) {
    setEditingChatRoomId(room.id);
    setEditingChatRoomTitle(room.title || '');
    resetFeedback();
  }

  function cancelRenameChatRoom() {
    setEditingChatRoomId(null);
    setEditingChatRoomTitle('');
  }

  async function saveChatRoomTitle(roomId) {
    const title = editingChatRoomTitle.replace(/\s+/g, ' ').trim();

    if (!title) {
      setErrorMsg(chatCopy.renameRequired);
      return;
    }

    setSavingChatRoomId(roomId);
    resetFeedback();

    try {
      const result = await updateAIChatRoom(token, roomId, { title });
      const nextRoom = normalizeChatRoom(result.chatRoom);

      setChatRooms((prevRooms) => applyChatRoomUpdate(prevRooms, nextRoom));
      if (activeChatRoomId === nextRoom.id) {
        setRecentQnaList(nextRoom.messages || []);
      }
      cancelRenameChatRoom();
      setSuccessMsg(chatCopy.roomUpdated);
    } catch (error) {
      setErrorMsg(chatCopy.roomUpdateFailed);
    } finally {
      setSavingChatRoomId(null);
    }
  }

  async function toggleChatRoomPin(room) {
    setSavingChatRoomId(room.id);
    resetFeedback();

    try {
      const result = await updateAIChatRoom(token, room.id, { isPinned: !room.isPinned });
      const nextRoom = normalizeChatRoom(result.chatRoom);

      setChatRooms((prevRooms) => applyChatRoomUpdate(prevRooms, nextRoom));
      if (activeChatRoomId === nextRoom.id) {
        setRecentQnaList(nextRoom.messages || []);
      }
      setSuccessMsg(chatCopy.roomUpdated);
    } catch (error) {
      setErrorMsg(chatCopy.roomUpdateFailed);
    } finally {
      setSavingChatRoomId(null);
    }
  }

  function selectChatRoom(roomId) {
    const targetRoom = chatRooms.find((room) => room.id === roomId);
    if (!targetRoom) {
      return;
    }

    setActiveChatRoomId(roomId);
    setRecentQnaList(targetRoom.messages || []);
    setEditingChatRoomId(null);
    setEditingChatRoomTitle('');
    resetFeedback();
  }

  function handleQuestionKeyDown(event) {
    const nativeEvent = event?.nativeEvent || event;

    if (questionCompositionRef.current || nativeEvent?.isComposing) {
      return;
    }

    if (nativeEvent?.key === 'Enter' && !nativeEvent.shiftKey) {
      event?.preventDefault?.();
      if (!loading && !isChatRoomsLoading && activeChatRoomId && questionInput.trim()) {
        handleQuestionSubmit();
      }
    }
  }

  async function analyzeImageAttachment() {
    if (!imageAttachment) {
      setImageUploadError(getAILocalizedCopy(currentLanguage).selectImageFirst);
      return;
    }

    const copy = getAILocalizedCopy(currentLanguage);

    resetFeedback();
    setIsAttachmentAnalyzing(true);

    try {
      const result = await reviewAIImageAttachment(token, imageAttachment.file);
      setImageAnalysisResult(result);
      await addQnaEntry({
        question: copy.imageInsightQuestion(imageAttachment.name),
        answer: buildImageReviewChatAnswer(result, currentLanguage),
        isTruncated: false,
        isImageInsight: true,
        isMock: false
      });
      setSuccessMsg(copy.imageInsightSuccess);
    } catch (error) {
      setImageUploadError(getAttachmentErrorMessage(error, currentLanguage));
    } finally {
      setIsAttachmentAnalyzing(false);
    }
  }

  // Navigation guard fallback inside the view
  if (!user) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorHeader}>접근 권한이 없습니다.</Text>
        <Text style={styles.errorSub}>로그인 후 다시 시도해 주세요.</Text>
        <Pressable onPress={() => onNavigate('login')} style={(state) => [styles.backButton, ...interactiveStateStyles(state)]}>
          <Text style={styles.backButtonText}>로그인 하러 가기</Text>
        </Pressable>
      </View>
    );
  }

  // Handle Tab 1 Q&A Submit
  async function handleQuestionSubmit() {
    const questionText = questionInput.trim();
    if (!questionText) return;

    if (questionText.length > MAX_QUESTION_LENGTH) {
      setErrorMsg(`질문은 최대 ${MAX_QUESTION_LENGTH}자 이하이어야 합니다.`);
      return;
    }

    setLoading(true);
    resetFeedback();

    try {
      if (isMockMode) {
        await addQnaEntry({
          question: questionText,
          answer: createMockQuestionAnswer(questionText, currentLanguage),
          isTruncated: false,
          isMock: true
        });
        setQuestionInput('');
        setSuccessMsg(getAILocalizedCopy(currentLanguage).mockQuestionSuccess);
        return;
      }

      // Allow truncate fallback when checked
      const response = await askAIQuestion(token, {
        question: questionText,
        allowTruncate: true
      });

      const qnaRecord = response.question;
      await addQnaEntry({
        question: qnaRecord.question,
        answer: qnaRecord.answer,
        isTruncated: qnaRecord.isTruncated,
        isMock: false
      });
      setQuestionInput('');
      setSuccessMsg('AI 답변 생성이 성공적으로 완료되었습니다.');
      const providerFallbackMessage = getAIProviderFallbackMessage(qnaRecord.providerFallback, currentLanguage);
      if (providerFallbackMessage) {
        setErrorMsg(providerFallbackMessage);
      }
    } catch (err) {
      setErrorMsg(getAIErrorMessage(err, currentLanguage));
    } finally {
      setLoading(false);
    }
  }

  // Handle Tab 2 Study Recommendation Submit
  async function handleRecommendationSubmit() {
    setLoading(true);
    resetFeedback();

    try {
      if (isMockMode) {
        setRecommendationResult({
          ...createMockRecommendation(currentLanguage),
          isMock: true
        });
        setSuccessMsg(getAILocalizedCopy(currentLanguage).mockRecommendationSuccess);
        return;
      }

      const response = await getAIRecommendation(token);
      const rec = response.recommendation;

      setRecommendationResult({
        recommendedSubject: rec.recommendationJson.recommendedSubject,
        tips: rec.recommendationJson.tips || [],
        basis: rec.basisJson,
        providerFallback: rec.providerFallback,
        isMock: false
      });
      setSuccessMsg('맞춤 학습 분석 및 추천 팁이 업데이트되었습니다.');
      const providerFallbackMessage = getAIProviderFallbackMessage(rec.providerFallback, currentLanguage);
      if (providerFallbackMessage) {
        setErrorMsg(providerFallbackMessage);
      }
    } catch (err) {
      setErrorMsg(getAIErrorMessage(err, currentLanguage));
    } finally {
      setLoading(false);
    }
  }

  // Handle Tab 3 Summarization Submit
  async function handleSummarySubmit() {
    const contentText = summarizeInput.trim();
    if (!contentText) return;

    if (contentText.length > MAX_SUMMARY_LENGTH) {
      setErrorMsg(`요약할 텍스트는 최대 ${MAX_SUMMARY_LENGTH}자 이하이어야 합니다.`);
      return;
    }

    setLoading(true);
    resetFeedback();

    try {
      if (isMockMode) {
        setSummaryResult({
          summary: createMockSummary(contentText, currentLanguage),
          isTruncated: false,
          isMock: true
        });
        setSuccessMsg(getAILocalizedCopy(currentLanguage).mockSummarySuccess);
        return;
      }

      const response = await summarizeText(token, {
        content: contentText,
        allowTruncate: true
      });

      setSummaryResult({
        summary: response.summary,
        isTruncated: response.isTruncated,
        providerFallback: response.providerFallback,
        isMock: false
      });
      setSuccessMsg('문서 3줄 요약이 완료되었습니다.');
      const providerFallbackMessage = getAIProviderFallbackMessage(response.providerFallback, currentLanguage);
      if (providerFallbackMessage) {
        setErrorMsg(providerFallbackMessage);
      }
    } catch (err) {
      setErrorMsg(getAIErrorMessage(err, currentLanguage));
    } finally {
      setLoading(false);
    }
  }

  // Handle Tab 4 Wrong Answer Analysis Submit
  async function handleWrongAnswerSubmit() {
    const problemText = wrongProblemInput.trim();
    const userAnswerText = wrongUserAnswerInput.trim();

    if (!problemText) return;

    if (problemText.length > MAX_PROBLEM_LENGTH) {
      setErrorMsg(`문제는 최대 ${MAX_PROBLEM_LENGTH}자 이하이어야 합니다.`);
      return;
    }
    if (userAnswerText.length > MAX_ANSWER_LENGTH) {
      setErrorMsg(`답변은 최대 ${MAX_ANSWER_LENGTH}자 이하이어야 합니다.`);
      return;
    }

    setLoading(true);
    resetFeedback();

    try {
      if (isMockMode) {
        const mockAnalysis = createMockWrongAnswerAnalysis(problemText, userAnswerText, currentLanguage);
        setWrongAnalysisResult({
          problem: problemText,
          userAnswer: userAnswerText || null,
          explanation: mockAnalysis.explanation,
          weakType: mockAnalysis.weakType,
          isMock: true
        });
        setSuccessMsg(getAILocalizedCopy(currentLanguage).mockWrongAnswerSuccess);
        return;
      }

      const response = await analyzeWrongAnswer(token, {
        problem: problemText,
        userAnswer: userAnswerText || undefined,
        allowTruncate: true
      });

      const note = response.wrongAnswerNote;
      setWrongAnalysisResult({
        problem: note.problem,
        userAnswer: note.userAnswer,
        explanation: note.explanation,
        weakType: note.weakType,
        providerFallback: note.providerFallback,
        isMock: false
      });
      setSuccessMsg('오답 원인 분석이 성공적으로 완료되었습니다.');
      const providerFallbackMessage = getAIProviderFallbackMessage(note.providerFallback, currentLanguage);
      if (providerFallbackMessage) {
        setErrorMsg(providerFallbackMessage);
      }
    } catch (err) {
      setErrorMsg(getAIErrorMessage(err, currentLanguage));
    } finally {
      setLoading(false);
    }
  }

  const activeChatRoom = chatRooms.find((room) => room.id === activeChatRoomId) || chatRooms[0];
  const aiCopy = getAILocalizedCopy(currentLanguage);
  const chatCopy = getAIChatLayoutCopy(currentLanguage);
  const filteredChatRooms = useMemo(() => {
    const query = chatRoomSearch.replace(/\s+/g, ' ').trim().toLowerCase();

    if (!query) {
      return sortChatRooms(chatRooms);
    }

    return sortChatRooms(chatRooms).filter((room) => {
      const title = String(room.title || '').toLowerCase();
      const messagePreview = (room.messages || [])
        .map((message) => `${message.question || ''} ${message.answer || ''}`)
        .join(' ')
        .toLowerCase();

      return title.includes(query) || messagePreview.includes(query);
    });
  }, [chatRoomSearch, chatRooms]);
  const pinnedChatRooms = filteredChatRooms.filter((room) => room.isPinned);
  const recentChatRooms = filteredChatRooms.filter((room) => !room.isPinned);
  const visibleChatRoomSections = [
    { key: 'pinned', title: chatCopy.pinnedRooms, rooms: pinnedChatRooms },
    { key: 'recent', title: chatCopy.recentRooms, rooms: recentChatRooms }
  ].filter((section) => section.rooms.length > 0);
  const activeChatRoomIsSaving = activeChatRoom && savingChatRoomId === activeChatRoom.id;

  function renderChatRoomRow(room) {
    const selected = room.id === activeChatRoomId;
    const isEditing = editingChatRoomId === room.id;
    const isSaving = savingChatRoomId === room.id;

    return (
      <View
        key={room.id}
        style={[
          styles.chatRoomChip,
          selected && styles.chatRoomChipActive,
          room.isPinned && styles.chatRoomChipPinned
        ]}
      >
        {isEditing ? (
          <View style={styles.chatRoomEditPanel}>
            <AccessibleTextInput
              enableVoiceInput={false}
              value={editingChatRoomTitle}
              onChangeText={setEditingChatRoomTitle}
              placeholder={chatCopy.renamePlaceholder}
              placeholderTextColor={colors.muted}
              style={styles.chatRoomEditInput}
              accessibilityLabel={chatCopy.renamePlaceholder}
              editable={!isSaving}
            />
            <View style={styles.chatRoomEditActions}>
              <Pressable
                accessibilityRole="button"
                disabled={isSaving}
                onPress={() => saveChatRoomTitle(room.id)}
                style={(state) => [styles.chatRoomMiniButton, ...interactiveStateStyles(state, { disabled: isSaving })]}
              >
                <Text style={styles.chatRoomMiniButtonText}>{chatCopy.saveTitle}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isSaving}
                onPress={cancelRenameChatRoom}
                style={(state) => [styles.chatRoomMiniGhostButton, ...interactiveStateStyles(state, { disabled: isSaving })]}
              >
                <Text style={styles.chatRoomMiniGhostText}>{chatCopy.cancelEdit}</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => selectChatRoom(room.id)}
              style={(state) => [styles.chatRoomSelectArea, ...interactiveStateStyles(state)]}
            >
              <View style={styles.chatRoomChipCopy}>
                <View style={styles.chatRoomChipTitleRow}>
                  {room.isPinned ? (
                    <View style={styles.chatRoomPinMark}>
                      <PinIcon active compact />
                    </View>
                  ) : null}
                  <Text style={[styles.chatRoomChipTitle, selected && styles.chatRoomChipTitleActive]} numberOfLines={1}>
                    {room.title}
                  </Text>
                </View>
                <Text style={[styles.chatRoomChipMeta, selected && styles.chatRoomChipMetaActive]}>
                  {chatCopy.messageCount((room.messages || []).length)}
                </Text>
              </View>
            </Pressable>
            <View style={styles.chatRoomActionCluster}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${room.title} ${room.isPinned ? chatCopy.unpinRoom : chatCopy.pinRoom}`}
                disabled={isSaving}
                onPress={() => toggleChatRoomPin(room)}
                style={(state) => [
                  styles.chatRoomIconButton,
                  room.isPinned && styles.chatRoomIconButtonActive,
                  ...interactiveStateStyles(state, { disabled: isSaving })
                ]}
              >
                <PinIcon active={room.isPinned} compact inverse={room.isPinned} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${room.title} ${chatCopy.renameRoom}`}
                disabled={isSaving}
                onPress={() => beginRenameChatRoom(room)}
                style={(state) => [styles.chatRoomIconButton, ...interactiveStateStyles(state, { disabled: isSaving })]}
              >
                <Text style={styles.chatRoomIconText}>✎</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${room.title} ${chatCopy.deleteRoom}`}
                disabled={isSaving}
                onPress={() => handleDeleteChatRoom(room.id)}
                style={(state) => [styles.chatRoomInlineDeleteButton, ...interactiveStateStyles(state, { disabled: isSaving })]}
              >
                <Text style={styles.chatRoomInlineDeleteText}>🗑</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    );
  }

  const hasImageInsight = recentQnaList.some((item) => item.isImageInsight);
  const audioBriefingLines = aiCopy.audioBriefing.lines({
    mockMode: isMockMode,
    chatCount: recentQnaList.length,
    hasRecommendation: Boolean(recommendationResult),
    hasSummary: Boolean(summaryResult),
    hasWrongAnalysis: Boolean(wrongAnalysisResult),
    hasReviewMock: Boolean(reviewAnalysisResult),
    hasImageInsight
  });
  const audioBriefingText = audioBriefingLines.join(' ');
  const isAudioBriefingPlaying = reading.active && reading.id === AI_AUDIO_BRIEFING_READING_ID;

  async function handleAudioBriefingPress() {
    resetFeedback();

    if (isAudioBriefingPlaying) {
      stopSpeech();
      setSuccessMsg(aiCopy.audioBriefing.stopped);
      return;
    }

    const started = await speakText(audioBriefingText, {
      readingId: AI_AUDIO_BRIEFING_READING_ID,
      lang: getSpeechLanguage(currentLanguage)
    });

    setSuccessMsg(started ? aiCopy.audioBriefing.playing : aiCopy.audioBriefing.notSupported);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>AI 학습 지원 센터</Text>
          <Text style={styles.subtitle}>개인화된 AI 도우미와 함께하는 스마트 학습</Text>
        </View>
        <Pressable onPress={() => onNavigate('dashboard')} style={(state) => [styles.backButton, ...interactiveStateStyles(state)]}>
          <Text style={styles.backButtonText}>대시보드로 가기</Text>
        </Pressable>
      </View>

      <View style={styles.mockModeCard}>
        <View style={styles.mockModeCopy}>
          <Text style={styles.mockModeLabel}>{aiCopy.mockModeTitle}</Text>
          <Text style={styles.mockModeText}>
            {aiCopy.mockModeDescription}
          </Text>
        </View>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: isMockMode }}
          onPress={() => {
            setIsMockMode((prev) => !prev);
            resetFeedback();
            setSuccessMsg(!isMockMode
              ? getAILocalizedCopy(currentLanguage).mockModeOn
              : getAILocalizedCopy(currentLanguage).mockModeOff);
          }}
          style={(state) => [
            styles.mockToggle,
            isMockMode && styles.mockToggleActive,
            ...interactiveStateStyles(state)
          ]}
        >
          <Text style={[styles.mockToggleText, isMockMode && styles.mockToggleTextActive]}>
            {isMockMode ? aiCopy.mockModeActive : aiCopy.mockModeEnable}
          </Text>
        </Pressable>
      </View>

      <View dataSet={{ sagakHelpTarget: 'ai-briefing' }} style={styles.audioBriefingCard}>
        <View style={styles.audioBriefingHeader}>
          <View style={styles.audioBriefingCopy}>
            <Text style={styles.audioBriefingEyebrow}>{aiCopy.audioBriefing.eyebrow}</Text>
            <Text style={styles.audioBriefingTitle}>{aiCopy.audioBriefing.title}</Text>
            <Text style={styles.audioBriefingText}>{aiCopy.audioBriefing.description}</Text>
            <Text style={styles.audioBriefingMeta}>
              {aiCopy.audioBriefing.voiceLabel(getVoiceLabel(voiceType, currentLanguage))}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={aiCopy.audioBriefing.actionLabel}
            accessibilityState={{ selected: isAudioBriefingPlaying }}
            onPress={handleAudioBriefingPress}
            style={(state) => [
              styles.audioBriefingButton,
              isAudioBriefingPlaying && styles.audioBriefingButtonActive,
              ...interactiveStateStyles(state)
            ]}
          >
            <Text style={[
              styles.audioBriefingButtonText,
              isAudioBriefingPlaying && styles.audioBriefingButtonTextActive
            ]}>
              {isAudioBriefingPlaying ? aiCopy.audioBriefing.stop : aiCopy.audioBriefing.play}
            </Text>
          </Pressable>
        </View>
        <View style={styles.audioBriefingLineList}>
          {audioBriefingLines.map((line) => (
            <Text key={line} style={styles.audioBriefingLine}>• {line}</Text>
          ))}
        </View>
        <Text style={styles.audioBriefingNotice}>{aiCopy.audioBriefing.notice}</Text>
      </View>

      <View style={styles.transparencyPanel}>
        <View style={styles.transparencyCard}>
          <Text style={styles.transparencyLabel}>AI 사용 안내</Text>
          <Text style={styles.transparencyText}>
            질문과 요약 요청은 AI 학습 API로 전달되며, 답변은 학습 보조용으로 확인합니다.
          </Text>
        </View>
        <View style={styles.transparencyCard}>
          <Text style={styles.transparencyLabel}>음성 기능 구분</Text>
          <Text style={styles.transparencyText}>
            음성 입력과 읽어주기는 접근성 센터의 브라우저 기능을 사용하며 AI 호출과 분리됩니다.
          </Text>
        </View>
        <View style={styles.transparencyCard}>
          <Text style={styles.transparencyLabel}>입력 전 확인</Text>
          <Text style={styles.transparencyText}>
            비밀번호, 토큰, 개인 연락처 같은 민감한 정보는 질문에 포함하지 않는 것이 원칙입니다.
          </Text>
        </View>
        <View style={styles.transparencyCard}>
          <Text style={styles.transparencyLabel}>첨부 분석 안내</Text>
          <Text style={styles.transparencyText}>
            이미지와 텍스트 기반 PDF는 요청 시 서버에서 임시 처리되며 파일은 별도 보관하지 않습니다.
          </Text>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View dataSet={{ sagakHelpTarget: 'ai-modes' }} style={styles.tabsRow}>
        <Pressable
          onPress={() => { setActiveTab('qna'); resetFeedback(); }}
          style={(state) => [styles.tabButton, activeTab === 'qna' && styles.tabButtonActive, ...interactiveStateStyles(state)]}
        >
          <Text style={[styles.tabButtonText, activeTab === 'qna' && styles.tabButtonTextActive]}>
            AI 학습 질의
          </Text>
        </Pressable>
        <Pressable
          onPress={() => { setActiveTab('recommend'); resetFeedback(); }}
          style={(state) => [styles.tabButton, activeTab === 'recommend' && styles.tabButtonActive, ...interactiveStateStyles(state)]}
        >
          <Text style={[styles.tabButtonText, activeTab === 'recommend' && styles.tabButtonTextActive]}>
            맞춤 학습 추천
          </Text>
        </Pressable>
        <Pressable
          onPress={() => { setActiveTab('summarize'); resetFeedback(); }}
          style={(state) => [styles.tabButton, activeTab === 'summarize' && styles.tabButtonActive, ...interactiveStateStyles(state)]}
        >
          <Text style={[styles.tabButtonText, activeTab === 'summarize' && styles.tabButtonTextActive]}>
            긴 글 요약
          </Text>
        </Pressable>
        <Pressable
          onPress={() => { setActiveTab('wrong'); resetFeedback(); }}
          style={(state) => [styles.tabButton, activeTab === 'wrong' && styles.tabButtonActive, ...interactiveStateStyles(state)]}
        >
          <Text style={[styles.tabButtonText, activeTab === 'wrong' && styles.tabButtonTextActive]}>
            오답 원인 분석
          </Text>
        </Pressable>
      </View>

      {/* Alerts */}
      {errorMsg ? (
        <View style={styles.errorAlert}>
          <Text style={styles.alertText}>{errorMsg}</Text>
        </View>
      ) : null}

      {successMsg ? (
        <View style={styles.successAlert}>
          <Text style={styles.alertText}>{successMsg}</Text>
        </View>
      ) : null}

      {loading ? <PanelSkeleton rows={3} /> : null}

      {/* Tab Panels */}
      <View dataSet={{ sagakHelpTarget: 'ai-workspace' }} style={styles.panelBody}>
        {/* TAB 1: AI 학습 질의 */}
        {activeTab === 'qna' && (
          <View style={styles.aiChatShell}>
            <View style={[styles.chatSidebar, isChatSidebarCollapsed && styles.chatSidebarCollapsed]}>
              <View style={styles.chatRoomHeader}>
                {!isChatSidebarCollapsed ? (
                  <View style={styles.chatRoomTitleGroup}>
                    <Text style={styles.chatRoomTitle}>{chatCopy.title}</Text>
                    <Text style={styles.chatRoomDesc}>{chatCopy.description}</Text>
                  </View>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={isChatSidebarCollapsed ? chatCopy.expandSidebar : chatCopy.collapseSidebar}
                  onPress={() => setIsChatSidebarCollapsed((prev) => !prev)}
                  style={(state) => [styles.chatSidebarToggle, ...interactiveStateStyles(state)]}
                >
                  <Text style={styles.chatSidebarToggleText}>{isChatSidebarCollapsed ? '☰' : '‹'}</Text>
                </Pressable>
                {!isChatSidebarCollapsed ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={createChatRoom}
                    disabled={isChatRoomsLoading}
                    style={(state) => [styles.newChatButton, ...interactiveStateStyles(state, { disabled: isChatRoomsLoading })]}
                  >
                    <Text style={styles.newChatButtonText}>{chatCopy.newChat}</Text>
                  </Pressable>
                ) : null}
              </View>

              {isChatSidebarCollapsed ? (
                <View accessibilityLabel={chatCopy.sidebarRailLabel} style={styles.chatSidebarRail}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={chatCopy.newChat}
                    disabled={isChatRoomsLoading}
                    onPress={createChatRoom}
                    style={(state) => [styles.chatRailButton, ...interactiveStateStyles(state, { disabled: isChatRoomsLoading })]}
                  >
                    <Text style={styles.chatRailButtonText}>＋</Text>
                  </Pressable>
                  <Text style={styles.chatRailCount}>{filteredChatRooms.length}</Text>
                  {activeChatRoom?.isPinned ? <Text style={styles.chatRailPinned}>{chatCopy.pinnedBadge}</Text> : null}
                </View>
              ) : (
                <>
                  <AccessibleTextInput
                    value={chatRoomSearch}
                    onChangeText={setChatRoomSearch}
                    placeholder={chatCopy.searchPlaceholder}
                    placeholderTextColor={colors.muted}
                    style={styles.chatSearchInput}
                    editable={!isChatRoomsLoading}
                    accessibilityLabel={chatCopy.searchPlaceholder}
                  />
                  {isChatRoomsLoading ? (
                    <Text style={styles.chatRoomLoadingText}>{chatCopy.loadingRooms}</Text>
                  ) : null}
                  <ScrollView style={styles.chatRoomList} contentContainerStyle={styles.chatRoomListContent}>
                    {filteredChatRooms.length === 0 ? (
                      <Text style={styles.chatRoomEmptyText}>{chatCopy.noRooms}</Text>
                    ) : (
                      visibleChatRoomSections.map((section) => (
                        <View key={section.key} style={styles.chatRoomSection}>
                          <Text style={styles.chatRoomSectionTitle}>{section.title}</Text>
                          {section.rooms.map(renderChatRoomRow)}
                        </View>
                      ))
                    )}
                  </ScrollView>
                </>
              )}
            </View>

            <View style={styles.chatMain}>
              <View style={styles.chatMainHeader}>
                <View style={styles.chatMainTitleGroup}>
                  {activeChatRoom && editingChatRoomId === activeChatRoom.id ? (
                    <View style={styles.chatMainRenameRow}>
                      <AccessibleTextInput
                        enableVoiceInput={false}
                        value={editingChatRoomTitle}
                        onChangeText={setEditingChatRoomTitle}
                        placeholder={chatCopy.renamePlaceholder}
                        placeholderTextColor={colors.muted}
                        style={styles.chatMainRenameInput}
                        editable={!activeChatRoomIsSaving}
                        accessibilityLabel={chatCopy.renamePlaceholder}
                      />
                      <Pressable
                        accessibilityRole="button"
                        disabled={activeChatRoomIsSaving}
                        onPress={() => saveChatRoomTitle(activeChatRoom.id)}
                        style={(state) => [styles.chatRoomMiniButton, ...interactiveStateStyles(state, { disabled: activeChatRoomIsSaving })]}
                      >
                        <Text style={styles.chatRoomMiniButtonText}>{chatCopy.saveTitle}</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        disabled={activeChatRoomIsSaving}
                        onPress={cancelRenameChatRoom}
                        style={(state) => [styles.chatRoomMiniGhostButton, ...interactiveStateStyles(state, { disabled: activeChatRoomIsSaving })]}
                      >
                        <Text style={styles.chatRoomMiniGhostText}>{chatCopy.cancelEdit}</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.chatMainTitleRow}>
                      {activeChatRoom?.isPinned ? <Text style={styles.chatMainPinBadge}>{chatCopy.pinnedBadge}</Text> : null}
                      <Text style={styles.chatMainTitle}>{activeChatRoom?.title || chatCopy.title}</Text>
                    </View>
                  )}
                  <Text style={styles.chatMainMeta}>{chatCopy.activeMeta(recentQnaList.length)}</Text>
                </View>
                {activeChatRoom ? (
                  <View style={styles.chatMainActionRow}>
                    <Pressable
                      accessibilityRole="button"
                      disabled={activeChatRoomIsSaving}
                      onPress={() => beginRenameChatRoom(activeChatRoom)}
                      style={(state) => [styles.chatMainActionButton, ...interactiveStateStyles(state, { disabled: activeChatRoomIsSaving })]}
                    >
                      <Text style={styles.chatMainActionText}>✎ {chatCopy.renameRoom}</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      disabled={activeChatRoomIsSaving}
                      onPress={() => toggleChatRoomPin(activeChatRoom)}
                      style={(state) => [
                        styles.chatMainActionButton,
                        activeChatRoom.isPinned && styles.chatMainActionButtonActive,
                        ...interactiveStateStyles(state, { disabled: activeChatRoomIsSaving })
                      ]}
                    >
                      <View style={styles.chatMainActionContent}>
                        <PinIcon active={activeChatRoom.isPinned} compact inverse={activeChatRoom.isPinned} />
                        <Text style={[
                          styles.chatMainActionText,
                          activeChatRoom.isPinned && styles.chatMainActionTextActive
                        ]}>
                          {activeChatRoom.isPinned ? chatCopy.unpinRoom : chatCopy.pinRoom}
                        </Text>
                      </View>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={chatCopy.deleteCurrent}
                      disabled={activeChatRoomIsSaving}
                      onPress={() => handleDeleteChatRoom(activeChatRoom.id)}
                      style={(state) => [styles.chatRoomDeleteButton, ...interactiveStateStyles(state, { disabled: activeChatRoomIsSaving })]}
                    >
                      <Text style={styles.chatRoomDeleteButtonText}>🗑 {chatCopy.deleteRoom}</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>

              <ScrollView style={styles.messageListPanel} contentContainerStyle={styles.messageListContent}>
                {recentQnaList.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>{chatCopy.emptyTitle}</Text>
                    <Text style={styles.emptyText}>{chatCopy.emptyText}</Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setQuestionInput('오늘 헷갈린 개념: ')}
                      style={(state) => [styles.emptyActionButton, ...interactiveStateStyles(state)]}
                    >
                      <Text style={styles.emptyActionText}>{chatCopy.readyPrompt}</Text>
                    </Pressable>
                  </View>
                ) : (
                  recentQnaList.map((item, idx) => (
                    <View key={item.id || idx} style={styles.messagePair}>
                      <View style={[styles.messageBubble, styles.messageBubbleUser]}>
                        <Text style={styles.qnaLabelUser}>{chatCopy.userLabel}</Text>
                        <Text style={styles.qnaTextUser}>{item.question}</Text>
                      </View>
                      <View style={[styles.messageBubble, styles.messageBubbleAi]}>
                        <View style={styles.qnaHeader}>
                          <Text style={styles.qnaLabelAi}>{chatCopy.aiLabel}</Text>
                          <View style={styles.badgeRow}>
                            {item.isMock && <Text style={styles.mockBadge}>{chatCopy.mockBadge}</Text>}
                            {item.isTruncated && <Text style={styles.truncateBadge}>{chatCopy.truncateBadge}</Text>}
                          </View>
                        </View>
                        <ReadableText style={styles.qnaTextAi}>{item.answer}</ReadableText>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>

              <View style={styles.chatComposerCard}>
                <View style={styles.formHeader}>
                  <Text style={styles.formTitle}>{chatCopy.composerTitle}</Text>
                  <Text style={styles.charCounter}>
                    {chatCopy.charCount(questionInput.length, MAX_QUESTION_LENGTH)}
                  </Text>
                </View>
                <AccessibleTextInput
                  placeholder={chatCopy.composerPlaceholder}
                  placeholderTextColor={colors.muted}
                  value={questionInput}
                  onChangeText={setQuestionInput}
                  onCompositionStart={() => {
                    questionCompositionRef.current = true;
                  }}
                  onCompositionEnd={() => {
                    questionCompositionRef.current = false;
                  }}
                  onKeyDown={handleQuestionKeyDown}
                  style={styles.chatComposerInput}
                  multiline
                  numberOfLines={3}
                  maxLength={MAX_QUESTION_LENGTH}
                  blurOnSubmit={false}
                  editable={!loading}
                />
                <Pressable
                  disabled={loading || isChatRoomsLoading || !activeChatRoomId || !questionInput.trim()}
                  onPress={handleQuestionSubmit}
                  style={(state) => [
                    styles.chatSendButton,
                    (loading || isChatRoomsLoading || !activeChatRoomId || !questionInput.trim()) && styles.disabledBtn,
                    ...interactiveStateStyles(state, { disabled: loading || isChatRoomsLoading || !activeChatRoomId || !questionInput.trim() })
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.surface} size="small" />
                  ) : (
                    <Text style={styles.submitBtnText}>{chatCopy.send}</Text>
                  )}
                </Pressable>
              </View>

              <View style={styles.chatToolPanel}>
                <View style={styles.chatToolHeader}>
                  <Text style={styles.imagePanelTitle}>{chatCopy.imageToolsTitle}</Text>
                  <Text style={styles.imagePanelText}>{chatCopy.imageToolsDescription}</Text>
                </View>

                <View style={styles.imagePanel}>
                  <View style={styles.imagePanelHeader}>
                    <View style={styles.imagePanelCopy}>
                      <Text style={styles.imagePanelTitle}>{aiCopy.imageReviewTitle}</Text>
                      <Text style={styles.imagePanelText}>
                        {aiCopy.imageReviewDescription(formatFileSize(MAX_IMAGE_SIZE_BYTES))}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      onPress={openImagePicker}
                      style={(state) => [styles.imageAttachButton, ...interactiveStateStyles(state)]}
                    >
                      <Text style={styles.imageAttachButtonText}>{aiCopy.selectImageButton}</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.privacyNotice}>
                    {aiCopy.attachmentPrivacyNotice}
                  </Text>

                  <FieldFeedback {...getImageAttachmentFeedback({ attachment: imageAttachment, error: imageUploadError, language: currentLanguage })} />

                  {imageAttachment ? (
                    <View style={styles.imagePreviewCard}>
                      <Image source={{ uri: imageAttachment.previewUrl }} style={styles.imagePreview} />
                      <View style={styles.imageMeta}>
                        <Text style={styles.imageName}>{imageAttachment.name}</Text>
                        <Text style={styles.imageInfo}>
                          {imageAttachment.type} · {formatFileSize(imageAttachment.size)}
                        </Text>
                        <Text style={styles.imageMockText}>
                          {aiCopy.imageStoredNotice}
                        </Text>
                        <View style={styles.imageActionRow}>
                          <Pressable
                            accessibilityRole="button"
                            disabled={isAttachmentAnalyzing}
                            onPress={analyzeImageAttachment}
                            style={(state) => [styles.imageMockButton, ...interactiveStateStyles(state, { disabled: isAttachmentAnalyzing })]}
                          >
                            {isAttachmentAnalyzing ? (
                              <ActivityIndicator color={colors.mintDeep} size="small" />
                            ) : (
                              <Text style={styles.imageMockButtonText}>{aiCopy.analyzeImageButton}</Text>
                            )}
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            onPress={clearImageAttachment}
                            style={(state) => [styles.imageRemoveButton, ...interactiveStateStyles(state)]}
                          >
                            <Text style={styles.imageRemoveButtonText}>{aiCopy.removeAttachment}</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  ) : null}

                  {imageAnalysisResult ? (
                    <View style={styles.reviewResultCard}>
                      <View style={styles.resultHeaderRow}>
                        <Text style={styles.summaryCardTitle}>{aiCopy.imageReviewResultTitle}</Text>
                        <Text style={styles.truncateBadge}>{aiCopy.analysisResultBadge}</Text>
                      </View>
                      <Text style={styles.reviewBullet}>
                        {buildImageReviewChatAnswer(imageAnalysisResult, currentLanguage)}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.reviewPanel}>
                  <View style={styles.imagePanelHeader}>
                    <View style={styles.imagePanelCopy}>
                      <Text style={styles.imagePanelTitle}>{aiCopy.materialReviewTitle}</Text>
                      <Text style={styles.imagePanelText}>
                        {aiCopy.materialReviewDescription(formatFileSize(MAX_REVIEW_FILE_SIZE_BYTES))}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={aiCopy.selectMaterialFileAccessibilityLabel}
                      onPress={openReviewFilePicker}
                      style={(state) => [styles.imageAttachButton, ...interactiveStateStyles(state)]}
                    >
                      <Text style={styles.imageAttachButtonText}>{aiCopy.selectMaterialButton}</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.privacyNotice}>
                    {aiCopy.attachmentPrivacyNotice}
                  </Text>

                  <FieldFeedback {...getReviewAttachmentFeedback({ attachment: reviewAttachment, error: reviewUploadError, language: currentLanguage })} />

                  {reviewAttachment ? (
                    <View style={styles.reviewFileCard}>
                      {reviewAttachment.previewUrl ? (
                        <Image source={{ uri: reviewAttachment.previewUrl }} style={styles.imagePreview} />
                      ) : (
                        <View style={styles.reviewFileIcon}>
                          <Text style={styles.reviewFileIconText}>PDF</Text>
                        </View>
                      )}
                      <View style={styles.imageMeta}>
                        <Text style={styles.imageName}>{reviewAttachment.name}</Text>
                        <Text style={styles.imageInfo}>
                          {reviewAttachment.type} · {formatFileSize(reviewAttachment.size)}
                        </Text>
                        <Text style={styles.imageMockText}>
                          {aiCopy.reviewStoredNotice}
                        </Text>
                        <View style={styles.imageActionRow}>
                          <Pressable
                            accessibilityRole="button"
                            disabled={isAttachmentAnalyzing}
                            onPress={analyzeReviewAttachment}
                            style={(state) => [styles.imageMockButton, ...interactiveStateStyles(state, { disabled: isAttachmentAnalyzing })]}
                          >
                            {isAttachmentAnalyzing ? (
                              <ActivityIndicator color={colors.mintDeep} size="small" />
                            ) : (
                              <Text style={styles.imageMockButtonText}>{aiCopy.analyzeMaterialButton}</Text>
                            )}
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            onPress={clearReviewAttachment}
                            style={(state) => [styles.imageRemoveButton, ...interactiveStateStyles(state)]}
                          >
                            <Text style={styles.imageRemoveButtonText}>{aiCopy.removeAttachment}</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  ) : null}

                  {reviewAnalysisResult ? (
                    <View style={styles.reviewResultCard}>
                      <View style={styles.resultHeaderRow}>
                        <Text style={styles.summaryCardTitle}>{aiCopy.materialReviewTitle}</Text>
                        <Text style={styles.truncateBadge}>{aiCopy.analysisResultBadge}</Text>
                      </View>
                      {reviewAnalysisResult.textExtraction?.extractedTextPreview ? (
                        <View style={styles.reviewResultSection}>
                          <Text style={styles.reviewResultSubtitle}>{aiCopy.extractedTextTitle}</Text>
                          <Text style={styles.reviewBullet}>{reviewAnalysisResult.textExtraction.extractedTextPreview}</Text>
                        </View>
                      ) : null}
                      {reviewAnalysisResult.generation?.summary?.length ? (
                        <View style={styles.reviewResultSection}>
                          <Text style={styles.reviewResultSubtitle}>{aiCopy.summaryTitle}</Text>
                          {reviewAnalysisResult.generation.summary.map((line, index) => (
                            <Text key={index} style={styles.reviewBullet}>• {line}</Text>
                          ))}
                        </View>
                      ) : null}
                      {reviewAnalysisResult.generation?.notes?.length ? (
                        <View style={styles.reviewResultSection}>
                          <Text style={styles.reviewResultSubtitle}>{aiCopy.notesTitle}</Text>
                          {reviewAnalysisResult.generation.notes.map((line, index) => (
                            <Text key={index} style={styles.reviewBullet}>• {line}</Text>
                          ))}
                        </View>
                      ) : null}
                      {reviewAnalysisResult.generation?.quiz?.length ? (
                        <View style={styles.reviewResultSection}>
                          <Text style={styles.reviewResultSubtitle}>{aiCopy.quizTitle}</Text>
                          {reviewAnalysisResult.generation.quiz.map((quiz, index) => (
                            <View key={index} style={styles.quizCard}>
                              <Text style={styles.quizQuestion}>Q{index + 1}. {quiz.question}</Text>
                              <Text style={styles.quizAnswer}>A. {quiz.answer}</Text>
                            </View>
                          ))}
                        </View>
                      ) : null}
                      {reviewAnalysisResult.generation?.keywords?.length ? (
                        <View style={styles.reviewResultSection}>
                          <Text style={styles.reviewResultSubtitle}>{aiCopy.keywordsTitle}</Text>
                          <Text style={styles.reviewBullet}>{reviewAnalysisResult.generation.keywords.join(', ')}</Text>
                        </View>
                      ) : null}
                      {reviewAnalysisResult.warnings?.length ? (
                        <View style={styles.reviewResultSection}>
                          <Text style={styles.reviewResultSubtitle}>{aiCopy.warningsTitle}</Text>
                          {reviewAnalysisResult.warnings.map((line, index) => (
                            <Text key={index} style={styles.reviewBullet}>• {line}</Text>
                          ))}
                        </View>
                      ) : null}
                      {reviewAnalysisResult.generation?.status === 'text_not_available' ? (
                        <Text style={styles.reviewBullet}>{aiCopy.noGeneratedResult}</Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* TAB 2: 맞춤 학습 추천 */}
        {activeTab === 'recommend' && (
          <View style={styles.tabContent}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>학습 기록 분석</Text>
              <Text style={styles.formDesc}>
                캘린더에 등록된 내 학습 일정과 칸반 보드의 할 일 데이터를 분석하여 AI가 오늘 집중할 과목과 학습 팁을 제안해 줍니다.
              </Text>
              <Pressable
                disabled={loading}
                onPress={handleRecommendationSubmit}
                style={(state) => [
                  styles.submitBtn,
                  loading && styles.disabledBtn,
                  ...interactiveStateStyles(state, { disabled: loading })
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.surface} size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>분석 및 맞춤 추천 요청</Text>
                )}
              </Pressable>
            </View>

            {/* Recommendation Result */}
            {recommendationResult && (
              <View style={styles.recommendCard}>
                <View style={styles.resultHeaderRow}>
                  <Text style={styles.recommendLabel}>📚 AI 추천 학습 과목</Text>
                  {recommendationResult.isMock && <Text style={styles.mockBadge}>{aiCopy.practiceBadgeRecommendation}</Text>}
                </View>
                <View style={styles.subjectBox}>
                  <Text style={styles.subjectText}>{recommendationResult.recommendedSubject}</Text>
                </View>

                <RecommendationBasisPanel basis={recommendationResult.basis} copy={aiCopy} />

                <Text style={[styles.recommendLabel, { marginTop: 20 }]}>💡 오늘의 추천 공부 팁</Text>
                <View style={styles.tipsBox}>
                  {recommendationResult.tips.map((tip, idx) => (
                    <View key={idx} style={styles.tipItem}>
                      <Text style={styles.tipBullet}>•</Text>
                      <ReadableText style={styles.tipText}>{tip}</ReadableText>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* TAB 3: 긴 글 요약 */}
        {activeTab === 'summarize' && (
          <View style={styles.tabContent}>
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>요약할 본문 입력</Text>
                <Text style={styles.charCounter}>
                  {summarizeInput.length} / {MAX_SUMMARY_LENGTH}자
                </Text>
              </View>
              <AccessibleTextInput
                placeholder="책 본문, 학습지 텍스트 등 요약이 필요한 긴 글을 복사해서 붙여넣으세요."
                placeholderTextColor={colors.muted}
                value={summarizeInput}
                onChangeText={setSummarizeInput}
                style={[styles.textInput, { minHeight: 150 }]}
                multiline
                numberOfLines={8}
                maxLength={MAX_SUMMARY_LENGTH}
                editable={!loading}
              />
              <Pressable
                disabled={loading || !summarizeInput.trim()}
                onPress={handleSummarySubmit}
                style={(state) => [
                  styles.submitBtn,
                  (loading || !summarizeInput.trim()) && styles.disabledBtn,
                  ...interactiveStateStyles(state, { disabled: loading || !summarizeInput.trim() })
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.surface} size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>3줄 요약 요청하기</Text>
                )}
              </Pressable>
            </View>

            {/* Summary Result */}
            {summaryResult && (
              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <Text style={styles.summaryCardTitle}>📋 AI 3줄 요약 결과</Text>
                  <View style={styles.badgeRow}>
                    {summaryResult.isMock && <Text style={styles.mockBadge}>{aiCopy.practiceBadgeSummary}</Text>}
                    {summaryResult.isTruncated && <Text style={styles.truncateBadge}>앞부분 요약됨 (3000자 초과)</Text>}
                  </View>
                </View>
                <View style={styles.summaryContentBox}>
                  <ReadableText style={styles.summaryText}>{summaryResult.summary}</ReadableText>
                </View>
              </View>
            )}
          </View>
        )}

        {/* TAB 4: 오답 원인 분석 */}
        {activeTab === 'wrong' && (
          <View style={styles.tabContent}>
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>틀린 문제 내용 (필수)</Text>
                <Text style={styles.charCounter}>
                  {wrongProblemInput.length} / {MAX_PROBLEM_LENGTH}자
                </Text>
              </View>
              <AccessibleTextInput
                placeholder="틀린 문제 문항이나 문제를 그대로 입력해 주세요."
                placeholderTextColor={colors.muted}
                value={wrongProblemInput}
                onChangeText={setWrongProblemInput}
                style={styles.textInput}
                multiline
                numberOfLines={3}
                maxLength={MAX_PROBLEM_LENGTH}
                editable={!loading}
              />

              <View style={[styles.formHeader, { marginTop: 14 }]}>
                <Text style={styles.formTitle}>내가 작성한 오답 (선택)</Text>
                <Text style={styles.charCounter}>
                  {wrongUserAnswerInput.length} / {MAX_ANSWER_LENGTH}자
                </Text>
              </View>
              <AccessibleTextInput
                placeholder="문제 풀 때 내가 작성했던 틀린 답변이나 풀이 과정을 적어보세요. (선택)"
                placeholderTextColor={colors.muted}
                value={wrongUserAnswerInput}
                onChangeText={setWrongUserAnswerInput}
                style={styles.textInput}
                multiline
                numberOfLines={3}
                maxLength={MAX_ANSWER_LENGTH}
                editable={!loading}
              />

              <Pressable
                disabled={loading || !wrongProblemInput.trim()}
                onPress={handleWrongAnswerSubmit}
                style={(state) => [
                  styles.submitBtn,
                  (loading || !wrongProblemInput.trim()) && styles.disabledBtn,
                  ...interactiveStateStyles(state, { disabled: loading || !wrongProblemInput.trim() })
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.surface} size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>오답 원인 분석하기</Text>
                )}
              </Pressable>
            </View>

            {/* Wrong Answer Analysis Result */}
            {wrongAnalysisResult && (
              <View style={styles.wrongCard}>
                <View style={styles.wrongHeaderRow}>
                  <Text style={styles.wrongLabel}>🎯 틀린 원인 분석 결과</Text>
                  <View style={styles.badgeRow}>
                    {wrongAnalysisResult.isMock && <Text style={styles.mockBadge}>{aiCopy.practiceBadgeWrongAnswer}</Text>}
                    <View style={styles.weakBadge}>
                      <Text style={styles.weakBadgeText}>
                        {wrongAnalysisResult.weakType === 'calculation mistake' ? '연산 실수' : '개념 이해 부족'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.wrongContentBox}>
                  <Text style={styles.wrongQuestionTitle}>📌 입력한 문제:</Text>
                  <Text style={styles.wrongQuestionText}>{wrongAnalysisResult.problem}</Text>

                  {wrongAnalysisResult.userAnswer ? (
                    <>
                      <Text style={styles.wrongUserLabel}>✏️ 내가 쓴 답변:</Text>
                      <Text style={styles.wrongUserText}>{wrongAnalysisResult.userAnswer}</Text>
                    </>
                  ) : null}

                  <View style={styles.wrongDivider} />

                  <Text style={styles.wrongExplanationLabel}>📝 AI 피드백 및 해설:</Text>
                  <ReadableText style={styles.wrongExplanationText}>{wrongAnalysisResult.explanation}</ReadableText>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  contentContainer: {
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
    padding: 18,
    paddingBottom: 48,
    gap: 18
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%'
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 4
  },
  title: {
    fontSize: 29,
    fontWeight: '800',
    color: colors.ink
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4
  },
  mockModeCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.mint,
    backgroundColor: colors.mintSoft,
    padding: 18,
    ...interactions.transition
  },
  mockModeCopy: {
    flex: 1,
    minWidth: 220,
    gap: 6
  },
  mockModeLabel: {
    color: colors.mintDeep,
    fontSize: 14,
    fontWeight: '900'
  },
  mockModeText: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600'
  },
  mockToggle: {
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...interactions.transition
  },
  mockToggleActive: {
    backgroundColor: colors.blueDeep,
    borderColor: colors.blueDeep
  },
  mockToggleText: {
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '900'
  },
  mockToggleTextActive: {
    color: colors.surface
  },
  audioBriefingCard: {
    gap: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.surfaceWarm,
    padding: 18,
    ...shadows.card,
    ...interactions.transition
  },
  audioBriefingHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14
  },
  audioBriefingCopy: {
    flex: 1,
    minWidth: 220,
    gap: 6
  },
  audioBriefingEyebrow: {
    color: colors.mintDeep,
    fontSize: 12,
    fontWeight: '900'
  },
  audioBriefingTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900'
  },
  audioBriefingText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600'
  },
  audioBriefingMeta: {
    color: colors.blueDeep,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800'
  },
  audioBriefingButton: {
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.blueDeep,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...interactions.transition
  },
  audioBriefingButtonActive: {
    backgroundColor: colors.blueDeep,
    borderColor: colors.blueDeep
  },
  audioBriefingButtonText: {
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '900'
  },
  audioBriefingButtonTextActive: {
    color: colors.surface
  },
  audioBriefingLineList: {
    gap: 8
  },
  audioBriefingLine: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600'
  },
  audioBriefingNotice: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700'
  },
  transparencyPanel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  transparencyCard: {
    flex: 1,
    minWidth: 220,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 16,
    ...interactions.transition
  },
  transparencyLabel: {
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '800'
  },
  transparencyText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 6
  },
  backButton: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 18,
    ...interactions.transition
  },
  backButtonText: {
    color: colors.blueDeep,
    fontSize: 14,
    fontWeight: '600'
  },
  tabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 7,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.blueDeep,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  tabButton: {
    flex: 1,
    minWidth: 104,
    minHeight: 47,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
    ...interactions.transition
  },
  tabButtonActive: {
    backgroundColor: colors.mint
  },
  tabButtonText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600'
  },
  tabButtonTextActive: {
    color: colors.surface,
    fontWeight: '700'
  },
  errorAlert: {
    backgroundColor: colors.dangerSoft,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: 14
  },
  successAlert: {
    backgroundColor: colors.successSoft,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.mint,
    padding: 14
  },
  alertText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600'
  },
  panelBody: {
    marginTop: 4
  },
  tabContent: {
    gap: 16
  },
  aiChatShell: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    gap: 16
  },
  chatSidebar: {
    width: 280,
    maxWidth: '100%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 12,
    ...shadows.card,
    ...interactions.transition
  },
  chatSidebarCollapsed: {
    width: 76,
    paddingHorizontal: 12,
    alignItems: 'center'
  },
  chatRoomPanel: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    gap: 14,
    ...shadows.card,
    ...interactions.transition
  },
  chatRoomHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  chatRoomTitleGroup: {
    flex: 1,
    minWidth: 160,
    gap: 4
  },
  chatRoomTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900'
  },
  chatRoomDesc: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4
  },
  chatSidebarToggle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
    ...interactions.transition
  },
  chatSidebarToggleText: {
    color: colors.blueDeep,
    fontSize: 21,
    fontWeight: '900',
    lineHeight: 23
  },
  chatSidebarRail: {
    width: '100%',
    alignItems: 'center',
    gap: 12
  },
  chatRailButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    ...interactions.transition
  },
  chatRailButtonText: {
    color: colors.blueDeep,
    fontSize: 20,
    fontWeight: '900'
  },
  chatRailCount: {
    minWidth: 34,
    borderRadius: 999,
    backgroundColor: colors.mintSoft,
    color: colors.mintDeep,
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 5,
    textAlign: 'center'
  },
  chatRailPinned: {
    color: colors.mintDeep,
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center'
  },
  newChatButton: {
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: colors.blue,
    borderWidth: 1,
    borderColor: colors.blue,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...interactions.transition
  },
  newChatButtonText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '900'
  },
  chatSearchInput: {
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 12,
    color: colors.ink,
    fontSize: 13
  },
  chatRoomLoadingText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700'
  },
  chatRoomList: {
    maxHeight: 410
  },
  chatRoomListContent: {
    gap: 8,
    paddingBottom: 4
  },
  chatRoomSection: {
    gap: 8,
    marginBottom: 8
  },
  chatRoomSectionTitle: {
    color: colors.blueDeep,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
    paddingHorizontal: 4
  },
  chatRoomEmptyText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    paddingVertical: 8
  },
  chatRoomChip: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 11,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    ...interactions.transition
  },
  chatRoomChipActive: {
    borderColor: colors.mint,
    backgroundColor: colors.mintSoft
  },
  chatRoomChipPinned: {
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft
  },
  chatRoomSelectArea: {
    flex: 1,
    minWidth: 0,
    minHeight: 32,
    justifyContent: 'center'
  },
  chatRoomChipCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3
  },
  chatRoomChipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  chatRoomPinMark: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  chatRoomChipTitle: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '900'
  },
  chatRoomChipTitleActive: {
    color: colors.mintDeep
  },
  chatRoomChipMeta: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700'
  },
  chatRoomChipMetaActive: {
    color: colors.mintDeep
  },
  chatRoomActionCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  chatRoomIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...interactions.transition
  },
  chatRoomIconButtonActive: {
    backgroundColor: colors.blue,
    borderColor: colors.blue
  },
  chatRoomIconText: {
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16
  },
  chatRoomIconTextActive: {
    color: colors.surface
  },
  pinIcon: {
    width: 14,
    height: 16,
    alignItems: 'center',
    justifyContent: 'flex-start',
    transform: [{ rotate: '-28deg' }]
  },
  pinIconCompact: {
    width: 11,
    height: 13
  },
  pinIconHead: {
    width: 11,
    height: 6,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.blueDeep,
    backgroundColor: colors.blueSoft
  },
  pinIconHeadCompact: {
    width: 9,
    height: 5
  },
  pinIconHeadActive: {
    borderColor: colors.blue,
    backgroundColor: colors.blue
  },
  pinIconHeadInverse: {
    borderColor: colors.surface,
    backgroundColor: colors.surface
  },
  pinIconStem: {
    width: 2,
    height: 8,
    marginTop: -1,
    borderRadius: 2,
    backgroundColor: colors.blueDeep
  },
  pinIconStemCompact: {
    height: 6
  },
  pinIconStemActive: {
    backgroundColor: colors.blue
  },
  pinIconStemInverse: {
    backgroundColor: colors.surface
  },
  pinIconPoint: {
    width: 5,
    height: 5,
    marginTop: -2,
    borderRadius: 1,
    backgroundColor: colors.blueDeep,
    transform: [{ rotate: '45deg' }]
  },
  pinIconPointCompact: {
    width: 4,
    height: 4
  },
  pinIconPointActive: {
    backgroundColor: colors.blue
  },
  pinIconPointInverse: {
    backgroundColor: colors.surface
  },
  chatRoomInlineDeleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...interactions.transition
  },
  chatRoomInlineDeleteText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 20
  },
  chatRoomEditPanel: {
    flex: 1,
    width: '100%',
    gap: 8
  },
  chatRoomEditInput: {
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.mint,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 13,
    paddingHorizontal: 10
  },
  chatRoomEditActions: {
    flexDirection: 'row',
    gap: 6
  },
  chatRoomMiniButton: {
    minHeight: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.blue,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...interactions.transition
  },
  chatRoomMiniButtonText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '900'
  },
  chatRoomMiniGhostButton: {
    minHeight: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...interactions.transition
  },
  chatRoomMiniGhostText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900'
  },
  chatRoomDeleteButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 2,
    minHeight: 34,
    paddingHorizontal: 12,
    justifyContent: 'center',
    ...interactions.transition
  },
  chatRoomDeleteButtonText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '900'
  },
  chatMain: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    ...shadows.card,
    ...interactions.transition
  },
  chatMainHeader: {
    minHeight: 72,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  chatMainTitleGroup: {
    flex: 1,
    minWidth: 220,
    gap: 4
  },
  chatMainTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8
  },
  chatMainPinBadge: {
    borderRadius: 999,
    backgroundColor: colors.blueSoft,
    color: colors.blueDeep,
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  chatMainTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900'
  },
  chatMainMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700'
  },
  chatMainRenameRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8
  },
  chatMainRenameInput: {
    minWidth: 220,
    minHeight: 40,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.mint,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
    paddingHorizontal: 12
  },
  chatMainActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8
  },
  chatMainActionButton: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...interactions.transition
  },
  chatMainActionButtonActive: {
    borderColor: colors.blue,
    backgroundColor: colors.blue
  },
  chatMainActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  chatMainActionText: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '900'
  },
  chatMainActionTextActive: {
    color: colors.surface
  },
  messageListPanel: {
    minHeight: 320,
    maxHeight: 560,
    backgroundColor: colors.cream
  },
  messageListContent: {
    padding: 18,
    gap: 14
  },
  messagePair: {
    gap: 10
  },
  messageBubble: {
    maxWidth: '88%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 7
  },
  messageBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: colors.blueSoft,
    borderColor: colors.blue
  },
  messageBubbleAi: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.mint
  },
  chatComposerCard: {
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.surface
  },
  chatComposerInput: {
    minHeight: 76,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 13,
    color: colors.ink,
    fontSize: 14,
    textAlignVertical: 'top'
  },
  chatSendButton: {
    alignSelf: 'flex-end',
    minWidth: 104,
    minHeight: 42,
    backgroundColor: colors.blue,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.blue,
    ...interactions.transition
  },
  chatToolPanel: {
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.surface
  },
  chatToolHeader: {
    gap: 5
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 23,
    gap: 12,
    ...shadows.card,
    shadowColor: colors.blueDeep,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink
  },
  formDesc: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18
  },
  charCounter: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600'
  },
  textInput: {
    minHeight: 90,
    backgroundColor: colors.surfaceWarm,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    color: colors.ink,
    fontSize: 14,
    textAlignVertical: 'top'
  },
  submitBtn: {
    minHeight: 44,
    backgroundColor: colors.blue,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.blue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: colors.blue,
    ...interactions.transition
  },
  submitBtnText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700'
  },
  disabledBtn: {
    backgroundColor: colors.muted,
    shadowOpacity: 0
  },
  resultSection: {
    gap: 12
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    marginLeft: 2
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center'
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center'
  },
  emptyActionButton: {
    minHeight: 38,
    borderRadius: 999,
    backgroundColor: colors.blueSoft,
    paddingHorizontal: 14,
    justifyContent: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.blueSoft,
    ...interactions.transition
  },
  emptyActionText: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '800'
  },
  imagePanel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 16,
    gap: 12
  },
  imagePanelHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12
  },
  imagePanelCopy: {
    flex: 1,
    minWidth: 220,
    gap: 5
  },
  imagePanelTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800'
  },
  imagePanelText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18
  },
  imageAttachButton: {
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: colors.blue,
    borderWidth: 1,
    borderColor: colors.blue,
    paddingHorizontal: 15,
    justifyContent: 'center',
    ...interactions.transition
  },
  imageAttachButtonText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '900'
  },
  privacyNotice: {
    color: colors.warning,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700'
  },
  imageErrorBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
    padding: 12
  },
  imageErrorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '800'
  },
  imagePreviewCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 14
  },
  reviewPanel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.mint,
    backgroundColor: colors.mintSoft,
    padding: 16,
    gap: 12
  },
  reviewFileCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 14
  },
  reviewFileIcon: {
    width: 148,
    height: 108,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.mint,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center'
  },
  reviewFileIconText: {
    color: colors.mintDeep,
    fontSize: 22,
    fontWeight: '900'
  },
  imagePreview: {
    width: 148,
    height: 108,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.blueSoft,
    resizeMode: 'cover'
  },
  imageMeta: {
    flex: 1,
    minWidth: 220,
    gap: 7
  },
  imageName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900'
  },
  imageInfo: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700'
  },
  imageMockText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18
  },
  imageActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  imageMockButton: {
    minHeight: 38,
    borderRadius: 999,
    backgroundColor: colors.mintSoft,
    borderWidth: 1,
    borderColor: colors.mint,
    paddingHorizontal: 13,
    justifyContent: 'center',
    ...interactions.transition
  },
  imageMockButtonText: {
    color: colors.mintDeep,
    fontSize: 12,
    fontWeight: '900'
  },
  imageRemoveButton: {
    minHeight: 38,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingHorizontal: 13,
    justifyContent: 'center',
    ...interactions.transition
  },
  imageRemoveButtonText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '900'
  },
  reviewResultCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 14
  },
  reviewResultSection: {
    gap: 8
  },
  reviewResultSubtitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900'
  },
  reviewBullet: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700'
  },
  quizCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 12,
    gap: 5
  },
  quizQuestion: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 18
  },
  quizAnswer: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18
  },
  qnaCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 8,
    shadowColor: colors.blueDeep,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  qnaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  qnaLabelUser: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  qnaLabelAi: {
    color: colors.mintDeep,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  qnaTextUser: {
    fontSize: 14,
    color: colors.ink,
    fontWeight: '500'
  },
  qnaTextAi: {
    fontSize: 14,
    color: colors.ink,
    lineHeight: 20
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 4
  },
  truncateBadge: {
    fontSize: 10,
    color: colors.warning,
    backgroundColor: colors.warningSoft,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontWeight: '700'
  },
  mockBadge: {
    fontSize: 10,
    color: colors.blueDeep,
    backgroundColor: colors.blueSoft,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontWeight: '900'
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6
  },
  resultHeaderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8
  },
  recommendCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 20,
    shadowColor: colors.blueDeep,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  recommendLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 8
  },
  subjectBox: {
    backgroundColor: colors.mintSoft,
    borderWidth: 1,
    borderColor: colors.mint,
    borderRadius: 13,
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  subjectText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.mintDeep,
    textAlign: 'center'
  },
  recommendBasisBox: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 14,
    gap: 10
  },
  recommendBasisLabel: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '900'
  },
  recommendBasisText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700'
  },
  recommendBasisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  recommendBasisColumn: {
    flex: 1,
    minWidth: 180,
    gap: 5
  },
  recommendBasisColumnTitle: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '900'
  },
  recommendBasisItem: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700'
  },
  recommendBasisItemMuted: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic'
  },
  tipsBox: {
    gap: 8
  },
  tipItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start'
  },
  tipBullet: {
    color: colors.mintDeep,
    fontSize: 14,
    fontWeight: '700'
  },
  tipText: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
    flex: 1
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 20,
    gap: 12,
    shadowColor: colors.blueDeep,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  summaryCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink
  },
  summaryContentBox: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: 13,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line
  },
  summaryText: {
    fontSize: 14,
    color: colors.ink,
    lineHeight: 22,
    whiteSpace: 'pre-wrap' // For bullet lists formatted by backend summary
  },
  wrongCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 20,
    gap: 12,
    shadowColor: colors.blueDeep,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  wrongHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  wrongLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink
  },
  weakBadge: {
    backgroundColor: colors.cream,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  weakBadgeText: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '700'
  },
  wrongContentBox: {
    gap: 8
  },
  wrongQuestionTitle: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600'
  },
  wrongQuestionText: {
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.surfaceWarm,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.line
  },
  wrongUserLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
    marginTop: 4
  },
  wrongUserText: {
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.surfaceWarm,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.line
  },
  wrongDivider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 6
  },
  wrongExplanationLabel: {
    fontSize: 12,
    color: colors.mintDeep,
    fontWeight: '700'
  },
  wrongExplanationText: {
    fontSize: 14,
    color: colors.ink,
    lineHeight: 20
  },
  errorHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.danger
  },
  errorSub: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
    marginBottom: 16
  }
});
