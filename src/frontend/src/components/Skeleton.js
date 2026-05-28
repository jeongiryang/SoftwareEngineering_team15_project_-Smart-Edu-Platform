import { Animated, StyleSheet, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { colors } from '../styles/theme';

export function SkeletonBlock({ height = 14, style, width = '100%' }) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true })
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return <Animated.View style={[styles.block, { height, opacity, width }, style]} />;
}

export function PanelSkeleton({ rows = 3 }) {
  return (
    <View style={styles.panel}>
      <SkeletonBlock height={18} width="38%" />
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={styles.row}>
          <SkeletonBlock height={12} width={index % 2 === 0 ? '72%' : '57%'} />
          <SkeletonBlock height={12} width="14%" />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    borderRadius: 7,
    backgroundColor: '#E4ECE8'
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    gap: 18
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
});
