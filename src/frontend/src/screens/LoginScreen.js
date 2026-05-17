import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

export default function LoginScreen({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleLogin() {
    console.log('login placeholder', { email, passwordLength: password.length });
    onNavigate('dashboard');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smart Edu Platform</Text>
      <Text style={styles.subtitle}>로그인</Text>
      <TextInput
        style={styles.input}
        placeholder="이메일"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <View style={styles.buttonGroup}>
        <Button title="로그인" onPress={handleLogin} />
        <Button title="회원가입" onPress={() => onNavigate('register')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937'
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF'
  },
  buttonGroup: {
    gap: 8,
    marginTop: 8
  }
});
