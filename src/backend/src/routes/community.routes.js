const express = require('express');
const {
  createPost,
  deletePost,
  getPostById,
  listPosts,
  updatePost
} = require('../controllers/community.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/posts', authMiddleware, listPosts);
router.post('/posts', authMiddleware, createPost);
router.get('/posts/:postId', authMiddleware, getPostById);
router.patch('/posts/:postId', authMiddleware, updatePost);
router.delete('/posts/:postId', authMiddleware, deletePost);

module.exports = router;
