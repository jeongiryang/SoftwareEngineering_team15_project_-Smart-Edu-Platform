import { Button, StyleSheet, Text, View } from 'react-native';

const featureCards = [
  '학습 일정',
  '칸반 보드',
  'AI 학습 질의',
  '집중 시간',
  '학습 통계',
  '게시판'
];

export default function DashboardScreen({ onNavigate }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Smart Edu Platform</Text>
        <Text style={styles.subtitle}>개인화 학습 관리 대시보드</Text>
      </View>
      <View style={styles.grid}>
        {featureCards.map((label) => (
          <View key={label} style={styles.card}>
            <Text style={styles.cardText}>{label}</Text>
          </View>
        ))}
      </View>
      <Button title="로그아웃" onPress={() => onNavigate('login')} />
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
    borderColor: '#E5E7EB'
  },
  cardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151'
  }
});
