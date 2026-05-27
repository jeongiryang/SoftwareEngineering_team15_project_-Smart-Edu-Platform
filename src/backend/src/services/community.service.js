const communityRepository = require('../repositories/community.repository');
const { notFoundError, validationError } = require('../utils/errors');
const { normalizeString, parsePositiveInteger, requireFields } = require('../utils/validators');

const POST_CATEGORIES = ['QUESTION', 'FREE', 'STUDY_PROOF'];
const POST_FIELDS = ['category', 'title', 'content'];
const POST_SORTS = ['latest', 'oldest'];
const COMMENT_FIELDS = ['content'];
const REACTION_FIELDS = ['type'];
const REACTION_TYPES = ['LIKE', 'DISLIKE'];
const BOOKMARK_FIELDS = [];
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const MAX_SEARCH_LENGTH = 100;

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

function sanitizeComment(comment) {
  if (!comment) {
    return null;
  }

  return {
    id: comment.id,
    postId: comment.postId,
    userId: comment.userId,
    content: comment.content,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    author: comment.user
      ? {
          id: comment.user.id,
          name: comment.user.name
        }
      : null
  };
}

function sanitizeReaction(reaction) {
  if (!reaction) {
    return null;
  }

  return {
    id: reaction.id,
    postId: reaction.postId,
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

  return {
    content: normalizeRequiredStringField(payload.content, 'content')
  };
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

async function listPosts(query) {
  const options = buildListOptions(query);
  const { posts, total } = await communityRepository.findPosts(options);
  const totalPages = Math.ceil(total / options.pageSize);

  return {
    posts: posts.map(sanitizePost),
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

async function getPostById(postId) {
  const id = parsePositiveInteger(postId, 'postId');
  const post = await communityRepository.findPostById(id);

  if (!post) {
    throw notFoundError('Community post not found');
  }

  return sanitizePost(post);
}

async function listComments(postId, query) {
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
  const totalPages = Math.ceil(total / options.pageSize);

  return {
    comments: comments.map(sanitizeComment),
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
  POST_CATEGORIES,
  REACTION_TYPES,
  POST_SORTS,
  buildBookmarkData,
  buildCommentData,
  buildCommentListOptions,
  buildListOptions,
  buildPostData,
  buildReactionData,
  createBookmark,
  createComment,
  createPost,
  createReaction,
  deleteBookmark,
  deleteComment,
  deletePost,
  deleteReaction,
  getPostById,
  listComments,
  listPosts,
  sanitizeBookmark,
  sanitizeComment,
  sanitizePost,
  sanitizeReaction,
  updateComment,
  updatePost
};
