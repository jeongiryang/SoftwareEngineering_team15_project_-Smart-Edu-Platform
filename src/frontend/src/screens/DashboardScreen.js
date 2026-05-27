import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, shadows } from '../styles/theme';

const featureCards = [
  {
    label: 'AI 학습 센터',
    summary: '질문, 추천, 요약, 오답 분석을 한 화면에서 바로 이어갑니다.',
    status: '사용 가능',
    screen: 'aiLearning',
    tone: 'featured'
  },
  {
    label: '학습 일정',
    summary: '날짜와 시간을 나눠 입력하며 일정 CRUD를 정리합니다.',
    status: '사용 가능',
    screen: 'schedule',
    tone: 'mint'
  },
  {
    label: '칸반 보드',
    summary: '연결 일정과 함께 할 일을 TODO부터 DONE까지 관리합니다.',
    status: '사용 가능',
    screen: 'taskBoard',
    tone: 'warm'
  },
  {
    label: '집중 시간',
    summary: '집중 세션 기록과 타이머 연동은 후속 연결 예정입니다.',
    status: 'API 준비됨'
  },
  {
    label: '학습 통계',
    summary: '주간 학습량과 성취도 시각화가 이어서 연결될 예정입니다.',
    status: 'API 준비됨'
  },
  {
    label: '게시판',
    summary: '스터디 기록 공유와 커뮤니티 흐름은 다음 단계에서 붙습니다.',
    status: 'API 준비됨'
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

  return {
    container: styles.defaultCard,
    title: styles.defaultTitle,
    summary: styles.defaultSummary,
    status: styles.pendingStatus,
    statusText: styles.pendingStatusText,
    link: styles.pendingLink
  };
}

export default function DashboardScreen({ onLogout, onNavigate, user }) {
  const hasAdminRole = user?.role === 'ADMIN';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>SAGAKSAGAK DASHBOARD</Text>
          <Text style={styles.title}>{user?.name || '학습자'}님,{'\n'}오늘 학습 흐름을 바로 이어가요</Text>
          <Text style={styles.subtitle}>
            최신 UI/UX PR의 크림, 민트, 딥 블루 톤을 기준으로 현재 연결된 일정, 칸반, AI 화면을 한
            흐름으로 묶었습니다.
          </Text>
          <View style={styles.heroButtonRow}>
            <Pressable onPress={() => onNavigate('aiLearning')} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>AI 학습 센터</Text>
            </Pressable>
            <Pressable onPress={() => onNavigate('schedule')} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>일정 바로 보기</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.profileCard, shadows.card]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.slice(0, 1) || '학'}</Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{hasAdminRole ? 'ADMIN ACCOUNT' : 'LEARNER ACCOUNT'}</Text>
          </View>
          <Pressable onPress={onLogout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>로그아웃</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>연결된 학습 기능</Text>
          <Text style={styles.sectionSub}>이미 사용할 수 있는 화면과 후속 연결 대상을 구분해서 보여줍니다.</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {featureCards.map((card) => {
          const cardStyle = getCardStyle(card.tone);

          return (
            <Pressable
              key={card.label}
              disabled={!card.screen}
              onPress={card.screen ? () => onNavigate(card.screen) : undefined}
              style={[styles.card, cardStyle.container, shadows.card]}
            >
              <View style={[styles.statusChip, cardStyle.status]}>
                <Text style={[styles.statusChipText, cardStyle.statusText]}>{card.status}</Text>
              </View>
              <Text style={[styles.cardTitle, cardStyle.title]}>{card.label}</Text>
              <Text style={[styles.cardSummary, cardStyle.summary]}>{card.summary}</Text>
              <Text style={[styles.cardLink, cardStyle.link]}>
                {card.screen ? '화면으로 이동  ->' : '연결 준비 중'}
              </Text>
            </Pressable>
          );
        })}

        {hasAdminRole ? (
          <Pressable onPress={() => onNavigate('admin')} style={[styles.card, styles.adminCard, shadows.card]}>
            <View style={[styles.statusChip, styles.adminStatus]}>
              <Text style={[styles.statusChipText, styles.adminStatusText]}>ADMIN</Text>
            </View>
            <Text style={styles.cardTitle}>관리자 콘솔</Text>
            <Text style={styles.cardSummary}>사용자 상태와 관리자용 데이터 조회 흐름을 확인할 수 있습니다.</Text>
            <Text style={[styles.cardLink, styles.defaultLink]}>콘솔로 이동  -></Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>현재 테스트 포인트</Text>
        <Text style={styles.noticeText}>
          일정 화면에서는 날짜와 시간 분리 입력, 태스크 화면에서는 상태 변경과 일정 연결, AI 화면에서는 기존
          학습 지원 흐름을 함께 확인하면 됩니다.
        </Text>
      </View>
    </ScrollView>
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
    paddingHorizontal: 24,
    paddingTop: 32,
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
    minWidth: 280,
    borderRadius: 28,
    paddingHorizontal: 32,
    paddingVertical: 30,
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
    fontSize: 32,
    lineHeight: 42,
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
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    justifyContent: 'center'
  },
  secondaryButtonText: {
    color: colors.blueDeep,
    fontSize: 14,
    fontWeight: '800'
  },
  profileCard: {
    width: 280,
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
  userEmail: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 6
  },
  badge: {
    marginTop: 16,
    borderRadius: 999,
    backgroundColor: colors.blueSoft,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  badgeText: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  logoutButton: {
    marginTop: 20,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 18,
    justifyContent: 'center'
  },
  logoutButtonText: {
    color: colors.ink,
    fontSize: 13,
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
    width: '31.9%',
    minWidth: 260,
    minHeight: 180,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line
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
  cardSummary: {
    fontSize: 13,
    lineHeight: 21,
    flex: 1
  },
  defaultSummary: {
    color: colors.muted
  },
  featuredSummary: {
    color: '#D8E6F6'
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
