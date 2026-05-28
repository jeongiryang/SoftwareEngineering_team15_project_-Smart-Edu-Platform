import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../styles/theme';

const icon = require('../assets/sagaksagak-app-icon.png');

export default function AppHeader({ activeScreen, onLogout, onNavigate, user }) {
  const authenticated = Boolean(user);
  const hasAdminRole = user?.role === 'ADMIN';

  function NavItem({ label, screen }) {
    const active = activeScreen === screen;

    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => onNavigate(screen)}
        style={({ pressed }) => [styles.navItem, active && styles.navItemActive, pressed && styles.buttonPressed]}
      >
        <Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.shell}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onNavigate(authenticated ? 'dashboard' : 'home')}
          style={({ pressed }) => [styles.brand, pressed && styles.buttonPressed]}
        >
          <Image source={icon} style={styles.logo} />
          <View>
            <Text style={styles.brandName}>사각사각</Text>
            <Text style={styles.brandSub}>Smart Edu Platform</Text>
          </View>
        </Pressable>

        <View style={styles.nav}>
          {authenticated ? (
            <>
              <NavItem label="대시보드" screen="dashboard" />
              <NavItem label="AI 학습" screen="aiLearning" />
              <NavItem label="접근성" screen="accessibility" />
              <NavItem label="커뮤니티" screen="community" />
              <NavItem label="일정" screen="schedule" />
              <NavItem label="칸반" screen="taskBoard" />
              {hasAdminRole ? <NavItem label="관리자" screen="admin" /> : null}
            </>
          ) : (
            <>
              <NavItem label="서비스 소개" screen="home" />
              <NavItem label="로그인" screen="login" />
            </>
          )}
        </View>

        <View style={styles.actions}>
          {authenticated ? (
            <>
              <Text style={styles.userLabel}>{user.name}님</Text>
              <Pressable
                accessibilityRole="button"
                onPress={onLogout}
                style={({ pressed }) => [styles.outlineButton, pressed && styles.buttonPressed]}
              >
                <Text style={styles.outlineText}>로그아웃</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => onNavigate('register')}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.primaryText}>무료로 시작하기</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    alignItems: 'center'
  },
  header: {
    width: '100%',
    maxWidth: 1180,
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 150,
    flexShrink: 1
  },
  logo: {
    height: 47,
    width: 47,
    borderRadius: 13
  },
  brandName: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: 0
  },
  brandSub: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600'
  },
  nav: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    flexShrink: 1,
    justifyContent: 'center',
    minWidth: 0
  },
  navItem: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 11,
    borderRadius: 22
  },
  navItemActive: {
    backgroundColor: colors.mintSoft
  },
  navText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700'
  },
  navTextActive: {
    color: colors.mintDeep
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    minWidth: 0
  },
  userLabel: {
    color: colors.ink,
    fontWeight: '700',
    fontSize: 14
  },
  primaryButton: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 23,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700'
  },
  outlineButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center'
  },
  outlineText: {
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '700'
  },
  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }]
  }
});
