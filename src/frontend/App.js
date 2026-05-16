import { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';

const screens = {
  login: LoginScreen,
  register: RegisterScreen,
  dashboard: DashboardScreen
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const Screen = screens[currentScreen];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <Screen onNavigate={setCurrentScreen} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA'
  },
  container: {
    flex: 1
  }
});
