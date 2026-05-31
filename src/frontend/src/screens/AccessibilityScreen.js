import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import {
  createReviewReminder,
  getAccessibilityPreferences,
  updateAccessibilityPreferences
} from '../services/api';
import AccessibleTextInput from '../components/AccessibleTextInput';
import ConfirmModal from '../components/ConfirmModal';
import ReadableText from '../components/ReadableText';
import { useAccessibility, voiceOptions } from '../contexts/AccessibilityContext';
import { colors, interactions, interactiveStateStyles, radii, shadows } from '../styles/theme';

const defaultPreference = {
  textScale: 1,
  highContrast: false,
  elementaryFriendlyUi: false,
  voiceInputEnabled: false,
  voiceOutputEnabled: false,
  reviewReminderEnabled: false,
  reminderTime: ''
};
const TEXT_SCALE_OPTIONS = [1, 1.2, 1.4, 1.6, 1.8, 2];
const MAGNIFIER_MODE_STORAGE_KEY = 'sagaksagak:magnifier-mode';
const MAGNIFIER_MODE_EVENT = 'sagak-magnifier-change';
const KID_TEXT_SCALE_LABELS = {
  1: '보통',
  1.2: '조금 크게',
  1.4: '많이 크게',
  1.6: '아주 크게',
  1.8: '더 크게',
  2: '가장 크게'
};

function readStoredMagnifierMode() {
  try {
    return globalThis.localStorage?.getItem(MAGNIFIER_MODE_STORAGE_KEY) === 'true';
  } catch (error) {
    return false;
  }
}

function writeStoredMagnifierMode(enabled) {
  try {
    globalThis.localStorage?.setItem(MAGNIFIER_MODE_STORAGE_KEY, enabled ? 'true' : 'false');
    globalThis.window?.dispatchEvent?.(new Event(MAGNIFIER_MODE_EVENT));
  } catch (error) {
    // localStorage is unavailable in some native/test runtimes; the local state still updates.
  }
}
const DRAFT_STORAGE_KEY = 'smartEduAccessibilityDraft';
const voiceGuideSteps = [
  {
    title: '읽어주기 목소리 선택',
    body: '학습자에게 편한 목소리를 고를 수 있습니다. 선택한 목소리는 텍스트를 누르거나 전체 읽기를 사용할 때 적용됩니다.'
  },
  {
    title: '기본 학습 톤',
    body: '차분한 낮은 톤과 부드러운 기본 톤은 일반 학습자에게 추천합니다. 브라우저 음성을 톤과 속도로 조정해 들려줍니다.'
  },
  {
    title: '밝은 학습 톤',
    body: '밝은 낮은 톤과 밝은 높은 톤은 초등학생 학습자에게 추천합니다. 더 친근하게 들리도록 톤과 속도를 조정합니다.'
  },
  {
    title: '목소리 차이 안내',
    body: '현재는 브라우저가 제공하는 목소리를 사용하므로 기기와 브라우저에 따라 실제 음색이 다르게 들릴 수 있습니다.'
  }
];
const kidVoiceGuideSteps = [
  {
    title: '🗣️ 목소리 선택하기',
    body: '책을 읽어줄 사람의 목소리를 직접 고를 수 있어요. 글자를 누르거나 전체 읽기를 누르면 이 목소리로 읽어줘요!'
  },
  {
    title: '🎧 차분한 소리',
    body: '낮은 톤과 기본 톤은 깔끔하고 또박또박하게 책을 읽어줘요.'
  },
  {
    title: '✨ 밝은 소리',
    body: '밝은 낮은 톤과 밝은 높은 톤은 더 친근하고 천천히 읽어줘요.'
  },
  {
    title: '💡 알아두기',
    body: '폰이나 컴퓨터에 있는 기능을 사용하기 때문에 기기마다 목소리가 조금씩 다를 수 있어요!'
  }
];


function hasSpeechSynthesis() {
  return typeof globalThis !== 'undefined' && Boolean(globalThis.speechSynthesis);
}

function hasSpeechRecognition() {
  return typeof globalThis !== 'undefined' && Boolean(globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition);
}

function getStorage() {
  try {
    return globalThis.localStorage || null;
  } catch (error) {
    return null;
  }
}

function readDraft() {
  try {
    const rawDraft = getStorage()?.getItem(DRAFT_STORAGE_KEY);
    return rawDraft ? JSON.parse(rawDraft) : {};
  } catch (error) {
    return {};
  }
}

function getDefaultReminderDateTime() {
  const koreaTime = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const year = koreaTime.getUTCFullYear();
  const month = String(koreaTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(koreaTime.getUTCDate()).padStart(2, '0');
  const hour = String(koreaTime.getUTCHours()).padStart(2, '0');
  const minute = String(koreaTime.getUTCMinutes()).padStart(2, '0');

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`
  };
}

function buildScheduledAt(date, time) {
  if (!date || !time) {
    return '';
  }

  return `${date}T${time}:00+09:00`;
}

function toHour12(hour24) {
  const normalizedHour = Number.parseInt(clampTimePart(hour24, 23), 10);
  const period = normalizedHour >= 12 ? 'PM' : 'AM';
  const hour12 = normalizedHour % 12 || 12;

  return {
    period,
    hour: String(hour12).padStart(2, '0')
  };
}

function toHour24(period, hour12) {
  const normalizedHour = Number.parseInt(clampTimePart(hour12, 12), 10) || 12;

  if (period === 'AM') {
    return String(normalizedHour === 12 ? 0 : normalizedHour).padStart(2, '0');
  }

  return String(normalizedHour === 12 ? 12 : normalizedHour + 12).padStart(2, '0');
}

function clampTimePart(value, max) {
  const parsedValue = Number.parseInt(String(value).replace(/\D/g, ''), 10);

  if (Number.isNaN(parsedValue)) {
    return '00';
  }

  return String(Math.min(Math.max(parsedValue, 0), max)).padStart(2, '0');
}

function clampTimeRange(value, min, max) {
  const parsedValue = Number.parseInt(String(value).replace(/\D/g, ''), 10);

  if (Number.isNaN(parsedValue)) {
    return String(min).padStart(2, '0');
  }

  return String(Math.min(Math.max(parsedValue, min), max)).padStart(2, '0');
}

function getWheelNeighbor(value, min, max, delta) {
  const currentValue = Number.parseInt(value, 10) || min;
  const range = max - min + 1;
  const nextValue = ((currentValue - min + delta + range) % range) + min;
  return String(nextValue).padStart(2, '0');
}

function parseDateValue(value) {
  const [year, month, day] = String(value || '').split('-').map((part) => Number.parseInt(part, 10));

  if (!year || !month || !day) {
    return null;
  }

  return { year, month, day };
}

function formatDateValue(year, month, day) {
  return [
    String(year).padStart(4, '0'),
    String(month).padStart(2, '0'),
    String(day).padStart(2, '0')
  ].join('-');
}

function shiftMonth(monthValue, delta) {
  const date = new Date(Date.UTC(monthValue.year, monthValue.month - 1 + delta, 1));

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1
  };
}

function getCalendarCells(monthValue) {
  const firstDay = new Date(Date.UTC(monthValue.year, monthValue.month - 1, 1));
  const startOffset = firstDay.getUTCDay();
  const startDate = new Date(Date.UTC(monthValue.year, monthValue.month - 1, 1 - startOffset));

  return Array.from({ length: 42 }, (_, index) => {
    const cellDate = new Date(startDate);
    cellDate.setUTCDate(startDate.getUTCDate() + index);

    return {
      date: formatDateValue(
        cellDate.getUTCFullYear(),
        cellDate.getUTCMonth() + 1,
        cellDate.getUTCDate()
      ),
      day: cellDate.getUTCDate(),
      inMonth: cellDate.getUTCMonth() + 1 === monthValue.month
    };
  });
}

export default function AccessibilityScreen({ onNavigate, token, user }) {
  const {
    preference: globalPreference,
    previewingVoiceType,
    setPreference: setGlobalPreference,
    setVoiceType: setGlobalVoiceType,
    speakText,
    stopSpeech,
    scheduleAlarm
  } = useAccessibility();
  const saveTimeoutRef = useRef(null);
  const draft = useMemo(() => readDraft(), []);
  const defaultReminderDateTime = useMemo(() => getDefaultReminderDateTime(), []);
  const todayDate = useMemo(() => getDefaultReminderDateTime().date, []);
  const [preference, setPreference] = useState(globalPreference || defaultPreference);
  const [magnifierMode, setMagnifierMode] = useState(readStoredMagnifierMode);
  const [ttsText, setTtsText] = useState(draft.ttsText || '');
  const [voiceType, setVoiceType] = useState(draft.voiceType || 'ADULT_FEMALE');
  const [transcript, setTranscript] = useState('');
  const [reminderTitle, setReminderTitle] = useState(draft.reminderTitle || '');
  const [reminderTask, setReminderTask] = useState(draft.reminderTask || '');
  const [reminderDate, setReminderDate] = useState(defaultReminderDateTime.date);
  const [reminderHour, setReminderHour] = useState(defaultReminderDateTime.time.split(':')[0]);
  const [reminderMinute, setReminderMinute] = useState(defaultReminderDateTime.time.split(':')[1]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [voiceGuideVisible, setVoiceGuideVisible] = useState(false);
  const [voiceGuideStep, setVoiceGuideStep] = useState(0);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const parsedDate = parseDateValue(defaultReminderDateTime.date);
    return {
      year: parsedDate?.year || Number(defaultReminderDateTime.date.slice(0, 4)),
      month: parsedDate?.month || Number(defaultReminderDateTime.date.slice(5, 7))
    };
  });

  const speechSupportText = useMemo(() => {
    const readAloud = hasSpeechSynthesis() ? '읽어주기 사용 가능' : '읽어주기 미지원';
    const voiceInput = hasSpeechRecognition() ? '음성 입력 사용 가능' : '음성 입력 미지원';
    return `${readAloud} · ${voiceInput}`;
  }, []);

  useEffect(() => {
    getStorage()?.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
      ttsText,
      voiceType,
      reminderTitle,
      reminderTask,
      reminderDate,
      reminderHour,
      reminderMinute
    }));
  }, [ttsText, voiceType, reminderTitle, reminderTask, reminderDate, reminderHour, reminderMinute]);

  useEffect(() => {
    setGlobalVoiceType(voiceType);
  }, [setGlobalVoiceType, voiceType]);



  function resetFeedback() {
    setMessage('');
    setErrorMessage('');
    setErrorModalMessage('');
  }

  async function savePreference(nextPreference) {
    setSaving(true);
    resetFeedback();

    try {
      const result = await updateAccessibilityPreferences(token, nextPreference);
      setPreference({
        ...defaultPreference,
        ...result.preference,
        reminderTime: result.preference?.reminderTime || ''
      });
      setMessage('');
    } catch (error) {
      setErrorModalMessage(error.message || (preference.elementaryFriendlyUi ? '설정을 저장하지 못했어요. 다시 해볼까요?' : '접근성 설정 저장에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  function updateLocalPreference(partial) {
    const nextPreference = {
      ...preference,
      ...partial
    };
    setPreference(nextPreference);

    // UI 레이아웃(zoom)이 즉시 변경되면서 버튼 터치 이벤트가 씹히거나 굳는 RN Web 버그 방지
    setTimeout(() => {
      setGlobalPreference(nextPreference);
    }, 50);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      savePreference(nextPreference);
    }, 500);
  }

  function toggleMagnifierMode() {
    const nextMagnifierMode = !magnifierMode;

    setMagnifierMode(nextMagnifierMode);
    writeStoredMagnifierMode(nextMagnifierMode);
  }

  async function handleReminder() {
    const normalizedHour = clampTimePart(reminderHour, 23);
    const normalizedMinute = clampTimePart(reminderMinute, 59);
    const scheduledAt = buildScheduledAt(reminderDate.trim(), `${normalizedHour}:${normalizedMinute}`);

    if (!scheduledAt) {
      setErrorMessage(preference.elementaryFriendlyUi ? '알람 울릴 날짜와 시간을 잘 골라주세요!' : '복습 알림 날짜와 시간을 입력해 주세요.');
      return;
    }

    setReminderHour(normalizedHour);
    setReminderMinute(normalizedMinute);
    setSaving(true);
    resetFeedback();

    try {
      const result = await createReviewReminder(token, {
        title: reminderTitle.trim() || undefined,
        task: reminderTask.trim() || undefined,
        scheduledAt
      });
      if (result.reminder) {
        scheduleAlarm(result.reminder.id, result.reminder.scheduledAt, result.reminder.message);
      }
      setMessage(preference.elementaryFriendlyUi
        ? `${reminderDate} ${normalizedHour}시 ${normalizedMinute}분에 알림 약속이 등록되었습니다! ⏰`
        : `${reminderDate} ${normalizedHour}:${normalizedMinute}에 복습 알림이 등록되었습니다.`);
    } catch (error) {
      setErrorMessage(error.message || (preference.elementaryFriendlyUi ? '알림 약속을 정하지 못했어요. 다시 해볼까요?' : '복습 알림 등록에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  function openDatePicker() {
    const parsedDate = parseDateValue(reminderDate);

    if (parsedDate) {
      setCalendarMonth({
        year: parsedDate.year,
        month: parsedDate.month
      });
    }

    setCalendarVisible(true);
  }

  function handlePreviewVoice(option, label) {
    if (previewingVoiceType === option.value) {
      stopSpeech();
      return;
    }

    const previewText = preference.elementaryFriendlyUi
      ? `${label} 목소리로 읽어볼게요. 이 목소리가 편한지 들어보세요.`
      : `${label} 미리듣기입니다. 선택한 톤과 속도가 이렇게 적용됩니다.`;

    speakText(previewText, {
      previewVoiceType: option.value,
      voiceType: option.value
    });
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.title}>접근 권한이 없습니다.</Text>
        <Pressable onPress={() => onNavigate('login')} style={(state) => [styles.primaryButton, ...interactiveStateStyles(state)]}>
          <Text style={styles.primaryButtonText}>로그인 하러 가기</Text>
        </Pressable>
      </View>
    );
  }

  const scaledStyles = {
    fontSize: Math.round(16 * preference.textScale)
  };
  const contrastStyle = preference.highContrast ? styles.highContrast : null;
  const friendlyStyle = null;
  const reminderHour12 = toHour12(reminderHour);
  const calendarCells = getCalendarCells(calendarMonth);
  const isKidMode = preference.elementaryFriendlyUi;
  const kidTexts = {
    title: '🎒 접근성 설정',
    subtitle: '글자 크기를 키우거나, 목소리로 쓰고 귀로 편하게 들어보세요!',
    readAloudParagraph: '🔊 글 읽어주기 기능이 켜져 있으면, 글자를 누르거나 전체 읽기로 들을 수 있어요.',
    section1Title: '👀 화면 꾸미기',
    labelHighContrast: '🕶️ 눈 아플 때 (검은 화면)',
    labelElementaryUi: '🎒 초등학생 모드 (쉬운 말)',
    labelVoiceOutput: '🔊 귀로 듣기 (글 읽어주기)',
    labelVoiceInput: '🎙️ 마이크로 말하기 (음성 입력)',
    section2Title: '🗣️ 목소리 고르기',
    section2Helper: '듣기 편한 목소리 톤을 골라보세요. 사용하는 폰이나 컴퓨터에 따라 다르게 들릴 수 있어요.',
    textTtsPlaceholder: '여기에 글을 쓰면 기계가 소리 내어 읽어줘요. 한번 써보세요!',
    buttonSpeak: '🔊 소리 내어 듣기',
    voiceAdultMale: '🎧 차분한 낮은 톤',
    voiceAdultFemale: '🎙️ 부드러운 기본 톤',
    voiceChildBoy: '✨ 밝은 낮은 톤',
    voiceChildGirl: '🔆 밝은 높은 톤',
    section3Title: '📝 말로 쓰기 연습',
    textSttPlaceholder: '마이크로 말한 글이 여기에 적혀요. 직접 고칠 수도 있어요!',
    section4Title: '⏰ 다시 공부할 시간 약속',
    textReminderTitlePlaceholder: '예시: 수학 덧셈 연습하기',
    textReminderTaskPlaceholder: '예시: 구구단 3단을 큰 소리로 5번 읽어볼까요?',
    labelDate: '날짜',
    labelScheduled: '🔔 알람이 울릴 약속 시간',
    buttonReminderSubmit: '⏰ 공부 약속 정하기',
    guideButton: '❓ 도움말',
    dashboardButton: '🏠 첫 화면으로',
    loadingText: '설정을 불러오는 중이에요. 잠시만 기다려주세요! 🛠️',
    successSavePreference: '화면 설정이 잘 저장되었어요! 👍',
    successSaveSpeech: '말로 쓴 메모가 안전하게 저장되었어요! 💾',
    successSaveReminder: '공부 알람 약속을 잘 저장했어요! ⏰',
    speechSupportText: '🔊 읽어주기 준비 완료 · 🎙️ 마이크 준비 완료'
  };

  return (
    <ScrollView style={[styles.container, contrastStyle]} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, scaledStyles, preference.highContrast && styles.highContrastText]}>
            {isKidMode ? kidTexts.title : '접근성 설정'}
          </Text>
          <Text style={[styles.subtitle, preference.highContrast && styles.highContrastSubText]}>
            {isKidMode ? kidTexts.subtitle : '큰 글씨, 고대비, 음성 입력 등 나에게 맞는 화면과 소리 환경을 설정합니다.'}
          </Text>
            <ReadableParagraph
              enabled={preference.voiceOutputEnabled}
              style={styles.helperText}
              text={isKidMode ? kidTexts.readAloudParagraph : '읽어주기 설정을 켜면 일반 텍스트를 클릭하거나 전체 읽기로 화면 내용을 들을 수 있습니다.'}
            />
        </View>
        <Pressable onPress={() => onNavigate('dashboard')} style={(state) => [styles.secondaryButton, ...interactiveStateStyles(state)]}>
          <Text style={styles.secondaryButtonText}>
            {isKidMode ? kidTexts.dashboardButton : '대시보드'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.patternInfoGrid}>
        <View style={styles.patternInfoCard}>
          <Text style={styles.patternInfoTitle}>{isKidMode ? '기기 기능을 써요' : '브라우저 음성 기능'}</Text>
          <Text style={styles.patternInfoText}>
            {isKidMode
              ? '읽어주기와 말로 쓰기는 기기와 브라우저가 도와주는 기능이에요.'
              : 'TTS/STT는 AI 호출이 아니라 브라우저와 기기 음성 기능을 사용합니다.'}
          </Text>
        </View>
        <View style={styles.patternInfoCard}>
          <Text style={styles.patternInfoTitle}>{isKidMode ? '내가 고를 수 있어요' : '선택형 접근성'}</Text>
          <Text style={styles.patternInfoText}>
            {isKidMode
              ? '큰 글씨, 고대비, 쉬운 말, 음성 기능은 필요할 때 직접 켜고 끌 수 있어요.'
              : '큰 글씨, 고대비, 쉬운 용어, 음성 기능 등은 사용자가 직접 켜고 끄는 선택형 설정입니다.'}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.panel}>
          <ActivityIndicator color={colors.blue} />
          <Text style={styles.statusText}>
            {isKidMode ? kidTexts.loadingText : '설정을 불러오는 중입니다.'}
          </Text>
        </View>
      ) : (
        <>
          <View style={[styles.panel, friendlyStyle]}>
            <Text style={[styles.sectionTitle, scaledStyles]}>
              {isKidMode ? kidTexts.section1Title : '화면 보기 설정'}
            </Text>
            <ReadableParagraph
              enabled={preference.voiceOutputEnabled}
              style={styles.helperText}
              text={isKidMode ? kidTexts.speechSupportText : speechSupportText}
            />
            <View style={styles.scaleRow}>
              {TEXT_SCALE_OPTIONS.map((scale) => (
                <Pressable
                  key={scale}
                  onPress={() => {
                    updateLocalPreference({ textScale: scale });
                  }}
                  style={(state) => [
                    styles.scaleButton,
                    preference.textScale === scale && styles.activeButton,
                    ...interactiveStateStyles(state)
                  ]}
                >
                  <Text style={[styles.scaleButtonText, preference.textScale === scale && styles.activeButtonText]}>
                    {isKidMode ? KID_TEXT_SCALE_LABELS[scale] : `${scale.toFixed(1)}x`}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={[styles.magnifierCard, magnifierMode && styles.magnifierCardActive]}>
              <View style={styles.magnifierCopy}>
                <Text style={[styles.magnifierTitle, scaledStyles]}>
                  돋보기 모드
                </Text>
                <Text style={styles.helperText}>
                  고령자와 저시력 사용자를 위해 화면 전체 글자와 UI를 최소 1.35x로 확대합니다.
                </Text>
              </View>
              <Pressable
                onPress={toggleMagnifierMode}
                style={(state) => [
                  styles.scaleButton,
                  magnifierMode && styles.activeButton,
                  ...interactiveStateStyles(state)
                ]}
                accessibilityRole="switch"
                accessibilityState={{ checked: magnifierMode }}
              >
                <Text style={[styles.scaleButtonText, magnifierMode && styles.activeButtonText]}>
                  {magnifierMode ? '켜짐' : '켜기'}
                </Text>
              </Pressable>
            </View>
            <ToggleRow
              active={preference.highContrast}
              label={isKidMode ? kidTexts.labelHighContrast : '고대비'}
              onPress={() => updateLocalPreference({ highContrast: !preference.highContrast })}
            />
            <ToggleRow
              active={preference.elementaryFriendlyUi}
              label={isKidMode ? kidTexts.labelElementaryUi : '초등학생 친화 UI'}
              onPress={() => updateLocalPreference({ elementaryFriendlyUi: !preference.elementaryFriendlyUi })}
            />
            <ToggleRow
              active={preference.voiceOutputEnabled}
              label={isKidMode ? kidTexts.labelVoiceOutput : '읽어주기'}
              onPress={() => updateLocalPreference({ voiceOutputEnabled: !preference.voiceOutputEnabled })}
            />
            <ToggleRow
              active={preference.voiceInputEnabled}
              label={isKidMode ? kidTexts.labelVoiceInput : '음성 입력'}
              onPress={() => updateLocalPreference({ voiceInputEnabled: !preference.voiceInputEnabled })}
            />
          </View>

          <View style={[styles.panel, friendlyStyle]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, scaledStyles]}>
                {isKidMode ? kidTexts.section2Title : '읽어주기 목소리 선택'}
              </Text>
              <Pressable
                onPress={() => {
                  setVoiceGuideStep(0);
                  setVoiceGuideVisible(true);
                }}
                style={(state) => [styles.guideButton, ...interactiveStateStyles(state)]}
              >
                <Text style={styles.guideButtonText}>
                  {isKidMode ? kidTexts.guideButton : '도움말'}
                </Text>
              </Pressable>
            </View>
            <View style={styles.voiceGrid}>
              {voiceOptions.map((option) => {
                const label = isKidMode
                  ? (option.value === 'ADULT_MALE' ? kidTexts.voiceAdultMale : option.value === 'ADULT_FEMALE' ? kidTexts.voiceAdultFemale : option.value === 'CHILD_BOY' ? kidTexts.voiceChildBoy : kidTexts.voiceChildGirl)
                  : option.label;
                const tag = isKidMode
                  ? (option.value.startsWith('CHILD') ? '🎒 친구 추천' : '👨 어른 추천')
                  : option.tag;
                const active = voiceType === option.value;
                const previewing = previewingVoiceType === option.value;
                return (
                  <View
                    key={option.value}
                    style={[
                      styles.voiceButton,
                      active && styles.activeButton,
                      saving && styles.disabledButton
                    ]}
                  >
                    <Pressable
                      accessibilityLabel={`${label} 선택`}
                      accessibilityRole="button"
                      onPress={() => {
                        if (saving) return;
                        setVoiceType(option.value);
                        setGlobalVoiceType(option.value);
                      }}
                      style={(state) => [
                        styles.voiceSelectArea,
                        state.hovered && !active && styles.voiceSelectAreaHover,
                        ...interactiveStateStyles(state, { disabled: saving })
                      ]}
                    >
                      <Text style={[
                        styles.voiceButtonText,
                        active && styles.activeButtonText
                      ]}>{label}</Text>
                      {!active && (
                        <Text style={styles.voiceTagText}>{tag}</Text>
                      )}
                    </Pressable>
                    <Pressable
                      accessibilityLabel={`${label} 미리듣기`}
                      accessibilityRole="button"
                      accessibilityState={{ busy: previewing }}
                      onPress={() => handlePreviewVoice(option, label)}
                      style={(state) => [
                        styles.voicePreviewButton,
                        previewing && styles.voicePreviewButtonActive,
                        ...interactiveStateStyles(state)
                      ]}
                    >
                      <SpeakerIcon active={previewing} />
                      <Text style={[
                        styles.voicePreviewText,
                        previewing && styles.voicePreviewTextActive
                      ]}>
                        {previewing ? '재생 중' : '미리듣기'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
            <ReadableParagraph
              enabled={preference.voiceOutputEnabled}
              style={styles.helperText}
              text={isKidMode ? kidTexts.section2Helper : '현재는 브라우저가 제공하는 목소리를 바탕으로 톤과 속도를 조정합니다. 실제 목소리 느낌은 사용 중인 브라우저와 운영체제에 따라 달라질 수 있습니다.'}
            />
            <View style={styles.ttsInputWrapper}>
              <AccessibleTextInput
                multiline
                onChangeText={setTtsText}
                placeholder={isKidMode ? kidTexts.textTtsPlaceholder : '예: 오늘 배운 내용을 천천히 읽어 주세요.'}
                placeholderTextColor={colors.muted}
                style={[
                  styles.textarea,
                  scaledStyles
                ]}
                value={ttsText}
              />
            </View>
          </View>

          <View style={[styles.panel, friendlyStyle]}>
            <Text style={[styles.sectionTitle, scaledStyles]}>
              {isKidMode ? kidTexts.section3Title : '음성 입력 메모 테스트'}
            </Text>
            <ReadableParagraph
              enabled={preference.voiceOutputEnabled}
              style={styles.helperText}
              text={isKidMode
                ? '음성 입력 설정을 켜지 않아도 여기서는 마이크로 말하기를 바로 연습할 수 있어요.'
                : '음성 입력 설정과 관계없이 브라우저 마이크 인식이 되는지 테스트할 수 있습니다. 이 내용은 서버에 저장되지 않습니다.'}
            />
            <AccessibleTextInput
              forceVoiceInput
              multiline
              onChangeText={setTranscript}
              placeholder={isKidMode ? kidTexts.textSttPlaceholder : '예: 음성 인식 결과를 수정할 수 있습니다.'}
              placeholderTextColor={colors.muted}
              style={[styles.textarea, scaledStyles]}
              value={transcript}
            />
          </View>

        </>
      )}

      {message ? <Text style={styles.successText}>{message}</Text> : null}
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      <ConfirmModal
        confirmLabel="확인"
        description={errorModalMessage}
        onCancel={() => setErrorModalMessage('')}
        onConfirm={() => setErrorModalMessage('')}
        showCancel={false}
        title="접근성 설정을 저장하지 못했습니다"
        visible={Boolean(errorModalMessage)}
      />
      {voiceGuideVisible && (
        <Modal
          animationType="fade"
          transparent
          visible={voiceGuideVisible}
          onRequestClose={() => setVoiceGuideVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalPanel}>
              <Text style={styles.modalStep}>
                {isKidMode
                  ? `💡 사용법 안내 (${voiceGuideStep + 1}/${kidVoiceGuideSteps.length})`
                  : `GUIDE (${voiceGuideStep + 1}/${voiceGuideSteps.length})`}
              </Text>
              <Text style={styles.modalTitle}>
                {isKidMode ? kidVoiceGuideSteps[voiceGuideStep].title : voiceGuideSteps[voiceGuideStep].title}
              </Text>
              <Text style={styles.modalBody}>
                {isKidMode ? kidVoiceGuideSteps[voiceGuideStep].body : voiceGuideSteps[voiceGuideStep].body}
              </Text>
              <View style={styles.modalActionRow}>
                <Pressable onPress={() => setVoiceGuideVisible(false)} style={(state) => [styles.modalGhostButton, ...interactiveStateStyles(state)]}>
                  <Text style={styles.modalGhostButtonText}>
                    {isKidMode ? '그만보기' : '건너뛰기'}
                  </Text>
                </Pressable>
                {voiceGuideStep > 0 && (
                  <Pressable
                    onPress={() => setVoiceGuideStep((step) => Math.max(step - 1, 0))}
                    style={(state) => [styles.modalOutlineButton, ...interactiveStateStyles(state)]}
                  >
                    <Text style={styles.modalOutlineButtonText}>이전</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => {
                    const currentSteps = isKidMode ? kidVoiceGuideSteps : voiceGuideSteps;
                    if (voiceGuideStep >= currentSteps.length - 1) {
                      setVoiceGuideVisible(false);
                      return;
                    }

                    setVoiceGuideStep((step) => step + 1);
                  }}
                  style={(state) => [styles.modalButton, ...interactiveStateStyles(state)]}
                >
                  <Text style={styles.modalButtonText}>
                    {isKidMode
                      ? (voiceGuideStep >= kidVoiceGuideSteps.length - 1 ? '닫기' : '다음')
                      : (voiceGuideStep >= voiceGuideSteps.length - 1 ? '끄기' : '다음')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
      {calendarVisible && (
        <Modal
          animationType="fade"
          transparent
          visible={calendarVisible}
          onRequestClose={() => setCalendarVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.calendarPanel}>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarTitle}>{calendarMonth.year}년 {calendarMonth.month}월</Text>
                <View style={styles.calendarNavRow}>
                  <Pressable
                    onPress={() => setCalendarMonth((month) => shiftMonth(month, -1))}
                    style={(state) => [styles.calendarNavButton, ...interactiveStateStyles(state)]}
                  >
                    <Text style={styles.calendarNavText}>{isKidMode ? '◀ 지난달' : '이전'}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setCalendarMonth((month) => shiftMonth(month, 1))}
                    style={(state) => [styles.calendarNavButton, ...interactiveStateStyles(state)]}
                  >
                    <Text style={styles.calendarNavText}>{isKidMode ? '다음달 ▶' : '다음'}</Text>
                  </Pressable>
                </View>
              </View>
              <View style={styles.weekdayGrid}>
                {['일', '월', '화', '수', '목', '금', '토'].map((weekday) => (
                  <Text key={weekday} style={styles.weekdayText}>{weekday}</Text>
                ))}
              </View>
              <View style={styles.calendarGrid}>
                {calendarCells.map((cell) => {
                  const isSelected = cell.date === reminderDate;
                  const isToday = cell.date === todayDate;

                  return (
                    <Pressable
                      key={cell.date}
                      onPress={() => {
                        setReminderDate(cell.date);
                        setCalendarVisible(false);
                      }}
                      style={(state) => [
                        styles.calendarDayButton,
                        isToday && styles.calendarDayButtonToday,
                        isSelected && styles.calendarDayButtonActive,
                        ...interactiveStateStyles(state)
                      ]}
                    >
                      <Text
                        style={[
                          styles.calendarDayText,
                          !cell.inMonth && styles.calendarDayTextMuted,
                          isToday && styles.calendarDayTextToday,
                          isSelected && styles.calendarDayTextActive
                        ]}
                      >
                        {cell.day}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.modalActionRow}>
                <Pressable onPress={() => setCalendarVisible(false)} style={(state) => [styles.modalGhostButton, ...interactiveStateStyles(state)]}>
                  <Text style={styles.modalGhostButtonText}>{isKidMode ? '창 닫기' : '취소'}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

function ReadableParagraph({ enabled, style, text }) {
  if (!enabled) {
    return <Text style={style}>{text}</Text>;
  }

  return <ReadableText style={style}>{text}</ReadableText>;
}

function ToggleRow({ active, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={(state) => [styles.toggleRow, active && styles.toggleRowActive, ...interactiveStateStyles(state)]}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.toggle, active && styles.toggleActive]}>
        <View style={[styles.toggleKnob, active && styles.toggleKnobActive]} />
      </View>
    </Pressable>
  );
}

function PeriodWheel({ onChange, value }) {
  return (
    <View style={styles.periodWheel}>
      <Pressable onPress={() => onChange('AM')} style={(state) => [styles.periodOption, value === 'AM' && styles.periodOptionActive, ...interactiveStateStyles(state)]}>
        <Text style={[styles.periodText, value === 'AM' && styles.periodTextActive]}>오전</Text>
      </Pressable>
      <Pressable onPress={() => onChange('PM')} style={(state) => [styles.periodOption, value === 'PM' && styles.periodOptionActive, ...interactiveStateStyles(state)]}>
        <Text style={[styles.periodText, value === 'PM' && styles.periodTextActive]}>오후</Text>
      </Pressable>
    </View>
  );
}

function TimeWheelColumn({ label, max, min, onChange, value }) {
  const normalizedValue = clampTimePart(value, max);
  const displayValue = max === 12 && normalizedValue === '00' ? '12' : normalizedValue;
  const [inputValue, setInputValue] = useState(displayValue);
  const previousValue = getWheelNeighbor(displayValue, min, max, -1);
  const nextValue = getWheelNeighbor(displayValue, min, max, 1);

  useEffect(() => {
    setInputValue(displayValue);
  }, [displayValue]);

  function handleChange(nextValue) {
    const normalizedNextValue = clampTimeRange(nextValue, min, max);
    setInputValue(normalizedNextValue);
    onChange(normalizedNextValue);
  }

  function handleInputChange(nextValue) {
    const digitsOnly = String(nextValue).replace(/\D/g, '').slice(-2);
    setInputValue(digitsOnly);
  }

  function handleInputBlur() {
    if (!inputValue) {
      setInputValue(displayValue);
      return;
    }

    handleChange(inputValue);
  }

  return (
    <View style={styles.timeWheelColumn}>
      <Text style={styles.timeWheelLabel}>{label}</Text>
      <Pressable onPress={() => handleChange(previousValue)} style={(state) => [styles.wheelSideButton, ...interactiveStateStyles(state)]}>
        <Text style={styles.wheelMutedText}>{previousValue}</Text>
      </Pressable>
      <AccessibleTextInput
        keyboardType="number-pad"
        maxLength={2}
        onBlur={handleInputBlur}
        onChangeText={handleInputChange}
        placeholder={min === 1 ? '12' : '00'}
        style={styles.wheelInput}
        value={inputValue}
      />
      <Pressable onPress={() => handleChange(nextValue)} style={(state) => [styles.wheelSideButton, ...interactiveStateStyles(state)]}>
        <Text style={styles.wheelMutedText}>{nextValue}</Text>
      </Pressable>
    </View>
  );
}

function CalendarIcon() {
  return (
    <View style={styles.calendarIcon}>
      <View style={styles.calendarIconHeader} />
      <View style={styles.calendarIconGrid}>
        {Array.from({ length: 4 }, (_, index) => (
          <View key={index} style={styles.calendarIconDot} />
        ))}
      </View>
    </View>
  );
}

function SpeakerIcon({ active }) {
  return (
    <View style={styles.speakerIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.speakerBody, active && styles.speakerBodyActive]} />
      <View style={[styles.speakerCone, active && styles.speakerConeActive]} />
      <View style={[styles.speakerWave, styles.speakerWaveInner, active && styles.speakerWaveActive]} />
      <View style={[styles.speakerWave, styles.speakerWaveOuter, active && styles.speakerWaveActive]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  contentContainer: {
    padding: 24,
    gap: 16
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  title: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '800'
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 4
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.panel,
    borderWidth: 1,
    gap: 12,
    padding: 18,
    ...shadows.card
  },
  friendlyPanel: {
    backgroundColor: colors.mintSoft,
    borderColor: colors.mint
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800'
  },
  sectionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between'
  },
  guideButton: {
    backgroundColor: colors.blueSoft,
    borderWidth: 1,
    borderColor: colors.blueSoft,
    borderRadius: radii.control,
    paddingHorizontal: 10,
    paddingVertical: 6,
    ...interactions.transition
  },
  guideButtonText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '800'
  },
  helperText: {
    color: colors.muted,
    fontSize: 12
  },
  patternInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  patternInfoCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.line,
    borderRadius: radii.card,
    borderWidth: 1,
    flex: 1,
    minWidth: 220,
    padding: 14
  },
  patternInfoTitle: {
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '900'
  },
  patternInfoText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 6
  },
  scaleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  magnifierCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.line,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    padding: 12
  },
  magnifierCardActive: {
    backgroundColor: colors.mintSoft,
    borderColor: colors.mintDeep
  },
  magnifierCopy: {
    flex: 1,
    gap: 4,
    minWidth: 180
  },
  magnifierTitle: {
    color: colors.blueDeep,
    fontSize: 14,
    fontWeight: '900'
  },
  voiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  voiceButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.line,
    borderRadius: radii.card,
    borderWidth: 1,
    justifyContent: 'center',
    gap: 4,
    minHeight: 88,
    minWidth: 160,
    overflow: 'hidden',
    padding: 8,
    ...interactions.transition
  },
  voiceSelectArea: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: radii.control,
    borderWidth: 1,
    gap: 4,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: 10,
    width: '100%',
    ...interactions.transition
  },
  voiceSelectAreaHover: {
    backgroundColor: colors.surface
  },
  voiceButtonText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800'
  },
  voiceTagText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center'
  },
  voicePreviewButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 30,
    paddingHorizontal: 10,
    width: '100%',
    ...interactions.transition
  },
  voicePreviewButtonActive: {
    backgroundColor: colors.mintSoft,
    borderColor: colors.mint
  },
  voicePreviewText: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '800'
  },
  voicePreviewTextActive: {
    color: colors.mintDeep
  },
  speakerIcon: {
    height: 16,
    position: 'relative',
    width: 18
  },
  speakerBody: {
    backgroundColor: colors.blueDeep,
    borderRadius: 2,
    height: 8,
    left: 0,
    position: 'absolute',
    top: 4,
    width: 5
  },
  speakerBodyActive: {
    backgroundColor: colors.mintDeep
  },
  speakerCone: {
    borderBottomWidth: 5,
    borderColor: 'transparent',
    borderRightColor: colors.blueDeep,
    borderRightWidth: 8,
    borderTopWidth: 5,
    height: 0,
    left: 4,
    position: 'absolute',
    top: 3,
    width: 0
  },
  speakerConeActive: {
    borderRightColor: colors.mintDeep
  },
  speakerWave: {
    borderColor: colors.blueDeep,
    borderLeftWidth: 0,
    borderRadius: 999,
    borderRightWidth: 2,
    borderTopWidth: 2,
    height: 8,
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
    width: 8
  },
  speakerWaveInner: {
    right: 1,
    top: 4
  },
  speakerWaveOuter: {
    right: -3,
    top: 2,
    height: 12,
    width: 12
  },
  speakerWaveActive: {
    borderColor: colors.mintDeep
  },
  scaleButton: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.line,
    borderRadius: radii.control,
    borderWidth: 1,
    minHeight: 40,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
    ...interactions.transition
  },
  activeButton: {
    backgroundColor: colors.blue,
    borderColor: colors.blue
  },
  scaleButtonText: {
    color: colors.ink,
    fontWeight: '700'
  },
  activeButtonText: {
    color: colors.surface
  },
  toggleRow: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: radii.control,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 8,
    ...interactions.transition
  },
  toggleRowActive: {
    borderColor: colors.mint,
    backgroundColor: colors.mintSoft
  },
  toggleLabel: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700'
  },
  toggle: {
    backgroundColor: colors.line,
    borderRadius: 14,
    height: 28,
    padding: 3,
    width: 52
  },
  toggleActive: {
    backgroundColor: colors.mintDeep
  },
  toggleKnob: {
    backgroundColor: colors.surface,
    borderRadius: 11,
    height: 22,
    width: 22
  },
  toggleKnobActive: {
    marginLeft: 24
  },
  textarea: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.control,
    borderWidth: 1,
    minHeight: 96,
    padding: 12,
    textAlignVertical: 'top'
  },
  ttsInputWrapper: {
    position: 'relative'
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.control,
    borderWidth: 1,
    minHeight: 44,
    padding: 12
  },
  reminderTaskInput: {
    minHeight: 88
  },
  alarmPickerPanel: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.line,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 14,
    padding: 16
  },
  alarmTimeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'center'
  },
  periodWheel: {
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    minWidth: 72
  },
  periodOption: {
    alignItems: 'center',
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 8,
    ...interactions.transition
  },
  periodOptionActive: {
    borderColor: colors.mint,
    backgroundColor: colors.surface
  },
  periodText: {
    color: colors.line,
    fontSize: 18,
    fontWeight: '900'
  },
  periodTextActive: {
    color: colors.ink,
    fontSize: 22
  },
  timeWheelColumn: {
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    minWidth: 96
  },
  timeWheelLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900'
  },
  wheelSideButton: {
    alignItems: 'center',
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 30,
    justifyContent: 'center',
    width: '100%',
    ...interactions.transition
  },
  wheelMutedText: {
    color: colors.line,
    fontSize: 28,
    fontWeight: '900'
  },
  wheelInput: {
    color: colors.ink,
    fontSize: 44,
    fontWeight: '900',
    minHeight: 58,
    minWidth: 86,
    paddingHorizontal: 0,
    paddingVertical: 0,
    textAlign: 'center'
  },
  alarmColon: {
    color: colors.ink,
    fontSize: 36,
    fontWeight: '900',
    marginTop: 20
  },
  alarmDateCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  dateCardLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 4
  },
  dateValueText: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
    minWidth: 160
  },
  calendarButton: {
    alignItems: 'center',
    backgroundColor: colors.blueSoft,
    borderWidth: 1,
    borderColor: colors.blueSoft,
    borderRadius: radii.control,
    height: 36,
    justifyContent: 'center',
    width: 36,
    ...interactions.transition
  },
  calendarIcon: {
    backgroundColor: colors.surface,
    borderColor: colors.blue,
    borderRadius: 4,
    borderWidth: 2,
    height: 20,
    overflow: 'hidden',
    width: 20
  },
  calendarIconHeader: {
    backgroundColor: colors.blue,
    height: 5,
    width: '100%'
  },
  calendarIconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    padding: 3
  },
  calendarIconDot: {
    backgroundColor: colors.mint,
    borderRadius: 1,
    height: 4,
    width: 4
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.blue,
    borderWidth: 1,
    borderColor: colors.blue,
    borderRadius: radii.control,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
    ...interactions.transition
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '800'
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.line,
    borderRadius: radii.control,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
    ...interactions.transition
  },
  disabledButton: {
    opacity: 0.55
  },
  secondaryButtonText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700'
  },
  statusText: {
    color: colors.muted,
    textAlign: 'center'
  },
  successText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '700'
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700'
  },
  readableParagraph: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  readableParagraphText: {
    flexShrink: 1
  },
  inlineReadButton: {
    backgroundColor: colors.blueSoft,
    borderWidth: 1,
    borderColor: colors.blueSoft,
    borderRadius: radii.control,
    paddingHorizontal: 8,
    paddingVertical: 5,
    ...interactions.transition
  },
  inlineReadButtonText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '800'
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: 24
  },
  modalPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.mint,
    borderRadius: radii.panel,
    borderWidth: 1,
    gap: 12,
    maxWidth: 520,
    padding: 20,
    width: '100%',
    ...shadows.card
  },
  modalTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900'
  },
  modalStep: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900'
  },
  modalBody: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 22
  },
  modalActionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end'
  },
  modalGhostButton: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 12,
    ...interactions.transition
  },
  modalGhostButtonText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800'
  },
  modalOutlineButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.line,
    borderRadius: radii.control,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 16,
    ...interactions.transition
  },
  modalOutlineButtonText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800'
  },
  modalButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: colors.mintDeep,
    borderWidth: 1,
    borderColor: colors.mintDeep,
    borderRadius: radii.control,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 18,
    ...interactions.transition
  },
  modalButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '800'
  },
  calendarPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.panel,
    borderWidth: 1,
    gap: 14,
    maxWidth: 420,
    padding: 18,
    width: '100%'
  },
  calendarHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  calendarTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900'
  },
  calendarNavRow: {
    flexDirection: 'row',
    gap: 8
  },
  calendarNavButton: {
    backgroundColor: colors.blueSoft,
    borderWidth: 1,
    borderColor: colors.blueSoft,
    borderRadius: radii.control,
    paddingHorizontal: 10,
    paddingVertical: 7,
    ...interactions.transition
  },
  calendarNavText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '800'
  },
  weekdayGrid: {
    flexDirection: 'row'
  },
  weekdayText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
    width: `${100 / 7}%`
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 6
  },
  calendarDayButton: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: `${100 / 7}%`,
    ...interactions.transition
  },
  calendarDayButtonActive: {
    backgroundColor: colors.blue
  },
  calendarDayButtonToday: {
    borderColor: colors.mintDeep,
    borderWidth: 1.5
  },
  calendarDayText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800'
  },
  calendarDayTextMuted: {
    color: colors.line
  },
  calendarDayTextActive: {
    color: colors.surface
  },
  calendarDayTextToday: {
    color: colors.mintDeep,
    fontWeight: '900'
  },
  highContrast: {
    backgroundColor: '#050505'
  },
  highContrastText: {
    color: '#FFFFFF'
  },
  highContrastSubText: {
    color: '#FDE68A'
  }
});
