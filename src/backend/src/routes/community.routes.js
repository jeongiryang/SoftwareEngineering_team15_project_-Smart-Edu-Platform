const express = require('express');
const {
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
  updateComment,
  updatePost
} = require('../controllers/community.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/posts', authMiddleware, listPosts);
router.post('/posts', authMiddleware, createPost);
router.get('/bookmarks', authMiddleware, listBookmarks);
router.get('/posts/:postId/comments', authMiddleware, listComments);
router.post('/posts/:postId/comments', authMiddleware, createComment);
router.post('/posts/:postId/reactions', authMiddleware, createReaction);
router.delete('/posts/:postId/reactions', authMiddleware, deleteReaction);
router.post('/posts/:postId/bookmarks', authMiddleware, createBookmark);
router.delete('/posts/:postId/bookmarks', authMiddleware, deleteBookmark);
router.post('/posts/:postId/reports', authMiddleware, createPostReport);
router.get('/posts/:postId', authMiddleware, getPostById);
router.patch('/posts/:postId', authMiddleware, updatePost);
router.delete('/posts/:postId', authMiddleware, deletePost);
router.post('/comments/:commentId/reports', authMiddleware, createCommentReport);
router.post('/comments/:commentId/reactions', authMiddleware, createCommentReaction);
router.delete('/comments/:commentId/reactions', authMiddleware, deleteCommentReaction);
router.patch('/comments/:commentId', authMiddleware, updateComment);
router.delete('/comments/:commentId', authMiddleware, deleteComment);

module.exports = router;
