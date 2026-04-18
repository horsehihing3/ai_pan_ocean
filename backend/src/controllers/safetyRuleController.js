const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

// [2026-04-18] 안전수칙 목록 조회 (전체 공개)
const getSafetyRules = async (req, res) => {
  const { industry } = req.query;
  const where = industry ? { industry } : {};
  const rules = await prisma.safetyRule.findMany({
    where,
    orderBy: [{ industry: 'asc' }, { order: 'asc' }],
  });
  res.json({ success: true, data: rules });
};

// [2026-04-18] 업종 목록 (중복 제거)
const getIndustries = async (req, res) => {
  const rules = await prisma.safetyRule.findMany({
    select: { industry: true },
    distinct: ['industry'],
    orderBy: { industry: 'asc' },
  });
  res.json({ success: true, data: rules.map((r) => r.industry) });
};

// [2026-04-18] 안전수칙 등록 (ADMIN)
const createSafetyRule = async (req, res) => {
  const { industry, title, content, order } = req.body;
  if (!industry || !title || !content) throw new AppError('업종, 제목, 내용은 필수입니다.');

  const rule = await prisma.safetyRule.create({
    data: { industry, title, content, order: order ? Number(order) : 0 },
  });
  res.status(201).json({ success: true, data: rule });
};

// [2026-04-18] 안전수칙 수정 (ADMIN)
const updateSafetyRule = async (req, res) => {
  const { id } = req.params;
  const { industry, title, content, order } = req.body;

  const existing = await prisma.safetyRule.findUnique({ where: { id } });
  if (!existing) throw new AppError('안전수칙을 찾을 수 없습니다.', 404);

  const rule = await prisma.safetyRule.update({
    where: { id },
    data: {
      industry: industry || undefined,
      title: title || undefined,
      content: content || undefined,
      order: order !== undefined ? Number(order) : undefined,
    },
  });
  res.json({ success: true, data: rule });
};

// [2026-04-18] 안전수칙 삭제 (ADMIN)
const deleteSafetyRule = async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.safetyRule.findUnique({ where: { id } });
  if (!existing) throw new AppError('안전수칙을 찾을 수 없습니다.', 404);
  await prisma.safetyRule.delete({ where: { id } });
  res.json({ success: true, message: '안전수칙이 삭제되었습니다.' });
};

module.exports = { getSafetyRules, getIndustries, createSafetyRule, updateSafetyRule, deleteSafetyRule };
