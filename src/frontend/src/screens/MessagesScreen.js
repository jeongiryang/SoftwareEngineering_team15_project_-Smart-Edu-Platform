import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AccessibleTextInput from '../components/AccessibleTextInput';
import { PanelSkeleton } from '../components/Skeleton';
import {
  getFriends,
  getMessageThread,
  getMessageThreads,
  markMessageThreadRead,
  sendDirectMessage,
  startMessageThread
} from '../services/api';
import { useLanguage } from '../i18n';
import { colors, interactions, interactiveStateStyles, shadows } from '../styles/theme';

function getInitial(name = '') {
  return name.trim().slice(0, 1) || '?';
}

function formatTime(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString();
}

function getFriendName(friend) {
  return friend?.name || friend?.loginId || 'Friend';
}

function MessageAvatar({ name, online }) {
  return (
    <View style={styles.avatarWrap}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitial(name)}</Text>
      </View>
      <View style={[styles.onlineDot, online && styles.onlineDotActive]} />
    </View>
  );
}

function EmptyPanel({ actionLabel, description, onPress, title }) {
  return (
    <View style={styles.emptyPanel}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
      {onPress ? (
        <Pressable accessibilityRole="button" onPress={onPress} style={(state) => [styles.secondaryButton, ...interactiveStateStyles(state)]}>
          <Text style={styles.secondaryButtonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function MessagesScreen({ onMessagesChanged, onNavigate, realtimeEvent, routeParams, sendRealtimeEvent, token, user }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState([]);
  const [friends, setFriends] = useState([]);
  const [onlineFriendIds, setOnlineFriendIds] = useState(() => new Set());
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messageDraft, setMessageDraft] = useState('');
  const [busyKey, setBusyKey] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [typingFriendName, setTypingFriendName] = useState('');
  const lastTypingSentAtRef = useRef(0);
  const messagesScrollRef = useRef(null);
  const routeFriendHandledRef = useRef('');
  const composingRef = useRef(false);
  const typingClearTimerRef = useRef(null);
  const typingStopTimerRef = useRef(null);

  const selectedThreadMessages = selectedThread?.messages || [];
  const selectedFriend = selectedThread?.friend || null;
  const acceptedFriends = useMemo(() => friends.map((friendship) => friendship.user).filter(Boolean), [friends]);
  const threadFriendIds = useMemo(() => new Set(threads.map((thread) => Number(thread.friend?.id)).filter(Boolean)), [threads]);
  const availableFriends = acceptedFriends.filter((friend) => !threadFriendIds.has(Number(friend.id)));

  const clearTypingFriend = useCallback(() => {
    if (typingClearTimerRef.current) {
      clearTimeout(typingClearTimerRef.current);
      typingClearTimerRef.current = null;
    }

    setTypingFriendName('');
  }, []);

  const sendTypingState = useCallback((isTyping, { force = false } = {}) => {
    if (!selectedThreadId || typeof sendRealtimeEvent !== 'function') {
      return false;
    }

    const now = Date.now();
    if (isTyping && !force && now - lastTypingSentAtRef.current < 1500) {
      return false;
    }

    lastTypingSentAtRef.current = now;
    return sendRealtimeEvent({
      type: 'directMessage.typing',
      payload: {
        threadId: selectedThreadId,
        isTyping
      }
    });
  }, [selectedThreadId, sendRealtimeEvent]);

  const scrollMessagesToEnd = useCallback(() => {
    const scrollRef = messagesScrollRef.current;

    if (!scrollRef?.scrollToEnd) {
      return;
    }

    const runScroll = () => scrollRef.scrollToEnd({ animated: true });

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(runScroll);
    } else {
      setTimeout(runScroll, 0);
    }
  }, []);

  const loadThreads = useCallback(async () => {
    if (!token) {
      setThreads([]);
      return [];
    }

    const result = await getMessageThreads(token);
    const nextThreads = Array.isArray(result?.threads) ? result.threads : [];
    setThreads(nextThreads);
    onMessagesChanged?.(nextThreads);
    return nextThreads;
  }, [onMessagesChanged, token]);

  const loadFriends = useCallback(async () => {
    if (!token) {
      setFriends([]);
      return;
    }

    const result = await getFriends(token);
    setFriends(Array.isArray(result?.friends) ? result.friends : []);
    setOnlineFriendIds(new Set(Array.isArray(result?.onlineFriendIds) ? result.onlineFriendIds.map(Number) : []));
  }, [token]);

  const loadSelectedThread = useCallback(async (threadId, { markRead = true } = {}) => {
    if (!token || !threadId) {
      setSelectedThread(null);
      return null;
    }

    const result = await getMessageThread(token, threadId);
    const nextThread = result?.thread || null;
    setSelectedThread(nextThread);

    if (markRead && nextThread) {
      await markMessageThreadRead(token, nextThread.id);
    }

    return nextThread;
  }, [token]);

  const refreshAll = useCallback(async () => {
    setError('');
    setLoading(true);

    try {
      await Promise.all([loadThreads(), loadFriends()]);

      if (selectedThreadId) {
        await loadSelectedThread(selectedThreadId);
      }
    } catch (loadError) {
      setError(loadError.message || t('messages.errors.load', '쪽지 정보를 불러오지 못했습니다.'));
    } finally {
      setLoading(false);
    }
  }, [loadFriends, loadSelectedThread, loadThreads, selectedThreadId, t]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!realtimeEvent?.type) {
      return;
    }

    if (realtimeEvent.type === 'friends.presence.snapshot') {
      const onlineIds = Array.isArray(realtimeEvent.payload?.onlineFriendIds)
        ? realtimeEvent.payload.onlineFriendIds.map(Number).filter(Boolean)
        : [];
      setOnlineFriendIds(new Set(onlineIds));
      return;
    }

    if (realtimeEvent.type === 'friends.presence.updated') {
      const friendId = Number(realtimeEvent.payload?.userId);

      if (!friendId) {
        return;
      }

      setOnlineFriendIds((previousIds) => {
        const nextIds = new Set(previousIds);

        if (realtimeEvent.payload?.online) {
          nextIds.add(friendId);
        } else {
          nextIds.delete(friendId);
        }

        return nextIds;
      });
      return;
    }

    if (realtimeEvent.type === 'directMessage.created') {
      const eventThreadId = Number(realtimeEvent.payload?.thread?.id || realtimeEvent.payload?.message?.threadId);
      const senderId = Number(realtimeEvent.payload?.message?.senderId);

      loadThreads().catch(() => {});

      if (eventThreadId && eventThreadId === Number(selectedThreadId)) {
        loadSelectedThread(eventThreadId).catch(() => {});
        return;
      }

      if (senderId && senderId !== Number(user?.id)) {
        setNotice(t('messages.realtime.newMessage', '새 쪽지가 도착했습니다.'));
      }
      return;
    }

    if (realtimeEvent.type === 'directMessage.read') {
      loadThreads().catch(() => {});

      const eventThreadId = Number(realtimeEvent.payload?.threadId);
      if (eventThreadId && eventThreadId === Number(selectedThreadId)) {
        loadSelectedThread(eventThreadId, { markRead: false }).catch(() => {});
      }
      return;
    }

    if (realtimeEvent.type === 'directMessage.typing') {
      const eventThreadId = Number(realtimeEvent.payload?.threadId);
      const eventUserId = Number(realtimeEvent.payload?.userId);

      if (!eventThreadId || eventThreadId !== Number(selectedThreadId) || eventUserId === Number(user?.id)) {
        return;
      }

      if (!realtimeEvent.payload?.isTyping) {
        clearTypingFriend();
        return;
      }

      const nextTypingName = getFriendName(selectedFriend);
      setTypingFriendName(nextTypingName);

      if (typingClearTimerRef.current) {
        clearTimeout(typingClearTimerRef.current);
      }

      typingClearTimerRef.current = setTimeout(() => {
        setTypingFriendName('');
        typingClearTimerRef.current = null;
      }, 3500);
    }
  }, [clearTypingFriend, loadSelectedThread, loadThreads, realtimeEvent, selectedFriend, selectedThreadId, t, user?.id]);

  useEffect(() => {
    scrollMessagesToEnd();
  }, [scrollMessagesToEnd, selectedThreadMessages.length, typingFriendName]);

  useEffect(() => () => {
    if (typingClearTimerRef.current) {
      clearTimeout(typingClearTimerRef.current);
    }

    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
    }
  }, []);

  function handleMessageDraftChange(nextDraft) {
    setMessageDraft(nextDraft);

    if (!selectedThreadId) {
      return;
    }

    if (nextDraft.trim()) {
      sendTypingState(true);

      if (typingStopTimerRef.current) {
        clearTimeout(typingStopTimerRef.current);
      }

      typingStopTimerRef.current = setTimeout(() => {
        sendTypingState(false, { force: true });
        typingStopTimerRef.current = null;
      }, 2000);
      return;
    }

    sendTypingState(false, { force: true });
  }

  function handleViewProfile(friendId) {
    if (!friendId) {
      return;
    }

    onNavigate?.('publicProfile', { params: { userId: friendId } });
  }

  function handleComposerKeyPress(event) {
    const nativeEvent = event?.nativeEvent || {};
    const isEnter = nativeEvent.key === 'Enter' || event?.key === 'Enter';
    const isShiftEnter = Boolean(nativeEvent.shiftKey || event?.shiftKey);
    const isComposing = Boolean(nativeEvent.isComposing || event?.isComposing || composingRef.current);

    if (!isEnter || isShiftEnter || isComposing) {
      return;
    }

    event?.preventDefault?.();
    event?.stopPropagation?.();
    nativeEvent.preventDefault?.();
    nativeEvent.stopPropagation?.();
    handleSendMessage();
  }

  async function handleSelectThread(threadId) {
    if (!threadId || busyKey) {
      return;
    }

    setBusyKey(`select-${threadId}`);
    setError('');
    setNotice('');
    clearTypingFriend();
    sendTypingState(false, { force: true });
    setSelectedThreadId(threadId);

    try {
      await loadSelectedThread(threadId);
      const nextThreads = await loadThreads();
      onMessagesChanged?.(nextThreads);
    } catch (selectError) {
      setError(selectError.message || t('messages.errors.detail', '대화를 불러오지 못했습니다.'));
    } finally {
      setBusyKey('');
    }
  }

  async function handleStartThread(friendId) {
    if (!token || busyKey) {
      return;
    }

    setBusyKey(`start-${friendId}`);
    setError('');
    setNotice('');

    try {
      const result = await startMessageThread(token, friendId);
      const thread = result?.thread;
      await loadThreads();

      if (thread?.id) {
        setSelectedThreadId(thread.id);
        await loadSelectedThread(thread.id);
      }
    } catch (startError) {
      setError(startError.message || t('messages.errors.start', '대화를 시작하지 못했습니다.'));
    } finally {
      setBusyKey('');
    }
  }

  async function handleSendMessage() {
    const content = messageDraft.trim();

    if (!token || !selectedThreadId || busyKey || !content) {
      return;
    }

    setBusyKey('send');
    setError('');
    setNotice('');
    sendTypingState(false, { force: true });

    try {
      await sendDirectMessage(token, selectedThreadId, content);
      setMessageDraft('');
      await loadSelectedThread(selectedThreadId);
      const nextThreads = await loadThreads();
      onMessagesChanged?.(nextThreads);
    } catch (sendError) {
      setError(sendError.message || t('messages.errors.send', '쪽지를 보내지 못했습니다.'));
    } finally {
      setBusyKey('');
    }
  }

  useEffect(() => {
    const friendId = Number(routeParams?.friendId);

    if (!token || loading || busyKey || !friendId) {
      return;
    }

    const routeKey = String(friendId);

    if (routeFriendHandledRef.current === routeKey) {
      return;
    }

    const existingThread = threads.find((thread) => Number(thread.friend?.id) === friendId);
    const canStartThread = acceptedFriends.some((friend) => Number(friend.id) === friendId);

    if (!existingThread && !canStartThread) {
      return;
    }

    routeFriendHandledRef.current = routeKey;

    if (existingThread?.id) {
      handleSelectThread(existingThread.id);
    } else {
      handleStartThread(friendId);
    }
  }, [acceptedFriends, busyKey, loading, routeParams?.friendId, threads, token]);

  if (loading) {
    return (
      <View style={styles.screen}>
        <PanelSkeleton rows={4} />
        <PanelSkeleton rows={5} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.hero}>
        <View>
          <Text style={styles.eyebrow}>{t('messages.eyebrow', '실시간 친구 쪽지')}</Text>
          <Text style={styles.title}>{t('messages.title', '친구와 바로 이어지는 학습 쪽지')}</Text>
          <Text style={styles.description}>
            {t('messages.description', '수락된 친구끼리만 쪽지를 주고받습니다. WebSocket이 끊겨도 새로고침으로 다시 확인할 수 있습니다.')}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={refreshAll}
          style={(state) => [styles.secondaryButton, ...interactiveStateStyles(state)]}
        >
          <Text style={styles.secondaryButtonText}>{t('messages.refresh', '새로고침')}</Text>
        </Pressable>
      </View>

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.layout}>
        <View style={styles.threadPanel}>
          <Text style={styles.sectionTitle}>{t('messages.threadList', '대화 목록')}</Text>
          {threads.length ? (
            <View style={styles.threadList}>
              {threads.map((thread) => {
                const friendName = getFriendName(thread.friend);
                const active = Number(thread.id) === Number(selectedThreadId);
                const online = onlineFriendIds.has(Number(thread.friend?.id));

                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    key={thread.id}
                    onPress={() => handleSelectThread(thread.id)}
                    style={(state) => [
                      styles.threadItem,
                      active && styles.threadItemActive,
                      state.hovered && !active && styles.threadItemHover,
                      ...interactiveStateStyles(state)
                    ]}
                  >
                    <MessageAvatar name={friendName} online={online} />
                    <View style={styles.threadBody}>
                      <View style={styles.threadTopLine}>
                        <Text style={styles.threadName}>{friendName}</Text>
                        {thread.unreadCount > 0 ? (
                          <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>{thread.unreadCount > 99 ? '99+' : thread.unreadCount}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text numberOfLines={1} style={styles.threadPreview}>
                        {thread.lastMessage?.content || t('messages.noMessagesYet', '아직 메시지가 없습니다.')}
                      </Text>
                      <Text style={styles.threadMeta}>{formatTime(thread.lastMessageAt || thread.updatedAt)}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <EmptyPanel
              description={t('messages.emptyThreadsDescription', '친구 목록에서 대화를 시작해 보세요.')}
              title={t('messages.emptyThreadsTitle', '아직 쪽지가 없습니다.')}
            />
          )}

          <Text style={styles.sectionTitle}>{t('messages.startWithFriend', '친구와 대화 시작')}</Text>
          {availableFriends.length ? (
            <View style={styles.friendList}>
              {availableFriends.map((friend) => (
                <Pressable
                  accessibilityRole="button"
                  disabled={Boolean(busyKey)}
                  key={friend.id}
                  onPress={() => handleStartThread(friend.id)}
                  style={(state) => [styles.friendItem, Boolean(busyKey) && styles.disabled, ...interactiveStateStyles(state)]}
                >
                  <MessageAvatar name={getFriendName(friend)} online={onlineFriendIds.has(Number(friend.id))} />
                  <Text style={styles.friendName}>{getFriendName(friend)}</Text>
                  <Text style={styles.friendLoginId}>@{friend.loginId}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={styles.helperText}>{t('messages.noAvailableFriends', '새로 시작할 수 있는 친구 대화가 없습니다.')}</Text>
          )}
        </View>

        <View style={styles.conversationPanel}>
          {selectedThread ? (
            <>
              <Pressable
                accessibilityLabel={t('messages.viewFriendProfile', '친구 공개 프로필 보기')}
                accessibilityRole="button"
                onPress={() => handleViewProfile(selectedFriend?.id)}
                style={(state) => [styles.conversationHeader, ...interactiveStateStyles(state)]}
              >
                <MessageAvatar name={getFriendName(selectedFriend)} online={onlineFriendIds.has(Number(selectedFriend?.id))} />
                <View>
                  <Text style={styles.conversationTitle}>{getFriendName(selectedFriend)}</Text>
                  <Text style={styles.conversationMeta}>
                    {onlineFriendIds.has(Number(selectedFriend?.id))
                      ? t('messages.online', '온라인')
                      : t('messages.offline', '오프라인')}
                  </Text>
                </View>
              </Pressable>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                ref={messagesScrollRef}
                style={styles.messagesScroll}
                contentContainerStyle={styles.messages}
              >
                {selectedThreadMessages.length ? selectedThreadMessages.map((message) => {
                  const mine = Number(message.senderId) === Number(user?.id);

                  return (
                    <View key={message.id} style={[styles.messageBubbleRow, mine && styles.messageBubbleRowMine]}>
                      <View style={[styles.messageBubble, mine ? styles.messageBubbleMine : styles.messageBubbleFriend]}>
                        <Text style={[styles.messageSender, mine && styles.messageSenderMine]}>
                          {mine ? t('messages.me', '나') : getFriendName(message.sender)}
                        </Text>
                        <Text style={[styles.messageText, mine && styles.messageTextMine]}>{message.content}</Text>
                        <Text style={[styles.messageTime, mine && styles.messageTimeMine]}>{formatTime(message.createdAt)}</Text>
                      </View>
                    </View>
                  );
                }) : (
                  <EmptyPanel
                    description={t('messages.emptyConversationDescription', '첫 쪽지를 보내면 이곳에 대화가 쌓입니다.')}
                    title={t('messages.emptyConversationTitle', '대화가 비어 있습니다.')}
                  />
                )}
                {typingFriendName ? (
                  <View style={styles.typingBubbleRow}>
                    <View style={styles.typingBubble}>
                      <Text style={styles.typingText}>
                        {t('messages.typingIndicator', '사각사각 작성 중...')}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </ScrollView>

              <View style={styles.composer}>
                <AccessibleTextInput
                  accessibilityLabel={t('messages.composerLabel', '쪽지 입력')}
                  containerStyle={styles.composerInputWrap}
                  enableVoiceInput={false}
                  multiline
                  blurOnSubmit={false}
                  onCompositionEnd={() => {
                    composingRef.current = false;
                  }}
                  onCompositionStart={() => {
                    composingRef.current = true;
                  }}
                  onChangeText={handleMessageDraftChange}
                  onKeyPress={handleComposerKeyPress}
                  placeholder={t('messages.composerPlaceholder', '친구에게 보낼 쪽지를 입력하세요.')}
                  style={styles.composerInput}
                  value={messageDraft}
                />
                <Pressable
                  accessibilityRole="button"
                  disabled={busyKey === 'send' || !messageDraft.trim()}
                  onPress={handleSendMessage}
                  style={(state) => [
                    styles.sendButton,
                    (busyKey === 'send' || !messageDraft.trim()) && styles.disabled,
                    ...interactiveStateStyles(state)
                  ]}
                >
                  <Text style={styles.sendButtonText}>{busyKey === 'send' ? t('messages.sending', '전송 중') : t('messages.send', '보내기')}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <EmptyPanel
              actionLabel={t('messages.refresh', '새로고침')}
              description={t('messages.selectThreadDescription', '왼쪽에서 대화를 선택하거나 친구와 새 대화를 시작하세요.')}
              onPress={refreshAll}
              title={t('messages.selectThreadTitle', '대화를 선택해 주세요.')}
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    padding: 24,
    gap: 18
  },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    ...shadows.card
  },
  eyebrow: {
    color: colors.mintDeep,
    fontSize: 13,
    fontWeight: '900'
  },
  title: {
    color: colors.ink,
    fontSize: 25,
    fontWeight: '900',
    marginTop: 6
  },
  description: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    maxWidth: 720
  },
  layout: {
    flexDirection: 'row',
    gap: 18,
    alignItems: 'stretch'
  },
  threadPanel: {
    flex: 0.9,
    minWidth: 280,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 12
  },
  conversationPanel: {
    flex: 1.45,
    minWidth: 320,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 14
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900'
  },
  threadList: {
    gap: 8
  },
  threadItem: {
    minHeight: 78,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 11,
    flexDirection: 'row',
    gap: 11,
    alignItems: 'center',
    ...interactions.transition
  },
  threadItemActive: {
    borderColor: colors.mint,
    backgroundColor: colors.mintSoft
  },
  threadItemHover: {
    backgroundColor: colors.surface
  },
  threadBody: {
    flex: 1,
    minWidth: 0,
    gap: 3
  },
  threadTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  threadName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
    flexShrink: 1
  },
  threadPreview: {
    color: colors.muted,
    fontSize: 13
  },
  threadMeta: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700'
  },
  avatarWrap: {
    width: 42,
    height: 42,
    position: 'relative'
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.mint,
    backgroundColor: colors.mintSoft
  },
  avatarText: {
    color: colors.mintDeep,
    fontSize: 17,
    fontWeight: '900'
  },
  onlineDot: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.line
  },
  onlineDotActive: {
    backgroundColor: colors.mintDeep
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 999,
    paddingHorizontal: 6,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center'
  },
  unreadBadgeText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '900'
  },
  friendList: {
    gap: 8
  },
  friendItem: {
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...interactions.transition
  },
  friendName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900'
  },
  friendLoginId: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 'auto'
  },
  conversationHeader: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingBottom: 12
  },
  conversationTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900'
  },
  conversationMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2
  },
  messagesScroll: {
    minHeight: 360,
    maxHeight: 440
  },
  messages: {
    flexGrow: 1,
    minHeight: 360,
    paddingRight: 4,
    gap: 10
  },
  messageBubbleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  messageBubbleRowMine: {
    justifyContent: 'flex-end'
  },
  messageBubble: {
    maxWidth: '78%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    gap: 5
  },
  messageBubbleFriend: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.line
  },
  messageBubbleMine: {
    backgroundColor: colors.blue,
    borderColor: colors.blue
  },
  messageSender: {
    color: colors.mintDeep,
    fontSize: 12,
    fontWeight: '900'
  },
  messageSenderMine: {
    color: colors.surface
  },
  messageText: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 21
  },
  messageTextMine: {
    color: colors.surface
  },
  messageTime: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700'
  },
  messageTimeMine: {
    color: colors.blueSoft
  },
  typingBubbleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  typingBubble: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.mint,
    backgroundColor: colors.mintSoft,
    paddingHorizontal: 13,
    paddingVertical: 8
  },
  typingText: {
    color: colors.mintDeep,
    fontSize: 12,
    fontWeight: '900'
  },
  composer: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10
  },
  composerInputWrap: {
    flex: 1
  },
  composerInput: {
    minHeight: 52,
    maxHeight: 130,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    color: colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14
  },
  sendButton: {
    minHeight: 52,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    ...interactions.transition
  },
  sendButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '900'
  },
  secondaryButton: {
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...interactions.transition
  },
  secondaryButtonText: {
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '900'
  },
  emptyPanel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 18,
    gap: 8,
    alignItems: 'flex-start'
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900'
  },
  emptyDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20
  },
  helperText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20
  },
  notice: {
    color: colors.mintDeep,
    backgroundColor: colors.mintSoft,
    borderColor: colors.mint,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    fontWeight: '800'
  },
  error: {
    color: colors.danger,
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    fontWeight: '800'
  },
  disabled: {
    opacity: 0.55
  }
});
