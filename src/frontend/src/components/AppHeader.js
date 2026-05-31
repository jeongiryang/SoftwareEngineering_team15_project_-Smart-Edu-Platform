import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Globe2, Menu, Moon, Sun, X, Volume2, VolumeX } from 'lucide-react';
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

  function NavItem({ label, screen }) {
    const active = activeScreen === screen;
    return (
      <Pressable
        accessibilityRole="button"
        className="sagak-pencil-interactive"
        onPress={() => { onNavigate(screen); setDrawerOpen(false); }}
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

const styles = StyleSheet.create({
  shell: {
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
