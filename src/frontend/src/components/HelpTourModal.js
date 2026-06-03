import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, interactions, interactiveStateStyles, shadows } from '../styles/theme';

const HELP_TARGET_ATTRIBUTE = 'data-sagak-help-target';

function getHelpTargetElement(targetId) {
  const documentRef = globalThis.document;

  if (!targetId || !documentRef?.querySelector) {
    return null;
  }

  return documentRef.querySelector(`[${HELP_TARGET_ATTRIBUTE}="${targetId}"]`);
}

function highlightTarget(target) {
  if (!target?.style) {
    return () => {};
  }

  const previous = {
    borderRadius: target.style.borderRadius,
    boxShadow: target.style.boxShadow,
    outline: target.style.outline,
    outlineOffset: target.style.outlineOffset,
    position: target.style.position,
    transition: target.style.transition,
    zIndex: target.style.zIndex
  };

  target.style.outline = '3px solid var(--sagak-color-mint, #73C9BD)';
  target.style.outlineOffset = '5px';
  target.style.boxShadow = [
    '0 0 0 7px rgba(115, 201, 189, 0.24)',
    '0 18px 48px rgba(23, 59, 99, 0.20)'
  ].join(', ');
  target.style.borderRadius = target.style.borderRadius || '18px';
  target.style.transition = 'outline 180ms ease, box-shadow 180ms ease';

  if (!target.style.position) {
    target.style.position = 'relative';
  }
  target.style.zIndex = '2';

  return () => {
    target.style.borderRadius = previous.borderRadius;
    target.style.boxShadow = previous.boxShadow;
    target.style.outline = previous.outline;
    target.style.outlineOffset = previous.outlineOffset;
    target.style.position = previous.position;
    target.style.transition = previous.transition;
    target.style.zIndex = previous.zIndex;
  };
}

function scrollTargetIntoView(target) {
  if (!target?.scrollIntoView) {
    return;
  }

  try {
    target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  } catch (error) {
    target.scrollIntoView();
  }
}

export default function HelpTourModal({
  currentIndex,
  labels,
  onClose,
  onNext,
  onPrevious,
  steps,
  visible
}) {
  const currentStep = steps[currentIndex] || null;
  const total = steps.length;

  useEffect(() => {
    if (!visible || !currentStep?.targetId) {
      return undefined;
    }

    let cleanupHighlight = () => {};
    const timer = globalThis.setTimeout?.(() => {
      const target = getHelpTargetElement(currentStep.targetId);

      if (!target) {
        return;
      }

      scrollTargetIntoView(target);
      cleanupHighlight = highlightTarget(target);
    }, 80);

    return () => {
      if (timer) {
        globalThis.clearTimeout?.(timer);
      }
      cleanupHighlight();
    };
  }, [currentStep?.targetId, visible]);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const documentRef = globalThis.document;

    if (!documentRef?.addEventListener) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    documentRef.addEventListener('keydown', handleKeyDown);

    return () => {
      documentRef.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, visible]);

  if (!currentStep) {
    return null;
  }

  const stepCounter = (labels.stepCounter || '{current} / {total}')
    .replace('{current}', String(currentIndex + 1))
    .replace('{total}', String(total));
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex >= total - 1;

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View accessibilityViewIsModal style={styles.overlay}>
        <Pressable
          accessibilityLabel={labels.close}
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdrop}
        />
        <View accessibilityRole="summary" style={[styles.panel, shadows.card]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>{labels.eyebrow}</Text>
              <Text style={styles.stepCounter}>{stepCounter}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={labels.close}
              onPress={onClose}
              style={(state) => [styles.closeButton, ...interactiveStateStyles(state)]}
            >
              <Text style={styles.closeText}>x</Text>
            </Pressable>
          </View>

          <Text style={styles.title}>{currentStep.title}</Text>
          <Text style={styles.description}>{currentStep.description}</Text>

          <View style={styles.controls}>
            <Pressable
              accessibilityRole="button"
              disabled={isFirst}
              onPress={onPrevious}
              style={(state) => [
                styles.secondaryButton,
                isFirst && styles.disabledButton,
                ...interactiveStateStyles(state, { disabled: isFirst })
              ]}
            >
              <Text style={[styles.secondaryText, isFirst && styles.disabledText]}>{labels.previous}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onNext}
              style={(state) => [styles.primaryButton, ...interactiveStateStyles(state)]}
            >
              <Text style={styles.primaryText}>{isLast ? labels.finish : labels.next}</Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={(state) => [styles.skipButton, ...interactiveStateStyles(state)]}
          >
            <Text style={styles.skipText}>{labels.skip}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 18
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 21, 34, 0.48)'
  },
  panel: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 20,
    gap: 12
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12
  },
  eyebrow: {
    color: colors.mintDeep,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1
  },
  stepCounter: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceWarm,
    ...interactions.transition
  },
  closeText: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900'
  },
  title: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28
  },
  description: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 6
  },
  primaryButton: {
    flex: 1,
    minWidth: 150,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: colors.blue,
    borderWidth: 1,
    borderColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    ...interactions.transition
  },
  primaryText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '900'
  },
  secondaryButton: {
    flex: 1,
    minWidth: 120,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    ...interactions.transition
  },
  secondaryText: {
    color: colors.blueDeep,
    fontSize: 14,
    fontWeight: '900'
  },
  disabledButton: {
    opacity: 0.45
  },
  disabledText: {
    color: colors.muted
  },
  skipButton: {
    alignSelf: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...interactions.transition
  },
  skipText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800'
  }
});
