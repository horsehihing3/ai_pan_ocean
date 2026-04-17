const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

// [2026-04-17] 반기평가 설문 항목 (고정)
const QUESTIONS = [
  { id: 'q1',  category: '안전보건 관리', text: '작업 전 안전점검이 실시되고 있습니까?' },
  { id: 'q2',  category: '안전보건 관리', text: '안전보건 규정이 현장에 게시되어 있습니까?' },
  { id: 'q3',  category: '안전보건 관리', text: '적절한 보호구가 지급되고 착용이 이루어지고 있습니까?' },
  { id: 'q4',  category: '안전보건 교육', text: '정기 안전보건 교육이 실시되고 있습니까?' },
  { id: 'q5',  category: '안전보건 교육', text: '신규 입사자 안전교육이 이루어지고 있습니까?' },
  { id: 'q6',  category: '안전보건 교육', text: '작업별 안전수칙 교육이 충분히 이루어지고 있습니까?' },
  { id: 'q7',  category: '작업환경',     text: '작업장 정리정돈이 잘 유지되고 있습니까?' },
  { id: 'q8',  category: '작업환경',     text: '비상구 및 대피로가 항상 확보되어 있습니까?' },
  { id: 'q9',  category: '작업환경',     text: '작업장 조명·환기 등 환경이 적정하게 유지되고 있습니까?' },
  { id: 'q10', category: '의사소통',     text: '안전보건 관련 건의사항이 경영진에게 전달되고 있습니까?' },
  { id: 'q11', category: '의사소통',     text: '아차사고 및 위험 발굴 활동이 이루어지고 있습니까?' },
];

// [2026-04-17] 설문 항목 반환
const getQuestions = (req, res) => {
  res.json({ success: true, data: QUESTIONS });
};

// [2026-04-17] 반기평가 목록
// - PARTNER: 자사 목록
// - ADMIN: 전체 목록
const getSemiAnnuals = async (req, res) => {
  const { role, companyId } = req.user;
  const where = role === 'PARTNER' ? { companyId } : {};

  const list = await prisma.semiAnnualEvaluation.findMany({
    where,
    include: { company: { select: { name: true, bizNo: true } } },
    orderBy: [{ year: 'desc' }, { half: 'desc' }],
  });
  res.json({ success: true, data: list });
};

// [2026-04-17] 반기평가 단건 조회
const getSemiAnnual = async (req, res) => {
  const { id } = req.params;
  const { role, companyId } = req.user;

  const item = await prisma.semiAnnualEvaluation.findUnique({
    where: { id },
    include: { company: { select: { name: true, bizNo: true } } },
  });
  if (!item) throw new AppError('반기평가를 찾을 수 없습니다.', 404);
  if (role === 'PARTNER' && item.companyId !== companyId) throw new AppError('접근 권한이 없습니다.', 403);

  res.json({ success: true, data: item });
};

// [2026-04-17] 반기평가 생성 (임시저장, PARTNER)
const createSemiAnnual = async (req, res) => {
  const { companyId } = req.user;
  const { year, half, content, workerOpinion } = req.body;

  if (!year || !half) throw new AppError('연도와 반기를 입력해 주세요.');

  // 동일 기간 중복 방지
  const existing = await prisma.semiAnnualEvaluation.findFirst({
    where: { companyId, year: Number(year), half: Number(half) },
  });
  if (existing) throw new AppError('해당 기간의 반기평가가 이미 존재합니다.', 409);

  const item = await prisma.semiAnnualEvaluation.create({
    data: { companyId, year: Number(year), half: Number(half), content, workerOpinion },
  });
  res.status(201).json({ success: true, data: item });
};

// [2026-04-17] 반기평가 수정 (임시저장, PARTNER)
const updateSemiAnnual = async (req, res) => {
  const { id } = req.params;
  const { companyId } = req.user;
  const { content, workerOpinion } = req.body;

  const item = await prisma.semiAnnualEvaluation.findUnique({ where: { id } });
  if (!item) throw new AppError('반기평가를 찾을 수 없습니다.', 404);
  if (item.companyId !== companyId) throw new AppError('접근 권한이 없습니다.', 403);
  if (item.submittedAt) throw new AppError('이미 제출된 반기평가는 수정할 수 없습니다.', 400);

  const updated = await prisma.semiAnnualEvaluation.update({
    where: { id },
    data: { content, workerOpinion },
  });
  res.json({ success: true, data: updated });
};

// [2026-04-17] 반기평가 제출 (PARTNER)
const submitSemiAnnual = async (req, res) => {
  const { id } = req.params;
  const { companyId } = req.user;

  const item = await prisma.semiAnnualEvaluation.findUnique({ where: { id } });
  if (!item) throw new AppError('반기평가를 찾을 수 없습니다.', 404);
  if (item.companyId !== companyId) throw new AppError('접근 권한이 없습니다.', 403);
  if (item.submittedAt) throw new AppError('이미 제출된 반기평가입니다.', 400);

  const content = item.content;
  if (!content || typeof content !== 'object') throw new AppError('설문 항목을 모두 응답해 주세요.', 400);

  // 필수 항목 체크
  const answered = QUESTIONS.every((q) => content[q.id] && Number(content[q.id]) >= 1 && Number(content[q.id]) <= 5);
  if (!answered) throw new AppError('모든 설문 항목에 응답해 주세요.', 400);

  const updated = await prisma.semiAnnualEvaluation.update({
    where: { id },
    data: { submittedAt: new Date() },
  });
  res.json({ success: true, data: updated });
};

// [2026-04-17] 집계 (ADMIN) — 특정 연도·반기의 제출 현황 및 항목별 평균
const getSummary = async (req, res) => {
  const { year, half } = req.query;
  if (!year || !half) throw new AppError('연도와 반기를 입력해 주세요.');

  const submissions = await prisma.semiAnnualEvaluation.findMany({
    where: { year: Number(year), half: Number(half), submittedAt: { not: null } },
    include: { company: { select: { name: true, bizNo: true } } },
  });

  // 항목별 평균 점수 집계
  const totals = {};
  const counts = {};
  QUESTIONS.forEach((q) => { totals[q.id] = 0; counts[q.id] = 0; });

  submissions.forEach((s) => {
    const c = s.content;
    if (!c || typeof c !== 'object') return;
    QUESTIONS.forEach((q) => {
      const val = Number(c[q.id]);
      if (val >= 1 && val <= 5) { totals[q.id] += val; counts[q.id]++; }
    });
  });

  const averages = QUESTIONS.map((q) => ({
    ...q,
    avg: counts[q.id] > 0 ? Math.round((totals[q.id] / counts[q.id]) * 10) / 10 : null,
    count: counts[q.id],
  }));

  res.json({ success: true, data: { submissions, averages, total: submissions.length } });
};

module.exports = { getQuestions, getSemiAnnuals, getSemiAnnual, createSemiAnnual, updateSemiAnnual, submitSemiAnnual, getSummary };
