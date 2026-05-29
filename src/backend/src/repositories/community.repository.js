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
  },
  _count: {
    select: {
      replies: true
    }
  }
};

const COMMENT_WITH_REPLIES_INCLUDE = {
  ...COMMENT_INCLUDE,
  replies: {
    include: COMMENT_INCLUDE,
    orderBy: {
      createdAt: 'asc'
    }
  }
};

const REACTION_SELECT = {
  id: true,
  postId: true,
  userId: true,
  type: true,
  createdAt: true,
  updatedAt: true
};

const COMMENT_REACTION_SELECT = {
  id: true,
  commentId: true,
  userId: true,
  type: true,
  createdAt: true,
  updatedAt: true
};

const BOOKMARK_SELECT = {
  id: true,
  postId: true,
  userId: true,
  createdAt: true
};

const REPORT_SELECT = {
  id: true,
  targetType: true,
  postId: true,
  commentId: true,
  reason: true,
  status: true,
  createdAt: true
};

const BOOKMARK_LIST_INCLUDE = {
  post: {
    include: POST_INCLUDE
  }
};

function buildPostWhere(filters = {}) {
  const where = {};

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.search) {
    where.OR = [
      {
        title: {
          contains: filters.search,
          mode: 'insensitive'
        }
      },
      {
        content: {
          contains: filters.search,
          mode: 'insensitive'
        }
      },
      {
        user: {
          name: {
            contains: filters.search,
            mode: 'insensitive'
          }
        }
      }
    ];
  }

  return where;
}

function buildPostOrderBy(sort = 'latest') {
  if (sort === 'views') {
    return [
      { viewCount: 'desc' },
      { createdAt: 'desc' }
    ];
  }

  if (sort === 'comments') {
    return [
      {
        comments: {
          _count: 'desc'
        }
      },
      { createdAt: 'desc' }
    ];
  }

  return {
    createdAt: sort === 'oldest' ? 'asc' : 'desc'
  };
}

async function findPosts({ page, pageSize, category, search, sort }) {
  const where = buildPostWhere({ category, search });
  const skip = (page - 1) * pageSize;

  if (sort === 'likes') {
    const [allPosts, total, likeCounts] = await Promise.all([
      prisma.boardPost.findMany({
        where,
        include: POST_INCLUDE
      }),
      prisma.boardPost.count({ where }),
      prisma.communityReaction.groupBy({
        by: ['postId'],
        where: {
          type: 'LIKE',
          post: where
        },
        _count: {
          id: true
        }
      })
    ]);
    const likeCountMap = new Map(likeCounts.map((row) => [row.postId, row._count.id]));
    const posts = allPosts
      .sort((a, b) => {
        const likeDelta = (likeCountMap.get(b.id) || 0) - (likeCountMap.get(a.id) || 0);

        if (likeDelta !== 0) {
          return likeDelta;
        }

        return b.createdAt.getTime() - a.createdAt.getTime();
      })
      .slice(skip, skip + pageSize);

    return { posts, total };
  }

  const orderBy = buildPostOrderBy(sort);

  const [posts, total] = await Promise.all([
    prisma.boardPost.findMany({
      where,
      include: POST_INCLUDE,
      orderBy,
      skip,
      take: pageSize
    }),
    prisma.boardPost.count({ where })
  ]);

  return { posts, total };
}

async function findPostEngagementSummaries(postIds, userId) {
  const ids = [...new Set(postIds.map(Number))].filter((id) => Number.isInteger(id) && id > 0);

  if (ids.length === 0) {
    return new Map();
  }

  const [reactionCounts, bookmarkCounts, currentUserReactions, currentUserBookmarks] =
    await Promise.all([
      prisma.communityReaction.groupBy({
        by: ['postId', 'type'],
        where: {
          postId: {
            in: ids
          }
        },
        _count: {
          id: true
        }
      }),
      prisma.communityBookmark.groupBy({
        by: ['postId'],
        where: {
          postId: {
            in: ids
          }
        },
        _count: {
          id: true
        }
      }),
      prisma.communityReaction.findMany({
        where: {
          postId: {
            in: ids
          },
          userId
        },
        select: {
          postId: true,
          type: true
        }
      }),
      prisma.communityBookmark.findMany({
        where: {
          postId: {
            in: ids
          },
          userId
        },
        select: {
          postId: true
        }
      })
    ]);

  const summaries = new Map(
    ids.map((id) => [
      id,
      {
        likeCount: 0,
        dislikeCount: 0,
        bookmarkCount: 0,
        myReaction: null,
        isBookmarked: false
      }
    ])
  );

  reactionCounts.forEach((row) => {
    const summary = summaries.get(row.postId);

    if (!summary) {
      return;
    }

    if (row.type === 'LIKE') {
      summary.likeCount = row._count.id;
    }

    if (row.type === 'DISLIKE') {
      summary.dislikeCount = row._count.id;
    }
  });

  bookmarkCounts.forEach((row) => {
    const summary = summaries.get(row.postId);

    if (summary) {
      summary.bookmarkCount = row._count.id;
    }
  });

  currentUserReactions.forEach((reaction) => {
    const summary = summaries.get(reaction.postId);

    if (summary) {
      summary.myReaction = reaction.type;
    }
  });

  currentUserBookmarks.forEach((bookmark) => {
    const summary = summaries.get(bookmark.postId);

    if (summary) {
      summary.isBookmarked = true;
    }
  });

  return summaries;
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

function incrementPostViewCount(postId) {
  return prisma.boardPost.update({
    where: { id: postId },
    data: {
      viewCount: {
        increment: 1
      }
    },
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

function findCommentById(commentId) {
  return prisma.comment.findUnique({
    where: { id: commentId },
    include: COMMENT_INCLUDE
  });
}

async function findCommentsByPostId({ postId, page, pageSize }) {
  const where = { postId, parentId: null };
  const skip = (page - 1) * pageSize;

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      include: COMMENT_WITH_REPLIES_INCLUDE,
      orderBy: { createdAt: 'asc' },
      skip,
      take: pageSize
    }),
    prisma.comment.count({ where })
  ]);

  return { comments, total };
}

async function findCommentReactionSummaries(commentIds, userId) {
  const ids = [...new Set(commentIds.map(Number))].filter((id) => Number.isInteger(id) && id > 0);

  if (ids.length === 0) {
    return new Map();
  }

  const [reactionCounts, currentUserReactions] = await Promise.all([
    prisma.commentReaction.groupBy({
      by: ['commentId', 'type'],
      where: {
        commentId: {
          in: ids
        }
      },
      _count: {
        id: true
      }
    }),
    prisma.commentReaction.findMany({
      where: {
        commentId: {
          in: ids
        },
        userId
      },
      select: {
        commentId: true,
        type: true
      }
    })
  ]);

  const summaries = new Map(
    ids.map((id) => [
      id,
      {
        likeCount: 0,
        dislikeCount: 0,
        myReaction: null
      }
    ])
  );

  reactionCounts.forEach((row) => {
    const summary = summaries.get(row.commentId);

    if (!summary) {
      return;
    }

    if (row.type === 'LIKE') {
      summary.likeCount = row._count.id;
    }

    if (row.type === 'DISLIKE') {
      summary.dislikeCount = row._count.id;
    }
  });

  currentUserReactions.forEach((reaction) => {
    const summary = summaries.get(reaction.commentId);

    if (summary) {
      summary.myReaction = reaction.type;
    }
  });

  return summaries;
}

async function findBookmarksByUserId({ userId, page, pageSize, sort = 'latest' }) {
  const where = { userId };
  const orderBy = {
    createdAt: sort === 'oldest' ? 'asc' : 'desc'
  };
  const skip = (page - 1) * pageSize;

  const [bookmarks, total] = await Promise.all([
    prisma.communityBookmark.findMany({
      where,
      include: BOOKMARK_LIST_INCLUDE,
      orderBy,
      skip,
      take: pageSize
    }),
    prisma.communityBookmark.count({ where })
  ]);

  return { bookmarks, total };
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

function upsertCommentReaction(commentId, userId, type) {
  return prisma.commentReaction.upsert({
    where: {
      commentId_userId: {
        commentId,
        userId
      }
    },
    update: {
      type
    },
    create: {
      commentId,
      userId,
      type
    },
    select: COMMENT_REACTION_SELECT
  });
}

function upsertReaction(postId, userId, type) {
  return prisma.communityReaction.upsert({
    where: {
      postId_userId: {
        postId,
        userId
      }
    },
    update: {
      type
    },
    create: {
      postId,
      userId,
      type
    },
    select: REACTION_SELECT
  });
}

function upsertBookmark(postId, userId) {
  return prisma.communityBookmark.upsert({
    where: {
      postId_userId: {
        postId,
        userId
      }
    },
    update: {},
    create: {
      postId,
      userId
    },
    select: BOOKMARK_SELECT
  });
}

function findPostReportByReporterAndPostId(reporterId, postId) {
  return prisma.communityReport.findFirst({
    where: {
      reporterId,
      postId
    },
    select: {
      id: true
    }
  });
}

function findCommentReportByReporterAndCommentId(reporterId, commentId) {
  return prisma.communityReport.findFirst({
    where: {
      reporterId,
      commentId
    },
    select: {
      id: true
    }
  });
}

function createPostReport(postId, reporterId, data) {
  return prisma.$transaction(async (tx) => {
    const report = await tx.communityReport.create({
      data: {
        reporterId,
        targetType: 'POST',
        postId,
        commentId: null,
        status: 'PENDING',
        reason: data.reason
      },
      select: REPORT_SELECT
    });

    await tx.boardPost.update({
      where: { id: postId },
      data: { reported: true }
    });

    return report;
  });
}

function createCommentReport(commentId, reporterId, data) {
  return prisma.$transaction(async (tx) => {
    const report = await tx.communityReport.create({
      data: {
        reporterId,
        targetType: 'COMMENT',
        postId: null,
        commentId,
        status: 'PENDING',
        reason: data.reason
      },
      select: REPORT_SELECT
    });

    await tx.comment.update({
      where: { id: commentId },
      data: { reported: true }
    });

    return report;
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

async function deleteCommentReaction(commentId, userId) {
  const result = await prisma.commentReaction.deleteMany({
    where: {
      commentId,
      userId
    }
  });

  return result.count;
}

async function deleteReaction(postId, userId) {
  const result = await prisma.communityReaction.deleteMany({
    where: {
      postId,
      userId
    }
  });

  return result.count;
}

async function deleteBookmark(postId, userId) {
  const result = await prisma.communityBookmark.deleteMany({
    where: {
      postId,
      userId
    }
  });

  return result.count;
}

module.exports = {
  createComment,
  createCommentReport,
  createPost,
  createPostReport,
  deleteBookmark,
  deleteCommentReaction,
  deleteReaction,
  deleteComment,
  deletePost,
  findCommentById,
  findCommentByIdAndUserId,
  findCommentReactionSummaries,
  findCommentReportByReporterAndCommentId,
  findBookmarksByUserId,
  findCommentsByPostId,
  findPostById,
  findPostByIdAndUserId,
  findPostEngagementSummaries,
  findPostReportByReporterAndPostId,
  findPosts,
  incrementPostViewCount,
  upsertBookmark,
  upsertCommentReaction,
  upsertReaction,
  updateComment,
  updatePost
};
