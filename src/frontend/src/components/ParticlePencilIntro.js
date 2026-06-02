import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useLanguage } from '../i18n';
import { colors } from '../styles/theme';

const INTRO_TIMELINE = {
  drift: 720,
  gather: 2100,
  icon: 3060,
  write: 3650,
  settle: 4880,
  exit: 5320,
  done: 5700
};

const DRAW_STEP_DELAYS = [0, 180, 360, 560, 760, 980];
const PARTICLE_COLORS = ['#FFF6DF', '#D9FFF7', '#73C9BD', '#1F5E96', '#7BC7F6', '#F1C89A'];
const PARTICLE_TOKENS = ['AI', 'Q', 'A', 'log', 'memo', 'plan', 'focus', 'quiz', 'D-7', '25'];
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

function seeded(index, salt) {
  const value = Math.sin(index * 127.13 + salt * 811.7) * 10000;
  return value - Math.floor(value);
}

function getParticleCount(width) {
  if (width >= 1180) {
    return 390;
  }

  if (width >= 780) {
    return 230;
  }

  return 132;
}

function getStartPosition(index) {
  const side = index % 8;
  const spread = seeded(index, 3);
  const secondary = seeded(index, 7);

  if (side === 0) {
    return { x: -10 + spread * 8, y: secondary * 100 };
  }

  if (side === 1) {
    return { x: 102 + spread * 10, y: secondary * 100 };
  }

  if (side === 2) {
    return { x: spread * 100, y: -12 + secondary * 8 };
  }

  if (side === 3) {
    return { x: spread * 100, y: 102 + secondary * 10 };
  }

  if (side === 4) {
    return { x: 8 + spread * 24, y: 8 + secondary * 22 };
  }

  if (side === 5) {
    return { x: 68 + spread * 24, y: 10 + secondary * 30 };
  }

  if (side === 6) {
    return { x: 10 + spread * 30, y: 66 + secondary * 24 };
  }

  return { x: 58 + spread * 32, y: 60 + secondary * 28 };
}

function getIconTarget(index, count) {
  const type = index % 9;
  const t = seeded(index, 11);
  const u = seeded(index, 13);

  if (type <= 2) {
    const edge = index % 4;
    const edgeT = t;

    if (edge === 0) {
      return { x: 39 + edgeT * 22, y: 27 + u * 2.2 };
    }

    if (edge === 1) {
      return { x: 39 + edgeT * 22, y: 56 + u * 2.2 };
    }

    if (edge === 2) {
      return { x: 38.5 + u * 2.4, y: 28 + edgeT * 28 };
    }

    return { x: 61 + u * 2.4, y: 28 + edgeT * 28 };
  }

  if (type <= 5) {
    const lineT = (index % 64) / 63;
    return {
      x: 41 + lineT * 22 + (u - 0.5) * 2.4,
      y: 49 - lineT * 19 + (t - 0.5) * 3.2
    };
  }

  if (type === 6) {
    const zig = (index % 24) / 23;
    return {
      x: 42 + zig * 18,
      y: 47 + Math.sin(zig * Math.PI * 5) * 3.4 + (u - 0.5) * 1.8
    };
  }

  return {
    x: 41 + seeded(index, 19) * 20,
    y: 30 + seeded(index, 23) * 24
  };
}

function buildParticles(count) {
  return Array.from({ length: count }, (_, index) => {
    const start = getStartPosition(index);
    const target = getIconTarget(index, count);
    const angle = seeded(index, 29) * Math.PI * 2;
    const radius = 18 + seeded(index, 31) * 24;

    return {
      id: `intro-particle-${index}`,
      color: PARTICLE_COLORS[index % PARTICLE_COLORS.length],
      driftX: 50 + Math.cos(angle) * radius + (seeded(index, 37) - 0.5) * 16,
      driftY: 43 + Math.sin(angle) * radius * 0.72 + (seeded(index, 41) - 0.5) * 12,
      height: 4 + Math.round(seeded(index, 43) * 7),
      index,
      rotate: -80 + seeded(index, 47) * 160,
      shape: index % 11 === 0 ? 'token' : index % 5 === 0 ? 'dash' : index % 4 === 0 ? 'paper' : index % 3 === 0 ? 'square' : 'dot',
      size: 4 + Math.round(seeded(index, 53) * 7),
      startX: start.x,
      startY: start.y,
      targetX: target.x,
      targetY: target.y,
      token: PARTICLE_TOKENS[index % PARTICLE_TOKENS.length],
      width: 5 + Math.round(seeded(index, 59) * 14)
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

  return { x: particle.targetX, y: particle.targetY };
}

function getParticleOpacity(stage, reducedMotion) {
  if (reducedMotion) {
    return 0;
  }

  if (stage === 'scatter') {
    return 0.52;
  }

  if (stage === 'drift') {
    return 0.88;
  }

  if (stage === 'gather') {
    return 0.96;
  }

  if (stage === 'exit') {
    return 0;
  }

  return 0.14;
}

function IconPencil({ drawStep, stage }) {
  const position = PENCIL_POSITIONS[Math.min(drawStep, PENCIL_POSITIONS.length - 1)];
  const isWriting = stage === 'write';

  return (
    <View
      style={[
        styles.iconPencil,
        {
          left: `${position.left}%`,
          opacity: stage === 'icon' || stage === 'write' || stage === 'settle' || stage === 'exit' ? 1 : 0,
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

export default function ParticlePencilIntro({ visible, onDone }) {
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const [stage, setStage] = useState('scatter');
  const [drawStep, setDrawStep] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(getPrefersReducedMotion);
  const particleCount = getParticleCount(width || 1024);
  const iconSize = width < 520 ? 150 : width < 900 ? 178 : 206;

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
      const timer = setTimeout(onDone, 1500);
      return () => clearTimeout(timer);
    }

    const timers = [
      setTimeout(() => setStage('drift'), INTRO_TIMELINE.drift),
      setTimeout(() => setStage('gather'), INTRO_TIMELINE.gather),
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
        const formed = stage === 'icon' || stage === 'write' || stage === 'settle' || stage === 'exit';
        const isDash = particle.shape === 'dash' || particle.shape === 'paper';
        const transitionDuration = stage === 'drift' ? 1450 : stage === 'gather' ? 1860 : 720;

        return {
          backgroundColor: particle.shape === 'token' ? 'transparent' : particle.color,
          borderColor: particle.shape === 'paper' ? 'rgba(255, 246, 223, 0.75)' : particle.color,
          color: particle.color,
          height: isDash ? particle.height : particle.size,
          left: `${position.x}%`,
          opacity: getParticleOpacity(stage, reducedMotion),
          top: `${position.y}%`,
          transitionDelay: formed ? '0ms' : `${particle.index % 32 * 13}ms`,
          transitionDuration: `${transitionDuration}ms`,
          transform: [
            { translateX: -particle.width / 2 },
            { translateY: -particle.height / 2 },
            { rotate: `${formed ? particle.rotate * 0.16 - 12 : particle.rotate}deg` },
            { scale: formed ? 0.58 : stage === 'drift' ? 1.16 : stage === 'gather' ? 1.02 : 0.82 }
          ],
          width: isDash ? particle.width : particle.size
        };
      }),
    [particles, reducedMotion, stage]
  );

  if (!visible) {
    return null;
  }

  return (
    <View
      accessibilityLabel={t('landing.intro.accessibilityLabel', 'Sagak Sagak intro animation')}
      style={[styles.overlay, stage === 'exit' && styles.overlayExit]}
    >
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.backgroundGlow}>
        <View style={styles.glowCream} />
        <View style={styles.glowMint} />
        <View style={styles.glowBlue} />
        <View style={styles.softGrid} />
      </View>

      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.particleLayer}>
        {particles.map((particle, index) => {
          const nodeStyle = [
            styles.particle,
            styles[`${particle.shape}Particle`],
            particleStyles[index]
          ];

          if (particle.shape === 'token') {
            return (
              <Text key={particle.id} style={nodeStyle}>
                {particle.token}
              </Text>
            );
          }

          return <View key={particle.id} style={nodeStyle} />;
        })}
      </View>

      <View pointerEvents="none" style={[styles.iconStage, stage === 'exit' && styles.iconStageExit]}>
        <View
          style={[
            styles.appIcon,
            {
              height: iconSize,
              opacity: stage === 'gather' ? 0.18 : stage === 'scatter' || stage === 'drift' ? 0 : 1,
              transform: [
                { translateY: stage === 'settle' ? -3 : stage === 'exit' ? -18 : 0 },
                { scale: stage === 'gather' ? 0.88 : stage === 'icon' ? 0.98 : 1 }
              ],
              width: iconSize
            }
          ]}
        >
          <View style={styles.iconInnerGlow} />
          <View style={styles.iconPaperFold} />
          <View style={styles.iconLineGuide} />
          <View style={styles.drawLayer}>
            {DRAW_SEGMENTS.map((segment, index) => (
              <View
                key={`draw-segment-${index}`}
                style={[
                  styles.drawSegment,
                  {
                    left: `${segment.left}%`,
                    opacity: drawStep > index ? 1 : stage === 'settle' ? 1 : 0,
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

      <View style={[styles.caption, stage === 'exit' && styles.captionExit]}>
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
  glowCream: {
    position: 'absolute',
    width: '58%',
    height: '46%',
    left: '18%',
    top: '19%',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 246, 223, 0.08)'
  },
  glowMint: {
    position: 'absolute',
    width: '64%',
    height: '52%',
    left: '-18%',
    top: '3%',
    borderRadius: 999,
    backgroundColor: 'rgba(115, 201, 189, 0.22)'
  },
  glowBlue: {
    position: 'absolute',
    width: '70%',
    height: '58%',
    right: '-18%',
    bottom: '-12%',
    borderRadius: 999,
    backgroundColor: 'rgba(55, 100, 154, 0.26)'
  },
  softGrid: {
    position: 'absolute',
    width: '78%',
    height: '62%',
    left: '11%',
    top: '19%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(217, 255, 247, 0.12)',
    transform: [{ rotate: '-7deg' }]
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
    shadowOpacity: 0.35,
    shadowRadius: 8
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
  paperParticle: {
    borderRadius: 3,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 246, 223, 0.18)'
  },
  tokenParticle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0,
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
    borderColor: 'rgba(255, 255, 255, 0.58)',
    backgroundColor: '#FFF4DD',
    shadowColor: '#071728',
    shadowOpacity: 0.36,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 24 },
    transitionDuration: '760ms',
    transitionProperty: 'opacity, transform, width, height',
    transitionTimingFunction: 'cubic-bezier(0.18, 0.82, 0.25, 1)'
  },
  iconInnerGlow: {
    position: 'absolute',
    width: '74%',
    height: '74%',
    borderRadius: 999,
    backgroundColor: 'rgba(115, 201, 189, 0.16)'
  },
  iconPaperFold: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '26%',
    height: '26%',
    borderBottomLeftRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.56)'
  },
  iconLineGuide: {
    position: 'absolute',
    left: '19%',
    right: '19%',
    bottom: '25%',
    height: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(31, 94, 150, 0.13)'
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
    opacity: 1,
    transitionDuration: '420ms',
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: 'ease-out'
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
