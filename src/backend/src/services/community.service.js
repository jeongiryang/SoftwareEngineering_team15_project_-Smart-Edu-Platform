const communityRepository = require('../repositories/community.repository');
const { notFoundError, validationError } = require('../utils/errors');
const { normalizeString, parsePositiveInteger, requireFields } = require('../utils/validators');

const POST_CATEGORIES = ['QUESTION', 'FREE', 'STUDY_PROOF'];
const POST_FIELDS = ['category', 'title', 'content'];
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

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

  return {
    page,
    pageSize,
    category
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

module.exports = {
  POST_CATEGORIES,
  buildListOptions,
  buildPostData,
  createPost,
  deletePost,
  getPostById,
  listPosts,
  sanitizePost,
  updatePost
};
