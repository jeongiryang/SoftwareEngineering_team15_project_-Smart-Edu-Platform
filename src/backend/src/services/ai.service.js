const {
  createAIQuestion,
  createAIRecommendation,
  createWrongAnswerNote
} = require('../repositories/ai.repository');
const { findSchedulesByUserId } = require('../repositories/schedule.repository');
const { findTasksByUserId } = require('../repositories/task.repository');
const { AppError, validationError } = require('../utils/errors');
const { normalizeString } = require('../utils/validators');

const rateLimitMap = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  if (!rateLimitMap.has(userId)) {
    rateLimitMap.set(userId, [now]);
    return;
  }

  const timestamps = rateLimitMap.get(userId);
  const recentTimestamps = timestamps.filter(t => t > oneMinuteAgo);

  if (recentTimestamps.length >= 5) {
    throw new AppError(
      'AI 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요. (분당 최대 5회)',
      429,
      'TOO_MANY_REQUESTS'
    );
  }

  recentTimestamps.push(now);
  rateLimitMap.set(userId, recentTimestamps);
}

// Simulated AI (Fallback Mock Generators)
function getMockQuestionAnswer(question) {
  const q = (question || '').toLowerCase();
  if (q.includes('수학') || q.includes('방정식') || q.includes('더하기') || q.includes('나눗셈') || q.includes('계산')) {
    return '수학 질문에 대한 답변입니다: 수학 문제를 풀 때는 먼저 공식의 원리를 완벽하게 이해하는 것이 중요합니다. 단순히 암기하기보다는 유도 과정을 직접 적어보며 원리를 파악한 후, 기본 예제부터 응용문제 순으로 확장하며 연습해 보시기 바랍니다.';
  }
  if (q.includes('영어') || q.includes('단어') || q.includes('문법') || q.includes('독해')) {
    return '영어 질문에 대한 답변입니다: 영어 학습에서는 매일 꾸준히 어휘를 암기하고 문장 구조를 독해하는 습관이 핵심입니다. 문법은 문맥 속에서 어떻게 쓰이는지 다양한 예문으로 익히고, 짧은 글이라도 소리 내어 읽으며 구조를 체득해 보세요.';
  }
  return `질문하신 "${question}"에 대한 학습 가이드입니다: 해당 주제의 핵심 개념을 먼저 정리하고, 잘 이해되지 않는 용어를 교재나 요약 노트를 통해 재확인하세요. 관련 오답 정리를 함께 병행하면 학습 효과가 배가됩니다.`;
}

function getMockRecommendation(schedules = [], tasks = []) {
  let recommendedSubject = '수학 및 핵심 전공';
  const tips = [
    '학습 스케줄에 비어있는 오후 시간대를 집중 자습 시간으로 확보해 보세요.',
    '미완료된 칸반 태스크들을 중요도 순으로 나누어 우선순위가 높은 작업부터 완수하세요.',
    '피로가 누적되지 않도록 50분 집중 후 10분 휴식 패턴을 유지하세요.'
  ];

  if (schedules.length > 0) {
    const subjects = schedules.map(s => s.subject).filter(Boolean);
    if (subjects.length > 0) {
      recommendedSubject = subjects[0] + ' 복습 및 정리';
    }
  }

  return { tips, recommendedSubject };
}

function getMockSummary(content) {
  const lines = [
    '제시된 학습 자료의 핵심 정의와 컴퓨터 자원 배분의 핵심 역할을 파악해야 합니다.',
    '주요 개념들 간의 유기적인 관계를 파악하고 반복 학습으로 개념을 체득해야 합니다.',
    '이론 습득 후 학습 성취도를 높이기 위해 관련 실전 예제를 직접 풀이해 보세요.'
  ];
  return lines.map(l => `- ${l}`).join('\n');
}

function getMockWrongAnswerAnalysis(problem, userAnswer) {
  let weakType = '기본 개념 미흡';
  let explanation = '입력된 문제를 분석한 결과, 풀이 과정 중 개념 이해에 혼동이 있었던 것으로 나타납니다. 공식의 원리와 적용 방법을 다시 검토하세요.';

  const lowerProblem = (problem || '').toLowerCase();

  if (lowerProblem.includes('+') || lowerProblem.includes('-') || lowerProblem.includes('*') || lowerProblem.includes('/') || lowerProblem.includes('계산') || lowerProblem.includes('더하기') || lowerProblem.includes('빼기') || lowerProblem.includes('나눗셈')) {
    weakType = '연산 실수';
    explanation = `[연산 실수 분석] 문제 "${problem}"에 대해 "${userAnswer || ''}"라는 답을 도출한 것은 사칙연산 혹은 단순 부호 계산 오류일 가능성이 높습니다. 풀이 과정을 한 줄씩 차분히 검토해 보시기 바랍니다.`;
  } else if (lowerProblem.includes('정의') || lowerProblem.includes('원리') || lowerProblem.includes('뜻') || lowerProblem.includes('개념')) {
    weakType = '개념 오해';
    explanation = `[개념 오해 분석] "${problem}"의 주요 수학/과학적 정의와 성질을 충분히 숙지하지 못하여 발생한 오답일 수 있습니다. 기본 이론교재의 대표 예제 풀이를 먼저 복습하시는 것을 추천합니다.`;
  }

  return { explanation, weakType };
}

// Gemini API Wrapper (default: gemini-2.5-flash; override via AI_MODEL_NAME in .env)
const GEMINI_MODEL = process.env.AI_MODEL_NAME || 'gemini-2.5-flash';

async function callGeminiAPI(prompt, isJson = false) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error('AI API key is missing');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.5,
        responseMimeType: isJson ? 'application/json' : 'text/plain',
        // gemini-2.5-* uses "thinking" tokens; disable so maxOutputTokens applies to the answer
        thinkingConfig: { thinkingBudget: 0 }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Gemini API failed with status ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Invalid structure returned from Gemini API');
  }

  return text;
}

// API Functions
async function askAIQuestion(userId, payload) {
  checkRateLimit(userId);

  if (!payload || typeof payload !== 'object') {
    throw validationError('Payload must be an object');
  }

  const rawQuestion = normalizeString(payload.question);
  if (!rawQuestion) {
    throw validationError('question is required');
  }

  const maxLength = 1000;
  let question = rawQuestion;
  let isTruncated = false;

  if (question.length > maxLength) {
    if (payload.allowTruncate === true) {
      question = question.substring(0, maxLength);
      isTruncated = true;
    } else {
      throw validationError(`질문은 최대 ${maxLength}자까지 입력 가능합니다.`, {
        field: 'question',
        currentLength: rawQuestion.length,
        maxLength
      });
    }
  }

  const noteId = payload.noteId ? parseInt(payload.noteId, 10) : null;
  let answer;

  try {
    const prompt = `You are a helpful AI study assistant. The student is asking: "${question}". Please provide a helpful, concise explanation in Korean within 3-4 sentences.`;
    answer = await callGeminiAPI(prompt);
  } catch (error) {
    console.warn('[AI Service] Gemini call failed, using simulated response:', error.message);
    answer = getMockQuestionAnswer(question);
  }

  const record = await createAIQuestion(userId, {
    question,
    answer,
    noteId: isNaN(noteId) ? null : noteId
  });

  return {
    ...record,
    isTruncated,
    originalLength: rawQuestion.length,
    maxLength
  };
}

async function generateAIRecommendation(userId) {
  checkRateLimit(userId);

  const schedules = await findSchedulesByUserId(userId);
  const tasks = await findTasksByUserId(userId);

  const scheduleInfo = schedules
    .slice(0, 5)
    .map(s => `Title: ${s.title}, Subject: ${s.subject || 'None'}`)
    .join('; ');
  const taskInfo = tasks
    .slice(0, 10)
    .map(t => `Title: ${t.title}, Status: ${t.status}`)
    .join('; ');

  let basisJson = {
    scheduleCount: schedules.length,
    taskCount: tasks.length,
    recentSchedules: schedules.slice(0, 3).map(s => ({ title: s.title, subject: s.subject })),
    recentTasks: tasks.slice(0, 5).map(t => ({ title: t.title, status: t.status }))
  };

  let recommendationJson;

  try {
    const prompt = `Analyze the user's study schedules: [${scheduleInfo}] and tasks: [${taskInfo}].
Generate a personalized study recommendation and tips in Korean.
Return a valid JSON object matching this schema:
{
  "tips": ["tip1 string", "tip2 string", "tip3 string"],
  "recommendedSubject": "string subject"
}
Ensure the output is valid JSON and do not wrap in markdown code blocks.`;

    const rawText = await callGeminiAPI(prompt, true);
    let cleanText = rawText.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
    }
    recommendationJson = JSON.parse(cleanText);
  } catch (error) {
    console.warn('[AI Service] Gemini recommendation call failed, using simulated response:', error.message);
    recommendationJson = getMockRecommendation(schedules, tasks);
  }

  const record = await createAIRecommendation(userId, {
    basisJson,
    recommendationJson
  });

  return record;
}

async function summarizeText(userId, payload) {
  checkRateLimit(userId);

  if (!payload || typeof payload !== 'object') {
    throw validationError('Payload must be an object');
  }

  const rawContent = normalizeString(payload.content);
  if (!rawContent) {
    throw validationError('content is required');
  }

  const maxLength = 3000;
  let content = rawContent;
  let isTruncated = false;

  if (content.length > maxLength) {
    if (payload.allowTruncate === true) {
      content = content.substring(0, maxLength);
      isTruncated = true;
    } else {
      throw validationError(`요약할 본문은 최대 ${maxLength}자까지 입력 가능합니다.`, {
        field: 'content',
        currentLength: rawContent.length,
        maxLength
      });
    }
  }

  let summary;

  try {
    const prompt = `Summarize the following study content into 3 key bullet points in Korean. Provide only the 3 bullet points, each on a new line starting with "- ". Content: "${content}"`;
    summary = await callGeminiAPI(prompt);
  } catch (error) {
    console.warn('[AI Service] Gemini summary call failed, using simulated response:', error.message);
    summary = getMockSummary(content);
  }

  return {
    summary,
    isTruncated,
    originalLength: rawContent.length,
    maxLength
  };
}

async function analyzeWrongAnswer(userId, payload) {
  checkRateLimit(userId);

  if (!payload || typeof payload !== 'object') {
    throw validationError('Payload must be an object');
  }

  const rawProblem = normalizeString(payload.problem);
  if (!rawProblem) {
    throw validationError('problem is required');
  }

  const rawUserAnswer = normalizeString(payload.userAnswer) || null;

  const maxLength = 1000;
  let problem = rawProblem;
  let userAnswer = rawUserAnswer;
  let isProblemTruncated = false;
  let isUserAnswerTruncated = false;

  if (problem.length > maxLength) {
    if (payload.allowTruncate === true) {
      problem = problem.substring(0, maxLength);
      isProblemTruncated = true;
    } else {
      throw validationError(`문제 본문은 최대 ${maxLength}자까지 입력 가능합니다.`, {
        field: 'problem',
        currentLength: rawProblem.length,
        maxLength
      });
    }
  }

  if (userAnswer && userAnswer.length > maxLength) {
    if (payload.allowTruncate === true) {
      userAnswer = userAnswer.substring(0, maxLength);
      isUserAnswerTruncated = true;
    } else {
      throw validationError(`사용자 답안은 최대 ${maxLength}자까지 입력 가능합니다.`, {
        field: 'userAnswer',
        currentLength: rawUserAnswer.length,
        maxLength
      });
    }
  }

  const noteId = payload.noteId ? parseInt(payload.noteId, 10) : null;

  let explanation;
  let weakType;

  try {
    const prompt = `Analyze the following incorrect answer.
Problem: "${problem}"
User Answer: "${userAnswer || 'None'}"
Please explain why the user's answer is wrong and diagnose their weakness type.
Return a valid JSON object matching this schema:
{
  "explanation": "string explaining the error and correct approach in Korean",
  "weakType": "string weakness category (e.g. 연산 실수, 개념 오해, 문제 이해 부족)"
}
Ensure the output is valid JSON and do not wrap in markdown code blocks.`;

    const rawText = await callGeminiAPI(prompt, true);
    let cleanText = rawText.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
    }
    const parsed = JSON.parse(cleanText);
    explanation = parsed.explanation;
    weakType = parsed.weakType;
  } catch (error) {
    console.warn('[AI Service] Gemini wrong answer call failed, using simulated response:', error.message);
    const mock = getMockWrongAnswerAnalysis(problem, userAnswer);
    explanation = mock.explanation;
    weakType = mock.weakType;
  }

  const record = await createWrongAnswerNote(userId, {
    problem,
    userAnswer,
    explanation,
    weakType,
    noteId: isNaN(noteId) ? null : noteId
  });

  return {
    ...record,
    isProblemTruncated,
    isUserAnswerTruncated,
    originalProblemLength: rawProblem.length,
    originalUserAnswerLength: rawUserAnswer ? rawUserAnswer.length : 0,
    maxLength
  };
}

module.exports = {
  askAIQuestion,
  generateAIRecommendation,
  summarizeText,
  analyzeWrongAnswer,
  checkRateLimit,
  rateLimitMap
};
