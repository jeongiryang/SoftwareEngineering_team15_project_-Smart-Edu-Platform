import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  getPendingFocusSessionQueue,
  recordFocusSession,
  retryPendingFocusSessions
} from '../services/api';
import { useLanguage } from '../i18n';
import { colors, interactiveStateStyles, shadows } from '../styles/theme';

const ACTIVE_FOCUS_TIMER_STORAGE_KEY = 'smartEdu.activeFocusTimer';
const DEFAULT_TIMER_MINUTES = '25';

function readStoredFocusTimer() {
  try {
    const parsed = JSON.parse(globalThis.localStorage?.getItem(ACTIVE_FOCUS_TIMER_STORAGE_KEY) || 'null');

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    return parsed;
  } catch (error) {
    return null;
  }
}

function writeStoredFocusTimer(timer) {
  try {
    if (!timer || timer.status === 'idle') {
      globalThis.localStorage?.removeItem(ACTIVE_FOCUS_TIMER_STORAGE_KEY);
      return;
    }

    globalThis.localStorage?.setItem(ACTIVE_FOCUS_TIMER_STORAGE_KEY, JSON.stringify(timer));
  } catch (error) {
    // Storage can be unavailable in restricted browsers. The timer still works in memory.
  }
}

function formatClock(ms) {
  const totalSeconds = Math.max(0, Math.floor(Number(ms || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

function normalizeTimerMinutes(value) {
  const digitsOnly = String(value || '').replace(/[^\d]/g, '').slice(0, 3);
  const minutes = Number(digitsOnly || 0);

  if (minutes > 180) {
    return '180';
  }

  return digitsOnly;
}

function formatTemplate(template, values) {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    template
  );
}

export default function FocusTimerScreen({ onNavigate, token }) {
  const storedFocusTimer = readStoredFocusTimer();
  const { translateText } = useLanguage();
  const [pendingFocusQueue, setPendingFocusQueue] = useState([]);
  const [syncingFocusQueue, setSyncingFocusQueue] = useState(false);
  const [focusQueueMessage, setFocusQueueMessage] = useState('');
  const [focusTimerMode, setFocusTimerMode] = useState(storedFocusTimer?.mode === 'timer' ? 'timer' : 'stopwatch');
  const [focusTimerStatus, setFocusTimerStatus] = useState(
    storedFocusTimer?.status === 'running' || storedFocusTimer?.status === 'paused' ? storedFocusTimer.status : 'idle'
  );
  const [focusStartedAt, setFocusStartedAt] = useState(storedFocusTimer?.startedAt || null);
  const [focusLastStartedAt, setFocusLastStartedAt] = useState(Number(storedFocusTimer?.lastStartedAt || 0));
  const [focusAccumulatedMs, setFocusAccumulatedMs] = useState(Number(storedFocusTimer?.accumulatedMs || 0));
  const [timerTargetMinutes, setTimerTargetMinutes] = useState(
    normalizeTimerMinutes(storedFocusTimer?.targetMinutes || DEFAULT_TIMER_MINUTES)
  );
  const [focusTimerTick, setFocusTimerTick] = useState(Date.now());
  const [savingFocusSession, setSavingFocusSession] = useState(false);
  const [focusTimerMessage, setFocusTimerMessage] = useState('');

  function refreshPendingFocusQueue() {
    setPendingFocusQueue(getPendingFocusSessionQueue());
  }

  function getCurrentFocusElapsedMs() {
    if (focusTimerStatus !== 'running') {
      return focusAccumulatedMs;
    }

    return focusAccumulatedMs + Math.max(0, Date.now() - focusLastStartedAt);
  }

  function resetFocusTimerState() {
    setFocusTimerStatus('idle');
    setFocusStartedAt(null);
    setFocusLastStartedAt(0);
    setFocusAccumulatedMs(0);
    setFocusTimerTick(Date.now());
    writeStoredFocusTimer(null);
  }

  function handleFocusModeChange(mode) {
    if (focusTimerStatus !== 'idle') {
      setFocusTimerMessage(translateText('진행 중인 집중 세션을 종료한 뒤 모드를 바꿀 수 있습니다.'));
      return;
    }

    setFocusTimerMode(mode);
    setFocusTimerMessage('');
  }

  function handleStartFocusTimer() {
    const now = Date.now();
    setFocusTimerStatus('running');
    setFocusStartedAt(new Date(now).toISOString());
    setFocusLastStartedAt(now);
    setFocusAccumulatedMs(0);
    setFocusTimerTick(now);
    setFocusTimerMessage('');
  }

  function handlePauseFocusTimer() {
    if (focusTimerStatus !== 'running') {
      return;
    }

    const now = Date.now();
    setFocusAccumulatedMs(getCurrentFocusElapsedMs());
    setFocusTimerStatus('paused');
    setFocusLastStartedAt(now);
    setFocusTimerTick(now);
  }

  function handleResumeFocusTimer() {
    if (focusTimerStatus !== 'paused') {
      return;
    }

    const now = Date.now();
    setFocusTimerStatus('running');
    setFocusLastStartedAt(now);
    setFocusTimerTick(now);
  }

  async function handleFinishFocusSession({ completedByTimer = false } = {}) {
    if (!token || focusTimerStatus === 'idle' || savingFocusSession) {
      return;
    }

    const now = Date.now();
    const durationMs = Math.max(1000, Math.round(getCurrentFocusElapsedMs()));
    const startedAt = focusStartedAt || new Date(now - durationMs).toISOString();
    const endedAt = new Date(now).toISOString();
    const memo = focusTimerMode === 'timer'
      ? `타이머 집중 기록${completedByTimer ? ' · 목표 시간 도달' : ''}`
      : '스톱워치 집중 기록';

    setSavingFocusSession(true);
    setFocusTimerMessage('');

    try {
      await recordFocusSession(token, {
        startedAt,
        endedAt,
        durationMs,
        memo
      });
      resetFocusTimerState();
      setFocusTimerMessage(formatTemplate(
        translateText('{duration} 집중 기록을 저장했습니다.'),
        { duration: formatClock(durationMs) }
      ));
      refreshPendingFocusQueue();
    } catch (saveError) {
      if (saveError?.queued) {
        resetFocusTimerState();
        refreshPendingFocusQueue();
      } else {
        setFocusTimerStatus('paused');
        setFocusAccumulatedMs(durationMs);
      }

      setFocusTimerMessage(saveError.message || translateText('집중 기록 저장에 실패했습니다.'));
    } finally {
      setSavingFocusSession(false);
    }
  }

  async function handleRetryFocusQueue() {
    if (!token || syncingFocusQueue) {
      return;
    }

    setSyncingFocusQueue(true);
    setFocusQueueMessage('');

    try {
      const result = await retryPendingFocusSessions(token);
      refreshPendingFocusQueue();

      if (result.failed > 0) {
        setFocusQueueMessage(formatTemplate(
          translateText('{submitted}개를 저장했고 {failed}개는 아직 대기 중입니다.'),
          { submitted: result.submitted.length, failed: result.failed }
        ));
      } else if (result.submitted.length > 0) {
        setFocusQueueMessage(formatTemplate(
          translateText('{count}개의 집중 기록을 서버에 다시 저장했습니다.'),
          { count: result.submitted.length }
        ));
      } else if (getPendingFocusSessionQueue().length > 0) {
        setFocusQueueMessage(translateText('아직 전송되지 않은 집중 기록이 있습니다. 네트워크 상태를 확인해 주세요.'));
      } else {
        setFocusQueueMessage(translateText('전송 대기 중인 집중 기록이 없습니다.'));
      }
    } catch (error) {
      setFocusQueueMessage(error.message || translateText('집중 기록 재전송에 실패했습니다.'));
      refreshPendingFocusQueue();
    } finally {
      setSyncingFocusQueue(false);
    }
  }

  useEffect(() => {
    refreshPendingFocusQueue();
  }, []);

  useEffect(() => {
    if (focusTimerStatus !== 'running') {
      return undefined;
    }

    const timer = setInterval(() => setFocusTimerTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [focusTimerStatus]);

  useEffect(() => {
    writeStoredFocusTimer({
      mode: focusTimerMode,
      status: focusTimerStatus,
      startedAt: focusStartedAt,
      lastStartedAt: focusLastStartedAt,
      accumulatedMs: focusAccumulatedMs,
      targetMinutes: timerTargetMinutes
    });
  }, [focusAccumulatedMs, focusLastStartedAt, focusStartedAt, focusTimerMode, focusTimerStatus, timerTargetMinutes]);

  const focusElapsedMs = getCurrentFocusElapsedMs();
  const timerTargetMs = Math.max(1, Number(timerTargetMinutes || DEFAULT_TIMER_MINUTES)) * 60 * 1000;
  const timerRemainingMs = Math.max(0, timerTargetMs - focusElapsedMs);
  const displayFocusMs = focusTimerMode === 'timer' ? timerRemainingMs : focusElapsedMs;
  const timerProgressPercent = focusTimerMode === 'timer'
    ? Math.min(100, Math.round((focusElapsedMs / timerTargetMs) * 100))
    : 0;

  useEffect(() => {
    if (
      focusTimerMode === 'timer'
      && focusTimerStatus === 'running'
      && focusElapsedMs >= timerTargetMs
      && !savingFocusSession
    ) {
      handleFinishFocusSession({ completedByTimer: true });
    }
  }, [focusElapsedMs, focusTimerMode, focusTimerStatus, focusTimerTick, savingFocusSession, timerTargetMs]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.hero, shadows.card]}>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>FOCUS TIMER</Text>
          <Text style={styles.title}>{translateText('집중 시간 기록')}</Text>
          <Text style={styles.subtitle}>
            {translateText('실시간 집중 세션을 시작하고 종료한 기록은 기존 FocusSession API로 저장되어 대시보드, 통계, 프로필에 반영됩니다.')}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => onNavigate('statistics')}
          style={(state) => [styles.secondaryLink, ...interactiveStateStyles(state)]}
        >
          <Text style={styles.secondaryLinkText}>{translateText('통계 보기')}</Text>
        </Pressable>
      </View>

      {pendingFocusQueue.length > 0 || focusQueueMessage ? (
        <View style={[styles.offlineQueueCard, shadows.card]}>
          <View style={styles.offlineQueueCopy}>
            <Text style={styles.offlineQueueTitle}>{translateText('전송 대기 중인 집중 기록')}</Text>
            <Text style={styles.offlineQueueText}>
              {pendingFocusQueue.length > 0
                ? formatTemplate(
                  translateText('{count}개의 집중 기록이 브라우저에 임시 저장되어 있습니다. 네트워크가 안정되면 다시 전송할 수 있습니다.'),
                  { count: pendingFocusQueue.length }
                )
                : focusQueueMessage}
            </Text>
            {pendingFocusQueue.length > 0 && focusQueueMessage ? (
              <Text style={styles.offlineQueueHint}>{focusQueueMessage}</Text>
            ) : null}
          </View>
          {pendingFocusQueue.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              disabled={syncingFocusQueue}
              onPress={handleRetryFocusQueue}
              style={(state) => [
                styles.offlineQueueButton,
                syncingFocusQueue && styles.disabledButton,
                ...interactiveStateStyles(state, { disabled: syncingFocusQueue })
              ]}
            >
              <Text style={styles.offlineQueueButtonText}>
                {translateText(syncingFocusQueue ? '전송 중...' : '다시 전송')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={[styles.focusTimerCard, shadows.card]}>
        <View style={styles.focusTimerHeader}>
          <View style={styles.focusTimerTitleGroup}>
            <Text style={styles.focusTimerEyebrow}>LIVE FOCUS</Text>
            <Text style={styles.focusTimerTitle}>{translateText('스톱워치·타이머 집중 기록')}</Text>
            <Text style={styles.focusTimerText}>
              {translateText('통계는 결과 확인, 이 화면은 지금 집중하는 시간을 기록하는 전용 화면입니다.')}
            </Text>
          </View>
          <Text style={[styles.focusTimerStatus, focusTimerStatus === 'running' && styles.focusTimerStatusRunning]}>
            {translateText(focusTimerStatus === 'running' ? '진행 중' : focusTimerStatus === 'paused' ? '일시정지' : '대기')}
          </Text>
        </View>

        <View style={styles.focusModeRow}>
          {[
            { key: 'stopwatch', label: translateText('스톱워치') },
            { key: 'timer', label: translateText('타이머') }
          ].map((item) => {
            const active = focusTimerMode === item.key;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                disabled={focusTimerStatus !== 'idle'}
                key={item.key}
                onPress={() => handleFocusModeChange(item.key)}
                style={(state) => [
                  styles.focusModeButton,
                  active && styles.focusModeButtonActive,
                  focusTimerStatus !== 'idle' && styles.disabledButton,
                  ...interactiveStateStyles(state, { disabled: focusTimerStatus !== 'idle' })
                ]}
              >
                <Text style={[styles.focusModeButtonText, active && styles.focusModeButtonTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {focusTimerMode === 'timer' ? (
          <View style={styles.timerInputRow}>
            <Text style={styles.timerInputLabel}>{translateText('목표 시간')}</Text>
            <TextInput
              accessibilityLabel={translateText('타이머 목표 시간 분 단위')}
              editable={focusTimerStatus === 'idle'}
              keyboardType="number-pad"
              onChangeText={(value) => setTimerTargetMinutes(normalizeTimerMinutes(value))}
              placeholder="25"
              placeholderTextColor={colors.muted}
              style={styles.timerInput}
              value={timerTargetMinutes}
            />
            <Text style={styles.timerInputSuffix}>{translateText('분')}</Text>
          </View>
        ) : null}

        <View style={styles.focusClockPanel}>
          <Text style={styles.focusClock}>{formatClock(displayFocusMs)}</Text>
          <Text style={styles.focusClockHint}>
            {focusTimerMode === 'timer'
              ? formatTemplate(
                translateText('목표 {minutes}분 · {percent}% 진행'),
                { minutes: timerTargetMinutes || DEFAULT_TIMER_MINUTES, percent: timerProgressPercent }
              )
              : translateText('종료 및 저장을 누르면 현재 시간이 집중 기록으로 저장됩니다.')}
          </Text>
          {focusTimerMode === 'timer' ? (
            <View style={styles.timerProgressTrack}>
              <View style={[styles.timerProgressBar, { width: `${timerProgressPercent}%` }]} />
            </View>
          ) : null}
        </View>

        <View style={styles.focusTimerActions}>
          {focusTimerStatus === 'idle' ? (
            <Pressable
              accessibilityRole="button"
              disabled={savingFocusSession || (focusTimerMode === 'timer' && !timerTargetMinutes)}
              onPress={handleStartFocusTimer}
              style={(state) => [
                styles.focusPrimaryButton,
                (savingFocusSession || (focusTimerMode === 'timer' && !timerTargetMinutes)) && styles.disabledButton,
                ...interactiveStateStyles(state, { disabled: savingFocusSession || (focusTimerMode === 'timer' && !timerTargetMinutes) })
              ]}
            >
              <Text style={styles.focusPrimaryButtonText}>{translateText('시작')}</Text>
            </Pressable>
          ) : focusTimerStatus === 'running' ? (
            <Pressable
              accessibilityRole="button"
              onPress={handlePauseFocusTimer}
              style={(state) => [styles.focusSecondaryButton, ...interactiveStateStyles(state)]}
            >
              <Text style={styles.focusSecondaryButtonText}>{translateText('일시정지')}</Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={handleResumeFocusTimer}
              style={(state) => [styles.focusPrimaryButton, ...interactiveStateStyles(state)]}
            >
              <Text style={styles.focusPrimaryButtonText}>{translateText('재개')}</Text>
            </Pressable>
          )}

          <Pressable
            accessibilityRole="button"
            disabled={focusTimerStatus === 'idle' || savingFocusSession}
            onPress={() => handleFinishFocusSession()}
            style={(state) => [
              styles.focusFinishButton,
              (focusTimerStatus === 'idle' || savingFocusSession) && styles.disabledButton,
              ...interactiveStateStyles(state, { disabled: focusTimerStatus === 'idle' || savingFocusSession })
            ]}
          >
            <Text style={styles.focusFinishButtonText}>
              {translateText(savingFocusSession ? '저장 중' : '종료 및 저장')}
            </Text>
          </Pressable>
        </View>

        {focusTimerMessage ? (
          <Text style={styles.focusTimerMessage}>{focusTimerMessage}</Text>
        ) : null}
        <Text style={styles.focusTimerPolicy}>
          {translateText('진행 중 화면을 새로고침해도 브라우저에 임시 저장된 상태를 복원합니다. 서버 저장은 종료 및 저장 시점에만 수행합니다.')}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: 28,
    gap: 24
  },
  hero: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    flexWrap: 'wrap'
  },
  heroCopy: {
    flex: 1,
    minWidth: 260,
    gap: 10
  },
  eyebrow: {
    color: colors.mintDeep,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: '900'
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 24
  },
  secondaryLink: {
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  secondaryLinkText: {
    color: colors.blueDeep,
    fontSize: 14,
    fontWeight: '900'
  },
  offlineQueueCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: colors.warningSoft,
    padding: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14
  },
  offlineQueueCopy: {
    flex: 1,
    minWidth: 240,
    gap: 6
  },
  offlineQueueTitle: {
    color: colors.warning,
    fontSize: 15,
    fontWeight: '900'
  },
  offlineQueueText: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 20
  },
  offlineQueueHint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18
  },
  offlineQueueButton: {
    borderRadius: 999,
    backgroundColor: colors.warning,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center'
  },
  offlineQueueButtonText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '900'
  },
  focusTimerCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 24,
    gap: 20
  },
  focusTimerHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14
  },
  focusTimerTitleGroup: {
    flex: 1,
    minWidth: 240,
    gap: 8
  },
  focusTimerEyebrow: {
    color: colors.mintDeep,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1
  },
  focusTimerTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900'
  },
  focusTimerText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22
  },
  focusTimerStatus: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: colors.surfaceWarm,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  focusTimerStatusRunning: {
    backgroundColor: colors.mintSoft,
    color: colors.mintDeep
  },
  focusModeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  focusModeButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  focusModeButtonActive: {
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft
  },
  focusModeButtonText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900'
  },
  focusModeButtonTextActive: {
    color: colors.blueDeep
  },
  timerInputRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10
  },
  timerInputLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800'
  },
  timerInput: {
    width: 86,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    paddingHorizontal: 14,
    paddingVertical: 10,
    textAlign: 'center'
  },
  timerInputSuffix: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800'
  },
  focusClockPanel: {
    borderRadius: 22,
    backgroundColor: colors.blue,
    padding: 22,
    gap: 10
  },
  focusClock: {
    color: colors.surface,
    fontSize: 44,
    fontWeight: '900',
    textAlign: 'center'
  },
  focusClockHint: {
    color: colors.blueSoft,
    fontSize: 13,
    textAlign: 'center'
  },
  timerProgressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.28)',
    overflow: 'hidden'
  },
  timerProgressBar: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.mint
  },
  focusTimerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  focusPrimaryButton: {
    borderRadius: 999,
    backgroundColor: colors.blue,
    paddingHorizontal: 18,
    paddingVertical: 12
  },
  focusPrimaryButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '900'
  },
  focusSecondaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
    paddingVertical: 12
  },
  focusSecondaryButtonText: {
    color: colors.blueDeep,
    fontSize: 14,
    fontWeight: '900'
  },
  focusFinishButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: 18,
    paddingVertical: 12
  },
  focusFinishButtonText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '900'
  },
  focusTimerMessage: {
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '800'
  },
  focusTimerPolicy: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18
  },
  disabledButton: {
    opacity: 0.55
  }
});
