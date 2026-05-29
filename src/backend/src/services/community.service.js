const communityRepository = require('../repositories/community.repository');
const { conflictError, notFoundError, validationError } = require('../utils/errors');
const { normalizeString, parsePositiveInteger, requireFields } = require('../utils/validators');

const POST_CATEGORIES = ['QUESTION', 'FREE', 'STUDY_PROOF'];
const POST_FIELDS = ['category', 'title', 'content'];
const POST_SORTS = ['latest', 'oldest', 'likes', 'views', 'comments'];
const BOOKMARK_SORTS = ['latest', 'oldest'];
const COMMENT_FIELDS = ['content', 'parentId'];
const REACTION_FIELDS = ['type'];
const REACTION_TYPES = ['LIKE', 'DISLIKE'];
const BOOKMARK_FIELDS = [];
const REPORT_FIELDS = ['reason'];
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const MAX_SEARCH_LENGTH = 100;
const MAX_REPORT_REASON_LENGTH = 500;

function assertPlainObject(payload, message) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw validationError(message);
  }
}

function assertSupportedFields(payload, allowedFields, message) {
  const unsupportedFields = Object.keys(payload).filter((field) => !allowedFields.includes(field));

  if (unsupportedFields.length > 0) {
    throw validationError(message, { fields: unsupportedFields });
  }
}

function normalizeRequiredStringField(value, field) {
  if (typeof value !== 'string' || normalizeString(value) === '') {
    throw validationError(`${field} is required`, { field });
  }

  return normalizeString(value);
}

function normalizeCategory(value, options = { required: true }) {
  if (value === undefined) {
    if (options.required) {
      throw validationError('category is required', { field: 'category' });
    }

    return undefined;
  }

  if (value === null || typeof value !== 'string' || !POST_CATEGORIES.includes(value)) {
    throw validationError(`category must be one of ${POST_CATEGORIES.join(', ')}`, {
      field: 'category',
      allowedValues: POST_CATEGORIES
    });
  }

  return value;
}

function normalizeSearch(value) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw validationError('search must be a string', { field: 'search' });
  }

  const search = normalizeString(value);

  if (search === '') {
    throw validationError('search must not be blank', { field: 'search' });
  }

  if (search.length > MAX_SEARCH_LENGTH) {
    throw validationError(`search must be less than or equal to ${MAX_SEARCH_LENGTH} characters`, {
      field: 'search',
      max: MAX_SEARCH_LENGTH
    });
  }

  return search;
}

function normalizeSort(value) {
  if (value === undefined) {
    return 'latest';
  }

  if (typeof value !== 'string' || !POST_SORTS.includes(value)) {
    throw validationError(`sort must be one of ${POST_SORTS.join(', ')}`, {
      field: 'sort',
      allowedValues: POST_SORTS
    });
  }

  return value;
}

function normalizeBookmarkSort(value) {
  if (value === undefined) {
    return 'latest';
  }

  if (typeof value !== 'string' || !BOOKMARK_SORTS.includes(value)) {
    throw validationError(`sort must be one of ${BOOKMARK_SORTS.join(', ')}`, {
      field: 'sort',
      allowedValues: BOOKMARK_SORTS
    });
  }

  return value;
}

function parseOptionalPositiveInteger(value, field, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  return parsePositiveInteger(value, field);
}

function sanitizePost(post) {
  if (!post) {
    return null;
  }

  return {
    id: post.id,
    userId: post.userId,
    category: post.category,
    title: post.title,
    content: post.content,
    viewCount: post.viewCount ?? 0,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: post.user
      ? {
          id: post.user.id,
          name: post.user.name
        }
      : null,
    commentCount: post._count?.comments ?? 0
  };
}

function buildDefaultEngagementSummary() {
  return {
    likeCount: 0,
    dislikeCount: 0,
    bookmarkCount: 0,
    myReaction: null,
    isBookmarked: false
  };
}

function sanitizePostWithEngagement(post, engagementSummary) {
  const sanitizedPost = sanitizePost(post);

  if (!sanitizedPost) {
    return null;
  }

  return {
    ...sanitizedPost,
    ...buildDefaultEngagementSummary(),
    ...(engagementSummary || {})
  };
}

function sanitizeComment(comment) {
  if (!comment) {
    return null;
  }

  return {
    id: comment.id,
    postId: comment.postId,
    userId: comment.userId,
    parentId: comment.parentId ?? null,
    content: comment.content,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    author: comment.user
      ? {
          id: comment.user.id,
          name: comment.user.name
        }
      : null,
    replyCount: comment._count?.replies ?? 0
  };
}

function buildDefaultCommentReactionSummary() {
  return {
    likeCount: 0,
    dislikeCount: 0,
    myReaction: null
  };
}

function sanitizeCommentWithEngagement(comment, engagementSummary) {
  const sanitizedComment = sanitizeComment(comment);

  if (!sanitizedComment) {
    return null;
  }

  return {
    ...sanitizedComment,
    ...buildDefaultCommentReactionSummary(),
    ...(engagementSummary || {}),
    replies: Array.isArray(comment.replies)
      ? comment.replies.map((reply) =>
          sanitizeCommentWithEngagement(reply, engagementSummary?.replies?.get?.(reply.id))
        )
      : []
  };
}

function applyCommentEngagement(comment, summaries) {
  const summary = {
    ...buildDefaultCommentReactionSummary(),
    ...(summaries.get(comment.id) || {}),
    replies: summaries
  };

  return sanitizeCommentWithEngagement(comment, summary);
}

function sanitizeReaction(reaction) {
  if (!reaction) {
    return null;
  }

  return {
    id: reaction.id,
    postId: reaction.postId,
    commentId: reaction.commentId,
    userId: reaction.userId,
    type: reaction.type,
    createdAt: reaction.createdAt,
    updatedAt: reaction.updatedAt
  };
}

function sanitizeBookmark(bookmark) {
  if (!bookmark) {
    return null;
  }

  return {
    id: bookmark.id,
    postId: bookmark.postId,
    userId: bookmark.userId,
    createdAt: bookmark.createdAt
  };
}

function sanitizeReport(report) {
  if (!report) {
    return null;
  }

  return {
    id: report.id,
    targetType: report.targetType,
    postId: report.postId,
    commentId: report.commentId,
    reason: report.reason,
    status: report.status,
    createdAt: report.createdAt
  };
}

function sanitizeBookmarkListItem(bookmark, engagementSummary) {
  if (!bookmark) {
    return null;
  }

  return {
    bookmarkId: bookmark.id,
    bookmarkedAt: bookmark.createdAt,
    post: sanitizePostWithEngagement(bookmark.post, {
      ...buildDefaultEngagementSummary(),
      ...(engagementSummary || {}),
      isBookmarked: true
    })
  };
}

function buildPostData(payload = {}, options = { partial: false }) {
  assertPlainObject(payload, 'Community post payload must be an object');
  assertSupportedFields(payload, POST_FIELDS, 'Community post payload contains unsupported fields');

  if (!options.partial) {
    requireFields(payload, ['category', 'title', 'content'], 'category, title and content are required');
  }

  const data = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'category')) {
    data.category = normalizeCategory(payload.category, { required: !options.partial });
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'title')) {
    data.title = normalizeRequiredStringField(payload.title, 'title');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'content')) {
    data.content = normalizeRequiredStringField(payload.content, 'content');
  }

  if (Object.keys(data).length === 0) {
    throw validationError('Community post update requires at least one editable field', {
      fields: POST_FIELDS
    });
  }

  return data;
}

function buildCommentData(payload = {}) {
  assertPlainObject(payload, 'Community comment payload must be an object');
  assertSupportedFields(payload, COMMENT_FIELDS, 'Community comment payload contains unsupported fields');

  if (!Object.prototype.hasOwnProperty.call(payload, 'content')) {
    throw validationError('content is required', { field: 'content' });
  }

  const data = {
    content: normalizeRequiredStringField(payload.content, 'content')
  };

  if (Object.prototype.hasOwnProperty.call(payload, 'parentId') && payload.parentId !== null) {
    data.parentId = parsePositiveInteger(payload.parentId, 'parentId');
  }

  return data;
}

function buildReactionData(payload = {}) {
  assertPlainObject(payload, 'Community reaction payload must be an object');
  assertSupportedFields(payload, REACTION_FIELDS, 'Community reaction payload contains unsupported fields');

  if (!Object.prototype.hasOwnProperty.call(payload, 'type')) {
    throw validationError('type is required', { field: 'type' });
  }

  if (typeof payload.type !== 'string' || !REACTION_TYPES.includes(payload.type)) {
    throw validationError(`type must be one of ${REACTION_TYPES.join(', ')}`, {
      field: 'type',
      allowedValues: REACTION_TYPES
    });
  }

  return {
    type: payload.type
  };
}

function buildBookmarkData(payload = {}) {
  assertPlainObject(payload, 'Community bookmark payload must be an object');
  assertSupportedFields(payload, BOOKMARK_FIELDS, 'Community bookmark payload contains unsupported fields');

  return {};
}

function buildReportData(payload = {}) {
  assertPlainObject(payload, 'Community report payload must be an object');
  assertSupportedFields(payload, REPORT_FIELDS, 'Community report payload contains unsupported fields');

  if (!Object.prototype.hasOwnProperty.call(payload, 'reason')) {
    throw validationError('reason is required', { field: 'reason' });
  }

  if (typeof payload.reason !== 'string') {
    throw validationError('reason must be a string', { field: 'reason' });
  }

  const reason = normalizeString(payload.reason);

  if (reason === '') {
    throw validationError('reason must not be blank', { field: 'reason' });
  }

  if (reason.length > MAX_REPORT_REASON_LENGTH) {
    throw validationError(
      `reason must be less than or equal to ${MAX_REPORT_REASON_LENGTH} characters`,
      {
        field: 'reason',
        max: MAX_REPORT_REASON_LENGTH
      }
    );
  }

  return { reason };
}

function buildListOptions(query = {}) {
  const page = parseOptionalPositiveInteger(query.page, 'page', DEFAULT_PAGE);
  const pageSize = parseOptionalPositiveInteger(query.pageSize, 'pageSize', DEFAULT_PAGE_SIZE);

  if (pageSize > MAX_PAGE_SIZE) {
    throw validationError(`pageSize must be less than or equal to ${MAX_PAGE_SIZE}`, {
      field: 'pageSize',
      max: MAX_PAGE_SIZE
    });
  }

  const category = query.category === undefined ? undefined : normalizeCategory(query.category);
  const search = normalizeSearch(query.search);
  const sort = normalizeSort(query.sort);

  return {
    page,
    pageSize,
    category,
    search,
    sort
  };
}

function buildCommentListOptions(query = {}) {
  const page = parseOptionalPositiveInteger(query.page, 'page', DEFAULT_PAGE);
  const pageSize = parseOptionalPositiveInteger(query.pageSize, 'pageSize', DEFAULT_PAGE_SIZE);

  if (pageSize > MAX_PAGE_SIZE) {
    throw validationError(`pageSize must be less than or equal to ${MAX_PAGE_SIZE}`, {
      field: 'pageSize',
      max: MAX_PAGE_SIZE
    });
  }

  return {
    page,
    pageSize
  };
}

function buildBookmarkListOptions(query = {}) {
  const page = parseOptionalPositiveInteger(query.page, 'page', DEFAULT_PAGE);
  const pageSize = parseOptionalPositiveInteger(query.pageSize, 'pageSize', DEFAULT_PAGE_SIZE);

  if (pageSize > MAX_PAGE_SIZE) {
    throw validationError(`pageSize must be less than or equal to ${MAX_PAGE_SIZE}`, {
      field: 'pageSize',
      max: MAX_PAGE_SIZE
    });
  }

  const sort = normalizeBookmarkSort(query.sort);

  return {
    page,
    pageSize,
    sort
  };
}

async function listPosts(query, userId) {
  const options = buildListOptions(query);
  const { posts, total } = await communityRepository.findPosts(options);
  const summaries = await communityRepository.findPostEngagementSummaries(
    posts.map((post) => post.id),
    userId
  );
  const totalPages = Math.ceil(total / options.pageSize);

  return {
    posts: posts.map((post) => sanitizePostWithEngagement(post, summaries.get(post.id))),
    pagination: {
      page: options.page,
      pageSize: options.pageSize,
      total,
      totalPages
    }
  };
}

async function listBookmarks(query, userId) {
  const options = buildBookmarkListOptions(query);
  const { bookmarks, total } = await communityRepository.findBookmarksByUserId({
    userId,
    ...options
  });
  const summaries = await communityRepository.findPostEngagementSummaries(
    bookmarks.map((bookmark) => bookmark.postId),
    userId
  );
  const totalPages = Math.ceil(total / options.pageSize);

  return {
    bookmarks: bookmarks.map((bookmark) =>
      sanitizeBookmarkListItem(bookmark, summaries.get(bookmark.postId))
    ),
    pagination: {
      page: options.page,
      pageSize: options.pageSize,
      total,
      totalPages
    }
  };
}

async function createPost(userId, payload) {
  const data = buildPostData(payload);
  const post = await communityRepository.createPost(userId, data);

  return sanitizePost(post);
}

async function getPostById(postId, userId) {
  const id = parsePositiveInteger(postId, 'postId');
  const existingPost = await communityRepository.findPostById(id);

  if (!existingPost) {
    throw notFoundError('Community post not found');
  }

  const post = await communityRepository.incrementPostViewCount(id);

  const summaries = await communityRepository.findPostEngagementSummaries([id], userId);

  return sanitizePostWithEngagement(post, summaries.get(id));
}

async function listComments(postId, query, userId) {
  const id = parsePositiveInteger(postId, 'postId');
  const post = await communityRepository.findPostById(id);

  if (!post) {
    throw notFoundError('Community post not found');
  }

  const options = buildCommentListOptions(query);
  const { comments, total } = await communityRepository.findCommentsByPostId({
    postId: id,
    ...options
  });
  const commentIds = comments.flatMap((comment) => [
    comment.id,
    ...(Array.isArray(comment.replies) ? comment.replies.map((reply) => reply.id) : [])
  ]);
  const summaries = await communityRepository.findCommentReactionSummaries(commentIds, userId);
  const totalPages = Math.ceil(total / options.pageSize);

  return {
    comments: comments.map((comment) => applyCommentEngagement(comment, summaries)),
    pagination: {
      page: options.page,
      pageSize: options.pageSize,
      total,
      totalPages
    }
  };
}

async function createComment(postId, userId, payload) {
  const id = parsePositiveInteger(postId, 'postId');
  const post = await communityRepository.findPostById(id);

  if (!post) {
    throw notFoundError('Community post not found');
  }

  const data = buildCommentData(payload);
  if (data.parentId) {
    const parentComment = await communityRepository.findCommentById(data.parentId);

    if (!parentComment || parentComment.postId !== id) {
      throw notFoundError('Parent comment not found');
    }

    if (parentComment.parentId) {
      throw validationError('Replies can only target top-level comments', {
        field: 'parentId'
      });
    }
  }

  const comment = await communityRepository.createComment(id, userId, data);

  return sanitizeComment(comment);
}

async function createReaction(postId, userId, payload) {
  const id = parsePositiveInteger(postId, 'postId');
  const post = await communityRepository.findPostById(id);

  if (!post) {
    throw notFoundError('Community post not found');
  }

  const data = buildReactionData(payload);
  const reaction = await communityRepository.upsertReaction(id, userId, data.type);

  return sanitizeReaction(reaction);
}

async function createCommentReaction(commentId, userId, payload) {
  const id = parsePositiveInteger(commentId, 'commentId');
  const comment = await communityRepository.findCommentById(id);

  if (!comment) {
    throw notFoundError('Community comment not found');
  }

  const data = buildReactionData(payload);
  const reaction = await communityRepository.upsertCommentReaction(id, userId, data.type);

  return sanitizeReaction(reaction);
}

async function createBookmark(postId, userId, payload) {
  const id = parsePositiveInteger(postId, 'postId');
  const post = await communityRepository.findPostById(id);

  if (!post) {
    throw notFoundError('Community post not found');
  }

  buildBookmarkData(payload);
  const bookmark = await communityRepository.upsertBookmark(id, userId);

  return sanitizeBookmark(bookmark);
}

async function createPostReport(postId, userId, payload) {
  const id = parsePositiveInteger(postId, 'postId');
  const post = await communityRepository.findPostById(id);

  if (!post) {
    throw notFoundError('Community post not found');
  }

  const data = buildReportData(payload);
  const existingReport = await communityRepository.findPostReportByReporterAndPostId(userId, id);

  if (existingReport) {
    throw conflictError('Community post report already exists');
  }

  try {
    const report = await communityRepository.createPostReport(id, userId, data);

    return sanitizeReport(report);
  } catch (error) {
    if (error?.code === 'P2002') {
      throw conflictError('Community post report already exists');
    }

    throw error;
  }
}

async function createCommentReport(commentId, userId, payload) {
  const id = parsePositiveInteger(commentId, 'commentId');
  const comment = await communityRepository.findCommentById(id);

  if (!comment) {
    throw notFoundError('Community comment not found');
  }

  const data = buildReportData(payload);
  const existingReport = await communityRepository.findCommentReportByReporterAndCommentId(
    userId,
    id
  );

  if (existingReport) {
    throw conflictError('Community comment report already exists');
  }

  try {
    const report = await communityRepository.createCommentReport(id, userId, data);

    return sanitizeReport(report);
  } catch (error) {
    if (error?.code === 'P2002') {
      throw conflictError('Community comment report already exists');
    }

    throw error;
  }
}

async function updatePost(postId, userId, payload) {
  const id = parsePositiveInteger(postId, 'postId');
  const post = await communityRepository.findPostByIdAndUserId(id, userId);

  if (!post) {
    throw notFoundError('Community post not found');
  }

  const data = buildPostData(payload, { partial: true });
  const updatedPost = await communityRepository.updatePost(id, userId, data);

  if (!updatedPost) {
    throw notFoundError('Community post not found');
  }

  return sanitizePost(updatedPost);
}

async function updateComment(commentId, userId, payload) {
  const id = parsePositiveInteger(commentId, 'commentId');
  const comment = await communityRepository.findCommentByIdAndUserId(id, userId);

  if (!comment) {
    throw notFoundError('Community comment not found');
  }

  const data = buildCommentData(payload);
  const updatedComment = await communityRepository.updateComment(id, userId, data);

  if (!updatedComment) {
    throw notFoundError('Community comment not found');
  }

  return sanitizeComment(updatedComment);
}

async function deletePost(postId, userId) {
  const id = parsePositiveInteger(postId, 'postId');
  const post = await communityRepository.findPostByIdAndUserId(id, userId);

  if (!post) {
    throw notFoundError('Community post not found');
  }

  const deletedCount = await communityRepository.deletePost(id, userId);

  if (deletedCount === 0) {
    throw notFoundError('Community post not found');
  }

  return { message: 'Community post deleted successfully' };
}

async function deleteComment(commentId, userId) {
  const id = parsePositiveInteger(commentId, 'commentId');
  const comment = await communityRepository.findCommentByIdAndUserId(id, userId);

  if (!comment) {
    throw notFoundError('Community comment not found');
  }

  const deletedCount = await communityRepository.deleteComment(id, userId);

  if (deletedCount === 0) {
    throw notFoundError('Community comment not found');
  }

  return { message: 'Community comment deleted successfully' };
}

async function deleteReaction(postId, userId) {
  const id = parsePositiveInteger(postId, 'postId');
  const post = await communityRepository.findPostById(id);

  if (!post) {
    throw notFoundError('Community post not found');
  }

  const deletedCount = await communityRepository.deleteReaction(id, userId);

  if (deletedCount === 0) {
    throw notFoundError('Community reaction not found');
  }

  return { message: 'Community reaction deleted successfully' };
}

async function deleteCommentReaction(commentId, userId) {
  const id = parsePositiveInteger(commentId, 'commentId');
  const comment = await communityRepository.findCommentById(id);

  if (!comment) {
    throw notFoundError('Community comment not found');
  }

  const deletedCount = await communityRepository.deleteCommentReaction(id, userId);

  if (deletedCount === 0) {
    throw notFoundError('Community comment reaction not found');
  }

  return { message: 'Community comment reaction deleted successfully' };
}

async function deleteBookmark(postId, userId) {
  const id = parsePositiveInteger(postId, 'postId');
  const post = await communityRepository.findPostById(id);

  if (!post) {
    throw notFoundError('Community post not found');
  }

  const deletedCount = await communityRepository.deleteBookmark(id, userId);

  if (deletedCount === 0) {
    throw notFoundError('Community bookmark not found');
  }

  return { message: 'Community bookmark deleted successfully' };
}

module.exports = {
  BOOKMARK_FIELDS,
  COMMENT_FIELDS,
  MAX_REPORT_REASON_LENGTH,
  POST_CATEGORIES,
  REACTION_TYPES,
  POST_SORTS,
  buildBookmarkData,
  buildBookmarkListOptions,
  buildCommentData,
  buildCommentListOptions,
  buildListOptions,
  buildPostData,
  buildReactionData,
  buildReportData,
  createBookmark,
  createComment,
  createCommentReaction,
  createCommentReport,
  createPost,
  createPostReport,
  createReaction,
  deleteBookmark,
  deleteComment,
  deleteCommentReaction,
  deletePost,
  deleteReaction,
  getPostById,
  listBookmarks,
  listComments,
  listPosts,
  sanitizeBookmark,
  sanitizeBookmarkListItem,
  sanitizeComment,
  sanitizePost,
  sanitizePostWithEngagement,
  sanitizeReaction,
  sanitizeReport,
  updateComment,
  updatePost
};
