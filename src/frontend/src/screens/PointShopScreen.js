import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PanelSkeleton } from '../components/Skeleton';
import {
  equipShopItem,
  getMyShop,
  getShopItems,
  purchaseShopItem
} from '../services/api';
import { colors, shadows } from '../styles/theme';

const ITEM_SECTION_META = {
  PROFILE_IMAGE: {
    title: '프로필 이미지',
    description: '아바타 스타일 아이템을 구매해서 프로필 이미지를 바꿀 수 있어요.',
    emoji: '🖼️'
  },
  PROFILE_BACKGROUND: {
    title: '프로필 배경',
    description: '프로필 카드 분위기를 바꿔주는 배경 아이템입니다.',
    emoji: '🎨'
  },
  TITLE: {
    title: '칭호',
    description: '학습 스타일을 보여주는 칭호를 구매하고 적용할 수 있어요.',
    emoji: '🏷️'
  }
};

function formatNumber(value) {
  return new Intl.NumberFormat('ko-KR').format(Number(value || 0));
}

function getPreviewTone(code = '') {
  if (code.includes('SKY') || code.includes('DAWN')) {
    return {
      background: '#EAF4FF',
      accent: '#4D89D8',
      surface: '#F7FBFF'
    };
  }

  if (code.includes('FOREST') || code.includes('MINT')) {
    return {
      background: '#EAF7F2',
      accent: '#3A9A74',
      surface: '#F8FFFC'
    };
  }

  return {
    background: '#FFF4E5',
    accent: '#B36A2E',
    surface: '#FFFDF9'
  };
}

function getInitialLabel(text = '') {
  const trimmed = String(text || '').trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : 'S';
}

function getItemStatusLabel(item) {
  if (item.equipped) {
    return '적용 중';
  }

  if (item.owned) {
    return '보유 중';
  }

  return `${formatNumber(item.price)}P`;
}

function getPurchaseMessage(item) {
  return `${formatNumber(item.price)}포인트로 "${item.name}" 아이템을 구매했어요.`;
}

function getEquipMessage(item) {
  if (item.type === 'PROFILE_IMAGE') {
    return `"${item.name}" 프로필 이미지를 적용했어요.`;
  }

  if (item.type === 'PROFILE_BACKGROUND') {
    return `"${item.name}" 프로필 배경을 적용했어요.`;
  }

  return `"${item.name}" 칭호를 적용했어요.`;
}

function ProfilePreview({ user, shop, failedImages, onImageError }) {
  const profile = shop.profile || {};
  const avatarTone = getPreviewTone(shop.equippedItems?.profileImage?.code || 'PROFILE');
  const backgroundTone = getPreviewTone(shop.equippedItems?.profileBackground?.code || 'BACKGROUND');
  const avatarUri = profile.profileImageUrl;
  const avatarFailed = avatarUri ? failedImages[`profile-${avatarUri}`] : false;
  const titleText = profile.titleText || '아직 적용된 칭호가 없어요';

  return (
    <View style={[styles.previewCard, shadows.card, { backgroundColor: backgroundTone.background }]}>
      <View style={styles.previewHeader}>
        <View>
          <Text style={styles.previewEyebrow}>현재 적용 상태</Text>
          <Text style={styles.previewTitle}>내 꾸미기 미리보기</Text>
        </View>
        <View style={styles.previewBalanceChip}>
          <Text style={styles.previewBalanceText}>{formatNumber(shop.account?.pointBalance)}P</Text>
        </View>
      </View>

      <View style={styles.previewBody}>
        <View style={[styles.previewAvatar, { backgroundColor: avatarTone.surface }]}>
          {avatarUri && !avatarFailed ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.previewAvatarImage}
              onError={() => onImageError(`profile-${avatarUri}`)}
            />
          ) : (
            <Text style={[styles.previewAvatarFallback, { color: avatarTone.accent }]}>
              {getInitialLabel(user?.name)}
            </Text>
          )}
        </View>

        <View style={styles.previewCopy}>
          <Text style={styles.previewName}>{user?.name || '학습자'}</Text>
          <Text style={styles.previewSubtitle}>{shop.equippedItems?.profileImage?.name || '기본 프로필 이미지'}</Text>
          <View style={[styles.titleChip, { backgroundColor: colors.surface }]}>
            <Text style={styles.titleChipText}>{titleText}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function ShopItemCard({
  item,
  busyItemId,
  failedImages,
  onEquip,
  onImageError,
  onPurchase
}) {
  const tone = getPreviewTone(item.code);
  const previewKey = `item-${item.id}`;
  const imageFailed = item.assetUrl ? failedImages[previewKey] : false;
  const purchasing = busyItemId === `purchase-${item.id}`;
  const equipping = busyItemId === `equip-${item.id}`;
  const busy = purchasing || equipping;

  return (
    <View style={[styles.itemCard, shadows.card]}>
      <View style={styles.itemCardHeader}>
        <View style={[styles.itemTypeChip, { backgroundColor: tone.background }]}>
          <Text style={[styles.itemTypeChipText, { color: tone.accent }]}>{ITEM_SECTION_META[item.type].title}</Text>
        </View>
        <Text style={styles.itemPriceText}>{getItemStatusLabel(item)}</Text>
      </View>

      <View style={[styles.itemPreview, { backgroundColor: tone.background }]}>
        {item.type === 'TITLE' ? (
          <View style={[styles.titlePreviewBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.titlePreviewText, { color: tone.accent }]}>{item.name}</Text>
          </View>
        ) : item.assetUrl && !imageFailed ? (
          <Image
            source={{ uri: item.assetUrl }}
            style={item.type === 'PROFILE_IMAGE' ? styles.itemAvatarImage : styles.itemBackgroundImage}
            resizeMode={item.type === 'PROFILE_IMAGE' ? 'cover' : 'cover'}
            onError={() => onImageError(previewKey)}
          />
        ) : item.type === 'PROFILE_IMAGE' ? (
          <View style={[styles.itemAvatarFallback, { backgroundColor: colors.surface }]}>
            <Text style={[styles.itemAvatarFallbackText, { color: tone.accent }]}>{getInitialLabel(item.name)}</Text>
          </View>
        ) : (
          <View style={[styles.itemBackgroundFallback, { backgroundColor: colors.surface }]}>
            <Text style={[styles.itemBackgroundFallbackEmoji, { color: tone.accent }]}>🎒</Text>
            <Text style={[styles.itemBackgroundFallbackText, { color: tone.accent }]}>{item.name}</Text>
          </View>
        )}
      </View>

      <View style={styles.itemCopy}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDescription}>{item.description || '설명이 준비 중입니다.'}</Text>
      </View>

      <View style={styles.itemActions}>
        {!item.owned ? (
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => onPurchase(item)}
            style={[styles.primaryActionButton, busy && styles.disabledButton]}
          >
            <Text style={styles.primaryActionText}>{busy ? '구매 중...' : `구매하기 · ${formatNumber(item.price)}P`}</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            disabled={busy || item.equipped}
            onPress={() => onEquip(item)}
            style={[
              styles.secondaryActionButton,
              item.equipped && styles.activeActionButton,
              (busy || item.equipped) && styles.disabledButton
            ]}
          >
            <Text style={[styles.secondaryActionText, item.equipped && styles.activeActionText]}>
              {busy ? '적용 중...' : item.equipped ? '적용 중' : '적용하기'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function PurchaseHistory({ purchases }) {
  if (!purchases.length) {
    return (
      <View style={styles.emptyPanel}>
        <Text style={styles.emptyTitle}>아직 구매한 아이템이 없어요.</Text>
        <Text style={styles.emptyDescription}>포인트를 모은 뒤 원하는 꾸미기 아이템을 구매해보세요.</Text>
      </View>
    );
  }

  return (
    <View style={styles.historyList}>
      {purchases.map((purchase) => (
        <View key={purchase.id} style={styles.historyCard}>
          <View>
            <Text style={styles.historyName}>{purchase.item.name}</Text>
            <Text style={styles.historyMeta}>
              {ITEM_SECTION_META[purchase.item.type].title} · {new Date(purchase.purchasedAt).toLocaleDateString('ko-KR')}
            </Text>
          </View>
          <Text style={styles.historyPrice}>{formatNumber(purchase.item.price)}P</Text>
        </View>
      ))}
    </View>
  );
}

export default function PointShopScreen({ token, user }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyItemId, setBusyItemId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [failedImages, setFailedImages] = useState({});
  const [items, setItems] = useState([]);
  const [shop, setShop] = useState({
    account: { pointBalance: 0 },
    profile: null,
    equippedItems: {
      profileImage: null,
      profileBackground: null,
      title: null
    },
    purchases: []
  });

  const itemsByType = useMemo(() => ({
    PROFILE_IMAGE: items.filter((item) => item.type === 'PROFILE_IMAGE'),
    PROFILE_BACKGROUND: items.filter((item) => item.type === 'PROFILE_BACKGROUND'),
    TITLE: items.filter((item) => item.type === 'TITLE')
  }), [items]);

  const loadShop = useCallback(async (keepMessage = false) => {
    if (!keepMessage) {
      setSuccessMessage('');
    }
    setErrorMessage('');

    try {
      const [itemsResult, myShopResult] = await Promise.all([
        getShopItems(token),
        getMyShop(token)
      ]);

      setItems(itemsResult.items || []);
      setShop(myShopResult.shop || {
        account: { pointBalance: 0 },
        profile: null,
        equippedItems: {
          profileImage: null,
          profileBackground: null,
          title: null
        },
        purchases: []
      });
    } catch (error) {
      setErrorMessage(error.message || '포인트 상점 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadShop();
  }, [loadShop]);

  function handleImageError(key) {
    setFailedImages((current) => ({
      ...current,
      [key]: true
    }));
  }

  async function handlePurchase(item) {
    setBusyItemId(`purchase-${item.id}`);
    setErrorMessage('');

    try {
      await purchaseShopItem(token, item.id);
      setSuccessMessage(getPurchaseMessage(item));
      await loadShop(true);
    } catch (error) {
      setErrorMessage(error.message || '아이템 구매에 실패했습니다.');
    } finally {
      setBusyItemId('');
    }
  }

  async function handleEquip(item) {
    setBusyItemId(`equip-${item.id}`);
    setErrorMessage('');

    try {
      await equipShopItem(token, item.id);
      setSuccessMessage(getEquipMessage(item));
      await loadShop(true);
    } catch (error) {
      setErrorMessage(error.message || '아이템 적용에 실패했습니다.');
    } finally {
      setBusyItemId('');
    }
  }

  if (loading) {
    return (
      <ScrollView contentContainerStyle={styles.loadingWrap} showsVerticalScrollIndicator={false}>
        <PanelSkeleton rows={4} />
        <PanelSkeleton rows={4} />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={[styles.heroPanel, shadows.card]}>
        <View style={styles.heroHeader}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>POINT SHOP</Text>
            <Text style={styles.heroTitle}>포인트 상점</Text>
            <Text style={styles.heroDescription}>
              보상으로 모은 포인트로 프로필 이미지, 배경, 칭호를 구매하고 적용할 수 있어요.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={refreshing}
            onPress={() => {
              setRefreshing(true);
              loadShop(true);
            }}
            style={[styles.refreshButton, refreshing && styles.disabledButton]}
          >
            <Text style={styles.refreshButtonText}>{refreshing ? '새로고침 중' : '새로고침'}</Text>
          </Pressable>
        </View>

        <View style={styles.shopStatsRow}>
          <View style={[styles.statCard, styles.pointCard]}>
            <Text style={styles.statLabel}>현재 포인트</Text>
            <Text style={styles.pointValue}>{formatNumber(shop.account?.pointBalance)}P</Text>
            <Text style={styles.statHint}>퀘스트 보상으로 포인트를 모은 뒤 원하는 아이템을 구매해보세요.</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>구매한 아이템</Text>
            <Text style={styles.statValue}>{formatNumber(shop.purchases?.length)}개</Text>
            <Text style={styles.statHint}>구매한 아이템은 언제든 다시 적용할 수 있어요.</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>적용 중인 꾸미기</Text>
            <Text style={styles.statValue}>
              {formatNumber(
                Object.values(shop.equippedItems || {}).filter(Boolean).length
              )}개
            </Text>
            <Text style={styles.statHint}>이미지는 asset이 준비되면 실제 파일로 자연스럽게 교체됩니다.</Text>
          </View>
        </View>

        {errorMessage ? (
          <View style={[styles.messageBox, styles.errorBox]}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {successMessage ? (
          <View style={[styles.messageBox, styles.successBox]}>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}
      </View>

      <ProfilePreview
        user={user}
        shop={shop}
        failedImages={failedImages}
        onImageError={handleImageError}
      />

      <View style={styles.sections}>
        {Object.entries(ITEM_SECTION_META).map(([type, meta]) => (
          <View key={type} style={[styles.sectionPanel, shadows.card]}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>{meta.emoji} {meta.title}</Text>
                <Text style={styles.sectionDescription}>{meta.description}</Text>
              </View>
              <Text style={styles.sectionMeta}>{itemsByType[type].length}개</Text>
            </View>

            <View style={styles.itemGrid}>
              {itemsByType[type].map((item) => (
                <ShopItemCard
                  key={item.id}
                  item={item}
                  busyItemId={busyItemId}
                  failedImages={failedImages}
                  onPurchase={handlePurchase}
                  onEquip={handleEquip}
                  onImageError={handleImageError}
                />
              ))}
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.sectionPanel, shadows.card]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>👜 구매한 아이템</Text>
            <Text style={styles.sectionDescription}>포인트를 사용해 획득한 꾸미기 아이템 목록입니다.</Text>
          </View>
          <Text style={styles.sectionMeta}>{shop.purchases?.length || 0}개</Text>
        </View>
        <PurchaseHistory purchases={shop.purchases || []} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
    gap: 18
  },
  loadingWrap: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
    gap: 18
  },
  heroPanel: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 26,
    gap: 18
  },
  heroHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14
  },
  heroCopy: {
    flex: 1,
    minWidth: 260,
    gap: 8
  },
  heroEyebrow: {
    color: colors.mintDeep,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1
  },
  heroTitle: {
    color: colors.blueDeep,
    fontSize: 38,
    fontWeight: '900'
  },
  heroDescription: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24
  },
  refreshButton: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center'
  },
  refreshButtonText: {
    color: colors.blueDeep,
    fontSize: 14,
    fontWeight: '700'
  },
  shopStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14
  },
  statCard: {
    flex: 1,
    minWidth: 220,
    borderRadius: 24,
    backgroundColor: colors.mintSoft,
    padding: 20,
    gap: 10
  },
  pointCard: {
    backgroundColor: colors.blue
  },
  statLabel: {
    color: colors.mintDeep,
    fontSize: 14,
    fontWeight: '800'
  },
  pointValue: {
    color: colors.surface,
    fontSize: 34,
    fontWeight: '900'
  },
  statValue: {
    color: colors.blueDeep,
    fontSize: 30,
    fontWeight: '900'
  },
  statHint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20
  },
  messageBox: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  successBox: {
    backgroundColor: colors.successSoft
  },
  errorBox: {
    backgroundColor: colors.dangerSoft
  },
  successText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '700'
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700'
  },
  previewCard: {
    borderRadius: 28,
    padding: 24,
    gap: 18
  },
  previewHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12
  },
  previewEyebrow: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '800'
  },
  previewTitle: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900'
  },
  previewBalanceChip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  previewBalanceText: {
    color: colors.blueDeep,
    fontSize: 14,
    fontWeight: '800'
  },
  previewBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 18
  },
  previewAvatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center'
  },
  previewAvatarImage: {
    width: '100%',
    height: '100%'
  },
  previewAvatarFallback: {
    fontSize: 36,
    fontWeight: '900'
  },
  previewCopy: {
    flex: 1,
    minWidth: 220,
    gap: 8
  },
  previewName: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900'
  },
  previewSubtitle: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700'
  },
  titleChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  titleChipText: {
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '800'
  },
  sections: {
    gap: 18
  },
  sectionPanel: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 24,
    gap: 18
  },
  sectionHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12
  },
  sectionTitle: {
    color: colors.blueDeep,
    fontSize: 28,
    fontWeight: '900'
  },
  sectionDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 6
  },
  sectionMeta: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800'
  },
  itemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14
  },
  itemCard: {
    flexGrow: 1,
    flexBasis: 300,
    maxWidth: 360,
    minWidth: 260,
    borderRadius: 24,
    backgroundColor: colors.surfaceWarm,
    padding: 18,
    gap: 14
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  itemTypeChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  itemTypeChipText: {
    fontSize: 12,
    fontWeight: '800'
  },
  itemPriceText: {
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '800'
  },
  itemPreview: {
    minHeight: 128,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center'
  },
  itemAvatarImage: {
    width: 92,
    height: 92,
    borderRadius: 46
  },
  itemBackgroundImage: {
    width: '100%',
    height: '100%'
  },
  itemAvatarFallback: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center'
  },
  itemAvatarFallbackText: {
    fontSize: 34,
    fontWeight: '900'
  },
  itemBackgroundFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  itemBackgroundFallbackEmoji: {
    fontSize: 30
  },
  itemBackgroundFallbackText: {
    fontSize: 15,
    fontWeight: '800'
  },
  titlePreviewBox: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  titlePreviewText: {
    fontSize: 15,
    fontWeight: '900'
  },
  itemCopy: {
    gap: 6
  },
  itemName: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900'
  },
  itemDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22
  },
  itemActions: {
    marginTop: 'auto'
  },
  primaryActionButton: {
    minHeight: 46,
    borderRadius: 18,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14
  },
  primaryActionText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '800'
  },
  secondaryActionButton: {
    minHeight: 46,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14
  },
  secondaryActionText: {
    color: colors.blueDeep,
    fontSize: 14,
    fontWeight: '800'
  },
  activeActionButton: {
    backgroundColor: colors.mintSoft,
    borderColor: colors.mint
  },
  activeActionText: {
    color: colors.mintDeep
  },
  disabledButton: {
    opacity: 0.6
  },
  emptyPanel: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: 'dashed',
    padding: 20,
    gap: 8
  },
  emptyTitle: {
    color: colors.blueDeep,
    fontSize: 18,
    fontWeight: '800'
  },
  emptyDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22
  },
  historyList: {
    gap: 12
  },
  historyCard: {
    borderRadius: 20,
    backgroundColor: colors.surfaceWarm,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  historyName: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800'
  },
  historyMeta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4
  },
  historyPrice: {
    color: colors.blueDeep,
    fontSize: 15,
    fontWeight: '900'
  }
});
