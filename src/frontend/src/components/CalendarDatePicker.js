import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { languageIntlLocale, useLanguage } from '../i18n';
import { colors } from '../styles/theme';

const WEEKDAY_LABELS = {
  ko: ['일', '월', '화', '수', '목', '금', '토'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ja: ['日', '月', '火', '水', '木', '金', '土'],
  zh: ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
};

function parseDateString(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map((token) => Number(token));

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

function buildCalendarDays(visibleMonth, selectedValue) {
  const year = visibleMonth.getUTCFullYear();
  const month = visibleMonth.getUTCMonth();
  const firstDay = new Date(Date.UTC(year, month, 1));
  const startOffset = firstDay.getUTCDay();
  const startDate = new Date(Date.UTC(year, month, 1 - startOffset));
  const today = formatDateString(new Date());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setUTCDate(startDate.getUTCDate() + index);

    const dateString = formatDateString(date);
    const dayOfWeek = date.getUTCDay();

    return {
      key: dateString,
      date,
      dateString,
      dayNumber: date.getUTCDate(),
      isSaturday: dayOfWeek === 6,
      isSunday: dayOfWeek === 0,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isCurrentMonth: date.getUTCMonth() === month,
      isSelected: dateString === selectedValue,
      isToday: dateString === today
    };
  });
}

export default function CalendarDatePicker({ label, value, onChange, accent = 'mint' }) {
  const { currentLanguage, translateText } = useLanguage();
  const parsedValue = parseDateString(value);
  const [visibleMonth, setVisibleMonth] = useState(
    parsedValue || new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1))
  );

  useEffect(() => {
    if (parsedValue) {
      setVisibleMonth(new Date(Date.UTC(parsedValue.getUTCFullYear(), parsedValue.getUTCMonth(), 1)));
    }
  }, [value]);

  const days = useMemo(() => buildCalendarDays(visibleMonth, value), [visibleMonth, value]);
  const monthLabel = new Intl.DateTimeFormat(languageIntlLocale(currentLanguage), {
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric'
  }).format(visibleMonth);
  const weekdayLabels = WEEKDAY_LABELS[currentLanguage] || WEEKDAY_LABELS.ko;
  const accentStyle = accent === 'blue' ? styles.selectedDayBlue : styles.selectedDayMint;
  const accentTextStyle = accent === 'blue' ? styles.selectedDayTextBlue : styles.selectedDayTextMint;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{translateText(label)}</Text>
        <View style={styles.quickRow}>
          <Pressable onPress={() => onChange(formatDateString(new Date()))} style={styles.quickButton}>
            <Text style={styles.quickButtonText}>{translateText('오늘')}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              const tomorrow = new Date();
              tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
              onChange(formatDateString(tomorrow));
            }}
            style={styles.quickButton}
          >
            <Text style={styles.quickButtonText}>{translateText('내일')}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.calendarCard}>
        <View style={styles.monthRow}>
          <Pressable onPress={() => setVisibleMonth((current) => addMonths(current, -1))} style={styles.navButton}>
            <Text style={styles.navButtonText}>{translateText('이전')}</Text>
          </Pressable>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <Pressable onPress={() => setVisibleMonth((current) => addMonths(current, 1))} style={styles.navButton}>
            <Text style={styles.navButtonText}>{translateText('다음')}</Text>
          </Pressable>
        </View>

        <View style={styles.weekdayRow}>
          {weekdayLabels.map((weekday, index) => (
            <View key={weekday} style={styles.weekdayCell}>
              <Text style={[
                styles.weekdayText,
                index === 0 && styles.sundayText,
                index === 6 && styles.saturdayText
              ]}
              >
                {weekday}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.grid}>
          {days.map((day) => (
            <Pressable
              key={day.key}
              onPress={() => onChange(day.dateString)}
              style={[
                styles.dayCell,
                day.isWeekend && styles.weekendDayCell,
                !day.isCurrentMonth && styles.dayCellMuted,
                day.isToday && styles.todayCell,
                day.isSelected && accentStyle
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  day.isSunday && styles.sundayText,
                  day.isSaturday && styles.saturdayText,
                  !day.isCurrentMonth && styles.dayTextMuted,
                  day.isToday && styles.todayText,
                  day.isSelected && accentTextStyle
                ]}
              >
                {day.dayNumber}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.selectedFooter}>
          <Text style={styles.selectedFooterLabel}>{translateText('선택한 날짜')}</Text>
          <Text style={styles.selectedFooterValue}>{value || translateText('날짜를 선택하세요')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    flex: 1,
    minWidth: 280,
    alignSelf: 'stretch'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap'
  },
  label: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700'
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8
  },
  quickButton: {
    minHeight: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    justifyContent: 'center'
  },
  quickButtonText: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '800'
  },
  calendarCard: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 12
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10
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
  monthLabel: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800'
  },
  weekdayRow: {
    flexDirection: 'row'
  },
  weekdayCell: {
    width: '14.2857%',
    alignItems: 'center'
  },
  weekdayText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700'
  },
  sundayText: {
    color: colors.danger
  },
  saturdayText: {
    color: colors.blue
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  dayCell: {
    width: '14.2857%',
    height: 40,
    padding: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceWarm
  },
  weekendDayCell: {
    backgroundColor: colors.cream
  },
  dayCellMuted: {
    opacity: 0.5
  },
  todayCell: {
    borderWidth: 1,
    borderColor: colors.creamStrong
  },
  selectedDayMint: {
    backgroundColor: colors.mintSoft,
    borderWidth: 1,
    borderColor: colors.mintDeep
  },
  selectedDayBlue: {
    backgroundColor: colors.blueSoft,
    borderWidth: 1,
    borderColor: colors.blue
  },
  dayText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700'
  },
  dayTextMuted: {
    color: colors.muted
  },
  todayText: {
    color: colors.warning
  },
  selectedDayTextMint: {
    color: colors.mintDeep
  },
  selectedDayTextBlue: {
    color: colors.blueDeep
  },
  selectedFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 12,
    gap: 4
  },
  selectedFooterLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700'
  },
  selectedFooterValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800'
  }
});
