import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeMode } from '../contexts/ThemeContext';
import { useLanguage } from '../i18n';
import { colors, interactions, interactiveStateStyles } from '../styles/theme';

const icon = require('../assets/sagaksagak-app-icon.png');

export default function AppHeader({ activeScreen, onLogout, onNavigate, user }) {
  const authenticated = Boolean(user);
  const hasAdminRole = user?.role === 'ADMIN';
  const { effectiveMode, mode, toggleThemeMode } = useThemeMode();
  const {
    currentLanguage,
    isBetaLanguage: isLanguageBeta,
    languageLabel: getLanguageLabel,
    setLanguage,
    supportedLanguages,
    t,
    translateText
  } = useLanguage();
  const targetThemeLabel = translateText(mode === 'dark' ? '라이트 모드' : '다크 모드');
  const currentThemeLabel = translateText(effectiveMode === 'highContrast'
    ? '고대비'
    : mode === 'dark' ? '다크' : '라이트');
  const displayName = user?.nickname || user?.name || user?.displayName || translateText('사용자');

  function NavItem({ label, screen }) {
    const active = activeScreen === screen;

    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => onNavigate(screen)}
        style={(state) => [
          styles.navItem,
          active && styles.navItemActive,
          state.hovered && !active && styles.navItemHover,
          ...interactiveStateStyles(state),
          active && state.focused && styles.navItemActiveFocus
        ]}
      >
        <Text style={[styles.navText, active && styles.navTextActive]}>{translateText(label)}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.shell}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onNavigate(authenticated ? 'dashboard' : 'home')}
          style={(state) => [styles.brand, state.hovered && styles.brandHover, ...interactiveStateStyles(state)]}
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
              <NavItem label="프로필" screen="profile" />
              <NavItem label="통계" screen="statistics" />
              <NavItem label="친구" screen="friends" />
              <NavItem label="AI 학습" screen="aiLearning" />
              <NavItem label="접근성" screen="accessibility" />
              <NavItem label="커뮤니티" screen="community" />
              <NavItem label="일정" screen="schedule" />
              <NavItem label="칸반" screen="taskBoard" />
              <NavItem label="레이드" screen="bossRaid" />
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
          <LanguageSelector
            currentLanguage={currentLanguage}
            getLanguageLabel={getLanguageLabel}
            isLanguageBeta={isLanguageBeta}
            onChangeLanguage={setLanguage}
            supportedLanguages={supportedLanguages}
            t={t}
          />
          <Pressable
            accessibilityLabel={targetThemeLabel}
            accessibilityRole="button"
            onPress={toggleThemeMode}
            style={(state) => [
              styles.themeToggle,
              mode === 'dark' && styles.themeToggleDark,
              effectiveMode === 'highContrast' && styles.themeToggleHighContrast,
              ...interactiveStateStyles(state)
            ]}
            title={targetThemeLabel}
          >
            <ThemeIcon mode={mode} />
            <Text style={styles.themeToggleText}>{currentThemeLabel}</Text>
          </Pressable>

          {authenticated ? (
            <>
              <Text style={styles.userLabel}>{displayName}님</Text>
              <Pressable
                accessibilityRole="button"
                onPress={onLogout}
                style={(state) => [styles.outlineButton, ...interactiveStateStyles(state)]}
              >
                <Text style={styles.outlineText}>로그아웃</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => onNavigate('register')}
              style={(state) => [styles.primaryButton, ...interactiveStateStyles(state)]}
            >
              <Text style={styles.primaryText}>무료로 시작하기</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

function LanguageSelector({
  currentLanguage,
  getLanguageLabel,
  isLanguageBeta,
  onChangeLanguage,
  supportedLanguages,
  t
}) {
  const betaLabel = t('language.betaBadge', 'Beta');

  return (
    <View
      accessibilityLabel={t('language.selectorLabel', '언어 선택')}
      accessibilityRole="radiogroup"
      dataSet={{ sagakI18nIgnore: 'true' }}
      style={styles.languageSelector}
    >
      {supportedLanguages.map((option) => {
        const active = option.code === currentLanguage;
        const beta = isLanguageBeta(option.code);

        return (
          <Pressable
            accessibilityLabel={`${getLanguageLabel(option.code)}${beta ? ` ${betaLabel}` : ''}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            dataSet={{ sagakI18nIgnore: 'true' }}
            key={option.code}
            onPress={() => onChangeLanguage(option.code)}
            style={(state) => [
              styles.languageOption,
              active && styles.languageOptionActive,
              state.hovered && !active && styles.languageOptionHover,
              ...interactiveStateStyles(state)
            ]}
            title={`${getLanguageLabel(option.code)}${beta ? ` ${betaLabel}` : ''}`}
          >
            <Text style={[styles.languageOptionText, active && styles.languageOptionTextActive]}>
              {getLanguageLabel(option.code)}
            </Text>
            {beta ? (
              <View style={[styles.languageBetaBadge, active && styles.languageBetaBadgeActive]}>
                <Text style={[styles.languageBetaText, active && styles.languageBetaTextActive]}>
                  {betaLabel}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function ThemeIcon({ mode }) {
  if (mode === 'dark') {
    return (
      <View style={styles.moonIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.moonBody} />
        <View style={styles.moonCutout} />
      </View>
    );
  }

  return (
    <View style={styles.sunIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.sunCore} />
      <View style={[styles.sunRay, styles.sunRayVertical]} />
      <View style={[styles.sunRay, styles.sunRayHorizontal]} />
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
    flexShrink: 1,
    borderRadius: 18,
    padding: 4,
    borderWidth: 1,
    borderColor: 'transparent',
    ...interactions.transition
  },
  brandHover: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.line
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
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  navItemActive: {
    backgroundColor: colors.mintSoft,
    borderColor: colors.mint
  },
  navItemHover: {
    backgroundColor: colors.surfaceWarm
  },
  navItemActiveFocus: {
    borderColor: colors.blue
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
  languageSelector: {
    minHeight: 38,
    maxWidth: 360,
    padding: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3
  },
  languageOption: {
    minHeight: 30,
    paddingHorizontal: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...interactions.transition
  },
  languageOptionHover: {
    backgroundColor: colors.surface
  },
  languageOptionActive: {
    borderColor: colors.mint,
    backgroundColor: colors.mintSoft
  },
  languageOptionText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800'
  },
  languageOptionTextActive: {
    color: colors.mintDeep
  },
  languageBetaBadge: {
    minHeight: 15,
    paddingHorizontal: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface
  },
  languageBetaBadgeActive: {
    borderColor: colors.mint,
    backgroundColor: colors.surface
  },
  languageBetaText: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '700'
  },
  languageBetaTextActive: {
    color: colors.mintDeep
  },
  themeToggle: {
    minHeight: 38,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...interactions.transition
  },
  themeToggleDark: {
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft
  },
  themeToggleHighContrast: {
    borderColor: colors.line,
    backgroundColor: colors.surface
  },
  themeToggleText: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '800'
  },
  sunIcon: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  sunCore: {
    width: 8,
    height: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.blueDeep
  },
  sunRay: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: colors.blueDeep
  },
  sunRayVertical: {
    width: 2,
    height: 18
  },
  sunRayHorizontal: {
    width: 18,
    height: 2
  },
  moonIcon: {
    width: 18,
    height: 18,
    position: 'relative'
  },
  moonBody: {
    width: 16,
    height: 16,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.blueDeep,
    backgroundColor: colors.blueDeep
  },
  moonCutout: {
    position: 'absolute',
    right: -1,
    top: 1,
    width: 13,
    height: 13,
    borderRadius: 999,
    backgroundColor: colors.blueSoft
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
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    ...interactions.transition
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
    justifyContent: 'center',
    ...interactions.transition
  },
  outlineText: {
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '700'
  }
});
