import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AccessibleTextInput from '../components/AccessibleTextInput';
import { loginUser } from '../services/api';
import { colors, interactiveStateStyles, shadows } from '../styles/theme';

const icon = require('../assets/sagaksagak-app-icon.png');

const learningMessages = [
  '작은 기록이 쌓여 나만의 학습 루틴이 됩니다.',
  '오늘의 25분 집중이 내일의 자신감을 만듭니다.',
  '오답을 다시 보는 순간, 약점이 방향이 됩니다.',
  '복습할 내용을 남겨두면 내일의 공부가 가벼워집니다.',
  '일정을 작게 쪼개면 시작하기 쉬워집니다.',
  '꾸준한 기록은 나에게 맞는 공부 리듬을 알려줍니다.',
  '질문을 적어두면 막힌 부분이 선명해집니다.',
  '오늘 배운 한 줄이 다음 퀴즈의 힌트가 됩니다.',
  '칸반에 할 일을 옮기며 공부 흐름을 정리해 보세요.',
  '사각사각 쌓인 기록이 나만의 학습 지도가 됩니다.'
];

export default function LoginScreen({ onAuthenticated, onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [typedMessage, setTypedMessage] = useState('');

  useEffect(() => {
    const timers = [];
    const message = learningMessages[messageIndex];

    setTypedMessage('');

    Array.from(message).forEach((_, index) => {
      timers.push(setTimeout(() => {
        setTypedMessage(message.slice(0, index + 1));
      }, 45 * (index + 1)));
    });

    timers.push(setTimeout(() => {
      setMessageIndex((current) => (current + 1) % learningMessages.length);
    }, message.length * 45 + 1900));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [messageIndex]);

  async function handleLogin() {
    setErrorMessage('');
    setLoading(true);

    try {
      const result = await loginUser({
        email: email.trim(),
        password
      });

      onAuthenticated(result);
    } catch (error) {
      setErrorMessage(error.message || '로그인에 실패함');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.sideCopy}>
        <Text style={styles.eyebrow}>WELCOME BACK</Text>
        <Text style={styles.sideTitle}>오늘의 공부를{'\n'}이어 적어볼까요?</Text>
        <Text style={styles.sideDescription}>
          AI 질문, 학습 요약, 오답 분석을 통해 어제보다 선명한 학습 기록을 만들어 보세요.
        </Text>
        <View accessibilityLabel="학습 루틴 안내 문구" accessibilityLiveRegion="none" style={styles.quoteCard}>
          <Image source={icon} style={styles.icon} />
          <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.quoteText}>
            {typedMessage}
            <Text style={styles.cursor}>{typedMessage.length < learningMessages[messageIndex].length ? '|' : ''}</Text>
          </Text>
        </View>
      </View>
      <View style={[styles.formCard, shadows.card]}>
        <Text style={styles.title}>로그인</Text>
        <Text style={styles.subtitle}>사각사각 계정으로 학습 공간에 접속하세요.</Text>
        <Text style={styles.label}>이메일</Text>
        <AccessibleTextInput
          autoCapitalize="none"
          forceVoiceInput
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="example@email.com"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={email}
        />
        <Text style={styles.label}>비밀번호</Text>
        <AccessibleTextInput
          onChangeText={setPassword}
          placeholder="비밀번호를 입력하세요"
          placeholderTextColor={colors.muted}
          enableVoiceInput={false}
          secureTextEntry
          style={styles.input}
          value={password}
        />
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <Pressable
          accessibilityRole="button"
          disabled={loading}
          onPress={handleLogin}
          style={(state) => [
            styles.primaryButton,
            ...interactiveStateStyles(state, { disabled: loading }),
            loading && styles.disabledButton
          ]}
        >
          {loading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryButtonText}>로그인</Text>}
        </Pressable>
        <View style={styles.signupRow}>
          <Text style={styles.signupHint}>아직 계정이 없으신가요?</Text>
          <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={() => onNavigate('register')}
            style={(state) => [styles.signupAction, ...interactiveStateStyles(state, { disabled: loading })]}
          >
            <Text style={styles.signupLink}>회원가입</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    maxWidth: 1020,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 32,
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 55,
    minHeight: 650
  },
  sideCopy: {
    flex: 1,
    minWidth: 260
  },
  eyebrow: {
    color: colors.mintDeep,
    letterSpacing: 1.5,
    fontWeight: '800',
    fontSize: 12,
    marginBottom: 16
  },
  sideTitle: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 34,
    lineHeight: 46,
    letterSpacing: 0
  },
  sideDescription: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 26,
    marginTop: 14
  },
  quoteCard: {
    marginTop: 34,
    borderRadius: 20,
    backgroundColor: colors.cream,
    padding: 16,
    flexDirection: 'row',
    gap: 13,
    alignItems: 'center'
  },
  icon: {
    height: 55,
    width: 55,
    borderRadius: 14
  },
  quoteText: {
    color: colors.blueDeep,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    flex: 1
  },
  cursor: {
    color: colors.mintDeep,
    fontWeight: '800'
  },
  formCard: {
    width: '100%',
    maxWidth: 420,
    minWidth: 260,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 26,
    paddingVertical: 38
  },
  title: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 29,
    marginBottom: 9
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    marginBottom: 29
  },
  label: {
    color: colors.ink,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 9
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 13,
    paddingHorizontal: 15,
    backgroundColor: colors.surfaceWarm,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 19
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    backgroundColor: colors.dangerSoft,
    borderRadius: 10,
    padding: 11,
    marginBottom: 15
  },
  primaryButton: {
    minHeight: 53,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.blue,
    marginTop: 5
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '700'
  },
  disabledButton: {
    opacity: 0.65
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 25
  },
  signupHint: {
    color: colors.muted,
    fontSize: 13
  },
  signupAction: {
    minHeight: 30,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center'
  },
  signupLink: {
    color: colors.mintDeep,
    fontSize: 13,
    fontWeight: '700'
  }
});
