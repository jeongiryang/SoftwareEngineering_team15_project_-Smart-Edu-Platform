import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAccessibility } from '../contexts/AccessibilityContext';
import ConfirmModal from './ConfirmModal';
import { colors, radii } from '../styles/theme';

function getRecognition() {
  if (typeof globalThis === 'undefined') {
    return null;
  }

  return globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition || null;
}

export default function AccessibleTextInput({
  containerStyle,
  enableVoiceInput = true,
  forceVoiceInput = false,
  onChangeText,
  secureTextEntry,
  value,
  ...props
}) {
  const { preference } = useAccessibility();
  const [listening, setListening] = useState(false);
  const [hasVoiceInputResult, setHasVoiceInputResult] = useState(false);
  const [voiceAlert, setVoiceAlert] = useState('');
  const recognitionRef = useRef(null);
  const baseTranscriptRef = useRef('');
  const manualStopRef = useRef(false);
  const voiceHighlightTimerRef = useRef(null);
  const shouldShowVoiceButton = (forceVoiceInput || preference.voiceInputEnabled) && enableVoiceInput && !secureTextEntry;

  useEffect(() => () => {
    if (voiceHighlightTimerRef.current) {
      clearTimeout(voiceHighlightTimerRef.current);
    }
  }, []);

  function stopListening() {
    manualStopRef.current = true;
    recognitionRef.current?.stop?.();
    recognitionRef.current = null;
    setListening(false);
  }

  function startListening() {
    const Recognition = getRecognition();

    if (!Recognition) {
      setVoiceAlert('현재 브라우저는 음성 입력을 지원하지 않습니다. Chrome 또는 Edge에서 다시 시도해 주세요.');
      return;
    }

    setVoiceAlert('');
    setHasVoiceInputResult(false);
    manualStopRef.current = false;
    baseTranscriptRef.current = String(value || '').trim();
    const recognition = new Recognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setListening(true);
    };
    recognition.onresult = (event) => {
      let finalText = baseTranscriptRef.current;
      let interimText = '';

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const text = event.results[index]?.[0]?.transcript || '';

        if (event.results[index].isFinal) {
          finalText = `${finalText}${finalText ? ' ' : ''}${text.trim()}`.trim();
          baseTranscriptRef.current = finalText;
        } else {
          interimText += text;
        }
      }

      const nextValue = `${finalText}${interimText ? ` ${interimText.trim()}` : ''}`.trim();
      if (nextValue) {
        setHasVoiceInputResult(true);
        if (voiceHighlightTimerRef.current) {
          clearTimeout(voiceHighlightTimerRef.current);
        }
        voiceHighlightTimerRef.current = setTimeout(() => {
          setHasVoiceInputResult(false);
          voiceHighlightTimerRef.current = null;
        }, 900);
      }
      onChangeText?.(nextValue);
    };
    recognition.onerror = (event) => {
      const errorType = event?.error || '';

      if (manualStopRef.current || errorType === 'aborted' || errorType === 'no-speech') {
        setVoiceAlert('');
        setListening(false);
        return;
      }

      if (errorType === 'not-allowed' || errorType === 'service-not-allowed') {
        setVoiceAlert('마이크 권한이 필요합니다. 브라우저 사이트 설정에서 마이크를 허용해 주세요.');
      } else if (errorType === 'audio-capture') {
        setVoiceAlert('마이크를 찾지 못했습니다. 기기 마이크 연결을 확인해 주세요.');
      } else if (errorType === 'network') {
        setVoiceAlert('음성 입력 연결이 불안정합니다. 잠시 후 다시 시도해 주세요.');
      } else {
        setVoiceAlert('음성 입력을 시작하지 못했습니다. 브라우저와 마이크 상태를 확인해 주세요.');
      }
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
      manualStopRef.current = false;
      recognitionRef.current = null;
    };
    recognition.start();
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.inputRow}>
        <TextInput
          {...props}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          value={value}
          style={[
            props.style,
            styles.flexInput,
            hasVoiceInputResult && styles.voiceInputResult
          ]}
        />
        {shouldShowVoiceButton ? (
          <Pressable
            onPress={listening ? stopListening : startListening}
            style={[styles.voiceButton, listening && styles.voiceButtonActive]}
          >
            <Text style={[styles.voiceButtonText, listening && styles.voiceButtonTextActive]}>
              {listening
                ? (preference.elementaryFriendlyUi ? '🛑 멈추기' : '🛑 입력 중지')
                : (preference.elementaryFriendlyUi ? '🎙️ 말하기로 글쓰기' : '🎙️ 음성입력')}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <ConfirmModal
        confirmLabel="확인"
        description={voiceAlert}
        onCancel={() => setVoiceAlert('')}
        onConfirm={() => setVoiceAlert('')}
        showCancel={false}
        title="음성 입력을 사용할 수 없습니다"
        visible={Boolean(voiceAlert)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
    width: '100%'
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%'
  },
  flexInput: {
    flex: 1
  },
  voiceInputResult: {
    backgroundColor: colors.mintSoft,
    borderColor: colors.mint
  },
  voiceButton: {
    backgroundColor: colors.blueSoft,
    borderColor: colors.line,
    borderRadius: radii.control,
    borderWidth: 1,
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center'
  },
  voiceButtonActive: {
    backgroundColor: colors.blue,
    borderColor: colors.blue
  },
  voiceButtonText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '800'
  },
  voiceButtonTextActive: {
    color: colors.surface
  },
});
