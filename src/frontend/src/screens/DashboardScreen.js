import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAccessibility } from '../contexts/AccessibilityContext';

const featureCards = [
  '학습 일정',
  '칸반 보드',
  'AI 학습 질의',
  '음성/접근성',
  '집중 시간',
  '학습 통계',
  '게시판'
];

export default function DashboardScreen({ onLogout, onNavigate, user }) {
  const { preference } = useAccessibility();
  const isKid = preference.elementaryFriendlyUi;
  const hasAdminRole = user?.role === 'ADMIN';

  const titleText = isKid ? '🎒 초등학생 공부 센터' : 'Smart Edu Platform';
  const subtitleText = isKid ? '쉽고 재미있는 공부 방에 오신 걸 환영해요!' : '개인화 학습 관리 대시보드';
  const logoutText = isKid ? '👋 공부 마칠래요 (로그아웃)' : '로그아웃';

  const featureLabelMap = {
    '학습 일정': '📅 공부 달력 (일정)',
    '칸반 보드': '📋 할 일 놀이터 (칸반)',
    'AI 학습 질의': '🤖 AI 공부 친구',
    '음성/접근성': '🎒 도움 센터 (음성)',
    '집중 시간': '⏳ 집중 타이머',
    '학습 통계': '📊 공부 결과 (통계)',
    '게시판': '💬 이야기방 (게시판)'
  };

  const cards = featureCards.map((label) => (isKid ? (featureLabelMap[label] || label) : label));

  const scaledText = (baseSize) => ({
    fontSize: Math.round(baseSize * preference.textScale)
  });

  const themeContainer = preference.highContrast ? [styles.container, styles.highContrastBg] : styles.container;
  const themeCard = (isAI, isAccess) => [
    styles.card,
    isAI && styles.aiCard,
    isAccess && styles.accessibilityCard,
    preference.highContrast && styles.highContrastCard
  ];
  const themeCardText = (isAI, isAccess) => [
    styles.cardText,
    isAI && styles.aiCardText,
    isAccess && styles.accessibilityCardText,
    scaledText(16),
    preference.highContrast && styles.highContrastCardText
  ];

  return (
    <View style={themeContainer}>
      <View style={styles.header}>
        <Text style={[styles.title, scaledText(28), preference.highContrast && styles.highContrastText]}>
          {titleText}
        </Text>
        <Text style={[styles.subtitle, scaledText(16), preference.highContrast && styles.highContrastSubText]}>
          {subtitleText}
        </Text>
        {user ? (
          <View style={[styles.userBox, preference.highContrast && styles.highContrastCard]}>
            <View style={styles.userInfoRow}>
              <Text style={[styles.userName, scaledText(16), preference.highContrast && styles.highContrastText]}>
                {user.name}
              </Text>
              {hasAdminRole && (
                <View style={styles.adminBadge}>
                  <Text style={[styles.adminBadgeText, scaledText(10)]}>
                    {isKid ? '🛠️ 선생님' : 'ADMIN'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.userEmail, scaledText(14), preference.highContrast && styles.highContrastSubText]}>
              {user.email}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.grid}>
        {featureCards.map((label, index) => {
          const displayLabel = cards[index];
          const isAIFeature = label === 'AI 학습 질의';
          const isAccessibilityFeature = label === '음성/접근성';

          return (
            <Pressable
              key={label}
              onPress={
                isAIFeature
                  ? () => onNavigate('aiLearning')
                  : isAccessibilityFeature
                    ? () => onNavigate('accessibility')
                    : undefined
              }
              style={themeCard(isAIFeature, isAccessibilityFeature)}
            >
              <Text style={themeCardText(isAIFeature, isAccessibilityFeature)}>
                {displayLabel}
              </Text>
              {isAIFeature && (
                <View style={styles.aiBadge}>
                  <Text style={[styles.aiBadgeText, scaledText(10)]}>
                    {isKid ? '🤖 도와줘요' : 'AI 헬퍼'}
                  </Text>
                </View>
              )}
              {isAccessibilityFeature && (
                <View style={styles.readyBadge}>
                  <Text style={[styles.readyBadgeText, scaledText(10)]}>
                    {isKid ? '🔊 목소리' : '음성 지원'}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
        {hasAdminRole && (
          <Pressable
            onPress={() => onNavigate('admin')}
            style={[
              styles.card,
              styles.adminCard,
              preference.highContrast && styles.highContrastCard
            ]}
          >
            <Text style={[
              styles.cardText,
              styles.adminCardText,
              scaledText(16),
              preference.highContrast && styles.highContrastCardText
            ]}>
              {isKid ? '🛠️ 선생님 관리 도구' : '관리자 콘솔'}
            </Text>
            <Text style={[
              styles.adminCardSubText,
              scaledText(11),
              preference.highContrast && styles.highContrastSubText
            ]}>
              {isKid ? '학생 정보와 과제를 살펴봐요' : '사용자 및 콘텐츠 관리'}
            </Text>
          </Pressable>
        )}
      </View>
      <Pressable
        onPress={onLogout}
        style={[
          styles.logoutButton,
          preference.highContrast && styles.highContrastCard
        ]}
      >
        <Text style={[
          styles.logoutButtonText,
          scaledText(16),
          preference.highContrast && styles.highContrastText
        ]}>
          {logoutText}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 20,
    backgroundColor: '#F7F8FA'
  },
  highContrastBg: {
    backgroundColor: '#050505'
  },
  highContrastCard: {
    backgroundColor: '#1E293B',
    borderColor: '#475569',
    borderWidth: 2
  },
  highContrastCardText: {
    color: '#FFFFFF'
  },
  highContrastText: {
    color: '#FFFFFF'
  },
  highContrastSubText: {
    color: '#FDE68A'
  },
  header: {
    marginTop: 24,
    gap: 6
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937'
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280'
  },
  userBox: {
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    padding: 12
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  userName: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700'
  },
  adminBadge: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  adminBadgeText: {
    color: '#4F46E5',
    fontSize: 10,
    fontWeight: '800'
  },
  userEmail: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 2
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  card: {
    width: '47%',
    minHeight: 88,
    borderRadius: 8,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative'
  },
  adminCard: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
    borderWidth: 1.5,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  cardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151'
  },
  aiCard: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE'
  },
  aiCardText: {
    color: '#4F46E5'
  },
  accessibilityCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981'
  },
  accessibilityCardText: {
    color: '#047857'
  },
  aiBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#6366F1',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  aiBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700'
  },
  readyBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#059669',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  readyBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700'
  },
  adminCardText: {
    color: '#4F46E5',
    fontWeight: '700'
  },
  adminCardSubText: {
    color: '#818CF8',
    fontSize: 11,
    marginTop: 4
  },
  logoutButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16
  },
  logoutButtonText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '700'
  }
});

