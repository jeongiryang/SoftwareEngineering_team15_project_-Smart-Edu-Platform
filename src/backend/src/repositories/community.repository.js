const prisma = require('../utils/prisma');

const POST_INCLUDE = {
  user: {
    select: {
      id: true,
      name: true
    }
  },
  _count: {
    select: {
      comments: true
    }
  }
};

const COMMENT_INCLUDE = {
  user: {
    select: {
      id: true,
      name: true
    }
  }
};

function buildPostWhere(filters = {}) {
  const where = {};

  if (filters.category) {
    where.category = filters.category;
  }

  return where;
}

async function findPosts({ page, pageSize, category }) {
  const where = buildPostWhere({ category });
  const skip = (page - 1) * pageSize;

  const [posts, total] = await Promise.all([
    prisma.boardPost.findMany({
      where,
      include: POST_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize
    }),
    prisma.boardPost.count({ where })
  ]);

  return { posts, total };
}

function createPost(userId, data) {
  return prisma.boardPost.create({
    data: {
      userId,
      ...data
    },
    include: POST_INCLUDE
  });
}

function findPostById(postId) {
  return prisma.boardPost.findUnique({
    where: { id: postId },
    include: POST_INCLUDE
  });
}

function findPostByIdAndUserId(postId, userId) {
  return prisma.boardPost.findFirst({
    where: {
      id: postId,
      userId
    },
    include: POST_INCLUDE
  });
}

async function findCommentsByPostId({ postId, page, pageSize }) {
  const where = { postId };
  const skip = (page - 1) * pageSize;

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      include: COMMENT_INCLUDE,
      orderBy: { createdAt: 'asc' },
      skip,
      take: pageSize
    }),
    prisma.comment.count({ where })
  ]);

  return { comments, total };
}

function createComment(postId, userId, data) {
  return prisma.comment.create({
    data: {
      postId,
      userId,
      ...data
    },
    include: COMMENT_INCLUDE
  });
}

function findCommentByIdAndUserId(commentId, userId) {
  return prisma.comment.findFirst({
    where: {
      id: commentId,
      userId
    },
    include: COMMENT_INCLUDE
  });
}

async function updatePost(postId, userId, data) {
  const result = await prisma.boardPost.updateMany({
    where: {
      id: postId,
      userId
    },
    data
  });

  if (result.count === 0) {
    return null;
  }

  return findPostByIdAndUserId(postId, userId);
}

async function updateComment(commentId, userId, data) {
  const result = await prisma.comment.updateMany({
    where: {
      id: commentId,
      userId
    },
    data
  });

  if (result.count === 0) {
    return null;
  }

  return findCommentByIdAndUserId(commentId, userId);
}

async function deletePost(postId, userId) {
  return prisma.$transaction(async (tx) => {
    const post = await tx.boardPost.findFirst({
      where: {
        id: postId,
        userId
      },
      select: {
        id: true
      }
    });

    if (!post) {
      return 0;
    }

    await tx.comment.deleteMany({
      where: { postId: post.id }
    });

    const result = await tx.boardPost.deleteMany({
      where: {
        id: post.id,
        userId
      }
    });

    return result.count;
  });
}

async function deleteComment(commentId, userId) {
  const result = await prisma.comment.deleteMany({
    where: {
      id: commentId,
      userId
    }
  });

  return result.count;
}

module.exports = {
  createComment,
  createPost,
  deleteComment,
  deletePost,
  findCommentByIdAndUserId,
  findCommentsByPostId,
  findPostById,
  findPostByIdAndUserId,
  findPosts,
  updateComment,
  updatePost
};
