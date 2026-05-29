const communityService = require('../services/community.service');
const { broadcastRealtimeEvent } = require('../realtime/websocket.server');
const { sendCreated, sendSuccess } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

function buildCommentRealtimePayload(comment) {
  const preview = typeof comment.content === 'string'
    ? comment.content.replace(/\s+/g, ' ').trim().slice(0, 80)
    : '';

  return {
    postId: comment.postId,
    commentId: comment.id,
    parentId: comment.parentId ?? null,
    isReply: Boolean(comment.parentId),
    author: comment.author
      ? {
          id: comment.author.id,
          name: comment.author.name
        }
      : null,
    preview,
    createdAt: comment.createdAt
  };
}

const listPostsController = asyncHandler(async (req, res) => {
  const result = await communityService.listPosts(req.query, req.user.id);

  sendSuccess(res, 200, result);
});

const listBookmarksController = asyncHandler(async (req, res) => {
  const result = await communityService.listBookmarks(req.query, req.user.id);

  sendSuccess(res, 200, result);
});

const createPostController = asyncHandler(async (req, res) => {
  const post = await communityService.createPost(req.user.id, req.body);

  sendCreated(res, { post });
});

const createReactionController = asyncHandler(async (req, res) => {
  const reaction = await communityService.createReaction(req.params.postId, req.user.id, req.body);

  sendCreated(res, { reaction });
});

const createCommentReactionController = asyncHandler(async (req, res) => {
  const reaction = await communityService.createCommentReaction(
    req.params.commentId,
    req.user.id,
    req.body
  );

  sendCreated(res, { reaction });
});

const createBookmarkController = asyncHandler(async (req, res) => {
  const bookmark = await communityService.createBookmark(req.params.postId, req.user.id, req.body);

  sendCreated(res, { bookmark });
});

const createPostReportController = asyncHandler(async (req, res) => {
  const report = await communityService.createPostReport(req.params.postId, req.user.id, req.body);

  sendCreated(res, { report });
});

const createCommentReportController = asyncHandler(async (req, res) => {
  const report = await communityService.createCommentReport(
    req.params.commentId,
    req.user.id,
    req.body
  );

  sendCreated(res, { report });
});

const listCommentsController = asyncHandler(async (req, res) => {
  const result = await communityService.listComments(req.params.postId, req.query, req.user.id);

  sendSuccess(res, 200, result);
});

const createCommentController = asyncHandler(async (req, res) => {
  const comment = await communityService.createComment(req.params.postId, req.user.id, req.body);
  const eventType = comment.parentId ? 'community.reply.created' : 'community.comment.created';

  broadcastRealtimeEvent(eventType, {
    comment: buildCommentRealtimePayload(comment)
  });

  sendCreated(res, { comment });
});

const getPostByIdController = asyncHandler(async (req, res) => {
  const post = await communityService.getPostById(req.params.postId, req.user.id);

  sendSuccess(res, 200, { post });
});

const updatePostController = asyncHandler(async (req, res) => {
  const post = await communityService.updatePost(req.params.postId, req.user.id, req.body);

  sendSuccess(res, 200, { post });
});

const deletePostController = asyncHandler(async (req, res) => {
  const result = await communityService.deletePost(req.params.postId, req.user.id);

  sendSuccess(res, 200, result);
});

const deleteReactionController = asyncHandler(async (req, res) => {
  const result = await communityService.deleteReaction(req.params.postId, req.user.id);

  sendSuccess(res, 200, result);
});

const deleteCommentReactionController = asyncHandler(async (req, res) => {
  const result = await communityService.deleteCommentReaction(req.params.commentId, req.user.id);

  sendSuccess(res, 200, result);
});

const deleteBookmarkController = asyncHandler(async (req, res) => {
  const result = await communityService.deleteBookmark(req.params.postId, req.user.id);

  sendSuccess(res, 200, result);
});

const updateCommentController = asyncHandler(async (req, res) => {
  const comment = await communityService.updateComment(req.params.commentId, req.user.id, req.body);

  sendSuccess(res, 200, { comment });
});

const deleteCommentController = asyncHandler(async (req, res) => {
  const result = await communityService.deleteComment(req.params.commentId, req.user.id);

  sendSuccess(res, 200, result);
});

module.exports = {
  createBookmark: createBookmarkController,
  createComment: createCommentController,
  createCommentReaction: createCommentReactionController,
  createCommentReport: createCommentReportController,
  createPost: createPostController,
  createPostReport: createPostReportController,
  createReaction: createReactionController,
  deleteBookmark: deleteBookmarkController,
  deleteComment: deleteCommentController,
  deleteCommentReaction: deleteCommentReactionController,
  deletePost: deletePostController,
  deleteReaction: deleteReactionController,
  getPostById: getPostByIdController,
  listBookmarks: listBookmarksController,
  listComments: listCommentsController,
  listPosts: listPostsController,
  updateComment: updateCommentController,
  updatePost: updatePostController
};
