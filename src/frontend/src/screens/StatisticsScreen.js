import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PanelSkeleton } from '../components/Skeleton';
import { getStatisticsHeatmap, getStatisticsSummary } from '../services/api';
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
    } catch (loadError) {
      setError(loadError.message || '학습 통계를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadStatistics();
  }, [token]);

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
