import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../styles/theme';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function parseDateString(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateString(date) {
  return date.toISOString().slice(0, 10);
}

function addMonths(date, diff) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + diff, 1));
}

function isWithinRange(dateString, startDate, endDate) {
  if (!startDate || !endDate) {
    return false;
  }

  return dateString > startDate && dateString < endDate;
}

function buildCalendarDays(visibleMonth, startDate, endDate) {
  const year = visibleMonth.getUTCFullYear();
  const month = visibleMonth.getUTCMonth();
  const firstDay = new Date(Date.UTC(year, month, 1));
  const startOffset = firstDay.getUTCDay();
  const startDateCursor = new Date(Date.UTC(year, month, 1 - startOffset));
  const today = formatDateString(new Date());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDateCursor);
    date.setUTCDate(startDateCursor.getUTCDate() + index);
    const dateString = formatDateString(date);

    return {
      key: dateString,
      dateString,
      dayNumber: date.getUTCDate(),
      isCurrentMonth: date.getUTCMonth() === month,
      isToday: dateString === today,
      isStart: dateString === startDate,
      isEnd: dateString === endDate,
      isInRange: isWithinRange(dateString, startDate, endDate)
    };
  });
}

export default function DateRangeCalendarPicker({
  endDate,
  onChange,
  selectedTarget,
  setSelectedTarget,
  startDate
}) {
  const referenceDate = parseDateString(startDate) || parseDateString(endDate);
  const [visibleMonth, setVisibleMonth] = useState(
    referenceDate || new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1))
  );

  useEffect(() => {
    const nextReferenceDate = parseDateString(startDate) || parseDateString(endDate);

    if (nextReferenceDate) {
      setVisibleMonth(new Date(Date.UTC(nextReferenceDate.getUTCFullYear(), nextReferenceDate.getUTCMonth(), 1)));
    }
  }, [startDate, endDate]);

  const days = useMemo(
    () => buildCalendarDays(visibleMonth, startDate, endDate),
    [visibleMonth, startDate, endDate]
  );
  const monthLabel = `${visibleMonth.getUTCFullYear()}년 ${visibleMonth.getUTCMonth() + 1}월`;

  function handleSelect(dateString) {
    if (selectedTarget === 'start') {
      const nextEnd = endDate && endDate < dateString ? dateString : endDate;
      onChange({
        startDate: dateString,
        endDate: nextEnd || dateString
      });
      setSelectedTarget('end');
      return;
    }

    const normalizedEnd = dateString < startDate ? startDate : dateString;

    onChange({
      startDate: startDate || dateString,
      endDate: normalizedEnd
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <View style={styles.actionRow}>
          <Pressable onPress={() => setVisibleMonth((current) => addMonths(current, -1))} style={styles.navButton}>
            <Text style={styles.navButtonText}>이전</Text>
          </Pressable>
          <Pressable onPress={() => setVisibleMonth((current) => addMonths(current, 1))} style={styles.navButton}>
            <Text style={styles.navButtonText}>다음</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.targetRow}>
        <Pressable
          onPress={() => setSelectedTarget('start')}
          style={[styles.targetCard, selectedTarget === 'start' && styles.targetCardActive]}
        >
          <Text style={styles.targetLabel}>시작 날짜</Text>
          <Text style={styles.targetValue}>{startDate}</Text>
        </Pressable>
        <Text style={styles.arrow}>-></Text>
        <Pressable
          onPress={() => setSelectedTarget('end')}
          style={[styles.targetCard, selectedTarget === 'end' && styles.targetCardActive]}
        >
          <Text style={styles.targetLabel}>종료 날짜</Text>
          <Text style={styles.targetValue}>{endDate}</Text>
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((weekday) => (
          <View key={weekday} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{weekday}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {days.map((day) => (
          <Pressable
            key={day.key}
            onPress={() => handleSelect(day.dateString)}
            style={[
              styles.dayCell,
              !day.isCurrentMonth && styles.dayCellMuted,
              day.isInRange && styles.dayInRange,
              (day.isStart || day.isEnd) && styles.dayEdge,
              day.isToday && styles.todayCell
            ]}
          >
            <Text
              style={[
                styles.dayText,
                !day.isCurrentMonth && styles.dayTextMuted,
                day.isToday && styles.todayText,
                (day.isStart || day.isEnd) && styles.dayEdgeText
              ]}
            >
              {day.dayNumber}
            </Text>
            {day.isStart ? <Text style={styles.markerText}>시작</Text> : null}
            {day.isEnd ? <Text style={styles.markerText}>종료</Text> : null}
          </Pressable>
        ))}
      </View>

      <Text style={styles.caption}>시작 날짜를 먼저 고르고, 종료 날짜를 이어서 선택하는 방식입니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 18
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap'
  },
  monthLabel: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '800'
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8
  },
  navButton: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 12,
    justifyContent: 'center'
  },
  navButtonText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700'
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap'
  },
  targetCard: {
    flex: 1,
    minWidth: 180,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4
  },
  targetCardActive: {
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft
  },
  targetLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700'
  },
  targetValue: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800'
  },
  arrow: {
    color: colors.muted,
    fontSize: 26
  },
  weekdayRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingBottom: 8
  },
  weekdayCell: {
    width: '14.2857%',
    alignItems: 'center'
  },
  weekdayText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  dayCell: {
    width: '14.2857%',
    minHeight: 92,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1ECE3'
  },
  dayCellMuted: {
    opacity: 0.35
  },
  dayInRange: {
    backgroundColor: '#F3F4F7'
  },
  dayEdge: {
    backgroundColor: '#E2EBF8'
  },
  todayCell: {
    borderLeftWidth: 3,
    borderLeftColor: colors.mintDeep
  },
  dayText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800'
  },
  dayTextMuted: {
    color: colors.muted
  },
  todayText: {
    color: colors.blue
  },
  dayEdgeText: {
    color: colors.blueDeep
  },
  markerText: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderRadius: 10,
    backgroundColor: 'rgba(55,100,154,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: colors.blueDeep,
    fontSize: 11,
    fontWeight: '700'
  },
  caption: {
    color: colors.muted,
    fontSize: 12
  }
});
