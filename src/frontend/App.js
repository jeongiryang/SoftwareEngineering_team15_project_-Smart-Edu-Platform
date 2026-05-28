import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import AppHeader from './src/components/AppHeader';
import ConfirmModal from './src/components/ConfirmModal';
import { PanelSkeleton } from './src/components/Skeleton';
import { colors } from './src/styles/theme';
import LandingScreen from './src/screens/LandingScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProfileDashboardScreen from './src/screens/ProfileDashboardScreen';
import AILearningScreen from './src/screens/AILearningScreen';
import AdminScreen from './src/screens/AdminScreen';
import AccessibilityScreen from './src/screens/AccessibilityScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import TaskBoardScreen from './src/screens/TaskBoardScreen';
import { getCurrentUser } from './src/services/api';
import { AccessibilityProvider } from './src/contexts/AccessibilityContext';

const screens = {
  home: LandingScreen,
  login: LoginScreen,
  register: RegisterScreen,
  dashboard: DashboardScreen,
  profile: ProfileDashboardScreen,
  aiLearning: AILearningScreen,
  community: CommunityScreen,
  schedule: ScheduleScreen,
  taskBoard: TaskBoardScreen,
  accessibility: AccessibilityScreen,
  admin: AdminScreen
};

const TOKEN_STORAGE_KEY = 'smartEduAuthToken';
const authScreens = ['dashboard', 'profile', 'admin', 'aiLearning', 'community', 'schedule', 'taskBoard', 'accessibility'];

const screenPaths = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  profile: '/profile',
  aiLearning: '/ai',
  community: '/community',
  schedule: '/schedule',
  taskBoard: '/task-board',
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

function normalizeScreen(screen) {
  return screens[screen] ? screen : 'home';
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
  const [currentScreen, setCurrentScreen] = useState(readScreenFromLocation);
  const [initializing, setInitializing] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  const activeScreenName = (currentScreen === 'admin' && user?.role !== 'ADMIN') ? 'dashboard' : currentScreen;
  const Screen = screens[activeScreenName] || LandingScreen;

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
    navigateTo('dashboard', { replace: true });
  }

  function handleLogout() {
    removeStoredToken();
    setShowLogoutModal(false);
    setToken(null);
    setUser(null);
    navigateTo('home', { replace: true });
  }

  if (initializing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <AppHeader activeScreen="home" onNavigate={navigateTo} />
        <View style={styles.loadingShell}>
          <PanelSkeleton rows={4} />
          <PanelSkeleton rows={3} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <AppHeader
        activeScreen={activeScreenName}
        onLogout={() => setShowLogoutModal(true)}
        onNavigate={navigateTo}
        user={user}
      />
      <View style={styles.container}>
        <AccessibilityProvider token={token}>
          <Screen
            onAuthenticated={handleAuthenticated}
            onLogout={() => setShowLogoutModal(true)}
            onNavigate={navigateTo}
            token={token}
            user={user}
          />
        </AccessibilityProvider>
      </View>
      <ConfirmModal
        confirmLabel="로그아웃"
        description="진행 중인 화면을 나가고 사각사각 소개 화면으로 돌아갑니다."
        destructive
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="로그아웃하시겠어요?"
        visible={showLogoutModal}
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
  }
});
