import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import CalendarDatePicker from '../components/CalendarDatePicker';
import { PanelSkeleton } from '../components/Skeleton';
import TimeWheelPicker from '../components/TimeWheelPicker';
import {
  createTask,
  deleteTask,
  getSchedules,
  getTasks,
  updateTask,
  updateTaskStatus
} from '../services/api';
import { colors, shadows } from '../styles/theme';

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH'];
const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'DONE'];
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
    scheduleId: null,
    dueDate: formatDatePart(new Date()),
    dueTime: '18:00',
    priority: 'MEDIUM',
    memo: ''
  };
}

function buildTaskPayload(form) {
  return {
    title: form.title.trim(),
    scheduleId: form.scheduleId,
    dueDate: form.dueDate.trim() ? combineDateTime(form.dueDate, form.dueTime) : null,
    priority: form.priority,
    memo: form.memo.trim() || null
  };
}

function isValidDateTime(value) {
  if (!value) {
    return true;
  }

  return !Number.isNaN(new Date(value).getTime());
}

function validateTaskForm(form) {
  const title = form.title.trim();

  if (!title) {
    return '태스크 제목을 입력해 주세요.';
  }

  const dueAt = form.dueDate.trim() ? combineDateTime(form.dueDate, form.dueTime) : null;

  if (dueAt && !isValidDateTime(dueAt)) {
    return '마감 날짜와 시간을 확인해 주세요.';
  }

  return '';
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

function TaskSummary({ tasks }) {
  const doneCount = tasks.filter((task) => task.status === 'DONE').length;
  const inProgressCount = tasks.filter((task) => task.status === 'IN_PROGRESS').length;
  const todoCount = tasks.filter((task) => task.status === 'TODO').length;

  return (
    <View style={styles.summaryRow}>
      <View style={[styles.summaryCard, styles.summaryBlue, shadows.card]}>
        <Text style={[styles.summaryEyebrow, styles.summaryEyebrowLight]}>TODO</Text>
        <Text style={[styles.summaryValue, styles.summaryValueLight]}>{todoCount}</Text>
        <Text style={styles.summaryLabelLight}>시작 전 태스크</Text>
      </View>
      <View style={[styles.summaryCard, styles.summaryMint, shadows.card]}>
        <Text style={styles.summaryEyebrow}>IN PROGRESS</Text>
        <Text style={styles.summaryValue}>{inProgressCount}</Text>
        <Text style={styles.summaryLabel}>진행 중 태스크</Text>
      </View>
      <View style={[styles.summaryCard, styles.summaryWarm, shadows.card]}>
        <Text style={styles.summaryEyebrow}>DONE</Text>
        <Text style={styles.summaryValue}>{doneCount}</Text>
        <Text style={styles.summaryLabel}>완료된 태스크</Text>
      </View>
    </View>
  );
}

function getScheduleTitle(scheduleId, schedules) {
  if (!scheduleId) {
    return '미연결';
  }

  return schedules.find((schedule) => schedule.id === scheduleId)?.title || `일정 #${scheduleId}`;
}

function getColumnTone(status) {
  if (status === 'TODO') {
    return styles.todoColumn;
  }

  if (status === 'IN_PROGRESS') {
    return styles.progressColumn;
  }

  return styles.doneColumn;
}

function getEmptyColumnText(status) {
  if (status === 'TODO') {
    return '오늘의 학습 목표를 하나 추가하면 이곳에서 시작할 수 있습니다.';
  }

  if (status === 'IN_PROGRESS') {
    return 'TODO 태스크를 진행 중으로 옮기면 현재 집중할 일이 모입니다.';
  }

  return '완료한 태스크가 쌓이면 오늘의 성취를 바로 확인할 수 있습니다.';
}

export default function TaskBoardScreen({ onNavigate, token }) {
  const [tasks, setTasks] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [form, setForm] = useState(createInitialForm());

  async function loadData(keepMessage = false) {
    setLoading(true);

    if (!keepMessage) {
      setErrorMsg('');
      setSuccessMsg('');
    }

    try {
      const [taskResult, scheduleResult] = await Promise.all([
        getTasks(token),
        getSchedules(token)
      ]);

      setTasks(taskResult.tasks || []);
      setSchedules(scheduleResult.schedules || []);
    } catch (error) {
      setErrorMsg(error.message || '태스크 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const groupedTasks = useMemo(
    () =>
      STATUS_OPTIONS.map((status) => ({
        status,
        tasks: tasks.filter((task) => task.status === status)
      })),
    [tasks]
  );

  function handleChange(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function resetForm() {
    setEditingTaskId(null);
    setForm(createInitialForm());
  }

  function handleEdit(task) {
    setEditingTaskId(task.id);
    setErrorMsg('');
    setSuccessMsg('');
    setForm({
      title: task.title || '',
      scheduleId: task.scheduleId ?? null,
      dueDate: formatDatePart(task.dueDate) || formatDatePart(new Date()),
      dueTime: formatTimePart(task.dueDate) || '18:00',
      priority: task.priority || 'MEDIUM',
      memo: task.memo || ''
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const validationMessage = validateTaskForm(form);

    if (validationMessage) {
      setErrorMsg(validationMessage);
      setSubmitting(false);
      return;
    }

    try {
      if (editingTaskId) {
        await updateTask(token, editingTaskId, buildTaskPayload(form));
        setSuccessMsg('태스크를 수정했습니다.');
      } else {
        await createTask(token, buildTaskPayload(form));
        setSuccessMsg('태스크를 생성했습니다.');
      }

      resetForm();
      await loadData(true);
    } catch (error) {
      setErrorMsg(error.message || '태스크 저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(taskId) {
    const confirmed = await confirmAction('태스크 삭제', '선택한 태스크를 삭제할까요? 삭제 후에는 되돌릴 수 없습니다.');

    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await deleteTask(token, taskId);
      setSuccessMsg('태스크를 삭제했습니다.');

      if (editingTaskId === taskId) {
        resetForm();
      }

      await loadData(true);
    } catch (error) {
      setErrorMsg(error.message || '태스크 삭제에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(taskId, nextStatus) {
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await updateTaskStatus(token, taskId, nextStatus);
      setSuccessMsg(`태스크 상태를 ${nextStatus}(으)로 변경했습니다.`);
      await loadData(true);
    } catch (error) {
      setErrorMsg(error.message || '태스크 상태 변경에 실패했습니다.');
      await loadData(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>KANBAN BOARD</Text>
          <Text style={styles.title}>태스크를 상태별로 나누어{'\n'}학습 흐름을 확인하세요</Text>
          <Text style={styles.subtitle}>
            TODO, IN PROGRESS, DONE 컬럼에서 태스크를 확인하고 필요한 상태 변경을 바로 적용할 수 있습니다.
          </Text>
        </View>
        <Pressable onPress={() => onNavigate('dashboard')} style={styles.backButton}>
          <Text style={styles.backButtonText}>대시보드로 돌아가기</Text>
        </Pressable>
      </View>

      <TaskSummary tasks={tasks} />

      <View style={[styles.panel, styles.formPanel, shadows.card]}>
        <Text style={styles.panelEyebrow}>{editingTaskId ? 'EDIT MODE' : 'NEW TASK'}</Text>
        <Text style={styles.panelTitle}>{editingTaskId ? '태스크 수정' : '새 태스크 만들기'}</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>제목</Text>
          <TextInput
            onChangeText={(value) => handleChange('title', value)}
            placeholder="예: 자료구조 문제풀이"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={form.title}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>연결 일정 선택</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scheduleSelector}>
            <Pressable
              onPress={() => handleChange('scheduleId', null)}
              style={[styles.scheduleChip, form.scheduleId === null && styles.scheduleChipActive]}
            >
              <Text style={[styles.scheduleChipText, form.scheduleId === null && styles.scheduleChipTextActive]}>
                미연결
              </Text>
            </Pressable>
            {schedules.map((schedule) => (
              <Pressable
                key={schedule.id}
                onPress={() => handleChange('scheduleId', schedule.id)}
                style={[styles.scheduleChip, form.scheduleId === schedule.id && styles.scheduleChipActive]}
              >
                <Text style={[styles.scheduleChipText, form.scheduleId === schedule.id && styles.scheduleChipTextActive]}>
                  {schedule.title}
                </Text>
                <Text style={[styles.scheduleChipSubText, form.scheduleId === schedule.id && styles.scheduleChipTextActive]}>
                  #{schedule.id}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.datePickerRow}>
          <CalendarDatePicker
            accent="blue"
            label="마감 날짜"
            onChange={(value) => handleChange('dueDate', value)}
            value={form.dueDate}
          />
          <TimeWheelPicker
            accent="blue"
            label="마감 시간"
            onChange={(value) => handleChange('dueTime', value)}
            quickOptions={QUICK_TIME_OPTIONS}
            value={form.dueTime}
          />
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
          <Text style={styles.selectionText}>마감: {form.dueDate} {form.dueTime}</Text>
          <Text style={styles.selectionText}>일정 연결: {getScheduleTitle(form.scheduleId, schedules)}</Text>
        </View>

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
        {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}

        <View style={styles.actionRow}>
          <Pressable disabled={submitting} onPress={handleSubmit} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>
              {submitting ? '저장 중...' : editingTaskId ? '태스크 수정' : '태스크 생성'}
            </Text>
          </Pressable>
          <Pressable disabled={submitting} onPress={resetForm} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>입력 초기화</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={[styles.panel, styles.loadingPanel, shadows.card]}>
          <Text style={styles.loadingText}>태스크 목록 불러오는 중</Text>
          <PanelSkeleton rows={3} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.boardContent}
          style={styles.boardScroll}
        >
          {groupedTasks.map((group) => (
            <View key={group.status} style={[styles.columnPanel, getColumnTone(group.status), shadows.card]}>
              <View style={styles.columnHeader}>
                <View>
                  <Text style={styles.columnTitle}>{group.status}</Text>
                  <Text style={styles.columnSubTitle}>{group.tasks.length}개 태스크</Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{group.tasks.length}</Text>
                </View>
              </View>

              {group.tasks.length === 0 ? (
                <View style={styles.emptyColumn}>
                  <Text style={styles.emptyTitle}>
                    {group.status === 'TODO' ? '첫 태스크를 추가해 보세요.' : '아직 이동된 태스크가 없습니다.'}
                  </Text>
                  <Text style={styles.emptyText}>{getEmptyColumnText(group.status)}</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={resetForm}
                    style={({ pressed }) => [styles.emptyActionButton, pressed && styles.buttonPressed]}
                  >
                    <Text style={styles.emptyActionText}>입력 폼 확인하기</Text>
                  </Pressable>
                </View>
              ) : (
                group.tasks.map((task) => (
                  <View key={task.id} style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                      <View style={styles.itemTitleBox}>
                        <Text style={styles.itemTitle}>{task.title}</Text>
                        <Text style={styles.itemMeta}>{getScheduleTitle(task.scheduleId, schedules)} · {task.priority}</Text>
                      </View>
                      <View style={styles.inlineActions}>
                        <Pressable onPress={() => handleEdit(task)} style={styles.inlineButton}>
                          <Text style={styles.inlineButtonText}>수정</Text>
                        </Pressable>
                        <Pressable
                          disabled={submitting}
                          onPress={() => handleDelete(task.id)}
                          style={[styles.inlineButton, styles.deleteButton]}
                        >
                          <Text style={styles.deleteButtonText}>삭제</Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.metaStack}>
                      <Text style={styles.itemField}>마감: {formatDateForDisplay(task.dueDate)}</Text>
                      <Text style={styles.itemField}>메모: {task.memo || '메모 없음'}</Text>
                    </View>

                    <View style={styles.statusRow}>
                      {STATUS_OPTIONS.map((option) => (
                        <Pressable
                          key={option}
                          disabled={submitting || task.status === option}
                          onPress={() => handleStatusChange(task.id, option)}
                          style={[styles.statusButton, task.status === option && styles.statusButtonActive]}
                        >
                          <Text style={[styles.statusButtonText, task.status === option && styles.statusButtonTextActive]}>
                            {option}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ))
              )}
            </View>
          ))}
        </ScrollView>
      )}
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
    maxWidth: 1680,
    alignSelf: 'center',
    paddingHorizontal: 18,
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
    minWidth: 260
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
    maxWidth: 860
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
  summaryBlue: {
    backgroundColor: colors.blue
  },
  summaryMint: {
    backgroundColor: colors.mintSoft
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
    color: colors.blueSoft
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
    color: colors.blueSoft,
    fontSize: 13
  },
  panel: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 22
  },
  formPanel: {
    width: '100%',
    gap: 16
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
  scheduleSelector: {
    gap: 10,
    paddingVertical: 2
  },
  scheduleChip: {
    minWidth: 160,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 3
  },
  scheduleChipActive: {
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft
  },
  scheduleChipText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800'
  },
  scheduleChipSubText: {
    color: colors.muted,
    fontSize: 11
  },
  scheduleChipTextActive: {
    color: colors.blueDeep
  },
  datePickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    alignItems: 'stretch'
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
  loadingPanel: {
    minHeight: 160,
    gap: 10
  },
  loadingText: {
    color: colors.muted,
    fontSize: 13
  },
  boardScroll: {
    overflow: 'visible'
  },
  boardContent: {
    gap: 14,
    paddingBottom: 10
  },
  columnPanel: {
    width: 306,
    maxWidth: '100%',
    minHeight: 520,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    gap: 14
  },
  todoColumn: {
    backgroundColor: colors.cream
  },
  progressColumn: {
    backgroundColor: colors.blueSoft
  },
  doneColumn: {
    backgroundColor: colors.mintSoft
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  columnTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800'
  },
  columnSubTitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4
  },
  countBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  countBadgeText: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '800'
  },
  emptyColumn: {
    borderRadius: 20,
    backgroundColor: colors.surface,
    padding: 18,
    gap: 8
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800'
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20
  },
  emptyActionButton: {
    alignSelf: 'flex-start',
    minHeight: 36,
    borderRadius: 999,
    backgroundColor: colors.blueSoft,
    paddingHorizontal: 13,
    justifyContent: 'center',
    marginTop: 4
  },
  emptyActionText: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '800'
  },
  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }]
  },
  itemCard: {
    borderRadius: 22,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 10
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
    fontSize: 17,
    fontWeight: '800'
  },
  itemMeta: {
    color: colors.muted,
    fontSize: 12
  },
  inlineActions: {
    flexDirection: 'row',
    gap: 8
  },
  inlineButton: {
    minHeight: 34,
    borderRadius: 999,
    backgroundColor: colors.surfaceWarm,
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
    borderColor: colors.danger
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '800'
  },
  metaStack: {
    gap: 4
  },
  itemField: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 20
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  statusButton: {
    minHeight: 36,
    borderRadius: 999,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    justifyContent: 'center'
  },
  statusButtonActive: {
    borderColor: colors.mintDeep,
    backgroundColor: colors.mintSoft
  },
  statusButtonText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800'
  },
  statusButtonTextActive: {
    color: colors.mintDeep
  }
});
