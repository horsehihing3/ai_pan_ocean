const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

// [2026-04-17] 재해유형 목록
const INJURY_TYPES = ['골절', '타박상', '화상', '절상/열상', '협착', '추락', '감전', '직업병', '사망', '기타'];

const getInjuryTypes = (req, res) => {
  res.json({ success: true, data: INJURY_TYPES });
};

// [2026-04-17] 산업재해 목록
// - PARTNER: 자사만
// - ADMIN: 전체 (업체·기간 필터 지원)
const getAccidents = async (req, res) => {
  const { role, companyId } = req.user;
  const { companyId: filterCompany, year, injuryType } = req.query;

  const where = role === 'PARTNER' ? { companyId } : {};

  if (role === 'ADMIN') {
    if (filterCompany) where.companyId = filterCompany;
    if (injuryType) where.injuryType = injuryType;
    if (year) {
      where.occurredAt = {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${Number(year) + 1}-01-01`),
      };
    }
  }

  const accidents = await prisma.accident.findMany({
    where,
    include: { company: { select: { name: true, bizNo: true } } },
    orderBy: { occurredAt: 'desc' },
  });
  res.json({ success: true, data: accidents });
};

// [2026-04-17] 산업재해 단건 조회
const getAccident = async (req, res) => {
  const { id } = req.params;
  const { role, companyId } = req.user;

  const accident = await prisma.accident.findUnique({
    where: { id },
    include: { company: { select: { name: true, bizNo: true } } },
  });
  if (!accident) throw new AppError('재해 기록을 찾을 수 없습니다.', 404);
  if (role === 'PARTNER' && accident.companyId !== companyId) throw new AppError('접근 권한이 없습니다.', 403);

  res.json({ success: true, data: accident });
};

// [2026-04-17] 산업재해 신고 (PARTNER)
const createAccident = async (req, res) => {
  const { companyId } = req.user;
  const { occurredAt, location, description, workerName, injuryType, lostDays } = req.body;

  if (!occurredAt || !description) throw new AppError('발생일시와 재해 내용은 필수입니다.');

  const accident = await prisma.accident.create({
    data: {
      companyId,
      occurredAt: new Date(occurredAt),
      location,
      description,
      workerName,
      injuryType,
      lostDays: lostDays ? Number(lostDays) : null,
    },
    include: { company: { select: { name: true, bizNo: true } } },
  });
  res.status(201).json({ success: true, data: accident });
};

// [2026-04-17] 산업재해 수정 (PARTNER - 자사만)
const updateAccident = async (req, res) => {
  const { id } = req.params;
  const { companyId } = req.user;
  const { occurredAt, location, description, workerName, injuryType, lostDays } = req.body;

  const accident = await prisma.accident.findUnique({ where: { id } });
  if (!accident) throw new AppError('재해 기록을 찾을 수 없습니다.', 404);
  if (accident.companyId !== companyId) throw new AppError('접근 권한이 없습니다.', 403);

  const updated = await prisma.accident.update({
    where: { id },
    data: {
      occurredAt: occurredAt ? new Date(occurredAt) : undefined,
      location,
      description,
      workerName,
      injuryType,
      lostDays: lostDays !== undefined ? (lostDays ? Number(lostDays) : null) : undefined,
    },
    include: { company: { select: { name: true, bizNo: true } } },
  });
  res.json({ success: true, data: updated });
};

// [2026-04-17] 산업재해 삭제 (ADMIN 또는 자사 PARTNER)
const deleteAccident = async (req, res) => {
  const { id } = req.params;
  const { role, companyId } = req.user;

  const accident = await prisma.accident.findUnique({ where: { id } });
  if (!accident) throw new AppError('재해 기록을 찾을 수 없습니다.', 404);
  if (role === 'PARTNER' && accident.companyId !== companyId) throw new AppError('접근 권한이 없습니다.', 403);

  await prisma.accident.delete({ where: { id } });
  res.json({ success: true, message: '재해 기록이 삭제되었습니다.' });
};

// [2026-04-17] 연도별 통계 (ADMIN)
const getStats = async (req, res) => {
  const { year } = req.query;
  const targetYear = Number(year) || new Date().getFullYear();

  const accidents = await prisma.accident.findMany({
    where: {
      occurredAt: {
        gte: new Date(`${targetYear}-01-01`),
        lt: new Date(`${targetYear + 1}-01-01`),
      },
    },
    include: { company: { select: { name: true } } },
  });

  // 월별 집계
  const byMonth = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    count: accidents.filter((a) => new Date(a.occurredAt).getMonth() === i).length,
  }));

  // 재해유형별 집계
  const byType = INJURY_TYPES.map((type) => ({
    type,
    count: accidents.filter((a) => a.injuryType === type).length,
  })).filter((t) => t.count > 0);

  // 총 휴업일수
  const totalLostDays = accidents.reduce((s, a) => s + (a.lostDays || 0), 0);

  res.json({
    success: true,
    data: { total: accidents.length, totalLostDays, byMonth, byType },
  });
};

module.exports = { getInjuryTypes, getAccidents, getAccident, createAccident, updateAccident, deleteAccident, getStats };
