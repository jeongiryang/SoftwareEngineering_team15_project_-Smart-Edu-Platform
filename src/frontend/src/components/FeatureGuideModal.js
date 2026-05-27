import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, shadows } from '../styles/theme';

export default function FeatureGuideModal({ onClose, onContinue, visible }) {
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);

  function handleContinue() {
    onContinue(doNotShowAgain);
    setDoNotShowAgain(false);
  }

  function handleClose() {
    onClose();
    setDoNotShowAgain(false);
  }

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.dialog, shadows.card]}>
          <Text style={styles.tag}>AI 학습 센터</Text>
          <Text style={styles.title}>처음 이용하시나요?</Text>
          <Text style={styles.description}>
            궁금한 개념 질문, 긴 글 요약, 오답 원인 분석과 맞춤 추천을 한 화면에서 사용할 수 있습니다.
          </Text>
          <View style={styles.featureList}>
            <Text style={styles.featureText}>질문 입력 후 AI 답변 확인</Text>
            <Text style={styles.featureText}>본문 요약으로 빠른 복습</Text>
            <Text style={styles.featureText}>오답 입력 후 취약 원인 분석</Text>
          </View>
          <Pressable onPress={() => setDoNotShowAgain((selected) => !selected)} style={styles.preference}>
            <View style={[styles.checkbox, doNotShowAgain && styles.checkboxSelected]}>
              {doNotShowAgain ? <Text style={styles.checkmark}>✓</Text> : null}
            </View>
            <Text style={styles.preferenceText}>다음부터 이 안내 보지 않기</Text>
          </Pressable>
          <View style={styles.actions}>
            <Pressable onPress={handleClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>닫기</Text>
            </Pressable>
            <Pressable onPress={handleContinue} style={styles.confirmButton}>
              <Text style={styles.confirmText}>AI 학습 시작</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 42, 54, 0.34)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  dialog: {
    width: '100%',
    maxWidth: 446,
    borderRadius: 25,
    backgroundColor: colors.surface,
    padding: 29
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.mintSoft,
    color: colors.mintDeep,
    borderRadius: 13,
    paddingVertical: 7,
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 18
  },
  title: {
    color: colors.ink,
    fontSize: 23,
    fontWeight: '800',
    marginBottom: 11
  },
  description: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20
  },
  featureList: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
    padding: 17,
    marginBottom: 20
  },
  featureText: {
    color: colors.ink,
    fontWeight: '600',
    fontSize: 13
  },
  preference: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24
  },
  checkbox: {
    width: 21,
    height: 21,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxSelected: {
    backgroundColor: colors.mint,
    borderColor: colors.mint
  },
  checkmark: {
    color: colors.surface,
    fontWeight: '800',
    fontSize: 13
  },
  preferenceText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600'
  },
  actions: {
    flexDirection: 'row',
    gap: 10
  },
  cancelButton: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelText: {
    color: colors.ink,
    fontWeight: '700'
  },
  confirmButton: {
    flex: 2,
    minHeight: 48,
    backgroundColor: colors.blue,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center'
  },
  confirmText: {
    color: colors.surface,
    fontWeight: '700'
  }
});
