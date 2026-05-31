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
  summarizeText,
  analyzeWrongAnswer,
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
    imageAttached: '이미지 파일을 첨부했어요. 현재는 서버에 업로드하지 않는 미리보기예요.',
    imageHelp: (size) => `PNG, JPG, WEBP, GIF 이미지를 ${size} 이하로 첨부할 수 있어요.`,
    pdfPreview: 'PDF는 현재 검토용 mock 결과로만 미리보기돼요.',
    reviewImageAttached: '검토용 이미지 파일을 첨부했어요. 실제 OCR은 아직 실행하지 않아요.',
    reviewHelp: (size) => `이미지 또는 PDF를 ${size} 이하로 선택할 수 있어요.`,
    pdfSource: 'PDF 자료',
    imageSource: '이미지 자료',
    fallbackFile: '학습 자료',
    noteTitle: (source) => `${source} 데모 노트`,
    reviewSummary: (fileName) => [
      `${fileName}에서 실제 OCR을 수행하지 않고, 학습 자료 정리 흐름만 확인하는 예시입니다.`,
      '핵심 개념을 2~3개 문장으로 압축하고, 복습할 질문을 함께 제안하는 방향을 검토합니다.',
      '실제 노트/퀴즈 저장은 파일 처리 정책과 비용 검토 후 후속 범위에서 결정합니다.'
    ],
    reviewQuizzes: [
      {
        question: '이 자료에서 먼저 확인해야 할 핵심 개념은 무엇인가요?',
        answer: '자료 제목, 단원명, 반복 등장하는 키워드를 먼저 찾습니다.'
      },
      {
        question: '자동 퀴즈 생성 전 사용자가 확인해야 할 점은 무엇인가요?',
        answer: '개인정보가 포함되지 않았는지 확인하고, 데모 결과가 실제 분석이 아님을 구분합니다.'
      },
      {
        question: '후속 구현에서 필요한 기술 검토 항목은 무엇인가요?',
        answer: 'OCR/PDF 파싱 방식, 파일 저장 정책, AI 비용, 생성된 StudyNote/Quiz 저장 범위입니다.'
      }
    ],
    mockAnswer: (question) => [
      `데모 응답입니다. 질문의 핵심은 "${question.slice(0, 80)}${question.length > 80 ? '...' : ''}"로 확인됩니다.`,
      '먼저 개념을 한 문장으로 정리하고, 교재 예제 1개를 풀어 본 뒤, 헷갈린 부분만 다시 질문해 보세요.',
      '실제 외부 AI 호출이 아닌 발표/데모 안정성을 위한 Mock 응답입니다.'
    ].join(' '),
    recommendation: {
      recommendedSubject: '오늘의 복습 루틴',
      tips: [
        '마감이 가까운 일정 1개를 먼저 확인하세요.',
        '25분 집중 세션을 시작하고 끝난 뒤 완료한 내용을 기록하세요.',
        '오답노트에서 같은 유형 문제를 1개만 다시 풀어 보세요.'
      ]
    },
    summary: (preview) => [
      '- 데모 요약입니다. 본문에서 핵심 개념과 연결 단어를 먼저 분리합니다.',
      '- 예시나 문제 풀이가 있다면 개념 적용 순서를 따로 표시합니다.',
      `- 다시 볼 부분: ${preview}`
    ].join('\n'),
    weakCalculation: 'calculation mistake',
    weakConcept: 'concept misunderstanding',
    wrongAnalysis: (problem, userAnswer) => [
      '데모 분석입니다. 실제 외부 AI 호출 없이 오답 점검 흐름만 확인합니다.',
      `문제 핵심: ${problem.slice(0, 80)}${problem.length > 80 ? '...' : ''}`,
      userAnswer ? `작성한 답: ${userAnswer.slice(0, 80)}${userAnswer.length > 80 ? '...' : ''}` : '작성한 답이 없어 풀이 과정 중심으로 점검합니다.',
      '정답을 바로 외우기보다 왜 그 선택을 했는지 한 단계만 다시 적어 보세요.'
    ].join(' '),
    audioBriefing: {
      eyebrow: '브라우저 음성 데모',
      title: '오늘의 오디오 브리핑',
      description: '현재 AI 학습 화면의 기록을 짧게 정리해 접근성 목소리 설정으로 읽어줍니다.',
      play: '브리핑 듣기',
      stop: '정지',
      playing: '오디오 브리핑을 재생합니다.',
      stopped: '오디오 브리핑을 멈췄습니다.',
      notSupported: '현재 브라우저는 오디오 브리핑 읽어주기를 지원하지 않습니다.',
      notice: '외부 AI/TTS API를 호출하지 않는 mock/demo 브리핑입니다.',
      voiceLabel: (voice) => `접근성 목소리 설정: ${voice}`,
      actionLabel: '오늘의 AI 학습 오디오 브리핑 재생 또는 정지',
      lines: ({ mockMode, chatCount, hasRecommendation, hasSummary, hasWrongAnalysis, hasReviewMock, hasImageInsight }) => [
        mockMode ? 'AI Mock 모드가 켜져 있어 외부 AI 호출 없이 데모 응답으로 학습 흐름을 확인 중입니다.' : 'AI 학습 API 흐름을 사용할 준비가 되어 있습니다. 민감정보는 질문에 포함하지 않는 것이 원칙입니다.',
        chatCount > 0 ? `최근 AI 대화 ${chatCount}개가 이 브리핑에 반영됩니다.` : '아직 AI 질문 기록이 없어 첫 질문부터 가볍게 시작하면 좋습니다.',
        hasRecommendation ? '맞춤 학습 추천 결과가 있어 오늘의 복습 루틴을 바로 확인할 수 있습니다.' : '맞춤 추천을 한 번 실행하면 오늘의 복습 방향을 더 쉽게 잡을 수 있습니다.',
        hasSummary ? '문서 요약 결과가 준비되어 있어 핵심 개념을 다시 훑기 좋습니다.' : '긴 글 요약을 사용하면 자료의 핵심 개념을 빠르게 정리할 수 있습니다.',
        hasWrongAnalysis ? '오답 분석 기록이 있어 헷갈린 풀이 과정을 다시 볼 수 있습니다.' : '오답 원인 분석을 사용하면 취약한 풀이 단계를 확인할 수 있습니다.',
        hasReviewMock || hasImageInsight ? '첨부 파일 데모 결과는 실제 분석이 아닌 안내용 mock 결과로만 표시됩니다.' : '이미지나 PDF 첨부는 현재 서버 업로드 없이 미리보기와 mock 안내만 제공합니다.'
      ]
    },
    errors: {
      token: '로그인 정보가 만료되었을 수 있습니다. 다시 로그인하거나 Mock 모드로 데모 흐름을 확인해 주세요.',
      quota: 'AI 요청 한도나 quota를 초과했을 수 있습니다. 잠시 후 다시 시도하거나 Mock 모드를 켜서 데모를 이어가세요.',
      provider: 'AI 제공자 설정이나 API key 상태를 확인해야 합니다. 현재 화면에서는 Mock 모드로 안전하게 시연할 수 있습니다.',
      network: '네트워크 연결이 불안정해 AI 응답을 가져오지 못했습니다. 연결을 확인하거나 Mock 모드로 전환해 주세요.',
      fallback: 'AI 응답을 불러오지 못했습니다. 민감정보를 포함하지 않았는지 확인하고, 필요하면 Mock 모드로 데모 흐름을 확인해 주세요.'
    },
    imageInsightQuestion: (name) => `[이미지 첨부 데모] ${name}`,
    imageInsightAnswer: '현재 1차 구현은 실제 외부 AI Vision 분석을 수행하지 않습니다. 첨부한 이미지는 브라우저 미리보기로만 표시되며 서버에 업로드되지 않습니다. 실제 OCR/PDF 자동 노트·퀴즈 생성은 후속 Issue에서 파일 처리 정책과 비용을 확인한 뒤 검토합니다.',
    imageInsightSuccess: '이미지 첨부 데모 응답을 추가했습니다. 실제 분석 결과가 아닌 안내용 mock 응답입니다.',
    selectImageFirst: '먼저 이미지를 첨부해 주세요.',
    selectReviewFileFirst: '먼저 이미지 또는 PDF 파일을 선택해 주세요.',
    reviewResultSuccess: 'OCR/PDF 데모 결과를 생성했습니다. 실제 분석이나 저장은 수행하지 않았습니다.',
    mockQuestionSuccess: 'Mock 모드 응답을 추가했습니다. 실제 외부 AI 호출은 수행하지 않았습니다.',
    mockRecommendationSuccess: 'Mock 모드 추천을 표시했습니다. 실제 외부 AI 호출은 수행하지 않았습니다.',
    mockSummarySuccess: 'Mock 모드 요약을 표시했습니다. 실제 외부 AI 호출은 수행하지 않았습니다.',
    mockWrongAnswerSuccess: 'Mock 모드 오답 분석을 표시했습니다. 실제 외부 AI 호출은 수행하지 않았습니다.',
    mockModeOn: 'AI Mock 모드를 켰습니다. 실제 외부 AI 호출 없이 데모 응답을 표시합니다.',
    mockModeOff: 'AI Mock 모드를 껐습니다. 기존 AI 학습 API 흐름을 사용합니다.'
  },
  en: {
    imageAttached: 'Image file attached. This is a preview and is not uploaded to the server.',
    imageHelp: (size) => `You can attach PNG, JPG, WEBP, or GIF images up to ${size}.`,
    pdfPreview: 'PDFs are currently previewed only as mock review results.',
    reviewImageAttached: 'Review image attached. Actual OCR is not running yet.',
    reviewHelp: (size) => `You can choose an image or PDF up to ${size}.`,
    pdfSource: 'PDF material',
    imageSource: 'Image material',
    fallbackFile: 'study material',
    noteTitle: (source) => `${source} demo note`,
    reviewSummary: (fileName) => [
      `This is an example flow for organizing ${fileName} without running actual OCR.`,
      'The demo compresses key ideas into two or three sentences and suggests review questions.',
      'Saving real notes or quizzes will be decided later after file policy and cost review.'
    ],
    reviewQuizzes: [
      {
        question: 'What core concept should be checked first in this material?',
        answer: 'Start with the title, unit name, and repeated keywords.'
      },
      {
        question: 'What should the user check before automatic quiz generation?',
        answer: 'Check that no personal information is included and that the result is a demo, not real analysis.'
      },
      {
        question: 'What technical items need review for the follow-up implementation?',
        answer: 'OCR/PDF parsing, file retention policy, AI cost, and StudyNote/Quiz storage scope.'
      }
    ],
    mockAnswer: (question) => [
      `This is a demo response. The question appears to focus on "${question.slice(0, 80)}${question.length > 80 ? '...' : ''}".`,
      'First summarize the concept in one sentence, solve one textbook example, and then ask again only about the confusing part.',
      'This is a mock response for demo stability, not an external AI call.'
    ].join(' '),
    recommendation: {
      recommendedSubject: 'Today’s review routine',
      tips: [
        'Check one schedule item with an upcoming deadline first.',
        'Start a 25-minute focus session and record what you completed afterward.',
        'Redo just one similar problem from your wrong-answer notes.'
      ]
    },
    summary: (preview) => [
      '- This is a demo summary. It first separates key concepts and linking words from the text.',
      '- If there is an example or solution, it marks the order for applying the concept.',
      `- Review again: ${preview}`
    ].join('\n'),
    weakCalculation: 'calculation mistake',
    weakConcept: 'concept misunderstanding',
    wrongAnalysis: (problem, userAnswer) => [
      'This is a demo analysis. It only shows the wrong-answer review flow without external AI calls.',
      `Problem focus: ${problem.slice(0, 80)}${problem.length > 80 ? '...' : ''}`,
      userAnswer ? `Your answer: ${userAnswer.slice(0, 80)}${userAnswer.length > 80 ? '...' : ''}` : 'No answer was entered, so the review focuses on the solving process.',
      'Before memorizing the correct answer, write one step explaining why you chose that answer.'
    ].join(' '),
    audioBriefing: {
      eyebrow: 'Browser voice demo',
      title: "Today's audio briefing",
      description: 'Summarizes the current AI learning screen and reads it with your accessibility voice setting.',
      play: 'Play briefing',
      stop: 'Stop',
      playing: 'Playing the audio briefing.',
      stopped: 'Audio briefing stopped.',
      notSupported: 'This browser does not support audio briefing playback.',
      notice: 'This is a mock/demo briefing without external AI or TTS API calls.',
      voiceLabel: (voice) => `Accessibility voice setting: ${voice}`,
      actionLabel: "Play or stop today's AI learning audio briefing",
      lines: ({ mockMode, chatCount, hasRecommendation, hasSummary, hasWrongAnalysis, hasReviewMock, hasImageInsight }) => [
        mockMode ? 'AI Mock mode is on, so the flow uses demo responses without external AI calls.' : 'The AI learning API flow is ready. Do not include sensitive information in prompts.',
        chatCount > 0 ? `${chatCount} recent AI chat item${chatCount === 1 ? '' : 's'} will be reflected in this briefing.` : 'There are no AI questions yet, so start with one small question.',
        hasRecommendation ? 'A personalized recommendation is ready for today’s review routine.' : 'Run a recommendation once to make today’s review direction clearer.',
        hasSummary ? 'A document summary is ready, so you can review the key ideas quickly.' : 'Use long-text summary to organize key ideas from your material.',
        hasWrongAnalysis ? 'Wrong-answer analysis is ready, so you can revisit the confusing step.' : 'Use wrong-answer analysis to find the weak step in your solution.',
        hasReviewMock || hasImageInsight ? 'Attachment demo results are shown only as guided mock results, not real analysis.' : 'Image and PDF attachments currently provide preview and mock guidance without server upload.'
      ]
    },
    errors: {
      token: 'Your login session may have expired. Log in again or use Mock mode to continue the demo flow.',
      quota: 'The AI request quota or rate limit may have been exceeded. Try again later or enable Mock mode.',
      provider: 'The AI provider or API key setting needs to be checked. You can safely demo this screen with Mock mode.',
      network: 'The network connection is unstable, so the AI response could not be loaded. Check the connection or switch to Mock mode.',
      fallback: 'Could not load the AI response. Check that no sensitive information is included, or use Mock mode for the demo flow.'
    },
    imageInsightQuestion: (name) => `[Image attachment demo] ${name}`,
    imageInsightAnswer: 'This first implementation does not run external AI Vision analysis. The attached image is shown only as a browser preview and is not uploaded to the server. Real OCR/PDF note and quiz generation will be reviewed later after file policy and cost checks.',
    imageInsightSuccess: 'Image attachment demo response added. This is a mock guide, not a real analysis result.',
    selectImageFirst: 'Attach an image first.',
    selectReviewFileFirst: 'Choose an image or PDF file first.',
    reviewResultSuccess: 'OCR/PDF demo results generated. No actual analysis or saving was performed.',
    mockQuestionSuccess: 'Mock mode response added. No external AI call was made.',
    mockRecommendationSuccess: 'Mock mode recommendation shown. No external AI call was made.',
    mockSummarySuccess: 'Mock mode summary shown. No external AI call was made.',
    mockWrongAnswerSuccess: 'Mock mode wrong-answer analysis shown. No external AI call was made.',
    mockModeOn: 'AI Mock mode is on. Demo responses will be shown without external AI calls.',
    mockModeOff: 'AI Mock mode is off. The existing AI learning API flow will be used.'
  },
  ja: {
    imageAttached: '画像ファイルを添付しました。現在はサーバーにアップロードしないプレビューです。',
    imageHelp: (size) => `PNG、JPG、WEBP、GIF画像を${size}以下で添付できます。`,
    pdfPreview: 'PDFは現在、検討用のMock結果としてのみプレビューされます。',
    reviewImageAttached: '検討用画像ファイルを添付しました。実際のOCRはまだ実行しません。',
    reviewHelp: (size) => `画像またはPDFを${size}以下で選択できます。`,
    pdfSource: 'PDF資料',
    imageSource: '画像資料',
    fallbackFile: '学習資料',
    noteTitle: (source) => `${source}デモノート`,
    reviewSummary: (fileName) => [
      `${fileName}で実際のOCRを行わず、学習資料を整理する流れだけを確認する例です。`,
      '重要な概念を2〜3文に圧縮し、復習用の質問も提案する方向を検討します。',
      '実際のノート・クイズ保存は、ファイル処理方針と費用を確認した後の後続範囲で決定します。'
    ],
    reviewQuizzes: [
      {
        question: 'この資料で最初に確認すべき重要概念は何ですか？',
        answer: '資料タイトル、単元名、繰り返し出てくるキーワードを先に探します。'
      },
      {
        question: '自動クイズ生成の前にユーザーが確認すべき点は何ですか？',
        answer: '個人情報が含まれていないか、デモ結果が実際の分析ではないことを確認します。'
      },
      {
        question: '後続実装で必要な技術検討項目は何ですか？',
        answer: 'OCR/PDF解析方式、ファイル保存方針、AI費用、StudyNote/Quiz保存範囲です。'
      }
    ],
    mockAnswer: (question) => [
      `デモ応答です。質問の要点は「${question.slice(0, 80)}${question.length > 80 ? '...' : ''}」として確認できます。`,
      'まず概念を一文で整理し、教材の例題を1つ解いてから、迷った部分だけをもう一度質問してみましょう。',
      'これは発表・デモ安定性のためのMock応答で、外部AI呼び出しではありません。'
    ].join(' '),
    recommendation: {
      recommendedSubject: '今日の復習ルーティン',
      tips: [
        '締切が近い予定を1つ先に確認しましょう。',
        '25分の集中セッションを始め、終わったら完了内容を記録しましょう。',
        '誤答ノートから同じタイプの問題を1問だけ解き直しましょう。'
      ]
    },
    summary: (preview) => [
      '- デモ要約です。本文から重要概念とつながり語を先に分けます。',
      '- 例や解法があれば、概念を適用する順序を別に示します。',
      `- もう一度見る部分: ${preview}`
    ].join('\n'),
    weakCalculation: '計算ミス',
    weakConcept: '概念理解のずれ',
    wrongAnalysis: (problem, userAnswer) => [
      'デモ分析です。外部AI呼び出しなしで誤答確認の流れだけを表示します。',
      `問題の要点: ${problem.slice(0, 80)}${problem.length > 80 ? '...' : ''}`,
      userAnswer ? `入力した答え: ${userAnswer.slice(0, 80)}${userAnswer.length > 80 ? '...' : ''}` : '入力した答えがないため、解き方の流れを中心に確認します。',
      '正解を覚える前に、なぜその選択をしたのかを一段階だけ書き直してみましょう。'
    ].join(' '),
    audioBriefing: {
      eyebrow: 'ブラウザ音声デモ',
      title: '今日のオーディオブリーフィング',
      description: '現在のAI学習画面の記録を短く整理し、アクセシビリティの音声設定で読み上げます。',
      play: 'ブリーフィングを聞く',
      stop: '停止',
      playing: 'オーディオブリーフィングを再生します。',
      stopped: 'オーディオブリーフィングを停止しました。',
      notSupported: '現在のブラウザはオーディオブリーフィングの読み上げに対応していません。',
      notice: '外部AI/TTS APIを呼び出さないmock/demoブリーフィングです。',
      voiceLabel: (voice) => `アクセシビリティ音声設定: ${voice}`,
      actionLabel: '今日のAI学習オーディオブリーフィングを再生または停止',
      lines: ({ mockMode, chatCount, hasRecommendation, hasSummary, hasWrongAnalysis, hasReviewMock, hasImageInsight }) => [
        mockMode ? 'AI Mockモードがオンのため、外部AI呼び出しなしでデモ応答を使っています。' : 'AI学習APIフローを使う準備ができています。機密情報は質問に含めないことが原則です。',
        chatCount > 0 ? `最近のAI会話${chatCount}件をこのブリーフィングに反映します。` : 'まだAI質問の記録がないため、小さな質問から始めるとよいです。',
        hasRecommendation ? 'パーソナル推薦があり、今日の復習ルーティンを確認できます。' : '推薦を一度実行すると、今日の復習方向が見えやすくなります。',
        hasSummary ? '文書要約が準備されているため、重要概念をすばやく見直せます。' : '長文要約を使うと、資料の重要概念を整理できます。',
        hasWrongAnalysis ? '誤答分析があり、迷った解き方をもう一度確認できます。' : '誤答原因分析を使うと、弱い解法ステップを確認できます。',
        hasReviewMock || hasImageInsight ? '添付ファイルのデモ結果は、実際の分析ではなく案内用のMock結果です。' : '画像やPDF添付は現在、サーバーアップロードなしのプレビューとMock案内のみ提供します。'
      ]
    },
    errors: {
      token: 'ログイン情報の有効期限が切れた可能性があります。再ログインするか、Mockモードでデモの流れを確認してください。',
      quota: 'AIリクエスト上限またはquotaを超えた可能性があります。しばらくしてから再試行するか、Mockモードをオンにしてください。',
      provider: 'AIプロバイダー設定またはAPI keyの状態確認が必要です。現在の画面はMockモードで安全にデモできます。',
      network: 'ネットワーク接続が不安定でAI応答を取得できませんでした。接続を確認するかMockモードに切り替えてください。',
      fallback: 'AI応答を読み込めませんでした。機密情報が含まれていないか確認し、必要ならMockモードでデモの流れを確認してください。'
    },
    imageInsightQuestion: (name) => `[画像添付デモ] ${name}`,
    imageInsightAnswer: '現在の一次実装では外部AI Vision分析を行いません。添付した画像はブラウザのプレビューとしてのみ表示され、サーバーにはアップロードされません。実際のOCR/PDF自動ノート・クイズ生成は、ファイル処理方針と費用を確認した後の後続Issueで検討します。',
    imageInsightSuccess: '画像添付デモ応答を追加しました。実際の分析結果ではなく、案内用のMock応答です。',
    selectImageFirst: '先に画像を添付してください。',
    selectReviewFileFirst: '先に画像またはPDFファイルを選択してください。',
    reviewResultSuccess: 'OCR/PDFデモ結果を生成しました。実際の分析や保存は行っていません。',
    mockQuestionSuccess: 'Mockモード応答を追加しました。外部AI呼び出しは行っていません。',
    mockRecommendationSuccess: 'Mockモード推薦を表示しました。外部AI呼び出しは行っていません。',
    mockSummarySuccess: 'Mockモード要約を表示しました。外部AI呼び出しは行っていません。',
    mockWrongAnswerSuccess: 'Mockモード誤答分析を表示しました。外部AI呼び出しは行っていません。',
    mockModeOn: 'AI Mockモードをオンにしました。外部AI呼び出しなしでデモ応答を表示します。',
    mockModeOff: 'AI Mockモードをオフにしました。既存のAI学習APIフローを使用します。'
  },
  zh: {
    imageAttached: '已附加图片文件。当前只是预览，不会上传到服务器。',
    imageHelp: (size) => `可以附加 ${size} 以下的 PNG、JPG、WEBP、GIF 图片。`,
    pdfPreview: 'PDF 当前仅以评估用模拟结果预览。',
    reviewImageAttached: '已附加评估用图片文件。当前不会执行真实 OCR。',
    reviewHelp: (size) => `可以选择 ${size} 以下的图片或 PDF。`,
    pdfSource: 'PDF 资料',
    imageSource: '图片资料',
    fallbackFile: '学习资料',
    noteTitle: (source) => `${source}演示笔记`,
    reviewSummary: (fileName) => [
      `这是不对 ${fileName} 执行真实 OCR、仅确认学习资料整理流程的示例。`,
      '演示会把核心概念压缩成 2 到 3 句话，并一起提出复习问题。',
      '真实笔记/测验保存将在评估文件处理政策和成本后作为后续范围决定。'
    ],
    reviewQuizzes: [
      {
        question: '这份资料中应先确认的核心概念是什么？',
        answer: '先查看资料标题、单元名和反复出现的关键词。'
      },
      {
        question: '自动生成测验前，用户需要确认什么？',
        answer: '确认不包含个人信息，并区分演示结果不是真实分析。'
      },
      {
        question: '后续实现需要评估哪些技术项目？',
        answer: 'OCR/PDF 解析方式、文件保存政策、AI 成本以及 StudyNote/Quiz 保存范围。'
      }
    ],
    mockAnswer: (question) => [
      `这是演示回复。问题重点可理解为“${question.slice(0, 80)}${question.length > 80 ? '...' : ''}”。`,
      '先用一句话整理概念，再做一道教材例题，最后只针对不清楚的部分继续提问。',
      '这是为了演示稳定性准备的模拟回复，并不是外部 AI 调用。'
    ].join(' '),
    recommendation: {
      recommendedSubject: '今日复习节奏',
      tips: [
        '先确认一个临近截止的日程。',
        '开始 25 分钟专注，结束后记录完成内容。',
        '从错题笔记中只重做一道相同类型的问题。'
      ]
    },
    summary: (preview) => [
      '- 这是演示摘要。先从正文中分离核心概念和连接词。',
      '- 如果有示例或解题过程，会另外标出概念应用顺序。',
      `- 需要再看的部分：${preview}`
    ].join('\n'),
    weakCalculation: '计算失误',
    weakConcept: '概念理解偏差',
    wrongAnalysis: (problem, userAnswer) => [
      '这是演示分析。不会调用外部 AI，只用于确认错题检查流程。',
      `题目重点：${problem.slice(0, 80)}${problem.length > 80 ? '...' : ''}`,
      userAnswer ? `填写的答案：${userAnswer.slice(0, 80)}${userAnswer.length > 80 ? '...' : ''}` : '没有填写答案，因此会以解题过程为中心检查。',
      '不要急着背正确答案，先写下一步你为什么会这样选择。'
    ].join(' '),
    audioBriefing: {
      eyebrow: '浏览器语音演示',
      title: '今日音频简报',
      description: '把当前 AI 学习页面的记录简短整理，并用无障碍语音设置朗读。',
      play: '播放简报',
      stop: '停止',
      playing: '正在播放音频简报。',
      stopped: '已停止音频简报。',
      notSupported: '当前浏览器不支持音频简报朗读。',
      notice: '这是不调用外部 AI/TTS API 的 mock/demo 简报。',
      voiceLabel: (voice) => `无障碍语音设置：${voice}`,
      actionLabel: '播放或停止今日 AI 学习音频简报',
      lines: ({ mockMode, chatCount, hasRecommendation, hasSummary, hasWrongAnalysis, hasReviewMock, hasImageInsight }) => [
        mockMode ? 'AI Mock 模式已开启，因此会使用演示回复，不调用外部 AI。' : 'AI 学习 API 流程已准备就绪。请不要在问题中包含敏感信息。',
        chatCount > 0 ? `最近 ${chatCount} 条 AI 对话会反映在这份简报中。` : '目前还没有 AI 提问记录，可以先从一个小问题开始。',
        hasRecommendation ? '已有个性化推荐，可以直接确认今日复习节奏。' : '执行一次推荐后，今日复习方向会更清楚。',
        hasSummary ? '已有文档摘要，可以快速回顾核心概念。' : '使用长文摘要可以快速整理资料中的核心概念。',
        hasWrongAnalysis ? '已有错题分析，可以回顾卡住的解题步骤。' : '使用错题原因分析可以确认薄弱的解题步骤。',
        hasReviewMock || hasImageInsight ? '附件演示结果只是说明用 mock 结果，不是真实分析。' : '图片和 PDF 附件当前只提供预览和 mock 说明，不会上传到服务器。'
      ]
    },
    errors: {
      token: '登录信息可能已过期。请重新登录，或使用 Mock 模式继续演示流程。',
      quota: '可能已超过 AI 请求额度或频率限制。请稍后重试，或开启 Mock 模式继续演示。',
      provider: '需要检查 AI 服务提供方设置或 API key 状态。当前页面可使用 Mock 模式安全演示。',
      network: '网络连接不稳定，无法获取 AI 回复。请检查连接或切换到 Mock 模式。',
      fallback: '无法加载 AI 回复。请确认未包含敏感信息，必要时使用 Mock 模式查看演示流程。'
    },
    imageInsightQuestion: (name) => `[图片附加演示] ${name}`,
    imageInsightAnswer: '当前一次实现不会执行外部 AI Vision 分析。附加的图片只作为浏览器预览显示，不会上传到服务器。真实 OCR/PDF 自动笔记与测验生成会在后续 Issue 中结合文件处理政策和成本再评估。',
    imageInsightSuccess: '已添加图片附加演示回复。这是说明用模拟回复，不是真实分析结果。',
    selectImageFirst: '请先附加图片。',
    selectReviewFileFirst: '请先选择图片或 PDF 文件。',
    reviewResultSuccess: '已生成 OCR/PDF 演示结果。未执行真实分析或保存。',
    mockQuestionSuccess: '已添加 Mock 模式回复。未调用外部 AI。',
    mockRecommendationSuccess: '已显示 Mock 模式推荐。未调用外部 AI。',
    mockSummarySuccess: '已显示 Mock 模式摘要。未调用外部 AI。',
    mockWrongAnswerSuccess: '已显示 Mock 模式错题分析。未调用外部 AI。',
    mockModeOn: '已开启 AI Mock 模式。将不调用外部 AI，而显示演示回复。',
    mockModeOff: '已关闭 AI Mock 模式。将使用现有 AI 学习 API 流程。'
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
    mockBadge: 'Mock 응답',
    truncateBadge: '자동 요약됨',
    composerTitle: '메시지 입력',
    composerPlaceholder: '공부하다가 모르는 개념이나 공식, 질문 사항을 입력하세요.',
    send: '전송',
    charCount: (current, max) => `${current} / ${max}자`,
    imageToolsTitle: '첨부·검토 도구',
    imageToolsDescription: '이미지/OCR/PDF 흐름은 실제 외부 AI 호출 없이 mock/demo로만 확인합니다.'
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
    mockBadge: 'Mock response',
    truncateBadge: 'Auto summarized',
    composerTitle: 'Message input',
    composerPlaceholder: 'Enter a concept, formula, or question you are studying.',
    send: 'Send',
    charCount: (current, max) => `${current} / ${max} chars`,
    imageToolsTitle: 'Attachment and review tools',
    imageToolsDescription: 'Image, OCR, and PDF flows are checked only with mock/demo results without external AI calls.'
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
    mockBadge: 'Mock応答',
    truncateBadge: '自動要約',
    composerTitle: 'メッセージ入力',
    composerPlaceholder: '学習中に分からない概念、公式、質問を入力してください。',
    send: '送信',
    charCount: (current, max) => `${current} / ${max}字`,
    imageToolsTitle: '添付・確認ツール',
    imageToolsDescription: '画像/OCR/PDFの流れは外部AI呼び出しなしのmock/demoとして確認します。'
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
    mockBadge: 'Mock 回复',
    truncateBadge: '自动摘要',
    composerTitle: '消息输入',
    composerPlaceholder: '输入学习中不清楚的概念、公式或问题。',
    send: '发送',
    charCount: (current, max) => `${current} / ${max} 字`,
    imageToolsTitle: '附件与检查工具',
    imageToolsDescription: '图片、OCR、PDF 流程仅以 mock/demo 结果确认，不调用外部 AI。'
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

  if (status === 429 || code.includes('too_many') || message.includes('quota') || message.includes('rate limit') || message.includes('too many')) {
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
  const [reviewMockResult, setReviewMockResult] = useState(null);
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

    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      setImageUploadError('PNG, JPG, WEBP, GIF 형식의 이미지 파일만 첨부할 수 있습니다.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setImageUploadError(`이미지는 최대 ${formatFileSize(MAX_IMAGE_SIZE_BYTES)} 이하로 첨부해 주세요.`);
      return;
    }

    if (!globalThis.URL?.createObjectURL) {
      setImageUploadError('현재 브라우저에서는 이미지 미리보기를 만들 수 없습니다.');
      return;
    }

    if (previewUrlRef.current && globalThis.URL?.revokeObjectURL) {
      globalThis.URL.revokeObjectURL(previewUrlRef.current);
    }

    const previewUrl = globalThis.URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;

    setImageAttachment({
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl
    });
    setSuccessMsg('이미지를 첨부했습니다. 현재 이미지는 서버로 업로드되지 않는 1차 검토용 미리보기입니다.');
  }

  function openImagePicker() {
    if (!globalThis.document?.createElement) {
      setImageUploadError('현재 환경에서는 브라우저 이미지 첨부 기능을 사용할 수 없습니다.');
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
    setReviewMockResult(null);
    setReviewUploadError('');

    if (showMessage) {
      setSuccessMsg('OCR/PDF 검토용 첨부 파일을 제거했습니다.');
    }
  }

  function attachReviewFile(file) {
    if (!file) {
      return;
    }

    resetFeedback();
    setReviewMockResult(null);

    if (!isSupportedReviewFile(file)) {
      setReviewUploadError('이미지 또는 PDF 파일만 1차 검토용으로 선택할 수 있습니다.');
      return;
    }

    if (file.size > MAX_REVIEW_FILE_SIZE_BYTES) {
      setReviewUploadError(`검토용 파일은 최대 ${formatFileSize(MAX_REVIEW_FILE_SIZE_BYTES)} 이하로 선택해 주세요.`);
      return;
    }

    let previewUrl = null;
    if (isImageFile(file)) {
      if (!globalThis.URL?.createObjectURL) {
        setReviewUploadError('현재 브라우저에서는 이미지 미리보기를 만들 수 없습니다.');
        return;
      }

      previewUrl = globalThis.URL.createObjectURL(file);
    }

    if (reviewPreviewUrlRef.current && globalThis.URL?.revokeObjectURL) {
      globalThis.URL.revokeObjectURL(reviewPreviewUrlRef.current);
    }

    reviewPreviewUrlRef.current = previewUrl;
    setReviewAttachment({
      name: file.name,
      size: file.size,
      type: file.type || (isPdfFile(file) ? 'application/pdf' : 'unknown'),
      previewUrl,
      isPdf: isPdfFile(file)
    });
    setSuccessMsg('OCR/PDF 검토용 파일을 선택했습니다. 현재는 서버 업로드 없이 mock 결과만 확인합니다.');
  }

  function openReviewFilePicker() {
    if (!globalThis.document?.createElement) {
      setReviewUploadError('현재 환경에서는 브라우저 파일 선택 기능을 사용할 수 없습니다.');
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

  function showMockReviewResult() {
    if (!reviewAttachment) {
      setReviewUploadError(getAILocalizedCopy(currentLanguage).selectReviewFileFirst);
      return;
    }

    resetFeedback();
    setReviewMockResult(createMockReviewResult(reviewAttachment, currentLanguage));
    setSuccessMsg(getAILocalizedCopy(currentLanguage).reviewResultSuccess);
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

  async function showMockImageInsight() {
    if (!imageAttachment) {
      setImageUploadError(getAILocalizedCopy(currentLanguage).selectImageFirst);
      return;
    }

    const copy = getAILocalizedCopy(currentLanguage);

    resetFeedback();

    try {
      await addQnaEntry({
        question: copy.imageInsightQuestion(imageAttachment.name),
        answer: copy.imageInsightAnswer,
        isTruncated: false,
        isImageInsight: true,
        isMock: true
      });
      setSuccessMsg(copy.imageInsightSuccess);
    } catch (error) {
      setErrorMsg('AI 대화방에 이미지 안내를 저장하지 못했습니다.');
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
        isMock: false
      });
      setSuccessMsg('맞춤 학습 분석 및 추천 팁이 업데이트되었습니다.');
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
        isMock: false
      });
      setSuccessMsg('문서 3줄 요약이 완료되었습니다.');
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
        isMock: false
      });
      setSuccessMsg('오답 원인 분석이 성공적으로 완료되었습니다.');
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
                  {room.isPinned ? <Text style={styles.chatRoomPinMark}>◆</Text> : null}
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
                <Text style={[styles.chatRoomIconText, room.isPinned && styles.chatRoomIconTextActive]}>
                  {room.isPinned ? '◆' : '◇'}
                </Text>
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
    hasReviewMock: Boolean(reviewMockResult),
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
          <Text style={styles.mockModeLabel}>AI Mock 모드</Text>
          <Text style={styles.mockModeText}>
            발표나 데모 중 AI token 만료, quota 초과, API key 누락이 발생하면 실제 외부 호출 없이 안전한 예시 응답으로 흐름을 확인합니다.
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
            {isMockMode ? 'Mock 사용 중' : 'Mock 켜기'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.audioBriefingCard}>
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
          <Text style={styles.transparencyLabel}>이미지 첨부 안내</Text>
          <Text style={styles.transparencyText}>
            현재 이미지 첨부는 데모/검토용 미리보기이며, 외부 AI Vision 분석이나 서버 업로드는 수행하지 않습니다.
          </Text>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabsRow}>
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
      <View style={styles.panelBody}>
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
                      <Text style={[
                        styles.chatMainActionText,
                        activeChatRoom.isPinned && styles.chatMainActionTextActive
                      ]}>
                        {activeChatRoom.isPinned ? `◆ ${chatCopy.unpinRoom}` : `◇ ${chatCopy.pinRoom}`}
                      </Text>
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
                      <Text style={styles.imagePanelTitle}>이미지 첨부 1차 검토</Text>
                      <Text style={styles.imagePanelText}>
                        PNG, JPG, WEBP, GIF 파일을 최대 {formatFileSize(MAX_IMAGE_SIZE_BYTES)}까지 미리보기로 첨부할 수 있습니다.
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      onPress={openImagePicker}
                      style={(state) => [styles.imageAttachButton, ...interactiveStateStyles(state)]}
                    >
                      <Text style={styles.imageAttachButtonText}>이미지 선택</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.privacyNotice}>
                    민감정보가 포함된 사진은 첨부하지 마세요. 현재 이미지는 서버에 저장되지 않고 실제 AI Vision 분석도 수행하지 않습니다.
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
                          이 첨부는 mock/demo 흐름 확인용입니다. 질문 제출 시 이미지 파일은 AI API로 전송되지 않습니다.
                        </Text>
                        <View style={styles.imageActionRow}>
                          <Pressable
                            accessibilityRole="button"
                            onPress={showMockImageInsight}
                            style={(state) => [styles.imageMockButton, ...interactiveStateStyles(state)]}
                          >
                            <Text style={styles.imageMockButtonText}>데모 분석 안내 보기</Text>
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            onPress={clearImageAttachment}
                            style={(state) => [styles.imageRemoveButton, ...interactiveStateStyles(state)]}
                          >
                            <Text style={styles.imageRemoveButtonText}>첨부 제거</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  ) : null}
                </View>

                <View style={styles.reviewPanel}>
                  <View style={styles.imagePanelHeader}>
                    <View style={styles.imagePanelCopy}>
                      <Text style={styles.imagePanelTitle}>OCR/PDF 노트·퀴즈 생성 검토</Text>
                      <Text style={styles.imagePanelText}>
                        이미지 또는 PDF를 선택해 자동 노트와 퀴즈 생성 흐름을 mock/demo로 확인합니다. 실제 OCR, PDF 파싱, 외부 AI 호출, 서버 업로드는 아직 수행하지 않습니다.
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="OCR PDF 검토 파일 선택"
                      onPress={openReviewFilePicker}
                      style={(state) => [styles.imageAttachButton, ...interactiveStateStyles(state)]}
                    >
                      <Text style={styles.imageAttachButtonText}>파일 선택</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.privacyNotice}>
                    민감정보가 포함된 학습 자료는 첨부하지 마세요. 이번 1차 UI는 Issue #160 검토용이며, 실제 StudyNote/Quiz 저장은 후속 구현 범위입니다.
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
                          파일은 브라우저에서만 선택되며 서버에 업로드되지 않습니다. 아래 버튼은 실제 OCR 결과가 아닌 데모 예시를 보여줍니다.
                        </Text>
                        <View style={styles.imageActionRow}>
                          <Pressable
                            accessibilityRole="button"
                            onPress={showMockReviewResult}
                            style={(state) => [styles.imageMockButton, ...interactiveStateStyles(state)]}
                          >
                            <Text style={styles.imageMockButtonText}>데모 노트·퀴즈 보기</Text>
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            onPress={clearReviewAttachment}
                            style={(state) => [styles.imageRemoveButton, ...interactiveStateStyles(state)]}
                          >
                            <Text style={styles.imageRemoveButtonText}>첨부 제거</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  ) : null}

                  {reviewMockResult ? (
                    <View style={styles.reviewResultCard}>
                      <View style={styles.resultHeaderRow}>
                        <Text style={styles.summaryCardTitle}>{reviewMockResult.noteTitle}</Text>
                        <Text style={styles.mockBadge}>Mock 결과</Text>
                      </View>
                      <View style={styles.reviewResultSection}>
                        <Text style={styles.reviewResultSubtitle}>예시 노트 요약</Text>
                        {reviewMockResult.summary.map((line, index) => (
                          <Text key={index} style={styles.reviewBullet}>• {line}</Text>
                        ))}
                      </View>
                      <View style={styles.reviewResultSection}>
                        <Text style={styles.reviewResultSubtitle}>예시 퀴즈</Text>
                        {reviewMockResult.quizzes.map((quiz, index) => (
                          <View key={index} style={styles.quizCard}>
                            <Text style={styles.quizQuestion}>Q{index + 1}. {quiz.question}</Text>
                            <Text style={styles.quizAnswer}>A. {quiz.answer}</Text>
                          </View>
                        ))}
                      </View>
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
                  {recommendationResult.isMock && <Text style={styles.mockBadge}>Mock 추천</Text>}
                </View>
                <View style={styles.subjectBox}>
                  <Text style={styles.subjectText}>{recommendationResult.recommendedSubject}</Text>
                </View>

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
                    {summaryResult.isMock && <Text style={styles.mockBadge}>Mock 요약</Text>}
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
                    {wrongAnalysisResult.isMock && <Text style={styles.mockBadge}>Mock 분석</Text>}
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
    color: colors.blueDeep,
    fontSize: 10,
    fontWeight: '900'
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
