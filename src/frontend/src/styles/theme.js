export const colors = {
  background: '#FCF8EF',
  surface: '#FFFFFF',
  surfaceWarm: '#FFF9EE',
  cream: '#FFF1D9',
  creamStrong: '#F3D4A0',
  mint: '#73C9BD',
  mintDeep: '#319B96',
  mintSoft: '#E7F5F0',
  blue: '#37649A',
  blueDeep: '#173B63',
  blueSoft: '#EAF1F8',
  ink: '#183246',
  muted: '#6D7A7A',
  line: '#E9E1D3',
  success: '#247C67',
  successSoft: '#E4F5EE',
  warning: '#A65C39',
  warningSoft: '#FCEFE7',
  danger: '#AE4945',
  dangerSoft: '#FCEDEC'
};

export const shadows = {
  card: {
    shadowColor: '#29404B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 22,
    elevation: 3
  }
};

export const radii = {
  chip: 999,
  control: 12,
  card: 20,
  panel: 24
};

export const interactions = {
  transition: {
    transitionProperty: 'background-color, border-color, box-shadow, opacity, transform',
    transitionDuration: '140ms',
    transitionTimingFunction: 'ease-out'
  },
  buttonHover: {
    borderColor: colors.mintDeep,
    shadowColor: colors.blueDeep,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 2,
    transform: [{ translateY: -1 }]
  },
  buttonPressed: {
    opacity: 0.9,
    shadowOpacity: 0.05,
    transform: [{ translateY: 1 }, { scale: 0.98 }]
  },
  buttonFocus: {
    borderColor: colors.blue,
    shadowColor: colors.mintDeep,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 9,
    elevation: 2
  },
  cardHover: {
    borderColor: colors.mint,
    shadowColor: colors.blueDeep,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.11,
    shadowRadius: 24,
    elevation: 4,
    transform: [{ translateY: -2 }]
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ translateY: 1 }, { scale: 0.995 }]
  },
  cardFocus: {
    borderColor: colors.blue,
    shadowColor: colors.mintDeep,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3
  },
  activeBorder: {
    borderColor: colors.mintDeep
  }
};

export function interactiveStateStyles(state = {}, options = {}) {
  const { disabled = false, kind = 'button' } = options;
  const styles = [interactions.transition];

  if (disabled) {
    return styles;
  }

  if (state.hovered) {
    styles.push(kind === 'card' ? interactions.cardHover : interactions.buttonHover);
  }

  if (state.focused) {
    styles.push(kind === 'card' ? interactions.cardFocus : interactions.buttonFocus);
  }

  if (state.pressed) {
    styles.push(kind === 'card' ? interactions.cardPressed : interactions.buttonPressed);
  }

  return styles;
}

export const designGuidelines = {
  selectedPatterns: [
    'bentoGrid',
    'skeletonUi',
    'customModal',
    'emptyStateAction',
    'microInteraction',
    'calmInterface',
    'accessibilityFirst',
    'smartOnboarding',
    'dataStorytelling',
    'aiTransparency',
    'privacyControl',
    'multimodalInput'
  ],
  deferredPatterns: [
    'neoBrutalism',
    'heavyLiquidGlass',
    'kineticTypography',
    'spatialUi',
    'passkeyLogin',
    'collaborationPresence'
  ],
  firstPassSurfaces: {
    dashboard: ['bentoGrid', 'dataStorytelling', 'emptyStateAction'],
    community: ['skeletonUi', 'customModal', 'microInteraction', 'calmInterface'],
    schedule: ['skeletonUi', 'emptyStateAction', 'accessibilityFirst'],
    taskBoard: ['skeletonUi', 'emptyStateAction', 'microInteraction'],
    aiLearning: ['smartOnboarding', 'aiTransparency', 'privacyControl'],
    accessibility: ['accessibilityFirst', 'privacyControl'],
    admin: ['skeletonUi', 'emptyStateAction', 'calmInterface']
  }
};
