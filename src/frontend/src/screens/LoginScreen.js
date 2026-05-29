import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AccessibleTextInput from '../components/AccessibleTextInput';
import { useLanguage } from '../i18n';
import { loginUser } from '../services/api';
import { colors, interactiveStateStyles, shadows } from '../styles/theme';

const icon = require('../assets/sagaksagak-app-icon.png');

const learningMessageKeys = [
  'login.message.1',
  'login.message.2',
  'login.message.3',
  'login.message.4',
  'login.message.5',
  'login.message.6',
  'login.message.7',
  'login.message.8',
  'login.message.9',
  'login.message.10'
];

function PasswordVisibilityIcon({ visible }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.eyeIcon}>
      <View style={styles.eyeShape}>
        <View style={styles.eyePupil} />
      </View>
      {!visible ? <View style={styles.eyeSlash} /> : null}
    </View>
  );
}

export default function LoginScreen({ onAuthenticated, onNavigate }) {
  const { t } = useLanguage();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [typedMessage, setTypedMessage] = useState('');
  const learningMessages = useMemo(
    () => learningMessageKeys.map((key) => t(key)),
    [t]
  );
  const currentMessage = learningMessages[messageIndex] || learningMessages[0] || '';

  useEffect(() => {
    const timers = [];

    setTypedMessage('');

    Array.from(currentMessage).forEach((_, index) => {
      timers.push(setTimeout(() => {
        setTypedMessage(currentMessage.slice(0, index + 1));
      }, 45 * (index + 1)));
    });

    timers.push(setTimeout(() => {
      setMessageIndex((current) => (current + 1) % learningMessages.length);
    }, currentMessage.length * 45 + 1900));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [currentMessage, learningMessages.length]);

  async function handleLogin() {
    setErrorMessage('');
    setLoading(true);

    try {
      const result = await loginUser({
        loginId: loginId.trim(),
        password
      });

      onAuthenticated(result);
    } catch (error) {
      setErrorMessage(error.message || t('login.errorFallback', '로그인에 실패함'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView dataSet={{ sagakI18nIgnore: 'true' }} style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.sideCopy}>
        <Text style={styles.eyebrow}>WELCOME BACK</Text>
        <Text style={styles.sideTitle}>{t('login.side.titleLine1', '오늘의 공부를')}{'\n'}{t('login.side.titleLine2', '이어 적어볼까요?')}</Text>
        <Text style={styles.sideDescription}>
          {t('login.side.description', 'AI 질문, 학습 요약, 오답 분석을 통해 어제보다 선명한 학습 기록을 만들어 보세요.')}
        </Text>
        <View accessibilityLabel={t('login.quote.ariaLabel', '학습 루틴 안내 문구')} accessibilityLiveRegion="none" style={styles.quoteCard}>
          <Image source={icon} style={styles.icon} />
          <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.quoteText}>
            {typedMessage}
            <Text style={styles.cursor}>{typedMessage.length < currentMessage.length ? '|' : ''}</Text>
          </Text>
        </View>
      </View>
      <View style={[styles.formCard, shadows.card]}>
        <Text style={styles.title}>{t('login.title', '로그인')}</Text>
        <Text style={styles.subtitle}>{t('login.subtitle', '사각사각 계정으로 학습 공간에 접속하세요.')}</Text>
        <Text style={styles.label}>{t('login.identifier', '아이디')}</Text>
        <AccessibleTextInput
          autoCapitalize="none"
          enableVoiceInput={false}
          onChangeText={setLoginId}
          placeholder={t('login.identifierPlaceholder', '아이디를 입력하세요')}
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.identifierInput]}
          value={loginId}
        />
        <Text style={styles.inputHint}>{t('login.identifierHint', '영문 소문자, 숫자, 밑줄, 하이픈을 사용할 수 있어요.')}</Text>
        <Text style={styles.label}>{t('login.password', '비밀번호')}</Text>
        <AccessibleTextInput
          containerStyle={styles.passwordInputContainer}
          onChangeText={setPassword}
          placeholder={t('login.passwordPlaceholder', '비밀번호를 입력하세요')}
          placeholderTextColor={colors.muted}
          enableVoiceInput={false}
          rightAccessory={(
            <Pressable
              accessibilityLabel={showPassword ? t('login.password.hide', '비밀번호 숨기기') : t('login.password.show', '비밀번호 보기')}
              accessibilityRole="button"
              onPress={() => setShowPassword((current) => !current)}
              style={(state) => [
                styles.passwordToggle,
                ...interactiveStateStyles(state)
              ]}
            >
              <PasswordVisibilityIcon visible={showPassword} />
            </Pressable>
          )}
          secureTextEntry={!showPassword}
          style={[styles.input, styles.passwordInput]}
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
          {loading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryButtonText}>{t('login.submit', '로그인')}</Text>}
        </Pressable>
        <View style={styles.signupRow}>
          <Text style={styles.signupHint}>{t('login.noAccount', '아직 계정이 없으신가요?')}</Text>
          <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={() => onNavigate('register')}
            style={(state) => [styles.signupAction, ...interactiveStateStyles(state, { disabled: loading })]}
          >
            <Text style={styles.signupLink}>{t('login.signup', '회원가입')}</Text>
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
  identifierInput: {
    marginBottom: 7
  },
  inputHint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 18
  },
  passwordInputContainer: {
    marginBottom: 19
  },
  passwordInput: {
    marginBottom: 0
  },
  passwordToggle: {
    width: 44,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center'
  },
  eyeIcon: {
    width: 23,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  eyeShape: {
    width: 22,
    height: 13,
    borderWidth: 2,
    borderColor: colors.blueDeep,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scaleY: 0.74 }]
  },
  eyePupil: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.blueDeep
  },
  eyeSlash: {
    position: 'absolute',
    width: 24,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.blueDeep,
    transform: [{ rotate: '-35deg' }]
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
