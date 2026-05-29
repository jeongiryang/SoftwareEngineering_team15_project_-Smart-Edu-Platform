const friendService = require('../services/friend.service');
const { getOnlineUserIds } = require('../realtime/websocket.server');
const { sendSuccess } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

const getFriendsController = asyncHandler(async (req, res) => {
  const friends = await friendService.getFriends(req.user.id);
  const onlineFriendIds = getOnlineUserIds(friends.map((friendship) => friendship.user?.id));

  sendSuccess(res, 200, { friends, onlineFriendIds });
});

const getFriendRequestsController = asyncHandler(async (req, res) => {
  const requests = await friendService.getFriendRequests(req.user.id);

  sendSuccess(res, 200, { requests });
});

const sendFriendRequestController = asyncHandler(async (req, res) => {
  const request = await friendService.sendFriendRequest(req.user.id, req.body);

  sendSuccess(res, 201, { request });
});

const respondToFriendRequestController = asyncHandler(async (req, res) => {
  const request = await friendService.respondToFriendRequest(req.user.id, req.params.requestId, req.body);

  sendSuccess(res, 200, { request });
});

const removeFriendController = asyncHandler(async (req, res) => {
  const friendship = await friendService.removeFriend(req.user.id, req.params.friendId);

  sendSuccess(res, 200, {
    message: 'Friend removed successfully',
    friendship
  });
});

module.exports = {
  getFriendRequests: getFriendRequestsController,
  getFriends: getFriendsController,
  removeFriend: removeFriendController,
  respondToFriendRequest: respondToFriendRequestController,
  sendFriendRequest: sendFriendRequestController
};
