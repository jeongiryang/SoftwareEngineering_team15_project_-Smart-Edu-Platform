import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import { colors } from '../styles/theme';

function getPrefersReducedMotion() {
  const browserWindow = typeof globalThis !== 'undefined' ? globalThis.window : null;

  if (Platform.OS !== 'web' || !browserWindow?.matchMedia) {
    return false;
  }

  return browserWindow.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function WritingEraseText({
  text,
  style,
  cursorStyle,
  writeInterval = 140,
  eraseInterval = 70,
  holdMs = 1300,
  pauseMs = 420,
  writingMark = '✎',
  erasingMark,
  accessibilityLabel,
  ...textProps
}) {
  const letters = useMemo(() => Array.from(text || ''), [text]);
  const [phase, setPhase] = useState('writing');
  const [visibleCount, setVisibleCount] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(getPrefersReducedMotion);

  useEffect(() => {
    const browserWindow = typeof globalThis !== 'undefined' ? globalThis.window : null;

    if (Platform.OS !== 'web' || !browserWindow?.matchMedia) {
      return undefined;
    }

    const mediaQuery = browserWindow.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionPreference = (event) => {
      setReducedMotion(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMotionPreference);
    } else {
      mediaQuery.addListener(handleMotionPreference);
    }

    setReducedMotion(mediaQuery.matches);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMotionPreference);
      } else {
        mediaQuery.removeListener(handleMotionPreference);
      }
    };
  }, []);

  useEffect(() => {
    if (reducedMotion || letters.length === 0) {
      setVisibleCount(letters.length);
      setPhase('idle');
      return undefined;
    }

    setVisibleCount(0);
    setPhase('writing');
    return undefined;
  }, [letters.length, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || letters.length === 0) {
      return undefined;
    }

    let timer;

    if (phase === 'writing') {
      if (visibleCount < letters.length) {
        timer = setTimeout(() => {
          setVisibleCount((current) => Math.min(current + 1, letters.length));
        }, writeInterval);
      } else {
        timer = setTimeout(() => {
          setPhase('erasing');
        }, holdMs);
      }
    }

    if (phase === 'erasing') {
      if (visibleCount > 0) {
        timer = setTimeout(() => {
          setVisibleCount((current) => Math.max(current - 1, 0));
        }, eraseInterval);
      } else {
        timer = setTimeout(() => {
          setPhase('writing');
        }, pauseMs);
      }
    }

    return () => {
      clearTimeout(timer);
    };
  }, [eraseInterval, holdMs, letters.length, pauseMs, phase, reducedMotion, visibleCount, writeInterval]);

  const visibleText = reducedMotion ? text : letters.slice(0, visibleCount).join('');
  const showMarker = !reducedMotion && letters.length > 0;
  const isErasing = phase === 'erasing';

  return (
    <Text {...textProps} accessibilityLabel={accessibilityLabel || text} style={[styles.text, style]}>
      {visibleText || ' '}
      {showMarker && isErasing && !erasingMark ? (
        <Text
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={[styles.cursor, cursorStyle, styles.eraserCursor]}
        >
          <Text style={styles.eraserBand}>▌</Text>
          <Text style={styles.eraserBody}>▰</Text>
        </Text>
      ) : null}
      {showMarker && (!isErasing || erasingMark) ? (
        <Text accessibilityElementsHidden importantForAccessibility="no" style={[styles.cursor, cursorStyle]}>
          {isErasing ? erasingMark : writingMark}
        </Text>
      ) : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    letterSpacing: 0
  },
  cursor: {
    color: colors.creamStrong,
    fontWeight: '800'
  },
  eraserCursor: {
    letterSpacing: 0,
    transform: [{ rotate: '-8deg' }]
  },
  eraserBand: {
    color: colors.mintDeep,
    fontWeight: '900',
    letterSpacing: 0
  },
  eraserBody: {
    color: colors.creamStrong,
    fontWeight: '900',
    letterSpacing: 0
  }
});
