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
const MAX_ATTACHMENT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_ATTACHMENT_PDF_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_ATTACHMENT_TEXT_LENGTH = 3000;
const MIN_ATTACHMENT_TEXT_LENGTH = 20;
const IMAGE_ATTACHMENT_TYPES = new Map([
  ['image/png', ['png']],
  ['image/jpeg', ['jpg', 'jpeg']],
  ['image/webp', ['webp']],
  ['image/gif', ['gif']]
]);
const STUDY_MATERIAL_TYPES = new Map([
  ...IMAGE_ATTACHMENT_TYPES,
  ['application/pdf', ['pdf']]
]);
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

function sanitizeFileName(name = 'attachment') {
  return String(name || 'attachment')
    .replace(/[\\/\r\n\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 120) || 'attachment';
}

function getFileExtension(name = '') {
  const match = String(name).toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : '';
}

function getAllowedExtensions(mimeType, allowedTypes) {
  return allowedTypes.get(String(mimeType || '').toLowerCase()) || [];
}

function buildAttachmentFileSummary(file) {
  return {
    name: sanitizeFileName(file.originalname),
    type: file.mimetype || 'application/octet-stream',
    size: file.size
  };
}

function validateAttachmentFile(file, { allowedTypes, maxSizeBytes }) {
  if (!file || !Buffer.isBuffer(file.buffer)) {
    throw validationError('Attachment file is required', { field: 'file' });
  }

  if (file.size > maxSizeBytes) {
    throw validationError('Uploaded file exceeds the allowed size', {
      field: 'file',
      maxSizeBytes
    });
  }

  const mimeType = String(file.mimetype || '').toLowerCase();
  const extension = getFileExtension(file.originalname);
  const allowedExtensions = getAllowedExtensions(mimeType, allowedTypes);

  if (!allowedExtensions.length || !allowedExtensions.includes(extension)) {
    throw validationError('Unsupported attachment file type', {
      field: 'file',
      allowedTypes: Array.from(allowedTypes.keys())
    });
  }

  return {
    file: buildAttachmentFileSummary(file),
    mimeType,
    extension,
    isImage: IMAGE_ATTACHMENT_TYPES.has(mimeType),
    isPdf: mimeType === 'application/pdf'
  };
}

function parsePngMetadata(buffer) {
  const signature = '89504e470d0a1a0a';
  if (buffer.length < 24 || buffer.subarray(0, 8).toString('hex') !== signature) {
    return null;
  }

  return {
    format: 'png',
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

function parseGifMetadata(buffer) {
  const header = buffer.subarray(0, 6).toString('ascii');
  if (buffer.length < 10 || (header !== 'GIF87a' && header !== 'GIF89a')) {
    return null;
  }

  return {
    format: 'gif',
    width: buffer.readUInt16LE(6),
    height: buffer.readUInt16LE(8)
  };
}

function parseJpegMetadata(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  while (offset < buffer.length - 9) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);

    if (length < 2) {
      break;
    }

    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return {
        format: 'jpeg',
        width: buffer.readUInt16BE(offset + 7),
        height: buffer.readUInt16BE(offset + 5)
      };
    }

    offset += 2 + length;
  }

  return null;
}

function parseWebpMetadata(buffer) {
  if (
    buffer.length < 30
    || buffer.subarray(0, 4).toString('ascii') !== 'RIFF'
    || buffer.subarray(8, 12).toString('ascii') !== 'WEBP'
  ) {
    return null;
  }

  const chunkType = buffer.subarray(12, 16).toString('ascii');

  if (chunkType === 'VP8X' && buffer.length >= 30) {
    return {
      format: 'webp',
      width: buffer.readUIntLE(24, 3) + 1,
      height: buffer.readUIntLE(27, 3) + 1
    };
  }

  if (chunkType === 'VP8 ' && buffer.length >= 30) {
    return {
      format: 'webp',
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff
    };
  }

  if (chunkType === 'VP8L' && buffer.length >= 25) {
    const bits = buffer.readUInt32LE(21);
    return {
      format: 'webp',
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1
    };
  }

  return {
    format: 'webp',
    width: null,
    height: null
  };
}

function parseImageMetadata(buffer) {
  return parsePngMetadata(buffer)
    || parseJpegMetadata(buffer)
    || parseGifMetadata(buffer)
    || parseWebpMetadata(buffer)
    || {
      format: 'unknown',
      width: null,
      height: null
    };
}

function decodePdfLiteral(literal) {
  return literal
    .slice(1, -1)
    .replace(/\\([nrtbf()\\])/g, (match, code) => {
      const map = {
        n: '\n',
        r: '\r',
        t: '\t',
        b: '\b',
        f: '\f',
        '(': '(',
        ')': ')',
        '\\': '\\'
      };
      return map[code] || code;
    })
    .replace(/\\([0-7]{1,3})/g, (match, octal) => String.fromCharCode(parseInt(octal, 8)));
}

function decodePdfHexString(hex) {
  const cleanHex = hex.replace(/\s+/g, '');
  if (!cleanHex) {
    return '';
  }

  if (cleanHex.toUpperCase().startsWith('FEFF')) {
    const bytes = Buffer.from(cleanHex.slice(4), 'hex');
    const chars = [];
    for (let index = 0; index < bytes.length - 1; index += 2) {
      chars.push(String.fromCharCode(bytes.readUInt16BE(index)));
    }
    return chars.join('');
  }

  return Buffer.from(cleanHex, 'hex').toString('utf8');
}

function normalizeExtractedText(text) {
  return String(text || '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTextFromPdfBuffer(buffer) {
  const raw = buffer.toString('latin1');
  if (!raw.startsWith('%PDF')) {
    throw validationError('PDF file is not valid', { field: 'file' });
  }

  const fragments = [];
  const literalMatches = raw.match(/\((?:\\.|[^\\)])*\)\s*(?:Tj|'|")/g) || [];
  for (const match of literalMatches) {
    const literal = match.match(/\((?:\\.|[^\\)])*\)/)?.[0];
    if (literal) {
      fragments.push(decodePdfLiteral(literal));
    }
  }

  const arrayMatches = raw.match(/\[(?:\s*(?:\((?:\\.|[^\\)])*\)|-?\d+)\s*)+\]\s*TJ/g) || [];
  for (const match of arrayMatches) {
    const literalMatchesInArray = match.match(/\((?:\\.|[^\\)])*\)/g) || [];
    fragments.push(literalMatchesInArray.map(decodePdfLiteral).join(''));
  }

  const hexMatches = raw.match(/<([0-9a-fA-F\s]{6,})>\s*(?:Tj|'|")/g) || [];
  for (const match of hexMatches) {
    const hex = match.match(/<([0-9a-fA-F\s]{6,})>/)?.[1];
    if (hex) {
      fragments.push(decodePdfHexString(hex));
    }
  }

  return normalizeExtractedText(fragments.join(' '));
}

function toPreview(text, maxLength = 600) {
  const normalized = normalizeExtractedText(text);
  return normalized.length > maxLength ? `${normalized.substring(0, maxLength)}...` : normalized;
}

function buildFallbackStudyDraft(text) {
  const preview = toPreview(text, 240);
  const keywords = Array.from(new Set(
    normalizeExtractedText(text)
      .split(/\s+/)
      .map((word) => word.replace(/[^\p{L}\p{N}_-]/gu, ''))
      .filter((word) => word.length >= 3)
      .slice(0, 8)
  )).slice(0, 5);

  return {
    summary: [
      'Extracted text was organized with a safe fallback draft.',
      `Key material preview: ${preview}`,
      'Review the generated draft and adjust details before saving study notes.'
    ],
    notes: [
      `Main material: ${preview}`,
      'Mark unfamiliar terms and compare them with your textbook or class note.',
      'Create a short review block after reading the extracted material.'
    ],
    quiz: [
      {
        question: 'What is the main topic of this material?',
        answer: keywords[0] || 'Check the extracted text preview and identify the core concept.'
      },
      {
        question: 'Which keyword should be reviewed first?',
        answer: keywords[1] || 'Choose the most repeated term from the extracted text.'
      },
      {
        question: 'What should you verify before using this draft?',
        answer: 'Confirm that the extracted text is accurate and does not contain sensitive information.'
      }
    ],
    keywords: keywords.length ? keywords : ['review', 'summary', 'quiz']
  };
}

function sanitizeStudyDraft(draft, fallbackText) {
  const fallback = buildFallbackStudyDraft(fallbackText);
  return {
    summary: Array.isArray(draft?.summary) && draft.summary.length
      ? draft.summary.slice(0, 5).map((line) => String(line).trim()).filter(Boolean)
      : fallback.summary,
    notes: Array.isArray(draft?.notes) && draft.notes.length
      ? draft.notes.slice(0, 6).map((line) => String(line).trim()).filter(Boolean)
      : fallback.notes,
    quiz: Array.isArray(draft?.quiz) && draft.quiz.length
      ? draft.quiz.slice(0, 5).map((item) => ({
        question: String(item?.question || '').trim(),
        answer: String(item?.answer || '').trim()
      })).filter((item) => item.question && item.answer)
      : fallback.quiz,
    keywords: Array.isArray(draft?.keywords) && draft.keywords.length
      ? draft.keywords.slice(0, 8).map((item) => String(item).trim()).filter(Boolean)
      : fallback.keywords
  };
}

function getGeminiModel() {
  return process.env.AI_MODEL_NAME || DEFAULT_MODEL;
}

function logProviderFallback(action, statusCode = undefined) {
  const statusText = statusCode ? ` status=${statusCode}` : '';
  console.warn(`[AI Service] Provider unavailable for ${action}; fallback response used.${statusText}`);
}

function isProviderQuotaError(error) {
  const statusCode = error?.providerStatusCode || error?.statusCode;
  const diagnosticText = [
    error?.code,
    error?.message,
    error?.providerDiagnostic
  ].filter(Boolean).join(' ').toLowerCase();

  return statusCode === 429
    || diagnosticText.includes('quota')
    || diagnosticText.includes('rate limit')
    || diagnosticText.includes('too many')
    || diagnosticText.includes('insufficient')
    || diagnosticText.includes('billing');
}

function buildProviderFallbackMeta(error) {
  return {
    type: isProviderQuotaError(error) ? 'quota' : 'provider'
  };
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
    let providerDiagnostic = '';

    try {
      providerDiagnostic = await response.text();
    } catch (diagnosticError) {
      providerDiagnostic = '';
    }

    const error = new AppError('AI provider returned an error', 503, 'AI_PROVIDER_UNAVAILABLE');
    error.providerStatusCode = response.status;
    error.providerDiagnostic = providerDiagnostic.slice(0, 1000);
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
    return {
      value: await providerCall(),
      providerFallback: null
    };
  } catch (error) {
    logProviderFallback(action, error.providerStatusCode);
    return {
      value: fallbackFactory(),
      providerFallback: buildProviderFallbackMeta(error)
    };
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

async function reviewImageAttachment(userId, file) {
  const validation = validateAttachmentFile(file, {
    allowedTypes: IMAGE_ATTACHMENT_TYPES,
    maxSizeBytes: MAX_ATTACHMENT_IMAGE_SIZE_BYTES
  });
  const image = parseImageMetadata(file.buffer);

  return {
    file: validation.file,
    image,
    retention: {
      stored: false,
      policy: 'memory-only'
    },
    textExtraction: {
      status: 'unsupported',
      length: 0,
      extractedTextPreview: ''
    },
    warnings: [
      'Image file was validated and inspected in memory. Server-side OCR is not available for images in this release.',
      'Use a clear text-based PDF when automatic note and quiz generation is required.'
    ]
  };
}

async function buildStudyDraftFromText(userId, text) {
  const truncatedText = text.length > MAX_ATTACHMENT_TEXT_LENGTH
    ? text.substring(0, MAX_ATTACHMENT_TEXT_LENGTH)
    : text;
  const isTruncated = text.length > MAX_ATTACHMENT_TEXT_LENGTH;

  checkRateLimit(userId);

  const { value: draft, providerFallback } = await useProviderOrFallback(
    'study-material-attachment',
    async () => {
      const rawText = await callGeminiAPI(
        [
          '[중요] 반드시 한국어로만 작성하시오. 영어 사용 금지.',
          'Create a JSON study draft from the extracted learning material.',
          'Schema: {"summary":["string"],"notes":["string"],"quiz":[{"question":"string","answer":"string"}],"keywords":["string"]}',
          'Return 3 summary bullets, 3-5 note bullets, 3-5 quiz items, and 3-8 keywords.',
          'Every value MUST be written in Korean only.',
          `Material: ${truncatedText}`
        ].join('\n'),
        true
      );
      return sanitizeStudyDraft(parseJsonObject(rawText), truncatedText);
    },
    () => buildFallbackStudyDraft(truncatedText)
  );

  return {
    ...draft,
    isTruncated,
    originalTextLength: text.length,
    maxTextLength: MAX_ATTACHMENT_TEXT_LENGTH,
    providerFallback
  };
}

async function analyzeStudyMaterialAttachment(userId, file) {
  const validation = validateAttachmentFile(file, {
    allowedTypes: STUDY_MATERIAL_TYPES,
    maxSizeBytes: MAX_ATTACHMENT_PDF_SIZE_BYTES
  });
  const warnings = [];
  let image = null;
  let extractedText = '';
  let extractionStatus = 'not_found';

  if (validation.isImage && file.size > MAX_ATTACHMENT_IMAGE_SIZE_BYTES) {
    throw validationError('Uploaded image exceeds the allowed size', {
      field: 'file',
      maxSizeBytes: MAX_ATTACHMENT_IMAGE_SIZE_BYTES
    });
  }

  if (validation.isPdf) {
    extractedText = extractTextFromPdfBuffer(file.buffer);
    extractionStatus = extractedText ? 'extracted' : 'not_found';
    if (!extractedText) {
      warnings.push('Text could not be extracted from this PDF. Scanned PDFs require OCR and are not supported in this release.');
    }
  } else if (validation.isImage) {
    image = parseImageMetadata(file.buffer);
    extractionStatus = 'unsupported';
    warnings.push('Image file was validated in memory, but server-side image OCR is not available in this release.');
    warnings.push('Use a text-based PDF to generate notes and quizzes automatically.');
  }

  const baseResponse = {
    file: validation.file,
    image,
    retention: {
      stored: false,
      policy: 'memory-only'
    },
    textExtraction: {
      status: extractionStatus,
      length: extractedText.length,
      extractedTextPreview: toPreview(extractedText)
    },
    warnings
  };

  if (extractedText.length < MIN_ATTACHMENT_TEXT_LENGTH) {
    return {
      ...baseResponse,
      generation: {
        status: 'text_not_available',
        summary: [],
        notes: [],
        quiz: [],
        keywords: [],
        providerFallback: null
      }
    };
  }

  const draft = await buildStudyDraftFromText(userId, extractedText);

  return {
    ...baseResponse,
    generation: {
      status: 'generated',
      summary: draft.summary,
      notes: draft.notes,
      quiz: draft.quiz,
      keywords: draft.keywords,
      isTruncated: draft.isTruncated,
      originalTextLength: draft.originalTextLength,
      maxTextLength: draft.maxTextLength,
      providerFallback: draft.providerFallback
    }
  };
}

async function askAIQuestion(userId, payload) {
  assertObjectPayload(payload);

  const questionText = normalizeLimitedText(payload, 'question', MAX_QUESTION_LENGTH);
  const noteId = await resolveOwnedNoteId(userId, payload.noteId);
  checkRateLimit(userId);

  const { value: answer, providerFallback } = await useProviderOrFallback(
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
    maxLength: MAX_QUESTION_LENGTH,
    providerFallback
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

  const { value: recommendationJson, providerFallback } = await useProviderOrFallback(
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

  const record = await createAIRecommendation(userId, {
    basisJson,
    recommendationJson
  });

  return {
    ...record,
    providerFallback
  };
}

async function summarizeText(userId, payload) {
  assertObjectPayload(payload);

  const contentText = normalizeLimitedText(payload, 'content', MAX_SUMMARY_LENGTH);
  checkRateLimit(userId);

  const { value: summary, providerFallback } = await useProviderOrFallback(
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
    maxLength: MAX_SUMMARY_LENGTH,
    providerFallback
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

  const { value: analysis, providerFallback } = await useProviderOrFallback(
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
    maxLength: MAX_WRONG_ANSWER_LENGTH,
    providerFallback
  };
}

module.exports = {
  analyzeStudyMaterialAttachment,
  askAIQuestion,
  generateAIRecommendation,
  reviewImageAttachment,
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
