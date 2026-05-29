import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AccessibleTextInput from '../components/AccessibleTextInput';
import FieldFeedback from '../components/FieldFeedback';
import { PanelSkeleton } from '../components/Skeleton';
import {
  deleteFriend,
  getFriendRequests,
  getFriends,
  respondToFriendRequest,
  searchUsers,
  sendFriendRequest
} from '../services/api';
import { colors, interactions, interactiveStateStyles, shadows } from '../styles/theme';

const EMPTY_REQUESTS = {
  received: [],
  sent: []
};

function getInitial(name = '') {
  return name.trim().slice(0, 1) || '친';
}

function getFriendlyError(error, fallback) {
  if (error?.status === 409) {
    return error.message || '이미 처리된 친구 관계입니다.';
  }

  if (error?.status === 404) {
    return error.message || '대상을 찾을 수 없습니다.';
  }

  if (error?.status === 403) {
    return '이 친구 요청을 처리할 권한이 없습니다.';
  }

  if (error?.status === 400) {
    return error.message || '입력값을 다시 확인해 주세요.';
  }

  return error?.message || fallback;
}

function getFriendSearchFeedback(keyword) {
  const trimmedKeyword = keyword.trim();

  if (!trimmedKeyword) {
    return { tone: 'info', message: '이름 또는 이메일 일부를 입력해 친구를 찾을 수 있어요.' };
  }

  if (trimmedKeyword.length < 2) {
    return { tone: 'warning', message: '검색어는 두 글자 이상 입력해 주세요.' };
  }

  return { tone: 'success', message: '검색할 준비가 됐어요. 친구 요청은 결과에서 보낼 수 있어요.' };
}

function RelationshipBadge({ status }) {
  const labels = {
    FRIENDS: '이미 친구',
    REQUEST_SENT: '요청 보냄',
    REQUEST_RECEIVED: '받은 요청',
    REQUEST_REJECTED: '다시 요청 가능',
    NONE: '친구 아님'
  };

  return (
    <View style={[styles.statusBadge, status === 'FRIENDS' && styles.statusBadgeMint]}>
      <Text style={styles.statusBadgeText}>{labels[status] || labels.NONE}</Text>
    </View>
  );
}

function UserAvatar({ name }) {
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{getInitial(name)}</Text>
    </View>
  );
}

function EmptyState({ actionLabel, description, onPress, title }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{description}</Text>
      {onPress ? (
        <Pressable accessibilityRole="button" onPress={onPress} style={(state) => [styles.emptyAction, ...interactiveStateStyles(state)]}>
          <Text style={styles.emptyActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function FriendsScreen({ onNavigate, token }) {
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState(EMPTY_REQUESTS);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busyKey, setBusyKey] = useState('');

  const receivedCount = requests.received.length;
  const sentCount = requests.sent.length;

  const summaryText = useMemo(() => {
    if (receivedCount > 0) {
      return `받은 친구 요청 ${receivedCount}건이 대기 중입니다.`;
    }

    if (friends.length > 0) {
      return `${friends.length}명의 친구와 학습 흐름을 이어갈 수 있습니다.`;
    }

    return '친구를 추가하면 함께 공부하는 흐름을 더 쉽게 만들 수 있습니다.';
  }, [friends.length, receivedCount]);

  const loadFriends = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const [friendResult, requestResult] = await Promise.all([
        getFriends(token),
        getFriendRequests(token)
      ]);

      setFriends(Array.isArray(friendResult?.friends) ? friendResult.friends : []);
      setRequests({
        ...EMPTY_REQUESTS,
        ...(requestResult?.requests || {})
      });
    } catch (loadError) {
      setError(getFriendlyError(loadError, '친구 정보를 불러오지 못했습니다.'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  async function handleSearch() {
    if (!token || searching) {
      return;
    }

    const keyword = searchKeyword.trim();
    setMessage('');
    setError('');

    if (keyword.length < 2) {
      setError('친구 검색어는 2글자 이상 입력해 주세요.');
      return;
    }

    setSearching(true);

    try {
      const result = await searchUsers(token, keyword);
      setSearchResults(Array.isArray(result?.users) ? result.users : []);
      setMessage(result?.users?.length ? '검색 결과를 확인했습니다.' : '검색 결과가 없습니다.');
    } catch (searchError) {
      setError(getFriendlyError(searchError, '친구 검색에 실패했습니다.'));
    } finally {
      setSearching(false);
    }
  }

  async function handleSendRequest(userId) {
    if (!token || busyKey) {
      return;
    }

    setBusyKey(`send-${userId}`);
    setMessage('');
    setError('');

    try {
      await sendFriendRequest(token, userId);
      setMessage('친구 요청을 보냈습니다.');
      await loadFriends();
      const keyword = searchKeyword.trim();

      if (keyword.length >= 2) {
        const result = await searchUsers(token, keyword);
        setSearchResults(Array.isArray(result?.users) ? result.users : []);
      }
    } catch (sendError) {
      setError(getFriendlyError(sendError, '친구 요청을 보내지 못했습니다.'));
    } finally {
      setBusyKey('');
    }
  }

  async function handleRespond(requestId, action) {
    if (!token || busyKey) {
      return;
    }

    setBusyKey(`${action}-${requestId}`);
    setMessage('');
    setError('');

    try {
      await respondToFriendRequest(token, requestId, action);
      setMessage(action === 'ACCEPT' ? '친구 요청을 수락했습니다.' : '친구 요청을 거절했습니다.');
      await loadFriends();
    } catch (respondError) {
      setError(getFriendlyError(respondError, '친구 요청을 처리하지 못했습니다.'));
    } finally {
      setBusyKey('');
    }
  }

  async function handleDeleteFriend(friendId) {
    if (!token || busyKey) {
      return;
    }

    setBusyKey(`delete-${friendId}`);
    setMessage('');
    setError('');

    try {
      await deleteFriend(token, friendId);
      setMessage('친구 목록에서 삭제했습니다.');
      await loadFriends();
    } catch (deleteError) {
      setError(getFriendlyError(deleteError, '친구를 삭제하지 못했습니다.'));
    } finally {
      setBusyKey('');
    }
  }

  function renderFriendCard(item) {
    const friend = item.user;

    return (
      <View key={item.id} style={[styles.friendCard, shadows.card]}>
        <UserAvatar name={friend?.name} />
        <View style={styles.friendCopy}>
          <Text style={styles.friendName}>{friend?.name || '학습 친구'}</Text>
          <Text style={styles.friendMeta}>{friend?.preferredSubject || friend?.learningGoal || friend?.emailMasked || '함께 공부할 친구'}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={busyKey === `delete-${friend?.id}`}
          onPress={() => handleDeleteFriend(friend?.id)}
          style={(state) => [
            styles.ghostButton,
            busyKey === `delete-${friend?.id}` && styles.disabledButton,
            ...interactiveStateStyles(state, { disabled: busyKey === `delete-${friend?.id}` })
          ]}
        >
          <Text style={styles.ghostButtonText}>삭제</Text>
        </Pressable>
      </View>
    );
  }

  function renderRequestCard(item, direction) {
    const requestUser = item.user;
    const isReceived = direction === 'received';

    return (
      <View key={item.id} style={styles.requestCard}>
        <UserAvatar name={requestUser?.name} />
        <View style={styles.friendCopy}>
          <Text style={styles.friendName}>{requestUser?.name || '학습 친구'}</Text>
          <Text style={styles.friendMeta}>{isReceived ? '친구 요청을 보냈습니다.' : '수락 대기 중입니다.'}</Text>
        </View>
        {isReceived ? (
          <View style={styles.requestActions}>
            <Pressable
              accessibilityRole="button"
              disabled={Boolean(busyKey)}
              onPress={() => handleRespond(item.id, 'ACCEPT')}
              style={(state) => [styles.primarySmallButton, Boolean(busyKey) && styles.disabledButton, ...interactiveStateStyles(state, { disabled: Boolean(busyKey) })]}
            >
              <Text style={styles.primarySmallText}>수락</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={Boolean(busyKey)}
              onPress={() => handleRespond(item.id, 'REJECT')}
              style={(state) => [styles.ghostButton, Boolean(busyKey) && styles.disabledButton, ...interactiveStateStyles(state, { disabled: Boolean(busyKey) })]}
            >
              <Text style={styles.ghostButtonText}>거절</Text>
            </Pressable>
          </View>
        ) : (
          <RelationshipBadge status="REQUEST_SENT" />
        )}
      </View>
    );
  }

  function renderSearchResult(user) {
    const canSend = user.relationshipStatus === 'NONE' || user.relationshipStatus === 'REQUEST_REJECTED';
    const disabled = !canSend || busyKey === `send-${user.id}`;

    return (
      <View key={user.id} style={styles.searchCard}>
        <UserAvatar name={user.name} />
        <View style={styles.friendCopy}>
          <Text style={styles.friendName}>{user.name}</Text>
          <Text style={styles.friendMeta}>{user.preferredSubject || user.learningGoal || user.emailMasked || '학습 친구 후보'}</Text>
        </View>
        <RelationshipBadge status={user.relationshipStatus} />
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={() => handleSendRequest(user.id)}
          style={(state) => [
            styles.primarySmallButton,
            disabled && styles.disabledButton,
            ...interactiveStateStyles(state, { disabled })
          ]}
        >
          <Text style={styles.primarySmallText}>{canSend ? '요청' : '대기'}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.hero, shadows.card]}>
        <View>
          <Text style={styles.eyebrow}>FRIENDS</Text>
          <Text style={styles.title}>친구와 함께 학습 흐름을 이어가기</Text>
          <Text style={styles.subtitle}>{summaryText}</Text>
        </View>
        <View style={styles.heroActions}>
          <Pressable accessibilityRole="button" onPress={loadFriends} style={(state) => [styles.secondaryButton, ...interactiveStateStyles(state)]}>
            <Text style={styles.secondaryButtonText}>새로고침</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => onNavigate('profile')} style={(state) => [styles.primaryButton, ...interactiveStateStyles(state)]}>
            <Text style={styles.primaryButtonText}>마이페이지</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.skeletonGrid}>
          <PanelSkeleton rows={4} />
          <PanelSkeleton rows={3} />
          <PanelSkeleton rows={3} />
        </View>
      ) : (
        <>
          {message ? <Text style={styles.successMessage}>{message}</Text> : null}
          {error ? <Text style={styles.errorMessage}>{error}</Text> : null}

          <View style={[styles.sectionCard, shadows.card]}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>친구 검색</Text>
                <Text style={styles.sectionSubtitle}>이름 또는 이메일 일부로 친구를 찾아 요청을 보낼 수 있습니다.</Text>
              </View>
            </View>
            <View style={styles.searchRow}>
              <AccessibleTextInput
                accessibilityLabel="친구 검색어"
                containerStyle={styles.searchInputContainer}
                onChangeText={setSearchKeyword}
                onSubmitEditing={handleSearch}
                placeholder="친구 이름 또는 이메일"
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
                value={searchKeyword}
              />
              <Pressable
                accessibilityRole="button"
                disabled={searching}
                onPress={handleSearch}
                style={(state) => [styles.primaryButton, searching && styles.disabledButton, ...interactiveStateStyles(state, { disabled: searching })]}
              >
                <Text style={styles.primaryButtonText}>{searching ? '검색 중' : '검색'}</Text>
              </Pressable>
            </View>
            <FieldFeedback {...getFriendSearchFeedback(searchKeyword)} />
            {searchResults.length ? (
              <View style={styles.listGroup}>
                {searchResults.map(renderSearchResult)}
              </View>
            ) : (
              <EmptyState
                title="검색 결과가 아직 없습니다."
                description="친구 이름이나 이메일 일부를 2글자 이상 입력해 보세요."
                actionLabel="커뮤니티 보기"
                onPress={() => onNavigate('community')}
              />
            )}
          </View>

          <View style={styles.twoColumnGrid}>
            <View style={[styles.sectionCard, shadows.card]}>
              <Text style={styles.sectionTitle}>받은 요청</Text>
              <Text style={styles.sectionSubtitle}>친구 요청은 수신한 사용자만 수락하거나 거절할 수 있습니다.</Text>
              {requests.received.length ? (
                <View style={styles.listGroup}>
                  {requests.received.map((item) => renderRequestCard(item, 'received'))}
                </View>
              ) : (
                <EmptyState
                  title="받은 친구 요청이 없습니다."
                  description="새 요청이 오면 여기에서 바로 확인할 수 있습니다."
                />
              )}
            </View>

            <View style={[styles.sectionCard, shadows.card]}>
              <Text style={styles.sectionTitle}>보낸 요청</Text>
              <Text style={styles.sectionSubtitle}>상대가 수락하면 친구 목록에 자동으로 표시됩니다.</Text>
              {requests.sent.length ? (
                <View style={styles.listGroup}>
                  {requests.sent.map((item) => renderRequestCard(item, 'sent'))}
                </View>
              ) : (
                <EmptyState
                  title="보낸 요청이 없습니다."
                  description="학습 친구를 검색해서 먼저 요청을 보내 보세요."
                />
              )}
            </View>
          </View>

          <View style={[styles.sectionCard, shadows.card]}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>친구 목록</Text>
                <Text style={styles.sectionSubtitle}>DM, 그룹, 차단 기능은 후속 범위로 두고 1차 MVP는 관계 관리에 집중합니다.</Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{friends.length}명</Text>
              </View>
            </View>
            {friends.length ? (
              <View style={styles.friendGrid}>
                {friends.map(renderFriendCard)}
              </View>
            ) : (
              <EmptyState
                title="아직 친구가 없습니다."
                description="친구를 추가하면 향후 친구 랭킹, 협동 퀘스트, 스터디 보스 레이드의 기반으로 활용할 수 있습니다."
                actionLabel="친구 검색하기"
                onPress={handleSearch}
              />
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 56,
    gap: 22
  },
  hero: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 28,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 18
  },
  eyebrow: {
    color: colors.mintDeep,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 8
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 10
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.blue,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
    ...interactions.transition
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '900'
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
    ...interactions.transition
  },
  secondaryButtonText: {
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '900'
  },
  skeletonGrid: {
    gap: 16
  },
  successMessage: {
    borderRadius: 16,
    backgroundColor: colors.successSoft,
    color: colors.success,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 13,
    fontWeight: '800'
  },
  errorMessage: {
    borderRadius: 16,
    backgroundColor: colors.dangerSoft,
    color: colors.danger,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 13,
    fontWeight: '800'
  },
  sectionCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 22,
    gap: 16
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900'
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6
  },
  searchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  searchInputContainer: {
    flex: 1,
    minWidth: 220
  },
  searchInput: {
    flex: 1,
    minWidth: 220,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    color: colors.ink,
    fontSize: 14,
    paddingHorizontal: 14
  },
  listGroup: {
    gap: 10
  },
  searchCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    ...interactions.transition
  },
  requestCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12
  },
  friendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  friendCard: {
    flexGrow: 1,
    flexBasis: '31%',
    minWidth: 260,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...interactions.transition
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.mintSoft,
    borderWidth: 1,
    borderColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    color: colors.blueDeep,
    fontSize: 18,
    fontWeight: '900'
  },
  friendCopy: {
    flex: 1,
    minWidth: 150,
    gap: 4
  },
  friendName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900'
  },
  friendMeta: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18
  },
  statusBadge: {
    borderRadius: 999,
    backgroundColor: colors.blueSoft,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  statusBadgeMint: {
    backgroundColor: colors.mintSoft
  },
  statusBadgeText: {
    color: colors.blueDeep,
    fontSize: 11,
    fontWeight: '900'
  },
  primarySmallButton: {
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.blue,
    paddingHorizontal: 14,
    justifyContent: 'center',
    ...interactions.transition
  },
  primarySmallText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '900'
  },
  ghostButton: {
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    justifyContent: 'center',
    ...interactions.transition
  },
  ghostButtonText: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '900'
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8
  },
  twoColumnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18
  },
  countBadge: {
    borderRadius: 999,
    backgroundColor: colors.mintSoft,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  countBadgeText: {
    color: colors.mintDeep,
    fontSize: 12,
    fontWeight: '900'
  },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 18,
    gap: 10
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900'
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20
  },
  emptyAction: {
    alignSelf: 'flex-start',
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.blue,
    paddingHorizontal: 15,
    justifyContent: 'center',
    ...interactions.transition
  },
  emptyActionText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '900'
  },
  disabledButton: {
    opacity: 0.55
  }
});
