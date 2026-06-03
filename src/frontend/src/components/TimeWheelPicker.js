import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AccessibleTextInput from './AccessibleTextInput';
import { useLanguage } from '../i18n';
import { colors } from '../styles/theme';

const ITEM_HEIGHT = 54;
const VISIBLE_ROWS = 5;
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const LOOP_COPIES = 3;

function splitTime(value) {
  const [hour = '09', minute = '00'] = (value || '09:00').split(':');

  return {
    hour: hour.padStart(2, '0'),
    minute: minute.padStart(2, '0')
  };
}

function clampTimePart(value, max) {
  const numeric = Number(String(value || '').replace(/\D/g, ''));

  if (Number.isNaN(numeric)) {
    return '00';
  }

  const normalized = Math.max(0, Math.min(max, numeric));
  return String(normalized).padStart(2, '0');
}

function WheelColumn({ accent, currentValue, label, onChange, options }) {
  const scrollRef = useRef(null);
  const currentRawIndexRef = useRef(options.length + Math.max(options.indexOf(currentValue), 0));
  const isProgrammaticScrollRef = useRef(false);
  const repeatedOptions = useMemo(() => Array.from({ length: LOOP_COPIES }, () => options).flat(), [options]);
  const selectedIndex = Math.max(options.indexOf(currentValue), 0);
  const verticalPadding = ((VISIBLE_ROWS - 1) / 2) * ITEM_HEIGHT;

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }

    const normalizedIndex = ((currentRawIndexRef.current % options.length) + options.length) % options.length;
    const shouldRecenter =
      currentRawIndexRef.current < options.length * 0.5 ||
      currentRawIndexRef.current > options.length * 2.5;

    if (normalizedIndex !== selectedIndex || shouldRecenter) {
      const nextRawIndex = options.length + selectedIndex;
      currentRawIndexRef.current = nextRawIndex;
      isProgrammaticScrollRef.current = true;
      scrollRef.current.scrollTo({
        y: nextRawIndex * ITEM_HEIGHT,
        animated: true
      });
    }
  }, [options.length, selectedIndex]);

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }

    const initialIndex = options.length + selectedIndex;
    currentRawIndexRef.current = initialIndex;
    isProgrammaticScrollRef.current = true;
    scrollRef.current.scrollTo({
      y: initialIndex * ITEM_HEIGHT,
      animated: false
    });
  }, []);

  function normalizeRawIndex(rawIndex) {
    return ((rawIndex % options.length) + options.length) % options.length;
  }

  function recenterIfNeeded() {
    if (!scrollRef.current) {
      return;
    }

    if (currentRawIndexRef.current >= options.length && currentRawIndexRef.current < options.length * 2) {
      return;
    }

    const centeredRawIndex = options.length + normalizeRawIndex(currentRawIndexRef.current);
    currentRawIndexRef.current = centeredRawIndex;
    isProgrammaticScrollRef.current = true;
    scrollRef.current.scrollTo({
      y: centeredRawIndex * ITEM_HEIGHT,
      animated: false
    });
  }

  function updateSelectionFromOffset(event) {
    const offsetY = event.nativeEvent.contentOffset.y;
    const rawIndex = Math.max(0, Math.round(offsetY / ITEM_HEIGHT));
    currentRawIndexRef.current = rawIndex;
    onChange(options[normalizeRawIndex(rawIndex)]);
  }

  function handleMomentumScrollEnd(event) {
    if (isProgrammaticScrollRef.current) {
      isProgrammaticScrollRef.current = false;
      return;
    }

    handleScrollEnd(event);
  }

  function handleScrollEnd(event) {
    if (isProgrammaticScrollRef.current) {
      isProgrammaticScrollRef.current = false;
      return;
    }

    updateSelectionFromOffset(event);
    recenterIfNeeded();
  }

  return (
    <View style={styles.column}>
      <Text style={styles.columnLabel}>{label}</Text>
      <View style={styles.wheelFrame}>
        <View
          pointerEvents="none"
          style={[
            styles.selectionBand,
            accent === 'mint' ? styles.selectionBandMint : styles.selectionBandBlue
          ]}
        />
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingVertical: verticalPadding }}
          decelerationRate="fast"
          onMomentumScrollEnd={handleMomentumScrollEnd}
          onScrollEndDrag={handleScrollEnd}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          snapToAlignment="start"
          snapToInterval={ITEM_HEIGHT}
          style={styles.scroll}
        >
          {repeatedOptions.map((option, index) => {
            const isSelected = option === currentValue;

            return (
              <Pressable key={`${label}-${index}-${option}`} onPress={() => onChange(option)} style={styles.timeRow}>
                <Text
                  style={[
                    styles.timeText,
                    isSelected && styles.selectedTimeText,
                    isSelected && (accent === 'mint' ? styles.selectedTimeTextMint : styles.selectedTimeTextBlue)
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

export default function TimeWheelPicker({
  label,
  value,
  onChange,
  accent = 'blue',
  quickOptions = [],
  showCaption = true
}) {
  const { translateText } = useLanguage();
  const [isPreciseMode, setIsPreciseMode] = useState(false);
  const [draftHour, setDraftHour] = useState('09');
  const [draftMinute, setDraftMinute] = useState('00');
  const { hour, minute } = useMemo(() => splitTime(value), [value]);

  useEffect(() => {
    if (!isPreciseMode) {
      setDraftHour(hour);
      setDraftMinute(minute);
    }
  }, [hour, minute, isPreciseMode]);

  function handleHourChange(nextHour) {
    if (isPreciseMode) {
      setDraftHour(nextHour);
    }

    onChange(`${nextHour}:${minute}`);
  }

  function handleMinuteChange(nextMinute) {
    if (isPreciseMode) {
      setDraftMinute(nextMinute);
    }

    onChange(`${hour}:${nextMinute}`);
  }

  function handleTogglePreciseMode() {
    setIsPreciseMode((current) => {
      const nextMode = !current;

      if (nextMode) {
        setDraftHour(hour);
        setDraftMinute(minute);
      }

      return nextMode;
    });
  }

  function handleDraftHourChange(nextValue) {
    setDraftHour(nextValue.replace(/\D/g, '').slice(0, 2));
  }

  function handleDraftMinuteChange(nextValue) {
    setDraftMinute(nextValue.replace(/\D/g, '').slice(0, 2));
  }

  function applyPreciseTime(nextHour = draftHour, nextMinute = draftMinute) {
    const safeHour = clampTimePart(nextHour, 23);
    const safeMinute = clampTimePart(nextMinute, 59);

    setDraftHour(safeHour);
    setDraftMinute(safeMinute);
    onChange(`${safeHour}:${safeMinute}`);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{translateText(label)}</Text>
        {quickOptions.length ? (
          <View style={styles.quickRow}>
            {quickOptions.map((time) => (
              <Pressable key={time} onPress={() => onChange(time)} style={styles.quickButton}>
                <Text style={styles.quickButtonText}>{time}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      <Pressable onPress={handleTogglePreciseMode} style={styles.currentValueCard}>
        <Text style={styles.currentValueLabel}>{translateText('현재 선택')}</Text>
        <Text
          style={[
            styles.currentValueText,
            accent === 'mint' ? styles.currentValueTextMint : styles.currentValueTextBlue
          ]}
        >
          {hour}:{minute}
        </Text>
        <Text style={styles.currentValueHint}>
          {isPreciseMode ? translateText('직접 입력 열림') : translateText('눌러서 직접 입력 열기')}
        </Text>
      </Pressable>

      {isPreciseMode ? (
        <View style={styles.preciseEditor}>
          <View style={styles.preciseInputRow}>
            <View style={styles.preciseInputBox}>
              <Text style={styles.preciseInputLabel}>{translateText('시')}</Text>
              <AccessibleTextInput
                keyboardType="number-pad"
                maxLength={2}
                onChangeText={handleDraftHourChange}
                style={styles.preciseInput}
                value={draftHour}
              />
            </View>
            <Text style={styles.preciseSeparator}>:</Text>
            <View style={styles.preciseInputBox}>
              <Text style={styles.preciseInputLabel}>{translateText('분')}</Text>
              <AccessibleTextInput
                keyboardType="number-pad"
                maxLength={2}
                onChangeText={handleDraftMinuteChange}
                style={styles.preciseInput}
                value={draftMinute}
              />
            </View>
          </View>

          <View style={styles.preciseActionRow}>
            <Pressable onPress={() => applyPreciseTime()} style={styles.preciseButton}>
              <Text style={styles.preciseButtonText}>{translateText('적용')}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setDraftHour(hour);
                setDraftMinute(minute);
                setIsPreciseMode(false);
              }}
              style={styles.preciseButton}
            >
              <Text style={styles.preciseButtonText}>{translateText('닫기')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.dualWheel}>
        <WheelColumn accent={accent} currentValue={hour} label={translateText('시')} onChange={handleHourChange} options={HOUR_OPTIONS} />
        <Text style={styles.separator}>:</Text>
        <WheelColumn
          accent={accent}
          currentValue={minute}
          label={translateText('분')}
          onChange={handleMinuteChange}
          options={MINUTE_OPTIONS}
        />
      </View>

      {showCaption ? <Text style={styles.caption}>{translateText('시와 분을 각각 위아래로 움직이거나 직접 입력해 시간을 맞춥니다.')}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    flex: 1,
    minWidth: 0,
    maxWidth: '100%',
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
    gap: 8,
    flexWrap: 'wrap'
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
  currentValueCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
    minWidth: 0
  },
  currentValueLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700'
  },
  currentValueText: {
    fontSize: 24,
    fontWeight: '800'
  },
  currentValueTextBlue: {
    color: colors.blueDeep
  },
  currentValueTextMint: {
    color: colors.mintDeep
  },
  currentValueHint: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700'
  },
  preciseEditor: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 10
  },
  preciseInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap'
  },
  preciseInputBox: {
    flexBasis: 72,
    maxWidth: 84,
    minWidth: 64,
    gap: 6
  },
  preciseInputLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center'
  },
  preciseInput: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    textAlign: 'center',
    color: colors.ink,
    fontSize: 24,
    fontWeight: '800'
  },
  preciseSeparator: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 8
  },
  preciseActionRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center'
  },
  preciseButton: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 12,
    justifyContent: 'center'
  },
  preciseButtonText: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '800'
  },
  dualWheel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
    maxWidth: '100%'
  },
  separator: {
    flexShrink: 0,
    color: colors.ink,
    fontSize: 34,
    fontWeight: '600',
    marginTop: 18
  },
  column: {
    flex: 1,
    gap: 8,
    minWidth: 0
  },
  columnLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center'
  },
  wheelFrame: {
    position: 'relative',
    height: ITEM_HEIGHT * VISIBLE_ROWS,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    overflow: 'hidden'
  },
  selectionBand: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 8,
    right: 8,
    height: ITEM_HEIGHT,
    borderRadius: 16,
    borderWidth: 1,
    zIndex: 1
  },
  selectionBandBlue: {
    backgroundColor: 'rgba(55,100,154,0.08)',
    borderColor: 'rgba(55,100,154,0.2)'
  },
  selectionBandMint: {
    backgroundColor: 'rgba(49,155,150,0.08)',
    borderColor: 'rgba(49,155,150,0.2)'
  },
  scroll: {
    flex: 1
  },
  timeRow: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center'
  },
  timeText: {
    color: colors.line,
    fontSize: 28,
    fontWeight: '300'
  },
  selectedTimeText: {
    fontSize: 36,
    fontWeight: '800'
  },
  selectedTimeTextBlue: {
    color: colors.blueDeep
  },
  selectedTimeTextMint: {
    color: colors.mintDeep
  },
  caption: {
    color: colors.muted,
    fontSize: 12
  }
});
