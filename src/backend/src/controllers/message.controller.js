const messageService = require('../services/message.service');
const { broadcastRealtimeEventToUsers } = require('../realtime/websocket.server');
const { sendCreated, sendSuccess } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

function buildMessageRealtimePayload(result) {
  return {
    thread: result.thread,
    message: result.message
  };
}

const listMessageThreadsController = asyncHandler(async (req, res) => {
  const threads = await messageService.listMessageThreads(req.user.id);

  sendSuccess(res, 200, { threads });
});

const getMessageThreadController = asyncHandler(async (req, res) => {
  const thread = await messageService.getMessageThread(req.user.id, req.params.threadId);

  sendSuccess(res, 200, { thread });
});

const startMessageThreadController = asyncHandler(async (req, res) => {
  const thread = await messageService.startMessageThread(req.user.id, req.body);

  sendCreated(res, { thread });
});

const sendDirectMessageController = asyncHandler(async (req, res) => {
  const result = await messageService.sendDirectMessage(req.user.id, req.params.threadId, req.body);

  broadcastRealtimeEventToUsers(
    result.participantIds,
    'directMessage.created',
    buildMessageRealtimePayload(result)
  );
  sendCreated(res, {
    message: result.message,
    thread: result.thread
  });
});

const markThreadReadController = asyncHandler(async (req, res) => {
  const result = await messageService.markThreadRead(req.user.id, req.params.threadId);

  broadcastRealtimeEventToUsers(result.participantIds, 'directMessage.read', {
    threadId: result.read.threadId,
    userId: result.read.userId,
    lastReadAt: result.read.lastReadAt,
    thread: result.thread
  });
  sendSuccess(res, 200, {
    read: result.read,
    thread: result.thread
  });
});

module.exports = {
  getMessageThread: getMessageThreadController,
  listMessageThreads: listMessageThreadsController,
  markThreadRead: markThreadReadController,
  sendDirectMessage: sendDirectMessageController,
  startMessageThread: startMessageThreadController
};
