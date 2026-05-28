import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PanelSkeleton } from '../components/Skeleton';
import {
  getAccessibilityPreferences,
  getPendingFocusSessionQueue,
  getReviewReminders,
  getStatisticsHeatmap,
  getStatisticsSummary,
  retryPendingFocusSessions
} from '../services/api';
import { colors, interactions, interactiveStateStyles, shadows } from '../styles/theme';

const EMPTY_SUMMARY = {
  totalMinutes: 0,
  completionRate: 0,
  sessionCount: 0,
  taskCount: 0
};

function formatNumber(value) {
  return new Intl.NumberFormat('ko-KR').format(Number(value || 0));
}

function formatMinutes(value) {
  const minutes = Number(value || 0);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours <= 0) {
    return `${rest}분`;
  }

  if (rest === 0) {
    return `${hours}시간`;
  }

  return `${hours}시간 ${rest}분`;
}

function toDateKey(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return localDate.toISOString().slice(0, 10);
}

function getRange(days) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - (days - 1));

  return {
    startDate: toDateKey(startDate),
    endDate: toDateKey(endDate)
  };
}

function buildDateSeries(days) {
  return Array.from({ length: days }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - index));
    return {
      key: toDateKey(date),
      label: new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(date),
      day: new Intl.DateTimeFormat('ko-KR', { day: 'numeric' }).format(date)
    };
  });
}

function getHeatmapMinutes(heatmap, dateKey) {
  return Math.floor(Number(heatmap?.[dateKey]?.durationMs || 0) / (1000 * 60));
}

function formatDateLabel(dateKey) {
  const date = new Date(`${dateKey}T00:00:00`);
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  }).format(date);
}

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function buildStreakInfo(heatmap) {
  const days = buildDateSeries(28).map((date) => ({
    ...date,
    minutes: getHeatmapMinutes(heatmap, date.key)
  }));
  let current = 0;
  let best = 0;
  let running = 0;

  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (days[index].minutes <= 0) {
      break;
    }
    current += 1;
  }

  days.forEach((day) => {
    if (day.minutes > 0) {
      running += 1;
      best = Math.max(best, running);
    } else {
      running = 0;
    }
  });

  const today = days[days.length - 1] || { minutes: 0 };
  return {
    current,
    best,
    todayMinutes: today.minutes,
    todayLearned: today.minutes > 0
  };
}

function buildSpacedReviewPlan() {
  return [1, 3, 7, 14].map((days) => ({
    key: `t-plus-${days}`,
    label: `T+${days}`,
    dateKey: addDays(days),
    description: days <= 3 ? '기억이 흐려지기 전 짧게 재확인' : '장기 기억으로 넘기기 위한 반복 복습'
  }));
}

function getHeatColor(minutes, maxMinutes) {
  if (minutes <= 0) {
    return colors.surfaceWarm;
  }

  const ratio = maxMinutes <= 0 ? 0 : minutes / maxMinutes;

  if (ratio >= 0.75) {
    return colors.mintDeep;
  }

  if (ratio >= 0.45) {
    return colors.mint;
  }

  if (ratio >= 0.2) {
    return colors.mintSoft;
  }

  return colors.cream;
}

function buildStory({ todaySummary, weekSummary, weekBars }) {
  const bestDay = weekBars.reduce((best, day) => (day.minutes > best.minutes ? day : best), weekBars[0] || { minutes: 0 });

  if (todaySummary.totalMinutes === 0 && weekSummary.totalMinutes === 0) {
    return '아직 집중 기록이 없습니다. 25분 집중부터 시작하면 주간 통계가 바로 채워집니다.';
  }

  if (bestDay.minutes > 0) {
    return `이번 주 가장 집중한 날은 ${bestDay.label}이며 ${formatMinutes(bestDay.minutes)} 기록했습니다.`;
  }

  if (weekSummary.completionRate > 0) {
    return `이번 주 태스크 완료율은 ${weekSummary.completionRate}%입니다. 작은 완료 기록을 계속 쌓아 보세요.`;
  }

  return '집중 시간과 완료 태스크를 함께 보면 이번 주 학습 흐름을 더 쉽게 파악할 수 있습니다.';
}

function SummaryCard({ helper, label, tone = 'default', value }) {
  return (
    <View style={[styles.summaryCard, tone === 'mint' && styles.summaryMint, tone === 'blue' && styles.summaryBlue]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryHelper}>{helper}</Text>
    </View>
  );
}

function EmptyAction({ onPress }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>통계로 볼 집중 기록이 아직 없습니다.</Text>
      <Text style={styles.emptyText}>일정이나 칸반에서 오늘의 목표를 먼저 만들고, 집중 기록을 남기면 이 화면이 채워집니다.</Text>
      <Pressable accessibilityRole="button" onPress={onPress} style={(state) => [styles.emptyButton, ...interactiveStateStyles(state)]}>
        <Text style={styles.emptyButtonText}>오늘 목표 만들기</Text>
      </Pressable>
    </View>
  );
}

export default function StatisticsScreen({ onNavigate, token }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [todaySummary, setTodaySummary] = useState(EMPTY_SUMMARY);
  const [weekSummary, setWeekSummary] = useState(EMPTY_SUMMARY);
  const [monthSummary, setMonthSummary] = useState(EMPTY_SUMMARY);
  const [heatmap, setHeatmap] = useState({});
  const [reviewPreference, setReviewPreference] = useState({ reviewReminderEnabled: false });
  const [reviewReminders, setReviewReminders] = useState([]);
  const [pendingFocusQueue, setPendingFocusQueue] = useState([]);
  const [syncingFocusQueue, setSyncingFocusQueue] = useState(false);
  const [focusQueueMessage, setFocusQueueMessage] = useState('');

  function refreshPendingFocusQueue() {
    setPendingFocusQueue(getPendingFocusSessionQueue());
  }

  async function loadStatistics({ silent = false } = {}) {
    if (!token) {
      setLoading(false);
      return;
    }

    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const todayRange = getRange(1);
      const weekRange = getRange(7);
      const monthRange = getRange(28);

      const [todayResult, weekResult, monthResult, heatmapResult] = await Promise.all([
        getStatisticsSummary(token, todayRange),
        getStatisticsSummary(token, weekRange),
        getStatisticsSummary(token, monthRange),
        getStatisticsHeatmap(token, monthRange)
      ]);

      setTodaySummary(todayResult?.summary || EMPTY_SUMMARY);
      setWeekSummary(weekResult?.summary || EMPTY_SUMMARY);
      setMonthSummary(monthResult?.summary || EMPTY_SUMMARY);
      setHeatmap(heatmapResult?.heatmap || {});

      const [preferenceResult, remindersResult] = await Promise.allSettled([
        getAccessibilityPreferences(token),
        getReviewReminders(token)
      ]);

      if (preferenceResult.status === 'fulfilled') {
        setReviewPreference(preferenceResult.value?.preference || { reviewReminderEnabled: false });
      }
      if (remindersResult.status === 'fulfilled') {
        setReviewReminders(remindersResult.value?.reminders || []);
      }
    } catch (loadError) {
      setError(loadError.message || '학습 통계를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      refreshPendingFocusQueue();
    }
  }

  useEffect(() => {
    refreshPendingFocusQueue();
    loadStatistics();
  }, [token]);

  async function handleRetryFocusQueue() {
    if (!token) {
      return;
    }

    setSyncingFocusQueue(true);
    setFocusQueueMessage('');

    try {
      const result = await retryPendingFocusSessions(token);
      refreshPendingFocusQueue();

      if (result.submitted.length > 0 && result.failed > 0) {
        setFocusQueueMessage(`${result.submitted.length}개를 저장했고 ${result.failed}개는 아직 대기 중입니다.`);
        await loadStatistics({ silent: true });
      } else if (result.submitted.length > 0) {
        setFocusQueueMessage(`${result.submitted.length}개의 집중 기록을 서버에 다시 저장했습니다.`);
        await loadStatistics({ silent: true });
      } else if (result.failed > 0) {
        setFocusQueueMessage('아직 전송되지 않은 집중 기록이 있습니다. 네트워크 상태를 확인해 주세요.');
      } else {
        setFocusQueueMessage('전송 대기 중인 집중 기록이 없습니다.');
      }
    } catch (error) {
      setFocusQueueMessage(error.message || '집중 기록 재전송에 실패했습니다.');
      refreshPendingFocusQueue();
    } finally {
      setSyncingFocusQueue(false);
    }
  }

  const chartData = useMemo(() => {
    const weekDays = buildDateSeries(7).map((date) => ({
      ...date,
      minutes: getHeatmapMinutes(heatmap, date.key)
    }));
    const monthDays = buildDateSeries(28).map((date) => ({
      ...date,
      minutes: getHeatmapMinutes(heatmap, date.key),
      sessions: heatmap?.[date.key]?.sessionCount || 0
    }));
    const maxWeekMinutes = Math.max(1, ...weekDays.map((day) => day.minutes));
    const maxMonthMinutes = Math.max(1, ...monthDays.map((day) => day.minutes));

    return {
      weekBars: weekDays,
      monthCells: monthDays,
      maxWeekMinutes,
      maxMonthMinutes,
      story: buildStory({ todaySummary, weekSummary, weekBars: weekDays })
    };
  }, [heatmap, todaySummary, weekSummary]);

  const streakInfo = useMemo(() => buildStreakInfo(heatmap), [heatmap]);
  const spacedReviewPlan = useMemo(() => buildSpacedReviewPlan(), []);
  const upcomingReviewReminders = useMemo(
    () => [...reviewReminders]
      .filter((reminder) => !reminder.readAt)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 3),
    [reviewReminders]
  );

  const hasAnyData = monthSummary.totalMinutes > 0 || monthSummary.sessionCount > 0 || monthSummary.taskCount > 0;
  const averageMinutes = monthSummary.sessionCount > 0
    ? Math.round(monthSummary.totalMinutes / monthSummary.sessionCount)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.hero, shadows.card]}>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>LEARNING STATISTICS</Text>
          <Text style={styles.title}>학습 통계 그래프</Text>
          <Text style={styles.subtitle}>{chartData.story}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={loading || refreshing}
          onPress={() => loadStatistics({ silent: true })}
          style={(state) => [
            styles.refreshButton,
            (loading || refreshing) && styles.disabledButton,
            ...interactiveStateStyles(state, { disabled: loading || refreshing })
          ]}
        >
          <Text style={styles.refreshButtonText}>{refreshing ? '갱신 중' : '새로고침'}</Text>
        </Pressable>
      </View>

      {pendingFocusQueue.length > 0 || focusQueueMessage ? (
        <View style={[styles.offlineQueueCard, shadows.card]}>
          <View style={styles.offlineQueueCopy}>
            <Text style={styles.offlineQueueTitle}>저장 대기 중인 집중 기록</Text>
            <Text style={styles.offlineQueueText}>
              {pendingFocusQueue.length > 0
                ? `${pendingFocusQueue.length}개의 집중 기록이 브라우저에 임시 저장되어 있습니다. 네트워크가 안정되면 다시 전송할 수 있습니다.`
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
              <Text style={styles.offlineQueueButtonText}>{syncingFocusQueue ? '전송 중...' : '다시 전송'}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {loading ? (
        <View style={styles.skeletonGrid}>
          <PanelSkeleton rows={4} />
          <PanelSkeleton rows={5} />
          <PanelSkeleton rows={4} />
        </View>
      ) : (
        <>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>통계 데이터를 불러오지 못했습니다.</Text>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable accessibilityRole="button" onPress={() => loadStatistics()} style={(state) => [styles.errorButton, ...interactiveStateStyles(state)]}>
                <Text style={styles.errorButtonText}>다시 시도</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.summaryGrid}>
            <SummaryCard label="오늘 집중" value={formatMinutes(todaySummary.totalMinutes)} helper={`${todaySummary.sessionCount || 0}회 기록`} tone="mint" />
            <SummaryCard label="이번 주 집중" value={formatMinutes(weekSummary.totalMinutes)} helper={`완료율 ${weekSummary.completionRate || 0}%`} tone="blue" />
            <SummaryCard label="최근 4주 집중" value={formatMinutes(monthSummary.totalMinutes)} helper={`${monthSummary.sessionCount || 0}회 세션`} />
            <SummaryCard label="평균 세션" value={formatMinutes(averageMinutes)} helper={`태스크 ${monthSummary.taskCount || 0}개 기준`} />
          </View>

          <View style={styles.streakReviewGrid}>
            <View style={[styles.streakCard, shadows.card]}>
              <View>
                <Text style={styles.streakEyebrow}>STREAK</Text>
                <Text style={styles.streakTitle}>연속 학습 {streakInfo.current}일</Text>
                <Text style={styles.streakText}>
                  {streakInfo.todayLearned
                    ? `오늘 ${formatMinutes(streakInfo.todayMinutes)} 기록으로 streak가 이어지고 있습니다.`
                    : '오늘 기록이 아직 없습니다. 짧은 집중 세션을 남기면 streak가 다시 시작됩니다.'}
                </Text>
              </View>
              <View style={styles.streakMetaRow}>
                <View style={styles.streakMeta}>
                  <Text style={styles.streakMetaValue}>{streakInfo.best}일</Text>
                  <Text style={styles.streakMetaLabel}>최근 4주 최고</Text>
                </View>
                <Pressable accessibilityRole="button" onPress={() => onNavigate('profile')} style={(state) => [styles.streakAction, ...interactiveStateStyles(state)]}>
                  <Text style={styles.streakActionText}>프로필에서 보기</Text>
                </Pressable>
              </View>
            </View>

            <View style={[styles.reviewPlanCard, shadows.card]}>
              <View style={styles.reviewPlanHeader}>
                <View>
                  <Text style={styles.streakEyebrow}>SPACED REVIEW</Text>
                  <Text style={styles.streakTitle}>망각곡선 복습 예정</Text>
                </View>
                <Text style={[styles.reminderStatus, reviewPreference.reviewReminderEnabled && styles.reminderStatusActive]}>
                  {reviewPreference.reviewReminderEnabled ? '알림 켜짐' : '선택형 알림'}
                </Text>
              </View>
              <Text style={styles.streakText}>
                T+1, T+3, T+7, T+14일 기준으로 다시 볼 타이밍을 제안합니다. 실제 push 알림은 접근성/복습 알림 설정에서 사용자가 켜는 방식입니다.
              </Text>
              <View style={styles.reviewCycleList}>
                {spacedReviewPlan.map((item) => (
                  <View key={item.key} style={styles.reviewCycleItem}>
                    <Text style={styles.reviewCycleLabel}>{item.label}</Text>
                    <View style={styles.reviewCycleCopy}>
                      <Text style={styles.reviewCycleDate}>{formatDateLabel(item.dateKey)}</Text>
                      <Text style={styles.reviewCycleText}>{item.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
              {upcomingReviewReminders.length > 0 ? (
                <View style={styles.upcomingReminderBox}>
                  <Text style={styles.upcomingReminderTitle}>등록된 복습 알림</Text>
                  {upcomingReviewReminders.map((reminder) => (
                    <Text key={reminder.id} style={styles.upcomingReminderText}>
                      {formatDateLabel(toDateKey(new Date(reminder.scheduledAt)))} · {reminder.message}
                    </Text>
                  ))}
                </View>
              ) : (
                <View style={styles.upcomingReminderBox}>
                  <Text style={styles.upcomingReminderTitle}>아직 등록된 복습 알림이 없습니다.</Text>
                  <Text style={styles.upcomingReminderText}>필요한 경우 접근성 화면에서 원하는 시간에 알림을 직접 등록할 수 있습니다.</Text>
                </View>
              )}
              <Pressable accessibilityRole="button" onPress={() => onNavigate('accessibility')} style={(state) => [styles.reviewPlanButton, ...interactiveStateStyles(state)]}>
                <Text style={styles.reviewPlanButtonText}>복습 알림 설정하기</Text>
              </Pressable>
            </View>
          </View>

          {!hasAnyData ? <EmptyAction onPress={() => onNavigate('schedule')} /> : null}

          <View style={styles.chartGrid}>
            <View style={[styles.chartPanel, shadows.card]}>
              <View style={styles.panelHeader}>
                <View>
                  <Text style={styles.panelTitle}>주간 집중 막대</Text>
                  <Text style={styles.panelSubtitle}>최근 7일 집중 시간을 요일별로 비교합니다.</Text>
                </View>
                <Pressable accessibilityRole="button" onPress={() => onNavigate('profile')} style={(state) => [styles.panelAction, ...interactiveStateStyles(state)]}>
                  <Text style={styles.panelActionText}>프로필</Text>
                </Pressable>
              </View>

              <View style={styles.barList}>
                {chartData.weekBars.map((day) => (
                  <View key={day.key} style={styles.barRow}>
                    <Text style={styles.barLabel}>{day.label}</Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${Math.max(day.minutes > 0 ? 8 : 0, Math.round((day.minutes / chartData.maxWeekMinutes) * 100))}%` }
                        ]}
                      />
                    </View>
                    <Text style={styles.barValue}>{formatMinutes(day.minutes)}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.chartPanel, shadows.card]}>
              <View style={styles.panelHeader}>
                <View>
                  <Text style={styles.panelTitle}>최근 4주 히트맵</Text>
                  <Text style={styles.panelSubtitle}>진한 칸일수록 해당 날짜의 집중 시간이 많습니다.</Text>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.legendCell, { backgroundColor: colors.surfaceWarm }]} />
                  <View style={[styles.legendCell, { backgroundColor: colors.cream }]} />
                  <View style={[styles.legendCell, { backgroundColor: colors.mintSoft }]} />
                  <View style={[styles.legendCell, { backgroundColor: colors.mint }]} />
                  <View style={[styles.legendCell, { backgroundColor: colors.mintDeep }]} />
                </View>
              </View>

              <View style={styles.heatGrid}>
                {chartData.monthCells.map((day) => (
                  <View
                    key={day.key}
                    accessibilityLabel={`${day.key} ${formatMinutes(day.minutes)} 집중`}
                    style={[
                      styles.heatCell,
                      {
                        backgroundColor: getHeatColor(day.minutes, chartData.maxMonthMinutes)
                      }
                    ]}
                  >
                    <Text style={[styles.heatDay, day.minutes > 0 && styles.heatDayActive]}>{day.day}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={[styles.storyPanel, shadows.card]}>
            <View style={styles.storyCopy}>
              <Text style={styles.panelTitle}>이번 주 해석</Text>
              <Text style={styles.storyText}>
                {weekSummary.totalMinutes > 0
                  ? `이번 주에는 총 ${formatMinutes(weekSummary.totalMinutes)} 집중했고, 기록된 태스크 완료율은 ${weekSummary.completionRate || 0}%입니다.`
                  : '이번 주 기록이 아직 적습니다. 25분 집중 세션을 하나 남기면 통계 흐름을 바로 확인할 수 있습니다.'}
              </Text>
            </View>
            <View style={styles.storyActions}>
              <Pressable accessibilityRole="button" onPress={() => onNavigate('schedule')} style={(state) => [styles.storyButton, ...interactiveStateStyles(state)]}>
                <Text style={styles.storyButtonText}>일정으로 이동</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => onNavigate('taskBoard')} style={(state) => [styles.storyButtonSecondary, ...interactiveStateStyles(state)]}>
                <Text style={styles.storyButtonSecondaryText}>칸반 보기</Text>
              </Pressable>
            </View>
          </View>
        </>
      )}
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
    gap: 22
  },
  hero: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 28,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 18
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
  refreshButton: {
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.blue,
    paddingHorizontal: 18,
    justifyContent: 'center',
    ...interactions.transition
  },
  refreshButtonText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '900'
  },
  disabledButton: {
    opacity: 0.6
  },
  offlineQueueCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: colors.warningSoft,
    padding: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14
  },
  offlineQueueCopy: {
    flex: 1,
    minWidth: 240,
    gap: 5
  },
  offlineQueueTitle: {
    color: colors.warning,
    fontSize: 15,
    fontWeight: '900'
  },
  offlineQueueText: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700'
  },
  offlineQueueHint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700'
  },
  offlineQueueButton: {
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    justifyContent: 'center',
    ...interactions.transition
  },
  offlineQueueButtonText: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: '900'
  },
  skeletonGrid: {
    gap: 16
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14
  },
  summaryCard: {
    flex: 1,
    minWidth: 180,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 18,
    gap: 8
  },
  summaryMint: {
    borderColor: colors.mint,
    backgroundColor: colors.mintSoft
  },
  summaryBlue: {
    borderColor: colors.blueSoft,
    backgroundColor: colors.blueSoft
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800'
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900'
  },
  summaryHelper: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '700'
  },
  streakReviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  streakCard: {
    flex: 1,
    minWidth: 280,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.mint,
    backgroundColor: colors.surface,
    padding: 22,
    gap: 18
  },
  reviewPlanCard: {
    flex: 2,
    minWidth: 320,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 22,
    gap: 14
  },
  streakEyebrow: {
    color: colors.mintDeep,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1
  },
  streakTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6
  },
  streakText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6
  },
  streakMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  },
  streakMeta: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  streakMetaValue: {
    color: colors.blueDeep,
    fontSize: 18,
    fontWeight: '900'
  },
  streakMetaLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800'
  },
  streakAction: {
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.mint,
    backgroundColor: colors.mintSoft,
    paddingHorizontal: 14,
    justifyContent: 'center',
    ...interactions.transition
  },
  streakActionText: {
    color: colors.mintDeep,
    fontSize: 12,
    fontWeight: '900'
  },
  reviewPlanHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  },
  reminderStatus: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: colors.warningSoft,
    color: colors.warning,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: '900'
  },
  reminderStatusActive: {
    borderColor: colors.mint,
    backgroundColor: colors.mintSoft,
    color: colors.mintDeep
  },
  reviewCycleList: {
    gap: 8
  },
  reviewCycleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 12
  },
  reviewCycleLabel: {
    minWidth: 44,
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '900'
  },
  reviewCycleCopy: {
    flex: 1,
    gap: 3
  },
  reviewCycleDate: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900'
  },
  reviewCycleText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18
  },
  upcomingReminderBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.blueSoft,
    padding: 14,
    gap: 6
  },
  upcomingReminderTitle: {
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '900'
  },
  upcomingReminderText: {
    color: colors.ink,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700'
  },
  reviewPlanButton: {
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    ...interactions.transition
  },
  reviewPlanButtonText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '900'
  },
  errorBox: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
    padding: 20,
    gap: 10
  },
  errorTitle: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '900'
  },
  errorText: {
    color: colors.warning,
    fontSize: 13,
    lineHeight: 20
  },
  errorButton: {
    alignSelf: 'flex-start',
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    justifyContent: 'center',
    ...interactions.transition
  },
  errorButtonText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '900'
  },
  emptyCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 20,
    gap: 10
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900'
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20
  },
  emptyButton: {
    alignSelf: 'flex-start',
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.blue,
    paddingHorizontal: 16,
    justifyContent: 'center',
    ...interactions.transition
  },
  emptyButtonText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '900'
  },
  chartGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18
  },
  chartPanel: {
    flex: 1,
    minWidth: 320,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 22,
    gap: 18
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 14
  },
  panelTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900'
  },
  panelSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6
  },
  panelAction: {
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.surface,
    paddingHorizontal: 13,
    justifyContent: 'center',
    ...interactions.transition
  },
  panelActionText: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '900'
  },
  barList: {
    gap: 12
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  barLabel: {
    width: 34,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900'
  },
  barTrack: {
    flex: 1,
    height: 16,
    borderRadius: 999,
    backgroundColor: colors.surfaceWarm,
    overflow: 'hidden'
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.mintDeep
  },
  barValue: {
    width: 72,
    textAlign: 'right',
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '900'
  },
  legendRow: {
    flexDirection: 'row',
    gap: 5
  },
  legendCell: {
    width: 14,
    height: 14,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.line
  },
  heatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  heatCell: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center'
  },
  heatDay: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900'
  },
  heatDayActive: {
    color: colors.blueDeep
  },
  storyPanel: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 22,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16
  },
  storyCopy: {
    flex: 1,
    minWidth: 260
  },
  storyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8
  },
  storyActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10
  },
  storyButton: {
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.blue,
    paddingHorizontal: 16,
    justifyContent: 'center',
    ...interactions.transition
  },
  storyButtonText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '900'
  },
  storyButtonSecondary: {
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    justifyContent: 'center',
    ...interactions.transition
  },
  storyButtonSecondaryText: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '900'
  }
});
