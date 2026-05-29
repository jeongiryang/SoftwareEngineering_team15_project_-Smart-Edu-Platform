import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../i18n';
import { colors, interactions, interactiveStateStyles, shadows } from '../styles/theme';

const levelStyles = {
  danger: {
    borderColor: colors.danger,
    dotColor: colors.danger,
    surfaceColor: colors.dangerSoft
  },
  info: {
    borderColor: colors.blue,
    dotColor: colors.blue,
    surfaceColor: colors.blueSoft
  },
  success: {
    borderColor: colors.mintDeep,
    dotColor: colors.mintDeep,
    surfaceColor: colors.mintSoft
  },
  warning: {
    borderColor: colors.warning,
    dotColor: colors.warning,
    surfaceColor: colors.warningSoft
  }
};

export default function RealtimeNotice({ notice, onClose }) {
  const { t } = useLanguage();

  if (!notice) {
    return null;
  }

  const currentLevelStyle = levelStyles[notice.level] || levelStyles.info;

  return (
    <View
      accessibilityRole="alert"
      pointerEvents="box-none"
      style={styles.overlay}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: currentLevelStyle.surfaceColor,
            borderColor: currentLevelStyle.borderColor
          }
        ]}
      >
        <View style={[styles.dot, { backgroundColor: currentLevelStyle.dotColor }]} />
        <View style={styles.copy}>
          <Text style={styles.title}>{notice.title || t('realtime.notice.title', '실시간 공지')}</Text>
          <Text style={styles.message}>{notice.message}</Text>
        </View>
        <Pressable
          accessibilityLabel={t('realtime.notice.close', '공지 닫기')}
          accessibilityRole="button"
          onPress={onClose}
          style={(state) => [styles.closeButton, ...interactiveStateStyles(state)]}
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 18,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
    paddingHorizontal: 16
  },
  card: {
    width: '100%',
    maxWidth: 560,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    ...shadows.card
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999
  },
  copy: {
    flex: 1,
    gap: 4
  },
  title: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900'
  },
  message: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19
  },
  closeButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    ...interactions.transition
  },
  closeText: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 22
  }
});
