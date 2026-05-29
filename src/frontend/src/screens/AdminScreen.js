import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import {
  getAdminUsers,
  updateAdminUserStatus,
  getAdminReports,
  moderateAdminPost,
  moderateAdminComment,
  getAdminMaintenance,
  sendAdminNotice,
  updateAdminMaintenance
} from '../services/api';
import AccessibleTextInput from '../components/AccessibleTextInput';
import { useLanguage } from '../i18n';
import { PanelSkeleton } from '../components/Skeleton';
import { colors, interactions, interactiveStateStyles, shadows } from '../styles/theme';

export default function AdminScreen({ onNavigate, token, user }) {
  const { t } = useLanguage();

  // Access Guard check inside component
  if (!user || user.role !== 'ADMIN') {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorHeader}>접근 권한이 없습니다.</Text>
        <Text style={styles.errorSub}>관리자 계정으로 로그인해 주세요.</Text>
        <Pressable onPress={() => onNavigate('dashboard')} style={(state) => [styles.backButton, ...interactiveStateStyles(state)]}>
          <Text style={styles.backButtonText}>대시보드로 돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'reports' | 'logs'

  // Data States
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState({ reportedPosts: [], reportedComments: [], adminActions: [] });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Action / Moderation Modal State
  const [actionTarget, setActionTarget] = useState(null); // { type: 'user'|'post'|'comment', data: any, actionType?: string }
  const [actionReason, setActionReason] = useState('');
  const [actionStatus, setActionStatus] = useState('SUSPENDED'); // For user status updates
  const [submitting, setSubmitting] = useState(false);
  const [maintenance, setMaintenance] = useState(null);
  const [maintenanceDraft, setMaintenanceDraft] = useState({
    enabled: false,
    title: '',
    message: '',
    estimatedEndAt: ''
  });
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);
  const [maintenanceFeedback, setMaintenanceFeedback] = useState('');
  const [maintenanceError, setMaintenanceError] = useState('');
  const [noticeDraft, setNoticeDraft] = useState({
    level: 'info',
    message: '',
    title: ''
  });
  const [noticeSending, setNoticeSending] = useState(false);
  const [noticeFeedback, setNoticeFeedback] = useState('');
  const [noticeError, setNoticeError] = useState('');

  // Load Data
  async function loadData(keepMessage = false) {
    setLoading(true);
    if (!keepMessage) {
      setErrorMsg('');
      setSuccessMsg('');
    }
    try {
      const reportsPromise = getAdminReports(token);
      if (activeTab === 'users') {
        const [usersResult, reportsResult] = await Promise.all([
          getAdminUsers(token),
          reportsPromise
        ]);
        setUsers(usersResult.users || []);
        setReports(reportsResult || { reportedPosts: [], reportedComments: [], adminActions: [] });
      } else {
        const reportsResult = await reportsPromise;
        setReports(reportsResult || { reportedPosts: [], reportedComments: [], adminActions: [] });
      }
    } catch (err) {
      setErrorMsg(err.message || '데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function applyMaintenanceDraft(nextMaintenance) {
    setMaintenance(nextMaintenance);
    setMaintenanceDraft({
      enabled: Boolean(nextMaintenance?.enabled),
      title: nextMaintenance?.title || '',
      message: nextMaintenance?.message || '',
      estimatedEndAt: nextMaintenance?.estimatedEndAt
        ? new Date(nextMaintenance.estimatedEndAt).toISOString().slice(0, 16)
        : ''
    });
  }

  async function loadMaintenance(keepMessage = false) {
    setMaintenanceLoading(true);
    if (!keepMessage) {
      setMaintenanceFeedback('');
      setMaintenanceError('');
    }

    try {
      const result = await getAdminMaintenance(token);
      applyMaintenanceDraft(result.maintenance);
    } catch (err) {
      setMaintenanceError(err.message || t('admin.maintenance.errors.load', '점검 상태를 불러오지 못했습니다.'));
    } finally {
      setMaintenanceLoading(false);
    }
  }

  async function handleSaveMaintenance() {
    setMaintenanceSaving(true);
    setMaintenanceFeedback('');
    setMaintenanceError('');

    try {
      const payload = {
        enabled: Boolean(maintenanceDraft.enabled),
        title: maintenanceDraft.title.trim(),
        message: maintenanceDraft.message.trim(),
        estimatedEndAt: maintenanceDraft.estimatedEndAt
          ? new Date(maintenanceDraft.estimatedEndAt).toISOString()
          : null
      };
      const result = await updateAdminMaintenance(token, payload);

      applyMaintenanceDraft(result.maintenance);
      setMaintenanceFeedback(t('admin.maintenance.messages.saved', '점검 모드 설정을 저장했습니다.'));
    } catch (err) {
      setMaintenanceError(err.message || t('admin.maintenance.errors.save', '점검 모드 설정 저장에 실패했습니다.'));
    } finally {
      setMaintenanceSaving(false);
    }
  }

  async function handleSendNotice() {
    setNoticeSending(true);
    setNoticeFeedback('');
    setNoticeError('');

    try {
      await sendAdminNotice(token, {
        level: noticeDraft.level,
        title: noticeDraft.title.trim(),
        message: noticeDraft.message.trim()
      });
      setNoticeFeedback(t('admin.notice.messages.sent', '실시간 공지를 전송했습니다.'));
      setNoticeDraft((draft) => ({
        ...draft,
        message: '',
        title: ''
      }));
    } catch (err) {
      setNoticeError(err.message || t('admin.notice.errors.send', '실시간 공지 전송에 실패했습니다.'));
    } finally {
      setNoticeSending(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    loadMaintenance();
  }, []);

  // Handle User Status Change
  async function handleUserStatusUpdate() {
    if (!actionTarget || actionTarget.type !== 'user') return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const targetUser = actionTarget.data;
      const result = await updateAdminUserStatus(
        token,
        targetUser.id,
        actionStatus,
        actionReason.trim()
      );

      setSuccessMsg(`사용자 ${targetUser.name}님의 상태가 ${actionStatus}(으)로 성공적으로 변경되었습니다.`);
      setActionTarget(null);
      setActionReason('');

      // Refresh current tab data without clearing success message
      loadData(true);
    } catch (err) {
      setErrorMsg(err.message || '사용자 상태 변경 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  // Handle Post/Comment Moderation
  async function handleModerationUpdate() {
    if (!actionTarget || !['post', 'comment'].includes(actionTarget.type)) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const targetData = actionTarget.data;
      const actType = actionTarget.actionType; // HIDE, KEEP, DELETE

      if (actionTarget.type === 'post') {
        await moderateAdminPost(token, targetData.id, actType, actionReason.trim());
        setSuccessMsg(`게시글 #${targetData.id}에 대해 ${actType === 'HIDE' ? '숨김(삭제)' : '기각'} 조치가 완료되었습니다.`);
      } else {
        await moderateAdminComment(token, targetData.id, actType, actionReason.trim());
        setSuccessMsg(`댓글 #${targetData.id}에 대해 ${actType === 'DELETE' ? '삭제' : '기각'} 조치가 완료되었습니다.`);
      }

      setActionTarget(null);
      setActionReason('');

      // Refresh current tab data without clearing success message
      loadData(true);
    } catch (err) {
      setErrorMsg(err.message || '콘텐츠 조치 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  function getStatusStyle(status) {
    switch (status) {
      case 'ACTIVE': return styles.statusActive;
      case 'SUSPENDED': return styles.statusSuspended;
      case 'DEACTIVATED': return styles.statusDeactivated;
      default: return styles.statusDefault;
    }
  }

  function getStatusTextStyle(status) {
    switch (status) {
      case 'ACTIVE': return styles.statusActiveText;
      case 'SUSPENDED': return styles.statusSuspendedText;
      case 'DEACTIVATED': return styles.statusDeactivatedText;
      default: return styles.statusDefaultText;
    }
  }

  function getStatusLabel(status) {
    switch (status) {
      case 'ACTIVE': return '활성';
      case 'SUSPENDED': return '정지';
      case 'DEACTIVATED': return '비활성';
      default: return status;
    }
  }

  function renderEmptyState(title, description) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyText}>{description}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => loadData(true)}
          style={(state) => [styles.emptyActionButton, ...interactiveStateStyles(state)]}
        >
          <Text style={styles.emptyActionText}>다시 확인하기</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>관리자 시스템 콘솔</Text>
          <Text style={styles.subtitle}>사용자 계정 상태 및 커뮤니티 신고 관리</Text>
        </View>
        <Pressable onPress={() => onNavigate('dashboard')} style={(state) => [styles.backButton, ...interactiveStateStyles(state)]}>
          <Text style={styles.backButtonText}>대시보드로 가기</Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <Pressable
          onPress={() => { setActiveTab('users'); setActionTarget(null); }}
          style={(state) => [styles.tabButton, activeTab === 'users' && styles.tabButtonActive, ...interactiveStateStyles(state)]}
        >
          <Text style={[styles.tabButtonText, activeTab === 'users' && styles.tabButtonTextActive]}>
            사용자 관리
          </Text>
        </Pressable>
        <Pressable
          onPress={() => { setActiveTab('reports'); setActionTarget(null); }}
          style={(state) => [styles.tabButton, activeTab === 'reports' && styles.tabButtonActive, ...interactiveStateStyles(state)]}
        >
          <Text style={[styles.tabButtonText, activeTab === 'reports' && styles.tabButtonTextActive]}>
            신고 콘텐츠 관리 ({reports.reportedPosts.length + reports.reportedComments.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => { setActiveTab('logs'); setActionTarget(null); }}
          style={(state) => [styles.tabButton, activeTab === 'logs' && styles.tabButtonActive, ...interactiveStateStyles(state)]}
        >
          <Text style={[styles.tabButtonText, activeTab === 'logs' && styles.tabButtonTextActive]}>
            활동 로그
          </Text>
        </Pressable>
      </View>

      {/* Success/Error Alerts */}
      {errorMsg ? (
        <View style={styles.errorAlert}>
          <Text style={styles.alertText}>{errorMsg}</Text>
        </View>
      ) : null}

      {successMsg ? (
        <View style={styles.successAlert}>
          <Text style={styles.alertText}>{successMsg}</Text>
        </View>
      ) : null}

      <View style={styles.maintenancePanel}>
        <View style={styles.maintenanceHeader}>
          <View>
            <Text style={styles.maintenanceEyebrow}>
              {t('admin.maintenance.eyebrow', '서비스 상태')}
            </Text>
            <Text style={styles.maintenanceTitle}>
              {t('admin.maintenance.title', '점검 모드 제어')}
            </Text>
            <Text style={styles.maintenanceDescription}>
              {t(
                'admin.maintenance.description',
                '일반 사용자는 점검 화면을 보지만, ADMIN은 로그인 후 관리자 화면에 접근할 수 있습니다.'
              )}
            </Text>
          </View>
          <View style={[
            styles.maintenanceStatusBadge,
            maintenanceDraft.enabled ? styles.maintenanceStatusOn : styles.maintenanceStatusOff
          ]}>
            <Text style={[
              styles.maintenanceStatusText,
              maintenanceDraft.enabled ? styles.maintenanceStatusTextOn : styles.maintenanceStatusTextOff
            ]}>
              {maintenanceDraft.enabled
                ? t('admin.maintenance.statusOn', '점검 모드 ON')
                : t('admin.maintenance.statusOff', '정상 운영 중')}
            </Text>
          </View>
        </View>

        {maintenanceError ? (
          <View style={styles.maintenanceErrorBox}>
            <Text style={styles.alertText}>{maintenanceError}</Text>
          </View>
        ) : null}
        {maintenanceFeedback ? (
          <View style={styles.maintenanceSuccessBox}>
            <Text style={styles.alertText}>{maintenanceFeedback}</Text>
          </View>
        ) : null}

        {maintenanceLoading ? (
          <PanelSkeleton rows={2} />
        ) : (
          <>
            <View style={styles.maintenanceToggleRow}>
              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: maintenanceDraft.enabled }}
                onPress={() => setMaintenanceDraft((draft) => ({ ...draft, enabled: !draft.enabled }))}
                style={(state) => [
                  styles.maintenanceToggle,
                  maintenanceDraft.enabled && styles.maintenanceToggleActive,
                  ...interactiveStateStyles(state)
                ]}
              >
                <View style={[
                  styles.maintenanceToggleKnob,
                  maintenanceDraft.enabled && styles.maintenanceToggleKnobActive
                ]} />
                <Text style={[
                  styles.maintenanceToggleText,
                  maintenanceDraft.enabled && styles.maintenanceToggleTextActive
                ]}>
                  {maintenanceDraft.enabled
                    ? t('admin.maintenance.turnOff', '점검 모드 끄기')
                    : t('admin.maintenance.turnOn', '점검 모드 켜기')}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => loadMaintenance(true)}
                style={(state) => [styles.refreshBtn, ...interactiveStateStyles(state)]}
              >
                <Text style={styles.refreshBtnText}>
                  {t('admin.maintenance.reload', '상태 다시 불러오기')}
                </Text>
              </Pressable>
            </View>

            <View style={styles.maintenanceFormGrid}>
              <View style={styles.maintenanceField}>
                <Text style={styles.inputLabel}>{t('admin.maintenance.form.title', '점검 제목')}</Text>
                <AccessibleTextInput
                  accessibilityLabel={t('admin.maintenance.form.title', '점검 제목')}
                  onChangeText={(value) => setMaintenanceDraft((draft) => ({ ...draft, title: value }))}
                  placeholder={t('admin.maintenance.form.titlePlaceholder', '사각사각 업데이트 중')}
                  style={styles.maintenanceInput}
                  value={maintenanceDraft.title}
                />
              </View>
              <View style={styles.maintenanceField}>
                <Text style={styles.inputLabel}>{t('admin.maintenance.form.estimatedEndAt', '예상 종료 시각')}</Text>
                <AccessibleTextInput
                  accessibilityLabel={t('admin.maintenance.form.estimatedEndAt', '예상 종료 시각')}
                  onChangeText={(value) => setMaintenanceDraft((draft) => ({ ...draft, estimatedEndAt: value }))}
                  placeholder="2026-05-29T22:00"
                  style={styles.maintenanceInput}
                  value={maintenanceDraft.estimatedEndAt}
                />
              </View>
            </View>

            <View style={styles.maintenanceField}>
              <Text style={styles.inputLabel}>{t('admin.maintenance.form.message', '점검 안내 문구')}</Text>
              <AccessibleTextInput
                accessibilityLabel={t('admin.maintenance.form.message', '점검 안내 문구')}
                multiline
                numberOfLines={3}
                onChangeText={(value) => setMaintenanceDraft((draft) => ({ ...draft, message: value }))}
                placeholder={t(
                  'admin.maintenance.form.messagePlaceholder',
                  '더 좋은 학습 경험을 준비하고 있어요. 조금만 기다려주세요.'
                )}
                style={[styles.maintenanceInput, styles.maintenanceMessageInput]}
                value={maintenanceDraft.message}
              />
            </View>

            <View style={styles.maintenanceActions}>
              <Pressable
                accessibilityRole="button"
                disabled={maintenanceSaving || !maintenanceDraft.title.trim() || !maintenanceDraft.message.trim()}
                onPress={handleSaveMaintenance}
                style={(state) => [
                  styles.maintenanceSaveButton,
                  (maintenanceSaving || !maintenanceDraft.title.trim() || !maintenanceDraft.message.trim()) && styles.disabledBtn,
                  ...interactiveStateStyles(state, {
                    disabled: maintenanceSaving || !maintenanceDraft.title.trim() || !maintenanceDraft.message.trim()
                  })
                ]}
              >
                {maintenanceSaving ? (
                  <ActivityIndicator color={colors.surface} size="small" />
                ) : (
                  <Text style={styles.maintenanceSaveText}>
                    {t('admin.maintenance.save', '점검 설정 저장')}
                  </Text>
                )}
              </Pressable>
            </View>
          </>
        )}
      </View>

      <View style={styles.maintenancePanel}>
        <View style={styles.maintenanceHeader}>
          <View>
            <Text style={styles.maintenanceEyebrow}>
              {t('admin.notice.eyebrow', '실시간 broadcast')}
            </Text>
            <Text style={styles.maintenanceTitle}>
              {t('admin.notice.title', '관리자 실시간 공지')}
            </Text>
            <Text style={styles.maintenanceDescription}>
              {t(
                'admin.notice.description',
                '접속 중인 사용자에게 WebSocket으로 즉시 표시되는 공지를 보냅니다. 공지 내용은 자동 번역하지 않습니다.'
              )}
            </Text>
          </View>
          <View style={[styles.maintenanceStatusBadge, styles.maintenanceStatusOff]}>
            <Text style={[styles.maintenanceStatusText, styles.maintenanceStatusTextOff]}>
              {t('admin.notice.status', '즉시 전송')}
            </Text>
          </View>
        </View>

        {noticeError ? (
          <View style={styles.maintenanceErrorBox}>
            <Text style={styles.alertText}>{noticeError}</Text>
          </View>
        ) : null}
        {noticeFeedback ? (
          <View style={styles.maintenanceSuccessBox}>
            <Text style={styles.alertText}>{noticeFeedback}</Text>
          </View>
        ) : null}

        <View style={styles.noticeLevelRow}>
          {['info', 'success', 'warning', 'danger'].map((level) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: noticeDraft.level === level }}
              key={level}
              onPress={() => setNoticeDraft((draft) => ({ ...draft, level }))}
              style={(state) => [
                styles.noticeLevelButton,
                noticeDraft.level === level && styles.noticeLevelButtonActive,
                ...interactiveStateStyles(state)
              ]}
            >
              <Text style={[
                styles.noticeLevelText,
                noticeDraft.level === level && styles.noticeLevelTextActive
              ]}>
                {t(`admin.notice.level.${level}`, level)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.maintenanceFormGrid}>
          <View style={styles.maintenanceField}>
            <Text style={styles.inputLabel}>{t('admin.notice.form.title', '공지 제목')}</Text>
            <AccessibleTextInput
              accessibilityLabel={t('admin.notice.form.title', '공지 제목')}
              onChangeText={(value) => setNoticeDraft((draft) => ({ ...draft, title: value }))}
              placeholder={t('admin.notice.form.titlePlaceholder', '공지')}
              style={styles.maintenanceInput}
              value={noticeDraft.title}
            />
          </View>
          <View style={styles.maintenanceField}>
            <Text style={styles.inputLabel}>{t('admin.notice.form.message', '공지 메시지')}</Text>
            <AccessibleTextInput
              accessibilityLabel={t('admin.notice.form.message', '공지 메시지')}
              multiline
              numberOfLines={3}
              onChangeText={(value) => setNoticeDraft((draft) => ({ ...draft, message: value }))}
              placeholder={t('admin.notice.form.messagePlaceholder', '잠시 후 서비스 업데이트가 시작됩니다.')}
              style={[styles.maintenanceInput, styles.maintenanceMessageInput]}
              value={noticeDraft.message}
            />
          </View>
        </View>

        <View style={styles.maintenanceActions}>
          <Pressable
            accessibilityRole="button"
            disabled={noticeSending || !noticeDraft.title.trim() || !noticeDraft.message.trim()}
            onPress={handleSendNotice}
            style={(state) => [
              styles.maintenanceSaveButton,
              (noticeSending || !noticeDraft.title.trim() || !noticeDraft.message.trim()) && styles.disabledBtn,
              ...interactiveStateStyles(state, {
                disabled: noticeSending || !noticeDraft.title.trim() || !noticeDraft.message.trim()
              })
            ]}
          >
            {noticeSending ? (
              <ActivityIndicator color={colors.surface} size="small" />
            ) : (
              <Text style={styles.maintenanceSaveText}>
                {t('admin.notice.send', '공지 보내기')}
              </Text>
            )}
          </Pressable>
        </View>
      </View>

      {/* Action / Input Form Panel (Dynamic Modal) */}
      {actionTarget && (
        <View style={styles.modalPanel}>
          <Text style={styles.modalTitle}>
            {actionTarget.type === 'user' && `${actionTarget.data.name}님 상태 변경`}
            {actionTarget.type === 'post' && `게시글 #${actionTarget.data.id} 관리 조치 (${actionTarget.actionType === 'HIDE' ? '삭제' : '유지'})`}
            {actionTarget.type === 'comment' && `댓글 #${actionTarget.data.id} 관리 조치 (${actionTarget.actionType === 'DELETE' ? '삭제' : '유지'})`}
          </Text>

          {actionTarget.type === 'user' && (
            <View style={styles.modalSelectGroup}>
              <Text style={styles.inputLabel}>변경할 상태 선택:</Text>
              <View style={styles.radioRow}>
                {['ACTIVE', 'SUSPENDED', 'DEACTIVATED'].map((status) => (
                  <Pressable
                    key={status}
                    onPress={() => setActionStatus(status)}
                    style={(state) => [
                      styles.radioButton,
                      actionStatus === status && styles.radioButtonActive,
                      ...interactiveStateStyles(state)
                    ]}
                  >
                    <Text style={[styles.radioText, actionStatus === status && styles.radioTextActive]}>
                      {getStatusLabel(status)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <Text style={styles.inputLabel}>
            조치 사유 입력 {(!actionTarget || actionTarget.actionType === 'KEEP') ? '(선택):' : '(필수):'}
          </Text>
          <AccessibleTextInput
            placeholder={(!actionTarget || actionTarget.actionType === 'KEEP') ? "기각 사유를 입력할 수 있습니다. (선택)" : "상태 변경 또는 제재 조치 사유를 구체적으로 입력하세요."}
            value={actionReason}
            onChangeText={setActionReason}
            style={styles.reasonInput}
            multiline
            numberOfLines={3}
          />

          <View style={styles.modalActions}>
            <Pressable
              disabled={submitting || (actionTarget && actionTarget.actionType !== 'KEEP' && !actionReason.trim())}
              onPress={actionTarget.type === 'user' ? handleUserStatusUpdate : handleModerationUpdate}
              style={(state) => [
                styles.modalSubmitBtn,
                (submitting || (actionTarget && actionTarget.actionType !== 'KEEP' && !actionReason.trim())) && styles.disabledBtn,
                ...interactiveStateStyles(state, { disabled: submitting || (actionTarget && actionTarget.actionType !== 'KEEP' && !actionReason.trim()) })
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={colors.surface} size="small" />
              ) : (
                <Text style={styles.modalSubmitText}>적용하기</Text>
              )}
            </Pressable>
            <Pressable
              disabled={submitting}
              onPress={() => setActionTarget(null)}
              style={(state) => [
                styles.modalCancelBtn,
                submitting && styles.disabledBtn,
                ...interactiveStateStyles(state, { disabled: submitting })
              ]}
            >
              <Text style={styles.modalCancelText}>취소</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>운영 데이터를 불러오는 중입니다.</Text>
          <PanelSkeleton rows={4} />
          <PanelSkeleton rows={2} />
        </View>
      ) : (
        <View style={styles.body}>
          {/* TAB 1: USER LIST */}
          {activeTab === 'users' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>등록된 사용자 목록 ({users.length})</Text>
                <Pressable onPress={loadData} style={(state) => [styles.refreshBtn, ...interactiveStateStyles(state)]}>
                  <Text style={styles.refreshBtnText}>새로고침</Text>
                </Pressable>
              </View>
              {users.length === 0 ? (
                renderEmptyState('등록된 사용자가 없습니다.', '새 사용자가 가입하면 이 목록에서 상태와 권한을 확인할 수 있습니다.')
              ) : (
                <View style={styles.list}>
                  {users.map((item) => (
                    <View key={item.id} style={styles.userCard}>
                      <View style={styles.userCardHeader}>
                        <View>
                          <Text style={styles.userCardName}>{item.name}</Text>
                          <Text style={styles.userCardLoginId}>{item.loginId}</Text>
                        </View>
                        <View style={[styles.badge, getStatusStyle(item.status)]}>
                          <Text style={[styles.badgeText, getStatusTextStyle(item.status)]}>{getStatusLabel(item.status)}</Text>
                        </View>
                      </View>
                      <View style={styles.userCardFooter}>
                        <Text style={styles.roleText}>권한: {item.role}</Text>
                        <Pressable
                          onPress={() => {
                            setActionTarget({ type: 'user', data: item });
                            setActionStatus(item.status);
                            setActionReason('');
                          }}
                          style={(state) => [styles.actionBtn, ...interactiveStateStyles(state)]}
                        >
                          <Text style={styles.actionBtnText}>상태 변경</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* TAB 2: REPORTS & CONTENT */}
          {activeTab === 'reports' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>신고 조치 관리</Text>
                <Pressable onPress={loadData} style={(state) => [styles.refreshBtn, ...interactiveStateStyles(state)]}>
                  <Text style={styles.refreshBtnText}>새로고침</Text>
                </Pressable>
              </View>

              {/* Reported Posts Sub-section */}
              <Text style={styles.subSectionTitle}>신고된 게시글 ({reports.reportedPosts.length})</Text>
              {reports.reportedPosts.length === 0 ? (
                renderEmptyState('신고된 게시글이 없습니다.', '처리가 필요한 신고가 생기면 이 영역에 먼저 표시됩니다.')
              ) : (
                <View style={styles.list}>
                  {reports.reportedPosts.map((item) => (
                    <View key={item.id} style={styles.reportCard}>
                      <View style={styles.reportCardHeader}>
                        <Text style={styles.reportCategory}>[{item.category}]</Text>
                        <Text style={styles.reportTargetId}>ID: {item.id}</Text>
                      </View>
                      <Text style={styles.reportTitle}>{item.title}</Text>
                      <Text style={styles.reportContent}>{item.content}</Text>
                      <View style={styles.reportInfoRow}>
                        <Text style={styles.reportMeta}>작성자: {item.user?.name || '알수없음'} ({item.user?.loginId})</Text>
                      </View>
                      <View style={styles.reportActions}>
                        <Pressable
                          onPress={() => {
                            setActionTarget({ type: 'post', data: item, actionType: 'HIDE' });
                            setActionReason('');
                          }}
                          style={(state) => [styles.moderationBtn, styles.dangerBtn, ...interactiveStateStyles(state)]}
                        >
                          <Text style={styles.moderationBtnText}>게시글 삭제(숨김)</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setActionTarget({ type: 'post', data: item, actionType: 'KEEP' });
                            setActionReason('');
                          }}
                          style={(state) => [styles.moderationBtn, styles.safeBtn, ...interactiveStateStyles(state)]}
                        >
                          <Text style={styles.moderationBtnText}>신고 기각(유지)</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Reported Comments Sub-section */}
              <Text style={[styles.subSectionTitle, { marginTop: 24 }]}>신고된 댓글 ({reports.reportedComments.length})</Text>
              {reports.reportedComments.length === 0 ? (
                renderEmptyState('신고된 댓글이 없습니다.', '댓글 신고가 접수되면 삭제 또는 기각 조치를 여기에서 진행합니다.')
              ) : (
                <View style={styles.list}>
                  {reports.reportedComments.map((item) => (
                    <View key={item.id} style={styles.reportCard}>
                      <View style={styles.reportCardHeader}>
                        <Text style={styles.reportCategory}>원문 게시글: {item.post?.title || '삭제된 게시글'}</Text>
                        <Text style={styles.reportTargetId}>ID: {item.id}</Text>
                      </View>
                      <Text style={styles.reportContent}>{item.content}</Text>
                      <View style={styles.reportInfoRow}>
                        <Text style={styles.reportMeta}>작성자: {item.user?.name || '알수없음'} ({item.user?.loginId})</Text>
                      </View>
                      <View style={styles.reportActions}>
                        <Pressable
                          onPress={() => {
                            setActionTarget({ type: 'comment', data: item, actionType: 'DELETE' });
                            setActionReason('');
                          }}
                          style={(state) => [styles.moderationBtn, styles.dangerBtn, ...interactiveStateStyles(state)]}
                        >
                          <Text style={styles.moderationBtnText}>댓글 삭제</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setActionTarget({ type: 'comment', data: item, actionType: 'KEEP' });
                            setActionReason('');
                          }}
                          style={(state) => [styles.moderationBtn, styles.safeBtn, ...interactiveStateStyles(state)]}
                        >
                          <Text style={styles.moderationBtnText}>신고 기각(유지)</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* TAB 3: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>관리자 시스템 감사 로그 ({reports.adminActions.length})</Text>
                <Pressable onPress={loadData} style={(state) => [styles.refreshBtn, ...interactiveStateStyles(state)]}>
                  <Text style={styles.refreshBtnText}>새로고침</Text>
                </Pressable>
              </View>
              {reports.adminActions.length === 0 ? (
                renderEmptyState('감사 기록이 없습니다.', '관리 조치를 수행하면 처리자, 대상, 사유가 감사 로그에 쌓입니다.')
              ) : (
                <View style={styles.list}>
                  {reports.adminActions.map((item) => (
                    <View key={item.id} style={styles.logCard}>
                      <View style={styles.logHeader}>
                        <Text style={styles.logActionType}>{item.actionType}</Text>
                        <Text style={styles.logDate}>{new Date(item.createdAt).toLocaleString()}</Text>
                      </View>
                      <View style={styles.logDetails}>
                        <Text style={styles.logInfoText}>대상 ID: {item.targetId} ({item.targetType})</Text>
                        <Text style={styles.logInfoText}>처리자: {item.admin?.name || '시스템'} ({item.admin?.loginId || 'System'})</Text>
                        <Text style={styles.logReason}>사유: {item.reason}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  contentContainer: {
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
    padding: 28,
    paddingBottom: 48,
    gap: 20
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300
  },
  errorHeader: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.danger,
    marginBottom: 8
  },
  errorSub: {
    fontSize: 15,
    color: colors.muted,
    marginBottom: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingBottom: 16
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.ink
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4
  },
  backButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 21,
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...interactions.transition
  },
  backButtonText: {
    color: colors.blueDeep,
    fontWeight: '600',
    fontSize: 14
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 7,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.line
  },
  tabButton: {
    flex: 1,
    minHeight: 47,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'transparent',
    ...interactions.transition
  },
  tabButtonActive: {
    backgroundColor: colors.mint,
    shadowColor: colors.blueDeep,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1
  },
  tabButtonText: {
    color: colors.muted,
    fontWeight: '600',
    fontSize: 14
  },
  tabButtonTextActive: {
    color: colors.surface,
    fontWeight: '700'
  },
  errorAlert: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 13,
    padding: 12
  },
  successAlert: {
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: colors.mint,
    borderRadius: 13,
    padding: 12
  },
  alertText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '500'
  },
  maintenancePanel: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 22,
    padding: 22,
    gap: 14,
    ...shadows.card
  },
  maintenanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 14,
    flexWrap: 'wrap'
  },
  maintenanceEyebrow: {
    color: colors.mintDeep,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 4
  },
  maintenanceTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900'
  },
  maintenanceDescription: {
    maxWidth: 680,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 4
  },
  maintenanceStatusBadge: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 13
  },
  maintenanceStatusOn: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning
  },
  maintenanceStatusOff: {
    backgroundColor: colors.successSoft,
    borderColor: colors.mint
  },
  maintenanceStatusText: {
    fontSize: 12,
    fontWeight: '900'
  },
  maintenanceStatusTextOn: {
    color: colors.warning
  },
  maintenanceStatusTextOff: {
    color: colors.success
  },
  maintenanceErrorBox: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 13,
    padding: 12
  },
  maintenanceSuccessBox: {
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: colors.mint,
    borderRadius: 13,
    padding: 12
  },
  maintenanceToggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10
  },
  maintenanceToggle: {
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingLeft: 6,
    paddingRight: 14,
    ...interactions.transition
  },
  maintenanceToggleActive: {
    borderColor: colors.warning,
    backgroundColor: colors.warningSoft
  },
  maintenanceToggleKnob: {
    width: 30,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface
  },
  maintenanceToggleKnobActive: {
    borderColor: colors.warning,
    backgroundColor: colors.warning
  },
  maintenanceToggleText: {
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '900'
  },
  maintenanceToggleTextActive: {
    color: colors.warning
  },
  noticeLevelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  noticeLevelButton: {
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 13,
    ...interactions.transition
  },
  noticeLevelButtonActive: {
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft
  },
  noticeLevelText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800'
  },
  noticeLevelTextActive: {
    color: colors.blueDeep,
    fontWeight: '900'
  },
  maintenanceFormGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  maintenanceField: {
    flex: 1,
    minWidth: 240,
    gap: 6
  },
  maintenanceInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 10,
    fontSize: 14,
    backgroundColor: colors.surfaceWarm,
    color: colors.ink
  },
  maintenanceMessageInput: {
    minHeight: 86,
    textAlignVertical: 'top'
  },
  maintenanceActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  maintenanceSaveButton: {
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.blue,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    ...interactions.transition
  },
  maintenanceSaveText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '900'
  },
  modalPanel: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.mint,
    borderRadius: 20,
    padding: 22,
    gap: 12,
    ...shadows.card,
    shadowColor: colors.mintDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingBottom: 8
  },
  modalSelectGroup: {
    gap: 6
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted
  },
  radioRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  radioButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    ...interactions.transition
  },
  radioButtonActive: {
    borderColor: colors.mint,
    backgroundColor: colors.mintSoft
  },
  radioText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600'
  },
  radioTextActive: {
    color: colors.mintDeep,
    fontWeight: '700'
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 10,
    fontSize: 14,
    backgroundColor: colors.surfaceWarm,
    textAlignVertical: 'top'
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  modalSubmitBtn: {
    flex: 2,
    backgroundColor: colors.blue,
    borderWidth: 1,
    borderColor: colors.blue,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...interactions.transition
  },
  modalSubmitText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 14
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...interactions.transition
  },
  modalCancelText: {
    color: colors.ink,
    fontWeight: '600',
    fontSize: 14
  },
  disabledBtn: {
    opacity: 0.5
  },
  loadingContainer: {
    gap: 16,
    gap: 12
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14
  },
  body: {
    gap: 16
  },
  section: {
    gap: 14
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    borderLeftWidth: 3,
    borderLeftColor: colors.mint,
    paddingLeft: 8
  },
  refreshBtn: {
    backgroundColor: colors.mintSoft,
    borderWidth: 1,
    borderColor: colors.mint,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    ...interactions.transition
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mintDeep
  },
  list: {
    gap: 12
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 18,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: 8,
    padding: 20
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center'
  },
  emptyText: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 20,
    textAlign: 'center'
  },
  emptyActionButton: {
    minHeight: 38,
    borderRadius: 999,
    backgroundColor: colors.blueSoft,
    paddingHorizontal: 14,
    justifyContent: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.blueSoft,
    ...interactions.transition
  },
  emptyActionText: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '800'
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 12
  },
  userCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  userCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink
  },
  userCardLoginId: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  statusActive: {
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: colors.mint,
  },
  statusActiveText: {
    color: colors.success
  },
  statusSuspended: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.creamStrong,
  },
  statusSuspendedText: {
    color: colors.warning
  },
  statusDeactivated: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  statusDeactivatedText: {
    color: colors.danger
  },
  statusDefault: {
    backgroundColor: colors.blueSoft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  userCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 10
  },
  roleText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500'
  },
  actionBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.blue,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    ...interactions.transition
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.blue
  },
  reportCard: {
    backgroundColor: colors.surface,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 10
  },
  reportCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  reportCategory: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warning
  },
  reportTargetId: {
    fontSize: 11,
    color: colors.muted
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink
  },
  reportContent: {
    fontSize: 14,
    color: colors.ink,
    lineHeight: 20
  },
  reportInfoRow: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 8
  },
  reportMeta: {
    fontSize: 12,
    color: colors.muted
  },
  reportActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6
  },
  moderationBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    ...interactions.transition
  },
  dangerBtn: {
    backgroundColor: colors.danger
  },
  safeBtn: {
    backgroundColor: colors.success
  },
  moderationBtnText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '700'
  },
  logCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    gap: 8
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logActionType: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.blue,
    backgroundColor: colors.blueSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  logDate: {
    fontSize: 11,
    color: colors.muted
  },
  logDetails: {
    gap: 4
  },
  logInfoText: {
    fontSize: 12,
    color: colors.ink
  },
  logReason: {
    fontSize: 12,
    color: colors.muted,
    fontStyle: 'italic',
    marginTop: 2
  }
});
