import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { SHOP_ASSET_SOURCE_MAP } from '../assets/shop/shopAssetMap';
import { colors } from '../styles/theme';

const AVATAR_SIZES = {
  sm: 34,
  md: 54,
  lg: 84
};

function getInitialLabel(name = '') {
  const trimmed = String(name || '').trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : 'S';
}

export function resolveShopAssetSource(assetUrl) {
  return assetUrl ? SHOP_ASSET_SOURCE_MAP[assetUrl] || null : null;
}

export function ProfileAvatar({ appearance, name, size = 'md', style }) {
  const avatarSize = AVATAR_SIZES[size] || AVATAR_SIZES.md;
  const imageSource = resolveShopAssetSource(appearance?.profileImageUrl);

  return (
    <View
      style={[
        styles.avatar,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2
        },
        style
      ]}
    >
      {imageSource ? (
        <Image
          accessibilityIgnoresInvertColors
          source={imageSource}
          style={[
            styles.avatarImage,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2
            }
          ]}
        />
      ) : (
        <Text style={[styles.avatarText, { fontSize: Math.max(13, avatarSize * 0.36) }]}>
          {getInitialLabel(name)}
        </Text>
      )}
    </View>
  );
}

export function ProfileTitleChip({ animated = false, title, translateText }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const displayTitle = title ? translateText?.(title) || title : translateText?.('칭호 없음') || '칭호 없음';

  useEffect(() => {
    if (!animated || !title) {
      return undefined;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true
        })
      ])
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [animated, pulse, title]);

  const translateY = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1]
  });

  return (
    <Animated.View
      style={[
        styles.titleChip,
        animated && title ? { transform: [{ translateY }] } : null
      ]}
    >
      <Text style={styles.titleIcon}>✦</Text>
      <Text style={styles.titleText} numberOfLines={1}>{displayTitle}</Text>
    </Animated.View>
  );
}

export function ProfileBackground({ appearance, children, style }) {
  const backgroundSource = resolveShopAssetSource(appearance?.profileBackgroundUrl);

  return (
    <View style={[styles.backgroundShell, style]}>
      {backgroundSource ? (
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="cover"
          source={backgroundSource}
          style={styles.backgroundImage}
        />
      ) : null}
      <View style={styles.backgroundOverlay} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: '#EAF7F2',
    borderColor: colors.mint,
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden'
  },
  avatarImage: {
    resizeMode: 'cover'
  },
  avatarText: {
    color: colors.blue,
    fontWeight: '900'
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
    width: '100%'
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 250, 240, 0.78)'
  },
  backgroundShell: {
    overflow: 'hidden',
    position: 'relative'
  },
  titleChip: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EFFAF5',
    borderColor: '#A7D8C2',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  titleIcon: {
    color: colors.mint,
    fontSize: 11,
    fontWeight: '900'
  },
  titleText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '800'
  }
});
