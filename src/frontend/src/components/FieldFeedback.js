import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../styles/theme';

const toneStyles = {
  success: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
    dotColor: colors.success,
    textColor: colors.success
  },
  warning: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
    dotColor: colors.warning,
    textColor: colors.warning
  },
  error: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
    dotColor: colors.danger,
    textColor: colors.danger
  },
  info: {
    backgroundColor: colors.blueSoft,
    borderColor: colors.blue,
    dotColor: colors.blue,
    textColor: colors.blueDeep
  }
};

export default function FieldFeedback({ message, tone = 'info', style }) {
  if (!message) {
    return null;
  }

  const palette = toneStyles[tone] || toneStyles.info;

  return (
    <View
      accessibilityRole="text"
      style={[
        styles.container,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor
        },
        style
      ]}
    >
      <View style={[styles.dot, { backgroundColor: palette.dotColor }]} />
      <Text style={[styles.text, { color: palette.textColor }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    borderRadius: radii.control,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: -6,
    marginBottom: 12,
    paddingHorizontal: 11,
    paddingVertical: 8
  },
  dot: {
    borderRadius: 4,
    height: 8,
    marginTop: 4,
    width: 8
  },
  text: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18
  }
});
