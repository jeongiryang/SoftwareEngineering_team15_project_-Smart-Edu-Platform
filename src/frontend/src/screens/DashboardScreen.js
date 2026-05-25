import { Pressable, StyleSheet, Text, View } from 'react-native';

const featureCards = [
  '학습 일정',
  '칸반 보드',
  'AI 학습 질의',
  '집중 시간',
  '학습 통계',
  '게시판'
];

export default function DashboardScreen({ onLogout, onNavigate, user }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Smart Edu Platform</Text>
        <Text style={styles.subtitle}>개인화 학습 관리 대시보드</Text>
        {user ? (
          <View style={styles.userBox}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.grid}>
        {featureCards.map((label) => {
          const isAIFeature = label === 'AI 학습 질의';
          return (
            <Pressable 
              key={label} 
              onPress={isAIFeature ? () => onNavigate('aiLearning') : null}
              style={[styles.card, isAIFeature && styles.aiCard]}
            >
              <Text style={[styles.cardText, isAIFeature && styles.aiCardText]}>{label}</Text>
              {isAIFeature && (
                <View style={styles.aiBadge}>
                  <Text style={styles.aiBadgeText}>AI 헬퍼</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
      <Pressable onPress={onLogout} style={styles.logoutButton}>
        <Text style={styles.logoutButtonText}>로그아웃</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 20
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
  userName: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700'
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
  cardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151'
  },
  aiCard: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  aiCardText: {
    color: '#4F46E5',
  },
  aiBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#6366F1',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  aiBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
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
