import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AccessibleTextInput from '../components/AccessibleTextInput';
import FieldFeedback from '../components/FieldFeedback';
import { ProfileAvatar, ProfileBackground, ProfileTitleChip } from '../components/ProfileAppearance';
import { PanelSkeleton } from '../components/Skeleton';
import {
  changeCurrentUserPassword,
  deleteCurrentUser,
  getCommunityBookmarks,
  getFriendRequests,
  getFriends,
  getMyActivityStats,
  getMyShop,
  getMyRewards,
  getSchedules,
  getStatisticsSummary,
  getTasks,
  updateCurrentUser
} from '../services/api';
import { useLanguage } from '../i18n';
import { colors, interactions, interactiveStateStyles, shadows } from '../styles/theme';

const WITHDRAWAL_CONFIRMATION_TEXT = '탈퇴합니다';

const EMPTY_PROFILE_DATA = {
  schedules: [],
  tasks: [],
  rewards: {
    account: null,
    metrics: { totalStudyMinutes: 0, completedTaskCount: 0 },
    quests: [],
    badges: [],
    recentPointTransactions: []
  },
  shop: {
    profile: null,
    equippedItems: {
      profileImage: null,
      profileBackground: null,
      title: null
    }
  },
  bookmarks: [],
  friends: [],
  friendRequests: { received: [], sent: [] },
  activityStats: {
    postCount: 0,
    commentCount: 0,
    replyCount: 0,
    likeCount: 0,
    dislikeCount: 0,
    bookmarkCount: 0,
    reactionBasis: 'GIVEN'
  },
  todaySummary: { totalMinutes: 0, completionRate: 0, sessionCount: 0, taskCount: 0 },
  weekSummary: { totalMinutes: 0, completionRate: 0, sessionCount: 0, taskCount: 0 }
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

function getDateRange(days) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - (days - 1));

  return {
    startDate: toDateKey(startDate),
    endDate: toDateKey(endDate)
  };
}

function formatShortDate(value) {
  if (!value) {
    return '날짜 없음';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '날짜 확인 필요';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  }).format(date);
}

function formatLoginId(loginId = '') {
  return loginId || '아이디 없음';
}

function formatAccountStatus(status) {
  if (status === 'SUSPENDED') {
    return '제한된 계정';
  }

  if (status === 'DEACTIVATED' || status === 'DELETED') {
    return '비활성/탈퇴 처리 계정';
  }

  return '활성 계정';
}

function getProfileNameFeedback(name, currentName) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return { tone: 'warning', message: '닉네임을 입력해 주세요.' };
  }

  if (trimmedName.length < 2) {
    return { tone: 'warning', message: '두 글자 이상 입력하면 더 알아보기 쉬워요.' };
  }

  if (trimmedName.length > 30) {
    return { tone: 'error', message: '30자 이하로 입력해 주세요.' };
  }

  if (trimmedName === String(currentName || '').trim()) {
    return { tone: 'info', message: '현재 사용 중인 닉네임이에요.' };
  }

  return { tone: 'success', message: '형식상 사용할 수 있는 닉네임이에요. 멋지네요!' };
}

function getCurrentPasswordFeedback(currentPassword) {
  if (!currentPassword) {
    return { tone: 'info', message: '현재 비밀번호를 입력해야 변경할 수 있어요.' };
  }

  return { tone: 'success', message: '현재 비밀번호를 입력했어요.' };
}

function getNewPasswordFeedback(newPassword) {
  if (!newPassword) {
    return { tone: 'info', message: '새 비밀번호는 8자 이상으로 입력해 주세요.' };
  }

  if (newPassword.length < 8) {
    return { tone: 'warning', message: '8자 이상으로 입력해 주세요.' };
  }

  return { tone: 'success', message: '새 비밀번호 길이가 좋아요.' };
}

function getConfirmPasswordFeedback(newPassword, confirmPassword) {
  if (!confirmPassword) {
    return { tone: 'info', message: '새 비밀번호를 한 번 더 입력해 주세요.' };
  }

  if (newPassword !== confirmPassword) {
    return { tone: 'error', message: '두 비밀번호가 아직 일치하지 않아요.' };
  }

  return { tone: 'success', message: '두 비밀번호가 일치해요.' };
}

function getWithdrawalPasswordFeedback(currentPassword) {
  if (!currentPassword) {
    return { tone: 'info', message: '본인 확인을 위해 현재 비밀번호를 입력해 주세요.' };
  }

  return { tone: 'success', message: '현재 비밀번호가 입력되었습니다.' };
}

function getWithdrawalConfirmationFeedback(confirmationText) {
  if (!confirmationText) {
    return { tone: 'info', message: `"${WITHDRAWAL_CONFIRMATION_TEXT}"를 그대로 입력해야 탈퇴할 수 있습니다.` };
  }

  if (confirmationText.trim() !== WITHDRAWAL_CONFIRMATION_TEXT) {
    return { tone: 'error', message: '확인 문구가 일치하지 않습니다.' };
  }

  return { tone: 'success', message: '확인 문구가 일치합니다.' };
}

function sortByDate(items, field, direction = 'asc') {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left?.[field] || 0).getTime();
    const rightTime = new Date(right?.[field] || 0).getTime();
    return direction === 'desc' ? rightTime - leftTime : leftTime - rightTime;
  });
}

function buildProfileInsight({ tasks, schedules, todaySummary, weekSummary }) {
  const doneCount = tasks.filter((task) => task.status === 'DONE').length;
  const activeTaskCount = tasks.filter((task) => task.status === 'IN_PROGRESS').length;
  const upcomingCount = schedules.filter((schedule) => new Date(schedule.startAt).getTime() >= Date.now()).length;

  if (weekSummary.totalMinutes > 0) {
    return `최근 7일 동안 ${formatMinutes(weekSummary.totalMinutes)}의 집중 시간이 쌓였습니다.`;
  }

  if (todaySummary.totalMinutes > 0) {
    return `오늘 ${formatMinutes(todaySummary.totalMinutes)} 집중했습니다. 짧게라도 흐름을 이어가고 있어요.`;
  }

  if (doneCount > 0) {
    return `완료한 태스크가 ${doneCount}개 있습니다. 다음 목표를 하나 더 정리해 보세요.`;
  }

  if (activeTaskCount > 0 || upcomingCount > 0) {
    return '진행 중인 학습 흐름이 있습니다. 일정과 칸반을 이어서 확인해 보세요.';
  }

  return '아직 이번 주 기록이 많지 않습니다. 오늘의 학습 목표를 하나 추가해 보세요.';
}

function MetricCard({ label, value, helper, tone = 'default' }) {
  return (
    <View style={[styles.metricCard, tone === 'mint' && styles.metricCardMint, tone === 'blue' && styles.metricCardBlue]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricHelper}>{helper}</Text>
    </View>
  );
}

function EmptyAction({ title, description, actionLabel, onPress }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{description}</Text>
      {onPress ? (
        <Pressable accessibilityRole="button" onPress={onPress} style={(state) => [styles.emptyAction, ...interactiveStateStyles(state)]}>
          <Text style={styles.emptyActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function SectionCard({ children, headerAction, subtitle, title }) {
  return (
    <View style={[styles.sectionCard, shadows.card]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleGroup}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
        {headerAction}
      </View>
      {children}
    </View>
  );
}

export default function ProfileDashboardScreen({ onAccountDeleted, onNavigate, onUserUpdate, token, user }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState(EMPTY_PROFILE_DATA);

  const userName = user?.name || '학습자';
  const isAdmin = user?.role === 'ADMIN';
  const [nameForm, setNameForm] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [withdrawingAccount, setWithdrawingAccount] = useState(false);
  const [accountMessage, setAccountMessage] = useState('');
  const [accountError, setAccountError] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [accountSection, setAccountSection] = useState('nickname');
  const [withdrawalForm, setWithdrawalForm] = useState({
    currentPassword: '',
    confirmationText: ''
  });
  const { translateText } = useLanguage();

  useEffect(() => {
    setNameForm(user?.name || '');
  }, [user?.name]);

  async function loadProfileData({ silent = false } = {}) {
    if (!token) {
      setProfileData(EMPTY_PROFILE_DATA);
      setLoading(false);
      return;
    }

    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    const todayRange = getDateRange(1);
    const weekRange = getDateRange(7);

    try {
      const [scheduleResult, taskResult, rewardResult, shopResult, bookmarkResult, friendsResult, requestsResult, activityResult, todayResult, weekResult] = await Promise.all([
        getSchedules(token),
        getTasks(token),
        getMyRewards(token),
        getMyShop(token),
        getCommunityBookmarks(token, { page: 1, pageSize: 3 }),
        getFriends(token),
        getFriendRequests(token),
        getMyActivityStats(token),
        getStatisticsSummary(token, todayRange),
        getStatisticsSummary(token, weekRange)
      ]);

      setProfileData({
        schedules: Array.isArray(scheduleResult?.schedules) ? scheduleResult.schedules : [],
        tasks: Array.isArray(taskResult?.tasks) ? taskResult.tasks : [],
        rewards: {
          ...EMPTY_PROFILE_DATA.rewards,
          ...(rewardResult?.rewards || {})
        },
        shop: {
          ...EMPTY_PROFILE_DATA.shop,
          ...(shopResult?.shop || {})
        },
        bookmarks: Array.isArray(bookmarkResult?.bookmarks) ? bookmarkResult.bookmarks : [],
        friends: Array.isArray(friendsResult?.friends) ? friendsResult.friends : [],
        friendRequests: {
          ...EMPTY_PROFILE_DATA.friendRequests,
          ...(requestsResult?.requests || {})
        },
        activityStats: {
          ...EMPTY_PROFILE_DATA.activityStats,
          ...(activityResult?.activity || {})
        },
        todaySummary: todayResult?.summary || EMPTY_PROFILE_DATA.todaySummary,
        weekSummary: weekResult?.summary || EMPTY_PROFILE_DATA.weekSummary
      });
    } catch (loadError) {
      setError(loadError.message || '프로필 대시보드 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadProfileData();
  }, [token]);

  async function handleNameSubmit() {
    if (!token || savingName) {
      return;
    }

    const nextName = nameForm.trim();
    setAccountMessage('');
    setAccountError('');

    if (!nextName) {
      setAccountError('닉네임을 입력해 주세요.');
      return;
    }

    if (nextName === user?.name) {
      setAccountMessage('이미 현재 닉네임으로 설정되어 있습니다.');
      return;
    }

    setSavingName(true);

    try {
      const result = await updateCurrentUser(token, { name: nextName });
      onUserUpdate?.(result.user);
      setNameForm(result.user?.name || nextName);
      setAccountMessage('닉네임을 변경했습니다.');
    } catch (submitError) {
      setAccountError(submitError.message || '닉네임을 변경하지 못했습니다.');
    } finally {
      setSavingName(false);
    }
  }

  async function handlePasswordSubmit() {
    if (!token || changingPassword) {
      return;
    }

    setAccountMessage('');
    setAccountError('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setAccountError('현재 비밀번호와 새 비밀번호를 모두 입력해 주세요.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setAccountError('새 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setChangingPassword(true);

    try {
      await changeCurrentUserPassword(token, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setAccountMessage('비밀번호를 변경했습니다. 다음 로그인부터 새 비밀번호를 사용하세요.');
    } catch (submitError) {
      setAccountError(submitError.message || '비밀번호를 변경하지 못했습니다.');
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleWithdrawalSubmit() {
    if (!token || withdrawingAccount) {
      return;
    }

    setAccountMessage('');
    setAccountError('');

    if (!withdrawalForm.currentPassword || !withdrawalForm.confirmationText) {
      setAccountError('현재 비밀번호와 확인 문구를 모두 입력해 주세요.');
      return;
    }

    if (withdrawalForm.confirmationText.trim() !== WITHDRAWAL_CONFIRMATION_TEXT) {
      setAccountError(`확인 문구로 "${WITHDRAWAL_CONFIRMATION_TEXT}"를 정확히 입력해 주세요.`);
      return;
    }

    setWithdrawingAccount(true);

    try {
      const result = await deleteCurrentUser(token, withdrawalForm);
      setWithdrawalForm({ currentPassword: '', confirmationText: '' });
      onUserUpdate?.(result.user);
      onAccountDeleted?.(result.user);
    } catch (submitError) {
      setAccountError(submitError.message || '회원 탈퇴를 처리하지 못했습니다.');
    } finally {
      setWithdrawingAccount(false);
    }
  }

  const derived = useMemo(() => {
    const tasks = profileData.tasks || [];
    const schedules = profileData.schedules || [];
    const rewards = profileData.rewards || EMPTY_PROFILE_DATA.rewards;
    const now = Date.now();

    const doneTasks = tasks.filter((task) => task.status === 'DONE');
    const inProgressTasks = tasks.filter((task) => task.status === 'IN_PROGRESS');
    const todoTasks = tasks.filter((task) => task.status === 'TODO');
    const upcomingSchedules = sortByDate(
      schedules.filter((schedule) => new Date(schedule.startAt).getTime() >= now),
      'startAt'
    ).slice(0, 3);
    const recentTasks = sortByDate(tasks, 'updatedAt', 'desc').slice(0, 3);
    const activeQuests = (rewards.quests || []).filter((quest) => quest.status !== 'CLAIMED');
    const claimableQuestCount = activeQuests.filter((quest) => quest.status === 'ACHIEVED').length;
    const progressQuestCount = activeQuests.filter((quest) => quest.status === 'IN_PROGRESS').length;
    const badges = rewards.badges || [];
    const recentTransactions = rewards.recentPointTransactions || [];

    return {
      doneTasks,
      inProgressTasks,
      todoTasks,
      upcomingSchedules,
      recentTasks,
      activeQuests,
      claimableQuestCount,
      progressQuestCount,
      badges,
      recentTransactions,
      insight: buildProfileInsight({
        tasks,
        schedules,
        todaySummary: profileData.todaySummary,
        weekSummary: profileData.weekSummary
      })
    };
  }, [profileData]);

  const rewardPoints = profileData.rewards?.account?.pointBalance || 0;
  const profileAppearance = profileData.shop?.profile || user?.profile || {};
  const visibleBadges = derived.badges.slice(0, 4);
  const visibleQuests = derived.activeQuests.slice(0, 3);
  const activityStats = profileData.activityStats || EMPTY_PROFILE_DATA.activityStats;
  const activityItems = [
    { key: 'posts', label: '작성 글', value: activityStats.postCount },
    { key: 'comments', label: '댓글', value: activityStats.commentCount },
    { key: 'replies', label: '대답글', value: activityStats.replyCount },
    { key: 'likes', label: '내가 누른 좋아요', value: activityStats.likeCount },
    { key: 'dislikes', label: '내가 누른 싫어요', value: activityStats.dislikeCount },
    { key: 'bookmarks', label: '북마크', value: activityStats.bookmarkCount }
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ProfileBackground appearance={profileAppearance} style={[styles.hero, shadows.card]}>
        <ProfileAvatar appearance={profileAppearance} name={userName} size="lg" />
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>PROFILE DASHBOARD</Text>
          <Text style={styles.title}>{userName}님의 학습 흐름</Text>
          <ProfileTitleChip animated title={profileAppearance.titleText} translateText={translateText} />
          <Text style={styles.subtitle}>{derived.insight}</Text>
          <View style={styles.identityRow}>
            <View style={styles.identityChip}>
              <Text style={styles.identityChipText}>{isAdmin ? 'ADMIN' : 'LEARNER'}</Text>
            </View>
            <Text style={styles.loginIdText}>{formatLoginId(user?.loginId)}</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={loading || refreshing}
          onPress={() => loadProfileData({ silent: true })}
          style={(state) => [
            styles.refreshButton,
            (loading || refreshing) && styles.disabledButton,
            ...interactiveStateStyles(state, { disabled: loading || refreshing })
          ]}
        >
          <Text style={styles.refreshButtonText}>{refreshing ? '갱신 중' : '새로고침'}</Text>
        </Pressable>
      </ProfileBackground>

      {loading ? (
        <View style={styles.skeletonGrid}>
          <PanelSkeleton rows={4} />
          <PanelSkeleton rows={4} />
          <PanelSkeleton rows={4} />
        </View>
      ) : (
        <>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>프로필 데이터를 불러오지 못했습니다.</Text>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable accessibilityRole="button" onPress={() => loadProfileData()} style={(state) => [styles.errorButton, ...interactiveStateStyles(state)]}>
                <Text style={styles.errorButtonText}>다시 시도</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.accountMetaGrid}>
            <View style={styles.accountMetaCard}>
              <Text style={styles.accountMetaLabel}>가입일</Text>
              <Text style={styles.accountMetaValue}>{formatShortDate(user?.createdAt)}</Text>
            </View>
            <View style={styles.accountMetaCard}>
              <Text style={styles.accountMetaLabel}>계정 상태</Text>
              <Text style={styles.accountMetaValue}>{formatAccountStatus(user?.status)}</Text>
            </View>
            <View style={styles.accountMetaCard}>
              <Text style={styles.accountMetaLabel}>로그인 아이디</Text>
              <Text style={styles.accountMetaValue}>{formatLoginId(user?.loginId)}</Text>
            </View>
          </View>

          <View style={styles.metricGrid}>
            <MetricCard label="오늘 집중" value={formatMinutes(profileData.todaySummary.totalMinutes)} helper={`${profileData.todaySummary.sessionCount || 0}회 기록`} tone="mint" />
            <MetricCard label="최근 7일 집중" value={formatMinutes(profileData.weekSummary.totalMinutes)} helper={`완료율 ${profileData.weekSummary.completionRate || 0}%`} tone="blue" />
            <MetricCard label="완료 태스크" value={`${formatNumber(derived.doneTasks.length)}개`} helper={`진행 중 ${derived.inProgressTasks.length}개`} />
            <MetricCard label="보유 포인트" value={`${formatNumber(rewardPoints)}P`} helper={`배지 ${derived.badges.length}개`} tone="mint" />
            <MetricCard label="학습 친구" value={`${formatNumber(profileData.friends.length)}명`} helper={`받은 요청 ${profileData.friendRequests.received.length}건`} tone="blue" />
          </View>

          <View style={styles.bentoGrid}>
            <SectionCard
              title="학습 요약"
              subtitle="일정과 칸반 진행 상황을 함께 봅니다."
              headerAction={
                <Pressable accessibilityRole="button" onPress={() => onNavigate('schedule')} style={(state) => [styles.linkButton, ...interactiveStateStyles(state)]}>
                  <Text style={styles.linkButtonText}>일정 보기</Text>
                </Pressable>
              }
            >
              <View style={styles.summaryRows}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>예정 일정</Text>
                  <Text style={styles.summaryValue}>{formatNumber(derived.upcomingSchedules.length)}개</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>진행 중 태스크</Text>
                  <Text style={styles.summaryValue}>{formatNumber(derived.inProgressTasks.length)}개</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>대기 태스크</Text>
                  <Text style={styles.summaryValue}>{formatNumber(derived.todoTasks.length)}개</Text>
                </View>
              </View>
              {derived.upcomingSchedules.length ? (
                <View style={styles.listGroup}>
                  {derived.upcomingSchedules.map((schedule) => (
                    <Pressable
                      key={schedule.id}
                      accessibilityRole="button"
                      onPress={() => onNavigate('schedule')}
                      style={(state) => [styles.listItem, ...interactiveStateStyles(state, { kind: 'card' })]}
                    >
                      <View>
                        <Text style={styles.listTitle}>{schedule.title}</Text>
                        <Text style={styles.listMeta}>{schedule.subject || '과목 미지정'} · {formatShortDate(schedule.startAt)}</Text>
                      </View>
                      <Text style={styles.priorityText}>{schedule.priority}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <EmptyAction
                  title="예정된 일정이 없습니다."
                  description="오늘의 학습 목표를 일정으로 먼저 잡아 보세요."
                  actionLabel="첫 일정 추가"
                  onPress={() => onNavigate('schedule')}
                />
              )}
            </SectionCard>

            <SectionCard
              title="보상 요약"
              subtitle={derived.claimableQuestCount > 0 ? `${derived.claimableQuestCount}개 퀘스트 보상을 받을 수 있습니다.` : '퀘스트와 배지를 한눈에 확인합니다.'}
              headerAction={
                <Pressable accessibilityRole="button" onPress={() => onNavigate('dashboard')} style={(state) => [styles.linkButton, ...interactiveStateStyles(state)]}>
                  <Text style={styles.linkButtonText}>보상 보기</Text>
                </Pressable>
              }
            >
              {visibleQuests.length ? (
                <View style={styles.questList}>
                  {visibleQuests.map((quest) => (
                    <View key={quest.id} style={[styles.questCard, quest.status === 'ACHIEVED' && styles.questCardReady]}>
                      <View style={styles.questHeader}>
                        <Text style={styles.questTitle}>{quest.title}</Text>
                        <Text style={styles.questReward}>{formatNumber(quest.rewardPoints)}P</Text>
                      </View>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressBar, { width: `${Math.max(6, Math.min(100, Math.round((quest.progressRate || 0) * 100)))}%` }]} />
                      </View>
                      <Text style={styles.questMeta}>{quest.status === 'ACHIEVED' ? '수령 가능' : `진행 중 · ${quest.progressValue || 0}/${quest.targetValue || 0}`}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <EmptyAction
                  title="진행 중인 퀘스트가 없습니다."
                  description="일정과 태스크를 채우면 보상 흐름을 시작할 수 있습니다."
                  actionLabel="학습 대시보드 보기"
                  onPress={() => onNavigate('dashboard')}
                />
              )}

              {visibleBadges.length ? (
                <View style={styles.badgeGrid}>
                  {visibleBadges.map((userBadge) => (
                    <View key={userBadge.id} style={styles.badgeChip}>
                      <Text style={styles.badgeIcon}>🏅</Text>
                      <Text style={styles.badgeText}>{userBadge.badge?.name || '배지'}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </SectionCard>

            <SectionCard title="커뮤니티 활동" subtitle="내가 작성하거나 누른 활동 기준으로 집계합니다.">
              <View style={styles.activityGrid}>
                {activityItems.map((item) => (
                  <View key={item.key} style={styles.activityStatCard}>
                    <Text style={styles.activityStatValue}>{formatNumber(item.value)}</Text>
                    <Text style={styles.activityStatLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.activityBasisText}>좋아요/싫어요는 내가 게시글과 댓글에 누른 반응 수입니다.</Text>
            </SectionCard>

            <SectionCard
              title="최근 활동"
              subtitle="최근 태스크와 커뮤니티 북마크를 빠르게 이어갑니다."
              headerAction={
                <Pressable accessibilityRole="button" onPress={() => onNavigate('taskBoard')} style={(state) => [styles.linkButton, ...interactiveStateStyles(state)]}>
                  <Text style={styles.linkButtonText}>칸반 보기</Text>
                </Pressable>
              }
            >
              {derived.recentTasks.length ? (
                <View style={styles.listGroup}>
                  {derived.recentTasks.map((task) => (
                    <Pressable
                      key={task.id}
                      accessibilityRole="button"
                      onPress={() => onNavigate('taskBoard')}
                      style={(state) => [styles.listItem, ...interactiveStateStyles(state, { kind: 'card' })]}
                    >
                      <View>
                        <Text style={styles.listTitle}>{task.title}</Text>
                        <Text style={styles.listMeta}>{task.status} · {task.dueDate ? formatShortDate(task.dueDate) : '마감일 없음'}</Text>
                      </View>
                      <Text style={styles.priorityText}>{task.priority}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <EmptyAction
                  title="최근 태스크가 없습니다."
                  description="칸반에서 오늘 할 일을 하나 만들어 보세요."
                  actionLabel="첫 태스크 만들기"
                  onPress={() => onNavigate('taskBoard')}
                />
              )}

              <View style={styles.bookmarkBlock}>
                <Text style={styles.subsectionTitle}>내 북마크</Text>
                {profileData.bookmarks.length ? (
                  <View style={styles.listGroup}>
                    {profileData.bookmarks.map((bookmark) => (
                      <Pressable
                        key={bookmark.bookmarkId}
                        accessibilityRole="button"
                        onPress={() => onNavigate('community')}
                        style={(state) => [styles.listItem, ...interactiveStateStyles(state, { kind: 'card' })]}
                      >
                        <View>
                          <Text style={styles.listTitle}>{bookmark.post?.title || '북마크한 글'}</Text>
                          <Text style={styles.listMeta}>{bookmark.post?.category || '커뮤니티'} · 댓글 {bookmark.post?.commentCount || 0}개</Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <EmptyAction
                    title="저장한 커뮤니티 글이 없습니다."
                    description="나중에 다시 볼 글을 북마크해 두면 이곳에서 이어볼 수 있습니다."
                    actionLabel="커뮤니티 탐색"
                    onPress={() => onNavigate('community')}
                  />
                )}
              </View>
            </SectionCard>

            <SectionCard title="빠른 이동" subtitle="자주 쓰는 학습 흐름을 바로 시작합니다.">
              <View style={styles.quickGrid}>
                <Pressable accessibilityRole="button" onPress={() => onNavigate('schedule')} style={(state) => [styles.quickButton, ...interactiveStateStyles(state, { kind: 'card' })]}>
                  <Text style={styles.quickIcon}>📅</Text>
                  <Text style={styles.quickTitle}>일정 추가</Text>
                  <Text style={styles.quickText}>오늘 목표를 시간표에 넣기</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => onNavigate('taskBoard')} style={(state) => [styles.quickButton, ...interactiveStateStyles(state, { kind: 'card' })]}>
                  <Text style={styles.quickIcon}>▦</Text>
                  <Text style={styles.quickTitle}>칸반 정리</Text>
                  <Text style={styles.quickText}>TODO에서 DONE까지 보기</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => onNavigate('statistics')} style={(state) => [styles.quickButton, ...interactiveStateStyles(state, { kind: 'card' })]}>
                  <Text style={styles.quickIcon}>▥</Text>
                  <Text style={styles.quickTitle}>통계 확인</Text>
                  <Text style={styles.quickText}>주간 집중 흐름 보기</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => onNavigate('friends')} style={(state) => [styles.quickButton, ...interactiveStateStyles(state, { kind: 'card' })]}>
                  <Text style={styles.quickIcon}>친</Text>
                  <Text style={styles.quickTitle}>친구 관리</Text>
                  <Text style={styles.quickText}>요청과 친구 목록 확인</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => onNavigate('community')} style={(state) => [styles.quickButton, ...interactiveStateStyles(state, { kind: 'card' })]}>
                  <Text style={styles.quickIcon}>💬</Text>
                  <Text style={styles.quickTitle}>커뮤니티</Text>
                  <Text style={styles.quickText}>질문과 자료를 확인하기</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => onNavigate('aiLearning')} style={(state) => [styles.quickButton, ...interactiveStateStyles(state, { kind: 'card' })]}>
                  <Text style={styles.quickIcon}>AI</Text>
                  <Text style={styles.quickTitle}>AI 질문</Text>
                  <Text style={styles.quickText}>막힌 개념을 짧게 물어보기</Text>
                </Pressable>
              </View>
            </SectionCard>

            <SectionCard title="계정 설정" subtitle="닉네임, 비밀번호, 탈퇴 여부를 필요한 항목만 열어서 관리합니다.">
              {accountMessage ? (
                <View style={styles.accountSuccess}>
                  <Text style={styles.accountSuccessText}>{accountMessage}</Text>
                </View>
              ) : null}
              {accountError ? (
                <View style={styles.accountError}>
                  <Text style={styles.accountErrorText}>{accountError}</Text>
                </View>
              ) : null}

              <View style={styles.accountOverview}>
                <View style={styles.accountOverviewItem}>
                  <Text style={styles.accountOverviewLabel}>현재 닉네임</Text>
                  <Text style={styles.accountOverviewValue}>{userName}</Text>
                </View>
                <View style={styles.accountOverviewItem}>
                  <Text style={styles.accountOverviewLabel}>로그인 아이디</Text>
                  <Text style={styles.accountOverviewValue}>{formatLoginId(user?.loginId)}</Text>
                </View>
                <View style={styles.accountOverviewItem}>
                  <Text style={styles.accountOverviewLabel}>계정 유형</Text>
                  <Text style={styles.accountOverviewValue}>{isAdmin ? '관리자' : '일반 학습자'}</Text>
                </View>
              </View>

              <View style={styles.accountTabRow}>
                {[
                  { key: 'nickname', label: '닉네임 변경' },
                  { key: 'password', label: '비밀번호 변경' },
                  { key: 'withdrawal', label: '회원 탈퇴' }
                ].map((item) => {
                  const active = accountSection === item.key;

                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      key={item.key}
                      onPress={() => setAccountSection(item.key)}
                      style={(state) => [
                        styles.accountTab,
                        active && styles.accountTabActive,
                        ...interactiveStateStyles(state)
                      ]}
                    >
                      <Text style={[styles.accountTabText, active && styles.accountTabTextActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {accountSection === 'nickname' ? (
                <View style={styles.accountPanel}>
                  <Text style={styles.formLabel}>닉네임</Text>
                  <Text style={styles.formHelper}>커뮤니티와 프로필에 표시되는 이름입니다. 저장할 때 사용할 수 있는 닉네임인지 확인합니다.</Text>
                  <View style={styles.inlineForm}>
                    <AccessibleTextInput
                      containerStyle={styles.inlineTextInputContainer}
                      onChangeText={setNameForm}
                      placeholder="닉네임을 입력하세요"
                      placeholderTextColor={colors.muted}
                      style={styles.textInput}
                      value={nameForm}
                    />
                    <Pressable
                      accessibilityRole="button"
                      disabled={savingName}
                      onPress={handleNameSubmit}
                      style={(state) => [
                        styles.formButton,
                        savingName && styles.disabledButton,
                        ...interactiveStateStyles(state, { disabled: savingName })
                      ]}
                    >
                      <Text style={styles.formButtonText}>{savingName ? '저장 중' : '저장'}</Text>
                    </Pressable>
                  </View>
                  <FieldFeedback {...getProfileNameFeedback(nameForm, user?.name)} />
                </View>
              ) : accountSection === 'password' ? (
                <View style={styles.accountPanel}>
                  <Text style={styles.formLabel}>비밀번호 변경</Text>
                  <Text style={styles.formHelper}>현재 비밀번호로 본인 확인을 한 뒤 새 비밀번호를 저장합니다. 비밀번호는 화면에 표시하지 않습니다.</Text>
                  <AccessibleTextInput
                    onChangeText={(value) => setPasswordForm((current) => ({ ...current, currentPassword: value }))}
                    placeholder="현재 비밀번호"
                    placeholderTextColor={colors.muted}
                    secureTextEntry
                    style={styles.textInput}
                    value={passwordForm.currentPassword}
                  />
                  <FieldFeedback {...getCurrentPasswordFeedback(passwordForm.currentPassword)} />
                  <AccessibleTextInput
                    onChangeText={(value) => setPasswordForm((current) => ({ ...current, newPassword: value }))}
                    placeholder="새 비밀번호"
                    placeholderTextColor={colors.muted}
                    secureTextEntry
                    style={styles.textInput}
                    value={passwordForm.newPassword}
                  />
                  <FieldFeedback {...getNewPasswordFeedback(passwordForm.newPassword)} />
                  <AccessibleTextInput
                    onChangeText={(value) => setPasswordForm((current) => ({ ...current, confirmPassword: value }))}
                    placeholder="새 비밀번호 확인"
                    placeholderTextColor={colors.muted}
                    secureTextEntry
                    style={styles.textInput}
                    value={passwordForm.confirmPassword}
                  />
                  <FieldFeedback {...getConfirmPasswordFeedback(passwordForm.newPassword, passwordForm.confirmPassword)} />
                  <Pressable
                    accessibilityRole="button"
                    disabled={changingPassword}
                    onPress={handlePasswordSubmit}
                    style={(state) => [
                      styles.passwordButton,
                      changingPassword && styles.disabledButton,
                      ...interactiveStateStyles(state, { disabled: changingPassword })
                    ]}
                  >
                    <Text style={styles.passwordButtonText}>{changingPassword ? '변경 중' : '비밀번호 변경'}</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={[styles.accountPanel, styles.withdrawalPanel]}>
                  <Text style={styles.formLabel}>회원 탈퇴</Text>
                  <Text style={styles.formHelper}>
                    탈퇴하면 계정 상태가 비활성화되고 즉시 로그아웃됩니다. 기존 게시글과 댓글은 서비스 흐름이 깨지지 않도록 유지되며, 로그인 아이디는 재사용할 수 없습니다.
                  </Text>
                  <View style={styles.withdrawalWarning}>
                    <Text style={styles.withdrawalWarningTitle}>탈퇴 전 확인</Text>
                    <Text style={styles.withdrawalWarningText}>현재 비밀번호와 확인 문구를 입력해야 탈퇴할 수 있습니다.</Text>
                    <Text style={styles.withdrawalWarningText}>확인 문구: {WITHDRAWAL_CONFIRMATION_TEXT}</Text>
                  </View>
                  <AccessibleTextInput
                    onChangeText={(value) => setWithdrawalForm((current) => ({ ...current, currentPassword: value }))}
                    placeholder="현재 비밀번호"
                    placeholderTextColor={colors.muted}
                    secureTextEntry
                    style={styles.textInput}
                    value={withdrawalForm.currentPassword}
                  />
                  <FieldFeedback {...getWithdrawalPasswordFeedback(withdrawalForm.currentPassword)} />
                  <AccessibleTextInput
                    onChangeText={(value) => setWithdrawalForm((current) => ({ ...current, confirmationText: value }))}
                    placeholder={WITHDRAWAL_CONFIRMATION_TEXT}
                    placeholderTextColor={colors.muted}
                    style={styles.textInput}
                    value={withdrawalForm.confirmationText}
                  />
                  <FieldFeedback {...getWithdrawalConfirmationFeedback(withdrawalForm.confirmationText)} />
                  <Pressable
                    accessibilityRole="button"
                    disabled={withdrawingAccount}
                    onPress={handleWithdrawalSubmit}
                    style={(state) => [
                      styles.withdrawalButton,
                      withdrawingAccount && styles.disabledButton,
                      ...interactiveStateStyles(state, { disabled: withdrawingAccount })
                    ]}
                  >
                    <Text style={styles.withdrawalButtonText}>{withdrawingAccount ? '탈퇴 처리 중' : '회원 탈퇴'}</Text>
                  </Pressable>
                </View>
              )}
            </SectionCard>
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
    gap: 22,
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
  identityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    marginTop: 4
  },
  identityChip: {
    borderRadius: 999,
    backgroundColor: colors.blueSoft,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  identityChipText: {
    color: colors.blueDeep,
    fontSize: 11,
    fontWeight: '900'
  },
  loginIdText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700'
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingHorizontal: 16,
    justifyContent: 'center',
    ...interactions.transition
  },
  errorButtonText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '900'
  },
  accountMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  accountMetaCard: {
    flex: 1,
    minWidth: 190,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 16,
    gap: 6
  },
  accountMetaLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800'
  },
  accountMetaValue: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900'
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14
  },
  metricCard: {
    flex: 1,
    minWidth: 180,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 18,
    gap: 8
  },
  metricCardMint: {
    borderColor: colors.mint,
    backgroundColor: colors.mintSoft
  },
  metricCardBlue: {
    borderColor: colors.blueSoft,
    backgroundColor: colors.blueSoft
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800'
  },
  metricValue: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900'
  },
  metricHelper: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '700'
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18
  },
  sectionCard: {
    flex: 1,
    minWidth: 320,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 22,
    gap: 18
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12
  },
  sectionTitleGroup: {
    flex: 1,
    gap: 6
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900'
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20
  },
  linkButton: {
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.surface,
    paddingHorizontal: 13,
    justifyContent: 'center',
    ...interactions.transition
  },
  linkButtonText: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '900'
  },
  summaryRows: {
    gap: 10
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: colors.surfaceWarm,
    padding: 14
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800'
  },
  summaryValue: {
    color: colors.blueDeep,
    fontSize: 15,
    fontWeight: '900'
  },
  listGroup: {
    gap: 10
  },
  listItem: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    ...interactions.transition
  },
  listTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900'
  },
  listMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4
  },
  priorityText: {
    color: colors.mintDeep,
    fontSize: 11,
    fontWeight: '900'
  },
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 18,
    gap: 10
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900'
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20
  },
  emptyAction: {
    alignSelf: 'flex-start',
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.blue,
    paddingHorizontal: 15,
    justifyContent: 'center',
    ...interactions.transition
  },
  emptyActionText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '900'
  },
  questList: {
    gap: 12
  },
  questCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 15,
    gap: 10
  },
  questCardReady: {
    borderColor: colors.mint,
    backgroundColor: colors.successSoft
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12
  },
  questTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900'
  },
  questReward: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '900'
  },
  progressTrack: {
    width: '100%',
    height: 9,
    borderRadius: 999,
    backgroundColor: colors.line,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.mintDeep
  },
  questMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700'
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: colors.cream,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  badgeIcon: {
    fontSize: 15
  },
  badgeText: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '900'
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  activityStatCard: {
    flex: 1,
    minWidth: 130,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 14,
    gap: 5
  },
  activityStatValue: {
    color: colors.blueDeep,
    fontSize: 22,
    fontWeight: '900'
  },
  activityStatLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800'
  },
  activityBasisText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18
  },
  bookmarkBlock: {
    gap: 12
  },
  subsectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900'
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  quickButton: {
    flex: 1,
    minWidth: 150,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 16,
    gap: 8,
    ...interactions.transition
  },
  quickIcon: {
    color: colors.mintDeep,
    fontSize: 18,
    fontWeight: '900'
  },
  quickTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900'
  },
  quickText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18
  },
  accountOverview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  accountOverviewItem: {
    flex: 1,
    minWidth: 150,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 14,
    gap: 6
  },
  accountOverviewLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900'
  },
  accountOverviewValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900'
  },
  accountTabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  accountTab: {
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    justifyContent: 'center',
    paddingHorizontal: 14,
    ...interactions.transition
  },
  accountTabActive: {
    borderColor: colors.mint,
    backgroundColor: colors.mintSoft
  },
  accountTabText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900'
  },
  accountTabTextActive: {
    color: colors.mintDeep
  },
  accountPanel: {
    gap: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 16
  },
  withdrawalPanel: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft
  },
  withdrawalWarning: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 6
  },
  withdrawalWarningTitle: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '900'
  },
  withdrawalWarningText: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 20
  },
  formGroup: {
    gap: 9
  },
  formLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900'
  },
  inlineForm: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  inlineTextInputContainer: {
    flex: 1,
    minWidth: 210
  },
  textInput: {
    flex: 1,
    minWidth: 210,
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    color: colors.ink,
    fontSize: 14,
    paddingHorizontal: 14
  },
  formButton: {
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.blue,
    paddingHorizontal: 18,
    justifyContent: 'center',
    ...interactions.transition
  },
  formButtonText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '900'
  },
  passwordBox: {
    gap: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 16
  },
  passwordButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.blue,
    paddingHorizontal: 18,
    justifyContent: 'center',
    ...interactions.transition
  },
  passwordButtonText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '900'
  },
  withdrawalButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.danger,
    paddingHorizontal: 18,
    justifyContent: 'center'
  },
  withdrawalButtonText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '900'
  },
  formHelper: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18
  },
  accountSuccess: {
    borderRadius: 15,
    backgroundColor: colors.successSoft,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  accountSuccessText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '800'
  },
  accountError: {
    borderRadius: 15,
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  accountErrorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '800'
  }
});
