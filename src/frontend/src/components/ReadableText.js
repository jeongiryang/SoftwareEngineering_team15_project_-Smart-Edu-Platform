import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { colors } from '../styles/theme';

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
    <Text onPress={() => speakText(text, { readingId })} style={[style, styles.text]}>
      {displayCharIndex >= 0 ? (
        <>
          <Text>{text.slice(0, displayCharIndex)}</Text>
          <Text style={styles.readingChar}>{text.charAt(displayCharIndex)}</Text>
          <Text>{text.slice(displayCharIndex + 1)}</Text>
        </>
      ) : text}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    flexShrink: 1
  },
  readingChar: {
    color: colors.blue,
    fontWeight: '900'
  }
});
