import { useCallback, useEffect, useRef, useState } from 'react';
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
import PublicProfileScreen from './src/screens/PublicProfileScreen';
import MaintenanceScreen from './src/screens/MaintenanceScreen';
import { getCurrentUser, getMessageThreads, getSystemStatus } from './src/services/api';
import { createRealtimeClient } from './src/services/realtime';
import { AccessibilityProvider, useAccessibility } from './src/contexts/AccessibilityContext';
import { ThemeProvider, useThemeMode } from './src/contexts/ThemeContext';
import { LanguageProvider, useLanguage, useWebTextLocalization } from './src/i18n';
import { readIntroAutoPlayEnabled } from './src/constants/introPreference';

const pencilCursorImage = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0NCIgaGVpZ2h0PSI0NCIgdmlld0JveD0iMCAwIDQ0IDQ0Ij48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg0NCAwKSBzY2FsZSgtMSAxKSI+PGcgdHJhbnNmb3JtPSJyb3RhdGUoLTM1IDIyIDIyKSI+PHJlY3QgeD0iOCIgeT0iMTgiIHdpZHRoPSIyMyIgaGVpZ2h0PSI4IiByeD0iMyIgZmlsbD0iIzczQzlCRCIgc3Ryb2tlPSIjMTczQjYzIiBzdHJva2Utd2lkdGg9IjIiLz48cmVjdCB4PSI0IiB5PSIxOCIgd2lkdGg9IjYiIGhlaWdodD0iOCIgcng9IjIiIGZpbGw9IiNGM0Q0QTAiIHN0cm9rZT0iIzE3M0I2MyIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTMxIDE4TDQwIDIyTDMxIDI2WiIgZmlsbD0iI0ZGRjFEOSIgc3Ryb2tlPSIjMTczQjYzIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMzggMjFMNDIgMjJMMzggMjNaIiBmaWxsPSIjMTgzMjQ2Ii8+PC9nPjwvZz48L3N2Zz4=`;
const globalCursorCss = `
  [role="button"],
  [role="button"]:hover,
  [role="button"]:active,
  [role="button"]:focus,
  [role="link"],
  [role="link"]:hover,
  [role="link"]:active,
  [role="checkbox"],
  [role="switch"],
  a,
  a:hover,
  a:active,
  button,
  button:hover,
  button:active,
  .sagak-hover-zoom,
  .sagak-hover-zoom:hover,
  .sagak-hover-zoom:active,
  .sagak-report-stack,
  .sagak-report-stack:hover,
  .sagak-report-stack:active {
    cursor: url('${pencilCursorImage}') 2 22, pointer !important;
  }

  /* Prevent text selection and cursor overriding inside buttons */
  [role="button"] *,
  [role="link"] *,
  a *,
  button *,
  .sagak-hover-zoom *,
  .sagak-report-stack * {
    cursor: inherit !important;
  }
`;

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
  publicProfile: PublicProfileScreen,
  accessibility: AccessibilityScreen,
  admin: AdminScreen
};

const TOKEN_STORAGE_KEY = 'smartEduAuthToken';
const authScreens = ['dashboard', 'profile', 'statistics', 'friends', 'messages', 'admin', 'aiLearning', 'community', 'schedule', 'taskBoard', 'accessibility', 'pointShop', 'bossRaid', 'collaborativeQuest', 'publicProfile'];
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
  publicProfile: '/public-profile',
  accessibility: '/accessibility',
  admin: '/admin'
};

const pathScreens = Object.entries(screenPaths).reduce((acc, [screen, path]) => {
  acc[path] = screen;
  return acc;
}, {});
const MAGNIFIER_MODE_STORAGE_KEY = 'sagaksagak:magnifier-mode';
const MAGNIFIER_MODE_EVENT = 'sagak-magnifier-change';

function readStoredMagnifierMode() {
  try {
    return globalThis.localStorage?.getItem(MAGNIFIER_MODE_STORAGE_KEY) === 'true';
  } catch (error) {
    return false;
  }
}

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

function readRouteParamsFromLocation() {
  if (!canUseBrowserHistory()) {
    return {};
  }

  const params = {};
  const searchParams = new URLSearchParams(globalThis.window.location.search || '');
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
}

function buildSearchString(params, preserveSearch = false) {
  if (preserveSearch) {
    return globalThis.window?.location?.search || '';
  }

  if (!params) {
    return '';
  }

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();

  return query ? `?${query}` : '';
}

function syncBrowserPath(screen, { replace = false, params = null, preserveSearch = false } = {}) {
  if (!canUseBrowserHistory()) {
    return;
  }

  const nextPath = getPathForScreen(screen);
  const nextSearch = buildSearchString(params, preserveSearch);
  const currentPath = normalizePathname(globalThis.window.location.pathname);
  const currentSearch = globalThis.window.location.search || '';

  if (currentPath === nextPath && currentSearch === nextSearch) {
    return;
  }

  const method = replace ? 'replaceState' : 'pushState';
  globalThis.window.history[method]({ screen, params }, '', `${nextPath}${nextSearch}`);
}

function applyGlobalAccessibilityPreference(preference, user, magnifierMode = false) {
  const documentRef = globalThis.document;

  if (!documentRef) {
    return () => {};
  }

  const root =
    documentRef.getElementById('root') ||
    documentRef.getElementById('main') ||
    documentRef.body?.firstElementChild;
  const storedTextScale = Math.min(Math.max(Number(preference.textScale) || 1, 1), 2);
  const textScale = user ? Math.min(Math.max(storedTextScale, magnifierMode ? 1.35 : 1), 2) : 1;
  const elementaryMode = Boolean(user && preference.elementaryFriendlyUi);

  if (root?.style) {
    root.style.zoom = textScale === 1 ? '' : String(textScale);
    root.style.transformOrigin = 'top left';
  }

  if (documentRef.body) {
    documentRef.body.dataset.sagakTextScale = String(textScale);
    documentRef.body.dataset.sagakElementaryUi = elementaryMode ? 'true' : 'false';
    documentRef.body.dataset.sagakMagnifierMode = magnifierMode && user ? 'true' : 'false';
  }

  return () => {
    if (root?.style) {
      root.style.zoom = '';
      root.style.transformOrigin = '';
    }

    if (documentRef.body) {
      delete documentRef.body.dataset.sagakTextScale;
      delete documentRef.body.dataset.sagakElementaryUi;
      delete documentRef.body.dataset.sagakMagnifierMode;
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
  const [routeParams, setRouteParams] = useState(readRouteParamsFromLocation);
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
  const realtimeClientRef = useRef(null);

  const activeScreenName = (currentScreen === 'admin' && user?.role !== 'ADMIN') ? 'dashboard' : currentScreen;
  const Screen = screens[activeScreenName] || LandingScreen;
  const maintenanceEnabled = Boolean(maintenanceStatus?.enabled);
  const adminBypass = user?.role === 'ADMIN';
  const accountRestricted = Boolean(user && isRestrictedAccountStatus(user.status));
  const showMaintenanceScreen = maintenanceEnabled && !adminBypass && currentScreen !== 'login';

  const navigateTo = useCallback((screen, options = {}) => {
    const nextScreen = normalizeScreen(screen);
    const nextParams = options.preserveSearch ? readRouteParamsFromLocation() : (options.params || {});
    setCurrentScreen(nextScreen);
    setRouteParams(nextParams);
    syncBrowserPath(nextScreen, { ...options, params: nextParams });
  }, []);

  useEffect(() => {
    if (!canUseBrowserHistory()) {
      return undefined;
    }

    function handlePopState() {
      setCurrentScreen(readScreenFromLocation());
      setRouteParams(readRouteParamsFromLocation());
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

  const sendRealtimeEvent = useCallback((message) => {
    if (!realtimeClientRef.current) {
      return false;
    }

    return realtimeClientRef.current.send(message);
  }, []);

  useEffect(() => {
    const realtimeClient = createRealtimeClient({
      getAuthToken: () => token,
      onMessage: handleRealtimeMessage,
      onStatusChange: setRealtimeStatus
    });

    realtimeClientRef.current = realtimeClient;
    realtimeClient.connect();

    return () => {
      realtimeClient.disconnect();
      if (realtimeClientRef.current === realtimeClient) {
        realtimeClientRef.current = null;
      }
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
        syncBrowserPath(nextScreen, {
          replace: true,
          preserveSearch: nextScreen === requestedScreen
        });
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
            routeParams={routeParams}
            sendRealtimeEvent={sendRealtimeEvent}
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
  const [introPassed, setIntroPassed] = useState(() => activeScreenName !== 'home' || !readIntroAutoPlayEnabled());
  const [magnifierMode, setMagnifierMode] = useState(readStoredMagnifierMode);
  const isDarkSurface = effectiveMode === 'dark' || effectiveMode === 'highContrast';

  useWebTextLocalization(currentLanguage, translateText);

  useEffect(() => {
    setHighContrastActive(Boolean(preference.highContrast));
  }, [preference.highContrast, setHighContrastActive]);

  useEffect(
    () => applyGlobalAccessibilityPreference(preference, user, magnifierMode),
    [magnifierMode, preference.elementaryFriendlyUi, preference.textScale, user]
  );

  useEffect(() => {
    const windowRef = globalThis.window;

    if (!windowRef?.addEventListener) {
      return undefined;
    }

    function handleMagnifierModeChange() {
      setMagnifierMode(readStoredMagnifierMode());
    }

    windowRef.addEventListener(MAGNIFIER_MODE_EVENT, handleMagnifierModeChange);
    windowRef.addEventListener('storage', handleMagnifierModeChange);

    return () => {
      windowRef.removeEventListener(MAGNIFIER_MODE_EVENT, handleMagnifierModeChange);
      windowRef.removeEventListener('storage', handleMagnifierModeChange);
    };
  }, []);

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

  useEffect(() => {
    if (!globalThis.window) {
      return undefined;
    }

    function handleIntroPassedEvent() {
      setIntroPassed(true);
    }

    globalThis.window.addEventListener('sagak:intro-passed', handleIntroPassedEvent);

    return () => {
      globalThis.window.removeEventListener('sagak:intro-passed', handleIntroPassedEvent);
    };
  }, []);

  useEffect(() => {
    if (activeScreenName !== 'home') {
      setIntroPassed(true);
    } else {
      setIntroPassed(!readIntroAutoPlayEnabled());
    }
  }, [activeScreenName]);

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

  const shouldShowHeader = showHeader && (activeScreenName !== 'home' || introPassed);

  return (
    <SafeAreaView style={styles.safeArea}>
      <style dangerouslySetInnerHTML={{ __html: globalCursorCss }} />
      <StatusBar
        barStyle={isDarkSurface ? 'light-content' : 'dark-content'}
        backgroundColor={palette.surface}
      />
      {shouldShowHeader ? (
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
