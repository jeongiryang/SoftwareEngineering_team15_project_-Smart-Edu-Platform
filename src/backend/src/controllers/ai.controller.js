const {
  askAIQuestion,
  generateAIRecommendation,
  summarizeText,
  analyzeWrongAnswer
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

module.exports = {
  askQuestion: askQuestionController,
  getRecommendation: getRecommendationController,
  summarize: summarizeController,
  analyzeWrongAnswer: analyzeWrongAnswerController
};
