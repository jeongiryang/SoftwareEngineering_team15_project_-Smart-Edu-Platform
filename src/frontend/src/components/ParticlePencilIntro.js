import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useLanguage } from '../i18n';
import { colors } from '../styles/theme';

const INTRO_TIMELINE = {
  drift: 640,
  gather: 1840,
  assemble: 2840,
  mascot: 3560,
  text: 4240,
  settle: 5400,
  exit: 6140,
  done: 6520
};

const PARTICLE_COLORS = ['#FFF6DF', '#D9FFF7', '#73C9BD', '#1F5E96', '#7BC7F6', '#F1C89A'];
const MATH_TOKENS = ['∑', '√', 'π', 'x²', 'f(x)', '∫', 'Δ', '=', '%', '01', '10'];
const STUDY_TOKENS = ['AI', 'QUIZ', 'PLAN', 'FOCUS', 'REVIEW', 'EXAM', 'TODO', 'D-DAY', 'CHECK', 'STUDY'];
const KOREAN_TOKENS = ['복습', '오답', '집중', '일정'];
const SHAPE_SEQUENCE = [
  'mathToken',
  'studyToken',
  'dash',
  'strokeShard',
  'pencilShard',
  'dot',
  'square',
  'mathToken',
  'studyToken',
  'dash',
  'pencilShard',
  'strokeShard',
  'dot',
  'studyToken',
  'keywordToken'
];
const FORMED_STAGES = new Set(['assemble', 'mascot', 'text', 'settle', 'exit']);
const MASCOT_STAGES = new Set(['assemble', 'mascot', 'text', 'settle', 'exit']);
const WORD_STAGES = new Set(['text', 'settle', 'exit']);
const TEXT_SEQUENCE = ['sa', 'gak', 'sa', 'gak'];
const TEXT_MASKS = {
  sa: [
    [1, 1],
    [2, 2],
    [3, 3],
    [2, 4],
    [1, 5],
    [5, 0],
    [5, 1],
    [5, 2],
    [5, 3],
    [5, 4],
    [5, 5],
    [5, 6],
    [5, 7],
    [5, 8],
    [4, 4],
    [6, 4]
  ],
  gak: [
    [1, 1],
    [2, 1],
    [3, 1],
    [4, 1],
    [5, 1],
    [5, 2],
    [5, 3],
    [5, 4],
    [1, 6],
    [2, 6],
    [3, 6],
    [4, 6],
    [4, 7],
    [4, 8],
    [5, 8],
    [6, 8]
  ]
};

function seeded(index, salt) {
  const value = Math.sin(index * 127.13 + salt * 811.7) * 10000;
  return value - Math.floor(value);
}

function getParticleCount(width) {
  if (width >= 1440) {
    return 640;
  }

  if (width >= 1180) {
    return 560;
  }

  if (width >= 780) {
    return 330;
  }

  return 186;
}

function getStartPosition(index) {
  const side = index % 12;
  const spread = seeded(index, 3);
  const secondary = seeded(index, 7);

  if (side === 0) {
    return { x: -26 - spread * 14, y: secondary * 100 };
  }

  if (side === 1) {
    return { x: 114 + spread * 16, y: secondary * 100 };
  }

  if (side === 2) {
    return { x: spread * 100, y: -26 - secondary * 12 };
  }

  if (side === 3) {
    return { x: spread * 100, y: 114 + secondary * 16 };
  }

  if (side === 4) {
    return { x: -18 + spread * 30, y: -12 + secondary * 38 };
  }

  if (side === 5) {
    return { x: 72 + spread * 34, y: -14 + secondary * 42 };
  }

  if (side === 6) {
    return { x: -16 + spread * 34, y: 66 + secondary * 40 };
  }

  if (side === 7) {
    return { x: 68 + spread * 38, y: 62 + secondary * 42 };
  }

  if (side === 8) {
    return { x: 3 + spread * 24, y: 24 + secondary * 52 };
  }

  if (side === 9) {
    return { x: 74 + spread * 24, y: 22 + secondary * 54 };
  }

  if (side === 10) {
    return { x: 21 + spread * 58, y: -20 + secondary * 22 };
  }

  return { x: 22 + spread * 56, y: 92 + secondary * 24 };
}

function getPencilLinePoint(t, offset) {
  return {
    x: 28 + t * 47 + offset * 0.48,
    y: 52 - t * 38 + offset
  };
}

function getPencilTarget(index) {
  const type = index % 14;
  const t = seeded(index, 11);
  const u = seeded(index, 13);
  const bodyT = (index % 160) / 159;
  const offset = (u - 0.5) * 9;

  if (type <= 7) {
    const point = getPencilLinePoint(bodyT, offset);
    return { kind: 'body', x: point.x, y: point.y };
  }

  if (type === 8) {
    const point = getPencilLinePoint(0.86 + t * 0.12, (u - 0.5) * 7);
    return { kind: 'cap', x: point.x - 2, y: point.y + 1 };
  }

  if (type === 9) {
    const point = getPencilLinePoint(0.24 + t * 0.46, -5 + (u - 0.5) * 2);
    return { kind: 'highlight', x: point.x, y: point.y };
  }

  if (type <= 11) {
    const point = getPencilLinePoint(0.1 + t * 0.14, (u - 0.5) * 8);
    return { kind: 'wood', x: point.x + 1.8, y: point.y };
  }

  const point = getPencilLinePoint(t * 0.1, (u - 0.5) * 7);
  return { kind: 'tip', x: point.x + 3.2, y: point.y };
}

function getTextTarget(index) {
  const textIndex = Math.floor(index / 3);
  const charIndex = textIndex % TEXT_SEQUENCE.length;
  const mask = TEXT_MASKS[TEXT_SEQUENCE[charIndex]];
  const [cellX, cellY] = mask[Math.floor(textIndex / TEXT_SEQUENCE.length) % mask.length];
  const jitterX = (seeded(index, 17) - 0.5) * 1.2;
  const jitterY = (seeded(index, 19) - 0.5) * 1.2;

  return {
    kind: 'text',
    x: 28.5 + charIndex * 10.7 + cellX * 1.05 + jitterX,
    y: 63.2 + cellY * 1.45 + jitterY
  };
}

function getParticleTarget(index) {
  if (index % 10 >= 6) {
    return getTextTarget(index);
  }

  return getPencilTarget(index);
}

function getToken(shape, index) {
  if (shape === 'mathToken') {
    return MATH_TOKENS[index % MATH_TOKENS.length];
  }

  if (shape === 'keywordToken') {
    return KOREAN_TOKENS[index % KOREAN_TOKENS.length];
  }

  return STUDY_TOKENS[index % STUDY_TOKENS.length];
}

function getFragmentDimensions(shape, index) {
  if (shape === 'studyToken') {
    return { width: 34 + Math.round(seeded(index, 31) * 34), height: 20 };
  }

  if (shape === 'mathToken' || shape === 'keywordToken') {
    return { width: 22 + Math.round(seeded(index, 37) * 28), height: 22 };
  }

  if (shape === 'pencilShard') {
    return { width: 24 + Math.round(seeded(index, 43) * 24), height: 7 + Math.round(seeded(index, 47) * 5) };
  }

  if (shape === 'strokeShard') {
    return { width: 24 + Math.round(seeded(index, 53) * 25), height: 5 + Math.round(seeded(index, 59) * 5) };
  }

  if (shape === 'dash') {
    return { width: 12 + Math.round(seeded(index, 61) * 23), height: 5 + Math.round(seeded(index, 67) * 9) };
  }

  return { width: 5 + Math.round(seeded(index, 71) * 8), height: 5 + Math.round(seeded(index, 73) * 8) };
}

function buildParticles(count) {
  return Array.from({ length: count }, (_, index) => {
    const shape = SHAPE_SEQUENCE[index % SHAPE_SEQUENCE.length];
    const start = getStartPosition(index);
    const target = getParticleTarget(index);
    const angle = seeded(index, 101) * Math.PI * 2;
    const dimensions = getFragmentDimensions(shape, index);
    const surgeSpread = 12 + seeded(index, 103) * 18;
    const sourceX = start.x < 0 ? -1 : start.x > 100 ? 1 : start.x < 50 ? -0.55 : 0.55;
    const sourceY = start.y < 0 ? -1 : start.y > 100 ? 1 : start.y < 50 ? -0.45 : 0.45;

    return {
      id: `intro-fragment-${index}`,
      color: target.kind === 'text' ? PARTICLE_COLORS[(index + 2) % PARTICLE_COLORS.length] : PARTICLE_COLORS[index % PARTICLE_COLORS.length],
      driftX: start.x + Math.cos(angle) * (7 + seeded(index, 107) * 9) + (seeded(index, 109) - 0.5) * 12,
      driftY: start.y + Math.sin(angle) * (6 + seeded(index, 113) * 9) + (seeded(index, 127) - 0.5) * 12,
      height: dimensions.height,
      index,
      rotate: -115 + seeded(index, 131) * 230,
      shape,
      startX: start.x,
      startY: start.y,
      surgeX: target.x + sourceX * (4 + seeded(index, 137) * 8) + (seeded(index, 139) - 0.5) * surgeSpread,
      surgeY: target.y + sourceY * (4 + seeded(index, 149) * 7) + (seeded(index, 151) - 0.5) * surgeSpread * 0.78,
      targetKind: target.kind,
      targetX: target.x,
      targetY: target.y,
      token: getToken(shape, index),
      width: dimensions.width
    };
  });
}

function getPrefersReducedMotion() {
  const browserWindow = typeof globalThis !== 'undefined' ? globalThis.window : null;

  if (Platform.OS !== 'web' || !browserWindow?.matchMedia) {
    return false;
  }

  return browserWindow.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getParticlePosition(particle, stage) {
  if (stage === 'scatter') {
    return { x: particle.startX, y: particle.startY };
  }

  if (stage === 'drift') {
    return { x: particle.driftX, y: particle.driftY };
  }

  if (stage === 'gather') {
    return { x: particle.surgeX, y: particle.surgeY };
  }

  return { x: particle.targetX, y: particle.targetY };
}

function getParticleOpacity(stage, reducedMotion, particle) {
  if (reducedMotion || stage === 'exit') {
    return 0;
  }

  if (stage === 'scatter') {
    return particle.shape === 'studyToken' || particle.shape === 'mathToken' ? 0.78 : 0.5;
  }

  if (stage === 'drift') {
    return particle.shape === 'dot' ? 0.64 : 0.95;
  }

  if (stage === 'gather') {
    return 0.96;
  }

  if (stage === 'assemble') {
    return particle.targetKind === 'text' ? 0.82 : 0.95;
  }

  if (stage === 'mascot') {
    return particle.targetKind === 'text' ? 0.92 : 0.24;
  }

  if (stage === 'text') {
    return particle.targetKind === 'text' ? 0.78 : 0.08;
  }

  if (stage === 'settle') {
    return particle.targetKind === 'text' ? 0.22 : 0;
  }

  return 0;
}

function getMascotPartOpacity(part, stage, reducedMotion) {
  if (reducedMotion) {
    return 1;
  }

  if (stage === 'assemble') {
    if (part === 'body') {
      return 0.48;
    }

    if (part === 'cap') {
      return 0.28;
    }

    return 0;
  }

  if (MASCOT_STAGES.has(stage)) {
    return 1;
  }

  return 0;
}

function getMascotOpacity(stage, reducedMotion) {
  if (reducedMotion) {
    return 1;
  }

  if (stage === 'assemble') {
    return 0.74;
  }

  if (MASCOT_STAGES.has(stage)) {
    return 1;
  }

  return 0;
}

function getWordOpacity(stage, reducedMotion) {
  if (reducedMotion) {
    return 1;
  }

  if (stage === 'text') {
    return 0.58;
  }

  if (stage === 'settle' || stage === 'exit') {
    return 1;
  }

  return 0;
}

function PencilMascot({ pencilWidth, reducedMotion, stage }) {
  const bodyOpacity = getMascotPartOpacity('body', stage, reducedMotion);
  const capOpacity = getMascotPartOpacity('cap', stage, reducedMotion);
  const woodOpacity = getMascotPartOpacity('wood', stage, reducedMotion);
  const tipOpacity = getMascotPartOpacity('tip', stage, reducedMotion);
  const mascotOpacity = getMascotOpacity(stage, reducedMotion);

  return (
    <View
      style={[
        styles.pencilMascotWrap,
        {
          opacity: mascotOpacity,
          transform: [{ rotate: '132deg' }, { scale: stage === 'assemble' ? 0.92 : 1 }],
          width: pencilWidth
        }
      ]}
    >
      <View style={[styles.pencilCap, { opacity: capOpacity }]} />
      <View style={[styles.pencilBody, { opacity: bodyOpacity }]}>
        <View style={styles.pencilBodyHighlight} />
        <View style={styles.pencilBodyRidgeOne} />
        <View style={styles.pencilBodyRidgeTwo} />
      </View>
      <View style={[styles.pencilWood, { opacity: woodOpacity }]} />
      <View style={[styles.pencilTip, { opacity: tipOpacity }]} />
    </View>
  );
}

function FragmentParticle({ particle, style }) {
  const nodeStyle = [styles.particle, styles[`${particle.shape}Particle`], style];

  if (particle.shape === 'mathToken' || particle.shape === 'studyToken' || particle.shape === 'keywordToken') {
    return (
      <Text key={particle.id} style={nodeStyle}>
        {particle.token}
      </Text>
    );
  }

  if (particle.shape === 'pencilShard') {
    return (
      <View key={particle.id} style={nodeStyle}>
        <View style={styles.pencilShardTip} />
      </View>
    );
  }

  return <View key={particle.id} style={nodeStyle} />;
}

export default function ParticlePencilIntro({ visible, onDone }) {
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const [stage, setStage] = useState('scatter');
  const [reducedMotion, setReducedMotion] = useState(getPrefersReducedMotion);
  const particleCount = getParticleCount(width || 1024);
  const pencilWidth = width < 520 ? 238 : width < 900 ? 310 : 390;

  const particles = useMemo(() => buildParticles(particleCount), [particleCount]);

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

    setStage(reducedMotion ? 'settle' : 'scatter');

    if (reducedMotion) {
      const timer = setTimeout(onDone, 1400);
      return () => clearTimeout(timer);
    }

    const timers = [
      setTimeout(() => setStage('drift'), INTRO_TIMELINE.drift),
      setTimeout(() => setStage('gather'), INTRO_TIMELINE.gather),
      setTimeout(() => setStage('assemble'), INTRO_TIMELINE.assemble),
      setTimeout(() => setStage('mascot'), INTRO_TIMELINE.mascot),
      setTimeout(() => setStage('text'), INTRO_TIMELINE.text),
      setTimeout(() => setStage('settle'), INTRO_TIMELINE.settle),
      setTimeout(() => setStage('exit'), INTRO_TIMELINE.exit),
      setTimeout(onDone, INTRO_TIMELINE.done)
    ];

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [onDone, reducedMotion, visible]);

  const particleStyles = useMemo(
    () =>
      particles.map((particle) => {
        const position = getParticlePosition(particle, stage);
        const formed = FORMED_STAGES.has(stage);
        const transitionDuration = stage === 'drift' ? 1520 : stage === 'gather' ? 1780 : stage === 'assemble' ? 1060 : 720;
        const isToken = particle.shape === 'mathToken' || particle.shape === 'studyToken' || particle.shape === 'keywordToken';

        return {
          backgroundColor: isToken ? 'transparent' : particle.color,
          borderColor: particle.color,
          color: particle.targetKind === 'text' ? '#D9FFF7' : particle.color,
          height: particle.height,
          left: `${position.x}%`,
          opacity: getParticleOpacity(stage, reducedMotion, particle),
          top: `${position.y}%`,
          transitionDelay: formed ? `${particle.index % 18 * 10}ms` : `${particle.index % 44 * 12}ms`,
          transitionDuration: `${transitionDuration}ms`,
          transform: [
            { translateX: -particle.width / 2 },
            { translateY: -particle.height / 2 },
            { rotate: `${formed ? particle.rotate * 0.08 - 8 : particle.rotate}deg` },
            { scale: formed ? (particle.targetKind === 'text' ? 0.54 : 0.5) : stage === 'drift' ? 1.13 : stage === 'gather' ? 1.02 : 0.82 }
          ],
          width: particle.width
        };
      }),
    [particles, reducedMotion, stage]
  );

  if (!visible) {
    return null;
  }

  return (
    <View
      accessibilityLabel={t('landing.intro.accessibilityLabel', '사각사각 인트로 애니메이션')}
      style={[styles.overlay, stage === 'exit' && styles.overlayExit]}
    >
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.backgroundGlow}>
        <View style={styles.glowMint} />
        <View style={styles.glowBlue} />
        <View style={styles.glowWarm} />
      </View>

      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.particleLayer}>
        {particles.map((particle, index) => (
          <FragmentParticle key={particle.id} particle={particle} style={particleStyles[index]} />
        ))}
      </View>

      <View pointerEvents="none" style={[styles.mascotStage, stage === 'exit' && styles.mascotStageExit]}>
        <PencilMascot pencilWidth={pencilWidth} reducedMotion={reducedMotion} stage={stage} />
      </View>

      <View style={[styles.wordLockup, WORD_STAGES.has(stage) && styles.wordLockupVisible, stage === 'exit' && styles.wordLockupExit]}>
        <Text style={[styles.wordTitle, { opacity: getWordOpacity(stage, reducedMotion) }]}>사각사각</Text>
      </View>

      <Pressable accessibilityRole="button" onPress={onDone} style={styles.skipButton}>
        <Text style={styles.skipButtonText}>{t('landing.intro.skip', 'Skip intro')}</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#0B1E33',
    transitionDuration: '680ms',
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: 'ease-out',
    zIndex: 2147483647,
    elevation: 9999
  },
  overlayExit: {
    opacity: 0,
    transform: [{ scale: 1.035 }]
  },
  backgroundGlow: {
    ...StyleSheet.absoluteFillObject
  },
  glowMint: {
    position: 'absolute',
    width: '68%',
    height: '58%',
    left: '-22%',
    top: '-8%',
    borderRadius: 999,
    backgroundColor: 'rgba(115, 201, 189, 0.2)'
  },
  glowBlue: {
    position: 'absolute',
    width: '76%',
    height: '64%',
    right: '-24%',
    bottom: '-18%',
    borderRadius: 999,
    backgroundColor: 'rgba(31, 94, 150, 0.3)'
  },
  glowWarm: {
    position: 'absolute',
    width: '52%',
    height: '44%',
    left: '25%',
    top: '34%',
    borderRadius: 999,
    backgroundColor: 'rgba(241, 200, 154, 0.07)'
  },
  particleLayer: {
    ...StyleSheet.absoluteFillObject
  },
  particle: {
    position: 'absolute',
    borderRadius: 999,
    transitionProperty: 'left, top, opacity, transform, width, height',
    transitionTimingFunction: 'cubic-bezier(0.16, 0.9, 0.18, 1)',
    shadowColor: '#73C9BD',
    shadowOpacity: 0.36,
    shadowRadius: 10
  },
  dotParticle: {
    borderWidth: 0
  },
  squareParticle: {
    borderRadius: 3
  },
  dashParticle: {
    borderRadius: 999
  },
  strokeShardParticle: {
    borderRadius: 999,
    backgroundColor: '#7BC7F6'
  },
  pencilShardParticle: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: colors.mint
  },
  pencilShardTip: {
    width: 7,
    backgroundColor: '#173B63'
  },
  mathTokenParticle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
    textShadowColor: 'rgba(123, 199, 246, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12
  },
  studyTokenParticle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
    textAlign: 'center',
    textShadowColor: 'rgba(115, 201, 189, 0.65)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12
  },
  keywordTokenParticle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
    textShadowColor: 'rgba(241, 200, 154, 0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10
  },
  mascotStage: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 246,
    transform: [{ translateY: -54 }],
    transitionDuration: '680ms',
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: 'ease-out'
  },
  mascotStageExit: {
    opacity: 0,
    transform: [{ translateY: -68 }, { scale: 0.94 }]
  },
  pencilMascotWrap: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    height: 76,
    borderRadius: 999,
    shadowColor: '#061322',
    shadowOpacity: 0.38,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 22 },
    transitionDuration: '680ms',
    transitionProperty: 'opacity, transform, width',
    transitionTimingFunction: 'cubic-bezier(0.18, 0.82, 0.25, 1)'
  },
  pencilCap: {
    width: '11%',
    height: 56,
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(217, 255, 247, 0.7)',
    backgroundColor: '#FFF4DD',
    transitionDuration: '520ms',
    transitionProperty: 'opacity',
    transitionTimingFunction: 'ease-out'
  },
  pencilBody: {
    position: 'relative',
    flex: 1,
    height: 62,
    overflow: 'hidden',
    justifyContent: 'center',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: 'rgba(217, 255, 247, 0.62)',
    backgroundColor: colors.mint,
    transitionDuration: '560ms',
    transitionProperty: 'opacity',
    transitionTimingFunction: 'ease-out'
  },
  pencilBodyHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.32)'
  },
  pencilBodyRidgeOne: {
    position: 'absolute',
    top: 12,
    bottom: 12,
    left: '28%',
    width: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  pencilBodyRidgeTwo: {
    position: 'absolute',
    top: 11,
    bottom: 11,
    right: '27%',
    width: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(23, 59, 99, 0.08)'
  },
  pencilWood: {
    width: '10%',
    height: 62,
    backgroundColor: '#F1C89A',
    transitionDuration: '560ms',
    transitionProperty: 'opacity',
    transitionTimingFunction: 'ease-out'
  },
  pencilTip: {
    width: 0,
    height: 0,
    borderTopWidth: 31,
    borderBottomWidth: 31,
    borderLeftWidth: 48,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#173B63',
    transitionDuration: '560ms',
    transitionProperty: 'opacity',
    transitionTimingFunction: 'ease-out'
  },
  wordLockup: {
    position: 'absolute',
    top: '55%',
    alignItems: 'center',
    width: 440,
    maxWidth: '90%',
    opacity: 0,
    transform: [{ translateY: 18 }],
    transitionDuration: '520ms',
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: 'ease-out'
  },
  wordLockupVisible: {
    opacity: 1,
    transform: [{ translateY: 0 }]
  },
  wordLockupExit: {
    opacity: 0,
    transform: [{ translateY: 10 }]
  },
  wordTitle: {
    color: '#D9FFF7',
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: 1.8,
    textShadowColor: 'rgba(31, 124, 196, 0.45)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 18,
    transitionDuration: '520ms',
    transitionProperty: 'opacity',
    transitionTimingFunction: 'ease-out'
  },
  skipButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    minHeight: 42,
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900'
  }
});
