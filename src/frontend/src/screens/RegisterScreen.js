import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AccessibleTextInput from '../components/AccessibleTextInput';
import FieldFeedback from '../components/FieldFeedback';
import { registerUser } from '../services/api';
import { colors, shadows } from '../styles/theme';

function getNameFeedback(name) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return { tone: 'info', message: '이름 또는 닉네임을 입력해 주세요.' };
  }

  if (trimmedName.length < 2) {
    return { tone: 'warning', message: '두 글자 이상 입력하면 더 알아보기 쉬워요.' };
  }

  if (trimmedName.length > 30) {
    return { tone: 'error', message: '30자 이하로 입력해 주세요.' };
  }

  return { tone: 'success', message: '좋은 이름이에요. 계속 진행할 수 있어요.' };
}

function getEmailFeedback(email) {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return { tone: 'info', message: '로그인에 사용할 이메일을 입력해 주세요.' };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return { tone: 'warning', message: '이메일 형식을 확인해 주세요.' };
  }

  return { tone: 'success', message: '이메일 형식이 좋아요.' };
}

function getPasswordFeedback(password) {
  if (!password) {
    return { tone: 'info', message: '8자 이상 비밀번호를 입력해 주세요.' };
  }

  if (password.length < 8) {
    return { tone: 'warning', message: '8자 이상으로 입력해 주세요.' };
  }

  return { tone: 'success', message: '안전하게 사용할 수 있는 길이예요.' };
}

export default function RegisterScreen({ onAuthenticated, onNavigate }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setErrorMessage('');
    setLoading(true);

    try {
      const result = await registerUser({
        name: name.trim(),
        email: email.trim(),
        password
      });

      onAuthenticated(result);
    } catch (error) {
      setErrorMessage(error.message || '회원가입에 실패함');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.infoPanel}>
        <Text style={styles.eyebrow}>START LEARNING</Text>
        <Text style={styles.infoTitle}>새로운 학습 기록을{'\n'}시작하세요</Text>
        {['AI에게 바로 질문하기', '일정과 태스크 정리하기', '커뮤니티에서 학습 기록 나누기'].map((item) => (
          <View key={item} style={styles.benefit}>
            <View style={styles.check} />
            <Text style={styles.benefitText}>{item}</Text>
          </View>
        ))}
      </View>
      <View style={[styles.formCard, shadows.card]}>
        <Text style={styles.title}>회원가입</Text>
        <Text style={styles.subtitle}>사각사각에서 나만의 학습 공간을 만드세요.</Text>
        <Text style={styles.label}>이름</Text>
        <AccessibleTextInput enableVoiceInput={false} onChangeText={setName} placeholder="이름을 입력하세요" placeholderTextColor={colors.muted} style={styles.input} value={name} />
        <FieldFeedback {...getNameFeedback(name)} />
        <Text style={styles.label}>이메일</Text>
        <AccessibleTextInput autoCapitalize="none" enableVoiceInput={false} keyboardType="email-address" onChangeText={setEmail} placeholder="example@email.com" placeholderTextColor={colors.muted} style={styles.input} value={email} />
        <FieldFeedback {...getEmailFeedback(email)} />
        <Text style={styles.label}>비밀번호</Text>
        <AccessibleTextInput enableVoiceInput={false} onChangeText={setPassword} placeholder="비밀번호를 입력하세요" placeholderTextColor={colors.muted} secureTextEntry style={styles.input} value={password} />
        <FieldFeedback {...getPasswordFeedback(password)} />
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <Pressable accessibilityRole="button" disabled={loading} onPress={handleRegister} style={[styles.primaryButton, loading && styles.disabledButton]}>
          {loading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryButtonText}>가입하고 시작하기</Text>}
        </Pressable>
        <Pressable accessibilityRole="button" disabled={loading} onPress={() => onNavigate('login')} style={styles.loginLink}>
          <Text style={styles.loginText}>이미 계정이 있으신가요? <Text style={styles.emphasis}>로그인</Text></Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    width: '100%',
    maxWidth: 1000,
    minHeight: 680,
    paddingVertical: 50,
    paddingHorizontal: 18,
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 32
  },
  infoPanel: { flex: 1, gap: 15, minWidth: 260 },
  eyebrow: { color: colors.mintDeep, fontSize: 12, letterSpacing: 1.5, fontWeight: '800' },
  infoTitle: { color: colors.ink, fontSize: 34, lineHeight: 46, fontWeight: '800', letterSpacing: 0, marginBottom: 20 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: colors.surface, padding: 15, borderRadius: 15 },
  check: { height: 22, width: 22, borderRadius: 11, backgroundColor: colors.mint, borderWidth: 6, borderColor: colors.mintSoft },
  benefitText: { color: colors.ink, fontWeight: '600', fontSize: 14 },
  formCard: {
    width: '100%',
    maxWidth: 430,
    minWidth: 260,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 28
  },
  title: { color: colors.ink, fontSize: 29, fontWeight: '800', marginBottom: 9 },
  subtitle: { color: colors.muted, fontSize: 14, marginBottom: 27 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: {
    height: 51,
    borderRadius: 13,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 15,
    color: colors.ink,
    marginBottom: 17
  },
  errorText: { color: colors.danger, backgroundColor: colors.dangerSoft, padding: 11, borderRadius: 10, marginBottom: 12, fontSize: 13 },
  primaryButton: { minHeight: 53, borderRadius: 13, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', marginTop: 7 },
  primaryButtonText: { color: colors.surface, fontSize: 15, fontWeight: '700' },
  disabledButton: { opacity: 0.65 },
  loginLink: { alignItems: 'center', marginTop: 23 },
  loginText: { color: colors.muted, fontSize: 13 },
  emphasis: { color: colors.mintDeep, fontWeight: '700' }
});
