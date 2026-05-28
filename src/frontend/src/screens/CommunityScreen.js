import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import {
  createCommunityBookmark,
  createCommunityComment,
  createCommunityPost,
  createCommunityReaction,
  deleteCommunityBookmark,
  deleteCommunityComment,
  deleteCommunityPost,
  deleteCommunityReaction,
  getCommunityBookmarks,
  getCommunityComments,
  getCommunityPost,
  getCommunityPosts,
  reportCommunityComment,
  reportCommunityPost,
  updateCommunityComment,
  updateCommunityPost
} from '../services/api';

const CATEGORIES = [
  { value: 'QUESTION', label: '질문' },
  { value: 'FREE', label: '자유' },
  { value: 'STUDY_PROOF', label: '학습 인증' }
];

const CATEGORY_FILTERS = [{ value: 'ALL', label: '전체' }, ...CATEGORIES];
const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'oldest', label: '오래된순' }
];

const PAGE_SIZE = 10;

function getCategoryLabel(category) {
  return CATEGORIES.find((item) => item.value === category)?.label || category;
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getPreview(content) {
  if (!content) {
    return '';
  }

  return content.length > 96 ? `${content.slice(0, 96)}...` : content;
}

function isOwnContent(item, user) {
  return Number(item?.userId) === Number(user?.id);
}

export default function CommunityScreen({ onNavigate, token, user }) {
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 });
  const [bookmarkPagination, setBookmarkPagination] = useState({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1
  });
  const [page, setPage] = useState(1);
  const [bookmarkPage, setBookmarkPage] = useState(1);
  const [category, setCategory] = useState('ALL');
  const [sort, setSort] = useState('latest');
  const [bookmarkSort, setBookmarkSort] = useState('latest');
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentPagination, setCommentPagination] = useState({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1
  });
  const [commentPage, setCommentPage] = useState(1);
  const [commentContent, setCommentContent] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [postFormMode, setPostFormMode] = useState(null);
  const [postForm, setPostForm] = useState({
    category: 'QUESTION',
    title: '',
    content: ''
  });
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (activeTab === 'posts') {
      loadPosts();
      return;
    }

    loadBookmarks();
  }, [activeTab, page, bookmarkPage, category, sort, bookmarkSort, search]);

  async function loadPosts() {
    setLoading(true);
    setErrorMessage('');

    try {
      const result = await getCommunityPosts(token, {
        page,
        pageSize: PAGE_SIZE,
        category: category === 'ALL' ? undefined : category,
        search,
        sort
      });

      setPosts(result.posts || []);
      setPagination(result.pagination || { page, pageSize: PAGE_SIZE, total: 0, totalPages: 1 });
    } catch (error) {
      setErrorMessage(error.message || '게시글 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function loadBookmarks() {
    setLoading(true);
    setErrorMessage('');

    try {
      const result = await getCommunityBookmarks(token, {
        page: bookmarkPage,
        pageSize: PAGE_SIZE,
        sort: bookmarkSort
      });

      setBookmarks(result.bookmarks || []);
      setBookmarkPagination(
        result.pagination || { page: bookmarkPage, pageSize: PAGE_SIZE, total: 0, totalPages: 1 }
      );
    } catch (error) {
      setErrorMessage(error.message || '북마크 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function loadPostDetail(postId, nextCommentPage = commentPage) {
    setDetailLoading(true);
    setErrorMessage('');

    try {
      const [postResult, commentResult] = await Promise.all([
        getCommunityPost(token, postId),
        getCommunityComments(token, postId, {
          page: nextCommentPage,
          pageSize: PAGE_SIZE
        })
      ]);

      setSelectedPost(postResult.post);
      setComments(commentResult.comments || []);
      setCommentPagination(
        commentResult.pagination || {
          page: nextCommentPage,
          pageSize: PAGE_SIZE,
          total: 0,
          totalPages: 1
        }
      );
    } catch (error) {
      setErrorMessage(error.message || '게시글 상세를 불러오지 못했습니다.');
    } finally {
      setDetailLoading(false);
    }
  }

  function resetMessages() {
    setErrorMessage('');
    setSuccessMessage('');
  }

  function handleSearchSubmit() {
    setSearch(searchDraft.trim());
    setPage(1);
    setSelectedPost(null);
    setPostFormMode(null);
  }

  function openCreateForm() {
    resetMessages();
    setSelectedPost(null);
    setPostFormMode('create');
    setPostForm({
      category: 'QUESTION',
      title: '',
      content: ''
    });
  }

  function openEditPostForm(post) {
    resetMessages();
    setPostFormMode('edit');
    setPostForm({
      category: post.category,
      title: post.title,
      content: post.content
    });
  }

  function closePostForm() {
    setPostFormMode(null);
  }

  async function submitPostForm() {
    const title = postForm.title.trim();
    const content = postForm.content.trim();

    if (!title || !content) {
      setErrorMessage('제목과 내용을 입력해 주세요.');
      return;
    }

    setBusy(true);
    resetMessages();

    try {
      if (postFormMode === 'edit' && selectedPost) {
        const result = await updateCommunityPost(token, selectedPost.id, {
          category: postForm.category,
          title,
          content
        });

        setSuccessMessage('게시글을 수정했습니다.');
        setPostFormMode(null);
        await loadPostDetail(result.post.id, commentPage);
      } else {
        const result = await createCommunityPost(token, {
          category: postForm.category,
          title,
          content
        });

        setSuccessMessage('게시글을 작성했습니다.');
        setPostFormMode(null);
        setActiveTab('posts');
        setPage(1);
        await loadPostDetail(result.post.id, 1);
        await loadPosts();
      }
    } catch (error) {
      setErrorMessage(error.message || '게시글 저장에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  function confirmDeletePost(post) {
    Alert.alert('게시글 삭제', '이 게시글을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => deletePost(post)
      }
    ]);
  }

  async function deletePost(post) {
    setBusy(true);
    resetMessages();

    try {
      await deleteCommunityPost(token, post.id);
      setSuccessMessage('게시글을 삭제했습니다.');
      setSelectedPost(null);
      setPostFormMode(null);
      await loadPosts();
      if (activeTab === 'bookmarks') {
        await loadBookmarks();
      }
    } catch (error) {
      setErrorMessage(error.message || '게시글 삭제에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function submitComment() {
    if (!selectedPost) {
      return;
    }

    const content = commentContent.trim();

    if (!content) {
      setErrorMessage('댓글 내용을 입력해 주세요.');
      return;
    }

    setBusy(true);
    resetMessages();

    try {
      await createCommunityComment(token, selectedPost.id, { content });
      setCommentContent('');
      setCommentPage(1);
      setSuccessMessage('댓글을 작성했습니다.');
      await loadPostDetail(selectedPost.id, 1);
      await loadPosts();
    } catch (error) {
      setErrorMessage(error.message || '댓글 작성에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  function startEditComment(comment) {
    setEditingComment(comment);
    setEditingCommentContent(comment.content);
  }

  async function submitCommentEdit() {
    const content = editingCommentContent.trim();

    if (!editingComment || !content) {
      setErrorMessage('댓글 내용을 입력해 주세요.');
      return;
    }

    setBusy(true);
    resetMessages();

    try {
      await updateCommunityComment(token, editingComment.id, { content });
      setEditingComment(null);
      setEditingCommentContent('');
      setSuccessMessage('댓글을 수정했습니다.');
      await loadPostDetail(selectedPost.id, commentPage);
    } catch (error) {
      setErrorMessage(error.message || '댓글 수정에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  function confirmDeleteComment(comment) {
    Alert.alert('댓글 삭제', '이 댓글을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => deleteComment(comment)
      }
    ]);
  }

  async function deleteComment(comment) {
    setBusy(true);
    resetMessages();

    try {
      await deleteCommunityComment(token, comment.id);
      setSuccessMessage('댓글을 삭제했습니다.');
      await loadPostDetail(selectedPost.id, commentPage);
      await loadPosts();
    } catch (error) {
      setErrorMessage(error.message || '댓글 삭제에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function refreshAfterPostAction(postId) {
    if (selectedPost?.id === postId) {
      await loadPostDetail(postId, commentPage);
    }

    if (activeTab === 'bookmarks') {
      await loadBookmarks();
    } else {
      await loadPosts();
    }
  }

  async function toggleReaction(post, type) {
    setBusy(true);
    resetMessages();

    try {
      if (post.myReaction === type) {
        await deleteCommunityReaction(token, post.id);
        setSuccessMessage('반응을 취소했습니다.');
      } else {
        await createCommunityReaction(token, post.id, type);
        setSuccessMessage(type === 'LIKE' ? '좋아요를 반영했습니다.' : '싫어요를 반영했습니다.');
      }

      await refreshAfterPostAction(post.id);
    } catch (error) {
      setErrorMessage(error.message || '반응 처리에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function toggleBookmark(post) {
    setBusy(true);
    resetMessages();

    try {
      if (post.isBookmarked) {
        await deleteCommunityBookmark(token, post.id);
        setSuccessMessage('북마크를 해제했습니다.');
      } else {
        await createCommunityBookmark(token, post.id);
        setSuccessMessage('북마크에 추가했습니다.');
      }

      await refreshAfterPostAction(post.id);
    } catch (error) {
      setErrorMessage(error.message || '북마크 처리에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  function openReport(type, item) {
    resetMessages();
    setReportTarget({
      type,
      id: item.id,
      label: type === 'post' ? item.title : item.content
    });
    setReportReason('');
  }

  async function submitReport() {
    const reason = reportReason.trim();

    if (!reportTarget || !reason) {
      setErrorMessage('신고 사유를 입력해 주세요.');
      return;
    }

    if (reason.length > 500) {
      setErrorMessage('신고 사유는 500자 이하로 입력해 주세요.');
      return;
    }

    setBusy(true);
    resetMessages();

    try {
      if (reportTarget.type === 'post') {
        await reportCommunityPost(token, reportTarget.id, reason);
      } else {
        await reportCommunityComment(token, reportTarget.id, reason);
      }

      setReportTarget(null);
      setReportReason('');
      setSuccessMessage('신고가 접수되었습니다.');
    } catch (error) {
      setErrorMessage(error.message || '신고 처리에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  function openDetail(post) {
    resetMessages();
    setPostFormMode(null);
    setCommentContent('');
    setEditingComment(null);
    setCommentPage(1);
    loadPostDetail(post.id, 1);
  }

  function changeCommentPage(nextPage) {
    if (!selectedPost) {
      return;
    }

    setCommentPage(nextPage);
    loadPostDetail(selectedPost.id, nextPage);
  }

  function switchTab(nextTab) {
    setActiveTab(nextTab);
    setSelectedPost(null);
    setPostFormMode(null);
    setErrorMessage('');
    setSuccessMessage('');
  }

  const currentPageInfo = activeTab === 'posts' ? pagination : bookmarkPagination;
  const currentPage = activeTab === 'posts' ? page : bookmarkPage;
  const setCurrentPage = activeTab === 'posts' ? setPage : setBookmarkPage;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>커뮤니티</Text>
          <Text style={styles.subtitle}>질문, 자유 글, 학습 인증을 한곳에서 확인합니다.</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => onNavigate('dashboard')} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>대시보드</Text>
          </Pressable>
          <Pressable onPress={openCreateForm} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>글쓰기</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          onPress={() => switchTab('posts')}
          style={[styles.tabButton, activeTab === 'posts' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabButtonText, activeTab === 'posts' && styles.tabButtonTextActive]}>
            게시글
          </Text>
        </Pressable>
        <Pressable
          onPress={() => switchTab('bookmarks')}
          style={[styles.tabButton, activeTab === 'bookmarks' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabButtonText, activeTab === 'bookmarks' && styles.tabButtonTextActive]}>
            내 북마크
          </Text>
        </Pressable>
      </View>

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}
      {successMessage ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      ) : null}

      {postFormMode ? renderPostForm() : null}
      {reportTarget ? renderReportPanel() : null}

      {activeTab === 'posts' ? renderPostFilters() : renderBookmarkFilters()}

      <View style={styles.layout}>
        <View style={styles.listPane}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#2563EB" />
              <Text style={styles.mutedText}>목록을 불러오는 중입니다.</Text>
            </View>
          ) : activeTab === 'posts' ? renderPostList() : renderBookmarkList()}
          {renderPagination(currentPageInfo, currentPage, setCurrentPage)}
        </View>

        <View style={styles.detailPane}>
          {detailLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#2563EB" />
              <Text style={styles.mutedText}>상세 정보를 불러오는 중입니다.</Text>
            </View>
          ) : selectedPost ? (
            renderPostDetail()
          ) : (
            <View style={styles.emptyDetail}>
              <Text style={styles.emptyTitle}>게시글을 선택해 주세요.</Text>
              <Text style={styles.emptyText}>목록에서 게시글을 열면 상세, 댓글, 반응, 신고 기능을 사용할 수 있습니다.</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );

  function renderPostFilters() {
    return (
      <View style={styles.filterPanel}>
        <View style={styles.searchRow}>
          <TextInput
            onChangeText={setSearchDraft}
            onSubmitEditing={handleSearchSubmit}
            placeholder="제목 또는 내용 검색"
            returnKeyType="search"
            style={styles.searchInput}
            value={searchDraft}
          />
          <Pressable onPress={handleSearchSubmit} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>검색</Text>
          </Pressable>
        </View>
        <View style={styles.optionRow}>
          {CATEGORY_FILTERS.map((item) => (
            <Pressable
              key={item.value}
              onPress={() => {
                setCategory(item.value);
                setPage(1);
                setSelectedPost(null);
              }}
              style={[styles.chip, category === item.value && styles.chipActive]}
            >
              <Text style={[styles.chipText, category === item.value && styles.chipTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.optionRow}>
          {SORT_OPTIONS.map((item) => (
            <Pressable
              key={item.value}
              onPress={() => {
                setSort(item.value);
                setPage(1);
              }}
              style={[styles.chip, sort === item.value && styles.chipActive]}
            >
              <Text style={[styles.chipText, sort === item.value && styles.chipTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  function renderBookmarkFilters() {
    return (
      <View style={styles.filterPanel}>
        <Text style={styles.sectionTitle}>내가 저장한 게시글</Text>
        <View style={styles.optionRow}>
          {SORT_OPTIONS.map((item) => (
            <Pressable
              key={item.value}
              onPress={() => {
                setBookmarkSort(item.value);
                setBookmarkPage(1);
              }}
              style={[styles.chip, bookmarkSort === item.value && styles.chipActive]}
            >
              <Text style={[styles.chipText, bookmarkSort === item.value && styles.chipTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  function renderPostForm() {
    return (
      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>{postFormMode === 'edit' ? '게시글 수정' : '게시글 작성'}</Text>
        <View style={styles.optionRow}>
          {CATEGORIES.map((item) => (
            <Pressable
              key={item.value}
              onPress={() => setPostForm((current) => ({ ...current, category: item.value }))}
              style={[styles.chip, postForm.category === item.value && styles.chipActive]}
            >
              <Text style={[styles.chipText, postForm.category === item.value && styles.chipTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          onChangeText={(title) => setPostForm((current) => ({ ...current, title }))}
          placeholder="제목"
          style={styles.input}
          value={postForm.title}
        />
        <TextInput
          multiline
          onChangeText={(content) => setPostForm((current) => ({ ...current, content }))}
          placeholder="내용"
          style={[styles.input, styles.textArea]}
          textAlignVertical="top"
          value={postForm.content}
        />
        <View style={styles.actionRow}>
          <Pressable disabled={busy} onPress={submitPostForm} style={[styles.primaryButton, busy && styles.disabled]}>
            <Text style={styles.primaryButtonText}>{postFormMode === 'edit' ? '수정 저장' : '작성 완료'}</Text>
          </Pressable>
          <Pressable disabled={busy} onPress={closePostForm} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>취소</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function renderReportPanel() {
    return (
      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>신고 사유 입력</Text>
        <Text style={styles.mutedText} numberOfLines={2}>
          대상: {reportTarget.label}
        </Text>
        <TextInput
          multiline
          onChangeText={setReportReason}
          placeholder="신고 사유를 입력해 주세요. 500자까지 입력할 수 있습니다."
          style={[styles.input, styles.reportArea]}
          textAlignVertical="top"
          value={reportReason}
        />
        <Text style={styles.counterText}>{reportReason.trim().length}/500</Text>
        <View style={styles.actionRow}>
          <Pressable disabled={busy} onPress={submitReport} style={[styles.dangerButton, busy && styles.disabled]}>
            <Text style={styles.dangerButtonText}>신고 접수</Text>
          </Pressable>
          <Pressable disabled={busy} onPress={() => setReportTarget(null)} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>취소</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function renderPostList() {
    if (posts.length === 0) {
      return (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>게시글이 없습니다.</Text>
          <Text style={styles.emptyText}>검색 조건을 바꾸거나 첫 게시글을 작성해 보세요.</Text>
        </View>
      );
    }

    return posts.map((post) => renderPostCard(post));
  }

  function renderBookmarkList() {
    if (bookmarks.length === 0) {
      return (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>북마크한 게시글이 없습니다.</Text>
          <Text style={styles.emptyText}>관심 있는 게시글에서 북마크를 눌러 저장할 수 있습니다.</Text>
        </View>
      );
    }

    return bookmarks.map((bookmark) => (
      <View key={bookmark.bookmarkId} style={styles.bookmarkItem}>
        <Text style={styles.bookmarkDate}>북마크: {formatDate(bookmark.bookmarkedAt)}</Text>
        {renderPostCard(bookmark.post)}
      </View>
    ));
  }

  function renderPostCard(post) {
    return (
      <View key={post.id} style={[styles.card, selectedPost?.id === post.id && styles.cardActive]}>
        <View style={styles.cardHeader}>
          <Text style={styles.categoryBadge}>{getCategoryLabel(post.category)}</Text>
          <Text style={styles.dateText}>{formatDate(post.createdAt)}</Text>
        </View>
        <Text style={styles.cardTitle}>{post.title}</Text>
        <Text style={styles.cardContent}>{getPreview(post.content)}</Text>
        <Text style={styles.authorText}>작성자: {post.author?.name || '알 수 없음'}</Text>
        {renderEngagement(post)}
        <View style={styles.cardActions}>
          <Pressable onPress={() => openDetail(post)} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>상세</Text>
          </Pressable>
          <Pressable
            disabled={busy}
            onPress={() => toggleReaction(post, 'LIKE')}
            style={[styles.smallButton, post.myReaction === 'LIKE' && styles.smallButtonActive]}
          >
            <Text style={[styles.smallButtonText, post.myReaction === 'LIKE' && styles.smallButtonTextActive]}>
              좋아요
            </Text>
          </Pressable>
          <Pressable
            disabled={busy}
            onPress={() => toggleReaction(post, 'DISLIKE')}
            style={[styles.smallButton, post.myReaction === 'DISLIKE' && styles.smallButtonActive]}
          >
            <Text style={[styles.smallButtonText, post.myReaction === 'DISLIKE' && styles.smallButtonTextActive]}>
              싫어요
            </Text>
          </Pressable>
          <Pressable
            disabled={busy}
            onPress={() => toggleBookmark(post)}
            style={[styles.smallButton, post.isBookmarked && styles.bookmarkButtonActive]}
          >
            <Text style={[styles.smallButtonText, post.isBookmarked && styles.bookmarkButtonTextActive]}>
              {post.isBookmarked ? '북마크됨' : '북마크'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function renderEngagement(post) {
    return (
      <View style={styles.metricRow}>
        <Text style={styles.metricText}>댓글 {post.commentCount ?? 0}</Text>
        <Text style={styles.metricText}>좋아요 {post.likeCount ?? 0}</Text>
        <Text style={styles.metricText}>싫어요 {post.dislikeCount ?? 0}</Text>
        <Text style={styles.metricText}>북마크 {post.bookmarkCount ?? 0}</Text>
      </View>
    );
  }

  function renderPostDetail() {
    const ownPost = isOwnContent(selectedPost, user);

    return (
      <View style={styles.detailCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.categoryBadge}>{getCategoryLabel(selectedPost.category)}</Text>
          <Text style={styles.dateText}>{formatDate(selectedPost.createdAt)}</Text>
        </View>
        <Text style={styles.detailTitle}>{selectedPost.title}</Text>
        <Text style={styles.authorText}>작성자: {selectedPost.author?.name || '알 수 없음'}</Text>
        <Text style={styles.detailContent}>{selectedPost.content}</Text>
        {renderEngagement(selectedPost)}
        <View style={styles.cardActions}>
          <Pressable
            disabled={busy}
            onPress={() => toggleReaction(selectedPost, 'LIKE')}
            style={[styles.smallButton, selectedPost.myReaction === 'LIKE' && styles.smallButtonActive]}
          >
            <Text style={[styles.smallButtonText, selectedPost.myReaction === 'LIKE' && styles.smallButtonTextActive]}>
              좋아요
            </Text>
          </Pressable>
          <Pressable
            disabled={busy}
            onPress={() => toggleReaction(selectedPost, 'DISLIKE')}
            style={[styles.smallButton, selectedPost.myReaction === 'DISLIKE' && styles.smallButtonActive]}
          >
            <Text style={[styles.smallButtonText, selectedPost.myReaction === 'DISLIKE' && styles.smallButtonTextActive]}>
              싫어요
            </Text>
          </Pressable>
          <Pressable
            disabled={busy}
            onPress={() => toggleBookmark(selectedPost)}
            style={[styles.smallButton, selectedPost.isBookmarked && styles.bookmarkButtonActive]}
          >
            <Text style={[styles.smallButtonText, selectedPost.isBookmarked && styles.bookmarkButtonTextActive]}>
              {selectedPost.isBookmarked ? '북마크 해제' : '북마크'}
            </Text>
          </Pressable>
          <Pressable onPress={() => openReport('post', selectedPost)} style={styles.warningButton}>
            <Text style={styles.warningButtonText}>게시글 신고</Text>
          </Pressable>
        </View>
        {ownPost ? (
          <View style={styles.ownerActions}>
            <Pressable onPress={() => openEditPostForm(selectedPost)} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>게시글 수정</Text>
            </Pressable>
            <Pressable onPress={() => confirmDeletePost(selectedPost)} style={styles.dangerButton}>
              <Text style={styles.dangerButtonText}>게시글 삭제</Text>
            </Pressable>
          </View>
        ) : null}

        {renderCommentSection()}
      </View>
    );
  }

  function renderCommentSection() {
    return (
      <View style={styles.commentSection}>
        <Text style={styles.sectionTitle}>댓글</Text>
        <View style={styles.commentForm}>
          <TextInput
            multiline
            onChangeText={setCommentContent}
            placeholder="댓글을 입력해 주세요."
            style={[styles.input, styles.commentInput]}
            textAlignVertical="top"
            value={commentContent}
          />
          <Pressable disabled={busy} onPress={submitComment} style={[styles.primaryButton, busy && styles.disabled]}>
            <Text style={styles.primaryButtonText}>댓글 작성</Text>
          </Pressable>
        </View>
        {comments.length === 0 ? (
          <Text style={styles.emptyText}>아직 댓글이 없습니다.</Text>
        ) : (
          comments.map((comment) => renderComment(comment))
        )}
        {renderPagination(commentPagination, commentPage, changeCommentPage)}
      </View>
    );
  }

  function renderComment(comment) {
    const ownComment = isOwnContent(comment, user);
    const isEditing = editingComment?.id === comment.id;

    return (
      <View key={comment.id} style={styles.commentCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.authorText}>{comment.author?.name || '알 수 없음'}</Text>
          <Text style={styles.dateText}>{formatDate(comment.createdAt)}</Text>
        </View>
        {isEditing ? (
          <View style={styles.editCommentBox}>
            <TextInput
              multiline
              onChangeText={setEditingCommentContent}
              style={[styles.input, styles.commentInput]}
              textAlignVertical="top"
              value={editingCommentContent}
            />
            <View style={styles.actionRow}>
              <Pressable disabled={busy} onPress={submitCommentEdit} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>저장</Text>
              </Pressable>
              <Pressable onPress={() => setEditingComment(null)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>취소</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Text style={styles.commentText}>{comment.content}</Text>
        )}
        {!isEditing ? (
          <View style={styles.cardActions}>
            <Pressable onPress={() => openReport('comment', comment)} style={styles.warningButton}>
              <Text style={styles.warningButtonText}>댓글 신고</Text>
            </Pressable>
            {ownComment ? (
              <>
                <Pressable onPress={() => startEditComment(comment)} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>수정</Text>
                </Pressable>
                <Pressable onPress={() => confirmDeleteComment(comment)} style={styles.dangerButton}>
                  <Text style={styles.dangerButtonText}>삭제</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }

  function renderPagination(pageInfo, value, onChange) {
    const totalPages = Math.max(pageInfo.totalPages || 1, 1);

    return (
      <View style={styles.paginationRow}>
        <Pressable
          disabled={value <= 1 || loading || detailLoading}
          onPress={() => onChange(value - 1)}
          style={[styles.secondaryButton, (value <= 1 || loading || detailLoading) && styles.disabled]}
        >
          <Text style={styles.secondaryButtonText}>이전</Text>
        </Pressable>
        <Text style={styles.pageText}>
          {value} / {totalPages}
        </Text>
        <Pressable
          disabled={value >= totalPages || loading || detailLoading}
          onPress={() => onChange(value + 1)}
          style={[styles.secondaryButton, (value >= totalPages || loading || detailLoading) && styles.disabled]}
        >
          <Text style={styles.secondaryButtonText}>다음</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA'
  },
  contentContainer: {
    padding: 20,
    gap: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap'
  },
  headerText: {
    flex: 1,
    minWidth: 220,
    gap: 4
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    flexWrap: 'wrap'
  },
  title: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '800'
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 15
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap'
  },
  tabButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  tabButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB'
  },
  tabButtonText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700'
  },
  tabButtonTextActive: {
    color: '#FFFFFF'
  },
  filterPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 10
  },
  panel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 10
  },
  layout: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    flexWrap: 'wrap'
  },
  listPane: {
    flex: 1,
    minWidth: 300,
    gap: 10
  },
  detailPane: {
    flex: 1.2,
    minWidth: 320
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap'
  },
  searchInput: {
    flex: 1,
    minWidth: 220,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap'
  },
  chip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  chipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB'
  },
  chipText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700'
  },
  chipTextActive: {
    color: '#1D4ED8'
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
    fontSize: 14
  },
  textArea: {
    minHeight: 140
  },
  reportArea: {
    minHeight: 96
  },
  commentInput: {
    minHeight: 76
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '800'
  },
  card: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 8
  },
  cardActive: {
    borderColor: '#2563EB',
    backgroundColor: '#F8FBFF'
  },
  detailCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 12
  },
  bookmarkItem: {
    gap: 6
  },
  bookmarkDate: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap'
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
    color: '#4338CA',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  dateText: {
    color: '#94A3B8',
    fontSize: 12
  },
  cardTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '800'
  },
  detailTitle: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '800'
  },
  cardContent: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20
  },
  detailContent: {
    color: '#1F2937',
    fontSize: 15,
    lineHeight: 24
  },
  authorText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600'
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  metricText: {
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  ownerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  primaryButton: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  secondaryButton: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  secondaryButtonText: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '700'
  },
  smallButton: {
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  smallButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB'
  },
  smallButtonText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800'
  },
  smallButtonTextActive: {
    color: '#FFFFFF'
  },
  bookmarkButtonActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B'
  },
  bookmarkButtonTextActive: {
    color: '#92400E'
  },
  warningButton: {
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  warningButtonText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '800'
  },
  dangerButton: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  dangerButtonText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '800'
  },
  commentSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 14,
    gap: 10
  },
  commentForm: {
    gap: 8
  },
  commentCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    padding: 12,
    gap: 8
  },
  commentText: {
    color: '#1F2937',
    fontSize: 14,
    lineHeight: 21
  },
  editCommentBox: {
    gap: 8
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 8
  },
  pageText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '800'
  },
  loadingBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 10
  },
  emptyBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    padding: 18,
    gap: 6
  },
  emptyDetail: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    padding: 24,
    gap: 8
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800'
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20
  },
  mutedText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20
  },
  counterText: {
    alignSelf: 'flex-end',
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700'
  },
  errorBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    padding: 12
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '700'
  },
  successBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
    padding: 12
  },
  successText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '700'
  },
  disabled: {
    opacity: 0.55
  }
});
