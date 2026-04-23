const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');
const { sendOpinionNotifyToAdmin } = require('../utils/email');

const ADMIN_EMAIL = process.env.EMAIL_USER;

// [2026-04-23] 근로자 의견조회

// PARTNER: 의견 등록
const createOpinion = async (req, res) => {
  const { type, title, content, isAnonymous, consentAgreed } = req.body;
  const userId = req.user.id;

  if (!type || !title?.trim() || !content?.trim()) {
    throw new AppError('구분, 제목, 내용은 필수입니다.');
  }
  if (!consentAgreed) {
    throw new AppError('개인정보 수집·이용에 동의해야 합니다.');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { company: true },
  });
  if (!user?.company) throw new AppError('소속 업체 정보가 없습니다.');

  const opinion = await prisma.workerOpinion.create({
    data: {
      type,
      title: title.trim(),
      content: content.trim(),
      isAnonymous: isAnonymous ?? false,
      consentAgreed: true,
      companyId: user.company.id,
      submittedById: userId,
    },
  });

  // 팀메일 발송 (실패해도 등록은 유지)
  try {
    await sendOpinionNotifyToAdmin({
      adminEmail: ADMIN_EMAIL,
      companyName: user.company.name,
      type,
      title: title.trim(),
    });
  } catch (e) {
    console.error('[Opinion] 이메일 발송 실패:', e.message);
  }

  res.status(201).json({ success: true, data: opinion });
};

// PARTNER: 본인 업체 의견 목록
const getMyOpinions = async (req, res) => {
  const userId = req.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });
  if (!user?.companyId) {
    return res.json({ success: true, data: [] });
  }

  const opinions = await prisma.workerOpinion.findMany({
    where: { companyId: user.companyId },
    orderBy: { createdAt: 'desc' },
    include: {
      submittedBy: { select: { name: true } },
    },
  });

  res.json({ success: true, data: opinions });
};

// ADMIN: 전체 의견 목록 (필터: type)
const getAllOpinions = async (req, res) => {
  const { type } = req.query;

  const where = {};
  if (type) where.type = type;

  const opinions = await prisma.workerOpinion.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      company: { select: { name: true, bizNo: true } },
      submittedBy: { select: { name: true } },
    },
  });

  res.json({ success: true, data: opinions });
};

module.exports = { createOpinion, getMyOpinions, getAllOpinions };
