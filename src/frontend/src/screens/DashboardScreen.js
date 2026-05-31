import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import FeatureGuideModal from '../components/FeatureGuideModal';
import { SkeletonBlock } from '../components/Skeleton';
import WritingEraseText from '../components/WritingEraseText';
import { languageIntlLocale, useLanguage } from '../i18n';
import { claimRewardQuest, getMyRewards, getSchedules, getTasks } from '../services/api';
import { colors, interactions, interactiveStateStyles, shadows } from '../styles/theme';

const AI_GUIDE_STORAGE_KEY = 'sagaksagakAiGuideDismissed';
const QUICK_QUIZ_DISMISS_KEY = 'sagaksagakQuickQuizDismissedDate';

const quickQuizBank = [
  {
    question: '짧은 집중 루틴을 시작할 때 가장 부담이 적은 목표는 무엇일까요?',
    options: ['25분 집중 1회', '하루 종일 쉬지 않기', '모든 과목 끝내기'],
    answerIndex: 0,
    explanation: '작은 집중 기록을 먼저 남기면 다음 태스크로 이어가기 쉽습니다.'
  },
  {
    question: '오늘 일정이 비어 있을 때 가장 먼저 할 일은 무엇일까요?',
    options: ['큰 시험 계획부터 완성하기', '오늘 목표 1개 등록하기', '기록을 전부 미루기'],
    answerIndex: 1,
    explanation: '일정 하나만 등록해도 대시보드와 보상 흐름을 시작할 수 있습니다.'
  },
  {
    question: '복습 흐름을 만들기 좋은 방법은 무엇일까요?',
    options: ['틀린 문제를 바로 지우기', '오답 이유를 한 줄로 남기기', '모든 알림 끄기'],
    answerIndex: 1,
    explanation: '짧은 오답 기록은 다음 복습 시점을 잡는 기준이 됩니다.'
  }
];

const DASHBOARD_COPY = {
  ko: {
    heroNameLine: '{name}님,',
    heroIntro: '오늘도',
    heroWritingPhrase: '차곡차곡 기록해요',
    rewardAvailable: '수령 가능한 보상이 {count}개 있습니다. 오늘은 퀘스트 보상을 먼저 확인해 보세요.',
    rewardProgress: '진행 중인 퀘스트 {count}개가 있습니다. 일정과 칸반을 채우면 보상 진행률이 함께 올라갑니다.',
    rewardBadges: '현재 {count}개의 배지를 모았습니다. 다음 퀘스트가 열리면 이어서 보상을 쌓을 수 있습니다.',
    rewardEmpty: '아직 보상 기록이 많지 않습니다. 오늘의 일정과 태스크를 먼저 채워 보상 흐름을 시작해 보세요.',
    motivationAvailable: '수령 가능한 보상이 {count}개 있어요. 먼저 보상을 받고 오늘 흐름을 가볍게 이어가 보세요.',
    motivationEmpty: '아직 오늘의 기록이 비어 있어요. 25분 집중 1회나 작은 태스크 하나부터 시작해도 충분합니다.',
    motivationCompleted: '끝낸 태스크가 {count}개 쌓였어요. 다음 태스크는 더 작게 쪼개서 이어가 보세요.',
    motivationProgress: '진행 중인 퀘스트가 {count}개 있어요. 일정과 칸반을 하나씩 채우면 진행률이 올라갑니다.',
    motivationDefault: '오늘은 작은 기록을 남기기 좋은 날이에요. 부담 없이 한 가지 학습 행동만 고르면 됩니다.',
    claimBadge: '{points}포인트와 "{badgeName}" 배지를 받았습니다.',
    claimPoints: '{points}포인트를 받았습니다.',
    count: '{count}개',
    minutes: '{value}분 / {target}분',
    countProgress: '{value}개 / {target}개',
    moreActiveQuests: '진행 중 퀘스트 더보기 ({count}개 더)',
    moreBadges: '배지 더보기 ({count}개 더)',
    moreTransactions: '포인트 내역 더보기 ({count}건 더)',
    rewardDetailsShow: '더보기',
    rewardDetailsHide: '숨기기',
    rewardDetailsSummary: '진행 중 퀘스트 {questCount}개 · 배지 {badgeCount}개 · 포인트 내역 {transactionCount}건',
    claimedQuestToggle: '{count}개 {action}'
  },
  en: {
    heroNameLine: '{name},',
    heroIntro: 'Today, keep',
    heroWritingPhrase: 'building steady records',
    rewardAvailable: '{count} reward(s) are ready to claim. Check quest rewards first today.',
    rewardProgress: '{count} quest(s) are in progress. Filling schedules and boards will raise reward progress.',
    rewardBadges: 'You have collected {count} badge(s). Keep building rewards when the next quest opens.',
    rewardEmpty: 'There are not many reward records yet. Start by filling today’s schedule and tasks.',
    motivationAvailable: '{count} reward(s) are ready. Claim them first and continue today’s flow lightly.',
    motivationEmpty: 'Today’s record is still empty. One 25-minute focus or one small task is enough to start.',
    motivationCompleted: '{count} finished task(s) have stacked up. Break the next task into a smaller step.',
    motivationProgress: '{count} quest(s) are in progress. Add schedules and board tasks one by one to raise progress.',
    motivationDefault: 'Today is a good day to leave a small record. Choose one study action without pressure.',
    claimBadge: 'Received {points} points and the "{badgeName}" badge.',
    claimPoints: 'Received {points} points.',
    count: '{count}',
    minutes: '{value} min / {target} min',
    countProgress: '{value} / {target}',
    moreActiveQuests: 'Show more active quests ({count} more)',
    moreBadges: 'Show more badges ({count} more)',
    moreTransactions: 'Show more point history ({count} more)',
    rewardDetailsShow: 'Show more',
    rewardDetailsHide: 'Hide',
    rewardDetailsSummary: '{questCount} active quest(s) · {badgeCount} badge(s) · {transactionCount} point record(s)',
    claimedQuestToggle: '{count} {action}'
  },
  ja: {
    heroNameLine: '{name}さん、',
    heroIntro: '今日も',
    heroWritingPhrase: '少しずつ記録しよう',
    rewardAvailable: '受け取れる報酬が{count}件あります。今日はクエスト報酬を先に確認しましょう。',
    rewardProgress: '進行中のクエストが{count}件あります。予定とカンバンを埋めると報酬進捗も上がります。',
    rewardBadges: '現在{count}個のバッジを集めています。次のクエストでも報酬を続けて積み上げられます。',
    rewardEmpty: '報酬記録はまだ多くありません。今日の予定とタスクから報酬の流れを始めましょう。',
    motivationAvailable: '受け取れる報酬が{count}件あります。まず報酬を受け取り、今日の流れを軽く続けましょう。',
    motivationEmpty: '今日はまだ記録が空です。25分集中1回や小さなタスク1つからで十分です。',
    motivationCompleted: '終えたタスクが{count}件あります。次のタスクはさらに小さく分けて続けましょう。',
    motivationProgress: '進行中のクエストが{count}件あります。予定とカンバンを一つずつ埋めると進捗が上がります。',
    motivationDefault: '今日は小さな記録を残すのに良い日です。負担なく一つの学習行動を選びましょう。',
    claimBadge: '{points}ポイントと「{badgeName}」バッジを受け取りました。',
    claimPoints: '{points}ポイントを受け取りました。',
    count: '{count}件',
    minutes: '{value}分 / {target}分',
    countProgress: '{value}件 / {target}件',
    moreActiveQuests: '進行中のクエストをさらに表示（残り{count}件）',
    moreBadges: 'バッジをさらに表示（残り{count}件）',
    moreTransactions: 'ポイント履歴をさらに表示（残り{count}件）',
    rewardDetailsShow: 'さらに表示',
    rewardDetailsHide: '隠す',
    rewardDetailsSummary: '進行中クエスト{questCount}件 · バッジ{badgeCount}個 · ポイント履歴{transactionCount}件',
    claimedQuestToggle: '{count}件 {action}'
  },
  zh: {
    heroNameLine: '{name}，',
    heroIntro: '今天也',
    heroWritingPhrase: '一点点记录下来',
    rewardAvailable: '有 {count} 个奖励可领取。今天可以先查看任务奖励。',
    rewardProgress: '有 {count} 个任务正在进行。填写日程和看板后，奖励进度也会提升。',
    rewardBadges: '目前已收集 {count} 枚徽章。下一个任务开启后可继续累积奖励。',
    rewardEmpty: '奖励记录还不多。先填写今天的日程和任务，开始奖励流程。',
    motivationAvailable: '有 {count} 个奖励可领取。先领取奖励，再轻松延续今天的学习流程。',
    motivationEmpty: '今天的记录还为空。从一次 25 分钟专注或一个小任务开始就足够了。',
    motivationCompleted: '已结束 {count} 个任务。下一个任务可以拆得更小再继续。',
    motivationProgress: '有 {count} 个任务正在进行。逐步填写日程和看板，进度会提高。',
    motivationDefault: '今天适合留下一个小记录。轻松选择一个学习行动即可。',
    claimBadge: '获得 {points} 积分和“{badgeName}”徽章。',
    claimPoints: '获得 {points} 积分。',
    count: '{count} 个',
    minutes: '{value} 分 / {target} 分',
    countProgress: '{value} 个 / {target} 个',
    moreActiveQuests: '查看更多进行中任务（还有 {count} 个）',
    moreBadges: '查看更多徽章（还有 {count} 个）',
    moreTransactions: '查看更多积分记录（还有 {count} 条）',
    rewardDetailsShow: '查看更多',
    rewardDetailsHide: '隐藏',
    rewardDetailsSummary: '进行中任务 {questCount} 个 · 徽章 {badgeCount} 枚 · 积分记录 {transactionCount} 条',
    claimedQuestToggle: '{count} 个 {action}'
  }
};

function dashboardCopy(language, key, values = {}) {
  const template = DASHBOARD_COPY[language]?.[key] || DASHBOARD_COPY.ko[key] || '';
  return template.replace(/\{(\w+)\}/g, (_, token) => values[token] ?? '');
}

const featureCards = [
  {
    label: 'AI 학습 헬퍼',
    summary: '질문, 맞춤형 추천, 요약, 오답 분석을 한 화면에서 이어갈 수 있습니다.',
    status: '연결 완료',
    screen: 'aiLearning',
    tone: 'featured',
    requiresAIGuide: true
  },
  {
    label: '음성/접근성',
    summary: '큰 글씨, 고대비, 읽어주기, 음성 입력, 복습 알림을 한곳에서 설정할 수 있습니다.',
    status: '연결 완료',
    screen: 'accessibility',
    tone: 'mint'
  },
  {
    label: '학습 일정',
    summary: '날짜와 시간을 입력해 학습 일정을 만들고 수정하고 삭제할 수 있습니다.',
    status: '연결 완료',
    screen: 'schedule',
    tone: 'mint'
  },
  {
    label: '칸반 보드',
    summary: '학습 일정과 연결된 태스크를 TODO부터 DONE까지 관리할 수 있습니다.',
    status: '연결 완료',
    screen: 'taskBoard',
    tone: 'warm'
  },
  {
    label: '커뮤니티',
    summary: '게시글, 댓글, 반응, 북마크, 신고 기능을 바로 사용할 수 있습니다.',
    status: '연결 완료',
    screen: 'community',
    tone: 'green'
  },
  {
    label: '집중 시간',
    summary: '스톱워치와 타이머로 지금 집중하는 시간을 기록하고 통계에 반영할 수 있습니다.',
    status: '연결 완료',
    screen: 'focusTimer',
    tone: 'mint'
  },
  {
    label: '학습 통계',
    summary: '주간 집중 시간 막대와 최근 4주 히트맵으로 학습 흐름을 확인할 수 있습니다.',
    status: '연결 완료',
    screen: 'statistics',
    tone: 'mint'
  }
];

function getCardStyle(tone) {
  if (tone === 'featured') {
    return {
      container: styles.featuredCard,
      title: styles.featuredTitle,
      summary: styles.featuredSummary,
      status: styles.featuredStatus,
      statusText: styles.featuredStatusText,
      link: styles.featuredLink
    };
  }

  if (tone === 'mint') {
    return {
      container: styles.mintCard,
      title: styles.defaultTitle,
      summary: styles.defaultSummary,
      status: styles.readyStatus,
      statusText: styles.readyStatusText,
      link: styles.defaultLink
    };
  }

  if (tone === 'warm') {
    return {
      container: styles.warmCard,
      title: styles.defaultTitle,
      summary: styles.defaultSummary,
      status: styles.readyStatus,
      statusText: styles.readyStatusText,
      link: styles.defaultLink
    };
  }

  if (tone === 'green') {
    return {
      container: styles.greenCard,
      title: styles.greenTitle,
      summary: styles.defaultSummary,
      status: styles.greenStatus,
      statusText: styles.greenStatusText,
      link: styles.greenLink
    };
  }

  return {
    container: styles.defaultCard,
    title: styles.defaultTitle,
    summary: styles.defaultSummary,
    status: styles.pendingStatus,
    statusText: styles.pendingStatusText,
    link: styles.pendingLink
  };
}

function formatNumber(value, language = 'ko') {
  return new Intl.NumberFormat(languageIntlLocale(language)).format(Number(value || 0));
}

function getQuestTone(status) {
  if (status === 'CLAIMED') {
    return styles.claimedQuest;
  }

  if (status === 'ACHIEVED') {
    return styles.achievedQuest;
  }

  return styles.progressQuest;
}

function getQuestStatusText(status, translateText) {
  if (status === 'CLAIMED') {
    return translateText('보상 수령 완료');
  }

  if (status === 'ACHIEVED') {
    return translateText('보상 수령 가능');
  }

  return translateText('진행 중');
}

function getQuestProgressLabel(quest, language) {
  const targetValue = quest?.targetValue || 0;
  const progressValue = quest?.progressValue || 0;

  if (quest?.type === 'TOTAL_STUDY_MINUTES') {
    return dashboardCopy(language, 'minutes', { value: progressValue, target: targetValue });
  }

  return dashboardCopy(language, 'countProgress', { value: progressValue, target: targetValue });
}

function getQuestProgressWidth(progressRate) {
  const ratio = Math.max(0, Math.min(Number(progressRate || 0), 1));

  if (ratio === 0) {
    return '0%';
  }

  return `${Math.max(6, Math.round(ratio * 100))}%`;
}

function buildClaimMessage(result, language) {
  const points = result?.reward?.pointTransaction?.amount || result?.reward?.quest?.rewardPoints || 0;
  const badgeName = result?.reward?.badge?.badge?.name;

  if (badgeName) {
    return dashboardCopy(language, 'claimBadge', { points, badgeName });
  }

  return dashboardCopy(language, 'claimPoints', { points });
}

function localizeDisplayText(value, translateText, fallback) {
  return translateText(value || fallback || '');
}

function buildRewardInsight(rewardData, activeQuests, language) {
  const availableQuestCount = activeQuests.filter((quest) => quest.status === 'ACHIEVED').length;
  const progressQuestCount = activeQuests.filter((quest) => quest.status === 'IN_PROGRESS').length;
  const badgeCount = rewardData.badges?.length || 0;

  if (availableQuestCount > 0) {
    return dashboardCopy(language, 'rewardAvailable', { count: availableQuestCount });
  }

  if (progressQuestCount > 0) {
    return dashboardCopy(language, 'rewardProgress', { count: progressQuestCount });
  }

  if (badgeCount > 0) {
    return dashboardCopy(language, 'rewardBadges', { count: badgeCount });
  }

  return dashboardCopy(language, 'rewardEmpty');
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getDailyQuickQuiz() {
  const day = new Date().getDate();
  return quickQuizBank[day % quickQuizBank.length];
}

function buildMotivationInsight(rewardData, activeQuests, language) {
  const totalStudyMinutes = Number(rewardData.metrics?.totalStudyMinutes || 0);
  const completedTaskCount = Number(rewardData.metrics?.completedTaskCount || 0);
  const availableQuestCount = activeQuests.filter((quest) => quest.status === 'ACHIEVED').length;
  const progressQuestCount = activeQuests.filter((quest) => quest.status === 'IN_PROGRESS').length;

  if (availableQuestCount > 0) {
    return dashboardCopy(language, 'motivationAvailable', { count: availableQuestCount });
  }

  if (totalStudyMinutes === 0 && completedTaskCount === 0) {
    return dashboardCopy(language, 'motivationEmpty');
  }

  if (completedTaskCount > 0) {
    return dashboardCopy(language, 'motivationCompleted', { count: completedTaskCount });
  }

  if (progressQuestCount > 0) {
    return dashboardCopy(language, 'motivationProgress', { count: progressQuestCount });
  }

  return dashboardCopy(language, 'motivationDefault');
}

function buildMotivationAction(rewardData, activeQuests, translateText) {
  const availableQuest = activeQuests.find((quest) => quest.status === 'ACHIEVED');

  if (availableQuest) {
    return {
      label: translateText('보상 확인하기'),
      action: 'reward'
    };
  }

  if (Number(rewardData.metrics?.completedTaskCount || 0) === 0) {
    return {
      label: translateText('태스크 만들기'),
      screen: 'taskBoard'
    };
  }

  return {
    label: translateText('오늘 일정 보기'),
    screen: 'schedule'
  };
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getLocalDateKey(value) {
  const date = parseDate(value);

  if (!date) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatPreviewDate(value, language) {
  const date = parseDate(value);

  if (!date) {
    return null;
  }

  return date.toLocaleString(languageIntlLocale(language), {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getPriorityLabel(priority, translateText) {
  if (priority === 'HIGH') {
    return translateText('높음');
  }

  if (priority === 'LOW') {
    return translateText('낮음');
  }

  return translateText('보통');
}

function getStatusLabel(status, translateText) {
  if (status === 'DONE') {
    return translateText('완료');
  }

  if (status === 'IN_PROGRESS') {
    return translateText('진행 중');
  }

  return translateText('할 일');
}

function getUpcomingSchedules(schedules = []) {
  const now = Date.now();

  return schedules
    .filter((schedule) => {
      const startAt = parseDate(schedule.startAt);
      return startAt && startAt.getTime() >= now - 60 * 60 * 1000;
    })
    .sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime())
    .slice(0, 3);
}

function getPreviewTasks(tasks = []) {
  return tasks
    .filter((task) => task.status !== 'DONE')
    .sort((left, right) => {
      const leftDate = parseDate(left.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const rightDate = parseDate(right.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return leftDate - rightDate;
    })
    .slice(0, 4);
}

function RewardPanelSkeleton() {
  return (
    <View style={styles.rewardSkeletonShell}>
      <View style={styles.rewardSkeletonHeader}>
        <SkeletonBlock height={18} width="28%" />
        <SkeletonBlock height={38} style={styles.rewardSkeletonButton} width={110} />
      </View>
      <View style={styles.rewardSkeletonStats}>
        <View style={styles.rewardSkeletonPointCard}>
          <SkeletonBlock height={12} width="42%" />
          <SkeletonBlock height={34} width="58%" />
          <SkeletonBlock height={12} width="78%" />
        </View>
        {[0, 1, 2].map((item) => (
          <View key={item} style={styles.rewardSkeletonMetricCard}>
            <SkeletonBlock height={12} width="54%" />
            <SkeletonBlock height={28} width="44%" />
          </View>
        ))}
      </View>
      <View style={styles.rewardSkeletonGrid}>
        <View style={styles.rewardSkeletonPanel}>
          <SkeletonBlock height={16} width="36%" />
          <SkeletonBlock height={74} />
          <SkeletonBlock height={74} />
        </View>
        <View style={styles.rewardSkeletonPanel}>
          <SkeletonBlock height={16} width="46%" />
          <SkeletonBlock height={54} />
          <SkeletonBlock height={54} />
        </View>
      </View>
    </View>
  );
}

export default function DashboardScreen({ onLogout, onNavigate, token, user }) {
  const { currentLanguage, translateText } = useLanguage();
  const hasAdminRole = user?.role === 'ADMIN';
  const [showAIGuide, setShowAIGuide] = useState(false);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showClaimedQuests, setShowClaimedQuests] = useState(false);
  const [showAllActiveQuests, setShowAllActiveQuests] = useState(false);
  const [showRewardDetails, setShowRewardDetails] = useState(false);
  const [failedBadgeIcons, setFailedBadgeIcons] = useState({});
  const [rewardLoading, setRewardLoading] = useState(true);
  const [rewardRefreshing, setRewardRefreshing] = useState(false);
  const [rewardError, setRewardError] = useState('');
  const [claimingQuestId, setClaimingQuestId] = useState(null);
  const [claimMessage, setClaimMessage] = useState('');
  const [selectedQuizOption, setSelectedQuizOption] = useState(null);
  const [planningLoading, setPlanningLoading] = useState(true);
  const [planningError, setPlanningError] = useState('');
  const [planningData, setPlanningData] = useState({ schedules: [], tasks: [] });
  const [isQuickQuizHiddenToday, setIsQuickQuizHiddenToday] = useState(() => {
    try {
      return globalThis.localStorage?.getItem(QUICK_QUIZ_DISMISS_KEY) === getTodayKey();
    } catch (error) {
      return false;
    }
  });
  const [rewardData, setRewardData] = useState({
    account: null,
    metrics: { totalStudyMinutes: 0, completedTaskCount: 0 },
    quests: [],
    badges: [],
    recentPointTransactions: []
  });

  const featuredQuests = useMemo(
    () => (rewardData.quests || []).slice().sort((left, right) => {
      const order = { ACHIEVED: 0, IN_PROGRESS: 1, CLAIMED: 2 };
      return (order[left.status] ?? 99) - (order[right.status] ?? 99);
    }),
    [rewardData.quests]
  );
  const activeQuests = useMemo(
    () => featuredQuests.filter((quest) => quest.status !== 'CLAIMED'),
    [featuredQuests]
  );
  const visibleActiveQuests = useMemo(
    () => (showAllActiveQuests ? activeQuests : activeQuests.slice(0, 3)),
    [activeQuests, showAllActiveQuests]
  );
  const claimedQuests = useMemo(
    () => featuredQuests.filter((quest) => quest.status === 'CLAIMED'),
    [featuredQuests]
  );
  const visibleBadges = useMemo(
    () => (showAllBadges ? rewardData.badges || [] : (rewardData.badges || []).slice(0, 4)),
    [rewardData.badges, showAllBadges]
  );
  const visibleTransactions = useMemo(
    () =>
      showAllTransactions
        ? rewardData.recentPointTransactions || []
        : (rewardData.recentPointTransactions || []).slice(0, 5),
    [rewardData.recentPointTransactions, showAllTransactions]
  );
  const rewardInsight = useMemo(
    () => buildRewardInsight(rewardData, activeQuests, currentLanguage),
    [activeQuests, currentLanguage, rewardData]
  );
  const motivationInsight = useMemo(
    () => buildMotivationInsight(rewardData, activeQuests, currentLanguage),
    [activeQuests, currentLanguage, rewardData]
  );
  const motivationAction = useMemo(
    () => buildMotivationAction(rewardData, activeQuests, translateText),
    [activeQuests, rewardData, translateText]
  );
  const quickQuiz = useMemo(() => getDailyQuickQuiz(), []);
  const isQuizAnswered = selectedQuizOption !== null;
  const isQuizCorrect = selectedQuizOption === quickQuiz.answerIndex;
  const upcomingSchedules = useMemo(
    () => getUpcomingSchedules(planningData.schedules),
    [planningData.schedules]
  );
  const previewTasks = useMemo(() => getPreviewTasks(planningData.tasks), [planningData.tasks]);
  const todayScheduleCount = useMemo(() => {
    const today = getLocalDateKey(new Date());
    return (planningData.schedules || []).filter((schedule) => getLocalDateKey(schedule.startAt) === today).length;
  }, [planningData.schedules]);
  const activeTaskCount = useMemo(
    () => (planningData.tasks || []).filter((task) => task.status !== 'DONE').length,
    [planningData.tasks]
  );
  const dashboardUserName = user?.name || translateText('사용자');
  const heroNameLine = dashboardCopy(currentLanguage, 'heroNameLine', { name: dashboardUserName });
  const heroIntro = dashboardCopy(currentLanguage, 'heroIntro');
  const heroWritingPhrase = dashboardCopy(currentLanguage, 'heroWritingPhrase');

  function isGuideDismissed() {
    try {
      return globalThis.localStorage?.getItem(AI_GUIDE_STORAGE_KEY) === 'true';
    } catch (error) {
      return false;
    }
  }

  function openAILearning() {
    if (isGuideDismissed()) {
      onNavigate('aiLearning');
      return;
    }

    setShowAIGuide(true);
  }

  function continueToAILearning(doNotShowAgain) {
    if (doNotShowAgain) {
      try {
        globalThis.localStorage?.setItem(AI_GUIDE_STORAGE_KEY, 'true');
      } catch (error) {
        // Disabled storage should not block navigation.
      }
    }

    setShowAIGuide(false);
    onNavigate('aiLearning');
  }

  function handleCardPress(card) {
    if (!card.screen) {
      return;
    }

    if (card.requiresAIGuide) {
      openAILearning();
      return;
    }

    onNavigate(card.screen);
  }

  async function loadRewards({ silent = false } = {}) {
    if (!token) {
      setRewardData({
        account: null,
        metrics: { totalStudyMinutes: 0, completedTaskCount: 0 },
        quests: [],
        badges: [],
        recentPointTransactions: []
      });
      setRewardError('');
      setRewardLoading(false);
      return;
    }

    if (silent) {
      setRewardRefreshing(true);
    } else {
      setRewardLoading(true);
    }

    try {
      const result = await getMyRewards(token);
      setRewardData(result.rewards || {});
      setRewardError('');
    } catch (error) {
      setRewardError(error.message || '보상 정보를 불러오지 못했습니다.');
    } finally {
      setRewardLoading(false);
      setRewardRefreshing(false);
    }
  }

  async function loadPlanningPreview() {
    if (!token) {
      setPlanningData({ schedules: [], tasks: [] });
      setPlanningError('');
      setPlanningLoading(false);
      return;
    }

    setPlanningLoading(true);
    setPlanningError('');

    try {
      const [scheduleResult, taskResult] = await Promise.all([getSchedules(token), getTasks(token)]);
      setPlanningData({
        schedules: scheduleResult.schedules || [],
        tasks: taskResult.tasks || []
      });
    } catch (error) {
      setPlanningError(error.message || '일정과 할 일 미리보기를 불러오지 못했습니다.');
    } finally {
      setPlanningLoading(false);
    }
  }

  useEffect(() => {
    loadRewards();
  }, [token]);

  useEffect(() => {
    loadPlanningPreview();
  }, [token]);

  async function handleClaimQuest(questId) {
    if (!token || claimingQuestId) {
      return;
    }

    setClaimingQuestId(questId);
    setClaimMessage('');

    try {
      const result = await claimRewardQuest(token, questId);
      setClaimMessage(buildClaimMessage(result, currentLanguage));
      await loadRewards({ silent: true });
    } catch (error) {
      setRewardError(error.message || '보상을 수령하지 못했습니다.');
    } finally {
      setClaimingQuestId(null);
    }
  }

  function markBadgeIconFailed(badgeKey) {
    setFailedBadgeIcons((current) => {
      if (current[badgeKey]) {
        return current;
      }

      return {
        ...current,
        [badgeKey]: true
      };
    });
  }

  function handleMotivationAction() {
    if (motivationAction.action === 'reward') {
      loadRewards({ silent: true });
      return;
    }

    if (motivationAction.screen) {
      onNavigate(motivationAction.screen);
    }
  }

  function hideQuickQuizToday() {
    setIsQuickQuizHiddenToday(true);

    try {
      globalThis.localStorage?.setItem(QUICK_QUIZ_DISMISS_KEY, getTodayKey());
    } catch (error) {
      // Disabled storage should not block the non-forced quiz flow.
    }
  }

  function showQuickQuizAgain() {
    setSelectedQuizOption(null);
    setIsQuickQuizHiddenToday(false);

    try {
      globalThis.localStorage?.removeItem(QUICK_QUIZ_DISMISS_KEY);
    } catch (error) {
      // Disabled storage should not block restoring the optional quiz card.
    }
  }

  function renderPlanningPreview() {
    if (planningLoading) {
      return (
        <View style={[styles.planningPanel, shadows.card]}>
          <View style={styles.planningHeader}>
            <View>
              <Text style={styles.planningEyebrow}>TODAY PREVIEW</Text>
              <Text style={styles.planningTitle}>일정과 할 일 미리보기</Text>
            </View>
          </View>
          <View style={styles.planningGrid}>
            <View style={styles.planningColumn}>
              <SkeletonBlock height={18} width="34%" />
              <SkeletonBlock height={54} />
              <SkeletonBlock height={54} />
            </View>
            <View style={styles.planningColumn}>
              <SkeletonBlock height={18} width="40%" />
              <SkeletonBlock height={54} />
              <SkeletonBlock height={54} />
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.planningPanel, shadows.card]}>
        <View style={styles.planningHeader}>
          <View>
            <Text style={styles.planningEyebrow}>TODAY PREVIEW</Text>
            <Text style={styles.planningTitle}>일정과 할 일 미리보기</Text>
            <Text style={styles.planningSubtitle}>오늘 확인할 일정과 진행 중인 태스크만 작게 모았습니다.</Text>
          </View>
          <View style={styles.planningSummaryRow}>
            <View style={styles.planningSummaryChip}>
              <Text style={styles.planningSummaryValue}>{todayScheduleCount}</Text>
              <Text style={styles.planningSummaryLabel}>오늘 일정</Text>
            </View>
            <View style={styles.planningSummaryChip}>
              <Text style={styles.planningSummaryValue}>{activeTaskCount}</Text>
              <Text style={styles.planningSummaryLabel}>남은 할 일</Text>
            </View>
          </View>
        </View>

        {planningError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{planningError}</Text>
          </View>
        ) : null}

        <View style={styles.planningGrid}>
          <View style={styles.planningColumn}>
            <View style={styles.previewColumnHeader}>
              <Text style={styles.previewColumnTitle}>다가오는 일정</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => onNavigate('schedule')}
                style={(state) => [styles.previewLinkButton, ...interactiveStateStyles(state)]}
              >
                <Text style={styles.previewLinkText}>일정 열기</Text>
              </Pressable>
            </View>

            {upcomingSchedules.length ? (
              upcomingSchedules.map((schedule) => (
                <View key={schedule.id} style={styles.previewItem}>
                  <View style={styles.previewItemMarker} />
                  <View style={styles.previewItemCopy}>
                    <Text style={styles.previewItemTitle} numberOfLines={1}>
                      {schedule.title}
                    </Text>
                    <Text style={styles.previewItemMeta}>
                      {formatPreviewDate(schedule.startAt, currentLanguage) || translateText('날짜 없음')} · {schedule.subject || translateText('과목 없음')} · {translateText('우선순위')} {getPriorityLabel(schedule.priority, translateText)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.previewEmptyBox}>
                <Text style={styles.emptyTitle}>다가오는 일정이 없습니다.</Text>
                <Text style={styles.emptyText}>오늘의 목표를 하나 등록하면 대시보드에서 바로 확인할 수 있습니다.</Text>
              </View>
            )}
          </View>

          <View style={styles.planningColumn}>
            <View style={styles.previewColumnHeader}>
              <Text style={styles.previewColumnTitle}>진행할 할 일</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => onNavigate('taskBoard')}
                style={(state) => [styles.previewLinkButton, ...interactiveStateStyles(state)]}
              >
                <Text style={styles.previewLinkText}>칸반 열기</Text>
              </Pressable>
            </View>

            {previewTasks.length ? (
              previewTasks.map((task) => (
                <View key={task.id} style={styles.previewItem}>
                  <View style={[styles.previewItemMarker, styles.taskPreviewMarker]} />
                  <View style={styles.previewItemCopy}>
                    <Text style={styles.previewItemTitle} numberOfLines={1}>
                      {task.title}
                    </Text>
                    <Text style={styles.previewItemMeta}>
                      {getStatusLabel(task.status, translateText)} · {translateText('마감')} {formatPreviewDate(task.dueDate, currentLanguage) || translateText('날짜 없음')} · {getPriorityLabel(task.priority || 'MEDIUM', translateText)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.previewEmptyBox}>
                <Text style={styles.emptyTitle}>남은 할 일이 없습니다.</Text>
                <Text style={styles.emptyText}>작은 복습 태스크를 추가해 오늘의 흐름을 만들어 보세요.</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>MY LEARNING SPACE</Text>
            <Text accessibilityLabel={`${heroNameLine} ${heroIntro} ${heroWritingPhrase}`} style={styles.title}>
              {heroNameLine}
              {'\n'}
              {heroIntro}{' '}
              <WritingEraseText
                accessibilityElementsHidden
                cursorStyle={styles.titleWritingCursor}
                eraseInterval={56}
                holdMs={1250}
                importantForAccessibility="no"
                pauseMs={520}
                style={styles.titleWritingPhrase}
                text={heroWritingPhrase}
                writeInterval={118}
              />
            </Text>
            <Text style={styles.subtitle}>
              AI 학습, 커뮤니티, 일정, 칸반 화면을 한곳에서 오가며 오늘의 학습 흐름을 정리할 수 있습니다.
            </Text>
            <View style={styles.heroButtonRow}>
              <Pressable accessibilityRole="button" onPress={openAILearning} style={(state) => [styles.primaryButton, ...interactiveStateStyles(state)]}>
                <Text style={styles.primaryButtonText}>AI 학습 시작하기</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => onNavigate('community')}
                style={(state) => [styles.secondaryButton, ...interactiveStateStyles(state)]}
              >
                <Text style={styles.secondaryButtonText}>커뮤니티 보기</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => onNavigate('schedule')}
                style={(state) => [styles.secondaryButton, ...interactiveStateStyles(state)]}
              >
                <Text style={styles.secondaryButtonText}>일정 보기</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.profileCard, shadows.card]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.slice(0, 1) || '학'}</Text>
            </View>
            <Text style={styles.userName}>{user?.name || '학습자'}</Text>
            <Text style={styles.userLoginId}>{user?.loginId}</Text>
            <View style={styles.memberBadge}>
              <Text style={styles.memberBadgeText}>{hasAdminRole ? 'ADMIN ACCOUNT' : 'LEARNER ACCOUNT'}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onLogout} style={(state) => [styles.logoutButton, ...interactiveStateStyles(state)]}>
              <Text style={styles.logoutButtonText}>로그아웃</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.motivationGrid}>
          <View style={[styles.motivationCard, shadows.card]}>
            <View style={styles.motivationHeader}>
              <View>
                <Text style={styles.motivationEyebrow}>TODAY BOOST</Text>
                <Text style={styles.motivationTitle}>오늘의 학습 자극</Text>
              </View>
              <View style={styles.optInChip}>
                <Text style={styles.optInChipText}>선택형</Text>
              </View>
            </View>
            <Text style={styles.motivationText}>{motivationInsight}</Text>
            <View style={styles.motivationActions}>
              <Pressable
                accessibilityRole="button"
                onPress={handleMotivationAction}
                style={(state) => [styles.motivationButton, ...interactiveStateStyles(state)]}
              >
                <Text style={styles.motivationButtonText}>{motivationAction.label}</Text>
              </Pressable>
              <Text style={styles.motivationNote}>웹 1차 구현이며 OS 잠금화면 개입은 하지 않습니다.</Text>
            </View>
          </View>

          <View style={[styles.quickQuizCard, shadows.card]}>
            <View style={styles.motivationHeader}>
              <View>
                <Text style={styles.motivationEyebrow}>1 SECOND REVIEW</Text>
                <Text style={styles.motivationTitle}>1초 복습 퀴즈</Text>
              </View>
              {!isQuickQuizHiddenToday ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={hideQuickQuizToday}
                  style={(state) => [styles.skipQuizButton, ...interactiveStateStyles(state)]}
                >
                  <Text style={styles.skipQuizText}>오늘 숨김</Text>
                </Pressable>
              ) : null}
            </View>

            {isQuickQuizHiddenToday ? (
              <View style={styles.quizHiddenBox}>
                <Text style={styles.emptyTitle}>오늘의 1초 퀴즈를 숨겼어요.</Text>
                <Text style={styles.emptyText}>강제 퀴즈가 아니라 원할 때만 확인하는 빠른 복습 카드입니다.</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={showQuickQuizAgain}
                  style={(state) => [styles.skipQuizButton, styles.quizRestoreButton, ...interactiveStateStyles(state)]}
                >
                  <Text style={styles.skipQuizText}>오늘 다시 보기</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={styles.quickQuizQuestion}>{translateText(quickQuiz.question)}</Text>
                <View style={styles.quickQuizOptions}>
                  {quickQuiz.options.map((option, index) => {
                    const isSelected = selectedQuizOption === index;
                    const isCorrectOption = quickQuiz.answerIndex === index;

                    return (
                      <Pressable
                        accessibilityLabel={`${translateText('1초 복습 퀴즈')} ${translateText('선택지')}: ${translateText(option)}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        key={option}
                        onPress={() => setSelectedQuizOption(index)}
                        style={(state) => [
                          styles.quickQuizOption,
                          isSelected && styles.quickQuizOptionSelected,
                          isQuizAnswered && isCorrectOption && styles.quickQuizOptionCorrect,
                          ...interactiveStateStyles(state, { kind: 'card' })
                        ]}
                      >
                        <Text
                          style={[
                            styles.quickQuizOptionText,
                            isSelected && styles.quickQuizOptionTextSelected,
                            isQuizAnswered && isCorrectOption && styles.quickQuizOptionTextCorrect
                          ]}
                        >
                          {translateText(option)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {isQuizAnswered ? (
                  <View style={isQuizCorrect ? styles.quizResultSuccess : styles.quizResultInfo}>
                    <Text style={isQuizCorrect ? styles.quizResultSuccessText : styles.quizResultInfoText}>
                      {isQuizCorrect ? translateText('정답이에요. 짧게 시작하는 흐름이 좋습니다.') : translateText('괜찮아요. 핵심은 작게 시작하는 습관입니다.')}
                    </Text>
                    <Text style={styles.quizExplanation}>{translateText(quickQuiz.explanation)}</Text>
                  </View>
                ) : (
                  <Text style={styles.quickQuizHint}>{translateText('데모형 빠른 복습 카드입니다. 잠금화면을 막거나 강제하지 않습니다.')}</Text>
                )}
              </>
            )}
          </View>
        </View>

        {renderPlanningPreview()}

        <View style={[styles.rewardPanel, shadows.card]}>
          <View style={styles.rewardHeader}>
            <View>
              <Text style={styles.rewardTitle}>{translateText('보상 현황')}</Text>
              <Text style={styles.rewardSubtitle}>{translateText('포인트, 퀘스트, 배지를 대시보드에서 바로 확인할 수 있어요.')}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={rewardLoading || rewardRefreshing}
              onPress={() => loadRewards({ silent: true })}
              style={(state) => [
                styles.refreshButton,
                (rewardLoading || rewardRefreshing) && styles.refreshButtonDisabled,
                ...interactiveStateStyles(state, { disabled: rewardLoading || rewardRefreshing })
              ]}
            >
              <Text style={styles.refreshButtonText}>{translateText(rewardRefreshing ? '새로고침 중' : '새로고침')}</Text>
            </Pressable>
          </View>

          {rewardLoading ? (
            <RewardPanelSkeleton />
          ) : (
            <>
              <View style={styles.rewardStats}>
                <View style={[styles.statCard, styles.pointCard]}>
                  <Text style={styles.statLabel}>{translateText('보유 포인트')}</Text>
                  <Text style={styles.pointValue}>{formatNumber(rewardData.account?.pointBalance, currentLanguage)}</Text>
                  <Text style={styles.statHint}>{translateText('보상 수령 시 자동으로 적립됩니다.')}</Text>
                </View>

                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>{translateText('누적 집중 시간')}</Text>
                  <Text style={styles.metricValue}>{formatNumber(rewardData.metrics?.totalStudyMinutes, currentLanguage)}{translateText('분')}</Text>
                </View>

                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>{translateText('끝낸 태스크')}</Text>
                  <Text style={styles.metricValue}>{dashboardCopy(currentLanguage, 'count', { count: formatNumber(rewardData.metrics?.completedTaskCount, currentLanguage) })}</Text>
                </View>

                <View style={styles.storyCard}>
                  <Text style={styles.storyLabel}>{translateText('오늘의 보상 흐름')}</Text>
                  <Text style={styles.storyText}>{rewardInsight}</Text>
                </View>
              </View>

              {rewardError ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{rewardError}</Text>
                </View>
              ) : null}

              {claimMessage ? (
                <View style={styles.successBanner}>
                  <Text style={styles.successText}>{claimMessage}</Text>
                </View>
              ) : null}

              <View style={styles.rewardDetailsBar}>
                <Text style={styles.rewardDetailsText}>
                  {dashboardCopy(currentLanguage, 'rewardDetailsSummary', {
                    questCount: formatNumber(activeQuests.length, currentLanguage),
                    badgeCount: formatNumber(rewardData.badges?.length || 0, currentLanguage),
                    transactionCount: formatNumber(rewardData.recentPointTransactions?.length || 0, currentLanguage)
                  })}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: showRewardDetails }}
                  onPress={() => setShowRewardDetails((current) => !current)}
                  style={(state) => [styles.rewardDetailsToggle, ...interactiveStateStyles(state)]}
                >
                  <Text style={styles.rewardDetailsToggleText}>
                    {dashboardCopy(currentLanguage, showRewardDetails ? 'rewardDetailsHide' : 'rewardDetailsShow')}
                  </Text>
                </Pressable>
              </View>

              {showRewardDetails ? (
              <View style={styles.rewardContentGrid}>
                <View style={styles.questColumn}>
                  <View style={styles.subsectionHeader}>
                    <Text style={styles.subsectionTitle}>{translateText('진행 중인 퀘스트')}</Text>
                    <Text style={styles.subsectionMeta}>{dashboardCopy(currentLanguage, 'count', { count: formatNumber(activeQuests.length, currentLanguage) })}</Text>
                  </View>

                  {activeQuests.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <Text style={styles.emptyTitle}>{translateText('아직 등록된 퀘스트가 없습니다.')}</Text>
                      <Text style={styles.emptyText}>{translateText('관리자 화면에서 보상 퀘스트를 추가하면 이곳에 표시됩니다.')}</Text>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => onNavigate('schedule')}
                        style={(state) => [styles.emptyActionButton, ...interactiveStateStyles(state)]}
                      >
                        <Text style={styles.emptyActionText}>{translateText('오늘 일정부터 채우기')}</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <>
                      {visibleActiveQuests.map((quest) => (
                      <View key={quest.id} style={[styles.questCard, getQuestTone(quest.status)]}>
                        <View style={styles.questHeader}>
                          <View style={styles.questCopy}>
                            <Text style={styles.questTitle}>{localizeDisplayText(quest.title, translateText)}</Text>
                            <Text style={styles.questDescription}>
                              {localizeDisplayText(quest.description, translateText, '설명 없이 등록된 퀘스트입니다.')}
                            </Text>
                          </View>
                          <View style={styles.questStatusChip}>
                            <Text style={styles.questStatusText}>{getQuestStatusText(quest.status, translateText)}</Text>
                          </View>
                        </View>

                        <View style={styles.progressTrack}>
                          <View
                            style={[
                              styles.progressBar,
                              { width: getQuestProgressWidth(quest.progressRate) }
                            ]}
                          />
                        </View>

                        <View style={styles.questFooter}>
                          <View>
                              <Text style={styles.questProgress}>{getQuestProgressLabel(quest, currentLanguage)}</Text>
                              <Text style={styles.questReward}>{translateText('보상')} {formatNumber(quest.rewardPoints, currentLanguage)}P</Text>
                            </View>

                          {quest.status === 'ACHIEVED' ? (
                            <Pressable
                              accessibilityRole="button"
                              disabled={claimingQuestId === quest.id}
                              onPress={() => handleClaimQuest(quest.id)}
                              style={(state) => [
                                styles.claimButton,
                                claimingQuestId === quest.id && styles.claimButtonDisabled,
                                ...interactiveStateStyles(state, { disabled: claimingQuestId === quest.id })
                              ]}
                            >
                              <Text style={styles.claimButtonText}>
                                {translateText(claimingQuestId === quest.id ? '수령 중' : '보상 받기')}
                              </Text>
                            </Pressable>
                          ) : (
                            <View style={styles.questTag}>
                              <Text style={styles.questTagText}>
                                {translateText(quest.status === 'CLAIMED' ? '수령 완료' : '진행 중')}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      ))}
                      {activeQuests.length > 3 ? (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setShowAllActiveQuests((current) => !current)}
                          style={(state) => [styles.moreButton, ...interactiveStateStyles(state)]}
                        >
                          <Text style={styles.moreButtonText}>
                            {showAllActiveQuests
                              ? translateText('진행 중 퀘스트 숨기기')
                              : dashboardCopy(currentLanguage, 'moreActiveQuests', {
                                count: formatNumber(activeQuests.length - 3, currentLanguage)
                              })}
                          </Text>
                        </Pressable>
                      ) : null}
                    </>
                  )}

                  {claimedQuests.length ? (
                    <View style={styles.collapsibleSection}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setShowClaimedQuests((current) => !current)}
                        style={(state) => [styles.collapsibleToggle, ...interactiveStateStyles(state)]}
                      >
                        <Text style={styles.collapsibleTitle}>{translateText('수령 완료한 퀘스트')}</Text>
                        <Text style={styles.collapsibleMeta}>
                          {dashboardCopy(currentLanguage, 'claimedQuestToggle', {
                            count: formatNumber(claimedQuests.length, currentLanguage),
                            action: translateText(showClaimedQuests ? '접기' : '보기')
                          })}
                        </Text>
                      </Pressable>

                      {showClaimedQuests
                        ? claimedQuests.map((quest) => (
                            <View key={quest.id} style={[styles.questCard, getQuestTone(quest.status)]}>
                              <View style={styles.questHeader}>
                                <View style={styles.questCopy}>
                                  <Text style={styles.questTitle}>{localizeDisplayText(quest.title, translateText)}</Text>
                                  <Text style={styles.questDescription}>
                                    {localizeDisplayText(quest.description, translateText, '설명 없이 등록된 퀘스트입니다.')}
                                  </Text>
                                </View>
                                <View style={styles.questStatusChip}>
                                  <Text style={styles.questStatusText}>{getQuestStatusText(quest.status, translateText)}</Text>
                                </View>
                              </View>

                              <View style={styles.progressTrack}>
                                <View
                                  style={[
                                    styles.progressBar,
                                    { width: getQuestProgressWidth(quest.progressRate) }
                                  ]}
                                />
                              </View>

                              <View style={styles.questFooter}>
                                <View>
                                  <Text style={styles.questProgress}>{getQuestProgressLabel(quest, currentLanguage)}</Text>
                                  <Text style={styles.questReward}>{translateText('보상')} {formatNumber(quest.rewardPoints, currentLanguage)}P</Text>
                                </View>

                                <View style={styles.questTag}>
                                  <Text style={styles.questTagText}>{translateText('수령 완료')}</Text>
                                </View>
                              </View>
                            </View>
                          ))
                        : null}
                    </View>
                  ) : null}
                </View>

                <View style={styles.badgeColumn}>
                  <View style={styles.subsectionHeader}>
                    <Text style={styles.subsectionTitle}>{translateText('획득한 배지')}</Text>
                    <Text style={styles.subsectionMeta}>{dashboardCopy(currentLanguage, 'count', { count: formatNumber(rewardData.badges?.length || 0, currentLanguage) })}</Text>
                  </View>

                  {rewardData.badges?.length ? (
                    <>
                      {visibleBadges.map((userBadge) => (
                      (() => {
                        const badgeKey = userBadge.badge?.id || userBadge.id;
                        const iconUrl = userBadge.badge?.iconUrl;
                        const shouldShowImage = Boolean(iconUrl) && !failedBadgeIcons[badgeKey];

                        return (
                      <View key={userBadge.id} style={styles.badgeCard}>
                        <View style={styles.badgeIcon}>
                          {shouldShowImage ? (
                            <Image
                              source={{ uri: iconUrl }}
                              style={styles.badgeImage}
                              onError={() => markBadgeIconFailed(badgeKey)}
                            />
                          ) : (
                            <Text style={styles.badgeIconText}>🏅</Text>
                          )}
                        </View>
                        <View style={styles.badgeCopy}>
                          <Text style={styles.badgeTitle}>{localizeDisplayText(userBadge.badge?.name, translateText, '배지')}</Text>
                          <Text style={styles.badgeDescription}>
                            {localizeDisplayText(userBadge.badge?.description, translateText, '설명 없이 등록된 배지입니다.')}
                          </Text>
                        </View>
                      </View>
                        );
                      })()
                      ))}
                      {rewardData.badges.length > 4 ? (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setShowAllBadges((current) => !current)}
                          style={(state) => [styles.moreButton, ...interactiveStateStyles(state)]}
                        >
                          <Text style={styles.moreButtonText}>
                            {showAllBadges
                              ? translateText('배지 접기')
                              : dashboardCopy(currentLanguage, 'moreBadges', {
                                count: formatNumber(rewardData.badges.length - 4, currentLanguage)
                              })}
                          </Text>
                        </Pressable>
                      ) : null}
                    </>
                  ) : (
                    <View style={styles.emptyCard}>
                      <Text style={styles.emptyTitle}>{translateText('아직 획득한 배지가 없습니다.')}</Text>
                      <Text style={styles.emptyText}>{translateText('퀘스트를 달성하고 보상을 수령하면 배지가 여기에 표시됩니다.')}</Text>
                    </View>
                  )}

                  <View style={styles.subsectionHeader}>
                    <Text style={styles.subsectionTitle}>{translateText('최근 포인트 내역')}</Text>
                    <Text style={styles.subsectionMeta}>{dashboardCopy(currentLanguage, 'count', { count: formatNumber(rewardData.recentPointTransactions?.length || 0, currentLanguage) })}</Text>
                  </View>

                  {rewardData.recentPointTransactions?.length ? (
                    <>
                      {visibleTransactions.map((transaction) => (
                      <View key={transaction.id} style={styles.transactionRow}>
                        <View>
                          <Text style={styles.transactionReason}>{localizeDisplayText(transaction.reason, translateText, transaction.sourceType)}</Text>
                          <Text style={styles.transactionMeta}>{translateText(transaction.sourceType)}</Text>
                        </View>
                        <Text style={styles.transactionAmount}>+{formatNumber(transaction.amount, currentLanguage)}P</Text>
                      </View>
                      ))}
                      {rewardData.recentPointTransactions.length > 5 ? (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setShowAllTransactions((current) => !current)}
                          style={(state) => [styles.moreButton, ...interactiveStateStyles(state)]}
                        >
                          <Text style={styles.moreButtonText}>
                            {showAllTransactions
                              ? translateText('포인트 내역 숨기기')
                              : dashboardCopy(currentLanguage, 'moreTransactions', {
                                count: formatNumber(rewardData.recentPointTransactions.length - 5, currentLanguage)
                              })}
                          </Text>
                        </Pressable>
                      ) : null}
                    </>
                  ) : (
                    <View style={styles.emptyCard}>
                      <Text style={styles.emptyTitle}>{translateText('아직 포인트 적립 내역이 없습니다.')}</Text>
                      <Text style={styles.emptyText}>{translateText('보상을 수령하면 최근 적립 내역을 이곳에서 볼 수 있습니다.')}</Text>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => loadRewards({ silent: true })}
                        style={(state) => [styles.emptyActionButton, ...interactiveStateStyles(state)]}
                      >
                        <Text style={styles.emptyActionText}>{translateText('보상 다시 확인하기')}</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
              ) : null}
            </>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>{translateText('연결된 학습 기능')}</Text>
            <Text style={styles.sectionSub}>{translateText('지금 사용할 수 있는 화면과 준비 중인 화면을 한눈에 보여줍니다.')}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {featureCards.map((card) => {
            const cardStyle = getCardStyle(card.tone);

            return (
              <Pressable
                accessibilityRole="button"
                key={card.label}
                disabled={!card.screen}
                onPress={() => handleCardPress(card)}
                style={(state) => [
                  styles.card,
                  cardStyle.container,
                  shadows.card,
                  ...(card.screen ? interactiveStateStyles(state, { kind: 'card' }) : []),
                  !card.screen && styles.cardDisabled
                ]}
              >
                <View style={[styles.statusChip, cardStyle.status]}>
                  <Text style={[styles.statusChipText, cardStyle.statusText]}>{translateText(card.status)}</Text>
                </View>
                <Text style={[styles.cardTitle, cardStyle.title]}>{translateText(card.label)}</Text>
                <Text style={[styles.cardSummary, cardStyle.summary]}>{translateText(card.summary)}</Text>
                <Text style={[styles.cardLink, cardStyle.link]}>
                  {translateText(card.screen ? '화면으로 이동 ->' : '화면 준비 중')}
                </Text>
              </Pressable>
            );
          })}

          {hasAdminRole ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => onNavigate('admin')}
              style={(state) => [styles.card, styles.adminCard, shadows.card, ...interactiveStateStyles(state, { kind: 'card' })]}
            >
              <View style={[styles.statusChip, styles.adminStatus]}>
                <Text style={[styles.statusChipText, styles.adminStatusText]}>ADMIN</Text>
              </View>
              <Text style={styles.cardTitle}>{translateText('관리자 콘솔')}</Text>
              <Text style={styles.cardSummary}>
                {translateText('사용자 상태와 관리자 운영 데이터를 확인하고 처리할 수 있습니다.')}
              </Text>
              <Text style={[styles.cardLink, styles.defaultLink]}>{translateText('콘솔로 이동 ->')}</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>현재 연결 상태</Text>
          <Text style={styles.noticeText}>
              일정 화면에서는 날짜와 시간 입력, 칸반 화면에서는 태스크 상태 변경과 일정 연결, 커뮤니티 화면에서는 게시글과
              댓글 흐름을 확인할 수 있습니다. 학습 통계 화면에서는 집중 시간과 완료율 흐름을 그래프로 확인할 수 있습니다.
            </Text>
          </View>
      </ScrollView>
      <FeatureGuideModal
        onClose={() => setShowAIGuide(false)}
        onContinue={continueToAILearning}
        visible={showAIGuide}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 56,
    gap: 28
  },
  hero: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20
  },
  heroCopy: {
    flex: 1,
    minWidth: 240,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 26,
    backgroundColor: colors.mintSoft
  },
  eyebrow: {
    color: colors.mintDeep,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 14
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    lineHeight: 39,
    fontWeight: '800'
  },
  titleWritingPhrase: {
    color: colors.mintDeep,
    fontWeight: '800'
  },
  titleWritingCursor: {
    color: colors.blueDeep,
    fontWeight: '800'
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 14
  },
  heroButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 24
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: colors.blue,
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.blue,
    ...interactions.transition
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '800'
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    justifyContent: 'center',
    ...interactions.transition
  },
  secondaryButtonText: {
    color: colors.blueDeep,
    fontSize: 14,
    fontWeight: '800'
  },
  profileCard: {
    width: 260,
    maxWidth: '100%',
    minHeight: 280,
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },
  avatarText: {
    color: colors.blue,
    fontSize: 28,
    fontWeight: '800'
  },
  userName: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800'
  },
  userLoginId: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 6
  },
  memberBadge: {
    marginTop: 16,
    borderRadius: 999,
    backgroundColor: colors.blueSoft,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  memberBadgeText: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  logoutButton: {
    marginTop: 18,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 18,
    justifyContent: 'center',
    ...interactions.transition
  },
  logoutButtonText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800'
  },
  motivationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18
  },
  motivationCard: {
    flex: 1,
    minWidth: 260,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 22,
    gap: 16
  },
  quickQuizCard: {
    flex: 1,
    minWidth: 260,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.mint,
    backgroundColor: colors.mintSoft,
    padding: 22,
    gap: 16
  },
  motivationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12
  },
  motivationEyebrow: {
    color: colors.mintDeep,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  motivationTitle: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: '900',
    marginTop: 6
  },
  optInChip: {
    borderRadius: 999,
    backgroundColor: colors.blueSoft,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  optInChipText: {
    color: colors.blueDeep,
    fontSize: 11,
    fontWeight: '800'
  },
  motivationText: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 24
  },
  motivationActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12
  },
  motivationButton: {
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.blue,
    paddingHorizontal: 16,
    justifyContent: 'center',
    ...interactions.transition
  },
  motivationButtonText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '800'
  },
  motivationNote: {
    flex: 1,
    minWidth: 180,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18
  },
  skipQuizButton: {
    minHeight: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    justifyContent: 'center',
    ...interactions.transition
  },
  skipQuizText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800'
  },
  quickQuizQuestion: {
    color: colors.ink,
    fontSize: 16,
    lineHeight: 25,
    fontWeight: '800'
  },
  quickQuizOptions: {
    gap: 10
  },
  quickQuizOption: {
    minHeight: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    justifyContent: 'center',
    ...interactions.transition
  },
  quickQuizOptionSelected: {
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft
  },
  quickQuizOptionCorrect: {
    borderColor: colors.mintDeep,
    backgroundColor: colors.successSoft
  },
  quickQuizOptionText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700'
  },
  quickQuizOptionTextSelected: {
    color: colors.blueDeep
  },
  quickQuizOptionTextCorrect: {
    color: colors.success
  },
  quizResultSuccess: {
    borderRadius: 16,
    backgroundColor: colors.successSoft,
    padding: 14,
    gap: 6
  },
  quizResultInfo: {
    borderRadius: 16,
    backgroundColor: colors.blueSoft,
    padding: 14,
    gap: 6
  },
  quizResultSuccessText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '800'
  },
  quizResultInfoText: {
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '800'
  },
  quizExplanation: {
    color: colors.ink,
    fontSize: 12,
    lineHeight: 19
  },
  quickQuizHint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 19
  },
  quizHiddenBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 6
  },
  quizRestoreButton: {
    alignSelf: 'flex-start',
    marginTop: 4
  },
  planningPanel: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 22,
    gap: 18
  },
  planningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 16
  },
  planningEyebrow: {
    color: colors.blueDeep,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  planningTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 6
  },
  planningSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6
  },
  planningSummaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  planningSummaryChip: {
    minWidth: 104,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  planningSummaryValue: {
    color: colors.blue,
    fontSize: 20,
    fontWeight: '900'
  },
  planningSummaryLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2
  },
  planningGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  planningColumn: {
    flex: 1,
    minWidth: 280,
    gap: 10
  },
  previewColumnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap'
  },
  previewColumnTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900'
  },
  previewLinkButton: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 12,
    justifyContent: 'center',
    ...interactions.transition
  },
  previewLinkText: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '800'
  },
  previewItem: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 12
  },
  previewItemMarker: {
    width: 8,
    borderRadius: 999,
    backgroundColor: colors.mint
  },
  taskPreviewMarker: {
    backgroundColor: colors.blue
  },
  previewItemCopy: {
    flex: 1,
    minWidth: 0
  },
  previewItemTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800'
  },
  previewItemMeta: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4
  },
  previewEmptyBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 14,
    gap: 6
  },
  rewardPanel: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 24,
    gap: 20
  },
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12
  },
  rewardTitle: {
    color: colors.blueDeep,
    fontSize: 24,
    fontWeight: '800'
  },
  rewardSubtitle: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22
  },
  refreshButton: {
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 16,
    justifyContent: 'center',
    ...interactions.transition
  },
  refreshButtonDisabled: {
    opacity: 0.6
  },
  refreshButtonText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800'
  },
  rewardSkeletonShell: {
    gap: 18
  },
  rewardSkeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14
  },
  rewardSkeletonButton: {
    borderRadius: 999
  },
  rewardSkeletonStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14
  },
  rewardSkeletonPointCard: {
    flexGrow: 1,
    minWidth: 220,
    minHeight: 144,
    borderRadius: 24,
    padding: 20,
    gap: 18,
    backgroundColor: colors.blueSoft
  },
  rewardSkeletonMetricCard: {
    flexGrow: 1,
    minWidth: 180,
    minHeight: 118,
    borderRadius: 24,
    padding: 20,
    gap: 18,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.line
  },
  rewardSkeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18
  },
  rewardSkeletonPanel: {
    flex: 1,
    minWidth: 280,
    borderRadius: 22,
    padding: 18,
    gap: 14,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.line
  },
  rewardStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14
  },
  statCard: {
    flexGrow: 1,
    minWidth: 220,
    borderRadius: 24,
    padding: 20
  },
  pointCard: {
    backgroundColor: colors.blue,
    minHeight: 144
  },
  statLabel: {
    color: colors.blueSoft,
    fontSize: 13,
    fontWeight: '700'
  },
  pointValue: {
    color: colors.surface,
    fontSize: 34,
    fontWeight: '900',
    marginTop: 14
  },
  statHint: {
    color: colors.blueSoft,
    fontSize: 12,
    lineHeight: 20,
    marginTop: 8
  },
  metricCard: {
    flexGrow: 1,
    minWidth: 180,
    borderRadius: 24,
    padding: 20,
    backgroundColor: colors.mintSoft
  },
  metricLabel: {
    color: colors.mintDeep,
    fontSize: 13,
    fontWeight: '700'
  },
  metricValue: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '900',
    marginTop: 16
  },
  storyCard: {
    flexGrow: 1,
    minWidth: 240,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm
  },
  storyLabel: {
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '800'
  },
  storyText: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12
  },
  errorBanner: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.dangerSoft
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 20
  },
  successBanner: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.successSoft
  },
  successText: {
    color: colors.success,
    fontSize: 13,
    lineHeight: 20
  },
  rewardDetailsBar: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  rewardDetailsText: {
    flex: 1,
    minWidth: 220,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20
  },
  rewardDetailsToggle: {
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 9,
    justifyContent: 'center',
    alignItems: 'center'
  },
  rewardDetailsToggleText: {
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '900'
  },
  rewardContentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18
  },
  questColumn: {
    flex: 2,
    minWidth: 260,
    gap: 12
  },
  badgeColumn: {
    flex: 1,
    minWidth: 280,
    gap: 12
  },
  subsectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4
  },
  subsectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800'
  },
  subsectionMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700'
  },
  questCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 14
  },
  progressQuest: {
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm
  },
  achievedQuest: {
    borderColor: colors.mint,
    backgroundColor: colors.successSoft
  },
  claimedQuest: {
    borderColor: colors.blueSoft,
    backgroundColor: colors.blueSoft
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12
  },
  questCopy: {
    flex: 1,
    gap: 6
  },
  questTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800'
  },
  questDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20
  },
  questStatusChip: {
    borderRadius: 999,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  questStatusText: {
    color: colors.blueDeep,
    fontSize: 11,
    fontWeight: '800'
  },
  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.surface
  },
  progressBar: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.mintDeep
  },
  questFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12
  },
  questProgress: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700'
  },
  questReward: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4
  },
  claimButton: {
    minHeight: 42,
    borderRadius: 999,
    backgroundColor: colors.blue,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.blue,
    ...interactions.transition
  },
  claimButtonDisabled: {
    opacity: 0.65
  },
  claimButtonText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '800'
  },
  questTag: {
    minHeight: 38,
    borderRadius: 999,
    paddingHorizontal: 14,
    justifyContent: 'center',
    backgroundColor: colors.surface
  },
  questTagText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800'
  },
  badgeCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 16
  },
  badgeIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    resizeMode: 'cover'
  },
  badgeIconText: {
    fontSize: 20
  },
  badgeCopy: {
    flex: 1,
    gap: 4
  },
  badgeTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800'
  },
  badgeDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  transactionReason: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700'
  },
  transactionMeta: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 11
  },
  transactionAmount: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '900'
  },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 18,
    gap: 6
  },
  emptyActionButton: {
    alignSelf: 'flex-start',
    minHeight: 38,
    borderRadius: 999,
    backgroundColor: colors.blueSoft,
    paddingHorizontal: 14,
    justifyContent: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.blueSoft,
    ...interactions.transition
  },
  emptyActionText: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '800'
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800'
  },
  emptyText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 19
  },
  collapsibleSection: {
    gap: 12
  },
  collapsibleToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...interactions.transition
  },
  collapsibleTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800'
  },
  collapsibleMeta: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '800'
  },
  moreButton: {
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...interactions.transition
  },
  moreButtonText: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '800'
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  sectionTitle: {
    fontSize: 24,
    color: colors.ink,
    fontWeight: '800'
  },
  sectionSub: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 14
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14
  },
  card: {
    flexGrow: 1,
    flexBasis: 280,
    minWidth: 250,
    minHeight: 180,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line,
    ...interactions.transition
  },
  cardDisabled: {
    opacity: 0.78
  },
  defaultCard: {
    backgroundColor: colors.surface
  },
  featuredCard: {
    backgroundColor: colors.blue,
    borderColor: colors.blue
  },
  mintCard: {
    backgroundColor: colors.mintSoft
  },
  warmCard: {
    backgroundColor: colors.surfaceWarm
  },
  greenCard: {
    backgroundColor: colors.successSoft,
    borderColor: colors.mint
  },
  adminCard: {
    backgroundColor: colors.blueSoft
  },
  statusChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 16
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '800'
  },
  featuredStatus: {
    backgroundColor: 'rgba(255,255,255,0.18)'
  },
  featuredStatusText: {
    color: colors.surface
  },
  readyStatus: {
    backgroundColor: colors.surface
  },
  readyStatusText: {
    color: colors.mintDeep
  },
  greenStatus: {
    backgroundColor: colors.surface
  },
  greenStatusText: {
    color: colors.success
  },
  pendingStatus: {
    backgroundColor: colors.mintSoft
  },
  pendingStatusText: {
    color: colors.mintDeep
  },
  adminStatus: {
    backgroundColor: colors.cream
  },
  adminStatusText: {
    color: colors.blue
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 10
  },
  defaultTitle: {
    color: colors.ink
  },
  featuredTitle: {
    color: colors.surface
  },
  greenTitle: {
    color: colors.success
  },
  cardSummary: {
    fontSize: 13,
    lineHeight: 21,
    flex: 1
  },
  defaultSummary: {
    color: colors.muted
  },
  featuredSummary: {
    color: colors.blueSoft
  },
  cardLink: {
    marginTop: 16,
    fontSize: 13,
    fontWeight: '800'
  },
  defaultLink: {
    color: colors.blueDeep
  },
  featuredLink: {
    color: colors.mint
  },
  greenLink: {
    color: colors.success
  },
  pendingLink: {
    color: colors.muted
  },
  noticeCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    gap: 8
  },
  noticeTitle: {
    color: colors.blueDeep,
    fontSize: 14,
    fontWeight: '800'
  },
  noticeText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 22
  }
});
