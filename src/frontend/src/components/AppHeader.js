import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeMode } from '../contexts/ThemeContext';
import { useLanguage } from '../i18n';
import { colors, interactions, interactiveStateStyles } from '../styles/theme';

const icon = require('../assets/sagaksagak-app-icon.png');

function formatUnreadBadge(count) {
  const numericCount = Math.max(Number(count) || 0, 0);

  if (numericCount > 99) {
    return '99+';
  }

  return String(numericCount);
}

const authenticatedNavGroups = [
  {
    key: 'study',
    label: '학습',
    items: [
      { label: '대시보드', screen: 'dashboard' },
      { label: '통계', screen: 'statistics' },
      { label: '집중 시간', screen: 'focusTimer' },
      { label: 'AI 학습', screen: 'aiLearning' },
      { label: '일정', screen: 'schedule' },
      { label: '칸반', screen: 'taskBoard' }
    ]
  },
  {
    key: 'social',
    label: '소셜',
    items: [
      { label: '친구', screen: 'friends' },
      { label: '쪽지', screen: 'messages' },
      { label: '커뮤니티', screen: 'community' }
    ]
  },
  {
    key: 'reward',
    label: '보상',
    items: [
      { label: '상점', screen: 'pointShop' },
      { label: '레이드', screen: 'bossRaid' },
      { label: '협동 퀘스트', screen: 'collaborativeQuest' }
    ]
  }
];

export default function AppHeader({ activeScreen, messageUnreadCount = 0, onLogout, onNavigate, user }) {
  const authenticated = Boolean(user);
  const hasAdminRole = user?.role === 'ADMIN';
  const [openMenu, setOpenMenu] = useState(null);
  const { effectiveMode, mode, setThemeMode } = useThemeMode();
  const {
    currentLanguage,
    isBetaLanguage: isLanguageBeta,
    languageLabel: getLanguageLabel,
    setLanguage,
    supportedLanguages,
    t,
    translateText
  } = useLanguage();
  const currentThemeLabel = translateText(effectiveMode === 'highContrast'
    ? '고대비'
    : mode === 'dark' ? '다크' : '라이트');
  const displayName = user?.nickname || user?.name || user?.displayName || translateText('사용자');
  const unreadBadgeText = formatUnreadBadge(messageUnreadCount);

  function NavItem({ label, screen }) {
    const active = activeScreen === screen;

    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setOpenMenu(null);
          onNavigate(screen);
        }}
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

  function NavMenu({ group }) {
    const open = openMenu === group.key;
    const active = group.items.some((item) => item.screen === activeScreen);
    const menuLabel = translateText(group.label);

    return (
      <View style={styles.navMenuWrap}>
        <Pressable
          accessibilityLabel={`${menuLabel} ${translateText(open ? '닫기' : '열기')}`}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          onPress={() => setOpenMenu(open ? null : group.key)}
          style={(state) => [
            styles.navItem,
            styles.navMenuButton,
            active && styles.navItemActive,
            state.hovered && !active && styles.navItemHover,
            ...interactiveStateStyles(state),
            active && state.focused && styles.navItemActiveFocus
          ]}
          title={menuLabel}
        >
          <Text style={[styles.navText, active && styles.navTextActive]}>{menuLabel}</Text>
          <View style={[styles.chevron, open && styles.chevronOpen]} />
        </Pressable>
        {open ? (
          <View accessibilityRole="menu" style={styles.navSubmenu}>
            {group.items.map((item) => (
              <Pressable
                accessibilityRole="menuitem"
                key={item.screen}
                onPress={() => {
                  setOpenMenu(null);
                  onNavigate(item.screen);
                }}
                style={(state) => [
                  styles.navSubmenuItem,
                  activeScreen === item.screen && styles.navSubmenuItemActive,
                  state.hovered && styles.navSubmenuItemHover,
                  ...interactiveStateStyles(state)
                ]}
              >
                <Text
                  style={[
                    styles.navSubmenuText,
                    activeScreen === item.screen && styles.navSubmenuTextActive
                  ]}
                >
                  {translateText(item.label)}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.shell}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onMouseDown={(event) => event?.preventDefault?.()}
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
              {authenticatedNavGroups.map((group) => (
                <NavMenu group={group} key={group.key} />
              ))}
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
          <HeaderSettingsMenu
            currentThemeLabel={currentThemeLabel}
            currentLanguage={currentLanguage}
            effectiveMode={effectiveMode}
            getLanguageLabel={getLanguageLabel}
            isLanguageBeta={isLanguageBeta}
            onChangeLanguage={setLanguage}
            onNavigate={onNavigate}
            onOpen={() => setOpenMenu(null)}
            onSetThemeMode={setThemeMode}
            mode={mode}
            showAccessibility={authenticated}
            supportedLanguages={supportedLanguages}
            t={t}
            translateText={translateText}
          />

          {authenticated ? (
            <>
              <Pressable
                accessibilityLabel={`${translateText('쪽지')} ${messageUnreadCount > 0 ? `${unreadBadgeText} ${t('messages.unreadCount', '읽지 않음')}` : ''}`}
                accessibilityRole="button"
                accessibilityState={{ selected: activeScreen === 'messages' }}
                onPress={() => onNavigate('messages')}
                style={(state) => [
                  styles.iconButton,
                  activeScreen === 'messages' && styles.iconButtonActive,
                  ...interactiveStateStyles(state)
                ]}
                title={translateText('쪽지')}
              >
                <MessageIcon active={activeScreen === 'messages'} />
                {messageUnreadCount > 0 ? (
                  <View style={styles.iconBadge}>
                    <Text style={styles.iconBadgeText}>{unreadBadgeText}</Text>
                  </View>
                ) : null}
              </Pressable>
              <HeaderProfileMenu
                activeScreen={activeScreen}
                displayName={displayName}
                onLogout={onLogout}
                onNavigate={onNavigate}
                translateText={translateText}
              />
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

function HeaderSettingsMenu({
  currentLanguage,
  currentThemeLabel,
  effectiveMode,
  getLanguageLabel,
  isLanguageBeta,
  onChangeLanguage,
  onNavigate,
  onOpen,
  onSetThemeMode,
  mode,
  showAccessibility,
  supportedLanguages,
  t,
  translateText
}) {
  const [open, setOpen] = useState(false);
  const [triggerState, setTriggerState] = useState({
    focused: false,
    hovered: false
  });
  const betaLabel = t('language.betaBadge', 'Beta');
  const selectorLabel = t('language.selectorLabel', '언어 선택');
  const currentLanguageLabel = t('language.currentLabel', '현재 언어');
  const currentLabel = getLanguageLabel(currentLanguage);
  const currentBeta = isLanguageBeta(currentLanguage);
  const currentLanguageSummary = `${currentLabel}${currentBeta ? ` ${betaLabel}` : ''}`;
  const settingsLabel = translateText('설정');
  const modeLabel = translateText('화면 모드');
  const accessibilityLabel = translateText('접근성 설정');
  const lightLabel = translateText('라이트 모드');
  const darkLabel = translateText('다크 모드');
  const highContrastNotice = effectiveMode === 'highContrast'
    ? translateText('고대비')
    : currentThemeLabel;
  const showSettingsTooltip = !open && (triggerState.focused || triggerState.hovered);

  function handleToggle() {
    onOpen?.();
    setOpen((value) => !value);
  }

  function handleAccessibilityPress() {
    setOpen(false);
    onNavigate('accessibility');
  }

  return (
    <View
      style={styles.settingsDropdown}
    >
      <Pressable
        accessibilityLabel={`${settingsLabel}: ${currentLanguageLabel} ${currentLanguageSummary}, ${modeLabel} ${highContrastNotice}`}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onBlur={() => setTriggerState((current) => ({ ...current, focused: false }))}
        onFocus={() => setTriggerState((current) => ({ ...current, focused: true }))}
        onHoverIn={() => setTriggerState((current) => ({ ...current, hovered: true }))}
        onHoverOut={() => setTriggerState((current) => ({ ...current, hovered: false }))}
        onPress={handleToggle}
        style={(state) => [
          styles.settingsTrigger,
          open && styles.settingsTriggerOpen,
          state.hovered && styles.settingsTriggerHover,
          ...interactiveStateStyles(state)
        ]}
        title={settingsLabel}
      >
        <SettingsIcon />
      </Pressable>
      <View
        pointerEvents="none"
        style={[styles.settingsTooltip, showSettingsTooltip && styles.settingsTooltipVisible]}
      >
        <Text style={styles.settingsTooltipTitle}>{settingsLabel}</Text>
        <Text style={styles.settingsTooltipText}>
          {`${currentLanguageLabel}: ${currentLanguageSummary}`}
        </Text>
        <Text style={styles.settingsTooltipText}>{`${modeLabel}: ${highContrastNotice}`}</Text>
      </View>
      {open ? (
        <View accessibilityRole="menu" style={styles.settingsMenu}>
          <View style={styles.settingsSection} dataSet={{ sagakI18nIgnore: 'true' }}>
            <Text style={styles.settingsSectionTitle}>{selectorLabel}</Text>
            <View style={styles.settingsOptionGrid}>
              {supportedLanguages.map((option) => {
                const active = option.code === currentLanguage;
                const beta = isLanguageBeta(option.code);

                return (
                  <Pressable
                    accessibilityLabel={`${getLanguageLabel(option.code)}${beta ? ` ${betaLabel}` : ''}`}
                    accessibilityRole="menuitemradio"
                    accessibilityState={{ checked: active }}
                    dataSet={{ sagakI18nIgnore: 'true' }}
                    key={option.code}
                    onPress={() => onChangeLanguage(option.code)}
                    style={(state) => [
                      styles.settingsOption,
                      active && styles.settingsOptionActive,
                      state.hovered && !active && styles.settingsOptionHover,
                      ...interactiveStateStyles(state)
                    ]}
                    title={`${getLanguageLabel(option.code)}${beta ? ` ${betaLabel}` : ''}`}
                  >
                    <Text style={[styles.settingsOptionText, active && styles.settingsOptionTextActive]}>
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
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.settingsSectionTitle}>{modeLabel}</Text>
            <View style={styles.settingsOptionGrid}>
              {[
                { label: lightLabel, value: 'light' },
                { label: darkLabel, value: 'dark' }
              ].map((option) => {
                const active = option.value === mode;

                return (
                  <Pressable
                    accessibilityLabel={option.label}
                    accessibilityRole="menuitemradio"
                    accessibilityState={{ checked: active }}
                    key={option.value}
                    onPress={() => onSetThemeMode(option.value)}
                    style={(state) => [
                      styles.settingsOption,
                      active && styles.settingsOptionActive,
                      state.hovered && !active && styles.settingsOptionHover,
                      ...interactiveStateStyles(state)
                    ]}
                    title={option.label}
                  >
                    <ThemeIcon mode={option.value} />
                    <Text style={[styles.settingsOptionText, active && styles.settingsOptionTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {showAccessibility ? (
            <Pressable
              accessibilityLabel={accessibilityLabel}
              accessibilityRole="menuitem"
              onPress={handleAccessibilityPress}
              style={(state) => [
                styles.settingsAccessibilityLink,
                state.hovered && styles.settingsOptionHover,
                ...interactiveStateStyles(state)
              ]}
              title={accessibilityLabel}
            >
              <Text style={styles.settingsAccessibilityText}>{accessibilityLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function HeaderProfileMenu({ activeScreen, displayName, onLogout, onNavigate, translateText }) {
  const [open, setOpen] = useState(false);
  const profileLabel = translateText('마이페이지');
  const accountLabel = translateText('계정 설정');
  const learningFlowLabel = translateText('학습 흐름');
  const logoutLabel = translateText('로그아웃');

  function handleNavigate(screen, params = null) {
    setOpen(false);
    onNavigate(screen, params ? { params } : undefined);
  }

  return (
    <View style={styles.profileMenuWrap}>
      <Pressable
        accessibilityLabel={`${profileLabel} ${translateText(open ? '열림' : '닫힘')}`}
        accessibilityRole="button"
        accessibilityState={{ expanded: open, selected: activeScreen === 'profile' }}
        onPress={() => setOpen((value) => !value)}
        style={(state) => [
          styles.profileMenuTrigger,
          activeScreen === 'profile' && styles.iconButtonActive,
          ...interactiveStateStyles(state)
        ]}
        title={profileLabel}
      >
        <ProfileIcon active={activeScreen === 'profile'} />
        <Text style={styles.profileMenuName} numberOfLines={1}>{displayName}</Text>
        <View style={[styles.chevron, open && styles.chevronOpen]} />
      </Pressable>
      {open ? (
        <View accessibilityRole="menu" style={styles.profileMenu}>
          <View style={styles.profileMenuHeader}>
            <Text style={styles.profileMenuEyebrow}>{profileLabel}</Text>
            <Text style={styles.profileMenuDisplayName} numberOfLines={1}>{displayName}</Text>
          </View>
          <Pressable
            accessibilityRole="menuitem"
            onPress={() => handleNavigate('profile', { tab: 'learning' })}
            style={(state) => [styles.profileMenuItem, ...interactiveStateStyles(state)]}
          >
            <Text style={styles.profileMenuItemText}>{learningFlowLabel}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="menuitem"
            onPress={() => handleNavigate('profile', { tab: 'account' })}
            style={(state) => [styles.profileMenuItem, ...interactiveStateStyles(state)]}
          >
            <Text style={styles.profileMenuItemText}>{accountLabel}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="menuitem"
            onPress={() => {
              setOpen(false);
              onLogout?.();
            }}
            style={(state) => [styles.profileMenuLogout, ...interactiveStateStyles(state)]}
          >
            <Text style={styles.profileMenuLogoutText}>{logoutLabel}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function SettingsIcon() {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.settingsIcon}>
      <View style={styles.settingsIconRing} />
      <View style={styles.settingsIconCore} />
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
      <View style={[styles.sunRay, styles.sunRayDiagonalOne]} />
      <View style={[styles.sunRay, styles.sunRayDiagonalTwo]} />
    </View>
  );
}

function ProfileIcon({ active }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.profileIcon}>
      <View style={[styles.profileIconHead, active && styles.profileIconActivePart]} />
      <View style={[styles.profileIconBody, active && styles.profileIconActivePart]} />
    </View>
  );
}

function MessageIcon({ active }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.messageIcon}>
      <View style={[styles.messageIconBody, active && styles.profileIconActivePart]} />
      <View style={[styles.messageIconTail, active && styles.messageIconTailActive]} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    alignItems: 'center',
    zIndex: 20
  },
  header: {
    width: '100%',
    maxWidth: 1180,
    minHeight: 76,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    overflow: 'visible'
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 120,
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
    height: 42,
    width: 42,
    borderRadius: 13
  },
  brandName: {
    color: colors.ink,
    fontSize: 19,
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
    paddingHorizontal: 9,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'transparent',
    ...interactions.transition
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
  navMenuWrap: {
    position: 'relative',
    zIndex: 30
  },
  navMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  navSubmenu: {
    position: 'absolute',
    top: 46,
    left: 0,
    minWidth: 156,
    padding: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
    gap: 4,
    zIndex: 40
  },
  navSubmenuItem: {
    minHeight: 36,
    borderRadius: 12,
    paddingHorizontal: 11,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    ...interactions.transition
  },
  navSubmenuItemHover: {
    backgroundColor: colors.surfaceWarm
  },
  navSubmenuItemActive: {
    backgroundColor: colors.mintSoft,
    borderColor: colors.mint
  },
  navSubmenuText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700'
  },
  navSubmenuTextActive: {
    color: colors.mintDeep
  },
  chevron: {
    width: 8,
    height: 8,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.blueDeep,
    transform: [{ rotate: '45deg' }],
    marginTop: -3
  },
  chevronOpen: {
    transform: [{ rotate: '225deg' }],
    marginTop: 4
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    minWidth: 0,
    overflow: 'visible',
    zIndex: 50
  },
  settingsDropdown: {
    position: 'relative',
    zIndex: 90
  },
  settingsTrigger: {
    width: 42,
    minHeight: 38,
    paddingHorizontal: 0,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...interactions.transition
  },
  settingsTriggerOpen: {
    borderColor: colors.mint,
    backgroundColor: colors.mintSoft
  },
  settingsTriggerHover: {
    backgroundColor: colors.surface
  },
  settingsTooltip: {
    position: 'absolute',
    top: 44,
    right: 0,
    width: 210,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
    opacity: 0,
    transform: [{ translateY: -4 }],
    zIndex: 95,
    gap: 3,
    ...interactions.transition
  },
  settingsTooltipVisible: {
    opacity: 1,
    transform: [{ translateY: 0 }]
  },
  settingsTooltipTitle: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '900'
  },
  settingsTooltipText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15
  },
  settingsMenu: {
    position: 'absolute',
    top: 44,
    right: 0,
    width: 268,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
    gap: 10,
    zIndex: 100
  },
  settingsSection: {
    gap: 6
  },
  settingsSectionTitle: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '900'
  },
  settingsOptionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  settingsOption: {
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    flexGrow: 1,
    flexBasis: 116,
    ...interactions.transition
  },
  settingsOptionHover: {
    backgroundColor: colors.surfaceWarm
  },
  settingsOptionActive: {
    borderColor: colors.mint,
    backgroundColor: colors.mintSoft
  },
  settingsOptionText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    flexShrink: 1
  },
  settingsOptionTextActive: {
    color: colors.mintDeep
  },
  settingsAccessibilityLink: {
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...interactions.transition
  },
  settingsAccessibilityText: {
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '800'
  },
  settingsIcon: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  settingsIconRing: {
    width: 17,
    height: 17,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.blueDeep
  },
  settingsIconCore: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.blueDeep
  },
  languageDropdown: {
    position: 'relative',
    zIndex: 70
  },
  languageTrigger: {
    minHeight: 38,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    ...interactions.transition
  },
  languageTriggerHover: {
    backgroundColor: colors.surface
  },
  languageTriggerTitle: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '800'
  },
  languageCurrentValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  languageCurrentText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700'
  },
  languageMenu: {
    position: 'absolute',
    top: 44,
    right: 0,
    width: 188,
    padding: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
    gap: 4,
    zIndex: 80
  },
  languageOption: {
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    borderColor: colors.warning,
    backgroundColor: colors.warningSoft
  },
  sunRay: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: colors.warning
  },
  sunRayVertical: {
    width: 2,
    height: 18
  },
  sunRayHorizontal: {
    width: 18,
    height: 2
  },
  sunRayDiagonalOne: {
    width: 2,
    height: 17,
    transform: [{ rotate: '45deg' }]
  },
  sunRayDiagonalTwo: {
    width: 2,
    height: 17,
    transform: [{ rotate: '-45deg' }]
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
  iconButton: {
    width: 40,
    height: 40,
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...interactions.transition
  },
  iconButtonActive: {
    borderColor: colors.mint,
    backgroundColor: colors.mintSoft
  },
  profileMenuWrap: {
    position: 'relative',
    zIndex: 92
  },
  profileMenuTrigger: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 40,
    maxWidth: 170,
    paddingHorizontal: 10,
    ...interactions.transition
  },
  profileMenuName: {
    color: colors.ink,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '800',
    maxWidth: 82
  },
  profileMenu: {
    position: 'absolute',
    top: 46,
    right: 0,
    width: 230,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
    gap: 8,
    zIndex: 110
  },
  profileMenuHeader: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    gap: 3,
    paddingBottom: 8
  },
  profileMenuEyebrow: {
    color: colors.mintDeep,
    fontSize: 11,
    fontWeight: '900'
  },
  profileMenuDisplayName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900'
  },
  profileMenuItem: {
    minHeight: 38,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 10,
    ...interactions.transition
  },
  profileMenuItemText: {
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '800'
  },
  profileMenuLogout: {
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    justifyContent: 'center',
    paddingHorizontal: 10,
    ...interactions.transition
  },
  profileMenuLogoutText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '900'
  },
  iconBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 999,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconBadgeText: {
    color: colors.surface,
    fontSize: 9,
    fontWeight: '900'
  },
  messageIcon: {
    width: 21,
    height: 20,
    position: 'relative'
  },
  messageIconBody: {
    position: 'absolute',
    top: 2,
    left: 1,
    width: 18,
    height: 13,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.blueDeep
  },
  messageIconTail: {
    position: 'absolute',
    left: 5,
    bottom: 1,
    width: 7,
    height: 7,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.blueDeep,
    transform: [{ rotate: '-35deg' }]
  },
  messageIconTailActive: {
    borderColor: colors.mintDeep
  },
  profileIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  profileIconHead: {
    width: 7,
    height: 7,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.blueDeep,
    marginBottom: 2
  },
  profileIconBody: {
    width: 16,
    height: 8,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: colors.blueDeep
  },
  profileIconActivePart: {
    borderColor: colors.mintDeep
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
  }
});
