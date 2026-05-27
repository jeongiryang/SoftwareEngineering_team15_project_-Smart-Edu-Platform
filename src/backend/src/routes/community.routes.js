const express = require('express');
const {
  createComment,
  createPost,
  deleteComment,
  deletePost,
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
router.get('/posts/:postId', authMiddleware, getPostById);
router.patch('/posts/:postId', authMiddleware, updatePost);
router.delete('/posts/:postId', authMiddleware, deletePost);
router.patch('/comments/:commentId', authMiddleware, updateComment);
router.delete('/comments/:commentId', authMiddleware, deleteComment);

module.exports = router;
