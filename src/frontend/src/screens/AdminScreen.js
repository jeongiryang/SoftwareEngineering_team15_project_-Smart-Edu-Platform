import { useState, useEffect } from 'react';
import { 
  ActivityIndicator, 
  FlatList, 
  Pressable, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  View 
} from 'react-native';
import { 
  getAdminUsers, 
  updateAdminUserStatus, 
  getAdminReports, 
  moderateAdminPost, 
  moderateAdminComment 
} from '../services/api';

export default function AdminScreen({ onNavigate, token, user }) {
  // Access Guard check inside component
  if (!user || user.role !== 'ADMIN') {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorHeader}>접근 권한이 없습니다.</Text>
        <Text style={styles.errorSub}>관리자 계정으로 로그인해 주세요.</Text>
        <Pressable onPress={() => onNavigate('dashboard')} style={styles.backButton}>
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

  useEffect(() => {
    loadData();
  }, [activeTab]);

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>관리자 시스템 콘솔</Text>
          <Text style={styles.subtitle}>사용자 계정 상태 및 커뮤니티 신고 관리</Text>
        </View>
        <Pressable onPress={() => onNavigate('dashboard')} style={styles.backButton}>
          <Text style={styles.backButtonText}>대시보드로 가기</Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <Pressable 
          onPress={() => { setActiveTab('users'); setActionTarget(null); }}
          style={[styles.tabButton, activeTab === 'users' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabButtonText, activeTab === 'users' && styles.tabButtonTextActive]}>
            사용자 관리
          </Text>
        </Pressable>
        <Pressable 
          onPress={() => { setActiveTab('reports'); setActionTarget(null); }}
          style={[styles.tabButton, activeTab === 'reports' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabButtonText, activeTab === 'reports' && styles.tabButtonTextActive]}>
            신고 콘텐츠 관리 ({reports.reportedPosts.length + reports.reportedComments.length})
          </Text>
        </Pressable>
        <Pressable 
          onPress={() => { setActiveTab('logs'); setActionTarget(null); }}
          style={[styles.tabButton, activeTab === 'logs' && styles.tabButtonActive]}
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
                    style={[styles.radioButton, actionStatus === status && styles.radioButtonActive]}
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
          <TextInput
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
              style={[styles.modalSubmitBtn, (submitting || (actionTarget && actionTarget.actionType !== 'KEEP' && !actionReason.trim())) && styles.disabledBtn]}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.modalSubmitText}>적용하기</Text>
              )}
            </Pressable>
            <Pressable 
              disabled={submitting} 
              onPress={() => setActionTarget(null)} 
              style={styles.modalCancelBtn}
            >
              <Text style={styles.modalCancelText}>취소</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#2563EB" size="large" />
          <Text style={styles.loadingText}>데이터 불러오는 중...</Text>
        </View>
      ) : (
        <View style={styles.body}>
          {/* TAB 1: USER LIST */}
          {activeTab === 'users' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>등록된 사용자 목록 ({users.length})</Text>
                <Pressable onPress={loadData} style={styles.refreshBtn}>
                  <Text style={styles.refreshBtnText}>새로고침</Text>
                </Pressable>
              </View>
              {users.length === 0 ? (
                <Text style={styles.emptyText}>사용자가 없습니다.</Text>
              ) : (
                <View style={styles.list}>
                  {users.map((item) => (
                    <View key={item.id} style={styles.userCard}>
                      <View style={styles.userCardHeader}>
                        <View>
                          <Text style={styles.userCardName}>{item.name}</Text>
                          <Text style={styles.userCardEmail}>{item.email}</Text>
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
                          style={styles.actionBtn}
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
                <Pressable onPress={loadData} style={styles.refreshBtn}>
                  <Text style={styles.refreshBtnText}>새로고침</Text>
                </Pressable>
              </View>

              {/* Reported Posts Sub-section */}
              <Text style={styles.subSectionTitle}>신고된 게시글 ({reports.reportedPosts.length})</Text>
              {reports.reportedPosts.length === 0 ? (
                <Text style={styles.emptyText}>신고된 게시글이 없습니다.</Text>
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
                        <Text style={styles.reportMeta}>작성자: {item.user?.name || '알수없음'} ({item.user?.email})</Text>
                      </View>
                      <View style={styles.reportActions}>
                        <Pressable 
                          onPress={() => {
                            setActionTarget({ type: 'post', data: item, actionType: 'HIDE' });
                            setActionReason('');
                          }}
                          style={[styles.moderationBtn, styles.dangerBtn]}
                        >
                          <Text style={styles.moderationBtnText}>게시글 삭제(숨김)</Text>
                        </Pressable>
                        <Pressable 
                          onPress={() => {
                            setActionTarget({ type: 'post', data: item, actionType: 'KEEP' });
                            setActionReason('');
                          }}
                          style={[styles.moderationBtn, styles.safeBtn]}
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
                <Text style={styles.emptyText}>신고된 댓글이 없습니다.</Text>
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
                        <Text style={styles.reportMeta}>작성자: {item.user?.name || '알수없음'} ({item.user?.email})</Text>
                      </View>
                      <View style={styles.reportActions}>
                        <Pressable 
                          onPress={() => {
                            setActionTarget({ type: 'comment', data: item, actionType: 'DELETE' });
                            setActionReason('');
                          }}
                          style={[styles.moderationBtn, styles.dangerBtn]}
                        >
                          <Text style={styles.moderationBtnText}>댓글 삭제</Text>
                        </Pressable>
                        <Pressable 
                          onPress={() => {
                            setActionTarget({ type: 'comment', data: item, actionType: 'KEEP' });
                            setActionReason('');
                          }}
                          style={[styles.moderationBtn, styles.safeBtn]}
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
                <Pressable onPress={loadData} style={styles.refreshBtn}>
                  <Text style={styles.refreshBtnText}>새로고침</Text>
                </Pressable>
              </View>
              {reports.adminActions.length === 0 ? (
                <Text style={styles.emptyText}>감사 기록이 없습니다.</Text>
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
                        <Text style={styles.logInfoText}>처리자: {item.admin?.name || '시스템'} ({item.admin?.email || 'System'})</Text>
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
    backgroundColor: '#F8FAFC'
  },
  contentContainer: {
    padding: 24,
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
    color: '#EF4444',
    marginBottom: 8
  },
  errorSub: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 16
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A'
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  backButtonText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 14
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    padding: 4,
    gap: 4
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1
  },
  tabButtonText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14
  },
  tabButtonTextActive: {
    color: '#0F172A',
    fontWeight: '700'
  },
  errorAlert: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 12
  },
  successAlert: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 8,
    padding: 12
  },
  alertText: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '500'
  },
  modalPanel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#6366F1',
    borderRadius: 12,
    padding: 18,
    gap: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8
  },
  modalSelectGroup: {
    gap: 6
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569'
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
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC'
  },
  radioButtonActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF'
  },
  radioText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600'
  },
  radioTextActive: {
    color: '#4F46E5',
    fontWeight: '700'
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top'
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  modalSubmitBtn: {
    flex: 2,
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalCancelText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14
  },
  disabledBtn: {
    opacity: 0.5
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12
  },
  loadingText: {
    color: '#64748B',
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
    color: '#0F172A'
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
    paddingLeft: 8
  },
  refreshBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569'
  },
  list: {
    gap: 12
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed'
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#0F172A'
  },
  userCardEmail: {
    fontSize: 13,
    color: '#64748B',
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
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  statusActiveText: {
    color: '#166534'
  },
  statusSuspended: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusSuspendedText: {
    color: '#92400E'
  },
  statusDeactivated: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  statusDeactivatedText: {
    color: '#991B1B'
  },
  statusDefault: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  userCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10
  },
  roleText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500'
  },
  actionBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#6366F1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5'
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#EF4444'
  },
  reportTargetId: {
    fontSize: 11,
    color: '#94A3B8'
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A'
  },
  reportContent: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20
  },
  reportInfoRow: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8
  },
  reportMeta: {
    fontSize: 12,
    color: '#64748B'
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
    borderRadius: 6
  },
  dangerBtn: {
    backgroundColor: '#EF4444'
  },
  safeBtn: {
    backgroundColor: '#10B981'
  },
  moderationBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#4F46E5',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  logDate: {
    fontSize: 11,
    color: '#94A3B8'
  },
  logDetails: {
    gap: 4
  },
  logInfoText: {
    fontSize: 12,
    color: '#475569'
  },
  logReason: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 2
  }
});
