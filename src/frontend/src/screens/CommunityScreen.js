import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import AccessibleTextInput from '../components/AccessibleTextInput';
import {
  createCommunityBookmark,
  createCommunityComment,
  createCommunityCommentReaction,
  createCommunityPost,
  createCommunityReaction,
  deleteCommunityBookmark,
  deleteCommunityComment,
  deleteCommunityCommentReaction,
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
import ConfirmModal from '../components/ConfirmModal';
import { ProfileAvatar, ProfileTitleChip } from '../components/ProfileAppearance';
import { PanelSkeleton, SkeletonBlock } from '../components/Skeleton';
import { languageIntlLocale, useLanguage } from '../i18n';
import { colors, interactions, interactiveStateStyles, shadows } from '../styles/theme';

const CATEGORIES = [
  { value: 'QUESTION', labelKey: '질문' },
  { value: 'FREE', labelKey: '자유' },
  { value: 'STUDY_PROOF', labelKey: '학습 인증' }
];

const CATEGORY_FILTERS = [{ value: 'ALL', labelKey: '전체' }, ...CATEGORIES];
const SORT_OPTIONS = [
  { value: 'latest', labelKey: '최신순' },
  { value: 'likes', labelKey: '좋아요순' },
  { value: 'views', labelKey: '조회수순' },
  { value: 'comments', labelKey: '댓글순' },
  { value: 'oldest', labelKey: '오래된순' }
];

const PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50];
const VIEW_MODE_STORAGE_KEY = 'sagaksagak.community.viewMode';
const RECENT_SEARCHES_STORAGE_KEY = 'sagaksagak.community.recentSearches';

function readStorageValue(key, fallback) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }

  try {
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function readStorageList(key) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const value = JSON.parse(window.localStorage.getItem(key) || '[]');

    return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function writeStorageList(key, value) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local storage is best-effort for recent searches.
  }
}

function writeStorageValue(key, value) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Local storage is best-effort for view preferences.
  }
}

function getCategoryLabel(category, translateText) {
  const categoryItem = CATEGORIES.find((item) => item.value === category);

  return categoryItem ? translateText(categoryItem.labelKey) : category;
}

function formatDate(value, language = 'ko') {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString(languageIntlLocale(language), {
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

export default function CommunityScreen({ onNavigate, realtimeEvent, token, user }) {
  const { currentLanguage, translateText } = useLanguage();
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
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [category, setCategory] = useState('ALL');
  const [sort, setSort] = useState('latest');
  const [bookmarkSort, setBookmarkSort] = useState('latest');
  const [viewMode, setViewMode] = useState(() => {
    const savedMode = readStorageValue(VIEW_MODE_STORAGE_KEY, 'card');

    return savedMode === 'table' ? 'table' : 'card';
  });
  const [recentSearches, setRecentSearches] = useState(() =>
    readStorageList(RECENT_SEARCHES_STORAGE_KEY)
  );
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
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [postFormMode, setPostFormMode] = useState(null);
  const [sharedPostOpened, setSharedPostOpened] = useState(false);
  const [postForm, setPostForm] = useState({
    category: 'QUESTION',
    title: '',
    content: ''
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [realtimeNotification, setRealtimeNotification] = useState(null);

  useEffect(() => {
    if (activeTab === 'posts') {
      loadPosts();
      return;
    }

    loadBookmarks();
  }, [activeTab, page, bookmarkPage, pageSize, category, sort, bookmarkSort, search]);

  useEffect(() => {
    if (sharedPostOpened || !token || typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search || '');
    const sharedPostId = params.get('postId');
    const requestedScreen = params.get('screen');

    if (!sharedPostId || (requestedScreen && requestedScreen !== 'community')) {
      return;
    }

    setSharedPostOpened(true);
    setActiveTab('posts');
    setCommentPage(1);
    loadPostDetail(sharedPostId, 1);
  }, [sharedPostOpened, token]);

  useEffect(() => {
    if (
      !realtimeEvent ||
      !['community.comment.created', 'community.reply.created'].includes(realtimeEvent.type)
    ) {
      return;
    }

    const comment = realtimeEvent.payload?.comment;

    if (!comment?.postId || !comment.commentId) {
      return;
    }

    if (Number(comment.author?.id) === Number(user?.id)) {
      return;
    }

    const isCurrentPost = Number(selectedPost?.id) === Number(comment.postId);
    const isReply = realtimeEvent.type === 'community.reply.created' || Boolean(comment.parentId);

    setRealtimeNotification({
      id: `${realtimeEvent.type}-${comment.commentId}-${realtimeEvent.sentAt || ''}`,
      postId: comment.postId,
      scope: isCurrentPost ? 'detail' : 'list',
      message: isCurrentPost
        ? isReply
          ? translateText('새 대답글이 도착했습니다.')
          : translateText('새 댓글이 도착했습니다.')
        : translateText('커뮤니티에 새 댓글 활동이 있습니다.'),
      action: isCurrentPost ? translateText('댓글 새로고침') : translateText('목록 갱신')
    });
  }, [realtimeEvent, selectedPost?.id, translateText, user?.id]);

  async function loadPosts() {
    setLoading(true);
    setErrorMessage('');

    try {
      const result = await getCommunityPosts(token, {
        page,
        pageSize,
        category: category === 'ALL' ? undefined : category,
        search,
        sort
      });

      setPosts(result.posts || []);
      setPagination(result.pagination || { page, pageSize, total: 0, totalPages: 1 });
    } catch (error) {
      setErrorMessage(error.message || translateText('게시글 목록을 불러오지 못했습니다.'));
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
      setErrorMessage(error.message || translateText('북마크 목록을 불러오지 못했습니다.'));
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
      setErrorMessage(error.message || translateText('게시글 상세를 불러오지 못했습니다.'));
    } finally {
      setDetailLoading(false);
    }
  }

  function updatePostState(postId, updater) {
    const normalizedPostId = Number(postId);
    const updatePost = (post) => {
      if (Number(post?.id) !== normalizedPostId) {
        return post;
      }

      return updater(post);
    };

    setPosts((currentPosts) => currentPosts.map(updatePost));
    setBookmarks((currentBookmarks) =>
      currentBookmarks.map((bookmark) => ({
        ...bookmark,
        post: updatePost(bookmark.post)
      }))
    );
    setSelectedPost((currentPost) => updatePost(currentPost));
  }

  function getReactionAdjustedPost(post, nextReaction) {
    const currentReaction = post.myReaction;
    let likeDelta = 0;
    let dislikeDelta = 0;

    if (currentReaction === 'LIKE') {
      likeDelta -= 1;
    }

    if (currentReaction === 'DISLIKE') {
      dislikeDelta -= 1;
    }

    if (nextReaction === 'LIKE') {
      likeDelta += 1;
    }

    if (nextReaction === 'DISLIKE') {
      dislikeDelta += 1;
    }

    return {
      ...post,
      myReaction: nextReaction,
      likeCount: Math.max(0, (post.likeCount || 0) + likeDelta),
      dislikeCount: Math.max(0, (post.dislikeCount || 0) + dislikeDelta)
    };
  }

  async function refreshVisiblePostLists() {
    if (activeTab === 'bookmarks') {
      await loadBookmarks();
      return;
    }

    await loadPosts();
  }

  function resetMessages() {
    setErrorMessage('');
    setSuccessMessage('');
  }

  async function refreshRealtimeNotification() {
    if (!realtimeNotification) {
      return;
    }

    if (realtimeNotification.scope === 'detail' && selectedPost?.id) {
      await loadPostDetail(selectedPost.id, commentPage);
    } else if (activeTab === 'bookmarks') {
      await loadBookmarks();
    } else {
      await loadPosts();
    }

    setRealtimeNotification(null);
  }

  function handleSearchSubmit() {
    const keyword = searchDraft.trim();

    setSearch(keyword);
    if (keyword) {
      const nextSearches = [keyword, ...recentSearches.filter((item) => item !== keyword)].slice(0, 6);

      setRecentSearches(nextSearches);
      writeStorageList(RECENT_SEARCHES_STORAGE_KEY, nextSearches);
    }
    setPage(1);
    setSelectedPost(null);
    setPostFormMode(null);
  }

  function applyRecentSearch(keyword) {
    setSearchDraft(keyword);
    setSearch(keyword);
    setPage(1);
    setSelectedPost(null);
    setPostFormMode(null);
  }

  function clearRecentSearches() {
    setRecentSearches([]);
    writeStorageList(RECENT_SEARCHES_STORAGE_KEY, []);
  }

  function changeViewMode(nextMode) {
    setViewMode(nextMode);
    writeStorageValue(VIEW_MODE_STORAGE_KEY, nextMode);
  }

  function changePageSize(nextPageSize) {
    setPageSize(nextPageSize);
    setPage(1);
    setSelectedPost(null);
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
      setErrorMessage(translateText('제목과 내용을 입력해 주세요.'));
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

        setSuccessMessage(translateText('게시글을 수정했습니다.'));
        setPostFormMode(null);
        await loadPostDetail(result.post.id, commentPage);
      } else {
        const result = await createCommunityPost(token, {
          category: postForm.category,
          title,
          content
        });

        setSuccessMessage(translateText('게시글을 작성했습니다.'));
        setPostFormMode(null);
        setActiveTab('posts');
        setPage(1);
        await loadPostDetail(result.post.id, 1);
        await loadPosts();
      }
    } catch (error) {
      setErrorMessage(error.message || translateText('게시글 저장에 실패했습니다.'));
    } finally {
      setBusy(false);
    }
  }

  function confirmDeletePost(post) {
    resetMessages();
    setDeleteTarget({
      type: 'post',
      id: post.id,
      title: post.title
    });
  }

  async function deletePost(post) {
    setBusy(true);
    resetMessages();

    try {
      await deleteCommunityPost(token, post.id);
      setSuccessMessage(translateText('게시글을 삭제했습니다.'));
      setDeleteTarget(null);
      setSelectedPost(null);
      setPostFormMode(null);
      await loadPosts();
      if (activeTab === 'bookmarks') {
        await loadBookmarks();
      }
    } catch (error) {
      setErrorMessage(error.message || translateText('게시글 삭제에 실패했습니다.'));
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
      setErrorMessage(translateText('댓글 내용을 입력해 주세요.'));
      return;
    }

    setBusy(true);
    resetMessages();

    try {
      await createCommunityComment(token, selectedPost.id, { content });
      setCommentContent('');
      setCommentPage(1);
      setSuccessMessage(translateText('댓글을 작성했습니다.'));
      await loadPostDetail(selectedPost.id, 1);
      await loadPosts();
    } catch (error) {
      setErrorMessage(error.message || translateText('댓글 작성에 실패했습니다.'));
    } finally {
      setBusy(false);
    }
  }

  async function submitReply(parentComment) {
    if (!selectedPost || !parentComment) {
      return;
    }

    const content = replyContent.trim();

    if (!content) {
      setErrorMessage(translateText('대답글 내용을 입력해 주세요.'));
      return;
    }

    setBusy(true);
    resetMessages();

    try {
      await createCommunityComment(token, selectedPost.id, {
        parentId: parentComment.id,
        content
      });
      setReplyTarget(null);
      setReplyContent('');
      setSuccessMessage(translateText('대답글을 작성했습니다.'));
      await loadPostDetail(selectedPost.id, commentPage);
      await loadPosts();
    } catch (error) {
      setErrorMessage(error.message || translateText('대답글 작성에 실패했습니다.'));
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
      setErrorMessage(translateText('댓글 내용을 입력해 주세요.'));
      return;
    }

    setBusy(true);
    resetMessages();

    try {
      await updateCommunityComment(token, editingComment.id, { content });
      setEditingComment(null);
      setEditingCommentContent('');
      setSuccessMessage(translateText('댓글을 수정했습니다.'));
      await loadPostDetail(selectedPost.id, commentPage);
    } catch (error) {
      setErrorMessage(error.message || translateText('댓글 수정에 실패했습니다.'));
    } finally {
      setBusy(false);
    }
  }

  function confirmDeleteComment(comment) {
    resetMessages();
    setDeleteTarget({
      type: 'comment',
      id: comment.id,
      title: comment.content
    });
  }

  async function deleteComment(comment) {
    setBusy(true);
    resetMessages();

    try {
      await deleteCommunityComment(token, comment.id);
      setSuccessMessage(translateText('댓글을 삭제했습니다.'));
      setDeleteTarget(null);
      await loadPostDetail(selectedPost.id, commentPage);
      await loadPosts();
    } catch (error) {
      setErrorMessage(error.message || translateText('댓글 삭제에 실패했습니다.'));
    } finally {
      setBusy(false);
    }
  }

  async function submitDeleteTarget() {
    if (!deleteTarget) {
      return;
    }

    if (deleteTarget.type === 'post') {
      await deletePost(deleteTarget);
      return;
    }

    await deleteComment(deleteTarget);
  }

  async function toggleReaction(post, type) {
    setBusy(true);
    resetMessages();

    try {
      const nextReaction = post.myReaction === type ? null : type;

      if (post.myReaction === type) {
        await deleteCommunityReaction(token, post.id);
        setSuccessMessage(translateText('반응을 취소했습니다.'));
      } else {
        await createCommunityReaction(token, post.id, type);
        setSuccessMessage(
          type === 'LIKE' ? translateText('좋아요를 반영했습니다.') : translateText('싫어요를 반영했습니다.')
        );
      }

      updatePostState(post.id, (currentPost) => getReactionAdjustedPost(currentPost, nextReaction));
      await refreshVisiblePostLists();
    } catch (error) {
      setErrorMessage(error.message || translateText('반응 처리에 실패했습니다.'));
    } finally {
      setBusy(false);
    }
  }

  async function toggleCommentReaction(comment, type) {
    setBusy(true);
    resetMessages();

    try {
      if (comment.myReaction === type) {
        await deleteCommunityCommentReaction(token, comment.id);
        setSuccessMessage(translateText('댓글 반응을 취소했습니다.'));
      } else {
        await createCommunityCommentReaction(token, comment.id, type);
        setSuccessMessage(
          type === 'LIKE'
            ? translateText('댓글에 좋아요를 남겼습니다.')
            : translateText('댓글에 싫어요를 남겼습니다.')
        );
      }

      await loadPostDetail(selectedPost.id, commentPage);
    } catch (error) {
      setErrorMessage(error.message || translateText('댓글 반응 처리에 실패했습니다.'));
    } finally {
      setBusy(false);
    }
  }

  async function copyPostLink(post) {
    if (!post) {
      return;
    }

    resetMessages();

    const link =
      typeof window !== 'undefined' && window.location
        ? `${window.location.origin}/community?screen=community&postId=${post.id}`
        : `community?screen=community&postId=${post.id}`;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = link;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand('copy');
        document.body.removeChild(textarea);

        if (!copied) {
          throw new Error('clipboard-copy-failed');
        }
      } else {
        throw new Error('clipboard-unavailable');
      }

      setSuccessMessage(translateText('게시글 링크를 복사했습니다.'));
    } catch (error) {
      setErrorMessage(translateText('클립보드 복사에 실패했습니다. 브라우저 권한을 확인해 주세요.'));
    }
  }

  async function toggleBookmark(post) {
    setBusy(true);
    resetMessages();

    try {
      const nextBookmarked = !post.isBookmarked;

      if (post.isBookmarked) {
        await deleteCommunityBookmark(token, post.id);
        setSuccessMessage(translateText('북마크를 해제했습니다.'));
      } else {
        await createCommunityBookmark(token, post.id);
        setSuccessMessage(translateText('북마크에 추가했습니다.'));
      }

      updatePostState(post.id, (currentPost) => ({
        ...currentPost,
        isBookmarked: nextBookmarked,
        bookmarkCount: Math.max(0, (currentPost.bookmarkCount || 0) + (nextBookmarked ? 1 : -1))
      }));

      if (activeTab === 'bookmarks' && !nextBookmarked) {
        setBookmarks((currentBookmarks) =>
          currentBookmarks.filter((bookmark) => Number(bookmark.post?.id) !== Number(post.id))
        );
        setSelectedPost((currentPost) => (Number(currentPost?.id) === Number(post.id) ? null : currentPost));
        await loadBookmarks();
      } else {
        await refreshVisiblePostLists();
      }
    } catch (error) {
      setErrorMessage(error.message || translateText('북마크 처리에 실패했습니다.'));
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
      setErrorMessage(translateText('신고 사유를 입력해 주세요.'));
      return;
    }

    if (reason.length > 500) {
      setErrorMessage(translateText('신고 사유는 500자 이하로 입력해 주세요.'));
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
      setSuccessMessage(translateText('신고가 접수되었습니다.'));
    } catch (error) {
      const message = error.message || '';
      setErrorMessage(
        message.includes('409') || message.includes('이미') || message.includes('duplicate')
          ? translateText('이미 신고한 대상입니다. 관리자 검토를 기다려 주세요.')
          : message || translateText('신고 처리에 실패했습니다.')
      );
    } finally {
      setBusy(false);
    }
  }

  function openDetail(post) {
    resetMessages();
    setDeleteTarget(null);
    setReportTarget(null);
    setPostFormMode(null);
    setCommentContent('');
    setReplyTarget(null);
    setReplyContent('');
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
    setDeleteTarget(null);
    setReportTarget(null);
    setErrorMessage('');
    setSuccessMessage('');
  }

  const currentPageInfo = activeTab === 'posts' ? pagination : bookmarkPagination;
  const currentPage = activeTab === 'posts' ? page : bookmarkPage;
  const setCurrentPage = activeTab === 'posts' ? setPage : setBookmarkPage;
  const visibleCount = activeTab === 'posts' ? posts.length : bookmarks.length;
  const totalCount = currentPageInfo.total || 0;
  const boardLabel = activeTab === 'posts' ? translateText('게시글') : translateText('북마크');
  const detailLabel = selectedPost ? selectedPost.title : translateText('상세 대기');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{translateText('커뮤니티')}</Text>
          <Text style={styles.subtitle}>{translateText('질문, 자유 글, 학습 인증을 한곳에서 확인합니다.')}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => onNavigate('dashboard')}
            style={(state) => [styles.secondaryButton, ...interactiveStateStyles(state)]}
          >
            <Text style={styles.secondaryButtonText}>{translateText('대시보드')}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={openCreateForm}
            style={(state) => [styles.primaryButton, ...interactiveStateStyles(state)]}
          >
            <Text style={styles.primaryButtonText}>{translateText('글쓰기')}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'posts' }}
          onPress={() => switchTab('posts')}
          style={(state) => [
            styles.tabButton,
            activeTab === 'posts' && styles.tabButtonActive,
            ...interactiveStateStyles(state)
          ]}
        >
          <Text style={[styles.tabButtonText, activeTab === 'posts' && styles.tabButtonTextActive]}>
            {translateText('게시글')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'bookmarks' }}
          onPress={() => switchTab('bookmarks')}
          style={(state) => [
            styles.tabButton,
            activeTab === 'bookmarks' && styles.tabButtonActive,
            ...interactiveStateStyles(state)
          ]}
        >
          <Text style={[styles.tabButtonText, activeTab === 'bookmarks' && styles.tabButtonTextActive]}>
            {translateText('내 북마크')}
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
      {realtimeNotification ? (
        <View style={styles.realtimeBox}>
          <Text style={styles.realtimeText}>
            {realtimeNotification.message}
          </Text>
          <View style={styles.realtimeActions}>
            <Pressable
              accessibilityRole="button"
              onPress={refreshRealtimeNotification}
              style={(state) => [styles.smallButton, ...interactiveStateStyles(state)]}
            >
              <Text style={styles.smallButtonText}>
                {realtimeNotification.action}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setRealtimeNotification(null)}
              style={(state) => [styles.textButton, ...interactiveStateStyles(state)]}
            >
              <Text style={styles.textButtonLabel}>{translateText('닫기')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {postFormMode ? renderPostForm() : null}
      {renderDeleteModal()}
      {renderReportModal()}

      <View style={styles.boardStatusBar}>
        <Text style={styles.boardStatusText}>
          <Text style={styles.boardStatusStrong}>{boardLabel}</Text> {visibleCount} {translateText('개 표시')}
        </Text>
        <Text style={styles.boardStatusDivider}>/</Text>
        <Text style={styles.boardStatusText}>{translateText('전체')} {totalCount}{translateText('개')}</Text>
        <Text style={styles.boardStatusDivider}>/</Text>
        <Text style={styles.boardStatusText}>
          {currentPage} / {Math.max(currentPageInfo.totalPages || 1, 1)} {translateText('페이지')}
        </Text>
        <Text style={styles.boardStatusDivider}>/</Text>
        <Text style={styles.boardStatusText} numberOfLines={1}>
          {translateText('선택:')} {detailLabel}
        </Text>
      </View>

      <View style={styles.boardLayout}>
        <View style={styles.boardMainPane}>
          {activeTab === 'posts' ? renderPostFilters() : renderBookmarkFilters()}
          {loading ? renderListSkeleton(activeTab === 'bookmarks') : activeTab === 'posts' ? renderPostList() : renderBookmarkList()}
          {renderPagination(currentPageInfo, currentPage, setCurrentPage)}
        </View>

        <View style={styles.boardDetailPane}>
          {detailLoading ? (
            renderDetailSkeleton()
          ) : selectedPost ? (
            renderPostDetail()
          ) : (
            <View style={styles.emptyDetail}>
              <Text style={styles.emptyTitle}>{translateText('게시글을 선택해 주세요.')}</Text>
              <Text style={styles.emptyText}>
                {translateText('목록에서 게시글을 열면 상세, 댓글, 반응, 신고 기능을 사용할 수 있습니다.')}
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );

  function renderListSkeleton(isBookmarkList = false) {
    return (
      <View style={styles.skeletonStack}>
        {Array.from({ length: isBookmarkList ? 2 : 3 }).map((_, index) => (
          <View key={index} style={[styles.card, styles.skeletonCard]}>
            <View style={styles.cardHeader}>
              <SkeletonBlock height={24} width={80} />
              <SkeletonBlock height={12} width={110} />
            </View>
            <SkeletonBlock height={22} width="82%" />
            <SkeletonBlock height={14} width="100%" />
            <SkeletonBlock height={14} width="70%" />
            <View style={styles.metricRow}>
              <SkeletonBlock height={24} width={64} />
              <SkeletonBlock height={24} width={70} />
              <SkeletonBlock height={24} width={76} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  function renderDetailSkeleton() {
    return (
      <View style={styles.detailCard}>
        <PanelSkeleton rows={4} />
        <View style={styles.commentSection}>
          <SkeletonBlock height={18} width={90} />
          <SkeletonBlock height={68} width="100%" />
        </View>
      </View>
    );
  }

  function renderDeleteModal() {
    const isPost = deleteTarget?.type === 'post';

    return (
      <ConfirmModal
        cancelLabel={translateText('취소')}
        confirmDisabled={busy || !deleteTarget}
        confirmLabel={isPost ? translateText('게시글 삭제') : translateText('댓글 삭제')}
        description={
          isPost
            ? translateText('삭제한 게시글은 되돌릴 수 없습니다. 댓글과 반응도 함께 정리됩니다.')
            : translateText('삭제한 댓글은 되돌릴 수 없습니다.')
        }
        destructive
        onCancel={() => setDeleteTarget(null)}
        onConfirm={submitDeleteTarget}
        title={isPost ? translateText('게시글을 삭제할까요?') : translateText('댓글을 삭제할까요?')}
        visible={Boolean(deleteTarget)}
      >
        <Text style={styles.modalTargetText} numberOfLines={2}>
          {deleteTarget?.title || ''}
        </Text>
      </ConfirmModal>
    );
  }

  function renderReportModal() {
    return (
      <ConfirmModal
        cancelLabel={translateText('취소')}
        confirmDisabled={busy || !reportReason.trim()}
        confirmLabel={translateText('신고 접수')}
        description={translateText('관리자가 확인할 수 있도록 신고 사유를 구체적으로 적어 주세요.')}
        destructive
        onCancel={() => {
          setReportTarget(null);
          setReportReason('');
        }}
        onConfirm={submitReport}
        title={reportTarget?.type === 'post' ? translateText('게시글 신고') : translateText('댓글 신고')}
        visible={Boolean(reportTarget)}
      >
        <Text style={styles.modalTargetText} numberOfLines={2}>
          {translateText('대상:')} {reportTarget?.label || ''}
        </Text>
        <AccessibleTextInput
          multiline
          onChangeText={setReportReason}
          placeholder={translateText('신고 사유를 입력해 주세요. 500자까지 입력할 수 있습니다.')}
          style={[styles.input, styles.reportArea]}
          textAlignVertical="top"
          value={reportReason}
        />
        <Text style={styles.counterText}>{reportReason.trim().length}/500</Text>
      </ConfirmModal>
    );
  }

  function renderPostFilters() {
    return (
      <View style={styles.filterPanel}>
        <View style={styles.searchRow}>
          <AccessibleTextInput
            containerStyle={styles.searchInputContainer}
            onChangeText={setSearchDraft}
            onSubmitEditing={handleSearchSubmit}
            placeholder={translateText('제목, 내용, 작성자 검색')}
            returnKeyType="search"
            style={styles.searchInput}
            value={searchDraft}
          />
          <Pressable
            accessibilityRole="button"
            onPress={handleSearchSubmit}
            style={(state) => [styles.primaryButton, ...interactiveStateStyles(state)]}
          >
            <Text style={styles.primaryButtonText}>{translateText('검색')}</Text>
          </Pressable>
        </View>
        {recentSearches.length > 0 ? (
          <View style={styles.recentSearchPanel}>
            <View style={styles.recentSearchHeader}>
              <Text style={styles.helperLabel}>{translateText('최근 검색어')}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={clearRecentSearches}
                style={(state) => [styles.textButton, ...interactiveStateStyles(state)]}
              >
                <Text style={styles.textButtonLabel}>{translateText('전체 삭제')}</Text>
              </Pressable>
            </View>
            <View style={styles.optionRow}>
              {recentSearches.map((keyword) => (
                <Pressable
                  key={keyword}
                  accessibilityRole="button"
                  onPress={() => applyRecentSearch(keyword)}
                  style={(state) => [styles.recentSearchChip, ...interactiveStateStyles(state)]}
                >
                  <Text style={styles.recentSearchText}>{keyword}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
        <View style={styles.optionRow}>
          {CATEGORY_FILTERS.map((item) => (
            <Pressable
              key={item.value}
              onPress={() => {
                setCategory(item.value);
                setPage(1);
                setSelectedPost(null);
              }}
              style={(state) => [styles.chip, category === item.value && styles.chipActive, ...interactiveStateStyles(state)]}
            >
              <Text style={[styles.chipText, category === item.value && styles.chipTextActive]}>
                {translateText(item.labelKey)}
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
              style={(state) => [styles.chip, sort === item.value && styles.chipActive, ...interactiveStateStyles(state)]}
            >
              <Text style={[styles.chipText, sort === item.value && styles.chipTextActive]}>
                {translateText(item.labelKey)}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.controlRow}>
          <View style={styles.controlGroup}>
            <Text style={styles.helperLabel}>{translateText('몇 개씩 보기')}</Text>
            <View style={styles.optionRowCompact}>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <Pressable
                  key={size}
                  accessibilityRole="button"
                  onPress={() => changePageSize(size)}
                  style={(state) => [
                    styles.compactChip,
                    pageSize === size && styles.chipActive,
                    ...interactiveStateStyles(state)
                  ]}
                >
                  <Text style={[styles.chipText, pageSize === size && styles.chipTextActive]}>
                    {size}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.controlGroup}>
            <Text style={styles.helperLabel}>{translateText('보기 방식')}</Text>
            <View style={styles.optionRowCompact}>
              {[
                { value: 'card', labelKey: '카드보기' },
                { value: 'table', labelKey: '표보기' }
              ].map((item) => (
                <Pressable
                  key={item.value}
                  accessibilityRole="button"
                  onPress={() => changeViewMode(item.value)}
                  style={(state) => [
                    styles.compactChip,
                    viewMode === item.value && styles.chipActive,
                    ...interactiveStateStyles(state)
                  ]}
                >
                  <Text style={[styles.chipText, viewMode === item.value && styles.chipTextActive]}>
                    {translateText(item.labelKey)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  }

  function renderBookmarkFilters() {
    return (
      <View style={styles.filterPanel}>
        <Text style={styles.sectionTitle}>{translateText('내가 저장한 게시글')}</Text>
        <View style={styles.optionRow}>
          {SORT_OPTIONS.filter((item) => ['latest', 'oldest'].includes(item.value)).map((item) => (
            <Pressable
              key={item.value}
              onPress={() => {
                setBookmarkSort(item.value);
                setBookmarkPage(1);
              }}
              style={(state) => [styles.chip, bookmarkSort === item.value && styles.chipActive, ...interactiveStateStyles(state)]}
            >
              <Text style={[styles.chipText, bookmarkSort === item.value && styles.chipTextActive]}>
                {translateText(item.labelKey)}
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
        <Text style={styles.sectionTitle}>
          {postFormMode === 'edit' ? translateText('게시글 수정') : translateText('게시글 작성')}
        </Text>
        <View style={styles.optionRow}>
          {CATEGORIES.map((item) => (
            <Pressable
              key={item.value}
              onPress={() => setPostForm((current) => ({ ...current, category: item.value }))}
              style={[styles.chip, postForm.category === item.value && styles.chipActive]}
            >
              <Text style={[styles.chipText, postForm.category === item.value && styles.chipTextActive]}>
                {translateText(item.labelKey)}
              </Text>
            </Pressable>
          ))}
        </View>
        <AccessibleTextInput
          onChangeText={(title) => setPostForm((current) => ({ ...current, title }))}
          placeholder={translateText('제목')}
          style={styles.input}
          value={postForm.title}
        />
        <AccessibleTextInput
          multiline
          onChangeText={(content) => setPostForm((current) => ({ ...current, content }))}
          placeholder={translateText('내용')}
          style={[styles.input, styles.textArea]}
          textAlignVertical="top"
          value={postForm.content}
        />
        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={submitPostForm}
            style={({ pressed }) => [styles.primaryButton, busy && styles.disabled, pressed && styles.buttonPressed]}
          >
            <Text style={styles.primaryButtonText}>
              {postFormMode === 'edit' ? translateText('수정 저장') : translateText('작성 완료')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={closePostForm}
            style={({ pressed }) => [styles.secondaryButton, busy && styles.disabled, pressed && styles.buttonPressed]}
          >
            <Text style={styles.secondaryButtonText}>{translateText('취소')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function renderPostList() {
    if (posts.length === 0) {
      return (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>{translateText('글')}</Text>
          <Text style={styles.emptyTitle}>{translateText('게시글이 없습니다.')}</Text>
          <Text style={styles.emptyText}>{translateText('검색 조건을 바꾸거나 첫 게시글을 작성해 보세요.')}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={openCreateForm}
            style={(state) => [styles.emptyActionButton, ...interactiveStateStyles(state)]}
          >
            <Text style={styles.emptyActionText}>{translateText('첫 글 작성하기')}</Text>
          </Pressable>
        </View>
      );
    }

    if (viewMode === 'table') {
      return renderPostTable();
    }

    return posts.map((post) => renderPostCard(post));
  }

  function renderPostTable() {
    return (
      <View style={styles.tableSection}>
        <Text style={styles.tableScrollHint}>
          {translateText('표가 화면보다 넓으면 좌우로 스크롤해 전체 컬럼을 확인할 수 있습니다.')}
        </Text>
        <ScrollView
          contentContainerStyle={styles.tableScrollerContent}
          horizontal
          keyboardShouldPersistTaps="handled"
          showsHorizontalScrollIndicator
          style={styles.tableScroller}
        >
          <View style={styles.boardTable}>
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <Text style={[styles.tableCell, styles.tableCategoryCell]} numberOfLines={1}>{translateText('분류')}</Text>
              <Text style={[styles.tableCell, styles.tableTitleCell]} numberOfLines={1}>{translateText('제목')}</Text>
              <Text style={[styles.tableCell, styles.tableAuthorCell]} numberOfLines={1}>{translateText('작성자')}</Text>
              <Text style={[styles.tableCell, styles.tableMetricCell]} numberOfLines={1}>{translateText('댓글')}</Text>
              <Text style={[styles.tableCell, styles.tableMetricCell]} numberOfLines={1}>{translateText('좋아요')}</Text>
              <Text style={[styles.tableCell, styles.tableMetricCell]} numberOfLines={1}>{translateText('조회수')}</Text>
              <Text style={[styles.tableCell, styles.tableDateCell]} numberOfLines={1}>{translateText('등록일')}</Text>
              <Text style={[styles.tableCell, styles.tableDateCell]} numberOfLines={1}>{translateText('수정일')}</Text>
              <Text style={[styles.tableCell, styles.tableActionCell]} numberOfLines={1}>{translateText('관리')}</Text>
            </View>
            {posts.map((post) => (
              <View key={post.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.tableCategoryCell]} numberOfLines={1}>
                  {getCategoryLabel(post.category, translateText)}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => openDetail(post)}
                  style={(state) => [styles.tableTitleButton, ...interactiveStateStyles(state)]}
                >
                  <Text style={styles.tableTitleText} numberOfLines={1}>{post.title}</Text>
                  <Text style={styles.tablePreviewText} numberOfLines={1}>{getPreview(post.content)}</Text>
                </Pressable>
                <View style={[styles.tableCell, styles.tableAuthorCell]}>
                  {renderAuthorButton(post.author, true)}
                </View>
                <Text style={[styles.tableCell, styles.tableMetricCell]} numberOfLines={1}>{post.commentCount ?? 0}</Text>
                <Text style={[styles.tableCell, styles.tableMetricCell]} numberOfLines={1}>{post.likeCount ?? 0}</Text>
                <Text style={[styles.tableCell, styles.tableMetricCell]} numberOfLines={1}>{post.viewCount ?? 0}</Text>
                <Text style={[styles.tableCell, styles.tableDateCell]} numberOfLines={1}>
                  {formatDate(post.createdAt, currentLanguage)}
                </Text>
                <Text style={[styles.tableCell, styles.tableDateCell]} numberOfLines={1}>
                  {formatDate(post.updatedAt, currentLanguage)}
                </Text>
                <View style={[styles.tableCell, styles.tableActionCell]}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => copyPostLink(post)}
                    style={(state) => [styles.tableActionButton, ...interactiveStateStyles(state)]}
                  >
                    <Text style={styles.tableActionText} numberOfLines={1}>{translateText('공유')}</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  function renderBookmarkList() {
    if (bookmarks.length === 0) {
      return (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>{translateText('저장')}</Text>
          <Text style={styles.emptyTitle}>{translateText('북마크한 게시글이 없습니다.')}</Text>
          <Text style={styles.emptyText}>
            {translateText('관심 있는 게시글에서 북마크를 눌러 저장할 수 있습니다.')}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => switchTab('posts')}
            style={(state) => [styles.emptyActionButton, ...interactiveStateStyles(state)]}
          >
            <Text style={styles.emptyActionText}>{translateText('커뮤니티 둘러보기')}</Text>
          </Pressable>
        </View>
      );
    }

    return bookmarks.map((bookmark) => (
      <View key={bookmark.bookmarkId} style={styles.bookmarkItem}>
        <Text style={styles.bookmarkDate}>{translateText('북마크:')} {formatDate(bookmark.bookmarkedAt, currentLanguage)}</Text>
        {renderPostCard(bookmark.post)}
      </View>
    ));
  }

  function renderReactionButton({ active, count, icon, label, onPress }) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} ${count || 0}`}
        disabled={busy}
        onPress={onPress}
        style={({ pressed }) => [
          styles.reactionButton,
          active && styles.reactionButtonActive,
          pressed && styles.buttonPressed
        ]}
      >
        <Text style={[styles.reactionIcon, active && styles.reactionTextActive]}>{icon}</Text>
        <Text style={[styles.reactionCount, active && styles.reactionTextActive]}>{count || 0}</Text>
      </Pressable>
    );
  }

  function renderAuthorButton(author, compact = false) {
    if (!author?.id) {
      return <Text style={styles.authorText}>{translateText('작성자')}: {translateText('알 수 없음')}</Text>;
    }

    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => onNavigate?.('publicProfile', { params: { userId: author.id } })}
        style={(state) => [
          compact ? styles.authorCompactButton : styles.authorButton,
          ...interactiveStateStyles(state)
        ]}
      >
        <ProfileAvatar appearance={author} name={author.name} size={compact ? 'sm' : 'md'} />
        <View style={styles.authorButtonCopy}>
          <Text style={styles.authorText} numberOfLines={compact ? 1 : 2}>
            {compact ? author.name || translateText('알 수 없음') : `${translateText('작성자')}: ${author.name || translateText('알 수 없음')}`}
          </Text>
          {author.titleText && !compact ? (
            <ProfileTitleChip animated title={author.titleText} translateText={translateText} />
          ) : null}
        </View>
      </Pressable>
    );
  }

  function renderPostCard(post) {
    return (
      <View key={post.id} style={[styles.card, shadows.card, selectedPost?.id === post.id && styles.cardActive]}>
        <View style={styles.cardHeader}>
          <Text style={styles.categoryBadge}>{getCategoryLabel(post.category, translateText)}</Text>
          <View style={styles.dateStack}>
            <Text style={styles.dateText}>{translateText('등록')} {formatDate(post.createdAt, currentLanguage)}</Text>
            <Text style={styles.dateSubText}>{translateText('수정')} {formatDate(post.updatedAt, currentLanguage)}</Text>
          </View>
        </View>
        <Text style={styles.cardTitle}>{post.title}</Text>
        <Text style={styles.cardContent}>{getPreview(post.content)}</Text>
        <View style={styles.cardMetaRow}>
          {renderAuthorButton(post.author)}
          {post.isBookmarked ? <Text style={styles.savedBadge}>{translateText('저장됨')}</Text> : null}
        </View>
        {renderEngagement(post)}
        <View style={styles.cardActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${post.title} ${translateText('상세 보기')}`}
            onPress={() => openDetail(post)}
            style={(state) => [styles.secondaryButton, ...interactiveStateStyles(state)]}
          >
            <Text style={styles.secondaryButtonText}>{translateText('상세')}</Text>
          </Pressable>
          {renderReactionButton({
            active: post.myReaction === 'LIKE',
            count: post.likeCount,
            icon: '👍',
            label: `${post.title} ${translateText('좋아요')}`,
            onPress: () => toggleReaction(post, 'LIKE')
          })}
          {renderReactionButton({
            active: post.myReaction === 'DISLIKE',
            count: post.dislikeCount,
            icon: '👎',
            label: `${post.title} ${translateText('싫어요')}`,
            onPress: () => toggleReaction(post, 'DISLIKE')
          })}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${post.title} ${translateText('북마크')} ${
              post.isBookmarked ? translateText('해제') : translateText('추가')
            }`}
            disabled={busy}
            onPress={() => toggleBookmark(post)}
            style={({ pressed }) => [
              styles.smallButton,
              post.isBookmarked && styles.bookmarkButtonActive,
              pressed && styles.buttonPressed
            ]}
          >
            <Text style={[styles.smallButtonText, post.isBookmarked && styles.bookmarkButtonTextActive]}>
              {post.isBookmarked ? translateText('북마크됨') : translateText('북마크')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${post.title} ${translateText('링크 공유')}`}
            disabled={busy}
            onPress={() => copyPostLink(post)}
            style={({ pressed }) => [styles.smallButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.smallButtonText}>{translateText('공유')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function renderEngagement(post) {
    return (
      <View style={styles.metricRow}>
        <Text style={styles.metricText}>{translateText('댓글')} {post.commentCount ?? 0}</Text>
        <Text style={styles.metricText}>{translateText('좋아요')} {post.likeCount ?? 0}</Text>
        <Text style={styles.metricText}>{translateText('싫어요')} {post.dislikeCount ?? 0}</Text>
        <Text style={styles.metricText}>{translateText('조회수')} {post.viewCount ?? 0}</Text>
        <Text style={styles.metricText}>{translateText('북마크')} {post.bookmarkCount ?? 0}</Text>
      </View>
    );
  }

  function renderPostDetail() {
    const ownPost = isOwnContent(selectedPost, user);

    return (
      <View style={[styles.detailCard, shadows.card]}>
        <View style={styles.cardHeader}>
          <Text style={styles.categoryBadge}>{getCategoryLabel(selectedPost.category, translateText)}</Text>
          <View style={styles.dateStack}>
            <Text style={styles.dateText}>{translateText('등록')} {formatDate(selectedPost.createdAt, currentLanguage)}</Text>
            <Text style={styles.dateSubText}>{translateText('수정')} {formatDate(selectedPost.updatedAt, currentLanguage)}</Text>
          </View>
        </View>
        <Text style={styles.detailTitle}>{selectedPost.title}</Text>
        {renderAuthorButton(selectedPost.author)}
        <View style={styles.detailBody}>
          <Text style={styles.detailContent}>{selectedPost.content}</Text>
        </View>
        {renderEngagement(selectedPost)}
        <View style={styles.detailActionPanel}>
          <Text style={styles.actionPanelTitle}>{translateText('반응과 저장')}</Text>
          <View style={styles.cardActions}>
          {renderReactionButton({
            active: selectedPost.myReaction === 'LIKE',
            count: selectedPost.likeCount,
            icon: '👍',
            label: translateText('게시글 좋아요'),
            onPress: () => toggleReaction(selectedPost, 'LIKE')
          })}
          {renderReactionButton({
            active: selectedPost.myReaction === 'DISLIKE',
            count: selectedPost.dislikeCount,
            icon: '👎',
            label: translateText('게시글 싫어요'),
            onPress: () => toggleReaction(selectedPost, 'DISLIKE')
          })}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              selectedPost.isBookmarked
                ? translateText('게시글 북마크 해제')
                : translateText('게시글 북마크 추가')
            }
            disabled={busy}
            onPress={() => toggleBookmark(selectedPost)}
            style={({ pressed }) => [
              styles.smallButton,
              selectedPost.isBookmarked && styles.bookmarkButtonActive,
              pressed && styles.buttonPressed
            ]}
          >
            <Text style={[styles.smallButtonText, selectedPost.isBookmarked && styles.bookmarkButtonTextActive]}>
              {selectedPost.isBookmarked ? translateText('북마크 해제') : translateText('북마크')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={translateText('게시글 신고')}
            onPress={() => openReport('post', selectedPost)}
            style={({ pressed }) => [styles.warningButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.warningButtonText}>{translateText('게시글 신고')}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={translateText('게시글 링크 공유')}
            disabled={busy}
            onPress={() => copyPostLink(selectedPost)}
            style={({ pressed }) => [styles.smallButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.smallButtonText}>{translateText('공유')}</Text>
          </Pressable>
          </View>
        </View>
        {ownPost ? (
          <View style={styles.ownerActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => openEditPostForm(selectedPost)}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.secondaryButtonText}>{translateText('게시글 수정')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => confirmDeletePost(selectedPost)}
              style={({ pressed }) => [styles.dangerButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.dangerButtonText}>{translateText('게시글 삭제')}</Text>
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
        <Text style={styles.sectionTitle}>{translateText('댓글')}</Text>
        <View style={styles.commentForm}>
          <AccessibleTextInput
            multiline
            onChangeText={setCommentContent}
            placeholder={translateText('댓글을 입력해 주세요.')}
            style={[styles.input, styles.commentInput]}
            textAlignVertical="top"
            value={commentContent}
          />
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={submitComment}
            style={({ pressed }) => [styles.primaryButton, busy && styles.disabled, pressed && styles.buttonPressed]}
          >
            <Text style={styles.primaryButtonText}>{translateText('댓글 작성')}</Text>
          </Pressable>
        </View>
        {comments.length === 0 ? (
          <View style={styles.emptyCommentBox}>
            <Text style={styles.emptyIcon}>{translateText('댓글')}</Text>
            <Text style={styles.emptyTitle}>{translateText('아직 댓글이 없습니다.')}</Text>
            <Text style={styles.emptyText}>{translateText('궁금한 점이나 응원을 첫 댓글로 남겨 보세요.')}</Text>
          </View>
        ) : (
          comments.map((comment) => renderComment(comment))
        )}
        {renderPagination(commentPagination, commentPage, changeCommentPage)}
      </View>
    );
  }

  function renderReplyForm(comment) {
    if (replyTarget?.id !== comment.id) {
      return null;
    }

    return (
      <View style={styles.replyForm}>
        <AccessibleTextInput
          multiline
          onChangeText={setReplyContent}
          placeholder={translateText('대답글을 입력해 주세요.')}
          style={[styles.input, styles.replyInput]}
          textAlignVertical="top"
          value={replyContent}
        />
        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => submitReply(comment)}
            style={({ pressed }) => [styles.primaryButton, busy && styles.disabled, pressed && styles.buttonPressed]}
          >
            <Text style={styles.primaryButtonText}>{translateText('대답글 작성')}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => {
              setReplyTarget(null);
              setReplyContent('');
            }}
            style={({ pressed }) => [styles.secondaryButton, busy && styles.disabled, pressed && styles.buttonPressed]}
          >
            <Text style={styles.secondaryButtonText}>{translateText('취소')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function renderComment(comment, level = 0) {
    const ownComment = isOwnContent(comment, user);
    const isEditing = editingComment?.id === comment.id;
    const isReply = level > 0;

    return (
      <View key={comment.id} style={[styles.commentCard, isReply && styles.replyCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.commentAuthorRow}>
            {isReply ? <Text style={styles.replyPrefix}>↳</Text> : null}
            {renderAuthorButton(comment.author, true)}
          </View>
          <Text style={styles.dateText}>{formatDate(comment.createdAt, currentLanguage)}</Text>
        </View>
        {isEditing ? (
          <View style={styles.editCommentBox}>
            <AccessibleTextInput
              multiline
              onChangeText={setEditingCommentContent}
              style={[styles.input, styles.commentInput]}
              textAlignVertical="top"
              value={editingCommentContent}
            />
            <View style={styles.actionRow}>
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={submitCommentEdit}
                style={({ pressed }) => [styles.primaryButton, busy && styles.disabled, pressed && styles.buttonPressed]}
              >
                <Text style={styles.primaryButtonText}>{translateText('저장')}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setEditingComment(null)}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              >
                <Text style={styles.secondaryButtonText}>{translateText('취소')}</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Text style={styles.commentText}>{comment.content}</Text>
        )}
        {!isEditing ? (
          <View style={styles.cardActions}>
            {renderReactionButton({
              active: comment.myReaction === 'LIKE',
              count: comment.likeCount,
              icon: '👍',
              label: translateText('댓글 좋아요'),
              onPress: () => toggleCommentReaction(comment, 'LIKE')
            })}
            {renderReactionButton({
              active: comment.myReaction === 'DISLIKE',
              count: comment.dislikeCount,
              icon: '👎',
              label: translateText('댓글 싫어요'),
              onPress: () => toggleCommentReaction(comment, 'DISLIKE')
            })}
            {!isReply ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={translateText('대답글 작성')}
                disabled={busy}
                onPress={() => {
                  setReplyTarget(comment);
                  setReplyContent('');
                }}
                style={({ pressed }) => [styles.smallButton, pressed && styles.buttonPressed]}
              >
                <Text style={styles.smallButtonText}>{translateText('대답글')}</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={translateText('댓글 신고')}
              onPress={() => openReport('comment', comment)}
              style={({ pressed }) => [styles.warningButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.warningButtonText}>{translateText('댓글 신고')}</Text>
            </Pressable>
            {ownComment ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => startEditComment(comment)}
                  style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
                >
                  <Text style={styles.secondaryButtonText}>{translateText('수정')}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => confirmDeleteComment(comment)}
                  style={({ pressed }) => [styles.dangerButton, pressed && styles.buttonPressed]}
                >
                  <Text style={styles.dangerButtonText}>{translateText('삭제')}</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        ) : null}
        {renderReplyForm(comment)}
        {!isReply && Array.isArray(comment.replies) && comment.replies.length ? (
          <View style={styles.replyList}>
            {comment.replies.map((reply) => renderComment(reply, level + 1))}
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
          accessibilityRole="button"
          disabled={value <= 1 || loading || detailLoading}
          onPress={() => onChange(value - 1)}
          style={({ pressed }) => [
            styles.secondaryButton,
            (value <= 1 || loading || detailLoading) && styles.disabled,
            pressed && styles.buttonPressed
          ]}
        >
          <Text style={styles.secondaryButtonText}>{translateText('이전')}</Text>
        </Pressable>
        <Text style={styles.pageText}>
          {value} / {totalPages}
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={value >= totalPages || loading || detailLoading}
          onPress={() => onChange(value + 1)}
          style={({ pressed }) => [
            styles.secondaryButton,
            (value >= totalPages || loading || detailLoading) && styles.disabled,
            pressed && styles.buttonPressed
          ]}
        >
          <Text style={styles.secondaryButtonText}>{translateText('다음')}</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  contentContainer: {
    padding: 16,
    gap: 16,
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 18,
    ...shadows.card
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
    color: colors.ink,
    fontSize: 26,
    fontWeight: '800'
  },
  subtitle: {
    color: colors.muted,
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
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...interactions.transition
  },
  tabButtonActive: {
    backgroundColor: colors.blue,
    borderColor: colors.blue
  },
  tabButtonText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700'
  },
  tabButtonTextActive: {
    color: colors.surface
  },
  filterPanel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 10,
    ...shadows.card
  },
  panel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 10,
    ...shadows.card
  },
  layout: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    flexWrap: 'wrap'
  },
  listPane: {
    flex: 1,
    minWidth: 280,
    gap: 10
  },
  detailPane: {
    flex: 1.2,
    minWidth: 280
  },
  boardStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  boardStatusText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700'
  },
  boardStatusStrong: {
    color: colors.blueDeep,
    fontWeight: '800'
  },
  boardStatusDivider: {
    color: colors.line,
    fontSize: 13,
    fontWeight: '800'
  },
  boardLayout: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
    flexWrap: 'wrap'
  },
  boardMainPane: {
    flex: 1.8,
    minWidth: 260,
    gap: 12
  },
  boardDetailPane: {
    flex: 0.8,
    minWidth: 260,
    maxWidth: 420
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap'
  },
  searchInputContainer: {
    flex: 1,
    minWidth: 220
  },
  searchInput: {
    flex: 1,
    minWidth: 220,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.ink
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap'
  },
  optionRowCompact: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap'
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 10
  },
  controlGroup: {
    gap: 6,
    minWidth: 170
  },
  helperLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800'
  },
  compactChip: {
    minHeight: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 9,
    paddingVertical: 6,
    ...interactions.transition
  },
  recentSearchPanel: {
    borderRadius: 12,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 10,
    gap: 8
  },
  recentSearchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10
  },
  recentSearchChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    ...interactions.transition
  },
  recentSearchText: {
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '800'
  },
  textButton: {
    minHeight: 28,
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    ...interactions.transition
  },
  textButtonLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800'
  },
  chip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 8,
    ...interactions.transition
  },
  chipActive: {
    backgroundColor: colors.mintSoft,
    borderColor: colors.mint
  },
  chipText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700'
  },
  chipTextActive: {
    color: colors.blueDeep
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.ink,
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
  replyInput: {
    minHeight: 64
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800'
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: colors.line,
    borderLeftColor: colors.mint,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 7,
    ...interactions.transition
  },
  cardActive: {
    borderColor: colors.mint,
    borderLeftColor: colors.blue,
    backgroundColor: colors.mintSoft
  },
  detailCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 12
  },
  bookmarkItem: {
    gap: 6
  },
  bookmarkDate: {
    color: colors.muted,
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
    borderRadius: 8,
    backgroundColor: colors.blueSoft,
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  dateText: {
    color: colors.muted,
    fontSize: 12
  },
  dateStack: {
    alignItems: 'flex-end',
    gap: 2
  },
  dateSubText: {
    color: colors.muted,
    fontSize: 11
  },
  tableSection: {
    gap: 8
  },
  tableScrollHint: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18
  },
  tableScroller: {
    width: '100%',
    borderRadius: 14
  },
  tableScrollerContent: {
    minWidth: 1260,
    paddingBottom: 6
  },
  boardTable: {
    minWidth: 1260,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadows.card
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: colors.line
  },
  tableHeaderRow: {
    backgroundColor: colors.surfaceWarm
  },
  tableCell: {
    justifyContent: 'center',
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: colors.line
  },
  tableCategoryCell: {
    width: 110
  },
  tableTitleCell: {
    width: 330
  },
  tableAuthorCell: {
    width: 170
  },
  tableMetricCell: {
    width: 76,
    textAlign: 'center'
  },
  tableDateCell: {
    width: 160
  },
  tableActionCell: {
    width: 100,
    alignItems: 'center'
  },
  tableTitleButton: {
    width: 330,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRightWidth: 1,
    borderRightColor: colors.line,
    ...interactions.transition
  },
  tableTitleText: {
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '800'
  },
  tablePreviewText: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2
  },
  tableActionButton: {
    minHeight: 30,
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 8,
    ...interactions.transition
  },
  tableActionText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800'
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800'
  },
  detailTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '800'
  },
  cardContent: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  detailContent: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 24
  },
  authorText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600'
  },
  authorButton: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    maxWidth: '100%',
    padding: 2,
    ...interactions.transition
  },
  authorCompactButton: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 6,
    maxWidth: '100%',
    paddingVertical: 2,
    ...interactions.transition
  },
  authorButtonCopy: {
    flexShrink: 1,
    gap: 4,
    minWidth: 0
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap'
  },
  commentAuthorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    minWidth: 0
  },
  replyPrefix: {
    color: colors.mintDeep,
    fontSize: 16,
    fontWeight: '900'
  },
  savedBadge: {
    borderRadius: 8,
    backgroundColor: colors.cream,
    color: colors.warning,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  detailBody: {
    borderRadius: 14,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14
  },
  detailActionPanel: {
    borderRadius: 14,
    backgroundColor: colors.blueSoft,
    padding: 12,
    gap: 8
  },
  actionPanelTitle: {
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '800'
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  metricText: {
    borderRadius: 8,
    backgroundColor: colors.surfaceWarm,
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  reactionButton: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    ...interactions.transition
  },
  reactionButtonActive: {
    backgroundColor: colors.blue,
    borderColor: colors.blue
  },
  reactionIcon: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800'
  },
  reactionCount: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800'
  },
  reactionTextActive: {
    color: colors.surface
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
    borderTopColor: colors.line,
    paddingTop: 12
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  primaryButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.blue,
    borderWidth: 1,
    borderColor: colors.blue,
    paddingHorizontal: 14,
    paddingVertical: 9,
    ...interactions.transition
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '800'
  },
  secondaryButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 9,
    ...interactions.transition
  },
  secondaryButtonText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700'
  },
  smallButton: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    ...interactions.transition
  },
  smallButtonActive: {
    backgroundColor: colors.blue,
    borderColor: colors.blue
  },
  smallButtonText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800'
  },
  smallButtonTextActive: {
    color: colors.surface
  },
  bookmarkButtonActive: {
    backgroundColor: colors.cream,
    borderColor: colors.creamStrong
  },
  bookmarkButtonTextActive: {
    color: colors.warning
  },
  warningButton: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.creamStrong,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    ...interactions.transition
  },
  warningButtonText: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '800'
  },
  dangerButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: 14,
    paddingVertical: 9,
    ...interactions.transition
  },
  dangerButtonText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '800'
  },
  commentSection: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 14,
    gap: 10
  },
  commentForm: {
    gap: 8
  },
  commentCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 12,
    gap: 8
  },
  replyCard: {
    marginLeft: 14,
    borderLeftWidth: 3,
    borderLeftColor: colors.mint,
    backgroundColor: colors.surface
  },
  replyForm: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 10,
    gap: 8
  },
  replyList: {
    gap: 8,
    borderLeftWidth: 1,
    borderLeftColor: colors.line,
    paddingLeft: 8
  },
  commentText: {
    color: colors.ink,
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
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800'
  },
  loadingBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 10
  },
  emptyBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 18,
    gap: 8,
    alignItems: 'flex-start'
  },
  emptyDetail: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 24,
    gap: 8,
    ...shadows.card
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800'
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  mutedText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20
  },
  counterText: {
    alignSelf: 'flex-end',
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700'
  },
  errorBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
    padding: 12
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700'
  },
  successBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.mint,
    backgroundColor: colors.successSoft,
    padding: 12
  },
  successText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '700'
  },
  realtimeBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.mint,
    backgroundColor: colors.mintSoft,
    padding: 12,
    gap: 10
  },
  realtimeText: {
    color: colors.blueDeep,
    fontSize: 14,
    fontWeight: '800'
  },
  realtimeActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  disabled: {
    opacity: 0.55
  },
  buttonPressed: interactions.buttonPressed,
  skeletonStack: {
    gap: 10
  },
  skeletonCard: {
    backgroundColor: colors.surface
  },
  modalTargetText: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
    padding: 12,
    marginBottom: 10
  },
  emptyIcon: {
    borderRadius: 999,
    backgroundColor: colors.mintSoft,
    color: colors.blueDeep,
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: 'hidden'
  },
  emptyActionButton: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.blue,
    borderWidth: 1,
    borderColor: colors.blue,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...interactions.transition
  },
  emptyActionText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '800'
  },
  emptyCommentBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    padding: 14,
    gap: 6
  }
});
