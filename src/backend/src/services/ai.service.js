const {
  createAIChatMessage,
  createAIChatRoom,
  createAIQuestion,
  createAIRecommendation,
  createWrongAnswerNote,
  deleteAIChatRoom,
  findAIChatRoomByIdAndUserId,
  findAIChatRoomsByUserId,
  findStudyNoteByIdAndUserId,
  updateAIChatRoom
} = require('../repositories/ai.repository');
const { findSchedulesByUserId } = require('../repositories/schedule.repository');
const { findTasksByUserId } = require('../repositories/task.repository');
const { AppError, notFoundError, validationError } = require('../utils/errors');
const { normalizeString, parsePositiveInteger } = require('../utils/validators');

const DEFAULT_MODEL = 'gemini-2.5-flash';
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const MAX_QUESTION_LENGTH = 1000;
const MAX_WRONG_ANSWER_LENGTH = 1000;
const MAX_SUMMARY_LENGTH = 3000;
const MAX_CHAT_TITLE_LENGTH = 60;
const MAX_CHAT_ANSWER_LENGTH = 4000;
const AI_CHAT_MESSAGE_SOURCES = new Set(['AI_QNA', 'MOCK_QNA', 'IMAGE_INSIGHT']);

const rateLimitMap = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = rateLimitMap.get(userId) || [];
  const recentTimestamps = timestamps.filter((timestamp) => timestamp > windowStart);

  if (recentTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    throw new AppError(
      'AI request rate limit exceeded. Try again later.',
      429,
      'TOO_MANY_REQUESTS'
    );
  }

  recentTimestamps.push(now);
  rateLimitMap.set(userId, recentTimestamps);
}

function buildLengthError(field, currentLength, maxLength) {
  return validationError(`${field} must be at most ${maxLength} characters`, {
    field,
    currentLength,
    maxLength
  });
}

function normalizeLimitedText(payload, field, maxLength) {
  const value = normalizeString(payload[field]);

  if (!value) {
    throw validationError(`${field} is required`);
  }

  if (value.length <= maxLength) {
    return {
      value,
      originalLength: value.length,
      isTruncated: false
    };
  }

  if (payload.allowTruncate === true) {
    return {
      value: value.substring(0, maxLength),
      originalLength: value.length,
      isTruncated: true
    };
  }

  throw buildLengthError(field, value.length, maxLength);
}

async function resolveOwnedNoteId(userId, rawNoteId) {
  if (rawNoteId === undefined || rawNoteId === null || rawNoteId === '') {
    return null;
  }

  const noteId = parsePositiveInteger(rawNoteId, 'noteId');
  const note = await findStudyNoteByIdAndUserId(noteId, userId);

  if (!note) {
    throw notFoundError('Study note not found');
  }

  return noteId;
}

function getFallbackQuestionAnswer(question) {
  return [
    `Fallback answer for: ${question}`,
    'Review the core concept first, then solve one small example.',
    'If the topic is still unclear, summarize the confusing point and ask again.'
  ].join(' ');
}

function getFallbackRecommendation(schedules = [], tasks = []) {
  const firstSubject = schedules.find((schedule) => schedule.subject)?.subject;
  const pendingTask = tasks.find((task) => task.status !== 'DONE');

  return {
    tips: [
      'Review one high-priority topic before starting new material.',
      pendingTask
        ? `Start with the pending task: ${pendingTask.title}.`
        : 'Create one concrete task for the next study block.',
      'Use a short focus session and record what was completed.'
    ],
    recommendedSubject: firstSubject || 'General study review'
  };
}

function getFallbackSummary(content) {
  const preview = content.length > 120 ? `${content.substring(0, 120)}...` : content;

  return [
    '- Identify the main concept and related terms.',
    '- Connect the concept with one practical example.',
    `- Recheck unclear parts from this content: ${preview}`
  ].join('\n');
}

function getFallbackWrongAnswerAnalysis(problem, userAnswer) {
  const weakType = /[+\-*/=]/.test(problem) ? 'calculation mistake' : 'concept misunderstanding';

  return {
    weakType,
    explanation: [
      `Fallback analysis for problem: ${problem}`,
      userAnswer ? `Submitted answer: ${userAnswer}` : 'No submitted answer was provided.',
      'Compare the expected concept with each solution step and retry with a shorter example.'
    ].join(' ')
  };
}

function getGeminiModel() {
  return process.env.AI_MODEL_NAME || DEFAULT_MODEL;
}

function logProviderFallback(action, statusCode = undefined) {
  const statusText = statusCode ? ` status=${statusCode}` : '';
  console.warn(`[AI Service] Provider unavailable for ${action}; fallback response used.${statusText}`);
}

async function callGeminiAPI(prompt, isJson = false) {
  const apiKey = process.env.AI_API_KEY;

  if (!apiKey) {
    throw new AppError('AI provider is not configured', 503, 'AI_PROVIDER_UNAVAILABLE');
  }

  const model = encodeURIComponent(getGeminiModel());
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.5,
        responseMimeType: isJson ? 'application/json' : 'text/plain',
        thinkingConfig: { thinkingBudget: 0 }
      }
    })
  });

  if (!response.ok) {
    const error = new AppError('AI provider returned an error', 503, 'AI_PROVIDER_UNAVAILABLE');
    error.providerStatusCode = response.status;
    throw error;
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new AppError('AI provider returned an invalid response', 503, 'AI_PROVIDER_UNAVAILABLE');
  }

  return text;
}

async function useProviderOrFallback(action, providerCall, fallbackFactory) {
  try {
    return await providerCall();
  } catch (error) {
    logProviderFallback(action, error.providerStatusCode);
    return fallbackFactory();
  }
}

function parseJsonObject(rawText) {
  let cleanText = rawText.trim();

  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
  }

  return JSON.parse(cleanText);
}

function assertObjectPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw validationError('Payload must be an object');
  }
}

function createRoomTitle(question) {
  const cleanQuestion = String(question || '').replace(/\s+/g, ' ').trim();

  if (!cleanQuestion) {
    return 'AI 대화';
  }

  return cleanQuestion.length > 22 ? `${cleanQuestion.slice(0, 22)}...` : cleanQuestion;
}

function sanitizeAIChatMessage(message) {
  return {
    id: message.id,
    roomId: message.roomId,
    question: message.question,
    answer: message.answer,
    isMock: message.isMock,
    isTruncated: message.isTruncated,
    source: message.source,
    createdAt: message.createdAt
  };
}

function sanitizeAIChatRoom(room) {
  return {
    id: room.id,
    title: room.title || 'AI 대화',
    isPinned: Boolean(room.isPinned),
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    messages: (room.messages || []).map(sanitizeAIChatMessage)
  };
}

function normalizeOptionalTitle(payload = {}) {
  const title = normalizeString(payload.title);

  if (!title) {
    return undefined;
  }

  if (title.length > MAX_CHAT_TITLE_LENGTH) {
    throw buildLengthError('title', title.length, MAX_CHAT_TITLE_LENGTH);
  }

  return title;
}

function normalizeRequiredChatTitle(payload = {}) {
  const title = normalizeString(payload.title);

  if (!title) {
    throw validationError('title is required');
  }

  if (title.length > MAX_CHAT_TITLE_LENGTH) {
    throw buildLengthError('title', title.length, MAX_CHAT_TITLE_LENGTH);
  }

  return title;
}

function buildAIChatRoomUpdateData(payload = {}) {
  assertObjectPayload(payload);

  const data = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'title')) {
    data.title = normalizeRequiredChatTitle(payload);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'isPinned')) {
    if (typeof payload.isPinned !== 'boolean') {
      throw validationError('isPinned must be a boolean');
    }

    data.isPinned = payload.isPinned;
  }

  if (Object.keys(data).length === 0) {
    throw validationError('At least one AI chat room field must be provided');
  }

  return data;
}

async function listAIChatRooms(userId) {
  const rooms = await findAIChatRoomsByUserId(userId);
  return rooms.map(sanitizeAIChatRoom);
}

async function createUserAIChatRoom(userId, payload = {}) {
  assertObjectPayload(payload);

  const title = normalizeOptionalTitle(payload);
  const room = await createAIChatRoom(userId, title ? { title } : {});

  return sanitizeAIChatRoom(room);
}

async function assertOwnedAIChatRoom(userId, rawRoomId) {
  const roomId = parsePositiveInteger(rawRoomId, 'roomId');
  const room = await findAIChatRoomByIdAndUserId(roomId, userId);

  if (!room) {
    throw notFoundError('AI chat room not found');
  }

  return room;
}

function buildAIChatMessageData(room, payload = {}) {
  assertObjectPayload(payload);

  const questionText = normalizeLimitedText(payload, 'question', MAX_QUESTION_LENGTH);
  const answerText = normalizeLimitedText(payload, 'answer', MAX_CHAT_ANSWER_LENGTH);
  const rawSource = normalizeString(payload.source) || (payload.isMock ? 'MOCK_QNA' : 'AI_QNA');
  const source = AI_CHAT_MESSAGE_SOURCES.has(rawSource) ? rawSource : 'AI_QNA';
  const shouldRetitleRoom = !room.messages || room.messages.length === 0 || room.title === 'AI 대화';

  return {
    question: questionText.value,
    answer: answerText.value,
    isMock: payload.isMock === true,
    isTruncated: payload.isTruncated === true || questionText.isTruncated || answerText.isTruncated,
    source,
    roomTitle: shouldRetitleRoom ? createRoomTitle(questionText.value) : undefined
  };
}

async function addAIChatRoomMessage(userId, rawRoomId, payload = {}) {
  const room = await assertOwnedAIChatRoom(userId, rawRoomId);
  const data = buildAIChatMessageData(room, payload);
  const result = await createAIChatMessage(userId, room.id, data);

  return {
    message: sanitizeAIChatMessage(result.message),
    chatRoom: sanitizeAIChatRoom(result.room)
  };
}

async function updateUserAIChatRoom(userId, rawRoomId, payload = {}) {
  const room = await assertOwnedAIChatRoom(userId, rawRoomId);
  const data = buildAIChatRoomUpdateData(payload);
  const updatedRoom = await updateAIChatRoom(room.id, data);

  return sanitizeAIChatRoom(updatedRoom);
}

async function deleteUserAIChatRoom(userId, rawRoomId) {
  const room = await assertOwnedAIChatRoom(userId, rawRoomId);
  await deleteAIChatRoom(room.id);

  return {
    id: room.id,
    deleted: true
  };
}

async function askAIQuestion(userId, payload) {
  assertObjectPayload(payload);

  const questionText = normalizeLimitedText(payload, 'question', MAX_QUESTION_LENGTH);
  const noteId = await resolveOwnedNoteId(userId, payload.noteId);
  checkRateLimit(userId);

  const answer = await useProviderOrFallback(
    'question',
    () => callGeminiAPI(
      `[중요] 반드시 한국어로만 답변하시오. 영어 사용 금지. Answer the following study question in 3~4 sentences. You MUST write the entire answer in Korean only. Do NOT use English: ${questionText.value}`
    ),
    () => getFallbackQuestionAnswer(questionText.value)
  );

  const record = await createAIQuestion(userId, {
    question: questionText.value,
    answer,
    noteId
  });

  return {
    ...record,
    isTruncated: questionText.isTruncated,
    originalLength: questionText.originalLength,
    maxLength: MAX_QUESTION_LENGTH
  };
}

async function generateAIRecommendation(userId) {
  checkRateLimit(userId);

  const schedules = await findSchedulesByUserId(userId);
  const tasks = await findTasksByUserId(userId);

  const basisJson = {
    scheduleCount: schedules.length,
    taskCount: tasks.length,
    recentSchedules: schedules.slice(0, 3).map((schedule) => ({
      title: schedule.title,
      subject: schedule.subject
    })),
    recentTasks: tasks.slice(0, 5).map((task) => ({
      title: task.title,
      status: task.status
    }))
  };

  const scheduleInfo = schedules
    .slice(0, 5)
    .map((schedule) => `Title: ${schedule.title}, Subject: ${schedule.subject || 'None'}`)
    .join('; ');
  const taskInfo = tasks
    .slice(0, 10)
    .map((task) => `Title: ${task.title}, Status: ${task.status}`)
    .join('; ');

  const recommendationJson = await useProviderOrFallback(
    'recommendation',
    async () => {
      const rawText = await callGeminiAPI(
        `[중요] 모든 값은 반드시 한국어로만 작성하시오. 영어 사용 절대 금지. Analyze schedules [${scheduleInfo}] and tasks [${taskInfo}]. Return a JSON object with exactly these keys: "tips" (array of 3 strings) and "recommendedSubject" (a single string). Every single character in the values MUST be written in Korean only. Do NOT use English in any value.`,
        true
      );
      return parseJsonObject(rawText);
    },
    () => getFallbackRecommendation(schedules, tasks)
  );

  return createAIRecommendation(userId, {
    basisJson,
    recommendationJson
  });
}

async function summarizeText(userId, payload) {
  assertObjectPayload(payload);

  const contentText = normalizeLimitedText(payload, 'content', MAX_SUMMARY_LENGTH);
  checkRateLimit(userId);

  const summary = await useProviderOrFallback(
    'summary',
    () => callGeminiAPI(
      `[중요] 반드시 한국어로만 작성하시오. 영어 사용 금지. Summarize the following study content into exactly 3 concise bullet points. Every single word MUST be in Korean only. Do NOT use English. Content: ${contentText.value}`
    ),
    () => getFallbackSummary(contentText.value)
  );

  return {
    summary,
    isTruncated: contentText.isTruncated,
    originalLength: contentText.originalLength,
    maxLength: MAX_SUMMARY_LENGTH
  };
}

async function analyzeWrongAnswer(userId, payload) {
  assertObjectPayload(payload);

  const problemText = normalizeLimitedText(payload, 'problem', MAX_WRONG_ANSWER_LENGTH);
  const rawUserAnswer = normalizeString(payload.userAnswer) || null;
  let userAnswer = rawUserAnswer;
  let isUserAnswerTruncated = false;

  if (userAnswer && userAnswer.length > MAX_WRONG_ANSWER_LENGTH) {
    if (payload.allowTruncate === true) {
      userAnswer = userAnswer.substring(0, MAX_WRONG_ANSWER_LENGTH);
      isUserAnswerTruncated = true;
    } else {
      throw buildLengthError('userAnswer', rawUserAnswer.length, MAX_WRONG_ANSWER_LENGTH);
    }
  }

  const noteId = await resolveOwnedNoteId(userId, payload.noteId);
  checkRateLimit(userId);

  const analysis = await useProviderOrFallback(
    'wrong-answer',
    async () => {
      const rawText = await callGeminiAPI(
        [
          '[중요] 반드시 한국어로만 작성하시오. 영어 사용 절대 금지.',
          'Analyze this wrong answer and return JSON.',
          'Schema: {"explanation":"string","weakType":"string"}',
          'Every single character in explanation and weakType MUST be written in Korean only. Do NOT use English at all.',
          `Problem: ${problemText.value}`,
          `User answer: ${userAnswer || 'None'}`
        ].join('\n'),
        true
      );
      return parseJsonObject(rawText);
    },
    () => getFallbackWrongAnswerAnalysis(problemText.value, userAnswer)
  );

  const record = await createWrongAnswerNote(userId, {
    problem: problemText.value,
    userAnswer,
    explanation: analysis.explanation,
    weakType: analysis.weakType,
    noteId
  });

  return {
    ...record,
    isProblemTruncated: problemText.isTruncated,
    isUserAnswerTruncated,
    originalProblemLength: problemText.originalLength,
    originalUserAnswerLength: rawUserAnswer ? rawUserAnswer.length : 0,
    maxLength: MAX_WRONG_ANSWER_LENGTH
  };
}

module.exports = {
  askAIQuestion,
  generateAIRecommendation,
  summarizeText,
  analyzeWrongAnswer,
  checkRateLimit,
  createUserAIChatRoom,
  addAIChatRoomMessage,
  deleteUserAIChatRoom,
  listAIChatRooms,
  updateUserAIChatRoom,
  rateLimitMap
};
