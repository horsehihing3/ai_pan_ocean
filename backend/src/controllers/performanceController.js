const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

// [2026-04-18] 안전보건실적 카테고리 목록
const CATEGORIES = [
  '안전교육 이수율',
  '위험성평가 완료율',
  'TBM 실시율',
  '아차사고 건수',
  '안전점검 횟수',
  '안전제안 건수',
  '산업재해 건수',
  '휴업재해 건수',
  '기타',
];

const getCategories = (req, res) => {
  res.json({ success: true, data: CATEGORIES });
};

// [2026-04-18] 실적 목록 조회 (ADMIN/CONTRACT_DEPT)
const getPerformances = async (req, res) => {
  const { year, month, department } = req.query;

  const where = {};
  if (year) where.year = Number(year);
  if (month) where.month = Number(month);
  if (department) where.department = { contains: department };

  const performances = await prisma.safetyPerformance.findMany({
    where,
    orderBy: [{ year: 'desc' }, { month: 'desc' }, { department: 'asc' }, { category: 'asc' }],
  });
  res.json({ success: true, data: performances });
};

// [2026-04-18] 연도별 월별 집계 (ADMIN)
const getSummary = async (req, res) => {
  const { year } = req.query;
  const targetYear = Number(year) || new Date().getFullYear();

  const performances = await prisma.safetyPerformance.findMany({
    where: { year: targetYear },
    orderBy: [{ month: 'asc' }, { department: 'asc' }],
  });

  // 부서별 집계
  const departments = [...new Set(performances.map((p) => p.department))];

  // 카테고리별 집계
  const categories = [...new Set(performances.map((p) => p.category))];

  // 월별 합계
  const byMonth = Array.from({ length: 12 }, (_, i) => {
    const monthData = performances.filter((p) => p.month === i + 1);
    return {
      month: i + 1,
      count: monthData.length,
      entries: monthData,
    };
  });

  res.json({
    success: true,
    data: { year: targetYear, departments, categories, byMonth, total: performances.length },
  });
};

// [2026-04-18] 실적 등록 (CONTRACT_DEPT)
const createPerformance = async (req, res) => {
  const { year, month, department, category, value, note } = req.body;

  if (!year || !month || !department || !category || value === undefined) {
    throw new AppError('연도, 월, 부서, 카테고리, 실적값은 필수입니다.');
  }
  if (month < 1 || month > 12) throw new AppError('월은 1~12 사이여야 합니다.');

  const performance = await prisma.safetyPerformance.create({
    data: {
      year: Number(year),
      month: Number(month),
      department,
      category,
      value: Number(value),
      note: note || null,
    },
  });
  res.status(201).json({ success: true, data: performance });
};

// [2026-04-18] 실적 수정 (CONTRACT_DEPT)
const updatePerformance = async (req, res) => {
  const { id } = req.params;
  const { year, month, department, category, value, note } = req.body;

  const existing = await prisma.safetyPerformance.findUnique({ where: { id } });
  if (!existing) throw new AppError('실적 기록을 찾을 수 없습니다.', 404);

  const updated = await prisma.safetyPerformance.update({
    where: { id },
    data: {
      year: year ? Number(year) : undefined,
      month: month ? Number(month) : undefined,
      department: department || undefined,
      category: category || undefined,
      value: value !== undefined ? Number(value) : undefined,
      note: note !== undefined ? (note || null) : undefined,
    },
  });
  res.json({ success: true, data: updated });
};

// [2026-04-18] 실적 삭제 (CONTRACT_DEPT / ADMIN)
const deletePerformance = async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.safetyPerformance.findUnique({ where: { id } });
  if (!existing) throw new AppError('실적 기록을 찾을 수 없습니다.', 404);

  await prisma.safetyPerformance.delete({ where: { id } });
  res.json({ success: true, message: '실적 기록이 삭제되었습니다.' });
};

module.exports = { getCategories, getPerformances, getSummary, createPerformance, updatePerformance, deletePerformance };
