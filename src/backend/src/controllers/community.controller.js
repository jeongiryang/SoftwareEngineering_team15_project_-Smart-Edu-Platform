const communityService = require('../services/community.service');
const { sendCreated, sendSuccess } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

const listPostsController = asyncHandler(async (req, res) => {
  const result = await communityService.listPosts(req.query);

  sendSuccess(res, 200, result);
});

const createPostController = asyncHandler(async (req, res) => {
  const post = await communityService.createPost(req.user.id, req.body);

  sendCreated(res, { post });
});

const getPostByIdController = asyncHandler(async (req, res) => {
  const post = await communityService.getPostById(req.params.postId);

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

module.exports = {
  createPost: createPostController,
  deletePost: deletePostController,
  getPostById: getPostByIdController,
  listPosts: listPostsController,
  updatePost: updatePostController
};
