import { useCallback, useEffect, useState } from 'react';
import { Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import AppHeader from './src/components/AppHeader';
import ConfirmModal from './src/components/ConfirmModal';
import RealtimeNotice from './src/components/RealtimeNotice';
import { PanelSkeleton } from './src/components/Skeleton';
import { colors } from './src/styles/theme';
import LandingScreen from './src/screens/LandingScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProfileDashboardScreen from './src/screens/ProfileDashboardScreen';
import StatisticsScreen from './src/screens/StatisticsScreen';
import FriendsScreen from './src/screens/FriendsScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import AILearningScreen from './src/screens/AILearningScreen';
import AdminScreen from './src/screens/AdminScreen';
import AccessibilityScreen from './src/screens/AccessibilityScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import TaskBoardScreen from './src/screens/TaskBoardScreen';
import PointShopScreen from './src/screens/PointShopScreen';
import BossRaidScreen from './src/screens/BossRaidScreen';
import CollaborativeQuestScreen from './src/screens/CollaborativeQuestScreen';
import MaintenanceScreen from './src/screens/MaintenanceScreen';
import { getCurrentUser, getMessageThreads, getSystemStatus } from './src/services/api';
import { createRealtimeClient } from './src/services/realtime';
import { AccessibilityProvider, useAccessibility } from './src/contexts/AccessibilityContext';
import { ThemeProvider, useThemeMode } from './src/contexts/ThemeContext';
import { LanguageProvider, useLanguage, useWebTextLocalization } from './src/i18n';

const screens = {
  home: LandingScreen,
  login: LoginScreen,
  register: RegisterScreen,
  dashboard: DashboardScreen,
  profile: ProfileDashboardScreen,
  statistics: StatisticsScreen,
  friends: FriendsScreen,
  messages: MessagesScreen,
  aiLearning: AILearningScreen,
  community: CommunityScreen,
  schedule: ScheduleScreen,
  taskBoard: TaskBoardScreen,
  pointShop: PointShopScreen,
  bossRaid: BossRaidScreen,
  collaborativeQuest: CollaborativeQuestScreen,
  accessibility: AccessibilityScreen,
  admin: AdminScreen
};

const TOKEN_STORAGE_KEY = 'smartEduAuthToken';
const authScreens = ['dashboard', 'profile', 'statistics', 'friends', 'messages', 'admin', 'aiLearning', 'community', 'schedule', 'taskBoard', 'accessibility', 'pointShop', 'bossRaid', 'collaborativeQuest'];
const restrictedAccountStatuses = ['SUSPENDED', 'DEACTIVATED'];

const screenPaths = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  profile: '/profile',
  statistics: '/statistics',
  friends: '/friends',
  messages: '/messages',
  aiLearning: '/ai',
  community: '/community',
  schedule: '/schedule',
  taskBoard: '/task-board',
  pointShop: '/shop',
  bossRaid: '/boss-raids',
  collaborativeQuest: '/collaborative-quests',
  accessibility: '/accessibility',
  admin: '/admin'
};

const pathScreens = Object.entries(screenPaths).reduce((acc, [screen, path]) => {
  acc[path] = screen;
  return acc;
}, {});

function canUseBrowserHistory() {
  return Boolean(globalThis.window?.history && globalThis.window?.location);
}

function normalizePathname(pathname) {
  if (!pathname || pathname === '/') {
    return '/';
  }

  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function getScreenFromPath(pathname) {
  return pathScreens[normalizePathname(pathname)] || null;
}

function getPathForScreen(screen) {
  return screenPaths[screen] || screenPaths.home;
}

function readScreenFromLocation() {
  if (!canUseBrowserHistory()) {
    return 'home';
  }

  return getScreenFromPath(globalThis.window.location.pathname) || 'home';
}

function syncBrowserPath(screen, { replace = false } = {}) {
  if (!canUseBrowserHistory()) {
    return;
  }

  const nextPath = getPathForScreen(screen);
  const currentPath = normalizePathname(globalThis.window.location.pathname);

  if (currentPath === nextPath) {
    return;
  }

  const method = replace ? 'replaceState' : 'pushState';
  globalThis.window.history[method]({ screen }, '', nextPath);
}

function applyGlobalAccessibilityPreference(preference, user) {
  const documentRef = globalThis.document;

  if (!documentRef) {
    return () => {};
  }

  const root =
    documentRef.getElementById('root') ||
    documentRef.getElementById('main') ||
    documentRef.body?.firstElementChild;
  const textScale = user ? Math.min(Math.max(Number(preference.textScale) || 1, 1), 2) : 1;
  const elementaryMode = Boolean(user && preference.elementaryFriendlyUi);

  if (root?.style) {
    root.style.zoom = textScale === 1 ? '' : String(textScale);
    root.style.transformOrigin = 'top left';
  }

  if (documentRef.body) {
    documentRef.body.dataset.sagakTextScale = String(textScale);
    documentRef.body.dataset.sagakElementaryUi = elementaryMode ? 'true' : 'false';
  }

  return () => {
    if (root?.style) {
      root.style.zoom = '';
      root.style.transformOrigin = '';
    }

    if (documentRef.body) {
      delete documentRef.body.dataset.sagakTextScale;
      delete documentRef.body.dataset.sagakElementaryUi;
    }
  };
}

function getCurrentScreenText() {
  const documentRef = globalThis.document;
  const contentRoot = documentRef?.getElementById('sagak-screen-content');
  const rawText = contentRoot?.innerText || contentRoot?.textContent || '';

  return rawText
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line, index, lines) => lines.indexOf(line) === index)
    .join('. ')
    .slice(0, 2400);
}

function getReadableClickedText(event) {
  const documentRef = globalThis.document;
  const contentRoot = documentRef?.getElementById('sagak-screen-content');
  const target = event?.target;

  if (!contentRoot || !target?.closest || !contentRoot.contains(target)) {
    return '';
  }

  if (target.closest('[role="button"], button, a, input, textarea, select, [data-testid="sagak-readable-text"]')) {
    return '';
  }

  let node = target;

  while (node && node !== contentRoot) {
    const text = (node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim();
    const childElementCount = node.children?.length || 0;

    if (text && text.length <= 220 && childElementCount <= 2) {
      return text;
    }

    node = node.parentElement;
  }

  return '';
}

function normalizeScreen(screen) {
  return screens[screen] ? screen : 'home';
}

function isRestrictedAccountStatus(status) {
  return restrictedAccountStatuses.includes(status);
}

function formatRestrictedChangedAt(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString();
}

function getStorage() {
  try {
    return globalThis.localStorage || null;
  } catch (error) {
    return null;
  }
}

function readStoredToken() {
  return getStorage()?.getItem(TOKEN_STORAGE_KEY) || null;
}

function saveStoredToken(token) {
  getStorage()?.setItem(TOKEN_STORAGE_KEY, token);
}

function removeStoredToken() {
  getStorage()?.removeItem(TOKEN_STORAGE_KEY);
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppRoot />
      </LanguageProvider>
    </ThemeProvider>
  );
}

function AppRoot() {
  const [currentScreen, setCurrentScreen] = useState(readScreenFromLocation);
  const [initializing, setInitializing] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [maintenanceStatus, setMaintenanceStatus] = useState(null);
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);
  const [maintenanceError, setMaintenanceError] = useState('');
  const [, setRealtimeStatus] = useState('disconnected');
  const [adminNotice, setAdminNotice] = useState(null);
  const [latestRealtimeEvent, setLatestRealtimeEvent] = useState(null);
  const [accountStatusEvent, setAccountStatusEvent] = useState(null);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);

  const activeScreenName = (currentScreen === 'admin' && user?.role !== 'ADMIN') ? 'dashboard' : currentScreen;
  const Screen = screens[activeScreenName] || LandingScreen;
  const maintenanceEnabled = Boolean(maintenanceStatus?.enabled);
  const adminBypass = user?.role === 'ADMIN';
  const accountRestricted = Boolean(user && isRestrictedAccountStatus(user.status));
  const showMaintenanceScreen = maintenanceEnabled && !adminBypass && currentScreen !== 'login';

  const navigateTo = useCallback((screen, options = {}) => {
    const nextScreen = normalizeScreen(screen);
    setCurrentScreen(nextScreen);
    syncBrowserPath(nextScreen, options);
  }, []);

  useEffect(() => {
    if (!canUseBrowserHistory()) {
      return undefined;
    }

    function handlePopState() {
      setCurrentScreen(readScreenFromLocation());
    }

    globalThis.window.addEventListener('popstate', handlePopState);

    return () => {
      globalThis.window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (initializing) {
      return;
    }

    if (authScreens.includes(currentScreen) && !user) {
      navigateTo('login', { replace: true });
      return;
    }

    if (currentScreen === 'admin' && user?.role !== 'ADMIN') {
      navigateTo('dashboard', { replace: true });
    }
  }, [currentScreen, user, initializing, navigateTo]);

  const refreshMaintenanceStatus = useCallback(async () => {
    setMaintenanceLoading(true);
    setMaintenanceError('');

    try {
      const result = await getSystemStatus();
      setMaintenanceStatus(result.maintenance || { enabled: false });
    } catch (error) {
      setMaintenanceStatus({ enabled: false });
      setMaintenanceError(error.message || 'Maintenance status check failed');
    } finally {
      setMaintenanceLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMaintenanceStatus();
  }, [refreshMaintenanceStatus]);

  const updateMessageUnreadCount = useCallback((threads = []) => {
    const nextUnreadCount = threads.reduce(
      (total, thread) => total + Math.max(Number(thread.unreadCount) || 0, 0),
      0
    );

    setMessageUnreadCount(nextUnreadCount);
  }, []);

  const refreshMessageUnreadCount = useCallback(async () => {
    if (!token || !user) {
      setMessageUnreadCount(0);
      return;
    }

    try {
      const result = await getMessageThreads(token);
      updateMessageUnreadCount(Array.isArray(result?.threads) ? result.threads : []);
    } catch (error) {
      // Message badge is non-blocking. The messages screen keeps HTTP fallback controls.
    }
  }, [token, updateMessageUnreadCount, user]);

  useEffect(() => {
    refreshMessageUnreadCount();
  }, [refreshMessageUnreadCount]);

  const handleRealtimeMessage = useCallback((event) => {
    setLatestRealtimeEvent(event);

    if (event.type === 'maintenance.updated') {
      setMaintenanceStatus(event.payload?.maintenance || { enabled: false });
      setMaintenanceError('');
      return;
    }

    if (event.type === 'admin.notice' && event.payload?.notice) {
      setAdminNotice({
        ...event.payload.notice,
        receivedAt: event.sentAt || new Date().toISOString()
      });
      return;
    }

    if (event.type === 'account.status.updated' && event.payload?.status) {
      const nextStatus = event.payload.status;
      setUser((currentUser) => (
        currentUser ? { ...currentUser, status: nextStatus } : currentUser
      ));
      setAccountStatusEvent({
        status: nextStatus,
        reason: event.payload.reason || '',
        message: event.payload.message || '',
        changedAt: event.payload.changedAt || event.sentAt || new Date().toISOString()
      });

      if (isRestrictedAccountStatus(nextStatus)) {
        setMessageUnreadCount(0);
      }

      return;
    }

    if (event.type === 'directMessage.created' || event.type === 'directMessage.read') {
      refreshMessageUnreadCount();
    }
  }, [refreshMessageUnreadCount]);

  useEffect(() => {
    const realtimeClient = createRealtimeClient({
      getAuthToken: () => token,
      onMessage: handleRealtimeMessage,
      onStatusChange: setRealtimeStatus
    });

    realtimeClient.connect();

    return () => {
      realtimeClient.disconnect();
    };
  }, [handleRealtimeMessage, token]);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedToken = readStoredToken();

      if (!storedToken) {
        setInitializing(false);
        return;
      }

      try {
        const result = await getCurrentUser(storedToken);

        if (!isMounted) {
          return;
        }

        setToken(storedToken);
        setUser(result.user);
        const requestedScreen = readScreenFromLocation();
        const nextScreen = authScreens.includes(requestedScreen) ? requestedScreen : 'dashboard';
        setCurrentScreen(nextScreen);
        syncBrowserPath(nextScreen, { replace: true });
      } catch (error) {
        removeStoredToken();
      } finally {
        if (isMounted) {
          setInitializing(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleAuthenticated({ token: nextToken, user: nextUser }) {
    saveStoredToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
    setAccountStatusEvent(null);
    navigateTo('dashboard', { replace: true });
  }

  function handleMaintenanceAdminLogin() {
    removeStoredToken();
    setToken(null);
    setUser(null);
    setAccountStatusEvent(null);
    navigateTo('login', { replace: true });
  }

  function handleRestrictedLogin() {
    removeStoredToken();
    setToken(null);
    setUser(null);
    setMessageUnreadCount(0);
    setAccountStatusEvent(null);
    navigateTo('login', { replace: true });
  }

  function handleLogout() {
    removeStoredToken();
    setShowLogoutModal(false);
    setToken(null);
    setUser(null);
    setMessageUnreadCount(0);
    setAccountStatusEvent(null);
    navigateTo('home', { replace: true });
  }

  function handleAccountDeleted() {
    removeStoredToken();
    setShowLogoutModal(false);
    setToken(null);
    setUser(null);
    setMessageUnreadCount(0);
    setAccountStatusEvent(null);
    navigateTo('login', { replace: true });
  }

  if (initializing || maintenanceLoading) {
    return (
      <AccessibilityProvider token={token}>
        <AppChrome
          activeScreenName="home"
          adminNotice={adminNotice}
          messageUnreadCount={0}
          navigateTo={navigateTo}
          onCloseAdminNotice={() => setAdminNotice(null)}
          showLogoutModal={false}
          user={null}
        >
          <View style={styles.loadingShell}>
            <PanelSkeleton rows={4} />
            <PanelSkeleton rows={3} />
          </View>
        </AppChrome>
      </AccessibilityProvider>
    );
  }

  if (accountRestricted) {
    return (
      <AccessibilityProvider token={token}>
        <AppChrome
          activeScreenName="home"
          adminNotice={adminNotice}
          handleLogout={handleLogout}
          messageUnreadCount={0}
          navigateTo={navigateTo}
          onCloseAdminNotice={() => setAdminNotice(null)}
          showHeader={false}
          showLogoutModal={false}
          user={user}
        >
          <View nativeID="sagak-screen-content" style={styles.container}>
            <AccountRestrictedScreen
              event={accountStatusEvent}
              onLogin={handleRestrictedLogin}
              onLogout={handleLogout}
              status={user.status}
            />
          </View>
        </AppChrome>
      </AccessibilityProvider>
    );
  }

  if (showMaintenanceScreen) {
    return (
      <AccessibilityProvider token={token}>
        <AppChrome
          activeScreenName="home"
          adminNotice={adminNotice}
          messageUnreadCount={messageUnreadCount}
          navigateTo={navigateTo}
          onCloseAdminNotice={() => setAdminNotice(null)}
          showHeader={false}
          showLogoutModal={false}
          user={user}
        >
          <View nativeID="sagak-screen-content" style={styles.container}>
            <MaintenanceScreen
              errorMessage={maintenanceError}
              maintenance={maintenanceStatus}
              onAdminLogin={handleMaintenanceAdminLogin}
              onRefresh={refreshMaintenanceStatus}
              refreshing={maintenanceLoading}
            />
          </View>
        </AppChrome>
      </AccessibilityProvider>
    );
  }

  return (
    <AccessibilityProvider token={token}>
      <AppChrome
        activeScreenName={activeScreenName}
        adminNotice={adminNotice}
        handleLogout={handleLogout}
        messageUnreadCount={messageUnreadCount}
        navigateTo={navigateTo}
        onCloseAdminNotice={() => setAdminNotice(null)}
        setShowLogoutModal={setShowLogoutModal}
        showLogoutModal={showLogoutModal}
        user={user}
      >
        <View nativeID="sagak-screen-content" style={styles.container}>
          <Screen
            onAuthenticated={handleAuthenticated}
            onAccountDeleted={handleAccountDeleted}
            onLogout={() => setShowLogoutModal(true)}
            onMessagesChanged={updateMessageUnreadCount}
            onNavigate={navigateTo}
            onUserUpdate={setUser}
            realtimeEvent={latestRealtimeEvent}
            token={token}
            user={user}
          />
        </View>
      </AppChrome>
    </AccessibilityProvider>
  );
}

function AccountRestrictedScreen({ event, onLogin, onLogout, status }) {
  const { palette } = useThemeMode();
  const { t } = useLanguage();
  const changedAt = formatRestrictedChangedAt(event?.changedAt);
  const normalizedStatus = status === 'DEACTIVATED' ? 'DEACTIVATED' : 'SUSPENDED';

  return (
    <View
      accessibilityLabel={t('account.restricted.accessibilityLabel', 'Account access is restricted')}
      accessibilityRole="alert"
      style={[styles.accountRestrictedShell, { backgroundColor: palette.background }]}
    >
      <View
        style={[
          styles.accountRestrictedCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
            shadowColor: palette.shadow
          }
        ]}
      >
        <View style={[styles.accountRestrictedBadge, { backgroundColor: palette.warningSoft, borderColor: palette.warning }]}>
          <Text style={[styles.accountRestrictedBadgeText, { color: palette.warning }]}>
            {t('account.restricted.badge', 'Account access restricted')}
          </Text>
        </View>
        <Text style={[styles.accountRestrictedTitle, { color: palette.ink }]}>
          {t(
            `account.restricted.title.${normalizedStatus}`,
            normalizedStatus === 'DEACTIVATED' ? 'Account is deactivated' : 'Account is suspended'
          )}
        </Text>
        <Text style={[styles.accountRestrictedMessage, { color: palette.muted }]}>
          {t(
            `account.restricted.message.${normalizedStatus}`,
            'Please contact an administrator or sign in again after the restriction is resolved.'
          )}
        </Text>
        {changedAt ? (
          <Text style={[styles.accountRestrictedMeta, { color: palette.muted }]}>
            {t('account.restricted.changedAt', 'Changed at')}: {changedAt}
          </Text>
        ) : null}
        <View style={styles.accountRestrictedActions}>
          <Pressable
            accessibilityRole="button"
            onPress={onLogin}
            style={({ hovered, pressed }) => [
              styles.accountRestrictedPrimaryButton,
              { backgroundColor: palette.blue, borderColor: palette.blue },
              hovered && styles.accountRestrictedButtonHovered,
              pressed && styles.accountRestrictedButtonPressed
            ]}
          >
            <Text style={[styles.accountRestrictedPrimaryButtonText, { color: palette.surface }]}>
              {t('account.restricted.login', 'Go to login')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onLogout}
            style={({ hovered, pressed }) => [
              styles.accountRestrictedSecondaryButton,
              { backgroundColor: palette.surfaceWarm, borderColor: palette.line },
              hovered && styles.accountRestrictedButtonHovered,
              pressed && styles.accountRestrictedButtonPressed
            ]}
          >
            <Text style={[styles.accountRestrictedSecondaryButtonText, { color: palette.ink }]}>
              {t('account.restricted.logout', 'Log out')}
            </Text>
          </Pressable>
        </View>
        <Text style={[styles.accountRestrictedHelp, { color: palette.muted }]}>
          {t('account.restricted.help', 'If this looks unexpected, ask an administrator to review the account status.')}
        </Text>
      </View>
    </View>
  );
}

function AppChrome({
  activeScreenName,
  adminNotice,
  children,
  handleLogout,
  messageUnreadCount = 0,
  navigateTo,
  onCloseAdminNotice,
  setShowLogoutModal,
  showHeader = true,
  showLogoutModal,
  user
}) {
  const { preference, speakText } = useAccessibility();
  const { effectiveMode, palette, setHighContrastActive } = useThemeMode();
  const { currentLanguage, translateText } = useLanguage();
  const [readTextError, setReadTextError] = useState('');
  const isDarkSurface = effectiveMode === 'dark' || effectiveMode === 'highContrast';

  useWebTextLocalization(currentLanguage, translateText);

  useEffect(() => {
    setHighContrastActive(Boolean(preference.highContrast));
  }, [preference.highContrast, setHighContrastActive]);

  useEffect(
    () => applyGlobalAccessibilityPreference(preference, user),
    [preference.elementaryFriendlyUi, preference.textScale, user]
  );

  useEffect(() => {
    const documentRef = globalThis.document;

    if (!documentRef || !user || !preference.voiceOutputEnabled) {
      return undefined;
    }

    function handleReadableTextClick(event) {
      const text = getReadableClickedText(event);

      if (text) {
        speakText(text, { readingId: `clicked-${text.slice(0, 24)}-${text.length}` }).then((started) => {
          if (!started) {
            setReadTextError('읽어주기를 시작하지 못했습니다. Chrome 사이트 소리 권한과 기기 볼륨을 확인해 주세요.');
          }
        });
      }
    }

    documentRef.addEventListener('click', handleReadableTextClick);

    return () => {
      documentRef.removeEventListener('click', handleReadableTextClick);
    };
  }, [preference.voiceOutputEnabled, speakText, user]);

  const handleReadCurrentPage = useCallback(async () => {
    const screenText = getCurrentScreenText();

    if (!screenText) {
      setReadTextError('현재 화면에서 읽을 내용을 찾지 못했습니다.');
      return;
    }

    const started = await speakText(screenText, { readingId: `screen-${activeScreenName}` });

    if (!started) {
      setReadTextError('읽어주기를 시작하지 못했습니다. Chrome 사이트 소리 권한과 기기 볼륨을 확인해 주세요.');
    }
  }, [activeScreenName, speakText]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={isDarkSurface ? 'light-content' : 'dark-content'}
        backgroundColor={palette.surface}
      />
      {showHeader ? (
        <AppHeader
          activeScreen={activeScreenName}
          messageUnreadCount={messageUnreadCount}
          onLogout={setShowLogoutModal ? () => setShowLogoutModal(true) : undefined}
          onNavigate={navigateTo}
          user={user}
        />
      ) : null}
      {children}
      <RealtimeNotice notice={adminNotice} onClose={onCloseAdminNotice} />
      {user && preference.voiceOutputEnabled ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="현재 화면 전체 읽기"
          onPress={handleReadCurrentPage}
          style={({ hovered, pressed }) => [
            styles.readPageButton,
            hovered && styles.readPageButtonHovered,
            pressed && styles.readPageButtonPressed
          ]}
        >
          <Text style={styles.readPageButtonText}>🔊 전체 읽기</Text>
        </Pressable>
      ) : null}
      <ConfirmModal
        confirmLabel="확인"
        description={readTextError}
        onCancel={() => setReadTextError('')}
        onConfirm={() => setReadTextError('')}
        showCancel={false}
        title="읽어주기 안내"
        visible={Boolean(readTextError)}
      />
      <ConfirmModal
        confirmLabel="로그아웃"
        description="진행 중인 화면을 나가고 사각사각 소개 화면으로 돌아갑니다."
        destructive
        onCancel={() => setShowLogoutModal?.(false)}
        onConfirm={handleLogout}
        title="로그아웃하시겠어요?"
        visible={Boolean(showLogoutModal)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    flex: 1
  },
  loadingShell: {
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
    padding: 30,
    gap: 18
  },
  accountRestrictedShell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  accountRestrictedCard: {
    width: '100%',
    maxWidth: 560,
    borderWidth: 1,
    borderRadius: 24,
    padding: 30,
    gap: 16,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.14,
    shadowRadius: 32,
    elevation: 4
  },
  accountRestrictedBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7
  },
  accountRestrictedBadgeText: {
    fontSize: 13,
    fontWeight: '900'
  },
  accountRestrictedTitle: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '900'
  },
  accountRestrictedMessage: {
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '700'
  },
  accountRestrictedMeta: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700'
  },
  accountRestrictedActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6
  },
  accountRestrictedPrimaryButton: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  accountRestrictedSecondaryButton: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  accountRestrictedButtonHovered: {
    transform: [{ translateY: -1 }]
  },
  accountRestrictedButtonPressed: {
    transform: [{ translateY: 1 }]
  },
  accountRestrictedPrimaryButtonText: {
    fontSize: 15,
    fontWeight: '900'
  },
  accountRestrictedSecondaryButtonText: {
    fontSize: 15,
    fontWeight: '900'
  },
  accountRestrictedHelp: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700'
  },
  readPageButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    zIndex: 40,
    minHeight: 52,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.mintDark,
    backgroundColor: colors.blue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20
  },
  readPageButtonHovered: {
    transform: [{ translateY: -2 }]
  },
  readPageButtonPressed: {
    transform: [{ translateY: 1 }]
  },
  readPageButtonText: {
    color: colors.surface,
    fontWeight: '900',
    fontSize: 16
  }
});
