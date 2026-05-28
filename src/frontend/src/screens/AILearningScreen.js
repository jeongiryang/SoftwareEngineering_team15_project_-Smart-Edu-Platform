import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import {
  askAIQuestion,
  getAIRecommendation,
  summarizeText,
  analyzeWrongAnswer
} from '../services/api';
import AccessibleTextInput from '../components/AccessibleTextInput';
import ReadableText from '../components/ReadableText';
import { PanelSkeleton } from '../components/Skeleton';
import { colors, shadows } from '../styles/theme';

export default function AILearningScreen({ onNavigate, token, user }) {
  const [activeTab, setActiveTab] = useState('qna'); // 'qna' | 'recommend' | 'summarize' | 'wrong'

  // Loading, Success & Error States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Tab 1: AI 학습 질의 (Q&A) States
  const [questionInput, setQuestionInput] = useState('');
  const [recentQnaList, setRecentQnaList] = useState([]); // [{ question, answer, isTruncated }]

  // Tab 2: 맞춤 학습 추천 (Recommendation) States
  const [recommendationResult, setRecommendationResult] = useState(null); // { recommendedSubject, tips }

  // Tab 3: 긴 글 요약 (Summarize) States
  const [summarizeInput, setSummarizeInput] = useState('');
  const [summaryResult, setSummaryResult] = useState(null); // { summary, isTruncated }

  // Tab 4: 오답 원인 분석 (Wrong Answer) States
  const [wrongProblemInput, setWrongProblemInput] = useState('');
  const [wrongUserAnswerInput, setWrongUserAnswerInput] = useState('');
  const [wrongAnalysisResult, setWrongAnalysisResult] = useState(null); // { problem, userAnswer, explanation, weakType }

  // Clear messages helper
  const resetFeedback = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Enforce Max Lengths Constants
  const MAX_QUESTION_LENGTH = 1000;
  const MAX_SUMMARY_LENGTH = 3000;
  const MAX_PROBLEM_LENGTH = 1000;
  const MAX_ANSWER_LENGTH = 1000;

  // Navigation guard fallback inside the view
  if (!user) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorHeader}>접근 권한이 없습니다.</Text>
        <Text style={styles.errorSub}>로그인 후 다시 시도해 주세요.</Text>
        <Pressable onPress={() => onNavigate('login')} style={styles.backButton}>
          <Text style={styles.backButtonText}>로그인 하러 가기</Text>
        </Pressable>
      </View>
    );
  }

  // Handle Tab 1 Q&A Submit
  async function handleQuestionSubmit() {
    const questionText = questionInput.trim();
    if (!questionText) return;

    if (questionText.length > MAX_QUESTION_LENGTH) {
      setErrorMsg(`질문은 최대 ${MAX_QUESTION_LENGTH}자 이하이어야 합니다.`);
      return;
    }

    setLoading(true);
    resetFeedback();

    try {
      // Allow truncate fallback when checked
      const response = await askAIQuestion(token, {
        question: questionText,
        allowTruncate: true
      });

      const qnaRecord = response.question;
      setRecentQnaList((prev) => [
        {
          question: qnaRecord.question,
          answer: qnaRecord.answer,
          isTruncated: qnaRecord.isTruncated
        },
        ...prev
      ]);
      setQuestionInput('');
      setSuccessMsg('AI 답변 생성이 성공적으로 완료되었습니다.');
    } catch (err) {
      if (err.message.includes('429') || err.message.toLowerCase().includes('rate limit') || err.message.toLowerCase().includes('too many')) {
        setErrorMsg('AI 요청 횟수 제한을 초과했습니다. 잠시 후 다시 시도해 주세요.');
      } else {
        setErrorMsg(err.message || '답변 요청 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }

  // Handle Tab 2 Study Recommendation Submit
  async function handleRecommendationSubmit() {
    setLoading(true);
    resetFeedback();

    try {
      const response = await getAIRecommendation(token);
      const rec = response.recommendation;

      setRecommendationResult({
        recommendedSubject: rec.recommendationJson.recommendedSubject,
        tips: rec.recommendationJson.tips || []
      });
      setSuccessMsg('맞춤 학습 분석 및 추천 팁이 업데이트되었습니다.');
    } catch (err) {
      if (err.message.includes('429') || err.message.toLowerCase().includes('rate limit') || err.message.toLowerCase().includes('too many')) {
        setErrorMsg('AI 요청 횟수 제한을 초과했습니다. 잠시 후 다시 시도해 주세요.');
      } else {
        setErrorMsg(err.message || '학습 추천 요청 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }

  // Handle Tab 3 Summarization Submit
  async function handleSummarySubmit() {
    const contentText = summarizeInput.trim();
    if (!contentText) return;

    if (contentText.length > MAX_SUMMARY_LENGTH) {
      setErrorMsg(`요약할 텍스트는 최대 ${MAX_SUMMARY_LENGTH}자 이하이어야 합니다.`);
      return;
    }

    setLoading(true);
    resetFeedback();

    try {
      const response = await summarizeText(token, {
        content: contentText,
        allowTruncate: true
      });

      setSummaryResult({
        summary: response.summary,
        isTruncated: response.isTruncated
      });
      setSuccessMsg('문서 3줄 요약이 완료되었습니다.');
    } catch (err) {
      if (err.message.includes('429') || err.message.toLowerCase().includes('rate limit') || err.message.toLowerCase().includes('too many')) {
        setErrorMsg('AI 요청 횟수 제한을 초과했습니다. 잠시 후 다시 시도해 주세요.');
      } else {
        setErrorMsg(err.message || '텍스트 요약 요청 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }

  // Handle Tab 4 Wrong Answer Analysis Submit
  async function handleWrongAnswerSubmit() {
    const problemText = wrongProblemInput.trim();
    const userAnswerText = wrongUserAnswerInput.trim();

    if (!problemText) return;

    if (problemText.length > MAX_PROBLEM_LENGTH) {
      setErrorMsg(`문제는 최대 ${MAX_PROBLEM_LENGTH}자 이하이어야 합니다.`);
      return;
    }
    if (userAnswerText.length > MAX_ANSWER_LENGTH) {
      setErrorMsg(`답변은 최대 ${MAX_ANSWER_LENGTH}자 이하이어야 합니다.`);
      return;
    }

    setLoading(true);
    resetFeedback();

    try {
      const response = await analyzeWrongAnswer(token, {
        problem: problemText,
        userAnswer: userAnswerText || undefined,
        allowTruncate: true
      });

      const note = response.wrongAnswerNote;
      setWrongAnalysisResult({
        problem: note.problem,
        userAnswer: note.userAnswer,
        explanation: note.explanation,
        weakType: note.weakType
      });
      setSuccessMsg('오답 원인 분석이 성공적으로 완료되었습니다.');
    } catch (err) {
      if (err.message.includes('429') || err.message.toLowerCase().includes('rate limit') || err.message.toLowerCase().includes('too many')) {
        setErrorMsg('AI 요청 횟수 제한을 초과했습니다. 잠시 후 다시 시도해 주세요.');
      } else {
        setErrorMsg(err.message || '오답 원인 분석 요청 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>AI 학습 지원 센터</Text>
          <Text style={styles.subtitle}>개인화된 AI 도우미와 함께하는 스마트 학습</Text>
        </View>
        <Pressable onPress={() => onNavigate('dashboard')} style={styles.backButton}>
          <Text style={styles.backButtonText}>대시보드로 가기</Text>
        </Pressable>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabsRow}>
        <Pressable
          onPress={() => { setActiveTab('qna'); resetFeedback(); }}
          style={[styles.tabButton, activeTab === 'qna' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabButtonText, activeTab === 'qna' && styles.tabButtonTextActive]}>
            AI 학습 질의
          </Text>
        </Pressable>
        <Pressable
          onPress={() => { setActiveTab('recommend'); resetFeedback(); }}
          style={[styles.tabButton, activeTab === 'recommend' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabButtonText, activeTab === 'recommend' && styles.tabButtonTextActive]}>
            맞춤 학습 추천
          </Text>
        </Pressable>
        <Pressable
          onPress={() => { setActiveTab('summarize'); resetFeedback(); }}
          style={[styles.tabButton, activeTab === 'summarize' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabButtonText, activeTab === 'summarize' && styles.tabButtonTextActive]}>
            긴 글 요약
          </Text>
        </Pressable>
        <Pressable
          onPress={() => { setActiveTab('wrong'); resetFeedback(); }}
          style={[styles.tabButton, activeTab === 'wrong' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabButtonText, activeTab === 'wrong' && styles.tabButtonTextActive]}>
            오답 원인 분석
          </Text>
        </Pressable>
      </View>

      {/* Alerts */}
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

      {loading ? <PanelSkeleton rows={3} /> : null}

      {/* Tab Panels */}
      <View style={styles.panelBody}>
        {/* TAB 1: AI 학습 질의 */}
        {activeTab === 'qna' && (
          <View style={styles.tabContent}>
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>AI에게 질문하기</Text>
                <Text style={styles.charCounter}>
                  {questionInput.length} / {MAX_QUESTION_LENGTH}자
                </Text>
              </View>
              <AccessibleTextInput
                placeholder="공부하다가 모르는 개념이나 공식, 질문 사항을 입력하세요."
                placeholderTextColor={colors.muted}
                value={questionInput}
                onChangeText={setQuestionInput}
                style={styles.textInput}
                multiline
                numberOfLines={4}
                maxLength={MAX_QUESTION_LENGTH}
                editable={!loading}
              />
              <Pressable
                disabled={loading || !questionInput.trim()}
                onPress={handleQuestionSubmit}
                style={[
                  styles.submitBtn,
                  (loading || !questionInput.trim()) && styles.disabledBtn
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.surface} size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>질문 제출하기</Text>
                )}
              </Pressable>
            </View>

            {/* Q&A Recent List */}
            <View style={styles.resultSection}>
              <Text style={styles.resultTitle}>최근 학습 질의 내역 ({recentQnaList.length})</Text>
              {recentQnaList.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>질문한 내역이 없습니다. 위에 모르는 내용을 물어보세요!</Text>
                </View>
              ) : (
                recentQnaList.map((item, idx) => (
                  <View key={idx} style={styles.qnaCard}>
                    <View style={styles.qnaHeader}>
                      <Text style={styles.qnaLabelUser}>Q. 내 질문</Text>
                      {item.isTruncated && <Text style={styles.truncateBadge}>자동 요약됨</Text>}
                    </View>
                    <Text style={styles.qnaTextUser}>{item.question}</Text>
                    <View style={styles.divider} />
                    <Text style={styles.qnaLabelAi}>A. AI 답변</Text>
                    <ReadableText style={styles.qnaTextAi}>{item.answer}</ReadableText>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* TAB 2: 맞춤 학습 추천 */}
        {activeTab === 'recommend' && (
          <View style={styles.tabContent}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>학습 기록 분석</Text>
              <Text style={styles.formDesc}>
                캘린더에 등록된 내 학습 일정과 칸반 보드의 할 일 데이터를 분석하여 AI가 오늘 집중할 과목과 학습 팁을 제안해 줍니다.
              </Text>
              <Pressable
                disabled={loading}
                onPress={handleRecommendationSubmit}
                style={[styles.submitBtn, loading && styles.disabledBtn]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.surface} size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>분석 및 맞춤 추천 요청</Text>
                )}
              </Pressable>
            </View>

            {/* Recommendation Result */}
            {recommendationResult && (
              <View style={styles.recommendCard}>
                <Text style={styles.recommendLabel}>📚 AI 추천 학습 과목</Text>
                <View style={styles.subjectBox}>
                  <Text style={styles.subjectText}>{recommendationResult.recommendedSubject}</Text>
                </View>

                <Text style={[styles.recommendLabel, { marginTop: 20 }]}>💡 오늘의 추천 공부 팁</Text>
                <View style={styles.tipsBox}>
                  {recommendationResult.tips.map((tip, idx) => (
                    <View key={idx} style={styles.tipItem}>
                      <Text style={styles.tipBullet}>•</Text>
                      <ReadableText style={styles.tipText}>{tip}</ReadableText>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* TAB 3: 긴 글 요약 */}
        {activeTab === 'summarize' && (
          <View style={styles.tabContent}>
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>요약할 본문 입력</Text>
                <Text style={styles.charCounter}>
                  {summarizeInput.length} / {MAX_SUMMARY_LENGTH}자
                </Text>
              </View>
              <AccessibleTextInput
                placeholder="책 본문, 학습지 텍스트 등 요약이 필요한 긴 글을 복사해서 붙여넣으세요."
                placeholderTextColor={colors.muted}
                value={summarizeInput}
                onChangeText={setSummarizeInput}
                style={[styles.textInput, { minHeight: 150 }]}
                multiline
                numberOfLines={8}
                maxLength={MAX_SUMMARY_LENGTH}
                editable={!loading}
              />
              <Pressable
                disabled={loading || !summarizeInput.trim()}
                onPress={handleSummarySubmit}
                style={[
                  styles.submitBtn,
                  (loading || !summarizeInput.trim()) && styles.disabledBtn
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.surface} size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>3줄 요약 요청하기</Text>
                )}
              </Pressable>
            </View>

            {/* Summary Result */}
            {summaryResult && (
              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <Text style={styles.summaryCardTitle}>📋 AI 3줄 요약 결과</Text>
                  {summaryResult.isTruncated && <Text style={styles.truncateBadge}>앞부분 요약됨 (3000자 초과)</Text>}
                </View>
                <View style={styles.summaryContentBox}>
                  <ReadableText style={styles.summaryText}>{summaryResult.summary}</ReadableText>
                </View>
              </View>
            )}
          </View>
        )}

        {/* TAB 4: 오답 원인 분석 */}
        {activeTab === 'wrong' && (
          <View style={styles.tabContent}>
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>틀린 문제 내용 (필수)</Text>
                <Text style={styles.charCounter}>
                  {wrongProblemInput.length} / {MAX_PROBLEM_LENGTH}자
                </Text>
              </View>
              <AccessibleTextInput
                placeholder="틀린 문제 문항이나 문제를 그대로 입력해 주세요."
                placeholderTextColor={colors.muted}
                value={wrongProblemInput}
                onChangeText={setWrongProblemInput}
                style={styles.textInput}
                multiline
                numberOfLines={3}
                maxLength={MAX_PROBLEM_LENGTH}
                editable={!loading}
              />

              <View style={[styles.formHeader, { marginTop: 14 }]}>
                <Text style={styles.formTitle}>내가 작성한 오답 (선택)</Text>
                <Text style={styles.charCounter}>
                  {wrongUserAnswerInput.length} / {MAX_ANSWER_LENGTH}자
                </Text>
              </View>
              <AccessibleTextInput
                placeholder="문제 풀 때 내가 작성했던 틀린 답변이나 풀이 과정을 적어보세요. (선택)"
                placeholderTextColor={colors.muted}
                value={wrongUserAnswerInput}
                onChangeText={setWrongUserAnswerInput}
                style={styles.textInput}
                multiline
                numberOfLines={3}
                maxLength={MAX_ANSWER_LENGTH}
                editable={!loading}
              />

              <Pressable
                disabled={loading || !wrongProblemInput.trim()}
                onPress={handleWrongAnswerSubmit}
                style={[
                  styles.submitBtn,
                  (loading || !wrongProblemInput.trim()) && styles.disabledBtn
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.surface} size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>오답 원인 분석하기</Text>
                )}
              </Pressable>
            </View>

            {/* Wrong Answer Analysis Result */}
            {wrongAnalysisResult && (
              <View style={styles.wrongCard}>
                <View style={styles.wrongHeaderRow}>
                  <Text style={styles.wrongLabel}>🎯 틀린 원인 분석 결과</Text>
                  <View style={styles.weakBadge}>
                    <Text style={styles.weakBadgeText}>
                      {wrongAnalysisResult.weakType === 'calculation mistake' ? '연산 실수' : '개념 이해 부족'}
                    </Text>
                  </View>
                </View>

                <View style={styles.wrongContentBox}>
                  <Text style={styles.wrongQuestionTitle}>📌 입력한 문제:</Text>
                  <Text style={styles.wrongQuestionText}>{wrongAnalysisResult.problem}</Text>

                  {wrongAnalysisResult.userAnswer ? (
                    <>
                      <Text style={styles.wrongUserLabel}>✏️ 내가 쓴 답변:</Text>
                      <Text style={styles.wrongUserText}>{wrongAnalysisResult.userAnswer}</Text>
                    </>
                  ) : null}

                  <View style={styles.wrongDivider} />

                  <Text style={styles.wrongExplanationLabel}>📝 AI 피드백 및 해설:</Text>
                  <ReadableText style={styles.wrongExplanationText}>{wrongAnalysisResult.explanation}</ReadableText>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
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
    gap: 18
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 4
  },
  title: {
    fontSize: 29,
    fontWeight: '800',
    color: colors.ink
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4
  },
  backButton: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 18
  },
  backButtonText: {
    color: colors.blueDeep,
    fontSize: 14,
    fontWeight: '600'
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 7,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.blueDeep,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  tabButton: {
    flex: 1,
    minHeight: 47,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  tabButtonActive: {
    backgroundColor: colors.mint
  },
  tabButtonText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600'
  },
  tabButtonTextActive: {
    color: colors.surface,
    fontWeight: '700'
  },
  errorAlert: {
    backgroundColor: colors.dangerSoft,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: 14
  },
  successAlert: {
    backgroundColor: colors.successSoft,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.mint,
    padding: 14
  },
  alertText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600'
  },
  panelBody: {
    marginTop: 4
  },
  tabContent: {
    gap: 16
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 23,
    gap: 12,
    ...shadows.card,
    shadowColor: colors.blueDeep,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink
  },
  formDesc: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18
  },
  charCounter: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600'
  },
  textInput: {
    minHeight: 90,
    backgroundColor: colors.surfaceWarm,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    color: colors.ink,
    fontSize: 14,
    textAlignVertical: 'top'
  },
  submitBtn: {
    minHeight: 44,
    backgroundColor: colors.blue,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.blue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3
  },
  submitBtnText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700'
  },
  disabledBtn: {
    backgroundColor: colors.muted,
    shadowOpacity: 0
  },
  resultSection: {
    gap: 12
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    marginLeft: 2
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center'
  },
  qnaCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 8,
    shadowColor: colors.blueDeep,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  qnaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  qnaLabelUser: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  qnaLabelAi: {
    color: colors.mintDeep,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  qnaTextUser: {
    fontSize: 14,
    color: colors.ink,
    fontWeight: '500'
  },
  qnaTextAi: {
    fontSize: 14,
    color: colors.ink,
    lineHeight: 20
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 4
  },
  truncateBadge: {
    fontSize: 10,
    color: colors.warning,
    backgroundColor: colors.warningSoft,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontWeight: '700'
  },
  recommendCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 20,
    shadowColor: colors.blueDeep,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  recommendLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 8
  },
  subjectBox: {
    backgroundColor: colors.mintSoft,
    borderWidth: 1,
    borderColor: colors.mint,
    borderRadius: 13,
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  subjectText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.mintDeep,
    textAlign: 'center'
  },
  tipsBox: {
    gap: 8
  },
  tipItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start'
  },
  tipBullet: {
    color: colors.mintDeep,
    fontSize: 14,
    fontWeight: '700'
  },
  tipText: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
    flex: 1
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 20,
    gap: 12,
    shadowColor: colors.blueDeep,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  summaryCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink
  },
  summaryContentBox: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: 13,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line
  },
  summaryText: {
    fontSize: 14,
    color: colors.ink,
    lineHeight: 22,
    whiteSpace: 'pre-wrap' // For bullet lists formatted by backend summary
  },
  wrongCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 20,
    gap: 12,
    shadowColor: colors.blueDeep,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  wrongHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  wrongLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink
  },
  weakBadge: {
    backgroundColor: colors.cream,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  weakBadgeText: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '700'
  },
  wrongContentBox: {
    gap: 8
  },
  wrongQuestionTitle: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600'
  },
  wrongQuestionText: {
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.surfaceWarm,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.line
  },
  wrongUserLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
    marginTop: 4
  },
  wrongUserText: {
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.surfaceWarm,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.line
  },
  wrongDivider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 6
  },
  wrongExplanationLabel: {
    fontSize: 12,
    color: colors.mintDeep,
    fontWeight: '700'
  },
  wrongExplanationText: {
    fontSize: 14,
    color: colors.ink,
    lineHeight: 20
  },
  errorHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.danger
  },
  errorSub: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
    marginBottom: 16
  }
});
