import { useMemo, useState } from 'react';
import { Image, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../i18n';
import { colors, interactions, interactiveStateStyles, shadows } from '../styles/theme';

const icon = require('../assets/sagaksagak-app-icon.png');

const DEFAULT_MAINTENANCE_TITLE = '사각사각 업데이트 중';
const DEFAULT_MAINTENANCE_MESSAGE = '더 좋은 학습 경험을 준비하고 있어요. 조금만 기다려주세요.';

function formatEstimatedEnd(value, t) {
  if (!value) {
    return t('maintenance.screen.estimatedUnknown', '예상 종료 시간은 아직 확정되지 않았어요.');
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return t('maintenance.screen.estimatedUnknown', '예상 종료 시간은 아직 확정되지 않았어요.');
  }

  return t('maintenance.screen.estimatedPrefix', '예상 종료') + `: ${date.toLocaleString()}`;
}

export default function MaintenanceScreen({
  errorMessage,
  maintenance,
  onAdminLogin,
  onRefresh,
  refreshing = false
}) {
  const { t } = useLanguage();
  const [localRefreshing, setLocalRefreshing] = useState(false);
  const displayTitle = maintenance?.title && maintenance.title !== DEFAULT_MAINTENANCE_TITLE
    ? maintenance.title
    : t('maintenance.screen.title', DEFAULT_MAINTENANCE_TITLE);
  const displayMessage = maintenance?.message && maintenance.message !== DEFAULT_MAINTENANCE_MESSAGE
    ? maintenance.message
    : t('maintenance.screen.message', DEFAULT_MAINTENANCE_MESSAGE);
  const estimatedText = useMemo(
    () => formatEstimatedEnd(maintenance?.estimatedEndAt, t),
    [maintenance?.estimatedEndAt, t]
  );
  const busy = refreshing || localRefreshing;

  async function handleRefresh() {
    if (!onRefresh || busy) {
      return;
    }

    setLocalRefreshing(true);

    try {
      await onRefresh();
    } finally {
      setLocalRefreshing(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundAccentTop} />
      <View style={styles.backgroundAccentBottom} />
      <View style={styles.shell}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Image source={icon} style={styles.icon} />
          </View>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusPillText}>
              {t('maintenance.screen.badge', 'Service update')}
            </Text>
          </View>
          <Text style={styles.title}>{displayTitle}</Text>
          <Text style={styles.message}>{displayMessage}</Text>
          <View style={styles.estimatedBox}>
            <Text style={styles.estimatedLabel}>
              {t('maintenance.screen.estimatedLabel', '점검 안내')}
            </Text>
            <Text style={styles.estimatedText}>{estimatedText}</Text>
          </View>
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('maintenance.screen.refresh', '다시 확인하기')}
              disabled={busy}
              onPress={handleRefresh}
              style={(state) => [
                styles.primaryButton,
                busy && styles.disabledButton,
                ...interactiveStateStyles(state, { disabled: busy })
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {busy
                  ? t('maintenance.screen.refreshing', '확인 중')
                  : t('maintenance.screen.refresh', '다시 확인하기')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('maintenance.screen.adminLogin', '관리자 로그인')}
              onPress={onAdminLogin}
              style={(state) => [styles.secondaryButton, ...interactiveStateStyles(state)]}
            >
              <Text style={styles.secondaryButtonText}>
                {t('maintenance.screen.adminLogin', '관리자 로그인')}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.notice}>
            {t(
              'maintenance.screen.notice',
              '관리자는 로그인 후 점검 중에도 관리자 화면에 접근할 수 있어요.'
            )}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden'
  },
  backgroundAccentTop: {
    position: 'absolute',
    top: -90,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: colors.mintSoft,
    opacity: 0.9
  },
  backgroundAccentBottom: {
    position: 'absolute',
    bottom: -120,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 320,
    backgroundColor: colors.blueSoft,
    opacity: 0.85
  },
  shell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22
  },
  card: {
    width: '100%',
    maxWidth: 620,
    alignItems: 'center',
    gap: 16,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingVertical: 42,
    paddingHorizontal: 28,
    ...shadows.card
  },
  iconWrap: {
    width: 86,
    height: 86,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 18
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.mint,
    backgroundColor: colors.mintSoft,
    paddingHorizontal: 12
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.mintDeep
  },
  statusPillText: {
    color: colors.mintDeep,
    fontSize: 12,
    fontWeight: '800'
  },
  title: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 40,
    textAlign: 'center'
  },
  message: {
    maxWidth: 480,
    color: colors.muted,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 25,
    textAlign: 'center'
  },
  estimatedBox: {
    width: '100%',
    maxWidth: 460,
    gap: 5,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 16
  },
  estimatedLabel: {
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center'
  },
  estimatedText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'center'
  },
  errorBox: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
    padding: 12
  },
  errorText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center'
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10
  },
  primaryButton: {
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.blue,
    paddingHorizontal: 20,
    ...interactions.transition
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '900'
  },
  secondaryButton: {
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 20,
    ...interactions.transition
  },
  secondaryButtonText: {
    color: colors.blueDeep,
    fontSize: 14,
    fontWeight: '900'
  },
  disabledButton: {
    opacity: 0.65
  },
  notice: {
    maxWidth: 460,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center'
  }
});
