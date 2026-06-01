import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../i18n';
import { colors } from '../styles/theme';

const PARTICLE_COUNT = 260;
const INTRO_TIMING = {
  orbit: 360,
  gather: 1320,
  pencil: 2860,
  write: 3920,
  exit: 8300,
  done: 9100
};

const PARTICLE_TOKENS = [
  '사',
  '각',
  'AI',
  'Q',
  'A',
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
  'card',
  'post',
  'raid',
  'care',
  '+'
];

const HANDWRITING_STROKES = [
  { d: 'M45 72 C70 58 96 58 122 70', length: 88 },
  { d: 'M75 49 C73 72 73 92 76 115', length: 74 },
  { d: 'M47 124 C79 109 114 111 139 130', length: 105 },
  { d: 'M158 55 C188 49 218 50 246 57', length: 92 },
  { d: 'M163 92 C194 85 224 87 251 96', length: 92 },
  { d: 'M205 45 C204 77 205 111 211 142', length: 108 },
  { d: 'M284 72 C308 58 337 59 365 70', length: 88 },
  { d: 'M316 50 C313 75 314 96 319 118', length: 76 },
  { d: 'M286 127 C319 109 354 111 381 132', length: 112 },
  { d: 'M401 56 C431 49 461 50 489 57', length: 92 },
  { d: 'M405 93 C436 85 467 87 494 96', length: 92 },
  { d: 'M447 45 C446 78 447 113 454 144', length: 112 }
];

const WRITING_POINTS = [
  { x: 45, y: 72 },
  { x: 122, y: 70 },
  { x: 76, y: 115 },
  { x: 139, y: 130 },
  { x: 246, y: 57 },
  { x: 251, y: 96 },
  { x: 211, y: 142 },
  { x: 365, y: 70 },
  { x: 319, y: 118 },
  { x: 381, y: 132 },
  { x: 489, y: 57 },
  { x: 494, y: 96 },
  { x: 454, y: 144 }
];

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function getPrefersReducedMotion() {
  const browserWindow = typeof globalThis !== 'undefined' ? globalThis.window : null;

  if (Platform.OS !== 'web' || !browserWindow?.matchMedia) {
    return false;
  }

  return browserWindow.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function buildParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, index) => {
    const edge = index % 8;
    const seed = (index * 41) % 100;
    const ring = Math.floor(index / 8);
    const pencilProgress = index / Math.max(PARTICLE_COUNT - 1, 1);
    const band = (index % 15) - 7;
    const targetX = 20 + pencilProgress * 60 + band * 0.42;
    const targetY = 68 - pencilProgress * 37 + band * 1.04 + ((index % 5) - 2) * 0.62;
    const orbitAngle = (index / PARTICLE_COUNT) * Math.PI * 4.8;
    const orbitRadius = 18 + (index % 16) * 2.1;

    let startX = seed;
    let startY = (ring * 13 + seed) % 100;

    if (edge === 0) {
      startX = -14 - (seed % 14);
      startY = seed;
    } else if (edge === 1) {
      startX = 104 + (seed % 17);
      startY = seed;
    } else if (edge === 2) {
      startX = seed;
      startY = -18 - (seed % 14);
    } else if (edge === 3) {
      startX = seed;
      startY = 104 + (seed % 16);
    } else if (edge === 4) {
      startX = -10;
      startY = -12 + seed * 0.42;
    } else if (edge === 5) {
      startX = 106;
      startY = 50 + seed * 0.56;
    } else if (edge === 6) {
      startX = 38 + seed * 0.32;
      startY = -14;
    } else {
      startX = 60 + seed * 0.32;
      startY = 112;
    }

    return {
      token: PARTICLE_TOKENS[index % PARTICLE_TOKENS.length],
      startX,
      startY,
      orbitX: 50 + Math.cos(orbitAngle) * orbitRadius * 1.16,
      orbitY: 51 + Math.sin(orbitAngle) * orbitRadius * 0.72,
      targetX,
      targetY,
      rotate: -120 + ((index * 29) % 240),
      size: 8 + (index % 8),
      delay: (index % 28) * 16,
      tint: index % 3
    };
  });
}

const PARTICLES = buildParticles();

function getWritingPoint(progress) {
  const boundedProgress = clamp(progress / 100);
  const scaled = boundedProgress * (WRITING_POINTS.length - 1);
  const index = Math.min(WRITING_POINTS.length - 2, Math.floor(scaled));
  const localProgress = scaled - index;
  const current = WRITING_POINTS[index];
  const next = WRITING_POINTS[index + 1];

  return {
    x: lerp(current.x, next.x, localProgress),
    y: lerp(current.y, next.y, localProgress)
  };
}

function PencilShape() {
  return (
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
  );
}

function HandwrittenWord({ progress }) {
  const normalized = clamp(progress / 100);

  if (Platform.OS !== 'web') {
    return (
      <Text style={styles.fallbackWord}>
        사각사각
      </Text>
    );
  }

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      style={styles.handwritingSvg}
      viewBox="0 0 540 190"
    >
      <defs>
        <filter id="sagak-handwriting-glow" x="-10%" y="-10%" width="120%" height="130%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="0 0 0 0 0.45 0 0 0 0 0.79 0 0 0 0 0.74 0 0 0 0.45 0"
          />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M36 156 C140 172 334 170 500 154"
        fill="none"
        opacity="0.16"
        stroke="#73C9BD"
        strokeLinecap="round"
        strokeWidth="8"
      />
      {HANDWRITING_STROKES.map((stroke, index) => {
        const start = index / HANDWRITING_STROKES.length;
        const end = (index + 1) / HANDWRITING_STROKES.length;
        const strokeProgress = clamp((normalized - start) / Math.max(end - start, 0.001));

        return (
          <path
            d={stroke.d}
            fill="none"
            filter="url(#sagak-handwriting-glow)"
            key={stroke.d}
            opacity={strokeProgress > 0 ? 1 : 0.18}
            stroke={strokeProgress > 0 ? '#FFF1D9' : 'rgba(255, 241, 217, 0.18)'}
            strokeDasharray={stroke.length}
            strokeDashoffset={stroke.length * (1 - strokeProgress)}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="15"
          />
        );
      })}
    </svg>
  );
}

export default function ParticlePencilIntro({ visible, onDone }) {
  const { t } = useLanguage();
  const [stage, setStage] = useState('scatter');
  const [writeProgress, setWriteProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(getPrefersReducedMotion);
  const isPencilVisible = ['pencil', 'write', 'exit'].includes(stage) || reducedMotion;
  const isWriting = stage === 'write' || stage === 'exit' || reducedMotion;
  const writingPoint = getWritingPoint(writeProgress);

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
      const timer = setTimeout(onDone, 1700);
      return () => clearTimeout(timer);
    }

    const timers = [
      setTimeout(() => setStage('orbit'), INTRO_TIMING.orbit),
      setTimeout(() => setStage('gather'), INTRO_TIMING.gather),
      setTimeout(() => setStage('pencil'), INTRO_TIMING.pencil),
      setTimeout(() => setStage('write'), INTRO_TIMING.write),
      setTimeout(() => setStage('exit'), INTRO_TIMING.exit),
      setTimeout(onDone, INTRO_TIMING.done)
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
      setWriteProgress((current) => Math.min(current + 1.9, 100));
    }, 66);

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
          opacity: formed ? 0.18 : gathering ? 0.94 : 0.8,
          fontSize: particle.size,
          transitionDelay: `${stage === 'scatter' ? 0 : particle.delay}ms`,
          transform: [
            { translateX: -10 },
            { translateY: -10 },
            { rotate: `${formed ? -58 + (particle.tint - 1) * 4 : particle.rotate}deg` },
            { scale: formed ? 0.58 : stage === 'orbit' ? 1.22 : gathering ? 1.05 : 0.84 }
          ]
        };
      }),
    [stage]
  );

  const writingPencilStyle = isWriting
    ? {
        left: `${8 + (writingPoint.x / 540) * 82}%`,
        top: `${29 + (writingPoint.y / 190) * 34}%`,
        opacity: 1,
        transform: [
          { translateX: -265 },
          { translateY: -92 },
          { rotate: '-58deg' },
          { scale: 0.74 }
        ]
      }
    : undefined;

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
        <View style={styles.paperGrid} />
      </View>

      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.particleLayer}>
        {PARTICLES.map((particle, index) => (
          <Text key={`${particle.token}-${index}`} style={[styles.particle, particle.tint === 1 && styles.particleBlue, particle.tint === 2 && styles.particleCream, particleStyles[index]]}>
            {particle.token}
          </Text>
        ))}
      </View>

      <View
        pointerEvents="none"
        style={[
          styles.pencilStage,
          isPencilVisible && styles.pencilStageVisible,
          stage === 'pencil' && styles.pencilStageFormed,
          isWriting && styles.pencilStageWriting,
          writingPencilStyle,
          reducedMotion && styles.reducedPencilStage
        ]}
      >
        <View style={styles.pencilShadow} />
        <PencilShape />
      </View>

      <View pointerEvents="none" style={[styles.wordStage, isWriting && styles.wordStageVisible]}>
        <Text style={styles.wordGhost}>사각사각</Text>
        <HandwrittenWord progress={writeProgress} />
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
    transitionDuration: '720ms',
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
    width: '78%',
    height: '66%',
    left: '-18%',
    top: '2%',
    borderRadius: 999,
    backgroundColor: 'rgba(115, 201, 189, 0.23)'
  },
  glowBlue: {
    position: 'absolute',
    width: '76%',
    height: '64%',
    right: '-18%',
    bottom: '-10%',
    borderRadius: 999,
    backgroundColor: 'rgba(55, 100, 154, 0.25)'
  },
  orbitRing: {
    position: 'absolute',
    width: '86%',
    height: '74%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(217, 255, 247, 0.13)',
    left: '7%',
    top: '13%',
    transform: [{ rotate: '-17deg' }]
  },
  paperGrid: {
    position: 'absolute',
    left: '12%',
    right: '12%',
    top: '28%',
    bottom: '24%',
    borderRadius: 42,
    borderWidth: 1,
    borderColor: 'rgba(255, 241, 217, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    transform: [{ rotate: '-2deg' }]
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
    textShadowColor: 'rgba(115, 201, 189, 0.62)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    transitionDuration: '1480ms',
    transitionProperty: 'left, top, opacity, transform',
    transitionTimingFunction: 'cubic-bezier(0.16, 0.9, 0.18, 1)'
  },
  particleBlue: {
    color: '#D6E7FF',
    textShadowColor: 'rgba(91, 141, 196, 0.56)'
  },
  particleCream: {
    color: '#FFF1D9',
    textShadowColor: 'rgba(255, 241, 217, 0.5)'
  },
  pencilStage: {
    position: 'absolute',
    width: 640,
    maxWidth: '78%',
    height: 150,
    opacity: 0,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: 24 }, { scale: 0.76 }, { rotate: '-58deg' }],
    transitionDuration: '760ms',
    transitionProperty: 'left, top, opacity, transform',
    transitionTimingFunction: 'cubic-bezier(0.18, 0.82, 0.25, 1)'
  },
  pencilStageVisible: {
    opacity: 1
  },
  pencilStageFormed: {
    transform: [{ translateY: -4 }, { scale: 1.02 }, { rotate: '-58deg' }]
  },
  pencilStageWriting: {
    position: 'absolute'
  },
  reducedPencilStage: {
    left: '58%',
    top: '46%',
    opacity: 1,
    transform: [{ translateX: -265 }, { translateY: -92 }, { rotate: '-58deg' }, { scale: 0.72 }]
  },
  pencilShadow: {
    position: 'absolute',
    bottom: 26,
    width: '72%',
    height: 24,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    transform: [{ rotate: '8deg' }, { scaleX: 1.08 }]
  },
  pencil: {
    width: '100%',
    minWidth: 320,
    height: 82,
    flexDirection: 'row',
    alignItems: 'stretch'
  },
  pencilEraser: {
    width: 82,
    borderTopLeftRadius: 26,
    borderBottomLeftRadius: 26,
    backgroundColor: '#F2CDA5',
    borderWidth: 3,
    borderColor: '#D6E7FF',
    justifyContent: 'center'
  },
  pencilEraserBand: {
    height: 24,
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
    height: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.32)'
  },
  pencilStripe: {
    height: 14,
    backgroundColor: 'rgba(23, 59, 99, 0.22)'
  },
  pencilWood: {
    width: 52,
    backgroundColor: '#FFF1D9',
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#D6E7FF'
  },
  pencilTip: {
    width: 0,
    height: 0,
    borderTopWidth: 41,
    borderBottomWidth: 41,
    borderLeftWidth: 74,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#F8F2E7'
  },
  wordStage: {
    width: '88%',
    maxWidth: 700,
    height: 230,
    opacity: 0,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    transitionDuration: '520ms',
    transitionProperty: 'opacity',
    transitionTimingFunction: 'ease-out'
  },
  wordStageVisible: {
    opacity: 1
  },
  wordGhost: {
    position: 'absolute',
    color: 'rgba(255, 255, 255, 0.075)',
    fontSize: 76,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center'
  },
  handwritingSvg: {
    width: '100%',
    maxWidth: 680,
    height: 218,
    display: 'block'
  },
  fallbackWord: {
    color: '#FFF1D9',
    fontSize: 72,
    lineHeight: 88,
    fontWeight: '900',
    letterSpacing: 0,
    textShadowColor: 'rgba(115, 201, 189, 0.58)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14
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
