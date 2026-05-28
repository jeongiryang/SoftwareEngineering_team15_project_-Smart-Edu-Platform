import { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import AppHeader from './src/components/AppHeader';
import ConfirmModal from './src/components/ConfirmModal';
import { PanelSkeleton } from './src/components/Skeleton';
import { colors } from './src/styles/theme';
import LandingScreen from './src/screens/LandingScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AILearningScreen from './src/screens/AILearningScreen';
import AdminScreen from './src/screens/AdminScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import TaskBoardScreen from './src/screens/TaskBoardScreen';
import { getCurrentUser } from './src/services/api';

const screens = {
  home: LandingScreen,
  login: LoginScreen,
  register: RegisterScreen,
  dashboard: DashboardScreen,
  aiLearning: AILearningScreen,
  community: CommunityScreen,
  schedule: ScheduleScreen,
  taskBoard: TaskBoardScreen,
  admin: AdminScreen
};

const TOKEN_STORAGE_KEY = 'smartEduAuthToken';
const authScreens = ['dashboard', 'admin', 'aiLearning', 'community', 'schedule', 'taskBoard'];

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
  const [currentScreen, setCurrentScreen] = useState('home');
  const [initializing, setInitializing] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  const activeScreenName = (currentScreen === 'admin' && user?.role !== 'ADMIN') ? 'dashboard' : currentScreen;
  const Screen = screens[activeScreenName] || LandingScreen;

  useEffect(() => {
    if (initializing) {
      return;
    }

    if (authScreens.includes(currentScreen) && !user) {
      setCurrentScreen('login');
      return;
    }

    if (currentScreen === 'admin' && user?.role !== 'ADMIN') {
      setCurrentScreen('dashboard');
    }
  }, [currentScreen, user, initializing]);

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
        setCurrentScreen('dashboard');
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
    setCurrentScreen('dashboard');
  }

  function handleLogout() {
    removeStoredToken();
    setShowLogoutModal(false);
    setToken(null);
    setUser(null);
    setCurrentScreen('home');
  }

  if (initializing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <AppHeader activeScreen="home" onNavigate={setCurrentScreen} />
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
        onNavigate={setCurrentScreen}
        user={user}
      />
      <View style={styles.container}>
        <Screen
          onAuthenticated={handleAuthenticated}
          onLogout={() => setShowLogoutModal(true)}
          onNavigate={setCurrentScreen}
          token={token}
          user={user}
        />
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
