import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SHOP_ASSET_SOURCE_MAP } from '../assets/shop/shopAssetMap';
import { PanelSkeleton } from '../components/Skeleton';
import {
  equipShopItem,
  getMyShop,
  getShopItems,
  purchaseShopItem,
  unequipShopItem
} from '../services/api';
import { useLanguage } from '../i18n';
import { colors, shadows } from '../styles/theme';

const ITEM_SECTION_META = {
  PROFILE_IMAGE: {
    title: '프로필 이미지',
    description: '아바타 스타일 아이템을 구매해서 프로필 이미지를 바꿀 수 있어요.',
    emoji: '🖼️',
    defaultLabel: '프로필 기본으로'
  },
  PROFILE_BACKGROUND: {
    title: '프로필 배경',
    description: '프로필 카드 분위기를 바꿔주는 배경 아이템입니다.',
    emoji: '🎨',
    defaultLabel: '배경 기본으로'
  },
  TITLE: {
    title: '칭호',
    description: '학습 스타일을 보여주는 칭호를 구매하고 적용할 수 있어요.',
    emoji: '🏷️',
    defaultLabel: '칭호 기본으로'
  }
};

const EQUIPPED_ITEM_KEYS = {
  PROFILE_IMAGE: 'profileImage',
  PROFILE_BACKGROUND: 'profileBackground',
  TITLE: 'title'
};

const LOCALE_MAP = {
  ko: 'ko-KR',
  en: 'en-US',
  ja: 'ja-JP',
  zh: 'zh-CN'
};

function formatNumber(value, language = 'ko') {
  return new Intl.NumberFormat(LOCALE_MAP[language] || LOCALE_MAP.ko).format(Number(value || 0));
}

function formatPointLabel(value, language = 'ko') {
  const formatted = formatNumber(value, language);

  if (language === 'en') {
    return `${formatted} pts`;
  }

  if (language === 'zh') {
    return `${formatted} 积分`;
  }

  return `${formatted}P`;
}

function formatCount(value, language = 'ko') {
  const formatted = formatNumber(value, language);

  if (language === 'en') {
    return Number(value || 0) === 1 ? `${formatted} item` : `${formatted} items`;
  }

  if (language === 'zh') {
    return `${formatted} 个`;
  }

  if (language === 'ja') {
    return `${formatted}個`;
  }

  return `${formatted}개`;
}

function formatPurchaseDate(value, language = 'ko') {
  return new Date(value).toLocaleDateString(LOCALE_MAP[language] || LOCALE_MAP.ko);
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

  if (code.includes('CORAL') || code.includes('SUNSET')) {
    return {
      background: '#FFF1EA',
      accent: '#C46A41',
      surface: '#FFF9F5'
    };
  }

  return {
    background: '#F0F3FF',
    accent: '#465D9C',
    surface: '#FAFBFF'
  };
}

function getInitialLabel(text = '') {
  const trimmed = String(text || '').trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : 'S';
}

function getLocalizedItemName(item, translateText) {
  return translateText(item.name);
}

function getLocalizedItemDescription(item, translateText) {
  return translateText(item.description || '설명이 아직 준비되지 않았어요.');
}

function getItemStatusLabel(item, language, translateText) {
  if (item.equipped) {
    return translateText('적용 중');
  }

  if (item.owned) {
    return translateText('보유 중');
  }

  return formatPointLabel(item.price, language);
}

function getPurchaseMessage(item, language, translateText) {
  const itemName = getLocalizedItemName(item, translateText);
  const price = formatPointLabel(item.price, language);

  if (language === 'en') {
    return `Purchased "${itemName}" for ${price}.`;
  }

  if (language === 'ja') {
    return `「${itemName}」を${price}で購入しました。`;
  }

  if (language === 'zh') {
    return `已用 ${price} 购买“${itemName}”。`;
  }

  return `${price}로 "${itemName}" 아이템을 구매했어요.`;
}

function getEquipMessage(item, language, translateText) {
  const itemName = getLocalizedItemName(item, translateText);

  if (language === 'en') {
    if (item.type === 'PROFILE_IMAGE') {
      return `Applied "${itemName}" as your profile image.`;
    }

    if (item.type === 'PROFILE_BACKGROUND') {
      return `Applied "${itemName}" as your profile background.`;
    }

    return `Applied "${itemName}" as your title.`;
  }

  if (language === 'ja') {
    if (item.type === 'PROFILE_IMAGE') {
      return `「${itemName}」をプロフィール画像に適用しました。`;
    }

    if (item.type === 'PROFILE_BACKGROUND') {
      return `「${itemName}」をプロフィール背景に適用しました。`;
    }

    return `「${itemName}」を称号に適用しました。`;
  }

  if (language === 'zh') {
    if (item.type === 'PROFILE_IMAGE') {
      return `已将“${itemName}”设为个人头像。`;
    }

    if (item.type === 'PROFILE_BACKGROUND') {
      return `已将“${itemName}”设为个人背景。`;
    }

    return `已将“${itemName}”设为称号。`;
  }

  if (item.type === 'PROFILE_IMAGE') {
    return `"${itemName}" 프로필 이미지를 적용했어요.`;
  }

  if (item.type === 'PROFILE_BACKGROUND') {
    return `"${itemName}" 프로필 배경을 적용했어요.`;
  }

  return `"${itemName}" 칭호를 적용했어요.`;
}

function getShopErrorMessage(error, translateText, fallback) {
  const message = error?.message || '';
  const knownMessages = {
    'Shop item already purchased': '이미 구매한 아이템이에요.',
    'Not enough points to purchase this item': '포인트가 부족해요.',
    'Purchase the shop item before equipping it': '구매한 아이템만 적용할 수 있어요.',
    'Shop item not found': '상점 아이템을 찾지 못했어요.',
    'type must be one of PROFILE_IMAGE, PROFILE_BACKGROUND, TITLE': '지원하지 않는 꾸미기 타입이에요.'
  };

  return translateText(knownMessages[message] || fallback);
}

function resolveAssetSource(assetUrl) {
  if (!assetUrl) {
    return null;
  }

  return SHOP_ASSET_SOURCE_MAP[assetUrl] || null;
}

function ProfilePreview({ currentLanguage, translateText, user, shop, failedImages, onImageError }) {
  const profile = shop.profile || {};
  const avatarTone = getPreviewTone(shop.equippedItems?.profileImage?.code || 'PROFILE');
  const avatarUri = profile.profileImageUrl;
  const backgroundUri = profile.profileBackgroundUrl;
  const resolvedAvatarSource = resolveAssetSource(avatarUri);
  const resolvedBackgroundSource = resolveAssetSource(backgroundUri);
  const avatarFailed = avatarUri ? failedImages[`profile-${avatarUri}`] : false;
  const backgroundFailed = backgroundUri ? failedImages[`background-${backgroundUri}`] : false;
  const titleText = profile.titleText ? translateText(profile.titleText) : translateText('아직 적용된 칭호가 없어요');

  return (
    <View style={[styles.previewCard, shadows.card]}>
      {resolvedBackgroundSource && !backgroundFailed ? (
        <Image
          source={resolvedBackgroundSource}
          style={styles.previewBackgroundImage}
          resizeMode="cover"
          onError={() => onImageError(`background-${backgroundUri}`)}
        />
      ) : (
        <View style={styles.previewBackgroundFallback} />
      )}
      <View style={styles.previewBackgroundOverlay} />

      <View style={styles.previewHeader}>
        <View>
          <Text style={styles.previewEyebrow}>{translateText('현재 적용 상태')}</Text>
          <Text style={styles.previewTitle}>{translateText('내 꾸미기 미리보기')}</Text>
        </View>
        <View style={styles.previewBalanceChip}>
          <Text style={styles.previewBalanceText}>{formatPointLabel(shop.account?.pointBalance, currentLanguage)}</Text>
        </View>
      </View>

      <View style={styles.previewBody}>
        <View style={[styles.previewAvatar, { backgroundColor: avatarTone.surface }]}>
          {resolvedAvatarSource && !avatarFailed ? (
            <Image
              source={resolvedAvatarSource}
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
          <Text style={styles.previewName}>{user?.name || translateText('학습자')}</Text>
          <View style={styles.previewTitleWrap}>
            <Text style={styles.previewTitleLabel}>{translateText('현재 칭호')}</Text>
            <View style={styles.titleChip}>
              <Text style={styles.titleChipIcon}>✦</Text>
              <Text style={styles.titleChipText}>{titleText}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function ShopItemCard({
  currentLanguage,
  item,
  meta,
  busyItemId,
  failedImages,
  onEquip,
  onImageError,
  onPurchase,
  translateText
}) {
  const tone = getPreviewTone(item.code);
  const previewKey = `item-${item.id}`;
  const imageFailed = item.assetUrl ? failedImages[previewKey] : false;
  const resolvedAssetSource = resolveAssetSource(item.assetUrl);
  const purchasing = busyItemId === `purchase-${item.id}`;
  const equipping = busyItemId === `equip-${item.id}`;
  const busy = purchasing || equipping;

  return (
    <View style={[styles.itemCard, shadows.card]}>
      <View style={styles.itemCardHeader}>
        <View style={[styles.itemTypeChip, { backgroundColor: tone.background }]}>
          <Text style={[styles.itemTypeChipText, { color: tone.accent }]}>{translateText(meta.title)}</Text>
        </View>
        <Text style={styles.itemPriceText}>{getItemStatusLabel(item, currentLanguage, translateText)}</Text>
      </View>

      <View style={[styles.itemPreview, { backgroundColor: tone.background }]}>
        {item.type === 'TITLE' ? (
          <View style={styles.titlePreviewBox}>
            <Text style={[styles.titlePreviewIcon, { color: tone.accent }]}>✦</Text>
            <Text style={[styles.titlePreviewText, { color: tone.accent }]}>{getLocalizedItemName(item, translateText)}</Text>
          </View>
        ) : resolvedAssetSource && !imageFailed ? (
          <Image
            source={resolvedAssetSource}
            style={item.type === 'PROFILE_IMAGE' ? styles.itemAvatarImage : styles.itemBackgroundImage}
            resizeMode="cover"
            onError={() => onImageError(previewKey)}
          />
        ) : item.type === 'PROFILE_IMAGE' ? (
          <View style={[styles.itemAvatarFallback, { backgroundColor: colors.surface }]}>
            <Text style={[styles.itemAvatarFallbackText, { color: tone.accent }]}>{getInitialLabel(item.name)}</Text>
          </View>
        ) : (
          <View style={[styles.itemBackgroundFallback, { backgroundColor: colors.surface }]}>
            <Text style={[styles.itemBackgroundFallbackEmoji, { color: tone.accent }]}>🎒</Text>
            <Text style={[styles.itemBackgroundFallbackText, { color: tone.accent }]}>{getLocalizedItemName(item, translateText)}</Text>
          </View>
        )}
      </View>

      <View style={styles.itemCopy}>
        <Text style={styles.itemName}>{getLocalizedItemName(item, translateText)}</Text>
        <Text style={styles.itemDescription}>{getLocalizedItemDescription(item, translateText)}</Text>
      </View>

      <View style={styles.itemActions}>
        {!item.owned ? (
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => onPurchase(item)}
            style={[styles.primaryActionButton, busy && styles.disabledButton]}
          >
            <Text style={styles.primaryActionText}>
              {busy ? translateText('구매 중...') : `${translateText('구매하기')} · ${formatPointLabel(item.price, currentLanguage)}`}
            </Text>
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
              {busy ? translateText('적용 중...') : item.equipped ? translateText('적용 중') : translateText('적용하기')}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function PurchaseHistory({ currentLanguage, purchases, translateText }) {
  if (!purchases.length) {
    return (
      <View style={styles.emptyPanel}>
        <Text style={styles.emptyTitle}>{translateText('아직 구매한 아이템이 없어요')}</Text>
        <Text style={styles.emptyDescription}>{translateText('포인트를 모은 뒤 원하는 꾸미기 아이템을 골라 보세요.')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.historyList}>
      {purchases.map((purchase) => (
        <View key={purchase.id} style={styles.historyCard}>
          <View>
            <Text style={styles.historyName}>{getLocalizedItemName(purchase.item, translateText)}</Text>
            <Text style={styles.historyMeta}>
              {translateText(ITEM_SECTION_META[purchase.item.type].title)} · {formatPurchaseDate(purchase.purchasedAt, currentLanguage)}
            </Text>
          </View>
          <Text style={styles.historyPrice}>{formatPointLabel(purchase.item.price, currentLanguage)}</Text>
        </View>
      ))}
    </View>
  );
}

export default function PointShopScreen({ token, user }) {
  const { currentLanguage, translateText } = useLanguage();
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
      setErrorMessage(getShopErrorMessage(error, translateText, '포인트 상점 정보를 불러오지 못했어요.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, translateText]);

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
      setSuccessMessage(getPurchaseMessage(item, currentLanguage, translateText));
      await loadShop(true);
    } catch (error) {
      setErrorMessage(getShopErrorMessage(error, translateText, '아이템 구매에 실패했습니다.'));
    } finally {
      setBusyItemId('');
    }
  }

  async function handleEquip(item) {
    setBusyItemId(`equip-${item.id}`);
    setErrorMessage('');

    try {
      await equipShopItem(token, item.id);
      setSuccessMessage(getEquipMessage(item, currentLanguage, translateText));
      await loadShop(true);
    } catch (error) {
      setErrorMessage(getShopErrorMessage(error, translateText, '아이템 적용에 실패했습니다.'));
    } finally {
      setBusyItemId('');
    }
  }

  async function handleReset(type) {
    setBusyItemId(`unequip-${type}`);
    setErrorMessage('');

    try {
      await unequipShopItem(token, type);
      setSuccessMessage(translateText('기본 꾸미기 상태로 되돌렸어요.'));
      await loadShop(true);
    } catch (error) {
      setErrorMessage(getShopErrorMessage(error, translateText, '기본 상태로 되돌리지 못했어요.'));
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
            <Text style={styles.heroTitle}>{translateText('포인트 상점')}</Text>
            <Text style={styles.heroDescription}>
              {translateText('보상으로 모은 포인트로 프로필 이미지, 배경, 칭호를 구매하고 적용할 수 있어요.')}
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
            <Text style={styles.refreshButtonText}>{refreshing ? translateText('불러오는 중') : translateText('새로고침')}</Text>
          </Pressable>
        </View>

        <View style={styles.shopStatsRow}>
          <View style={[styles.statCard, styles.pointCard]}>
            <Text style={styles.statLabel}>{translateText('현재 포인트')}</Text>
            <Text style={styles.pointValue}>{formatPointLabel(shop.account?.pointBalance, currentLanguage)}</Text>
            <Text style={[styles.statHint, styles.pointHint]}>
              {translateText('퀘스트 보상으로 포인트를 모은 뒤 원하는 아이템을 구매해 보세요.')}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{translateText('구매한 아이템')}</Text>
            <Text style={styles.statValue}>{formatCount(shop.purchases?.length, currentLanguage)}</Text>
            <Text style={styles.statHint}>{translateText('구매한 아이템은 언제든 다시 적용할 수 있어요.')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{translateText('적용 중인 꾸미기')}</Text>
            <Text style={styles.statValue}>
              {formatCount(Object.values(shop.equippedItems || {}).filter(Boolean).length, currentLanguage)}
            </Text>
            <Text style={styles.statHint}>{translateText('프로필 이미지, 배경, 칭호를 조합해서 내 스타일을 만들 수 있어요.')}</Text>
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
        currentLanguage={currentLanguage}
        user={user}
        shop={shop}
        failedImages={failedImages}
        onImageError={handleImageError}
        translateText={translateText}
      />

      <View style={styles.sections}>
        {Object.entries(ITEM_SECTION_META).map(([type, meta]) => {
          const equippedItem = shop.equippedItems?.[EQUIPPED_ITEM_KEYS[type]] || null;
          const resetting = busyItemId === `unequip-${type}`;

          return (
            <View key={type} style={[styles.sectionPanel, shadows.card]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderCopy}>
                  <Text style={styles.sectionTitle}>{meta.emoji} {translateText(meta.title)}</Text>
                  <Text style={styles.sectionDescription}>{translateText(meta.description)}</Text>
                </View>
                <View style={styles.sectionHeaderActions}>
                  <Text style={styles.sectionMeta}>{formatCount(itemsByType[type].length, currentLanguage)}</Text>
                  <Pressable
                    accessibilityRole="button"
                    disabled={!equippedItem || resetting}
                    onPress={() => handleReset(type)}
                    style={[
                      styles.sectionResetButton,
                      (!equippedItem || resetting) && styles.disabledButton
                    ]}
                  >
                    <Text style={styles.sectionResetButtonText}>
                      {resetting ? translateText('변경 중...') : translateText(meta.defaultLabel)}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.itemGrid}>
                {itemsByType[type].map((item) => (
                  <ShopItemCard
                    currentLanguage={currentLanguage}
                    key={item.id}
                    item={item}
                    meta={meta}
                    busyItemId={busyItemId}
                    failedImages={failedImages}
                    onPurchase={handlePurchase}
                    onEquip={handleEquip}
                    onImageError={handleImageError}
                    translateText={translateText}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </View>

      <View style={[styles.sectionPanel, shadows.card]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>🧾 {translateText('구매한 아이템')}</Text>
            <Text style={styles.sectionDescription}>{translateText('포인트를 사용해 얻은 꾸미기 아이템 목록입니다.')}</Text>
          </View>
          <Text style={styles.sectionMeta}>{formatCount(shop.purchases?.length || 0, currentLanguage)}</Text>
        </View>
        <PurchaseHistory
          currentLanguage={currentLanguage}
          purchases={shop.purchases || []}
          translateText={translateText}
        />
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
  pointHint: {
    color: '#E3EBF7'
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
    position: 'relative',
    borderRadius: 28,
    overflow: 'hidden',
    padding: 24,
    gap: 18,
    minHeight: 220,
    backgroundColor: colors.surface
  },
  previewBackgroundImage: {
    ...StyleSheet.absoluteFillObject
  },
  previewBackgroundFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.blueSoft
  },
  previewBackgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.18)'
  },
  previewHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 1
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
    backgroundColor: 'rgba(255,255,255,0.9)',
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
    gap: 18,
    zIndex: 1
  },
  previewAvatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.88)'
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
    gap: 12
  },
  previewName: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900'
  },
  previewTitleWrap: {
    gap: 8
  },
  previewTitleLabel: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4
  },
  titleChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(23,59,99,0.12)',
    backgroundColor: 'rgba(255,255,255,0.88)'
  },
  titleChipIcon: {
    color: colors.mintDeep,
    fontSize: 13,
    fontWeight: '900'
  },
  titleChipText: {
    color: colors.blueDeep,
    fontSize: 14,
    fontWeight: '900'
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
  sectionHeaderCopy: {
    flex: 1,
    minWidth: 240
  },
  sectionHeaderActions: {
    alignItems: 'flex-end',
    gap: 10
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
  sectionResetButton: {
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionResetButtonText: {
    color: colors.blueDeep,
    fontSize: 13,
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
    width: '100%',
    height: '100%'
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
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderWidth: 1,
    borderColor: 'rgba(23,59,99,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  titlePreviewIcon: {
    fontSize: 14,
    fontWeight: '900'
  },
  titlePreviewText: {
    fontSize: 16,
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
