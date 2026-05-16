import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

export default function RegisterScreen({ onNavigate }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleRegister() {
    console.log('register placeholder', {
      name,
      email,
      passwordLength: password.length
    });
    onNavigate('dashboard');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입</Text>
      <TextInput
        style={styles.input}
        placeholder="이름"
        value={name}
        onChangeText={setName}
      />
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
        <Button title="가입하기" onPress={handleRegister} />
        <Button title="로그인으로 돌아가기" onPress={() => onNavigate('login')} />
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
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
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
