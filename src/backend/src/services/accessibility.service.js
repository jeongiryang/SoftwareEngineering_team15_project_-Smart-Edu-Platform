const {
  createReviewReminder,
  createVoiceRequest,
  findActiveReviewReminders,
  findPreferenceByUserId,
  upsertPreference
} = require('../repositories/accessibility.repository');
const { validationError } = require('../utils/errors');
const { normalizeString } = require('../utils/validators');

const MAX_VOICE_TEXT_LENGTH = 1000;
const MAX_TRANSCRIPT_LENGTH = 1000;
const MAX_REMINDER_MESSAGE_LENGTH = 200;
const MAX_REMINDER_TASK_LENGTH = 500;
const TTS_VOICE_TYPES = new Set(['ADULT_MALE', 'ADULT_FEMALE', 'CHILD_BOY', 'CHILD_GIRL']);
const DEFAULT_PREFERENCE = {
  textScale: 1,
  highContrast: false,
  elementaryFriendlyUi: false,
  voiceInputEnabled: false,
  voiceOutputEnabled: false,
  reviewReminderEnabled: false,
  reminderTime: null
};

function assertObjectPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw validationError('Payload must be an object');
  }
}

function normalizeBoolean(value, field) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'boolean') {
    throw validationError(`${field} must be a boolean`, { field });
  }

  return value;
}

function normalizeTextScale(value) {
  if (value === undefined) {
    return undefined;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 1 || parsedValue > 2) {
    throw validationError('textScale must be between 1 and 2', {
      field: 'textScale',
      min: 1,
      max: 2
    });
  }

  return Math.round(parsedValue * 10) / 10;
}

function normalizeReminderTime(value) {
  if (value === undefined || value === null || value === '') {
    return value === undefined ? undefined : null;
  }

  const normalizedValue = normalizeString(value);

  if (!/^\d{2}:\d{2}$/.test(normalizedValue)) {
    throw validationError('reminderTime must use HH:mm format', { field: 'reminderTime' });
  }

  const [hour, minute] = normalizedValue.split(':').map(Number);

  if (hour > 23 || minute > 59) {
    throw validationError('reminderTime must use a valid HH:mm value', { field: 'reminderTime' });
  }

  return normalizedValue;
}

function normalizeLimitedText(payload, field, maxLength, required = true) {
  const value = normalizeString(payload[field]);

  if (!value) {
    if (required) {
      throw validationError(`${field} is required`, { field });
    }

    return null;
  }

  if (value.length > maxLength) {
    throw validationError(`${field} must be at most ${maxLength} characters`, {
      field,
      currentLength: value.length,
      maxLength
    });
  }

  return value;
}

function normalizeVoiceType(value) {
  if (value === undefined || value === null || value === '') {
    return 'ADULT_FEMALE';
  }

  const normalizedValue = normalizeString(value);

  if (!TTS_VOICE_TYPES.has(normalizedValue)) {
    throw validationError('voiceType must be one of ADULT_MALE, ADULT_FEMALE, CHILD_BOY, CHILD_GIRL', {
      field: 'voiceType',
      allowedValues: Array.from(TTS_VOICE_TYPES)
    });
  }

  return normalizedValue;
}

function serializePreference(preference) {
  return {
    ...DEFAULT_PREFERENCE,
    ...(preference || {})
  };
}

async function getAccessibilityPreference(userId) {
  const preference = await findPreferenceByUserId(userId);
  return serializePreference(preference);
}

async function updateAccessibilityPreference(userId, payload) {
  assertObjectPayload(payload);

  const data = {
    textScale: normalizeTextScale(payload.textScale),
    highContrast: normalizeBoolean(payload.highContrast, 'highContrast'),
    elementaryFriendlyUi: normalizeBoolean(payload.elementaryFriendlyUi, 'elementaryFriendlyUi'),
    voiceInputEnabled: normalizeBoolean(payload.voiceInputEnabled, 'voiceInputEnabled'),
    voiceOutputEnabled: normalizeBoolean(payload.voiceOutputEnabled, 'voiceOutputEnabled'),
    reviewReminderEnabled: normalizeBoolean(payload.reviewReminderEnabled, 'reviewReminderEnabled'),
    reminderTime: normalizeReminderTime(payload.reminderTime)
  };

  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );

  if (Object.keys(filteredData).length === 0) {
    throw validationError('At least one accessibility preference field is required');
  }

  const preference = await upsertPreference(userId, filteredData);
  return serializePreference(preference);
}

async function createTextToSpeechRequest(userId, payload) {
  assertObjectPayload(payload);

  const inputText = normalizeLimitedText(payload, 'text', MAX_VOICE_TEXT_LENGTH);
  const voiceType = normalizeVoiceType(payload.voiceType);
  const record = await createVoiceRequest(userId, {
    mode: 'TTS',
    voiceType,
    inputText
  });

  return {
    id: record.id,
    mode: record.mode,
    voiceType: record.voiceType,
    text: record.inputText,
    status: 'READY',
    createdAt: record.createdAt
  };
}

async function createSpeechToTextTranscript(userId, payload) {
  assertObjectPayload(payload);

  const transcript = normalizeLimitedText(payload, 'transcript', MAX_TRANSCRIPT_LENGTH);
  const record = await createVoiceRequest(userId, {
    mode: 'STT',
    transcript
  });

  return {
    id: record.id,
    mode: record.mode,
    transcript: record.transcript,
    status: 'SAVED',
    createdAt: record.createdAt
  };
}

async function scheduleReviewReminder(userId, payload) {
  assertObjectPayload(payload);

  const title = normalizeLimitedText(
    payload,
    'title',
    MAX_REMINDER_MESSAGE_LENGTH,
    false
  );
  const task = normalizeLimitedText(
    payload,
    'task',
    MAX_REMINDER_TASK_LENGTH,
    false
  );
  const message = normalizeLimitedText(
    payload,
    'message',
    MAX_REMINDER_MESSAGE_LENGTH,
    false
  );
  const reminderMessage = [
    title || message || '복습 알림',
    task || '오늘 학습한 내용을 10분만 복습해 보세요.'
  ].join(' - ');
  const scheduledAtRaw = normalizeString(payload.scheduledAt);
  const scheduledAt = new Date(scheduledAtRaw);

  if (!scheduledAtRaw || Number.isNaN(scheduledAt.getTime())) {
    throw validationError('scheduledAt must be a valid ISO datetime', { field: 'scheduledAt' });
  }

  const reminder = await createReviewReminder(userId, {
    message: reminderMessage,
    scheduledAt
  });

  return reminder;
}

async function getActiveReviewReminders(userId) {
  if (!userId) {
    throw validationError('userId is required');
  }
  const reminders = await findActiveReviewReminders(userId);
  return reminders;
}

module.exports = {
  getAccessibilityPreference,
  scheduleReviewReminder,
  getActiveReviewReminders,
  updateAccessibilityPreference,
  createSpeechToTextTranscript,
  createTextToSpeechRequest
};
