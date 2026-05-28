import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import DateRangeCalendarPicker from '../components/DateRangeCalendarPicker';
import TimeWheelPicker from '../components/TimeWheelPicker';
import {
  createSchedule,
  deleteSchedule,
  getSchedules,
  updateSchedule
} from '../services/api';
import { colors, shadows } from '../styles/theme';

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH'];
const QUICK_TIME_OPTIONS = ['09:00', '13:00', '18:00', '21:00'];

function formatDatePart(value) {
  if (!value) {
    return '';
  }

  return new Date(value).toISOString().slice(0, 10);
}

function formatTimePart(value) {
  if (!value) {
    return '';
  }

  return new Date(value).toISOString().slice(11, 16);
}

function combineDateTime(date, time) {
  const trimmedDate = date.trim();
  const trimmedTime = time.trim();

  if (!trimmedDate) {
    return null;
  }

  if (!trimmedTime) {
    return `${trimmedDate}T00:00:00.000Z`;
  }

  return `${trimmedDate}T${trimmedTime}:00.000Z`;
}

function createInitialForm() {
  return {
    title: '',
    subject: '',
    startDate: formatDatePart(new Date()),
    startTime: '09:00',
    endDate: formatDatePart(new Date()),
    endTime: '10:00',
    priority: 'MEDIUM',
    memo: ''
  };
}

function buildSchedulePayload(form, isEdit = false) {
  const payload = {};

  if (!isEdit || form.title.trim()) {
    payload.title = form.title.trim();
  }

  if (!isEdit || form.subject !== '') {
    payload.subject = form.subject.trim() || null;
  }

  if (!isEdit || form.startDate.trim()) {
    payload.startAt = combineDateTime(form.startDate, form.startTime);
  }

  if (!isEdit || form.endDate !== '' || form.endTime !== '') {
    payload.endAt = form.endDate.trim() ? combineDateTime(form.endDate, form.endTime) : null;
  }

  if (!isEdit || form.priority) {
    payload.priority = form.priority;
  }

  if (!isEdit || form.memo !== '') {
    payload.memo = form.memo.trim() || null;
  }

  if (isEdit) {
    Object.keys(payload).forEach((key) => {
      if (payload[key] === null && !['subject', 'endAt', 'memo'].includes(key)) {
        delete payload[key];
      }
    });
  }

  return payload;
}

function isValidDateTime(value) {
  if (!value) {
    return true;
  }

  return !Number.isNaN(new Date(value).getTime());
}

function validateScheduleForm(form) {
  const title = form.title.trim();

  if (!title) {
    return '일정 제목을 입력해 주세요.';
  }

  const startAt = combineDateTime(form.startDate, form.startTime);

  if (!startAt || !isValidDateTime(startAt)) {
    return '시작 날짜와 시간을 확인해 주세요.';
  }

  const endAt = form.endDate.trim() ? combineDateTime(form.endDate, form.endTime) : null;

  if (endAt && !isValidDateTime(endAt)) {
    return '종료 날짜와 시간을 확인해 주세요.';
  }

  if (endAt && new Date(endAt).getTime() <= new Date(startAt).getTime()) {
    return '종료 일시는 시작 일시보다 뒤여야 합니다.';
  }

  return '';
}

function formatDateForDisplay(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function addOneHour(dateText, timeText) {
  if (!dateText.trim()) {
    return null;
  }

  const base = new Date(combineDateTime(dateText, timeText || '00:00'));

  if (Number.isNaN(base.getTime())) {
    return null;
  }

  base.setUTCHours(base.getUTCHours() + 1);

  return {
    date: base.toISOString().slice(0, 10),
    time: base.toISOString().slice(11, 16)
  };
}

function confirmAction(title, message) {
  if (typeof globalThis.confirm === 'function') {
    return Promise.resolve(globalThis.confirm(message));
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: '취소', style: 'cancel', onPress: () => resolve(false) },
      { text: '삭제', style: 'destructive', onPress: () => resolve(true) }
    ]);
  });
}

function getPriorityLabel(priority) {
  if (priority === 'HIGH') {
    return '높음';
  }

  if (priority === 'LOW') {
    return '낮음';
  }

  return '보통';
}

function ScheduleSummary({ schedules }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = schedules.filter((schedule) => formatDatePart(schedule.startAt) === today).length;
  const highPriorityCount = schedules.filter((schedule) => schedule.priority === 'HIGH').length;
  const upcomingCount = schedules.filter((schedule) => schedule.endAt && schedule.endAt >= new Date().toISOString()).length;

  return (
    <View style={styles.summaryRow}>
      <View style={[styles.summaryCard, styles.summaryMint, shadows.card]}>
        <Text style={styles.summaryEyebrow}>TODAY</Text>
        <Text style={styles.summaryValue}>{todayCount}</Text>
        <Text style={styles.summaryLabel}>오늘 시작 일정</Text>
      </View>
      <View style={[styles.summaryCard, styles.summaryBlue, shadows.card]}>
        <Text style={[styles.summaryEyebrow, styles.summaryEyebrowLight]}>UPCOMING</Text>
        <Text style={[styles.summaryValue, styles.summaryValueLight]}>{upcomingCount}</Text>
        <Text style={styles.summaryLabelLight}>남은 일정</Text>
      </View>
      <View style={[styles.summaryCard, styles.summaryWarm, shadows.card]}>
        <Text style={styles.summaryEyebrow}>FOCUS</Text>
        <Text style={styles.summaryValue}>{highPriorityCount}</Text>
        <Text style={styles.summaryLabel}>높은 우선순위</Text>
      </View>
    </View>
  );
}

export default function ScheduleScreen({ onNavigate, token }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [selectedDateTarget, setSelectedDateTarget] = useState('start');
  const [form, setForm] = useState(createInitialForm());

  async function loadSchedules(keepMessage = false) {
    setLoading(true);

    if (!keepMessage) {
      setErrorMsg('');
      setSuccessMsg('');
    }

    try {
      const result = await getSchedules(token);
      setSchedules(result.schedules || []);
    } catch (error) {
      setErrorMsg(error.message || '일정 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSchedules();
  }, []);

  const sortedSchedules = useMemo(
    () =>
      [...schedules].sort((left, right) => {
        const leftDate = left.startAt || '';
        const rightDate = right.startAt || '';
        return leftDate.localeCompare(rightDate);
      }),
    [schedules]
  );

  function handleChange(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function resetForm() {
    setEditingScheduleId(null);
    setSelectedDateTarget('start');
    setForm(createInitialForm());
  }

  function handleEdit(schedule) {
    setEditingScheduleId(schedule.id);
    setErrorMsg('');
    setSuccessMsg('');
    setSelectedDateTarget('start');
    setForm({
      title: schedule.title || '',
      subject: schedule.subject || '',
      startDate: formatDatePart(schedule.startAt),
      startTime: formatTimePart(schedule.startAt) || '09:00',
      endDate: formatDatePart(schedule.endAt) || formatDatePart(schedule.startAt),
      endTime: formatTimePart(schedule.endAt) || '10:00',
      priority: schedule.priority || 'MEDIUM',
      memo: schedule.memo || ''
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const validationMessage = validateScheduleForm(form);

    if (validationMessage) {
      setErrorMsg(validationMessage);
      setSubmitting(false);
      return;
    }

    try {
      if (editingScheduleId) {
        await updateSchedule(token, editingScheduleId, buildSchedulePayload(form, true));
        setSuccessMsg('일정을 수정했습니다.');
      } else {
        await createSchedule(token, buildSchedulePayload(form));
        setSuccessMsg('일정을 생성했습니다.');
      }

      resetForm();
      await loadSchedules(true);
    } catch (error) {
      setErrorMsg(error.message || '일정 저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(scheduleId) {
    const confirmed = await confirmAction('일정 삭제', '선택한 일정을 삭제할까요? 삭제 후에는 되돌릴 수 없습니다.');

    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await deleteSchedule(token, scheduleId);
      setSuccessMsg('일정을 삭제했습니다.');

      if (editingScheduleId === scheduleId) {
        resetForm();
      }

      await loadSchedules(true);
    } catch (error) {
      setErrorMsg(error.message || '일정 삭제에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  function syncEndWithStart() {
    setForm((current) => ({
      ...current,
      endDate: current.startDate,
      endTime: current.startTime
    }));
  }

  function setEndAfterOneHour() {
    const next = addOneHour(form.startDate, form.startTime);

    if (!next) {
      return;
    }

    setForm((current) => ({
      ...current,
      endDate: next.date,
      endTime: next.time
    }));
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>SCHEDULE PLANNER</Text>
          <Text style={styles.title}>날짜와 시간을 선택해{'\n'}학습 일정을 정리하세요</Text>
          <Text style={styles.subtitle}>
            월간 달력과 시간 선택 도구로 시작·종료 일시를 정하고, 과목과 우선순위를 함께 기록할 수 있습니다.
          </Text>
        </View>
        <Pressable onPress={() => onNavigate('dashboard')} style={styles.backButton}>
          <Text style={styles.backButtonText}>대시보드로 돌아가기</Text>
        </Pressable>
      </View>

      <ScheduleSummary schedules={schedules} />

      <View style={styles.twoColumn}>
        <View style={[styles.panel, styles.formPanel, shadows.card]}>
          <Text style={styles.panelEyebrow}>{editingScheduleId ? 'EDIT MODE' : 'NEW ENTRY'}</Text>
          <Text style={styles.panelTitle}>{editingScheduleId ? '일정 수정' : '새 일정 만들기'}</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>제목</Text>
            <TextInput
              onChangeText={(value) => handleChange('title', value)}
              placeholder="예: 운영체제 중간고사 정리"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={form.title}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>과목</Text>
            <TextInput
              onChangeText={(value) => handleChange('subject', value)}
              placeholder="예: 운영체제"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={form.subject}
            />
          </View>

          <DateRangeCalendarPicker
            endDate={form.endDate}
            onChange={({ startDate, endDate }) => {
              handleChange('startDate', startDate);
              handleChange('endDate', endDate);
            }}
            selectedTarget={selectedDateTarget}
            setSelectedTarget={setSelectedDateTarget}
            startDate={form.startDate}
          />

          <View style={styles.schedulePickerGrid}>
            <TimeWheelPicker
              accent="mint"
              label="시작 시간"
              onChange={(value) => handleChange('startTime', value)}
              quickOptions={QUICK_TIME_OPTIONS}
              showCaption
              value={form.startTime}
            />
            <TimeWheelPicker
              accent="blue"
              label="종료 시간"
              onChange={(value) => handleChange('endTime', value)}
              quickOptions={QUICK_TIME_OPTIONS}
              showCaption={false}
              value={form.endTime}
            />
          </View>

          <View style={styles.helperRow}>
            <Pressable onPress={syncEndWithStart} style={styles.shortcutButton}>
              <Text style={styles.shortcutButtonText}>종료를 시작과 동일하게</Text>
            </Pressable>
            <Pressable onPress={setEndAfterOneHour} style={styles.shortcutButton}>
              <Text style={styles.shortcutButtonText}>시작 + 1시간</Text>
            </Pressable>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>우선순위</Text>
            <View style={styles.optionRow}>
              {PRIORITY_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => handleChange('priority', option)}
                  style={[styles.pillButton, form.priority === option && styles.pillButtonActive]}
                >
                  <Text style={[styles.pillButtonText, form.priority === option && styles.pillButtonTextActive]}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>메모</Text>
            <TextInput
              multiline
              numberOfLines={4}
              onChangeText={(value) => handleChange('memo', value)}
              placeholder="선택 입력"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.textArea]}
              value={form.memo}
            />
          </View>

          <View style={styles.selectionSummary}>
            <Text style={styles.selectionTitle}>선택 요약</Text>
            <Text style={styles.selectionText}>시작: {form.startDate} {form.startTime}</Text>
            <Text style={styles.selectionText}>종료: {form.endDate} {form.endTime}</Text>
          </View>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}

          <View style={styles.actionRow}>
            <Pressable disabled={submitting} onPress={handleSubmit} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>
                {submitting ? '저장 중...' : editingScheduleId ? '일정 수정' : '일정 생성'}
              </Text>
            </Pressable>
            <Pressable disabled={submitting} onPress={resetForm} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>입력 초기화</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.panel, styles.listPanel, shadows.card]}>
          <Text style={styles.panelEyebrow}>SAVED SCHEDULES</Text>
          <Text style={styles.panelTitle}>일정 목록</Text>

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color={colors.blue} size="small" />
              <Text style={styles.loadingText}>일정 목록 불러오는 중</Text>
            </View>
          ) : sortedSchedules.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>등록된 일정이 아직 없습니다.</Text>
              <Text style={styles.emptyText}>왼쪽에서 날짜와 시간을 먼저 고르면 일정 흐름을 훨씬 쉽게 만들 수 있습니다.</Text>
            </View>
          ) : (
            sortedSchedules.map((schedule) => (
              <View key={schedule.id} style={styles.itemCard}>
                <View style={styles.itemDateBadge}>
                  <Text style={styles.itemDateDay}>{formatDatePart(schedule.startAt).slice(8, 10)}</Text>
                  <Text style={styles.itemDateMonth}>{formatDatePart(schedule.startAt).slice(5, 7)}월</Text>
                </View>
                <View style={styles.itemBody}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemTitleBox}>
                      <Text style={styles.itemTitle}>{schedule.title}</Text>
                      <Text style={styles.itemMeta}>
                        {schedule.subject || '과목 없음'} · 우선순위 {getPriorityLabel(schedule.priority)}
                      </Text>
                    </View>
                    <View style={styles.inlineActions}>
                      <Pressable onPress={() => handleEdit(schedule)} style={styles.inlineButton}>
                        <Text style={styles.inlineButtonText}>수정</Text>
                      </Pressable>
                      <Pressable
                        disabled={submitting}
                        onPress={() => handleDelete(schedule.id)}
                        style={[styles.inlineButton, styles.deleteButton]}
                      >
                        <Text style={styles.deleteButtonText}>삭제</Text>
                      </Pressable>
                    </View>
                  </View>
                  <Text style={styles.itemField}>시작: {formatDateForDisplay(schedule.startAt)}</Text>
                  <Text style={styles.itemField}>종료: {formatDateForDisplay(schedule.endAt)}</Text>
                  <Text style={styles.itemMemo}>{schedule.memo || '메모 없음'}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  contentContainer: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 56,
    gap: 20
  },
  hero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    flexWrap: 'wrap'
  },
  heroCopy: {
    flex: 1,
    minWidth: 280
  },
  eyebrow: {
    color: colors.mintDeep,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10
  },
  title: {
    color: colors.ink,
    fontSize: 31,
    lineHeight: 41,
    fontWeight: '800'
  },
  subtitle: {
    marginTop: 12,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 760
  },
  backButton: {
    minHeight: 46,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 18,
    justifyContent: 'center'
  },
  backButtonText: {
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '800'
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14
  },
  summaryCard: {
    flex: 1,
    minWidth: 220,
    borderRadius: 22,
    padding: 20
  },
  summaryMint: {
    backgroundColor: colors.mintSoft
  },
  summaryBlue: {
    backgroundColor: colors.blue
  },
  summaryWarm: {
    backgroundColor: colors.surfaceWarm
  },
  summaryEyebrow: {
    color: colors.mintDeep,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1
  },
  summaryEyebrowLight: {
    color: '#D6E3F3'
  },
  summaryValue: {
    marginTop: 14,
    color: colors.ink,
    fontSize: 31,
    fontWeight: '800'
  },
  summaryValueLight: {
    color: colors.surface
  },
  summaryLabel: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 13
  },
  summaryLabelLight: {
    marginTop: 6,
    color: '#D6E3F3',
    fontSize: 13
  },
  twoColumn: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    alignItems: 'flex-start'
  },
  panel: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 22
  },
  formPanel: {
    flex: 1.15,
    minWidth: 340,
    gap: 16
  },
  listPanel: {
    flex: 0.85,
    minWidth: 300,
    gap: 14
  },
  panelEyebrow: {
    color: colors.mintDeep,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1
  },
  panelTitle: {
    color: colors.ink,
    fontSize: 23,
    fontWeight: '800'
  },
  fieldGroup: {
    gap: 8
  },
  label: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700'
  },
  input: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.ink,
    fontSize: 14
  },
  textArea: {
    minHeight: 104,
    textAlignVertical: 'top'
  },
  schedulePickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    alignItems: 'flex-start'
  },
  helperRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  shortcutButton: {
    minHeight: 38,
    borderRadius: 999,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    justifyContent: 'center'
  },
  shortcutButtonText: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '800'
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  pillButton: {
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    justifyContent: 'center'
  },
  pillButtonActive: {
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft
  },
  pillButtonText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800'
  },
  pillButtonTextActive: {
    color: colors.blueDeep
  },
  selectionSummary: {
    borderRadius: 18,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 6
  },
  selectionTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800'
  },
  selectionText: {
    color: colors.muted,
    fontSize: 13
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: colors.blue,
    paddingHorizontal: 18,
    justifyContent: 'center'
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '800'
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 18,
    justifyContent: 'center'
  },
  secondaryButtonText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800'
  },
  errorText: {
    color: colors.danger,
    fontWeight: '700'
  },
  successText: {
    color: colors.success,
    fontWeight: '700'
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    gap: 10
  },
  loadingText: {
    color: colors.muted,
    fontSize: 13
  },
  emptyBox: {
    borderRadius: 20,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    gap: 6
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800'
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20
  },
  itemCard: {
    flexDirection: 'row',
    gap: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 16
  },
  itemDateBadge: {
    width: 72,
    borderRadius: 18,
    backgroundColor: colors.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 4
  },
  itemDateDay: {
    color: colors.mintDeep,
    fontSize: 24,
    fontWeight: '800'
  },
  itemDateMonth: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700'
  },
  itemBody: {
    flex: 1,
    gap: 8
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  itemTitleBox: {
    flex: 1,
    gap: 4
  },
  itemTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800'
  },
  itemMeta: {
    color: colors.muted,
    fontSize: 12
  },
  itemField: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 20
  },
  itemMemo: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20
  },
  inlineActions: {
    flexDirection: 'row',
    gap: 8
  },
  inlineButton: {
    minHeight: 36,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    justifyContent: 'center'
  },
  inlineButtonText: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '800'
  },
  deleteButton: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#F1C7C4'
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '800'
  }
});
