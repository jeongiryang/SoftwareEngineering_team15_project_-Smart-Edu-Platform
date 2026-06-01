import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../i18n';
import { colors } from '../styles/theme';

const PARTICLE_TOKENS = [
  '∫',
  '∑',
  'π',
  '√',
  'log',
  'lim',
  'dx',
  'f(x)',
  'x²',
  '∆',
  'θ',
  'AI',
  'NOTE',
  'PLAN',
  'FOCUS',
  'QUIZ',
  'TODO',
  'ASK',
  'REVIEW',
  'DFS',
  'API',
  'JSON',
  'SQL',
  'stack',
  'graph',
  'memo',
  'card',
  'D-12',
  '100%',
  'Q',
  'A',
  'badge',
  'point'
];

const PARTICLE_POINTS = PARTICLE_TOKENS.map((token, index) => {
  const targetColumn = index % 11;
  const targetRow = Math.floor(index / 11);
  const pencilBodyX = 25 + targetColumn * 4.6;
  const pencilBodyY = 43 + targetRow * 4.8 + (targetColumn % 2) * 1.2;
  const isTip = index > 27;

  return {
    token,
    startX: 8 + ((index * 23) % 84),
    startY: 10 + ((index * 31) % 78),
    targetX: isTip ? 76 + (index - 28) * 2.2 : pencilBodyX,
    targetY: isTip ? 45 + ((index - 28) % 3) * 3.2 : pencilBodyY,
    rotate: -28 + ((index * 17) % 56)
  };
});

function getPrefersReducedMotion() {
  const browserWindow = typeof globalThis !== 'undefined' ? globalThis.window : null;

  if (Platform.OS !== 'web' || !browserWindow?.matchMedia) {
    return false;
  }

  return browserWindow.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function ParticlePencilIntro({ visible, onDone }) {
  const { t } = useLanguage();
  const [stage, setStage] = useState('scatter');
  const [writeProgress, setWriteProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(getPrefersReducedMotion);
  const isWriting = stage === 'write' || stage === 'exit' || reducedMotion;
  const isPencilVisible = stage === 'pencil' || stage === 'write' || stage === 'exit' || reducedMotion;

  useEffect(() => {
    const browserWindow = typeof globalThis !== 'undefined' ? globalThis.window : null;

    if (Platform.OS !== 'web' || !browserWindow?.matchMedia) {
      return undefined;
    }

    const mediaQuery = browserWindow.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionPreference = (event) => setReducedMotion(event.matches);

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
    if (!visible) {
      return undefined;
    }

    setStage(reducedMotion ? 'pencil' : 'scatter');
    setWriteProgress(reducedMotion ? 100 : 0);

    if (reducedMotion) {
      const timer = setTimeout(onDone, 1500);
      return () => clearTimeout(timer);
    }

    const timers = [
      setTimeout(() => setStage('gather'), 420),
      setTimeout(() => setStage('pencil'), 2700),
      setTimeout(() => setStage('write'), 3900),
      setTimeout(() => setStage('exit'), 7200),
      setTimeout(onDone, 7900)
    ];
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [onDone, reducedMotion, visible]);

  useEffect(() => {
    if (!visible || stage !== 'write' || reducedMotion) {
      return undefined;
    }

    setWriteProgress(0);

    const writer = setInterval(() => {
      setWriteProgress((current) => {
        if (current >= 100) {
          return 100;
        }

        return Math.min(current + 3.4, 100);
      });
    }, 70);

    return () => clearInterval(writer);
  }, [reducedMotion, stage, visible]);

  const particleStyles = useMemo(
    () =>
      PARTICLE_POINTS.map((particle) => {
        const gathered = stage !== 'scatter';
        const faded = stage === 'pencil' || stage === 'write' || stage === 'exit';

        return {
          left: `${gathered ? particle.targetX : particle.startX}%`,
          top: `${gathered ? particle.targetY : particle.startY}%`,
          opacity: faded ? 0.2 : gathered ? 0.95 : 0.78,
          transform: [
            { translateX: -12 },
            { translateY: -12 },
            { rotate: `${gathered ? -12 : particle.rotate}deg` },
            { scale: faded ? 0.72 : gathered ? 1 : 0.84 }
          ]
        };
      }),
    [stage]
  );

  if (!visible) {
    return null;
  }

  return (
    <View
      accessibilityLabel={t('landing.intro.accessibilityLabel', '사각사각 소개 인트로')}
      style={[styles.overlay, stage === 'exit' && styles.overlayExit]}
    >
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.particleLayer}>
        {PARTICLE_POINTS.map((particle, index) => (
          <Text key={`${particle.token}-${index}`} style={[styles.particle, particleStyles[index]]}>
            {particle.token}
          </Text>
        ))}
      </View>

      <View pointerEvents="none" style={[styles.pencilStage, isPencilVisible && styles.pencilStageVisible]}>
        <View style={styles.pencilShadow} />
        <View style={styles.pencil}>
          <View style={styles.pencilEraser} />
          <View style={styles.pencilBody}>
            <View style={styles.pencilStripe} />
          </View>
          <View style={styles.pencilWood} />
          <View style={styles.pencilTip} />
        </View>
      </View>

      <View pointerEvents="none" style={[styles.wordStage, isWriting && styles.wordStageVisible]}>
        <Text style={styles.wordGhost}>사각사각</Text>
        <View style={[styles.wordReveal, { width: `${writeProgress}%` }]}>
          <Text style={styles.wordText}>사각사각</Text>
        </View>
        <View style={[styles.wordPencil, { left: `${Math.min(Math.max(writeProgress, 5), 94)}%` }]}>
          <View style={styles.wordPencilBody} />
          <View style={styles.wordPencilTip} />
        </View>
      </View>

      <View style={styles.caption}>
        <Text style={styles.captionTitle}>Sagak Sagak</Text>
        <Text style={styles.captionText}>
          {t('landing.intro.subtitle', '흩어진 학습 신호가 모여 오늘의 공부를 그립니다.')}
        </Text>
      </View>

      <Pressable accessibilityRole="button" onPress={onDone} style={styles.skipButton}>
        <Text style={styles.skipButtonText}>{t('landing.intro.skip', '인트로 건너뛰기')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#0D2035',
    overflow: 'hidden',
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    transitionDuration: '620ms',
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: 'ease-out'
  },
  overlayExit: {
    opacity: 0,
    transform: [{ scale: 1.04 }]
  },
  particleLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  },
  particle: {
    position: 'absolute',
    color: '#D9FFF7',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0,
    textShadowColor: 'rgba(115, 201, 189, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    transitionDuration: '1700ms',
    transitionProperty: 'left, top, opacity, transform',
    transitionTimingFunction: 'cubic-bezier(0.18, 0.82, 0.25, 1)'
  },
  pencilStage: {
    width: '78%',
    maxWidth: 360,
    minHeight: 118,
    opacity: 0,
    transform: [{ translateY: 20 }, { scale: 0.92 }],
    transitionDuration: '850ms',
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: 'ease-out',
    alignItems: 'center',
    justifyContent: 'center'
  },
  pencilStageVisible: {
    opacity: 1,
    transform: [{ translateY: 0 }, { scale: 1 }]
  },
  pencilShadow: {
    position: 'absolute',
    bottom: 18,
    width: '66%',
    height: 22,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    transform: [{ scaleX: 1.2 }]
  },
  pencil: {
    width: '86%',
    height: 54,
    flexDirection: 'row',
    alignItems: 'stretch',
    transform: [{ rotate: '-11deg' }]
  },
  pencilEraser: {
    width: 42,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    backgroundColor: '#F3D4A0',
    borderWidth: 2,
    borderColor: '#D6E7FF'
  },
  pencilBody: {
    flex: 1,
    backgroundColor: colors.mint,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#D6E7FF',
    justifyContent: 'center'
  },
  pencilStripe: {
    height: 10,
    backgroundColor: 'rgba(23, 59, 99, 0.24)'
  },
  pencilWood: {
    width: 34,
    backgroundColor: '#FFF1D9',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#D6E7FF'
  },
  pencilTip: {
    width: 0,
    height: 0,
    borderTopWidth: 27,
    borderBottomWidth: 27,
    borderLeftWidth: 42,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#F6F0E4'
  },
  wordStage: {
    width: '84%',
    maxWidth: 420,
    height: 98,
    marginTop: 22,
    opacity: 0,
    position: 'relative',
    justifyContent: 'center',
    transitionDuration: '520ms',
    transitionProperty: 'opacity',
    transitionTimingFunction: 'ease-out'
  },
  wordStageVisible: {
    opacity: 1
  },
  wordGhost: {
    color: 'rgba(255, 255, 255, 0.12)',
    fontSize: 58,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center'
  },
  wordReveal: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
    justifyContent: 'center'
  },
  wordText: {
    width: 420,
    color: '#FFF1D9',
    fontSize: 58,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
    textShadowColor: 'rgba(115, 201, 189, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12
  },
  wordPencil: {
    position: 'absolute',
    top: 50,
    width: 54,
    height: 18,
    flexDirection: 'row',
    transform: [{ translateX: -24 }, { rotate: '-18deg' }]
  },
  wordPencilBody: {
    flex: 1,
    borderRadius: 7,
    backgroundColor: colors.mint
  },
  wordPencilTip: {
    width: 0,
    height: 0,
    borderTopWidth: 9,
    borderBottomWidth: 9,
    borderLeftWidth: 14,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#FFF1D9'
  },
  caption: {
    position: 'absolute',
    bottom: 84,
    alignItems: 'center',
    paddingHorizontal: 24
  },
  captionTitle: {
    color: colors.mint,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase'
  },
  captionText: {
    color: '#D6E7FF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center'
  },
  skipButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    minHeight: 42,
    borderRadius: 999,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)'
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900'
  }
});
