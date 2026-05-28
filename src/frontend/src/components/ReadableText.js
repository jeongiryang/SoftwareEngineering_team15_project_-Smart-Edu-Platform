import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAccessibility } from '../contexts/AccessibilityContext';

function createReadingId(text) {
  return `readable-${text.slice(0, 20)}-${text.length}`;
}

export default function ReadableText({ children, style }) {
  const text = String(children || '');
  const readingId = useMemo(() => createReadingId(text), [text]);
  const { preference, reading, speakText } = useAccessibility();
  const isReading = reading.active && reading.id === readingId;
  const targetCharIndex = isReading ? Math.min(Math.max(reading.charIndex, 0), text.length - 1) : -1;
  const [displayCharIndex, setDisplayCharIndex] = useState(-1);

  useEffect(() => {
    if (!isReading || targetCharIndex < 0) {
      setDisplayCharIndex(-1);
      return undefined;
    }

    setDisplayCharIndex((currentIndex) => {
      if (currentIndex < 0) {
        return targetCharIndex;
      }

      return currentIndex;
    });

    const timer = setInterval(() => {
      setDisplayCharIndex((currentIndex) => {
        if (currentIndex < 0) {
          return targetCharIndex;
        }

        if (currentIndex === targetCharIndex) {
          return currentIndex;
        }

        return currentIndex + (currentIndex < targetCharIndex ? 1 : -1);
      });
    }, 45);

    return () => {
      clearInterval(timer);
    };
  }, [isReading, targetCharIndex]);

  if (!preference.voiceOutputEnabled) {
    return <Text style={style}>{text}</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={[style, styles.text]}>
        {displayCharIndex >= 0 ? (
          <>
            <Text>{text.slice(0, displayCharIndex)}</Text>
            <Text style={styles.readingChar}>{text.charAt(displayCharIndex)}</Text>
            <Text>{text.slice(displayCharIndex + 1)}</Text>
          </>
        ) : text}
      </Text>
      <Pressable
        onPress={() => speakText(text, { readingId })}
        style={[styles.button, isReading && styles.buttonActive]}
      >
        <Text style={[styles.buttonText, isReading && styles.buttonTextActive]}>
          {isReading ? '읽는 중' : '읽어주기'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  text: {
    flexShrink: 1
  },
  readingChar: {
    color: '#2563EB',
    fontWeight: '900'
  },
  button: {
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5
  },
  buttonActive: {
    backgroundColor: '#2563EB'
  },
  buttonText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '800'
  },
  buttonTextActive: {
    color: '#FFFFFF'
  }
});
