import { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AILearningScreen from './src/screens/AILearningScreen';
import AdminScreen from './src/screens/AdminScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import TaskBoardScreen from './src/screens/TaskBoardScreen';
import { getCurrentUser } from './src/services/api';
import { colors } from './src/styles/theme';

const screens = {
  login: LoginScreen,
  register: RegisterScreen,
  dashboard: DashboardScreen,
  aiLearning: AILearningScreen,
  admin: AdminScreen,
  schedule: ScheduleScreen,
  taskBoard: TaskBoardScreen
};

const TOKEN_STORAGE_KEY = 'smartEduAuthToken';
const authScreens = ['dashboard', 'admin', 'aiLearning', 'schedule', 'taskBoard'];

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
  const [currentScreen, setCurrentScreen] = useState('login');
  const [initializing, setInitializing] = useState(true);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  // Guard authenticated screens and keep the admin route role-gated.
  const activeScreenName = (currentScreen === 'admin' && user?.role !== 'ADMIN') ? 'dashboard' : currentScreen;
  const Screen = screens[activeScreenName] || LoginScreen;

  useEffect(() => {
    if (initializing) {
      return;
    }

    if (authScreens.includes(currentScreen) && !user) {
      setCurrentScreen('login');
      return;
    }

    if (currentScreen === 'admin' && user.role !== 'ADMIN') {
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
    setToken(null);
    setUser(null);
    setCurrentScreen('login');
  }

  if (initializing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={[styles.container, styles.center]}>
          <Text style={styles.loadingText}>로그인 상태 확인 중</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <Screen
          onAuthenticated={handleAuthenticated}
          onLogout={handleLogout}
          onNavigate={setCurrentScreen}
          token={token}
          user={user}
        />
      </View>
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
  center: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700'
  }
});
