const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

// [2026-04-17] 평가항목 목록 (활성)
const getEvaluationItems = async (req, res) => {
  const items = await prisma.evaluationItem.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
  });
  res.json({ success: true, data: items });
};

// [2026-04-17] 평가항목 생성 (관리자)
const createEvaluationItem = async (req, res) => {
  const { category, name, description, maxScore, order } = req.body;
  if (!category || !name) throw new AppError('카테고리와 항목명은 필수입니다.');

  const item = await prisma.evaluationItem.create({
    data: { category, name, description, maxScore: maxScore || 100, order: order || 0 },
  });
  res.status(201).json({ success: true, data: item });
};

// [2026-04-17] 평가항목 수정/삭제 (관리자)
const updateEvaluationItem = async (req, res) => {
  const { id } = req.params;
  const { category, name, description, maxScore, order, isActive } = req.body;

  const item = await prisma.evaluationItem.update({
    where: { id },
    data: { category, name, description, maxScore, order, isActive },
  });
  res.json({ success: true, data: item });
};

// [2026-04-17] 평가 목록
const getEvaluations = async (req, res) => {
  const { role, companyId } = req.user;
  const where =
    role === 'CONTRACT_DEPT' ? { evaluatorId: req.user.id } :
    role === 'PARTNER' ? { companyId } : {};

  const evaluations = await prisma.evaluation.findMany({
    where,
    include: {
      company: { select: { name: true, bizNo: true } },
      evaluator: { select: { name: true } },
      scores: { include: { item: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: evaluations });
};

// [2026-04-17] 평가 생성 (계약부서)
const createEvaluation = async (req, res) => {
  const { companyId, year, half, scores, overallResult } = req.body;

  if (!companyId || !year || !half) throw new AppError('필수 항목을 입력해 주세요.');

  const evaluation = await prisma.$transaction(async (tx) => {
    const eval_ = await tx.evaluation.create({
      data: { companyId, year, half, overallResult, evaluatorId: req.user.id },
    });

    if (scores && scores.length > 0) {
      await tx.evaluationScore.createMany({
        data: scores.map((s) => ({ evaluationId: eval_.id, itemId: s.itemId, score: s.score, note: s.note })),
      });
    }

    return eval_;
  });

  res.status(201).json({ success: true, data: evaluation });
};

// [2026-04-17] 평가 검토 (관리자)
const reviewEvaluation = async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!['IMPROVEMENT_REQUESTED', 'COMPLETED'].includes(status)) {
    throw new AppError('유효하지 않은 상태입니다.');
  }
  if (status === 'IMPROVEMENT_REQUESTED' && !note) throw new AppError('개선요청 사유를 입력해 주세요.');

  const updated = await prisma.evaluation.update({
    where: { id },
    data: { status, improvementNote: note || null, completedAt: status === 'COMPLETED' ? new Date() : null },
  });

  res.json({ success: true, data: updated });
};

module.exports = { getEvaluationItems, createEvaluationItem, updateEvaluationItem, getEvaluations, createEvaluation, reviewEvaluation };
