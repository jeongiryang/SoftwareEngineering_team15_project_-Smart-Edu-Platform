import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useLanguage } from '../i18n';
import { colors } from '../styles/theme';

const INTRO_TIMELINE = {
  drift: 320,
  gather: 1800,
  silhouette: 3850,
  pencil: 4850,
  textSilhouette: 5750,
  text: 6600,
  caption: 7350,
  shine: 8100,
  settle: 8850,
  exit: 11100,
  done: 11650
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
  'mathToken',
  'studyToken',
  'dash',
  'pencilShard',
  'strokeShard',
  'dot',
  'studyToken',
  'keywordToken'
];
const FORMED_STAGES = new Set(['silhouette', 'pencil', 'textSilhouette', 'text', 'caption', 'shine', 'settle', 'exit']);
const MASCOT_STAGES = new Set(['pencil', 'textSilhouette', 'text', 'caption', 'shine', 'settle', 'exit']);
const WORD_STAGES = new Set(['textSilhouette', 'text', 'caption', 'shine', 'settle', 'exit']);
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
const PENCIL_AXIS = {
  tip: { x: 45.4, y: 57.2 },
  cap: { x: 56.8, y: 24.8 }
};
const PENCIL_DX = PENCIL_AXIS.cap.x - PENCIL_AXIS.tip.x;
const PENCIL_DY = PENCIL_AXIS.cap.y - PENCIL_AXIS.tip.y;
const PENCIL_LENGTH = Math.sqrt(PENCIL_DX * PENCIL_DX + PENCIL_DY * PENCIL_DY);
const PENCIL_PERP_X = -PENCIL_DY / PENCIL_LENGTH;
const PENCIL_PERP_Y = PENCIL_DX / PENCIL_LENGTH;

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
    x: PENCIL_AXIS.tip.x + PENCIL_DX * t + PENCIL_PERP_X * offset,
    y: PENCIL_AXIS.tip.y + PENCIL_DY * t + PENCIL_PERP_Y * offset
  };
}

function getPencilTarget(index) {
  const type = index % 14;
  const t = seeded(index, 11);
  const u = seeded(index, 13);
  const bodyT = (index % 160) / 159;
  const offset = (u - 0.5) * 3.6;

  if (type <= 7) {
    const point = getPencilLinePoint(0.27 + bodyT * 0.68, offset);
    return { kind: 'body', x: point.x, y: point.y };
  }

  if (type === 8) {
    const point = getPencilLinePoint(0.9 + t * 0.09, (u - 0.5) * 3.2);
    return { kind: 'cap', x: point.x, y: point.y };
  }

  if (type === 9) {
    const point = getPencilLinePoint(0.34 + t * 0.5, -1.05 + (u - 0.5) * 0.6);
    return { kind: 'highlight', x: point.x, y: point.y };
  }

  if (type <= 11) {
    const point = getPencilLinePoint(0.11 + t * 0.19, (u - 0.5) * 3.9);
    return { kind: 'wood', x: point.x, y: point.y };
  }

  const point = getPencilLinePoint(t * 0.1, (u - 0.5) * 2.4);
  return { kind: 'tip', x: point.x, y: point.y };
}

function getTextTarget(index) {
  const textIndex = Math.floor(index / 3);
  const charIndex = textIndex % TEXT_SEQUENCE.length;
  const mask = TEXT_MASKS[TEXT_SEQUENCE[charIndex]];
  const [cellX, cellY] = mask[Math.floor(textIndex / TEXT_SEQUENCE.length) % mask.length];
  const jitterX = (seeded(index, 17) - 0.5) * 0.42;
  const jitterY = (seeded(index, 19) - 0.5) * 0.42;

  return {
    kind: 'text',
    x: 41.6 + charIndex * 4.42 + cellX * 0.5 + jitterX,
    y: 64.6 + cellY * 0.82 + jitterY
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

function lockIntroChrome() {
  const browserDocument = typeof globalThis !== 'undefined' ? globalThis.document : null;

  if (Platform.OS !== 'web' || !browserDocument?.body) {
    return undefined;
  }

  const styleId = 'sagak-intro-chrome-lock';
  let styleNode = browserDocument.getElementById(styleId);

  if (!styleNode) {
    styleNode = browserDocument.createElement('style');
    styleNode.id = styleId;
    styleNode.textContent = `
      body.sagak-intro-active {
        overflow: hidden !important;
      }
      body.sagak-intro-active header,
      body.sagak-intro-active nav,
      body.sagak-intro-active [role="banner"],
      body.sagak-intro-active [data-sagak-intro-hide="true"] {
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
      body.sagak-intro-active [data-sagak-intro-root="true"] {
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto !important;
      }
    `;
    browserDocument.head?.appendChild(styleNode);
  }

  browserDocument.body.classList.add('sagak-intro-active');

  const hiddenNodes = [];
  const candidates = Array.from(browserDocument.querySelectorAll('header, nav, [role="banner"], div'));

  candidates.forEach((node) => {
    if (node.closest?.('[data-sagak-intro-root="true"]')) {
      return;
    }

    const rect = node.getBoundingClientRect?.();
    const text = node.textContent || '';
    const looksLikeHeader = /사각사각|Smart Edu Platform|서비스 소개|로그인/.test(text);
    const isTopChrome = rect && rect.top <= 120 && rect.height > 20 && rect.height <= 160 && rect.width >= 260;

    if (looksLikeHeader && isTopChrome) {
      hiddenNodes.push({
        node,
        opacity: node.style.opacity,
        pointerEvents: node.style.pointerEvents,
        visibility: node.style.visibility
      });
      node.dataset.sagakIntroHide = 'true';
      node.style.opacity = '0';
      node.style.visibility = 'hidden';
      node.style.pointerEvents = 'none';
    }
  });

  return () => {
    hiddenNodes.forEach(({ node, opacity, pointerEvents, visibility }) => {
      node.style.opacity = opacity;
      node.style.pointerEvents = pointerEvents;
      node.style.visibility = visibility;
      delete node.dataset.sagakIntroHide;
    });
    browserDocument.body.classList.remove('sagak-intro-active');
  };
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

  if (stage === 'silhouette' || stage === 'pencil') {
    if (particle.targetKind === 'text') {
      return { x: particle.surgeX, y: particle.surgeY };
    }

    return { x: particle.targetX, y: particle.targetY };
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

  if (stage === 'silhouette') {
    return particle.targetKind === 'text' ? 0.08 : 1;
  }

  if (stage === 'pencil') {
    return particle.targetKind === 'text' ? 0.14 : 0.54;
  }

  if (stage === 'textSilhouette') {
    return particle.targetKind === 'text' ? 1 : 0.18;
  }

  if (stage === 'text') {
    return particle.targetKind === 'text' ? 0.58 : 0.06;
  }

  if (stage === 'caption') {
    return particle.targetKind === 'text' ? 0.3 : 0.03;
  }

  if (stage === 'shine') {
    return particle.targetKind === 'text' ? 0.2 : 0.02;
  }

  if (stage === 'settle') {
    return particle.targetKind === 'text' ? 0.12 : 0;
  }

  return 0;
}

function getMascotPartOpacity(part, stage, reducedMotion) {
  if (reducedMotion) {
    return 1;
  }

  if (stage === 'pencil') {
    if (part === 'body') {
      return 0.78;
    }

    if (part === 'cap') {
      return 0.58;
    }

    return 0.48;
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

  if (stage === 'pencil') {
    return 0.9;
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

  if (stage === 'textSilhouette') {
    return 0.18;
  }

  if (stage === 'text') {
    return 0.82;
  }

  if (stage === 'caption' || stage === 'shine') {
    return 1;
  }

  if (stage === 'settle' || stage === 'exit') {
    return 1;
  }

  return 0;
}

function getCaptionOpacity(stage, reducedMotion) {
  if (reducedMotion) {
    return 1;
  }

  if (stage === 'caption') {
    return 0.72;
  }

  if (stage === 'shine' || stage === 'settle' || stage === 'exit') {
    return 1;
  }

  return 0;
}

function getShineOpacity(stage, reducedMotion) {
  if (reducedMotion) {
    return 0;
  }

  return stage === 'shine' ? 0.72 : 0;
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
          transform: [
            { translateX: -pencilWidth / 2 },
            { translateY: -38 },
            { rotate: '126deg' },
            { scale: stage === 'pencil' ? 0.94 : 1 }
          ],
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
  const wordWidth = Math.min((width || 1024) * 0.82, 440);
  const shineTranslate = stage === 'shine' || stage === 'settle' || stage === 'exit' ? wordWidth * 0.72 : -wordWidth * 0.72;

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

    return lockIntroChrome();
  }, [visible]);

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
      setTimeout(() => setStage('silhouette'), INTRO_TIMELINE.silhouette),
      setTimeout(() => setStage('pencil'), INTRO_TIMELINE.pencil),
      setTimeout(() => setStage('textSilhouette'), INTRO_TIMELINE.textSilhouette),
      setTimeout(() => setStage('text'), INTRO_TIMELINE.text),
      setTimeout(() => setStage('caption'), INTRO_TIMELINE.caption),
      setTimeout(() => setStage('shine'), INTRO_TIMELINE.shine),
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
        const transitionDuration = stage === 'drift' ? 1680 : stage === 'gather' ? 1920 : stage === 'silhouette' ? 980 : 720;
        const isToken = particle.shape === 'mathToken' || particle.shape === 'studyToken' || particle.shape === 'keywordToken';
        const silhouetteScale = particle.targetKind === 'text' ? 0.52 : 0.46;

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
            { scale: formed ? silhouetteScale : stage === 'drift' ? 1.16 : stage === 'gather' ? 1.04 : 0.82 }
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
      dataSet={{ sagakIntroRoot: 'true' }}
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

      <View
        style={[
          styles.wordLockup,
          {
            transform: [
              { translateX: -wordWidth / 2 },
              { translateY: WORD_STAGES.has(stage) ? 0 : 18 }
            ],
            width: wordWidth
          },
          WORD_STAGES.has(stage) && styles.wordLockupVisible,
          stage === 'exit' && {
            opacity: 0,
            transform: [{ translateX: -wordWidth / 2 }, { translateY: 10 }]
          }
        ]}
      >
        <Text style={[styles.wordTitle, { opacity: getWordOpacity(stage, reducedMotion) }]}>사각사각</Text>
        <Text style={[styles.wordCaption, { opacity: getCaptionOpacity(stage, reducedMotion) }]}>Smart Edu Platform</Text>
        <View
          pointerEvents="none"
          style={[
            styles.logoShine,
            {
              opacity: getShineOpacity(stage, reducedMotion),
              transform: [{ translateX: shineTranslate }, { rotate: '-10deg' }]
            }
          ]}
        />
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
    backgroundColor: '#071827',
    transitionDuration: '680ms',
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: 'ease-out',
    zIndex: 2147483647,
    elevation: 9999,
    isolation: 'isolate'
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
    backgroundColor: 'rgba(115, 201, 189, 0.075)'
  },
  glowBlue: {
    position: 'absolute',
    width: '76%',
    height: '64%',
    right: '-24%',
    bottom: '-18%',
    borderRadius: 999,
    backgroundColor: 'rgba(31, 94, 150, 0.09)'
  },
  glowWarm: {
    position: 'absolute',
    width: '52%',
    height: '44%',
    left: '25%',
    top: '34%',
    borderRadius: 999,
    backgroundColor: 'rgba(241, 200, 154, 0.035)'
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
    ...StyleSheet.absoluteFillObject,
    transitionDuration: '680ms',
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: 'ease-out'
  },
  mascotStageExit: {
    opacity: 0,
    transform: [{ scale: 0.96 }]
  },
  pencilMascotWrap: {
    position: 'absolute',
    left: '51%',
    top: '40.5%',
    flexDirection: 'row',
    alignItems: 'center',
    height: 76,
    borderRadius: 999,
    shadowColor: '#061322',
    shadowOpacity: 0.5,
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
    backgroundColor: '#FFF0D0',
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
    backgroundColor: '#5ECABB',
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
    backgroundColor: '#F0B66D',
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
    borderLeftColor: '#12395F',
    transitionDuration: '560ms',
    transitionProperty: 'opacity',
    transitionTimingFunction: 'ease-out'
  },
  wordLockup: {
    position: 'absolute',
    left: '50%',
    top: '64%',
    alignItems: 'center',
    overflow: 'hidden',
    paddingVertical: 10,
    opacity: 0,
    transitionDuration: '520ms',
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: 'ease-out'
  },
  wordLockupVisible: {
    opacity: 1
  },
  wordTitle: {
    color: '#D9FFF7',
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: 1.8,
    textShadowColor: 'rgba(31, 124, 196, 0.45)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 18,
    transitionDuration: '520ms',
    transitionProperty: 'opacity',
    transitionTimingFunction: 'ease-out'
  },
  wordCaption: {
    marginTop: 6,
    color: 'rgba(255, 246, 223, 0.82)',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(123, 199, 246, 0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    transitionDuration: '640ms',
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: 'ease-out'
  },
  logoShine: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: '50%',
    width: 46,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    shadowColor: '#D9FFF7',
    shadowOpacity: 0.7,
    shadowRadius: 20,
    transitionDuration: '720ms',
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: 'cubic-bezier(0.16, 0.9, 0.18, 1)'
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
