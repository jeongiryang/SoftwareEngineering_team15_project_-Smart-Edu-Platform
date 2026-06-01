import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../i18n';
import { colors } from '../styles/theme';

const PARTICLE_COUNT = 118;
const PARTICLE_TOKENS = [
  '·',
  '✦',
  '—',
  '/',
  'AI',
  'Q',
  'A',
  '✓',
  'log',
  'memo',
  'plan',
  'focus',
  'quiz',
  'note',
  '1m',
  '42',
  'D-7',
  '100%',
  '∑',
  'fx',
  'card',
  'post',
  'raid',
  'care'
];

function buildParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, index) => {
    const side = index % 4;
    const band = Math.floor(index / 4);
    const spread = (index * 37) % 100;
    const startX = side === 0 ? -8 + (spread % 18) : side === 1 ? 90 + (spread % 18) : spread;
    const startY = side === 2 ? -10 + (spread % 20) : side === 3 ? 88 + (spread % 18) : (band * 11 + spread) % 100;
    const orbitAngle = (index / PARTICLE_COUNT) * Math.PI * 2.35;
    const orbitRadius = 26 + (index % 9) * 2.2;
    const targetColumn = index % 26;
    const targetRow = Math.floor(index / 26);
    const isTip = index > PARTICLE_COUNT - 18;
    const isEraser = index < 12;
    const pencilBaseX = 19 + targetColumn * 2.25;
    const pencilBaseY = 42 + targetRow * 4.4 + (targetColumn % 2) * 0.65;

    return {
      token: PARTICLE_TOKENS[index % PARTICLE_TOKENS.length],
      startX,
      startY,
      orbitX: 50 + Math.cos(orbitAngle) * orbitRadius,
      orbitY: 47 + Math.sin(orbitAngle) * orbitRadius * 0.62,
      targetX: isTip ? 78 + (index - (PARTICLE_COUNT - 18)) * 0.78 : isEraser ? 16 + (index % 6) * 2.4 : pencilBaseX,
      targetY: isTip ? 44 + ((index - (PARTICLE_COUNT - 18)) % 6) * 1.8 : isEraser ? 43 + Math.floor(index / 6) * 5.8 : pencilBaseY,
      rotate: -55 + ((index * 29) % 110),
      size: 9 + (index % 7),
      delay: (index % 16) * 24
    };
  });
}

const PARTICLES = buildParticles();

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
  const isPencilVisible = stage === 'pencil' || stage === 'write' || stage === 'exit' || reducedMotion;
  const isWriting = stage === 'write' || stage === 'exit' || reducedMotion;

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

    setStage(reducedMotion ? 'write' : 'scatter');
    setWriteProgress(reducedMotion ? 100 : 0);

    if (reducedMotion) {
      const timer = setTimeout(onDone, 1600);
      return () => clearTimeout(timer);
    }

    const timers = [
      setTimeout(() => setStage('orbit'), 360),
      setTimeout(() => setStage('gather'), 1420),
      setTimeout(() => setStage('pencil'), 2920),
      setTimeout(() => setStage('write'), 3920),
      setTimeout(() => setStage('exit'), 7600),
      setTimeout(onDone, 8350)
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
      setWriteProgress((current) => Math.min(current + 2.9, 100));
    }, 62);

    return () => clearInterval(writer);
  }, [reducedMotion, stage, visible]);

  const particleStyles = useMemo(
    () =>
      PARTICLES.map((particle) => {
        const position =
          stage === 'scatter'
            ? { x: particle.startX, y: particle.startY }
            : stage === 'orbit'
              ? { x: particle.orbitX, y: particle.orbitY }
              : { x: particle.targetX, y: particle.targetY };
        const formed = stage === 'pencil' || stage === 'write' || stage === 'exit';
        const gathering = stage === 'gather' || stage === 'pencil';

        return {
          left: `${position.x}%`,
          top: `${position.y}%`,
          opacity: formed ? 0.2 : gathering ? 0.96 : 0.78,
          fontSize: particle.size,
          transitionDelay: `${stage === 'scatter' ? 0 : particle.delay}ms`,
          transform: [
            { translateX: -10 },
            { translateY: -10 },
            { rotate: `${formed ? -14 : particle.rotate}deg` },
            { scale: formed ? 0.7 : stage === 'orbit' ? 1.18 : gathering ? 1.02 : 0.86 }
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
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.backgroundGlow}>
        <View style={styles.glowMint} />
        <View style={styles.glowBlue} />
        <View style={styles.orbitRing} />
      </View>

      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.particleLayer}>
        {PARTICLES.map((particle, index) => (
          <Text key={`${particle.token}-${index}`} style={[styles.particle, particleStyles[index]]}>
            {particle.token}
          </Text>
        ))}
      </View>

      <View
        pointerEvents="none"
        style={[
          styles.pencilStage,
          isPencilVisible && styles.pencilStageVisible,
          stage === 'write' && styles.pencilStageWriting,
          reducedMotion && styles.reducedPencilStage
        ]}
      >
        <View style={styles.pencilShadow} />
        <View style={styles.pencil}>
          <View style={styles.pencilEraser}>
            <View style={styles.pencilEraserBand} />
          </View>
          <View style={styles.pencilBody}>
            <View style={styles.pencilRidge} />
            <View style={styles.pencilStripe} />
          </View>
          <View style={styles.pencilWood} />
          <View style={styles.pencilTip} />
        </View>
      </View>

      <View pointerEvents="none" style={[styles.wordStage, isWriting && styles.wordStageVisible]}>
        <Text style={styles.wordGhost}>사각사각</Text>
        <View style={[styles.wordStroke, { width: `${Math.max(writeProgress - 8, 0)}%` }]} />
        <View style={[styles.wordReveal, { width: `${writeProgress}%` }]}>
          <Text style={styles.wordText}>사각사각</Text>
        </View>
        <View style={[styles.wordPencil, { left: `${Math.min(Math.max(writeProgress, 8), 95)}%` }]}>
          <View style={styles.wordPencilBody} />
          <View style={styles.wordPencilWood} />
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
    backgroundColor: '#0B1E33',
    overflow: 'hidden',
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    transitionDuration: '680ms',
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: 'ease-out'
  },
  overlayExit: {
    opacity: 0,
    transform: [{ scale: 1.045 }]
  },
  backgroundGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  },
  glowMint: {
    position: 'absolute',
    width: '64%',
    height: '52%',
    left: '-12%',
    top: '8%',
    borderRadius: 999,
    backgroundColor: 'rgba(115, 201, 189, 0.22)'
  },
  glowBlue: {
    position: 'absolute',
    width: '70%',
    height: '58%',
    right: '-16%',
    bottom: '-10%',
    borderRadius: 999,
    backgroundColor: 'rgba(55, 100, 154, 0.24)'
  },
  orbitRing: {
    position: 'absolute',
    width: '78%',
    height: '62%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(217, 255, 247, 0.12)',
    left: '11%',
    top: '18%',
    transform: [{ rotate: '-8deg' }]
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
    fontWeight: '900',
    letterSpacing: 0,
    textShadowColor: 'rgba(115, 201, 189, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    transitionDuration: '1450ms',
    transitionProperty: 'left, top, opacity, transform',
    transitionTimingFunction: 'cubic-bezier(0.16, 0.9, 0.18, 1)'
  },
  pencilStage: {
    width: '82%',
    maxWidth: 720,
    minHeight: 230,
    opacity: 0,
    transform: [{ translateY: 34 }, { scale: 0.8 }, { rotate: '-2deg' }],
    transitionDuration: '860ms',
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: 'cubic-bezier(0.18, 0.82, 0.25, 1)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  pencilStageVisible: {
    opacity: 1,
    transform: [{ translateY: 0 }, { scale: 1 }, { rotate: '0deg' }]
  },
  pencilStageWriting: {
    transform: [{ translateY: -28 }, { scale: 1.03 }, { rotate: '-4deg' }]
  },
  reducedPencilStage: {
    transform: [{ translateY: -18 }, { scale: 0.96 }, { rotate: '-3deg' }]
  },
  pencilShadow: {
    position: 'absolute',
    bottom: 48,
    width: '76%',
    height: 28,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.26)',
    transform: [{ rotate: '-8deg' }, { scaleX: 1.16 }]
  },
  pencil: {
    width: '86%',
    minWidth: 280,
    height: 78,
    flexDirection: 'row',
    alignItems: 'stretch',
    transform: [{ rotate: '-13deg' }]
  },
  pencilEraser: {
    width: 78,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    backgroundColor: '#F2CDA5',
    borderWidth: 3,
    borderColor: '#D6E7FF',
    justifyContent: 'center'
  },
  pencilEraserBand: {
    height: 22,
    backgroundColor: 'rgba(23, 59, 99, 0.24)'
  },
  pencilBody: {
    flex: 1,
    backgroundColor: colors.mint,
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#D6E7FF',
    justifyContent: 'space-around',
    overflow: 'hidden'
  },
  pencilRidge: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.28)'
  },
  pencilStripe: {
    height: 13,
    backgroundColor: 'rgba(23, 59, 99, 0.2)'
  },
  pencilWood: {
    width: 48,
    backgroundColor: '#FFF1D9',
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#D6E7FF'
  },
  pencilTip: {
    width: 0,
    height: 0,
    borderTopWidth: 39,
    borderBottomWidth: 39,
    borderLeftWidth: 68,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#F8F2E7'
  },
  wordStage: {
    width: '86%',
    maxWidth: 650,
    height: 118,
    marginTop: -18,
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
    color: 'rgba(255, 255, 255, 0.1)',
    fontSize: 74,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center'
  },
  wordStroke: {
    position: 'absolute',
    left: 18,
    bottom: 22,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 241, 217, 0.62)'
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
    width: 650,
    color: '#FFF1D9',
    fontSize: 74,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
    textShadowColor: 'rgba(115, 201, 189, 0.58)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14
  },
  wordPencil: {
    position: 'absolute',
    top: 58,
    width: 70,
    height: 20,
    flexDirection: 'row',
    transform: [{ translateX: -32 }, { rotate: '-18deg' }]
  },
  wordPencilBody: {
    flex: 1,
    borderRadius: 9,
    backgroundColor: colors.mint
  },
  wordPencilWood: {
    width: 12,
    backgroundColor: '#FFF1D9'
  },
  wordPencilTip: {
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftWidth: 17,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#FFF1D9'
  },
  caption: {
    position: 'absolute',
    bottom: 78,
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
