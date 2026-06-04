const {
  addAIChatRoomMessage,
  analyzeStudyMaterialAttachment,
  askAIQuestion,
  createUserAIChatRoom,
  deleteUserAIChatRoom,
  generateAIRecommendation,
  listAIChatRooms,
  reviewImageAttachment,
  summarizeText,
  analyzeWrongAnswer,
  updateUserAIChatRoom
} = require('../services/ai.service');
const { sendCreated, sendSuccess } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

const askQuestionController = asyncHandler(async (req, res) => {
  const record = await askAIQuestion(req.user.id, req.body);
  sendCreated(res, { question: record });
});

const getRecommendationController = asyncHandler(async (req, res) => {
  const record = await generateAIRecommendation(req.user.id);
  sendCreated(res, { recommendation: record });
});

const summarizeController = asyncHandler(async (req, res) => {
  const result = await summarizeText(req.user.id, req.body);
  sendSuccess(res, 200, result);
});

const analyzeWrongAnswerController = asyncHandler(async (req, res) => {
  const record = await analyzeWrongAnswer(req.user.id, req.body);
  sendCreated(res, { wrongAnswerNote: record });
});

const reviewImageAttachmentController = asyncHandler(async (req, res) => {
  const result = await reviewImageAttachment(req.user.id, req.file);
  sendSuccess(res, 200, result);
});

const analyzeStudyMaterialAttachmentController = asyncHandler(async (req, res) => {
  const result = await analyzeStudyMaterialAttachment(req.user.id, req.file);
  sendSuccess(res, 200, result);
});

const listChatRoomsController = asyncHandler(async (req, res) => {
  const chatRooms = await listAIChatRooms(req.user.id);
  sendSuccess(res, 200, { chatRooms });
});

const createChatRoomController = asyncHandler(async (req, res) => {
  const chatRoom = await createUserAIChatRoom(req.user.id, req.body || {});
  sendCreated(res, { chatRoom });
});

const createChatMessageController = asyncHandler(async (req, res) => {
  const result = await addAIChatRoomMessage(req.user.id, req.params.roomId, req.body);
  sendCreated(res, result);
});

const updateChatRoomController = asyncHandler(async (req, res) => {
  const chatRoom = await updateUserAIChatRoom(req.user.id, req.params.roomId, req.body || {});
  sendSuccess(res, 200, { chatRoom });
});

const deleteChatRoomController = asyncHandler(async (req, res) => {
  const result = await deleteUserAIChatRoom(req.user.id, req.params.roomId);
  sendSuccess(res, 200, result);
});

module.exports = {
  addChatRoomMessage: createChatMessageController,
  askQuestion: askQuestionController,
  createChatRoom: createChatRoomController,
  deleteChatRoom: deleteChatRoomController,
  getRecommendation: getRecommendationController,
  reviewImageAttachment: reviewImageAttachmentController,
  listChatRooms: listChatRoomsController,
  analyzeStudyMaterialAttachment: analyzeStudyMaterialAttachmentController,
  summarize: summarizeController,
  analyzeWrongAnswer: analyzeWrongAnswerController,
  updateChatRoom: updateChatRoomController
};
