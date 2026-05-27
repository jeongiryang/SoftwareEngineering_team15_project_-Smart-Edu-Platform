const express = require('express');
const {
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
  updateComment,
  updatePost
} = require('../controllers/community.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/posts', authMiddleware, listPosts);
router.post('/posts', authMiddleware, createPost);
router.get('/posts/:postId/comments', authMiddleware, listComments);
router.post('/posts/:postId/comments', authMiddleware, createComment);
router.post('/posts/:postId/reactions', authMiddleware, createReaction);
router.delete('/posts/:postId/reactions', authMiddleware, deleteReaction);
router.post('/posts/:postId/bookmarks', authMiddleware, createBookmark);
router.delete('/posts/:postId/bookmarks', authMiddleware, deleteBookmark);
router.get('/posts/:postId', authMiddleware, getPostById);
router.patch('/posts/:postId', authMiddleware, updatePost);
router.delete('/posts/:postId', authMiddleware, deletePost);
router.patch('/comments/:commentId', authMiddleware, updateComment);
router.delete('/comments/:commentId', authMiddleware, deleteComment);

module.exports = router;
