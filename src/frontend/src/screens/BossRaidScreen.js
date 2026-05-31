import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import {
  claimBossRaidReward,
  createBossRaidParty,
  getBossRaidPartyDetail,
  getBossRaids,
  getMyBossRaidParties,
  getPublicBossRaidParties,
  joinPublicBossRaidParty,
  joinBossRaidParty
} from '../services/api';
import { ProfileAvatar, ProfileTitleChip } from '../components/ProfileAppearance';
import { languageIntlLocale, useLanguage } from '../i18n';
import { colors, interactiveStateStyles, radii, shadows } from '../styles/theme';

function formatNumber(value, locale = 'ko-KR') {
  return Intl.NumberFormat(locale).format(Number(value) || 0);
}

function formatDate(value, locale = 'ko-KR') {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleDateString(locale);
}

function interpolate(template, values) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template
  );
}

function getProgressRate(totalDamage, maxHp) {
  if (!maxHp || maxHp <= 0) {
    return 0;
  }

  return Math.min(totalDamage / maxHp, 1);
}

function BossImage({ imageUrl, name }) {
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return (
      <View style={styles.bossImageFallback}>
        <Text style={styles.bossImageFallbackEmoji}>👹</Text>
        <Text style={styles.bossImageFallbackText}>{name}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      onError={() => setFailed(true)}
      resizeMode="cover"
      style={styles.bossImage}
    />
  );
}

function RaidStatusChip({ status, t }) {
  const config = {
    OPEN: { label: t('bossRaid.status.open', '진행 중'), style: styles.statusOpen },
    CLEARED: { label: t('bossRaid.status.cleared', '처치 완료'), style: styles.statusCleared },
    CLOSED: { label: t('bossRaid.status.closed', '종료됨'), style: styles.statusClosed }
  }[status] || { label: status, style: styles.statusClosed };

  return (
    <View style={[styles.statusChip, config.style]}>
      <Text style={styles.statusChipText}>{config.label}</Text>
    </View>
  );
}

function SummaryCard({ label, value, description, emphasis }) {
  return (
    <View style={[styles.summaryCard, emphasis && styles.summaryCardEmphasis]}>
      <Text style={[styles.summaryLabel, emphasis && styles.summaryLabelEmphasis]}>{label}</Text>
      <Text style={[styles.summaryValue, emphasis && styles.summaryValueEmphasis]}>{value}</Text>
      <Text style={[styles.summaryDescription, emphasis && styles.summaryDescriptionEmphasis]}>
        {description}
      </Text>
    </View>
  );
}

export default function BossRaidScreen({ realtimeEvent, token, user }) {
  const { currentLanguage, t, translateText } = useLanguage();
  const locale = languageIntlLocale(currentLanguage);
  const [raids, setRaids] = useState([]);
  const [parties, setParties] = useState([]);
  const [publicParties, setPublicParties] = useState([]);
  const [selectedRaidId, setSelectedRaidId] = useState(null);
  const [selectedPartyId, setSelectedPartyId] = useState(null);
  const [selectedParty, setSelectedParty] = useState(null);
  const [createPartyName, setCreatePartyName] = useState('');
  const [partyVisibility, setPartyVisibility] = useState('PUBLIC');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [realtimeMessage, setRealtimeMessage] = useState('');

  const selectedRaid = useMemo(
    () => raids.find((raid) => raid.id === selectedRaidId) || raids[0] || null,
    [raids, selectedRaidId]
  );

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const [raidResponse, partyResponse, publicPartyResponse] = await Promise.all([
          getBossRaids(token),
          getMyBossRaidParties(token),
          getPublicBossRaidParties(token)
        ]);

        if (!active) {
          return;
        }

        setRaids(raidResponse.raids || []);
        setParties(partyResponse.parties || []);
        setPublicParties(publicPartyResponse.parties || []);

        setSelectedRaidId((currentRaidId) => currentRaidId || raidResponse.raids?.[0]?.id || null);
        setSelectedPartyId((currentPartyId) => currentPartyId || partyResponse.parties?.[0]?.id || null);
      } catch (loadError) {
        if (active) {
          setError(loadError.message || t('bossRaid.errors.load', '보스 레이드 정보를 불러오지 못했습니다.'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [t, token]);

  useEffect(() => {
    let active = true;

    async function loadPartyDetail() {
      if (!selectedPartyId) {
        setSelectedParty(null);
        return;
      }

      setSelectedParty(null);

      try {
        const response = await getBossRaidPartyDetail(token, selectedPartyId);

        if (active) {
          setSelectedParty(response.party);
        }
      } catch (detailError) {
        if (active) {
          setError(detailError.message || t('bossRaid.errors.detailLoad', '파티 상세 정보를 불러오지 못했습니다.'));
        }
      }
    }

    loadPartyDetail();

    return () => {
      active = false;
    };
  }, [selectedPartyId, t, token]);

  useEffect(() => {
    if (!realtimeEvent?.type?.startsWith('bossRaid.')) {
      return;
    }

    const realtimeParty = realtimeEvent.payload?.party;

    if (!realtimeParty?.id) {
      return;
    }

    setParties((currentParties) => {
      const exists = currentParties.some((party) => party.id === realtimeParty.id);

      if (!exists) {
        return [realtimeParty, ...currentParties];
      }

      return currentParties.map((party) => (
        party.id === realtimeParty.id ? { ...party, ...realtimeParty } : party
      ));
    });

    setPublicParties((currentParties) => {
      if (realtimeParty.isPublic === false || realtimeParty.status !== 'OPEN') {
        return currentParties.filter((party) => party.id !== realtimeParty.id);
      }

      const exists = currentParties.some((party) => party.id === realtimeParty.id);

      if (!exists) {
        return [realtimeParty, ...currentParties];
      }

      return currentParties.map((party) => (
        party.id === realtimeParty.id ? { ...party, ...realtimeParty } : party
      ));
    });

    if (selectedPartyId === realtimeParty.id) {
      setSelectedParty((currentParty) => ({ ...(currentParty || {}), ...realtimeParty }));
      setRealtimeMessage(
        realtimeEvent.type === 'bossRaid.completed'
          ? t('bossRaid.realtime.completed', '보스 레이드가 실시간으로 처치 완료 처리되었습니다.')
          : t('bossRaid.realtime.progressUpdated', '파티 진행률이 실시간으로 갱신되었습니다.')
      );
    }
  }, [realtimeEvent, selectedPartyId, t]);

  async function refreshParties(nextSelectedPartyId = selectedPartyId) {
    const [partyResponse, publicPartyResponse] = await Promise.all([
      getMyBossRaidParties(token),
      getPublicBossRaidParties(token)
    ]);
    const nextParties = partyResponse.parties || [];

    setParties(nextParties);
    setPublicParties(publicPartyResponse.parties || []);

    if (!nextParties.length) {
      setSelectedPartyId(null);
      setSelectedParty(null);
      return;
    }

    const stillExists = nextParties.some((party) => party.id === nextSelectedPartyId);
    const resolvedPartyId = stillExists ? nextSelectedPartyId : nextParties[0].id;
    setSelectedPartyId(resolvedPartyId);
  }

  async function handleCreateParty() {
    if (!selectedRaid) {
      setError(t('bossRaid.errors.selectBossFirst', '먼저 보스를 선택해주세요.'));
      return;
    }

    setActionLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await createBossRaidParty(token, {
        raidId: selectedRaid.id,
        isPublic: partyVisibility === 'PUBLIC',
        name: createPartyName || interpolate(
          t('bossRaid.defaults.partyName', '{name} 파티'),
          { name: user?.name || t('bossRaid.defaults.studyName', '스터디') }
        )
      });

      setCreatePartyName('');
      setSelectedPartyId(response.party.id);
      setMessage(interpolate(
        t('bossRaid.messages.partyCreated', '"{name}" 파티를 생성했어요. 참여 코드는 {code} 입니다.'),
        { name: response.party.name, code: response.party.joinCode }
      ));
      await refreshParties(response.party.id);
    } catch (createError) {
      setError(createError.message || t('bossRaid.errors.createParty', '파티를 생성하지 못했습니다.'));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleJoinParty() {
    setActionLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await joinBossRaidParty(token, { joinCode });

      setJoinCode('');
      setSelectedPartyId(response.party.id);
      setMessage(interpolate(
        t('bossRaid.messages.partyJoined', '"{name}" 파티에 참가했어요.'),
        { name: response.party.name }
      ));
      await refreshParties(response.party.id);
    } catch (joinError) {
      setError(joinError.message || t('bossRaid.errors.joinParty', '파티 참가에 실패했습니다.'));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleJoinPublicParty(partyId) {
    setActionLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await joinPublicBossRaidParty(token, partyId);

      setSelectedPartyId(response.party.id);
      setMessage(interpolate(
        t('bossRaid.messages.partyJoined', '"{name}" ?뚰떚??李멸??덉뼱??'),
        { name: response.party.name }
      ));
      await refreshParties(response.party.id);
    } catch (joinError) {
      setError(joinError.message || t('bossRaid.errors.joinParty', '?뚰떚 李멸????ㅽ뙣?덉뒿?덈떎.'));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleClaimReward() {
    if (!selectedParty) {
      return;
    }

    setActionLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await claimBossRaidReward(token, selectedParty.id);
      const totalReward = response.reward.reward.totalRewardPoints;
      const rewardText = interpolate(
        t('bossRaid.messages.rewardClaimed', '{points}P 보상을 받았어요.'),
        { points: formatNumber(totalReward, locale) }
      );
      const badgeText = response.reward.badge
        ? t('bossRaid.messages.badgeGranted', '한정 배지도 함께 지급되었습니다.')
        : '';
      setMessage(`${rewardText} ${badgeText}`.trim());
      await refreshParties(selectedParty.id);
    } catch (claimError) {
      setError(claimError.message || t('bossRaid.errors.claimReward', '보상 수령에 실패했습니다.'));
    } finally {
      setActionLoading(false);
    }
  }

  const selectedPartyProgress = selectedParty
    ? getProgressRate(selectedParty.totalDamage, selectedParty.raid.maxHp)
    : 0;

  return (
    <ScrollView contentContainerStyle={styles.screen} style={styles.scroll}>
      <View style={styles.heroPanel}>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>{t('bossRaid.hero.eyebrow', '협동 퀘스트')}</Text>
          <Text style={styles.title}>{t('bossRaid.hero.title', '스터디 보스 레이드')}</Text>
          <Text style={styles.description}>
            {t('bossRaid.hero.description', '원하는 사람끼리 파티를 만들고, 그룹 누적 집중 시간과 완료 태스크 수로 보스 HP를 깎아보세요.')}
          </Text>
        </View>
        <View style={styles.summaryGrid}>
          <SummaryCard
            description={t('bossRaid.summary.ruleDescription', '보상은 참여자 공통 포인트 + 개인 기여 보너스 + 한정 배지 구조예요.')}
            emphasis
            label={t('bossRaid.summary.ruleLabel', '핵심 규칙')}
            value={t('bossRaid.summary.ruleValue', '5분 갱신')}
          />
          <SummaryCard
            description={t('bossRaid.summary.bossDescription', '현재 활성 보스 수')}
            label={t('bossRaid.summary.bossLabel', '보스')}
            value={interpolate(t('bossRaid.units.count', '{count}개'), { count: formatNumber(raids.length, locale) })}
          />
          <SummaryCard
            description={t('bossRaid.summary.partyDescription', '내가 참가한 파티 수')}
            label={t('bossRaid.summary.partyLabel', '내 파티')}
            value={interpolate(t('bossRaid.units.count', '{count}개'), { count: formatNumber(parties.length, locale) })}
          />
        </View>
      </View>

      {message ? (
        <View style={[styles.notice, styles.noticeSuccess]}>
          <Text style={styles.noticeText}>{message}</Text>
        </View>
      ) : null}
      {error ? (
        <View style={[styles.notice, styles.noticeError]}>
          <Text style={styles.noticeText}>{error}</Text>
        </View>
      ) : null}
      {realtimeMessage ? (
        <View style={[styles.notice, styles.noticeRealtime]}>
          <Text style={styles.noticeText}>{realtimeMessage}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('bossRaid.sections.selectBoss', '보스 선택')}</Text>
        <View style={styles.cardGrid}>
          {raids.map((raid) => {
            const active = raid.id === selectedRaid?.id;

            return (
              <Pressable
                key={raid.id}
                onPress={() => setSelectedRaidId(raid.id)}
                style={(state) => [
                  styles.raidCard,
                  active && styles.raidCardActive,
                  ...interactiveStateStyles(state, { kind: 'card' })
                ]}
              >
                <BossImage imageUrl={raid.imageUrl} name={translateText(raid.name)} />
                <View style={styles.raidCardHeader}>
                  <Text style={styles.raidCardTitle}>{translateText(raid.name)}</Text>
                  {raid.hasJoinedParty ? <RaidStatusChip status="OPEN" t={t} /> : null}
                </View>
                <Text style={styles.raidCardDescription}>{translateText(raid.description)}</Text>
                <Text style={styles.raidCardMeta}>
                  {interpolate(t('bossRaid.raidCard.meta', 'HP {hp} · 기본 보상 {points}P'), {
                    hp: formatNumber(raid.maxHp, locale),
                    points: formatNumber(raid.baseRewardPoints, locale)
                  })}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.actionRow}>
        <View style={styles.actionPanel}>
          <Text style={styles.panelTitle}>{t('bossRaid.create.title', '파티 생성')}</Text>
          <Text style={styles.panelDescription}>{t('bossRaid.create.description', '같이 레이드할 팀 이름을 정하고 새 파티를 만들어요.')}</Text>
          <TextInput
            onChangeText={setCreatePartyName}
            placeholder={t('bossRaid.create.placeholder', '예: 새벽 집중팟')}
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={createPartyName}
          />
          <View style={styles.segmentedRow}>
            {['PUBLIC', 'PRIVATE'].map((visibility) => {
              const active = partyVisibility === visibility;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={visibility}
                  onPress={() => setPartyVisibility(visibility)}
                  style={(state) => [
                    styles.segmentedButton,
                    active && styles.segmentedButtonActive,
                    ...interactiveStateStyles(state)
                  ]}
                >
                  <Text style={[styles.segmentedButtonText, active && styles.segmentedButtonTextActive]}>
                    {visibility === 'PUBLIC'
                      ? t('bossRaid.create.publicParty', '공개 모집')
                      : t('bossRaid.create.privateParty', '초대 코드')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            disabled={actionLoading || !selectedRaid}
            onPress={handleCreateParty}
            style={({ pressed }) => [
              styles.primaryButton,
              (actionLoading || !selectedRaid) && styles.disabledButton,
              pressed && !actionLoading && styles.primaryButtonPressed
            ]}
          >
            <Text style={styles.primaryButtonText}>{t('bossRaid.create.button', '선택한 보스로 파티 만들기')}</Text>
          </Pressable>
        </View>

        <View style={styles.actionPanel}>
          <Text style={styles.panelTitle}>{t('bossRaid.join.title', '참여 코드로 참가')}</Text>
          <Text style={styles.panelDescription}>{t('bossRaid.join.description', '친구가 만든 파티의 참여 코드를 입력하면 바로 합류할 수 있어요.')}</Text>
          <TextInput
            autoCapitalize="characters"
            onChangeText={setJoinCode}
            placeholder={t('bossRaid.join.placeholder', '예: DAWN01')}
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={joinCode}
          />
          <Pressable
            disabled={actionLoading || !joinCode.trim()}
            onPress={handleJoinParty}
            style={({ pressed }) => [
              styles.secondaryButton,
              (actionLoading || !joinCode.trim()) && styles.disabledButton,
              pressed && !actionLoading && styles.secondaryButtonPressed
            ]}
          >
            <Text style={styles.secondaryButtonText}>{t('bossRaid.join.button', '코드로 참가하기')}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('bossRaid.sections.publicParties', '공개 모집 파티')}</Text>
        <View style={styles.partyList}>
          {publicParties.map((party) => {
            const joined = party.members?.some((member) => member.userId === user?.id);

            return (
              <View key={`public-${party.id}`} style={styles.publicPartyCard}>
                <View style={styles.publicPartyCopy}>
                  <Text style={styles.partyChipTitle}>{party.name}</Text>
                  <Text style={styles.partyChipMeta}>
                    {party.raid.name} · {party.totalMembers || party.members?.length || 0}명 · 공개 모집
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  disabled={actionLoading || joined}
                  onPress={() => handleJoinPublicParty(party.id)}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    (actionLoading || joined) && styles.disabledButton,
                    pressed && !actionLoading && styles.secondaryButtonPressed
                  ]}
                >
                  <Text style={styles.secondaryButtonText}>
                    {joined ? t('bossRaid.join.joinedPublic', '참여 중') : t('bossRaid.join.publicButton', '공개 파티 참여')}
                  </Text>
                </Pressable>
              </View>
            );
          })}
          {!loading && publicParties.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>{t('bossRaid.public.emptyTitle', '현재 공개 모집 파티가 없어요')}</Text>
              <Text style={styles.emptyStateDescription}>
                {t('bossRaid.public.emptyDescription', '새 파티를 공개 모집으로 만들거나 친구에게 초대 코드를 공유해 보세요.')}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('bossRaid.sections.myParties', '내 파티')}</Text>
        <View style={styles.partyList}>
          {parties.map((party) => {
            const active = party.id === selectedPartyId;

            return (
              <Pressable
                key={party.id}
                onPress={() => {
                  setSelectedParty(null);
                  setSelectedPartyId(party.id);
                }}
                style={({ pressed }) => [
                  styles.partyChip,
                  active && styles.partyChipActive,
                  pressed && styles.partyChipPressed
                ]}
              >
                <Text style={[styles.partyChipTitle, active && styles.partyChipTitleActive]}>
                  {party.name}
                </Text>
                <Text style={[styles.partyChipMeta, active && styles.partyChipTitleActive]}>
                  {party.raid.name} · {party.inviteMode === 'PRIVATE' ? '초대 코드' : '공개 모집'} · {party.joinCode}
                </Text>
              </Pressable>
            );
          })}
          {!loading && parties.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>{t('bossRaid.empty.title', '아직 참가한 파티가 없어요.')}</Text>
              <Text style={styles.emptyStateDescription}>
                {t('bossRaid.empty.description', '먼저 파티를 만들거나 친구의 참여 코드로 입장해보세요.')}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {selectedParty ? (
        <View style={styles.detailPanel}>
          <View style={styles.detailHeader}>
            <View>
              <Text style={styles.detailTitle}>{selectedParty.raid.name}</Text>
              <Text style={styles.detailSubtitle}>
                {interpolate(t('bossRaid.detail.subtitle', '{name} · 참여 코드 {code}'), {
                  name: selectedParty.name,
                  code: selectedParty.joinCode
                })}
              </Text>
            </View>
            <RaidStatusChip status={selectedParty.status} t={t} />
          </View>

          <View style={styles.progressPanel}>
            <View style={styles.progressMetaRow}>
              <Text style={styles.progressLabel}>{t('bossRaid.detail.hpLabel', '보스 HP')}</Text>
              <Text style={styles.progressValue}>
                {formatNumber(selectedParty.remainingHp, locale)} / {formatNumber(selectedParty.raid.maxHp, locale)}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${selectedPartyProgress * 100}%` }]} />
            </View>
            <View style={styles.progressInfoRow}>
              <Text style={styles.progressHint}>
                {interpolate(t('bossRaid.detail.totalDamage', '누적 데미지 {damage}'), {
                  damage: formatNumber(selectedParty.totalDamage, locale)
                })}
              </Text>
              <Text style={styles.progressHint}>
                {interpolate(t('bossRaid.detail.damageRule', '1분 = {focusDamage} DMG · 태스크 1개 = {taskDamage} DMG'), {
                  focusDamage: selectedParty.raid.focusMinuteDamage,
                  taskDamage: selectedParty.raid.taskCompletionDamage
                })}
              </Text>
            </View>
          </View>

          <View style={styles.detailGrid}>
            <View style={styles.membersCard}>
              <Text style={styles.cardTitle}>{t('bossRaid.detail.members', '파티 멤버')}</Text>
              {selectedParty.members.map((member) => (
                <View key={member.userId} style={styles.memberRow}>
                  <ProfileAvatar appearance={member.appearance} name={member.name} size="sm" />
                  <View style={styles.memberCopy}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    {member.appearance?.titleText ? (
                      <ProfileTitleChip animated title={member.appearance.titleText} translateText={translateText} />
                    ) : null}
                    <Text style={styles.memberJoinedAt}>
                      {interpolate(t('bossRaid.detail.joinedAt', '참여 {date}'), {
                        date: formatDate(member.joinedAt, locale)
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.membersCard}>
              <Text style={styles.cardTitle}>{t('bossRaid.detail.contribution', '기여도')}</Text>
              {selectedParty.contributions.map((contribution) => (
                <View key={contribution.userId} style={styles.contributionRow}>
                  <ProfileAvatar appearance={contribution.appearance} name={contribution.userName} size="sm" />
                  <View style={styles.memberCopy}>
                    <Text style={styles.memberName}>{contribution.userName}</Text>
                    <Text style={styles.contributionMeta}>
                      {interpolate(t('bossRaid.detail.contributionMeta', '집중 {minutes}분 · 완료 {tasks}개'), {
                        minutes: formatNumber(contribution.focusMinutes, locale),
                        tasks: formatNumber(contribution.completedTaskCount, locale)
                      })}
                    </Text>
                  </View>
                  <Text style={styles.contributionDamage}>{formatNumber(contribution.totalDamage, locale)} DMG</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.rewardPanel}>
            <View>
              <Text style={styles.rewardTitle}>{t('bossRaid.reward.title', '처치 보상')}</Text>
              <Text style={styles.rewardDescription}>
                {interpolate(t('bossRaid.reward.description', '참여자 전원 기본 {basePoints}P + 기여도 비율 기반 보너스 풀 {bonusPoints}P'), {
                  basePoints: formatNumber(selectedParty.raid.baseRewardPoints, locale),
                  bonusPoints: formatNumber(selectedParty.raid.bonusRewardPoolPoints, locale)
                })}
              </Text>
              {selectedParty.raid.badge ? (
                <Text style={styles.rewardBadge}>
                  {interpolate(t('bossRaid.reward.badge', '한정 배지: {badgeName}'), {
                    badgeName: selectedParty.raid.badge.name
                  })}
                </Text>
              ) : null}
            </View>
            <Pressable
              disabled={actionLoading || selectedParty.status !== 'CLEARED'}
              onPress={handleClaimReward}
              style={({ pressed }) => [
                styles.claimButton,
                (actionLoading || selectedParty.status !== 'CLEARED') && styles.disabledButton,
                pressed && selectedParty.status === 'CLEARED' && styles.primaryButtonPressed
              ]}
            >
              <Text style={styles.claimButtonText}>
                {selectedParty.status === 'CLEARED'
                  ? t('bossRaid.reward.claimButton', '보상 받기')
                  : t('bossRaid.reward.lockedButton', '처치 후 수령 가능')}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background
  },
  screen: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 80,
    gap: 24
  },
  heroPanel: {
    gap: 18
  },
  heroCopy: {
    gap: 10
  },
  eyebrow: {
    color: colors.mintDeep,
    fontSize: 14,
    fontWeight: '800'
  },
  title: {
    color: colors.ink,
    fontSize: 40,
    fontWeight: '900'
  },
  description: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 28
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  summaryCard: {
    flex: 1,
    minWidth: 220,
    borderRadius: radii.panel,
    backgroundColor: colors.mintSoft,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 22,
    gap: 10,
    ...shadows.card
  },
  summaryCardEmphasis: {
    backgroundColor: colors.blue
  },
  summaryLabel: {
    color: colors.mintDeep,
    fontSize: 16,
    fontWeight: '800'
  },
  summaryLabelEmphasis: {
    color: colors.cream
  },
  summaryValue: {
    color: colors.blueDeep,
    fontSize: 28,
    fontWeight: '900'
  },
  summaryValueEmphasis: {
    color: colors.surface
  },
  summaryDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22
  },
  summaryDescriptionEmphasis: {
    color: colors.blueSoft
  },
  notice: {
    borderRadius: radii.control,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1
  },
  noticeSuccess: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success
  },
  noticeError: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger
  },
  noticeRealtime: {
    backgroundColor: colors.mintSoft,
    borderColor: colors.mint
  },
  noticeText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700'
  },
  section: {
    gap: 14
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900'
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  raidCard: {
    width: 360,
    maxWidth: '100%',
    borderRadius: radii.panel,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    gap: 14,
    overflow: 'hidden',
    ...shadows.card
  },
  raidCardActive: {
    borderColor: colors.mintDeep
  },
  bossImage: {
    width: '100%',
    height: 190,
    borderRadius: radii.card,
    backgroundColor: colors.blueSoft
  },
  bossImageFallback: {
    width: '100%',
    height: 190,
    borderRadius: radii.card,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  bossImageFallbackEmoji: {
    fontSize: 56
  },
  bossImageFallbackText: {
    color: colors.blueDeep,
    fontSize: 16,
    fontWeight: '800'
  },
  raidCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12
  },
  raidCardTitle: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
    flex: 1
  },
  raidCardDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22
  },
  raidCardMeta: {
    color: colors.blueDeep,
    fontSize: 14,
    fontWeight: '800'
  },
  statusChip: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: radii.chip,
    justifyContent: 'center',
    alignItems: 'center'
  },
  statusOpen: {
    backgroundColor: colors.mintSoft
  },
  statusCleared: {
    backgroundColor: colors.successSoft
  },
  statusClosed: {
    backgroundColor: colors.warningSoft
  },
  statusChipText: {
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '800'
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  actionPanel: {
    flex: 1,
    minWidth: 320,
    borderRadius: radii.panel,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 22,
    gap: 14,
    ...shadows.card
  },
  panelTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900'
  },
  panelDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22
  },
  input: {
    minHeight: 48,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    color: colors.ink,
    fontSize: 15
  },
  segmentedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  segmentedButton: {
    minHeight: 40,
    flex: 1,
    minWidth: 120,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12
  },
  segmentedButtonActive: {
    borderColor: colors.mintDeep,
    backgroundColor: colors.mintSoft
  },
  segmentedButtonText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800'
  },
  segmentedButtonTextActive: {
    color: colors.mintDeep
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: radii.control,
    backgroundColor: colors.blue,
    borderWidth: 1,
    borderColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }]
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: radii.control,
    backgroundColor: colors.mintSoft,
    borderWidth: 1,
    borderColor: colors.mintDeep,
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }]
  },
  disabledButton: {
    opacity: 0.45
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '800'
  },
  secondaryButtonText: {
    color: colors.mintDeep,
    fontSize: 15,
    fontWeight: '800'
  },
  partyList: {
    gap: 12
  },
  publicPartyCard: {
    alignItems: 'center',
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  publicPartyCopy: {
    flex: 1,
    minWidth: 220,
    gap: 4
  },
  partyChip: {
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4
  },
  partyChipActive: {
    borderColor: colors.mintDeep,
    backgroundColor: colors.mintSoft
  },
  partyChipPressed: {
    opacity: 0.94
  },
  partyChipTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800'
  },
  partyChipTitleActive: {
    color: colors.mintDeep
  },
  partyChipMeta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700'
  },
  emptyState: {
    borderRadius: radii.panel,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 24,
    gap: 10
  },
  emptyStateTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800'
  },
  emptyStateDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22
  },
  detailPanel: {
    borderRadius: radii.panel,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 24,
    gap: 20,
    ...shadows.card
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16
  },
  detailTitle: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: '900'
  },
  detailSubtitle: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6
  },
  progressPanel: {
    gap: 10
  },
  progressMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  progressLabel: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800'
  },
  progressValue: {
    color: colors.blueDeep,
    fontSize: 16,
    fontWeight: '900'
  },
  progressTrack: {
    width: '100%',
    height: 18,
    borderRadius: radii.chip,
    backgroundColor: colors.blueSoft,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.chip,
    backgroundColor: colors.mint
  },
  progressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap'
  },
  progressHint: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700'
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  membersCard: {
    flex: 1,
    minWidth: 320,
    borderRadius: radii.card,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    gap: 12
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900'
  },
  memberRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12
  },
  memberCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0
  },
  memberName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800'
  },
  memberJoinedAt: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700'
  },
  contributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center'
  },
  contributionMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4
  },
  contributionDamage: {
    color: colors.blueDeep,
    fontSize: 15,
    fontWeight: '900'
  },
  rewardPanel: {
    borderRadius: radii.card,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.creamStrong,
    padding: 18,
    gap: 14
  },
  rewardTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900'
  },
  rewardDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22
  },
  rewardBadge: {
    color: colors.blueDeep,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8
  },
  claimButton: {
    minHeight: 48,
    borderRadius: radii.control,
    backgroundColor: colors.success,
    borderWidth: 1,
    borderColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center'
  },
  claimButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '800'
  }
});
