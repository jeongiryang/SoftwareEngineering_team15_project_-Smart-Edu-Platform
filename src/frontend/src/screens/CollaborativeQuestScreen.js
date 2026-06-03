import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import {
  addCollaborativeQuestContribution,
  claimCollaborativeQuestReward,
  createCollaborativeQuest,
  getCollaborativeQuestDetail,
  getCollaborativeQuests,
  joinCollaborativeQuest,
  updateCollaborativeQuestVisibility
} from '../services/api';
import ConfirmModal from '../components/ConfirmModal';
import { ProfileAvatar, ProfileTitleChip } from '../components/ProfileAppearance';
import { languageIntlLocale, useLanguage } from '../i18n';
import { colors, interactiveStateStyles, radii, shadows } from '../styles/theme';

const COPY = {
  ko: {
    title: '협동 퀘스트',
    subtitle: '친구와 함께 목표 수치를 채우고 완료 후 보상을 나누어 받는 실시간 협동 학습 MVP입니다.',
    realtime: '실시간 진행률',
    createTitle: '새 협동 퀘스트 만들기',
    titleLabel: '퀘스트 제목',
    titlePlaceholder: '예: 100분 집중 릴레이',
    descriptionLabel: '설명',
    descriptionPlaceholder: '함께 달성할 학습 목표를 적어주세요.',
    goalLabel: '목표 수치',
    rewardLabel: '보상 포인트',
    createButton: '퀘스트 만들기',
    listTitle: '진행 중인 협동 퀘스트',
    refresh: '새로고침',
    join: '참여하기',
    joined: '참여 중',
    contribute: '기여도 추가',
    claim: '보상 받기',
    claimed: '보상 수령 완료',
    amountLabel: '기여 수치',
    memoLabel: '메모',
    memoPlaceholder: '예: 25분 집중 완료',
    participants: '참여자',
    recentContributions: '최근 기여',
    empty: '아직 협동 퀘스트가 없습니다. 첫 퀘스트를 만들어 팀 학습 흐름을 시작해 보세요.',
    loading: '협동 퀘스트를 불러오는 중입니다.',
    selectedEmpty: '퀘스트를 선택하면 진행률과 참여자 현황이 표시됩니다.',
    completed: '완료',
    active: '진행 중',
    expired: '종료',
    progressUpdated: '협동 퀘스트 진행률이 실시간으로 갱신되었습니다.',
    completedRealtime: '협동 퀘스트가 실시간으로 완료 처리되었습니다.',
    createSuccess: '협동 퀘스트를 만들었습니다.',
    joinSuccess: '협동 퀘스트에 참여했습니다.',
    contributeSuccess: '기여도가 반영되었습니다.',
    claimSuccess: '보상을 수령했습니다.',
    fallback: 'WebSocket 연결이 끊겨도 새로고침으로 최신 상태를 확인할 수 있습니다.',
    points: '{value}P',
    percent: '{value}%',
    goalStatus: '{current} / {goal}',
    participantCount: '{count}명 참여',
    contributionLine: '{name} · {amount}',
    noContributions: '아직 기록된 기여가 없습니다.'
  },
  en: {
    title: 'Collaborative Quests',
    subtitle: 'A realtime MVP where learners fill a shared goal together and claim rewards after completion.',
    realtime: 'Realtime progress',
    createTitle: 'Create a collaborative quest',
    titleLabel: 'Quest title',
    titlePlaceholder: 'Example: 100-minute focus relay',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'Describe the shared learning goal.',
    goalLabel: 'Goal value',
    rewardLabel: 'Reward points',
    createButton: 'Create quest',
    listTitle: 'Collaborative quests',
    refresh: 'Refresh',
    join: 'Join',
    joined: 'Joined',
    contribute: 'Add contribution',
    claim: 'Claim reward',
    claimed: 'Reward claimed',
    amountLabel: 'Contribution value',
    memoLabel: 'Memo',
    memoPlaceholder: 'Example: Completed 25 minutes of focus',
    participants: 'Participants',
    recentContributions: 'Recent contributions',
    empty: 'No collaborative quests yet. Create the first quest to start a shared study flow.',
    loading: 'Loading collaborative quests.',
    selectedEmpty: 'Select a quest to view progress and participants.',
    completed: 'Completed',
    active: 'Active',
    expired: 'Closed',
    progressUpdated: 'Collaborative quest progress was updated in realtime.',
    completedRealtime: 'Collaborative quest was completed in realtime.',
    createSuccess: 'Collaborative quest created.',
    joinSuccess: 'Joined the collaborative quest.',
    contributeSuccess: 'Contribution saved.',
    claimSuccess: 'Reward claimed.',
    fallback: 'If WebSocket disconnects, use refresh to check the latest state.',
    points: '{value} pts',
    percent: '{value}%',
    goalStatus: '{current} / {goal}',
    participantCount: '{count} participants',
    contributionLine: '{name} · {amount}',
    noContributions: 'No contributions recorded yet.'
  },
  ja: {
    title: '協同クエスト',
    subtitle: '仲間と一緒に目標値を満たし、完了後に報酬を受け取るリアルタイム協同学習MVPです。',
    realtime: 'リアルタイム進行率',
    createTitle: '新しい協同クエストを作成',
    titleLabel: 'クエスト名',
    titlePlaceholder: '例: 100分集中リレー',
    descriptionLabel: '説明',
    descriptionPlaceholder: '一緒に達成する学習目標を書いてください。',
    goalLabel: '目標値',
    rewardLabel: '報酬ポイント',
    createButton: 'クエスト作成',
    listTitle: '協同クエスト一覧',
    refresh: '更新',
    join: '参加',
    joined: '参加中',
    contribute: '貢献を追加',
    claim: '報酬を受け取る',
    claimed: '報酬受け取り済み',
    amountLabel: '貢献値',
    memoLabel: 'メモ',
    memoPlaceholder: '例: 25分集中完了',
    participants: '参加者',
    recentContributions: '最近の貢献',
    empty: 'まだ協同クエストがありません。最初のクエストを作成して共同学習を始めましょう。',
    loading: '協同クエストを読み込んでいます。',
    selectedEmpty: 'クエストを選択すると進行率と参加者が表示されます。',
    completed: '完了',
    active: '進行中',
    expired: '終了',
    progressUpdated: '協同クエストの進行率がリアルタイムで更新されました。',
    completedRealtime: '協同クエストがリアルタイムで完了しました。',
    createSuccess: '協同クエストを作成しました。',
    joinSuccess: '協同クエストに参加しました。',
    contributeSuccess: '貢献が反映されました。',
    claimSuccess: '報酬を受け取りました。',
    fallback: 'WebSocketが切れても、更新で最新状態を確認できます。',
    points: '{value} pt',
    percent: '{value}%',
    goalStatus: '{current} / {goal}',
    participantCount: '{count}人参加',
    contributionLine: '{name} · {amount}',
    noContributions: 'まだ貢献記録がありません。'
  },
  zh: {
    title: '协作任务',
    subtitle: '与伙伴一起完成共同目标，并在完成后领取奖励的实时协作学习 MVP。',
    realtime: '实时进度',
    createTitle: '创建协作任务',
    titleLabel: '任务标题',
    titlePlaceholder: '例如：100分钟专注接力',
    descriptionLabel: '说明',
    descriptionPlaceholder: '写下要一起完成的学习目标。',
    goalLabel: '目标值',
    rewardLabel: '奖励积分',
    createButton: '创建任务',
    listTitle: '协作任务列表',
    refresh: '刷新',
    join: '加入',
    joined: '已加入',
    contribute: '添加贡献',
    claim: '领取奖励',
    claimed: '已领取奖励',
    amountLabel: '贡献值',
    memoLabel: '备注',
    memoPlaceholder: '例如：完成25分钟专注',
    participants: '参与者',
    recentContributions: '最近贡献',
    empty: '还没有协作任务。创建第一个任务，开始共同学习。',
    loading: '正在加载协作任务。',
    selectedEmpty: '选择任务后会显示进度和参与者。',
    completed: '已完成',
    active: '进行中',
    expired: '已结束',
    progressUpdated: '协作任务进度已实时更新。',
    completedRealtime: '协作任务已实时完成。',
    createSuccess: '协作任务已创建。',
    joinSuccess: '已加入协作任务。',
    contributeSuccess: '贡献已保存。',
    claimSuccess: '奖励已领取。',
    fallback: 'WebSocket 断开时，也可以通过刷新查看最新状态。',
    points: '{value} 分',
    percent: '{value}%',
    goalStatus: '{current} / {goal}',
    participantCount: '{count}人参与',
    contributionLine: '{name} · {amount}',
    noContributions: '暂无贡献记录。'
  }
};

const CONTRIBUTION_PRESETS = [10, 25, 50];

const UI_LABELS = {
  ko: {
    autoReward: '추천 보상 적용',
    hideCompleted: '완료 숨기기',
    showArchived: '숨김·보관 포함',
    showJoinedOnly: '내 참여만 보기',
    filteredEmpty: '현재 조건에 맞는 협동 퀘스트가 없습니다.',
    minutesPreset: '{value}분',
    recommendedContribution: '추천 기여 {value}',
    rewardHint: '목표 수치 기준 추천 보상: {value}P',
    hideQuest: '내 목록에서 나가기',
    archiveQuest: '보관하기',
    restoreQuest: '목록으로 복원',
    hiddenBadge: '숨김',
    archivedBadge: '보관됨',
    hiddenSuccess: '내 목록에서 숨겼습니다.',
    archivedSuccess: '협동 퀘스트를 보관했습니다.',
    restoredSuccess: '협동 퀘스트를 목록으로 복원했습니다.',
    visibilityHint: '숨김/보관은 내 목록에만 적용되며 다른 참여자의 진행률과 보상에는 영향을 주지 않습니다.',
    activeHideHint: '진행 중 퀘스트는 삭제하지 않고 내 목록에서만 나갈 수 있습니다.',
    archiveHint: '완료 또는 종료된 퀘스트는 보관함으로 옮길 수 있습니다.',
    cancelAction: '취소',
    confirmHideAction: '나가기',
    confirmArchiveAction: '보관하기',
    confirmRestoreAction: '복원하기',
    hideConfirmTitle: '협동 퀘스트를 내 목록에서 숨길까요?',
    hideConfirmDescription: '진행 중 퀘스트는 삭제하지 않고 내 목록에서만 숨깁니다. 이미 쌓은 기여도와 보상 기록은 유지됩니다.',
    archiveConfirmTitle: '완료된 협동 퀘스트를 보관할까요?',
    archiveConfirmDescription: '보관은 내 목록에만 적용되며 진행률, 기여도, 보상 수령 기록은 유지됩니다.',
    restoreConfirmTitle: '협동 퀘스트를 목록으로 복원할까요?',
    restoreConfirmDescription: '숨김 또는 보관 상태를 해제하고 다시 내 목록에 표시합니다.'
  },
  en: {
    autoReward: 'Use suggested reward',
    hideCompleted: 'Hide completed',
    showArchived: 'Include hidden/archive',
    showJoinedOnly: 'My quests only',
    filteredEmpty: 'No collaborative quests match the current filters.',
    minutesPreset: '{value} min',
    recommendedContribution: 'Suggested contribution {value}',
    rewardHint: 'Suggested reward from goal: {value} pts',
    hideQuest: 'Leave my list',
    archiveQuest: 'Archive',
    restoreQuest: 'Restore to list',
    hiddenBadge: 'Hidden',
    archivedBadge: 'Archived',
    hiddenSuccess: 'Hidden from your list.',
    archivedSuccess: 'Collaborative quest archived.',
    restoredSuccess: 'Collaborative quest restored to your list.',
    visibilityHint: 'Hide/archive only affects your list and does not affect other participants, progress, or rewards.',
    activeHideHint: 'Active quests are not deleted; they only leave your list.',
    archiveHint: 'Completed or closed quests can be moved to the archive.',
    cancelAction: 'Cancel',
    confirmHideAction: 'Leave',
    confirmArchiveAction: 'Archive',
    confirmRestoreAction: 'Restore',
    hideConfirmTitle: 'Hide this collaborative quest from your list?',
    hideConfirmDescription: 'The active quest is not deleted. It only leaves your list, while your contribution and reward records stay intact.',
    archiveConfirmTitle: 'Archive this completed collaborative quest?',
    archiveConfirmDescription: 'Archiving only affects your list. Progress, contributions, and reward claim records are preserved.',
    restoreConfirmTitle: 'Restore this collaborative quest to your list?',
    restoreConfirmDescription: 'Hidden or archived status will be cleared so it appears in your list again.'
  },
  ja: {
    autoReward: 'おすすめ報酬を適用',
    hideCompleted: '完了を隠す',
    showArchived: '非表示・保管を含める',
    showJoinedOnly: '参加中のみ',
    filteredEmpty: '条件に合う協同クエストがありません。',
    minutesPreset: '{value}分',
    recommendedContribution: 'おすすめ貢献 {value}',
    rewardHint: '目標基準のおすすめ報酬: {value} pt',
    hideQuest: '自分の一覧から退出',
    archiveQuest: '保管する',
    restoreQuest: '一覧に戻す',
    hiddenBadge: '非表示',
    archivedBadge: '保管済み',
    hiddenSuccess: '自分の一覧から隠しました。',
    archivedSuccess: '協同クエストを保管しました。',
    restoredSuccess: '協同クエストを一覧に戻しました。',
    visibilityHint: '非表示・保管は自分の一覧にだけ適用され、他の参加者の進行率や報酬には影響しません。',
    activeHideHint: '進行中のクエストは削除せず、自分の一覧からのみ退出できます。',
    archiveHint: '完了または終了したクエストは保管できます。',
    cancelAction: 'キャンセル',
    confirmHideAction: '退出',
    confirmArchiveAction: '保管する',
    confirmRestoreAction: '復元する',
    hideConfirmTitle: 'この協同クエストを自分の一覧から隠しますか？',
    hideConfirmDescription: '進行中のクエストは削除されません。自分の一覧からだけ外れ、貢献度と報酬記録は保持されます。',
    archiveConfirmTitle: '完了した協同クエストを保管しますか？',
    archiveConfirmDescription: '保管は自分の一覧にだけ適用され、進行率、貢献度、報酬受け取り記録は保持されます。',
    restoreConfirmTitle: '協同クエストを一覧に戻しますか？',
    restoreConfirmDescription: '非表示または保管状態を解除し、自分の一覧に再表示します。'
  },
  zh: {
    autoReward: '使用推荐奖励',
    hideCompleted: '隐藏已完成',
    showArchived: '包含隐藏/归档',
    showJoinedOnly: '仅看已参加',
    filteredEmpty: '没有符合当前筛选的协作任务。',
    minutesPreset: '{value}分钟',
    recommendedContribution: '推荐贡献 {value}',
    rewardHint: '按目标推荐奖励：{value} 点',
    hideQuest: '从我的列表退出',
    archiveQuest: '归档',
    restoreQuest: '恢复到列表',
    hiddenBadge: '已隐藏',
    archivedBadge: '已归档',
    hiddenSuccess: '已从你的列表隐藏。',
    archivedSuccess: '协作任务已归档。',
    restoredSuccess: '协作任务已恢复到列表。',
    visibilityHint: '隐藏/归档只影响你的列表，不影响其他参与者、进度或奖励。',
    activeHideHint: '进行中的任务不会删除，只会从你的列表退出。',
    archiveHint: '已完成或已结束的任务可以移入归档。',
    cancelAction: '取消',
    confirmHideAction: '退出',
    confirmArchiveAction: '归档',
    confirmRestoreAction: '恢复',
    hideConfirmTitle: '要从你的列表隐藏这个协作任务吗？',
    hideConfirmDescription: '进行中的任务不会被删除，只会从你的列表移除；已有贡献和奖励记录会保留。',
    archiveConfirmTitle: '要归档这个已完成的协作任务吗？',
    archiveConfirmDescription: '归档只影响你的列表，进度、贡献和奖励领取记录会保留。',
    restoreConfirmTitle: '要将这个协作任务恢复到列表吗？',
    restoreConfirmDescription: '将取消隐藏或归档状态，并重新显示在你的列表中。'
  }
};

function interpolate(template, values) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template
  );
}

function formatNumber(value, locale = 'ko-KR') {
  return Intl.NumberFormat(locale).format(Number(value) || 0);
}

function getSuggestedRewardPoints(goalValue) {
  const parsedGoal = Number(goalValue) || 0;

  return Math.min(Math.max(Math.ceil(parsedGoal * 0.3), 10), 100000);
}

function statusLabel(status, copy) {
  if (status === 'COMPLETED') {
    return copy('completed');
  }

  if (status === 'EXPIRED') {
    return copy('expired');
  }

  return copy('active');
}

export default function CollaborativeQuestScreen({ realtimeEvent, token }) {
  const { currentLanguage, translateText } = useLanguage();
  const locale = languageIntlLocale(currentLanguage);
  const dictionary = COPY[currentLanguage] || COPY.ko;
  const copy = (key, values = {}) => interpolate(dictionary[key] || COPY.ko[key] || key, values);
  const uiText = (key, values = {}) => interpolate(
    UI_LABELS[currentLanguage]?.[key] || UI_LABELS.ko[key] || key,
    values
  );
  const [quests, setQuests] = useState([]);
  const [selectedQuestId, setSelectedQuestId] = useState(null);
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    goalValue: '100',
    rewardPoints: '30'
  });
  const [contribution, setContribution] = useState({
    amount: '10',
    memo: ''
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [realtimeMessage, setRealtimeMessage] = useState('');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [showJoinedOnly, setShowJoinedOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [pendingVisibilityAction, setPendingVisibilityAction] = useState(null);

  const selectedSummary = useMemo(
    () => quests.find((quest) => quest.id === selectedQuestId) || quests[0] || null,
    [quests, selectedQuestId]
  );
  const visibleQuests = useMemo(
    () => quests.filter((quest) => {
      if (hideCompleted && quest.status === 'COMPLETED') {
        return false;
      }

      if (!showArchived && (quest.currentUserHidden || quest.currentUserArchived)) {
        return false;
      }

      if (showJoinedOnly && !quest.hasJoined) {
        return false;
      }

      return true;
    }),
    [hideCompleted, quests, showArchived, showJoinedOnly]
  );
  const suggestedRewardPoints = getSuggestedRewardPoints(form.goalValue);

  async function loadQuests(preferredQuestId = selectedQuestId, includeHidden = showArchived) {
    setLoading(true);
    setError('');

    try {
      const response = await getCollaborativeQuests(token, { includeHidden });
      const nextQuests = response.quests || [];
      setQuests(nextQuests);

      if (!nextQuests.length) {
        setSelectedQuestId(null);
        setSelectedQuest(null);
        return;
      }

      const stillExists = nextQuests.some((quest) => quest.id === preferredQuestId);
      setSelectedQuestId(stillExists ? preferredQuestId : nextQuests[0].id);
    } catch (loadError) {
      setError(loadError.message || 'Collaborative quest load failed');
    } finally {
      setLoading(false);
    }
  }

  async function toggleArchivedView() {
    const nextValue = !showArchived;
    setShowArchived(nextValue);
    await loadQuests(selectedQuestId, nextValue);
  }

  useEffect(() => {
    loadQuests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    let active = true;

    async function loadDetail() {
      if (!selectedQuestId) {
        setSelectedQuest(null);
        return;
      }

      try {
        const response = await getCollaborativeQuestDetail(token, selectedQuestId);

        if (active) {
          setSelectedQuest(response.quest);
        }
      } catch (detailError) {
        if (active) {
          setError(detailError.message || 'Collaborative quest detail load failed');
        }
      }
    }

    loadDetail();

    return () => {
      active = false;
    };
  }, [selectedQuestId, token]);

  useEffect(() => {
    if (!realtimeEvent?.type?.startsWith('collabQuest.')) {
      return;
    }

    const realtimeQuest = realtimeEvent.payload?.quest;

    if (!realtimeQuest?.id) {
      return;
    }

    setQuests((currentQuests) => {
      const exists = currentQuests.some((quest) => quest.id === realtimeQuest.id);

      if (!exists) {
        return [realtimeQuest, ...currentQuests];
      }

      return currentQuests.map((quest) => (
        quest.id === realtimeQuest.id ? { ...quest, ...realtimeQuest } : quest
      ));
    });

    if (selectedQuestId === realtimeQuest.id) {
      setSelectedQuest((currentQuest) => ({ ...(currentQuest || {}), ...realtimeQuest }));
      setRealtimeMessage(
        realtimeEvent.type === 'collabQuest.completed'
          ? copy('completedRealtime')
          : copy('progressUpdated')
      );
    }
  }, [copy, realtimeEvent, selectedQuestId]);

  async function reloadSelectedQuest(questId = selectedQuestId) {
    await loadQuests(questId);

    if (questId) {
      const response = await getCollaborativeQuestDetail(token, questId);
      setSelectedQuest(response.quest);
    }
  }

  async function handleCreateQuest() {
    setActionLoading(true);
    setError('');
    setMessage('');

    try {
      const rewardPoints = form.rewardPoints === '' ? undefined : Number(form.rewardPoints);
      const response = await createCollaborativeQuest(token, {
        title: form.title,
        description: form.description,
        goalValue: Number(form.goalValue),
        ...(rewardPoints === undefined ? {} : { rewardPoints })
      });
      const quest = response.quest;
      setQuests((currentQuests) => [quest, ...currentQuests.filter((item) => item.id !== quest.id)]);
      setSelectedQuestId(quest.id);
      setSelectedQuest(quest);
      setForm({
        title: '',
        description: '',
        goalValue: '100',
        rewardPoints: '30'
      });
      setMessage(copy('createSuccess'));
    } catch (createError) {
      setError(createError.message || 'Collaborative quest create failed');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleJoinQuest(questId) {
    setActionLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await joinCollaborativeQuest(token, questId);
      setSelectedQuestId(response.quest.id);
      setSelectedQuest(response.quest);
      await loadQuests(response.quest.id);
      setMessage(copy('joinSuccess'));
    } catch (joinError) {
      setError(joinError.message || 'Collaborative quest join failed');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAddContribution() {
    if (!selectedQuestId) {
      return;
    }

    setActionLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await addCollaborativeQuestContribution(token, selectedQuestId, {
        amount: Number(contribution.amount),
        memo: contribution.memo
      });
      setSelectedQuest(response.quest);
      await loadQuests(response.quest.id);
      setContribution({
        amount: '10',
        memo: ''
      });
      setMessage(copy('contributeSuccess'));
    } catch (contributionError) {
      setError(contributionError.message || 'Collaborative quest contribution failed');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleClaimReward() {
    if (!selectedQuestId) {
      return;
    }

    setActionLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await claimCollaborativeQuestReward(token, selectedQuestId);
      setSelectedQuest(response.reward.quest);
      await loadQuests(response.reward.quest.id);
      setMessage(copy('claimSuccess'));
    } catch (claimError) {
      setError(claimError.message || 'Collaborative quest reward claim failed');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleVisibilityAction(questId, action) {
    setActionLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await updateCollaborativeQuestVisibility(token, questId, action);
      const nextQuest = response.quest;
      const keepSelected = action === 'RESTORE' || showArchived;
      setSelectedQuest(keepSelected ? nextQuest : null);
      await loadQuests(keepSelected ? nextQuest.id : null, showArchived);
      setMessage(
        action === 'ARCHIVE'
          ? uiText('archivedSuccess')
          : action === 'HIDE'
            ? uiText('hiddenSuccess')
            : uiText('restoredSuccess')
      );
    } catch (visibilityError) {
      setError(visibilityError.message || 'Collaborative quest visibility update failed');
    } finally {
      setActionLoading(false);
    }
  }

  function openVisibilityConfirm(quest, action) {
    setPendingVisibilityAction({
      action,
      questId: quest.id
    });
  }

  function closeVisibilityConfirm() {
    setPendingVisibilityAction(null);
  }

  function getVisibilityConfirmCopy(action) {
    if (action === 'ARCHIVE') {
      return {
        title: uiText('archiveConfirmTitle'),
        description: uiText('archiveConfirmDescription'),
        confirmLabel: uiText('confirmArchiveAction'),
        destructive: true
      };
    }

    if (action === 'RESTORE') {
      return {
        title: uiText('restoreConfirmTitle'),
        description: uiText('restoreConfirmDescription'),
        confirmLabel: uiText('confirmRestoreAction'),
        destructive: false
      };
    }

    return {
      title: uiText('hideConfirmTitle'),
      description: uiText('hideConfirmDescription'),
      confirmLabel: uiText('confirmHideAction'),
      destructive: true
    };
  }

  async function handleConfirmVisibilityAction() {
    if (!pendingVisibilityAction) {
      return;
    }

    const { action, questId } = pendingVisibilityAction;
    setPendingVisibilityAction(null);
    await handleVisibilityAction(questId, action);
  }

  const displayQuest = selectedQuest || selectedSummary;
  const progressPercent = Math.round(Number(displayQuest?.progressPercent || 0));
  const visibilityConfirmCopy = pendingVisibilityAction
    ? getVisibilityConfirmCopy(pendingVisibilityAction.action)
    : null;

  return (
    <>
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.hero}>
        <View>
          <Text style={styles.kicker}>{copy('realtime')}</Text>
          <Text style={styles.title}>{copy('title')}</Text>
          <Text style={styles.subtitle}>{copy('subtitle')}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => loadQuests()}
          style={(state) => [styles.secondaryButton, ...interactiveStateStyles(state)]}
        >
          <Text style={styles.secondaryButtonText}>{copy('refresh')}</Text>
        </Pressable>
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}
      {realtimeMessage ? <Text style={styles.realtimeMessage}>{realtimeMessage}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.layout}>
        <View style={styles.leftColumn}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{copy('createTitle')}</Text>
            <View style={styles.formGrid}>
              <LabeledInput
                label={copy('titleLabel')}
                onChangeText={(value) => setForm((current) => ({ ...current, title: value }))}
                placeholder={copy('titlePlaceholder')}
                value={form.title}
              />
              <LabeledInput
                label={copy('descriptionLabel')}
                multiline
                onChangeText={(value) => setForm((current) => ({ ...current, description: value }))}
                placeholder={copy('descriptionPlaceholder')}
                value={form.description}
              />
              <LabeledInput
                keyboardType="numeric"
                label={copy('goalLabel')}
                onChangeText={(value) => setForm((current) => ({ ...current, goalValue: value }))}
                value={form.goalValue}
              />
              <LabeledInput
                keyboardType="numeric"
                label={copy('rewardLabel')}
                onChangeText={(value) => setForm((current) => ({ ...current, rewardPoints: value }))}
                value={form.rewardPoints}
              />
              <View style={styles.inlineHintRow}>
                <Text style={styles.muted}>
                  {uiText('rewardHint', { value: formatNumber(suggestedRewardPoints, locale) })}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setForm((current) => ({
                    ...current,
                    rewardPoints: String(suggestedRewardPoints)
                  }))}
                  style={(state) => [styles.inlineButton, ...interactiveStateStyles(state)]}
                >
                  <Text style={styles.inlineButtonText}>{uiText('autoReward')}</Text>
                </Pressable>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={actionLoading}
              onPress={handleCreateQuest}
              style={(state) => [
                styles.primaryButton,
                actionLoading && styles.disabledButton,
                ...interactiveStateStyles(state, { disabled: actionLoading })
              ]}
            >
              <Text style={styles.primaryButtonText}>{copy('createButton')}</Text>
            </Pressable>
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{copy('listTitle')}</Text>
            {loading ? <Text style={styles.muted}>{copy('loading')}</Text> : null}
            {!loading && quests.length === 0 ? <Text style={styles.muted}>{copy('empty')}</Text> : null}
            <View style={styles.filterRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setHideCompleted((current) => !current)}
                style={(state) => [
                  styles.filterChip,
                  hideCompleted && styles.filterChipActive,
                  ...interactiveStateStyles(state)
                ]}
              >
                <Text style={[styles.filterChipText, hideCompleted && styles.filterChipTextActive]}>
                  {uiText('hideCompleted')}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowJoinedOnly((current) => !current)}
                style={(state) => [
                  styles.filterChip,
                  showJoinedOnly && styles.filterChipActive,
                  ...interactiveStateStyles(state)
                ]}
              >
                <Text style={[styles.filterChipText, showJoinedOnly && styles.filterChipTextActive]}>
                  {uiText('showJoinedOnly')}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={toggleArchivedView}
                style={(state) => [
                  styles.filterChip,
                  showArchived && styles.filterChipActive,
                  ...interactiveStateStyles(state)
                ]}
              >
                <Text style={[styles.filterChipText, showArchived && styles.filterChipTextActive]}>
                  {uiText('showArchived')}
                </Text>
              </Pressable>
            </View>
            {!loading && quests.length > 0 && visibleQuests.length === 0 ? (
              <Text style={styles.muted}>{uiText('filteredEmpty')}</Text>
            ) : null}
            <View style={styles.questList}>
              {visibleQuests.map((quest) => {
                const active = quest.id === selectedQuestId;
                const rate = Math.round(Number(quest.progressPercent || 0));

                return (
                  <Pressable
                    accessibilityRole="button"
                    key={quest.id}
                    onPress={() => setSelectedQuestId(quest.id)}
                    style={(state) => [
                      styles.questCard,
                      active && styles.questCardActive,
                      ...interactiveStateStyles(state, { kind: 'card' })
                    ]}
                  >
                    <View style={styles.questCardHeader}>
                      <Text style={styles.questCardTitle} numberOfLines={2} ellipsizeMode="tail">{quest.title}</Text>
                      <View style={styles.statusStack}>
                        {quest.currentUserArchived ? (
                          <StatusChip label={uiText('archivedBadge')} status="EXPIRED" />
                        ) : quest.currentUserHidden ? (
                          <StatusChip label={uiText('hiddenBadge')} status="EXPIRED" />
                        ) : null}
                        <StatusChip label={statusLabel(quest.status, copy)} status={quest.status} />
                      </View>
                    </View>
                    <Text style={styles.questCardMeta}>
                      {copy('goalStatus', {
                        current: formatNumber(quest.currentValue, locale),
                        goal: formatNumber(quest.goalValue, locale)
                      })}
                    </Text>
                    <ProgressBar percent={rate} />
                    <View style={styles.cardActions}>
                      <Text style={styles.questCardMeta}>
                        {copy('participantCount', { count: formatNumber(quest.participantCount, locale) })}
                      </Text>
                      <Text style={styles.questCardMeta}>
                        {copy('points', { value: formatNumber(quest.rewardPoints, locale) })}
                      </Text>
                    </View>
                    {!quest.hasJoined && quest.canJoin ? (
                      <Pressable
                        accessibilityRole="button"
                        disabled={actionLoading}
                        onPress={() => handleJoinQuest(quest.id)}
                        style={(state) => [
                          styles.inlineButton,
                          actionLoading && styles.disabledButton,
                          ...interactiveStateStyles(state, { disabled: actionLoading })
                        ]}
                      >
                        <Text style={styles.inlineButtonText}>{copy('join')}</Text>
                      </Pressable>
                    ) : (
                      <Text style={styles.joinedText}>{quest.hasJoined ? copy('joined') : statusLabel(quest.status, copy)}</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.detailPanel}>
          {displayQuest ? (
            <>
              <View style={styles.detailHeader}>
                <View>
                  <Text style={styles.detailTitle} numberOfLines={2} ellipsizeMode="tail">{displayQuest.title}</Text>
                  <Text style={styles.detailDescription} numberOfLines={3} ellipsizeMode="tail">{displayQuest.description}</Text>
                </View>
                <StatusChip label={statusLabel(displayQuest.status, copy)} status={displayQuest.status} />
              </View>
              {displayQuest.hasJoined ? (
                <View style={styles.visibilityPanel}>
                  <Text style={styles.muted}>{uiText('visibilityHint')}</Text>
                  <Text style={styles.muted}>
                    {displayQuest.status === 'COMPLETED' || displayQuest.status === 'EXPIRED'
                      ? uiText('archiveHint')
                      : uiText('activeHideHint')}
                  </Text>
                  <View style={styles.visibilityActions}>
                    {displayQuest.currentUserArchived || displayQuest.currentUserHidden ? (
                      <Pressable
                        accessibilityRole="button"
                        disabled={actionLoading}
                        onPress={() => openVisibilityConfirm(displayQuest, 'RESTORE')}
                        style={(state) => [
                          styles.secondaryButton,
                          actionLoading && styles.disabledButton,
                          ...interactiveStateStyles(state, { disabled: actionLoading })
                        ]}
                      >
                        <Text style={styles.secondaryButtonText}>{uiText('restoreQuest')}</Text>
                      </Pressable>
                    ) : displayQuest.status === 'COMPLETED' || displayQuest.status === 'EXPIRED' ? (
                      <Pressable
                        accessibilityRole="button"
                        disabled={actionLoading}
                        onPress={() => openVisibilityConfirm(displayQuest, 'ARCHIVE')}
                        style={(state) => [
                          styles.secondaryButton,
                          actionLoading && styles.disabledButton,
                          ...interactiveStateStyles(state, { disabled: actionLoading })
                        ]}
                      >
                        <Text style={styles.secondaryButtonText}>{uiText('archiveQuest')}</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        accessibilityRole="button"
                        disabled={actionLoading}
                        onPress={() => openVisibilityConfirm(displayQuest, 'HIDE')}
                        style={(state) => [
                          styles.secondaryButton,
                          actionLoading && styles.disabledButton,
                          ...interactiveStateStyles(state, { disabled: actionLoading })
                        ]}
                      >
                        <Text style={styles.secondaryButtonText}>{uiText('hideQuest')}</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              ) : null}
              <View style={styles.progressHero}>
                <Text style={styles.progressValue}>{copy('percent', { value: progressPercent })}</Text>
                <Text style={styles.progressCaption}>
                  {copy('goalStatus', {
                    current: formatNumber(displayQuest.currentValue, locale),
                    goal: formatNumber(displayQuest.goalValue, locale)
                  })}
                </Text>
                <ProgressBar percent={progressPercent} large />
                <Text style={styles.muted}>{copy('fallback')}</Text>
              </View>

              <View style={styles.actionPanel}>
                {displayQuest.canContribute ? (
                  <>
                    <View style={styles.presetRow}>
                      <Text style={styles.muted}>
                        {uiText('recommendedContribution', {
                          value: formatNumber(displayQuest.recommendedContributionAmount || 10, locale)
                        })}
                      </Text>
                      {CONTRIBUTION_PRESETS.map((preset) => (
                        <Pressable
                          accessibilityRole="button"
                          key={preset}
                          onPress={() => setContribution((current) => ({
                            ...current,
                            amount: String(preset),
                            memo: uiText('minutesPreset', { value: preset })
                          }))}
                          style={(state) => [styles.filterChip, ...interactiveStateStyles(state)]}
                        >
                          <Text style={styles.filterChipText}>
                            {uiText('minutesPreset', { value: preset })}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <LabeledInput
                      keyboardType="numeric"
                      label={copy('amountLabel')}
                      onChangeText={(value) => setContribution((current) => ({ ...current, amount: value }))}
                      value={contribution.amount}
                    />
                    <LabeledInput
                      label={copy('memoLabel')}
                      onChangeText={(value) => setContribution((current) => ({ ...current, memo: value }))}
                      placeholder={copy('memoPlaceholder')}
                      value={contribution.memo}
                    />
                    <Pressable
                      accessibilityRole="button"
                      disabled={actionLoading}
                      onPress={handleAddContribution}
                      style={(state) => [
                        styles.primaryButton,
                        actionLoading && styles.disabledButton,
                        ...interactiveStateStyles(state, { disabled: actionLoading })
                      ]}
                    >
                      <Text style={styles.primaryButtonText}>{copy('contribute')}</Text>
                    </Pressable>
                  </>
                ) : displayQuest.canJoin ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={actionLoading}
                    onPress={() => handleJoinQuest(displayQuest.id)}
                    style={(state) => [
                      styles.primaryButton,
                      actionLoading && styles.disabledButton,
                      ...interactiveStateStyles(state, { disabled: actionLoading })
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>{copy('join')}</Text>
                  </Pressable>
                ) : null}

                {displayQuest.canClaim ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={actionLoading}
                    onPress={handleClaimReward}
                    style={(state) => [
                      styles.rewardButton,
                      actionLoading && styles.disabledButton,
                      ...interactiveStateStyles(state, { disabled: actionLoading })
                    ]}
                  >
                    <Text style={styles.rewardButtonText}>{copy('claim')}</Text>
                  </Pressable>
                ) : displayQuest.hasClaimed ? (
                  <Text style={styles.claimedText}>{copy('claimed')}</Text>
                ) : null}
              </View>

              <View style={styles.detailGrid}>
                <View style={styles.subPanel}>
                  <Text style={styles.subPanelTitle}>{copy('participants')}</Text>
                  {(displayQuest.participants || []).map((participant) => (
                    <View key={`${displayQuest.id}-${participant.userId}`} style={styles.listRow}>
                      <ProfileAvatar appearance={participant.appearance} name={participant.name || participant.loginId} size="sm" />
                      <View style={styles.rowCopy}>
                        <Text style={styles.rowName} numberOfLines={1} ellipsizeMode="tail">{participant.name || participant.loginId}</Text>
                        {participant.appearance?.titleText ? (
                          <ProfileTitleChip animated title={participant.appearance.titleText} translateText={translateText} />
                        ) : null}
                      </View>
                      <Text style={styles.rowMeta}>
                        {formatNumber(participant.contributionValue, locale)}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={styles.subPanel}>
                  <Text style={styles.subPanelTitle}>{copy('recentContributions')}</Text>
                  {(displayQuest.recentContributions || []).length ? (
                    displayQuest.recentContributions.map((item) => (
                      <View key={item.id || `${item.userId}-${item.createdAt}`} style={styles.listRow}>
                        <ProfileAvatar appearance={item.appearance} name={item.name || item.loginId} size="sm" />
                        <View style={styles.rowCopy}>
                          <Text style={styles.rowName} numberOfLines={2} ellipsizeMode="tail">
                            {copy('contributionLine', {
                              name: item.name || item.loginId,
                              amount: formatNumber(item.amount, locale)
                            })}
                          </Text>
                        </View>
                        <Text style={styles.rowMeta} numberOfLines={2} ellipsizeMode="tail">{item.memo}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.muted}>{copy('noContributions')}</Text>
                  )}
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => reloadSelectedQuest(displayQuest.id)}
                style={(state) => [styles.secondaryButton, ...interactiveStateStyles(state)]}
              >
                <Text style={styles.secondaryButtonText}>{copy('refresh')}</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.muted}>{copy('selectedEmpty')}</Text>
          )}
        </View>
      </View>
    </ScrollView>
    <ConfirmModal
      cancelLabel={uiText('cancelAction')}
      confirmDisabled={actionLoading}
      confirmLabel={visibilityConfirmCopy?.confirmLabel}
      description={visibilityConfirmCopy?.description}
      destructive={visibilityConfirmCopy?.destructive}
      onCancel={closeVisibilityConfirm}
      onConfirm={handleConfirmVisibilityAction}
      title={visibilityConfirmCopy?.title}
      visible={Boolean(pendingVisibilityAction)}
    />
    </>
  );
}

function LabeledInput({ label, multiline = false, ...props }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={colors.muted}
        style={[styles.input, multiline && styles.multilineInput]}
      />
    </View>
  );
}

function ProgressBar({ percent, large = false }) {
  const width = `${Math.min(Math.max(Number(percent) || 0, 0), 100)}%`;

  return (
    <View style={[styles.progressTrack, large && styles.progressTrackLarge]}>
      <View style={[styles.progressFill, { width }]} />
    </View>
  );
}

function StatusChip({ label, status }) {
  return (
    <View style={[
      styles.statusChip,
      status === 'COMPLETED' && styles.statusCompleted,
      status === 'EXPIRED' && styles.statusExpired
    ]}
    >
      <Text style={styles.statusChipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    padding: 16,
    gap: 18
  },
  hero: {
    borderRadius: radii.panel,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 24,
    gap: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.card
  },
  kicker: {
    color: colors.mintDeep,
    fontSize: 13,
    fontWeight: '900'
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 5
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 23,
    maxWidth: 720,
    marginTop: 8
  },
  layout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 18,
    flexWrap: 'wrap'
  },
  leftColumn: {
    flex: 1,
    minWidth: 260,
    gap: 18
  },
  panel: {
    borderRadius: radii.panel,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 18,
    gap: 14,
    ...shadows.card
  },
  detailPanel: {
    flex: 1.05,
    minWidth: 260,
    borderRadius: radii.panel,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 20,
    gap: 16,
    ...shadows.card
  },
  panelTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '900'
  },
  formGrid: {
    gap: 12
  },
  inlineHintRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between'
  },
  inputGroup: {
    gap: 6
  },
  inputLabel: {
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '800'
  },
  input: {
    minHeight: 44,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    color: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600'
  },
  multilineInput: {
    minHeight: 72,
    textAlignVertical: 'top'
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '900'
  },
  secondaryButton: {
    minHeight: 42,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14
  },
  secondaryButtonText: {
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '900'
  },
  inlineButton: {
    minHeight: 38,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.mint,
    backgroundColor: colors.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12
  },
  inlineButtonText: {
    color: colors.mintDeep,
    fontSize: 13,
    fontWeight: '900'
  },
  rewardButton: {
    minHeight: 44,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14
  },
  rewardButtonText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '900'
  },
  disabledButton: {
    opacity: 0.62
  },
  questList: {
    gap: 12
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center'
  },
  filterChip: {
    minHeight: 34,
    borderRadius: radii.chip,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 11
  },
  filterChipActive: {
    borderColor: colors.mintDeep,
    backgroundColor: colors.mintSoft
  },
  filterChipText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800'
  },
  filterChipTextActive: {
    color: colors.mintDeep
  },
  statusStack: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-end'
  },
  visibilityPanel: {
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 8
  },
  visibilityActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  questCard: {
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 10
  },
  questCardActive: {
    borderColor: colors.mint,
    backgroundColor: colors.mintSoft
  },
  questCardHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  questCardTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
    flexShrink: 1,
    minWidth: 0,
    lineHeight: 21
  },
  questCardMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
    minWidth: 0
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  detailHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12
  },
  detailTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28
  },
  detailDescription: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
    marginTop: 6
  },
  progressHero: {
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 18,
    gap: 10
  },
  progressValue: {
    color: colors.blueDeep,
    fontSize: 34,
    fontWeight: '900'
  },
  progressCaption: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800'
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.line,
    overflow: 'hidden'
  },
  progressTrackLarge: {
    height: 14
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.mintDeep
  },
  actionPanel: {
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 12
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  subPanel: {
    flex: 1,
    minWidth: 220,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 10
  },
  subPanelTitle: {
    color: colors.blueDeep,
    fontSize: 15,
    fontWeight: '900'
  },
  listRow: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    flexDirection: 'row',
    paddingTop: 8,
    gap: 8
  },
  rowCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0
  },
  rowName: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
    minWidth: 0,
    flexShrink: 1
  },
  rowMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
    maxWidth: '38%'
  },
  statusChip: {
    minHeight: 26,
    borderRadius: radii.chip,
    borderWidth: 1,
    borderColor: colors.mint,
    backgroundColor: colors.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10
  },
  statusCompleted: {
    borderColor: colors.success,
    backgroundColor: colors.successSoft
  },
  statusExpired: {
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm
  },
  statusChipText: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '900'
  },
  joinedText: {
    color: colors.mintDeep,
    fontSize: 12,
    fontWeight: '900'
  },
  claimedText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '900'
  },
  message: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '800'
  },
  realtimeMessage: {
    color: colors.mintDeep,
    fontSize: 14,
    fontWeight: '800'
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '800'
  },
  muted: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20
  }
});
