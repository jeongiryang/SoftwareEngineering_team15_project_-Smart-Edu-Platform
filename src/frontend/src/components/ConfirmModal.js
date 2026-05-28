import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, shadows } from '../styles/theme';

export default function ConfirmModal({
  cancelLabel = '취소',
  children,
  confirmLabel = '확인',
  confirmDisabled = false,
  description,
  destructive = false,
  onCancel,
  onConfirm,
  title,
  visible
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.dialog, shadows.card]}>
          <View style={styles.pencilMark} />
          <Text style={styles.title}>{title}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
          {children ? <View style={styles.body}>{children}</View> : null}
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={onCancel} style={styles.cancelButton}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={confirmDisabled}
              onPress={onConfirm}
              style={[
                styles.confirmButton,
                destructive && styles.dangerButton,
                confirmDisabled && styles.disabledButton
              ]}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
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
    padding: 16
  },
  dialog: {
    width: '100%',
    maxWidth: 410,
    borderRadius: 24,
    backgroundColor: colors.surface,
    padding: 22,
    alignItems: 'center'
  },
  pencilMark: {
    width: 46,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.mint,
    marginBottom: 20
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 10
  },
  description: {
    color: colors.muted,
    lineHeight: 22,
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 25
  },
  body: {
    width: '100%',
    marginBottom: 24
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: '100%'
  },
  cancelButton: {
    flex: 1,
    minWidth: 120,
    minHeight: 47,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cancelText: {
    color: colors.ink,
    fontWeight: '700'
  },
  confirmButton: {
    flex: 1,
    minWidth: 120,
    minHeight: 47,
    borderRadius: 13,
    backgroundColor: colors.blue,
    justifyContent: 'center',
    alignItems: 'center'
  },
  dangerButton: {
    backgroundColor: colors.danger
  },
  disabledButton: {
    opacity: 0.55
  },
  confirmText: {
    color: colors.surface,
    fontWeight: '700'
  }
});
