import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAccessibility } from '../contexts/AccessibilityContext';

function getRecognition() {
  if (typeof globalThis === 'undefined') {
    return null;
  }

  return globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition || null;
}

export default function AccessibleTextInput({
  containerStyle,
  enableVoiceInput = true,
  onChangeText,
  secureTextEntry,
  value,
  ...props
}) {
  const { preference } = useAccessibility();
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const recognitionRef = useRef(null);
  const baseTranscriptRef = useRef('');
  const shouldShowVoiceButton = preference.voiceInputEnabled && enableVoiceInput && !secureTextEntry;

  function stopListening() {
    recognitionRef.current?.stop?.();
    recognitionRef.current = null;
    setListening(false);
  }

  function startListening() {
    const Recognition = getRecognition();

    if (!Recognition) {
      setVoiceError('현재 브라우저는 음성 입력을 지원하지 않습니다.');
      return;
    }

    setVoiceError('');
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

      setInterimTranscript(interimText.trim());
      onChangeText?.(`${finalText}${interimText ? ` ${interimText.trim()}` : ''}`.trim());
    };
    recognition.onerror = () => {
      setVoiceError('음성 입력을 인식하지 못했습니다. 다시 시도해 주세요.');
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
      setInterimTranscript('');
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
          style={[props.style, styles.flexInput]}
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
      {listening && value ? (
        <View style={styles.previewBox}>
          <Text style={styles.previewText}>
            <Text>{String(value).slice(0, Math.max(String(value).length - interimTranscript.length, 0))}</Text>
            {interimTranscript ? (
              <Text style={styles.previewActiveText}>{String(value).slice(-interimTranscript.length)}</Text>
            ) : null}
          </Text>
        </View>
      ) : null}
      {voiceError ? <Text style={styles.errorText}>{voiceError}</Text> : null}
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
  voiceButton: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center'
  },
  voiceButtonActive: {
    backgroundColor: '#2563EB'
  },
  voiceButtonText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '800'
  },
  voiceButtonTextActive: {
    color: '#FFFFFF'
  },
  previewBox: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 6,
    borderWidth: 1,
    padding: 8
  },
  previewText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700'
  },
  previewActiveText: {
    backgroundColor: '#DBEAFE',
    color: '#2563EB',
    fontWeight: '900'
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '700'
  }
});
