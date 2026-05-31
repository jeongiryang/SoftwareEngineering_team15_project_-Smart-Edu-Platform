import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Globe2, Menu, Moon, Sun, X, Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeMode } from '../contexts/ThemeContext';
import { useLanguage } from '../i18n';
import { colors, interactions, interactiveStateStyles } from '../styles/theme';
import { readIntroAutoPlayEnabled, saveIntroAutoPlayEnabled } from '../constants/introPreference';

const icon = require('../assets/sagaksagak-app-icon.png');
const BGM_ENABLED_STORAGE_KEY = 'sagakLandingBgmEnabled';
const BGM_TOGGLE_EVENT = 'sagak:bgm-toggle';
const pencilCursorSvg = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
    <g transform="translate(44 0) scale(-1 1)">
      <g transform="rotate(-35 22 22)">
        <rect x="8" y="18" width="23" height="8" rx="3" fill="#73C9BD" stroke="#173B63" stroke-width="2"/>
        <rect x="4" y="18" width="6" height="8" rx="2" fill="#F3D4A0" stroke="#173B63" stroke-width="2"/>
        <path d="M31 18L40 22L31 26Z" fill="#FFF1D9" stroke="#173B63" stroke-width="2"/>
        <path d="M38 21L42 22L38 23Z" fill="#183246"/>
      </g>
    </g>
  </svg>`
);
const pencilCursor = `url("data:image/svg+xml,${pencilCursorSvg}") 38 22, auto`;

function readBgmEnabled() {
  try {
    return globalThis.localStorage?.getItem(BGM_ENABLED_STORAGE_KEY) === 'true';
  } catch (error) {
    return false;
  }
}

function saveBgmEnabled(enabled) {
  try {
    globalThis.localStorage?.setItem(BGM_ENABLED_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch (error) {
    // ignore
  }
}

function dispatchBgmEvent(enabled) {
  if (Platform.OS !== 'web' || !globalThis.window?.dispatchEvent) return;
  globalThis.window.dispatchEvent(new CustomEvent(BGM_TOGGLE_EVENT, { detail: { enabled } }));
}

export default function AppHeader({ activeScreen, onLogout, onNavigate, user, introPassed = true }) {
  const authenticated = Boolean(user);
  const hasAdminRole = user?.role === 'ADMIN';
  const { effectiveMode, mode, toggleThemeMode } = useThemeMode();
  const { currentLanguage, setLanguage, supportedLanguages, translateText } = useLanguage();
  const [bgmEnabled, setBgmEnabled] = useState(readBgmEnabled);
  const [introAutoPlayEnabled, setIntroAutoPlayEnabled] = useState(readIntroAutoPlayEnabled);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { width } = useWindowDimensions();
  const isMobile = width <= 1024;
  const isDarkSurface = effectiveMode === 'dark' || effectiveMode === 'highContrast';
  const currentLanguageLabel = currentLanguage === 'ko' ? '한국어' : currentLanguage.toUpperCase();

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    function handleBgmToggle(event) {
      setBgmEnabled(Boolean(event.detail?.enabled));
    }
    globalThis.window?.addEventListener(BGM_TOGGLE_EVENT, handleBgmToggle);
    return () => globalThis.window?.removeEventListener(BGM_TOGGLE_EVENT, handleBgmToggle);
  }, []);

  function toggleBgm() {
    const nextEnabled = !bgmEnabled;
    setBgmEnabled(nextEnabled);
    saveBgmEnabled(nextEnabled);
    dispatchBgmEvent(nextEnabled);
  }

  function toggleIntroAutoPlay() {
    const nextEnabled = !introAutoPlayEnabled;
    setIntroAutoPlayEnabled(nextEnabled);
    saveIntroAutoPlayEnabled(nextEnabled);
  }

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  function toggleLanguage() {
    setLangDropdownOpen((current) => !current);
  }

  function handleSelectLanguage(code) {
    setLanguage(code);
    setLangDropdownOpen(false);
  }
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
        className="sagak-pencil-interactive"
        onPress={() => { onNavigate(screen); setDrawerOpen(false); }}
        onPress={() => {
          setOpenMenu(null);
          onNavigate(screen);
        }}
        style={(state) => [
          styles.navItem,
          active && styles.navItemActive,
          state.hovered && !active && styles.navItemHover,
          ...interactiveStateStyles(state)
        ]}
      >
        <Text style={[styles.navText, active && styles.navTextActive]}>{translateText(label)}</Text>
      </Pressable>
    );
  }

  function NavAnchor({ label, hash }) {
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
      <Pressable
        accessibilityRole="button"
        className="sagak-pencil-interactive"
        onPress={() => {
          setDrawerOpen(false);
          if (activeScreen !== 'home') {
            onNavigate('home');
          }
          if (Platform.OS === 'web') {
            setTimeout(() => {
              const el = globalThis.document?.getElementById(hash);
              el?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }
        }}
        style={(state) => [
          styles.navItem,
          state.hovered && styles.navItemHover,
          ...interactiveStateStyles(state)
        ]}
      >
        <Text style={styles.navText}>{translateText(label)}</Text>
      </Pressable>
    );
  }

  const Utilities = () => (
    <>
      <Pressable
        accessibilityLabel={`새로고침 시 인트로 자동 재생 ${introAutoPlayEnabled ? '켜짐' : '꺼짐'}`}
        accessibilityRole="switch"
        accessibilityState={{ checked: introAutoPlayEnabled }}
        className="sagak-pencil-interactive"
        onPress={toggleIntroAutoPlay}
        style={(state) => [styles.utilityButton, introAutoPlayEnabled && styles.utilityButtonActive, ...interactiveStateStyles(state)]}
      >
        <Text style={[styles.utilityText, isDarkSurface && styles.utilityTextDark]}>Intro</Text>
        <View style={[styles.introSwitchTrack, introAutoPlayEnabled && styles.introSwitchTrackActive]}>
          <View style={[styles.introSwitchKnob, introAutoPlayEnabled && styles.introSwitchKnobActive]} />
        </View>
      </Pressable>
      <Pressable className="sagak-pencil-interactive" onPress={toggleBgm} style={(state) => [styles.utilityButton, ...interactiveStateStyles(state)]}>
        {bgmEnabled ? <Volume2 size={18} color={isDarkSurface ? '#F8FAFC' : '#15202B'} strokeWidth={1.8} /> : <VolumeX size={18} color={isDarkSurface ? '#A7B0BE' : '#6B7280'} strokeWidth={1.8} />}
        {isMobile && <Text style={[styles.utilityText, isDarkSurface && styles.utilityTextDark]}>BGM</Text>}
      </Pressable>
      <View className="lang-wrapper" style={{position: 'relative', zIndex: 200}}>
        <Pressable className="sagak-pencil-interactive" onPress={toggleLanguage} style={(state) => [styles.utilityButton, ...interactiveStateStyles(state)]}>
          <Globe2 size={18} color={isDarkSurface ? '#F8FAFC' : '#15202B'} strokeWidth={1.8} />
          <Text style={[styles.utilityText, isDarkSurface && styles.utilityTextDark]}>{currentLanguageLabel}</Text>
        </Pressable>
        {Platform.OS === 'web' && (
          <div className={`language-dropdown ${isDarkSurface ? 'dark' : ''} ${langDropdownOpen ? 'lang-dropdown-open' : ''}`}>
            {supportedLanguages.map(lang => (
              <div 
                key={lang.code}
                onClick={() => handleSelectLanguage(lang.code)}
                style={{
                  padding: '10px 16px',
                  cursor: pencilCursor,
                  borderRadius: '8px',
                  color: isDarkSurface ? '#F8FAFC' : '#15202B',
                  fontWeight: currentLanguage === lang.code ? '700' : '500',
                  backgroundColor: currentLanguage === lang.code ? (isDarkSurface ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = isDarkSurface ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = currentLanguage === lang.code ? (isDarkSurface ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent'}
              >
                {lang.label}{lang.beta ? ' Beta' : ''}
              </div>
            ))}
          </div>
        )}
      </View>
      <Pressable className="sagak-pencil-interactive" onPress={toggleThemeMode} style={(state) => [styles.utilityButton, ...interactiveStateStyles(state)]}>
        {mode === 'dark' ? (
          <Moon size={18} color="#F8FAFC" strokeWidth={1.8} />
        ) : (
          <Sun size={18} color="#15202B" strokeWidth={1.8} />
        )}
        {isMobile && <Text style={[styles.utilityText, isDarkSurface && styles.utilityTextDark]}>{translateText(mode === 'dark' ? '다크' : '라이트')}</Text>}
      </Pressable>
    </>
  );

  return (
    <>
      {Platform.OS === 'web' && (
        <style dangerouslySetInnerHTML={{__html: `
          .sagak-header-hidden { opacity: 0; transform: translateY(-24px); pointer-events: none; visibility: hidden; display: none; position: fixed !important; top: 0; left: 0; right: 0; z-index: 100; }
          .sagak-header-visible { opacity: 1; transform: translateY(0); pointer-events: auto; transition: opacity 0.45s ease, transform 0.45s ease; position: sticky !important; top: 0; z-index: 100; backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); }
          .language-dropdown {
            position: absolute;
            top: calc(100% + 10px);
            right: 0;
            min-width: 160px;
            padding: 10px;
            border-radius: 18px;
            background: rgba(255, 253, 247, 0.96);
            border: 1px solid rgba(21, 32, 43, 0.08);
            box-shadow: 0 16px 40px rgba(15, 27, 45, 0.14);
            backdrop-filter: blur(16px);
            z-index: 9999;
            opacity: 0;
            pointer-events: none;
            transform: translateY(-10px);
            transition: opacity 0.2s, transform 0.2s;
          }
          .language-dropdown.dark {
            background: rgba(13, 24, 39, 0.96);
            border: 1px solid rgba(255, 255, 255, 0.12);
          }
          .lang-wrapper:hover .language-dropdown, .lang-wrapper:focus-within .language-dropdown {
            opacity: 1;
            pointer-events: auto;
            transform: translateY(0);
          }
          .lang-dropdown-open {
            opacity: 1;
            pointer-events: auto;
            transform: translateY(0);
          }
        `}} />
      )}
      <View style={[styles.shell, isDarkSurface ? styles.shellDark : styles.shellLight]} className={!introPassed ? 'sagak-header-hidden' : 'sagak-header-visible'}>
        <View style={styles.headerInner}>
          <Pressable
            accessibilityRole="button"
            className="sagak-pencil-interactive"
            onPress={() => onNavigate(authenticated ? 'dashboard' : 'home')}
            style={(state) => [styles.brand, state.hovered && styles.brandHover, ...interactiveStateStyles(state)]}
          >
            <Image source={icon} style={styles.logo} />
            <View>
              <Text style={[styles.brandName, isDarkSurface && styles.brandNameDark]}>{translateText('사각사각')}</Text>
              <Text style={[styles.brandSub, isDarkSurface && styles.brandSubDark]}>Smart Edu Platform</Text>
            </View>
          </Pressable>

          {!isMobile && (
            <>
              <View style={styles.nav}>
                {!authenticated ? (
                  <>
                    <NavItem label="서비스 소개" screen="home" />
                    <NavAnchor label="기능" hash="features" />
                    <NavAnchor label="사용 예시" hash="usecases" />
                    <NavAnchor label="FAQ" hash="faq" />
                  </>
                ) : (
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
                    <NavItem label="상점" screen="pointShop" />
                    {hasAdminRole && <NavItem label="관리자" screen="admin" />}
                  </>
                )}
              </View>

              <View style={styles.actions}>
                <Utilities />
                {authenticated ? (
                  <>
                    <Text style={[styles.userLabel, isDarkSurface && styles.userLabelDark]}>{user?.nickname || user?.name || translateText('사용자')}</Text>
                    <Pressable className="sagak-pencil-interactive" onPress={onLogout} style={(state) => [styles.textButton, ...interactiveStateStyles(state)]}>
                      <Text style={[styles.textButtonText, isDarkSurface && styles.textButtonTextDark]}>{translateText('로그아웃')}</Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Pressable className="sagak-pencil-interactive" onPress={() => onNavigate('login')} style={(state) => [styles.textButton, ...interactiveStateStyles(state)]}>
                      <Text style={[styles.textButtonText, isDarkSurface && styles.textButtonTextDark]}>{translateText('로그인')}</Text>
                    </Pressable>
                    <Pressable className="sagak-pencil-interactive" onPress={() => onNavigate('register')} style={(state) => [styles.primaryButton, ...interactiveStateStyles(state)]}>
                      <Text style={styles.primaryText}>{translateText('무료로 시작하기')}</Text>
                    </Pressable>
                  </>
                )}
              </View>
            </>
          )}

          {isMobile && (
            <View style={styles.mobileActions}>
              {!authenticated && (
                <Pressable className="sagak-pencil-interactive" onPress={() => onNavigate('register')} style={(state) => [styles.primaryButton, ...interactiveStateStyles(state)]}>
                  <Text style={styles.primaryText}>{translateText('무료로 시작하기')}</Text>
                </Pressable>
              )}
              <Pressable className="sagak-pencil-interactive" onPress={() => setDrawerOpen(!drawerOpen)} style={(state) => [styles.hamburgerButton, ...interactiveStateStyles(state)]}>
                {drawerOpen ? <X size={24} color={isDarkSurface ? '#F8FAFC' : '#15202B'} /> : <Menu size={24} color={isDarkSurface ? '#F8FAFC' : '#15202B'} />}
              </Pressable>
            </View>
          )}
        </View>

        {isMobile && drawerOpen && (
          <View style={[styles.drawer, isDarkSurface ? styles.drawerDark : styles.drawerLight]}>
            <View style={styles.drawerNav}>
              {!authenticated ? (
                <>
                  <NavItem label="서비스 소개" screen="home" />
                  <NavAnchor label="기능" hash="features" />
                  <NavAnchor label="사용 예시" hash="usecases" />
                  <NavAnchor label="FAQ" hash="faq" />
                </>
              ) : (
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
                  <NavItem label="상점" screen="pointShop" />
                  {hasAdminRole && <NavItem label="관리자" screen="admin" />}
                </>
              )}
            </View>
            <View style={styles.drawerUtils}>
              <Utilities />
              {authenticated ? (
                <Pressable className="sagak-pencil-interactive" onPress={onLogout} style={styles.drawerLoginButton}>
                  <Text style={[styles.textButtonText, isDarkSurface && styles.textButtonTextDark]}>{translateText('로그아웃')}</Text>
                </Pressable>
              ) : (
                <Pressable className="sagak-pencil-interactive" onPress={() => { onNavigate('login'); setDrawerOpen(false); }} style={styles.drawerLoginButton}>
                  <Text style={[styles.textButtonText, isDarkSurface && styles.textButtonTextDark]}>{translateText('로그인')}</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      </View>
    </>
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
    borderBottomWidth: 1,
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  shellLight: {
    backgroundColor: 'rgba(255, 253, 247, 0.86)',
    borderBottomColor: 'rgba(21, 32, 43, 0.08)',
  },
  shellDark: {
    backgroundColor: 'rgba(13, 24, 39, 0.88)',
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  headerInner: {
    width: '100%',
    maxWidth: 1440,
    minHeight: 76,
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    overflow: 'visible'
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    padding: 4,
    cursor: pencilCursor,
    ...interactions.transition
  },
  brandHover: {
    opacity: 0.8
  },
  logo: {
    height: 40,
    width: 40,
    borderRadius: 10
  },
  brandName: {
    color: '#15202B',
    fontSize: 24,
    fontWeight: '700',
  },
  brandNameDark: {
    color: '#F8FAFC',
  },
  brandSub: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.5,
  },
  brandSubDark: {
    color: '#A7B0BE',
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  navItem: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    cursor: pencilCursor,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 11,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'transparent',
    ...interactions.transition
  },
  navItemActive: {
    backgroundColor: 'rgba(92, 198, 184, 0.1)',
  },
  navItemHover: {
    opacity: 0.8
  },
  navText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600'
  },
  navTextActive: {
    color: '#5CC6B8'
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
    alignItems: 'center',
    gap: 12,
  },
  utilityButton: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    cursor: pencilCursor,
    ...interactions.transition
  },
  utilityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#15202B'
  },
  utilityTextDark: {
    color: '#F8FAFC'
  },
  utilityButtonActive: {
    borderColor: 'rgba(15, 118, 110, 0.42)',
    backgroundColor: 'rgba(115, 201, 189, 0.12)'
  },
  introSwitchTrack: {
    backgroundColor: 'rgba(107, 114, 128, 0.26)',
    borderRadius: 11,
    height: 22,
    padding: 3,
    width: 40
  },
  introSwitchTrackActive: {
    backgroundColor: '#5CC6B8'
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
    width: 224,
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
    width: 276,
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
  introSwitchKnob: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    height: 16,
    shadowColor: '#15202B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    width: 16
  },
  introSwitchKnobActive: {
    marginLeft: 18
  },
  textButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    cursor: pencilCursor,
    ...interactions.transition
  },
  textButtonText: {
    color: '#15202B',
    fontSize: 14,
    fontWeight: '600',
  },
  textButtonTextDark: {
    color: '#F8FAFC',
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
    backgroundColor: '#5CC6B8',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
    cursor: pencilCursor,
    ...interactions.transition
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  mobileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  hamburgerButton: {
    padding: 8,
    cursor: pencilCursor
  },
  drawer: {
    position: 'absolute',
    top: 76,
    left: 0,
    right: 0,
    padding: 20,
    borderBottomWidth: 1,
  },
  drawerLight: {
    backgroundColor: '#FFFDF7',
    borderBottomColor: 'rgba(21, 32, 43, 0.08)',
  },
  drawerDark: {
    backgroundColor: '#0D1827',
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  drawerNav: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 20
  },
  drawerUtils: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'flex-start'
  },
  drawerLoginButton: {
    marginTop: 12,
    paddingVertical: 8,
    cursor: pencilCursor
  },
  userLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15202B'
  },
  userLabelDark: {
    color: '#F8FAFC'
  }
});
