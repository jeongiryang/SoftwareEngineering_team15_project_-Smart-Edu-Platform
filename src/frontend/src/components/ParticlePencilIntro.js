import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useLanguage } from '../i18n';
import { colors } from '../styles/theme';

const INTRO_TIMELINE = {
  drift: 620,
  gather: 1900,
  assemble: 2920,
  icon: 3560,
  write: 4240,
  settle: 5260,
  exit: 5900,
  done: 6350
};

const DRAW_STEP_DELAYS = [0, 190, 390, 610, 840, 1080];
const PARTICLE_COLORS = ['#FFF6DF', '#D9FFF7', '#73C9BD', '#1F5E96', '#7BC7F6', '#F1C89A'];
const PARTICLE_TOKENS = ['AI', 'Quiz', 'Note', 'D-Day', 'A+', '✓', 'Q', 'Plan', 'Focus', 'Memo'];
const SHAPE_SEQUENCE = [
  'token',
  'noteCard',
  'graph',
  'bubble',
  'strokeShard',
  'pencilShard',
  'dash',
  'paper',
  'square',
  'dot',
  'dot',
  'strokeShard',
  'graph',
  'dash',
  'token'
];
const DRAW_SEGMENTS = [
  { left: 17, top: 62, width: 18, rotate: -15 },
  { left: 33, top: 56, width: 19, rotate: 18 },
  { left: 49, top: 62, width: 18, rotate: -17 },
  { left: 64, top: 57, width: 17, rotate: 16 },
  { left: 78, top: 62, width: 12, rotate: -12 }
];
const PENCIL_POSITIONS = [
  { left: 17, top: 53, rotate: -14 },
  { left: 29, top: 48, rotate: 10 },
  { left: 45, top: 54, rotate: -16 },
  { left: 60, top: 49, rotate: 12 },
  { left: 74, top: 55, rotate: -13 },
  { left: 84, top: 51, rotate: -8 }
];
const FORMED_STAGES = new Set(['assemble', 'icon', 'write', 'settle', 'exit']);
const ICON_STAGES = new Set(['assemble', 'icon', 'write', 'settle', 'exit']);

function seeded(index, salt) {
  const value = Math.sin(index * 127.13 + salt * 811.7) * 10000;
  return value - Math.floor(value);
}

function getParticleCount(width) {
  if (width >= 1440) {
    return 620;
  }

  if (width >= 1180) {
    return 540;
  }

  if (width >= 780) {
    return 320;
  }

  return 178;
}

function getStartPosition(index) {
  const side = index % 12;
  const spread = seeded(index, 3);
  const secondary = seeded(index, 7);

  if (side === 0) {
    return { x: -24 - spread * 12, y: secondary * 100 };
  }

  if (side === 1) {
    return { x: 112 + spread * 16, y: secondary * 100 };
  }

  if (side === 2) {
    return { x: spread * 100, y: -24 - secondary * 12 };
  }

  if (side === 3) {
    return { x: spread * 100, y: 112 + secondary * 16 };
  }

  if (side === 4) {
    return { x: -16 + spread * 30, y: -10 + secondary * 38 };
  }

  if (side === 5) {
    return { x: 72 + spread * 32, y: -12 + secondary * 42 };
  }

  if (side === 6) {
    return { x: -14 + spread * 34, y: 66 + secondary * 38 };
  }

  if (side === 7) {
    return { x: 68 + spread * 36, y: 62 + secondary * 40 };
  }

  if (side === 8) {
    return { x: 4 + spread * 24, y: 25 + secondary * 50 };
  }

  if (side === 9) {
    return { x: 74 + spread * 22, y: 23 + secondary * 52 };
  }

  if (side === 10) {
    return { x: 21 + spread * 58, y: -18 + secondary * 20 };
  }

  return { x: 22 + spread * 56, y: 92 + secondary * 22 };
}

function getIconTarget(index) {
  const type = index % 14;
  const t = seeded(index, 11);
  const u = seeded(index, 13);

  if (type <= 3) {
    const edge = index % 4;

    if (edge === 0) {
      return { kind: 'outline', x: 36.8 + t * 26.4, y: 25.4 + u * 2.8 };
    }

    if (edge === 1) {
      return { kind: 'outline', x: 36.8 + t * 26.4, y: 59 + u * 2.8 };
    }

    if (edge === 2) {
      return { kind: 'outline', x: 36.5 + u * 2.7, y: 26.8 + t * 33 };
    }

    return { kind: 'outline', x: 63.5 + u * 2.7, y: 26.8 + t * 33 };
  }

  if (type <= 6) {
    return {
      kind: 'fill',
      x: 39.6 + seeded(index, 17) * 21.6,
      y: 29.4 + seeded(index, 19) * 26.8
    };
  }

  if (type <= 10) {
    const lineT = (index % 96) / 95;
    return {
      kind: 'pencil',
      x: 39.8 + lineT * 23 + (u - 0.5) * 2.6,
      y: 52.6 - lineT * 22 + (t - 0.5) * 3.2
    };
  }

  if (type <= 12) {
    const zig = (index % 42) / 41;
    return {
      kind: 'stroke',
      x: 41 + zig * 20.5,
      y: 49.5 + Math.sin(zig * Math.PI * 5) * 3.7 + (u - 0.5) * 1.8
    };
  }

  return {
    kind: 'accent',
    x: 39 + seeded(index, 23) * 23,
    y: 28 + seeded(index, 29) * 29
  };
}

function getFragmentDimensions(shape, index) {
  if (shape === 'token') {
    return { width: 28 + Math.round(seeded(index, 31) * 26), height: 19 };
  }

  if (shape === 'noteCard') {
    return { width: 36 + Math.round(seeded(index, 37) * 17), height: 25 + Math.round(seeded(index, 41) * 8) };
  }

  if (shape === 'graph') {
    return { width: 29 + Math.round(seeded(index, 43) * 15), height: 22 + Math.round(seeded(index, 47) * 8) };
  }

  if (shape === 'bubble') {
    return { width: 35 + Math.round(seeded(index, 53) * 20), height: 23 + Math.round(seeded(index, 59) * 8) };
  }

  if (shape === 'pencilShard') {
    return { width: 24 + Math.round(seeded(index, 61) * 22), height: 7 + Math.round(seeded(index, 67) * 4) };
  }

  if (shape === 'strokeShard') {
    return { width: 22 + Math.round(seeded(index, 71) * 22), height: 5 + Math.round(seeded(index, 73) * 4) };
  }

  if (shape === 'dash' || shape === 'paper') {
    return { width: 10 + Math.round(seeded(index, 79) * 20), height: 5 + Math.round(seeded(index, 83) * 10) };
  }

  return { width: 5 + Math.round(seeded(index, 89) * 8), height: 5 + Math.round(seeded(index, 97) * 8) };
}

function buildParticles(count) {
  return Array.from({ length: count }, (_, index) => {
    const start = getStartPosition(index);
    const target = getIconTarget(index);
    const angle = seeded(index, 101) * Math.PI * 2;
    const orbitRadius = 26 + seeded(index, 103) * 31;
    const dimensions = getFragmentDimensions(SHAPE_SEQUENCE[index % SHAPE_SEQUENCE.length], index);

    return {
      id: `intro-fragment-${index}`,
      color: PARTICLE_COLORS[index % PARTICLE_COLORS.length],
      driftX: 50 + Math.cos(angle) * orbitRadius + (seeded(index, 107) - 0.5) * 18,
      driftY: 45 + Math.sin(angle) * orbitRadius * 0.72 + (seeded(index, 109) - 0.5) * 15,
      height: dimensions.height,
      index,
      magnetX: 50 + Math.cos(angle + 0.9) * (10 + seeded(index, 113) * 12),
      magnetY: 45 + Math.sin(angle + 0.9) * (8 + seeded(index, 127) * 10),
      rotate: -115 + seeded(index, 131) * 230,
      shape: SHAPE_SEQUENCE[index % SHAPE_SEQUENCE.length],
      startX: start.x,
      startY: start.y,
      targetKind: target.kind,
      targetX: target.x,
      targetY: target.y,
      token: PARTICLE_TOKENS[index % PARTICLE_TOKENS.length],
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
    return { x: particle.magnetX, y: particle.magnetY };
  }

  return { x: particle.targetX, y: particle.targetY };
}

function getParticleOpacity(stage, reducedMotion, particle) {
  if (reducedMotion || stage === 'exit' || stage === 'settle') {
    return 0;
  }

  if (stage === 'scatter') {
    return particle.shape === 'token' || particle.shape === 'noteCard' ? 0.72 : 0.5;
  }

  if (stage === 'drift') {
    return particle.shape === 'dot' ? 0.68 : 0.95;
  }

  if (stage === 'gather') {
    return 0.96;
  }

  if (stage === 'assemble') {
    if (particle.targetKind === 'outline' || particle.targetKind === 'pencil' || particle.targetKind === 'stroke') {
      return 0.9;
    }

    return 0.68;
  }

  if (stage === 'icon') {
    if (particle.targetKind === 'pencil' || particle.targetKind === 'stroke') {
      return 0.34;
    }

    return 0.16;
  }

  if (stage === 'write') {
    return particle.targetKind === 'stroke' ? 0.1 : 0;
  }

  return 0;
}

function getIconOpacity(stage, reducedMotion) {
  if (reducedMotion) {
    return 1;
  }

  if (stage === 'assemble') {
    return 0.48;
  }

  if (stage === 'icon' || stage === 'write' || stage === 'settle' || stage === 'exit') {
    return 1;
  }

  return 0;
}

function getIconFillOpacity(stage, reducedMotion) {
  if (reducedMotion) {
    return 1;
  }

  if (stage === 'assemble') {
    return 0.35;
  }

  if (stage === 'icon' || stage === 'write' || stage === 'settle' || stage === 'exit') {
    return 1;
  }

  return 0;
}

function IconPencil({ drawStep, stage }) {
  const position = PENCIL_POSITIONS[Math.min(drawStep, PENCIL_POSITIONS.length - 1)];
  const isVisible = stage === 'icon' || stage === 'write' || stage === 'settle' || stage === 'exit';
  const isWriting = stage === 'write';

  return (
    <View
      style={[
        styles.iconPencil,
        {
          left: `${position.left}%`,
          opacity: isVisible ? 1 : 0,
          top: `${position.top}%`,
          transform: [
            { translateX: -28 },
            { translateY: -13 },
            { rotate: `${position.rotate}deg` },
            { scale: isWriting ? 1.03 : 1 }
          ]
        }
      ]}
    >
      <View style={styles.iconPencilBody}>
        <View style={styles.iconPencilHighlight} />
      </View>
      <View style={styles.iconPencilWood} />
      <View style={styles.iconPencilTip} />
    </View>
  );
}

function FragmentParticle({ particle, style }) {
  const nodeStyle = [styles.particle, styles[`${particle.shape}Particle`], style];

  if (particle.shape === 'token') {
    return (
      <Text key={particle.id} style={nodeStyle}>
        {particle.token}
      </Text>
    );
  }

  if (particle.shape === 'noteCard') {
    return (
      <View key={particle.id} style={nodeStyle}>
        <View style={styles.noteCardLineWide} />
        <View style={styles.noteCardLineShort} />
      </View>
    );
  }

  if (particle.shape === 'graph') {
    return (
      <View key={particle.id} style={nodeStyle}>
        <View style={[styles.graphBar, styles.graphBarShort]} />
        <View style={[styles.graphBar, styles.graphBarTall]} />
        <View style={[styles.graphBar, styles.graphBarMid]} />
      </View>
    );
  }

  if (particle.shape === 'bubble') {
    return (
      <View key={particle.id} style={nodeStyle}>
        <View style={styles.bubbleLineWide} />
        <View style={styles.bubbleLineShort} />
      </View>
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
  const [drawStep, setDrawStep] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(getPrefersReducedMotion);
  const particleCount = getParticleCount(width || 1024);
  const iconSize = width < 520 ? 156 : width < 900 ? 188 : 222;

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
    setDrawStep(reducedMotion ? DRAW_SEGMENTS.length : 0);

    if (reducedMotion) {
      const timer = setTimeout(onDone, 1400);
      return () => clearTimeout(timer);
    }

    const timers = [
      setTimeout(() => setStage('drift'), INTRO_TIMELINE.drift),
      setTimeout(() => setStage('gather'), INTRO_TIMELINE.gather),
      setTimeout(() => setStage('assemble'), INTRO_TIMELINE.assemble),
      setTimeout(() => setStage('icon'), INTRO_TIMELINE.icon),
      setTimeout(() => setStage('write'), INTRO_TIMELINE.write),
      setTimeout(() => setStage('settle'), INTRO_TIMELINE.settle),
      setTimeout(() => setStage('exit'), INTRO_TIMELINE.exit),
      setTimeout(onDone, INTRO_TIMELINE.done)
    ];

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [onDone, reducedMotion, visible]);

  useEffect(() => {
    if (!visible || stage !== 'write' || reducedMotion) {
      return undefined;
    }

    setDrawStep(0);
    const timers = DRAW_STEP_DELAYS.map((delay, index) => setTimeout(() => setDrawStep(index), delay));

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [reducedMotion, stage, visible]);

  const particleStyles = useMemo(
    () =>
      particles.map((particle) => {
        const position = getParticlePosition(particle, stage);
        const formed = FORMED_STAGES.has(stage);
        const transitionDuration = stage === 'drift' ? 1540 : stage === 'gather' ? 1780 : stage === 'assemble' ? 1050 : 720;
        const fillFragment = particle.shape === 'noteCard' || particle.shape === 'graph' || particle.shape === 'bubble';

        return {
          backgroundColor: particle.shape === 'token' ? 'transparent' : fillFragment ? 'rgba(255, 246, 223, 0.16)' : particle.color,
          borderColor: fillFragment || particle.shape === 'paper' ? 'rgba(217, 255, 247, 0.48)' : particle.color,
          color: particle.color,
          height: particle.height,
          left: `${position.x}%`,
          opacity: getParticleOpacity(stage, reducedMotion, particle),
          top: `${position.y}%`,
          transitionDelay: formed ? `${particle.index % 18 * 10}ms` : `${particle.index % 44 * 12}ms`,
          transitionDuration: `${transitionDuration}ms`,
          transform: [
            { translateX: -particle.width / 2 },
            { translateY: -particle.height / 2 },
            { rotate: `${formed ? particle.rotate * 0.14 - 10 : particle.rotate}deg` },
            { scale: formed ? 0.54 : stage === 'drift' ? 1.14 : stage === 'gather' ? 1.02 : 0.82 }
          ],
          width: particle.width
        };
      }),
    [particles, reducedMotion, stage]
  );

  if (!visible) {
    return null;
  }

  const iconOpacity = getIconOpacity(stage, reducedMotion);
  const iconFillOpacity = getIconFillOpacity(stage, reducedMotion);
  const captionVisible = stage === 'write' || stage === 'settle' || stage === 'exit';

  return (
    <View
      accessibilityLabel={t('landing.intro.accessibilityLabel', 'Sagak Sagak intro animation')}
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

      <View pointerEvents="none" style={[styles.iconStage, stage === 'exit' && styles.iconStageExit]}>
        <View
          style={[
            styles.appIcon,
            {
              height: iconSize,
              opacity: iconOpacity,
              transform: [
                { translateY: stage === 'settle' ? -3 : stage === 'exit' ? -18 : 0 },
                { scale: stage === 'assemble' ? 0.9 : stage === 'icon' ? 0.98 : 1 }
              ],
              width: iconSize
            }
          ]}
        >
          <View style={[styles.iconFill, { opacity: iconFillOpacity }]} />
          <View style={[styles.iconInnerGlow, { opacity: stage === 'assemble' ? 0.15 : 1 }]} />
          <View style={[styles.iconPaperFold, { opacity: stage === 'assemble' ? 0.22 : 1 }]} />
          <View style={styles.drawLayer}>
            {DRAW_SEGMENTS.map((segment, index) => (
              <View
                key={`draw-segment-${index}`}
                style={[
                  styles.drawSegment,
                  {
                    left: `${segment.left}%`,
                    opacity: drawStep > index ? 1 : stage === 'settle' || reducedMotion ? 1 : 0,
                    top: `${segment.top}%`,
                    transform: [{ rotate: `${segment.rotate}deg` }],
                    width: drawStep > index || stage === 'settle' || reducedMotion ? `${segment.width}%` : '0%'
                  }
                ]}
              />
            ))}
          </View>
          <IconPencil drawStep={drawStep} stage={stage} />
        </View>
      </View>

      <View style={[styles.caption, captionVisible && styles.captionVisible, stage === 'exit' && styles.captionExit]}>
        <Text style={styles.captionTitle}>Sagak Sagak</Text>
        <Text style={styles.captionText}>
          {t('landing.intro.subtitle', 'Scattered study signals gather into one learning icon.')}
        </Text>
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
    zIndex: 1000
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
    backgroundColor: 'rgba(241, 200, 154, 0.08)'
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
  paperParticle: {
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 246, 223, 0.16)'
  },
  noteCardParticle: {
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 7,
    paddingHorizontal: 6
  },
  noteCardLineWide: {
    height: 3,
    width: '78%',
    borderRadius: 999,
    backgroundColor: 'rgba(217, 255, 247, 0.62)'
  },
  noteCardLineShort: {
    height: 3,
    width: '48%',
    borderRadius: 999,
    backgroundColor: 'rgba(123, 199, 246, 0.58)'
  },
  graphParticle: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 3,
    borderWidth: 1,
    borderRadius: 7,
    paddingHorizontal: 5,
    paddingBottom: 4
  },
  graphBar: {
    width: 4,
    borderRadius: 999,
    backgroundColor: '#73C9BD'
  },
  graphBarShort: {
    height: '42%'
  },
  graphBarTall: {
    height: '78%',
    backgroundColor: '#7BC7F6'
  },
  graphBarMid: {
    height: '58%'
  },
  bubbleParticle: {
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 7
  },
  bubbleLineWide: {
    height: 3,
    width: '68%',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 246, 223, 0.7)'
  },
  bubbleLineShort: {
    height: 3,
    width: '42%',
    borderRadius: 999,
    backgroundColor: 'rgba(115, 201, 189, 0.75)'
  },
  tokenParticle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
    textShadowColor: 'rgba(115, 201, 189, 0.65)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12
  },
  iconStage: {
    alignItems: 'center',
    justifyContent: 'center',
    transitionDuration: '680ms',
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: 'ease-out'
  },
  iconStageExit: {
    opacity: 0,
    transform: [{ translateY: -16 }, { scale: 0.94 }]
  },
  appIcon: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 42,
    borderWidth: 1,
    borderColor: 'rgba(217, 255, 247, 0.72)',
    backgroundColor: 'transparent',
    shadowColor: '#071728',
    shadowOpacity: 0.38,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 24 },
    transitionDuration: '760ms',
    transitionProperty: 'opacity, transform, width, height',
    transitionTimingFunction: 'cubic-bezier(0.18, 0.82, 0.25, 1)'
  },
  iconFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF4DD',
    transitionDuration: '760ms',
    transitionProperty: 'opacity',
    transitionTimingFunction: 'ease-out'
  },
  iconInnerGlow: {
    position: 'absolute',
    width: '74%',
    height: '74%',
    borderRadius: 999,
    backgroundColor: 'rgba(115, 201, 189, 0.16)',
    transitionDuration: '640ms',
    transitionProperty: 'opacity',
    transitionTimingFunction: 'ease-out'
  },
  iconPaperFold: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '26%',
    height: '26%',
    borderBottomLeftRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.56)',
    transitionDuration: '640ms',
    transitionProperty: 'opacity',
    transitionTimingFunction: 'ease-out'
  },
  drawLayer: {
    ...StyleSheet.absoluteFillObject
  },
  drawSegment: {
    position: 'absolute',
    height: 5,
    borderRadius: 999,
    backgroundColor: '#1F7CC4',
    shadowColor: '#7BC7F6',
    shadowOpacity: 0.4,
    shadowRadius: 9,
    transitionDuration: '260ms',
    transitionProperty: 'width, opacity',
    transitionTimingFunction: 'ease-out'
  },
  iconPencil: {
    position: 'absolute',
    width: 76,
    height: 26,
    flexDirection: 'row',
    alignItems: 'stretch',
    transitionDuration: '210ms',
    transitionProperty: 'left, top, opacity, transform',
    transitionTimingFunction: 'ease-out',
    zIndex: 3
  },
  iconPencilBody: {
    flex: 1,
    overflow: 'hidden',
    borderTopLeftRadius: 13,
    borderBottomLeftRadius: 13,
    backgroundColor: colors.mint
  },
  iconPencilHighlight: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.32)'
  },
  iconPencilWood: {
    width: 13,
    backgroundColor: '#F1C89A'
  },
  iconPencilTip: {
    width: 0,
    height: 0,
    borderTopWidth: 13,
    borderBottomWidth: 13,
    borderLeftWidth: 20,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#173B63'
  },
  caption: {
    position: 'absolute',
    bottom: 72,
    alignItems: 'center',
    maxWidth: 420,
    paddingHorizontal: 24,
    opacity: 0,
    transform: [{ translateY: 12 }],
    transitionDuration: '420ms',
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: 'ease-out'
  },
  captionVisible: {
    opacity: 1,
    transform: [{ translateY: 0 }]
  },
  captionExit: {
    opacity: 0,
    transform: [{ translateY: 10 }]
  },
  captionTitle: {
    color: colors.mint,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase'
  },
  captionText: {
    marginTop: 8,
    color: '#D6E7FF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'center'
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
