import { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
import { Modal, StyleSheet, Text, Pressable, View } from 'react-native';
import { getAccessibilityPreferences, requestTextToSpeech, getReviewReminders } from '../services/api';

export const voiceOptions = [
  {
    label: '차분한 낮은 톤',
    value: 'ADULT_MALE',
    pitch: 0.82,
    rate: 0.84,
    genderHint: 'male',
    tag: '낮은 톤 학습 안내',
    help: '브라우저가 제공하는 한국어 음성을 낮은 톤과 느린 속도로 조정해 차분하게 들려줍니다.'
  },
  {
    label: '부드러운 기본 톤',
    value: 'ADULT_FEMALE',
    pitch: 1.02,
    rate: 0.88,
    genderHint: 'female',
    tag: '기본 학습 안내',
    help: '기본 추천 음성 톤입니다. 브라우저가 제공하는 한국어 음성을 부드럽고 또렷하게 들려줍니다.'
  },
  {
    label: '밝은 낮은 톤',
    value: 'CHILD_BOY',
    pitch: 1.18,
    rate: 0.8,
    genderHint: 'male',
    tag: '밝은 톤 학습 안내',
    help: '전용 아동 목소리는 아니지만, 브라우저가 제공하는 목소리를 조금 더 밝고 천천히 들리도록 조정합니다.'
  },
  {
    label: '밝은 높은 톤',
    value: 'CHILD_GIRL',
    pitch: 1.32,
    rate: 0.82,
    genderHint: 'female',
    tag: '높은 톤 학습 안내',
    help: '전용 아동 목소리는 아니지만, 브라우저가 제공하는 목소리를 조금 더 밝고 천천히 들리도록 조정합니다.'
  }
];

const defaultPreference = {
  textScale: 1,
  highContrast: false,
  elementaryFriendlyUi: false,
  voiceInputEnabled: false,
  voiceOutputEnabled: false,
  reviewReminderEnabled: false,
  reminderTime: ''
};
const AccessibilityContext = createContext(null);

function hasSpeechSynthesis() {
  return typeof globalThis !== 'undefined' && Boolean(globalThis.speechSynthesis);
}

function getVoiceOption(voiceType) {
  return voiceOptions.find((option) => option.value === voiceType) || voiceOptions[1];
}

function findBrowserVoice(voiceType, loadedVoices = [], lang = 'ko-KR') {
  if (!hasSpeechSynthesis()) {
    return null;
  }

  const voices = loadedVoices.length > 0
    ? loadedVoices
    : globalThis.speechSynthesis.getVoices?.() || [];
  const languagePrefix = String(lang || 'ko-KR').split('-')[0].toLowerCase();
  const languageVoices = voices.filter((voice) => voice.lang?.toLowerCase().startsWith(languagePrefix));
  const candidates = languageVoices.length > 0 ? languageVoices : voices;
  const option = getVoiceOption(voiceType);
  const genderHints = option.genderHint === 'male'
    ? ['male', 'man', '남성', '남자']
    : ['female', 'woman', '여성', '여자'];

  return candidates.find((voice) => (
    genderHints.some((hint) => voice.name.toLowerCase().includes(hint.toLowerCase()))
  )) || candidates[0] || null;
}

export function AccessibilityProvider({ children, token }) {
  const [preference, setPreference] = useState(defaultPreference);
  const [voiceType, setVoiceType] = useState('ADULT_FEMALE');
  const [reading, setReading] = useState({
    id: null,
    charIndex: -1,
    active: false
  });
  const [browserVoices, setBrowserVoices] = useState([]);
  const [previewingVoiceType, setPreviewingVoiceType] = useState(null);
  const [speechError, setSpeechError] = useState('');
  const [activeAlertNotification, setActiveAlertNotification] = useState(null);
  const alarmsRef = useRef({});

  // 모든 로컬 타이머 해제
  const clearAllAlarms = () => {
    Object.values(alarmsRef.current).forEach(clearTimeout);
    alarmsRef.current = {};
  };

  // 로컬 타이머 등록
  const scheduleAlarm = (alarmId, scheduledAt, message) => {
    const delayMs = new Date(scheduledAt).getTime() - Date.now();
    const thresholdMs = -60000; // 최근 1분 이내만 알람 실행

    if (delayMs > thresholdMs) {
      if (alarmsRef.current[alarmId]) {
        clearTimeout(alarmsRef.current[alarmId]);
      }

      const triggerAlarm = () => {
        const parts = String(message || '').split(' - ');
        const title = parts[0] || '복습 알림';
        const task = parts[1] || '';

        // 1. 커스텀 모달 알람 노출
        setActiveAlertNotification({
          id: alarmId,
          title,
          task
        });
        // 2. TTS 자동 음성 안내
        const isKid = preference.elementaryFriendlyUi;
        const ttsMessage = isKid
          ? `공부 약속 시간이에요! ${title}. ${task ? `${task}. 신나게 시작해봐요!` : ''}`
          : `복습 시간입니다. ${title}. ${task}`;
        speakText(ttsMessage);
        delete alarmsRef.current[alarmId];
      };

      if (delayMs <= 0) {
        triggerAlarm();
      } else {
        alarmsRef.current[alarmId] = setTimeout(triggerAlarm, delayMs);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadPreference() {
      if (!token) {
        setPreference(defaultPreference);
        return;
      }

      try {
        const result = await getAccessibilityPreferences(token);

        if (isMounted) {
          setPreference({
            ...defaultPreference,
            ...result.preference,
            reminderTime: result.preference?.reminderTime || ''
          });
        }
      } catch (error) {
        if (isMounted) {
          setPreference(defaultPreference);
        }
      }
    }

    loadPreference();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (!hasSpeechSynthesis()) {
      setBrowserVoices([]);
      return undefined;
    }

    const synthesis = globalThis.speechSynthesis;
    const updateVoices = () => {
      setBrowserVoices(synthesis.getVoices?.() || []);
    };
    const previousHandler = synthesis.onvoiceschanged;
    const handleVoicesChanged = (event) => {
      previousHandler?.(event);
      updateVoices();
    };

    updateVoices();
    synthesis.onvoiceschanged = handleVoicesChanged;

    return () => {
      if (synthesis.onvoiceschanged === handleVoicesChanged) {
        synthesis.onvoiceschanged = previousHandler || null;
      } else if (previousHandler) {
        synthesis.onvoiceschanged = previousHandler;
      }
    };
  }, []);

  // 알림 토큰 변경 시 백엔드 조회하여 스케줄 복구 (수동으로 예약된 알림들은 무조건 긁어옴)
  useEffect(() => {
    if (!token) {
      clearAllAlarms();
      return;
    }

    let isMounted = true;

    async function loadAndScheduleReminders() {
      try {
        const result = await getReviewReminders(token);
        if (!isMounted) return;

        const now = Date.now();
        (result.reminders || []).forEach((reminder) => {
          const delayMs = new Date(reminder.scheduledAt).getTime() - now;
          if (delayMs > -60000) {
            scheduleAlarm(reminder.id, reminder.scheduledAt, reminder.message);
          }
        });
      } catch (error) {
        console.error('Failed to load review reminders:', error);
      }
    }

    loadAndScheduleReminders();

    return () => {
      isMounted = false;
      clearAllAlarms();
    };
  }, [token, preference.reviewReminderEnabled]);

  function stopSpeech() {
    if (hasSpeechSynthesis()) {
      globalThis.speechSynthesis.cancel();
    }
    setReading({ id: null, charIndex: -1, active: false });
    setPreviewingVoiceType(null);
  }

  function playBrowserSpeech(text, options = {}) {
    if (!hasSpeechSynthesis()) {
      setSpeechError('현재 브라우저는 읽어주기를 지원하지 않습니다.');
      return false;
    }

    const activeVoiceType = options.voiceType || voiceType;
    const selectedOption = getVoiceOption(activeVoiceType);
    const speechLanguage = options.lang || 'ko-KR';
    globalThis.speechSynthesis.cancel();
    globalThis.speechSynthesis.resume?.();
    const utterance = new globalThis.SpeechSynthesisUtterance(text);
    utterance.lang = speechLanguage;
    utterance.volume = 1;
    utterance.pitch = selectedOption.pitch;
    utterance.rate = selectedOption.rate;
    const browserVoice = findBrowserVoice(activeVoiceType, browserVoices, speechLanguage);

    if (browserVoice) {
      utterance.voice = browserVoice;
    }

    utterance.onstart = () => {
      setReading({ id: options.readingId || null, charIndex: 0, active: true });
      setPreviewingVoiceType(options.previewVoiceType || null);
    };
    utterance.onboundary = (event) => {
      if (typeof event.charIndex === 'number') {
        setReading({ id: options.readingId || null, charIndex: event.charIndex, active: true });
      }
    };
    utterance.onend = () => {
      setReading({ id: null, charIndex: -1, active: false });
      setPreviewingVoiceType(null);
    };
    utterance.onerror = () => {
      setReading({ id: null, charIndex: -1, active: false });
      setPreviewingVoiceType(null);
      setSpeechError('읽어주기에 실패했습니다. Chrome 사이트 소리 권한과 기기 볼륨을 확인해 주세요.');
    };

    globalThis.speechSynthesis.speak(utterance);
    return true;
  }

  async function speakText(text, options = {}) {
    const trimmedText = String(text || '').trim();
    if (!trimmedText) return false;

    setSpeechError('');
    const started = playBrowserSpeech(trimmedText, {
      previewVoiceType: options.previewVoiceType || null,
      readingId: options.readingId || null,
      lang: options.lang || 'ko-KR',
      voiceType: options.voiceType || voiceType
    });
    if (!started) return false;

    if (options.saveRequest && token) {
      await requestTextToSpeech(token, { text: trimmedText, voiceType: options.voiceType || voiceType });
    }

    return true;
  }

  const value = useMemo(() => ({
    preference,
    previewingVoiceType,
    reading,
    setPreference,
    setVoiceType,
    speakText,
    speechError,
    stopSpeech,
    voiceType,
    scheduleAlarm
  }), [preference, previewingVoiceType, reading, speechError, voiceType, browserVoices]);

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      {activeAlertNotification && (
        <Modal
          animationType="fade"
          transparent
          visible={!!activeAlertNotification}
          onRequestClose={() => setActiveAlertNotification(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalPanel}>
              <Text style={styles.alarmEmoji}>🔔</Text>
              <Text style={styles.modalTitle}>
                {preference.elementaryFriendlyUi ? '🎒 공부할 약속 시간이에요!' : '복습할 시간이에요!'}
              </Text>
              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>{activeAlertNotification.title}</Text>
                {activeAlertNotification.task ? (
                  <Text style={styles.infoTask}>{activeAlertNotification.task}</Text>
                ) : null}
              </View>
              <View style={styles.modalActionRow}>
                <Pressable
                  onPress={() => setActiveAlertNotification(null)}
                  style={styles.modalConfirmButton}
                >
                  <Text style={styles.modalConfirmButtonText}>
                    {preference.elementaryFriendlyUi ? '👍 네, 알겠어요!' : '확인'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);

  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }

  return context;
}

const styles = StyleSheet.create({
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    flex: 1,
    justifyContent: 'center',
    padding: 24
  },
  modalPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#3B82F6',
    borderRadius: 16,
    borderWidth: 2,
    gap: 16,
    maxWidth: 420,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8
  },
  alarmEmoji: {
    fontSize: 48,
    marginBottom: -8
  },
  modalTitle: {
    color: '#1E3A8A',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center'
  },
  infoBox: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    width: '100%',
    gap: 8
  },
  infoTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center'
  },
  infoTask: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center'
  },
  modalActionRow: {
    width: '100%',
    marginTop: 8
  },
  modalConfirmButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 10,
    minHeight: 48,
    justifyContent: 'center',
    width: '100%'
  },
  modalConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800'
  }
});
