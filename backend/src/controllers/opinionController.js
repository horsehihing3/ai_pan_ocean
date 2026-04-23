const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');
const { sendOpinionNotifyToAdmin } = require('../utils/email');
const { uploadToS3, getPresignedUrl } = require('../utils/s3');

const ADMIN_EMAIL = process.env.EMAIL_USER;

// [2026-04-23] 근로자 의견조회

// PARTNER: 의견 등록
const createOpinion = async (req, res) => {
  const {
    type, title, content, isAnonymous, consentAgreed,
    writerName, writerEmail, writerPhone, companyName, industry,
  } = req.body;
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

  // 파일 업로드 처리
  let fileKey = null;
  let fileName = null;
  if (req.file) {
    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    const s3Key = `opinions/${Date.now()}_${originalName}`;
    await uploadToS3({ key: s3Key, buffer: req.file.buffer, mimetype: req.file.mimetype });
    fileKey = s3Key;
    fileName = originalName;
  }

  const opinion = await prisma.workerOpinion.create({
    data: {
      type,
      title: title.trim(),
      content: content.trim(),
      isAnonymous: isAnonymous === 'true' || isAnonymous === true,
      consentAgreed: true,
      writerName: writerName?.trim() || null,
      writerEmail: writerEmail?.trim() || null,
      writerPhone: writerPhone?.trim() || null,
      companyName: companyName?.trim() || null,
      industry: industry?.trim() || null,
      fileKey,
      fileName,
      companyId: user.company.id,
      submittedById: userId,
    },
  });

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

// PARTNER: 전체 의견 목록 (전체 조회 - 안전사고 공유 목적)
const getOpinions = async (req, res) => {
  const { type } = req.query;
  const where = {};
  if (type) where.type = type;

  const opinions = await prisma.workerOpinion.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      company: { select: { name: true } },
      submittedBy: { select: { name: true } },
    },
  });

  res.json({ success: true, data: opinions });
};

// ADMIN: 전체 의견 목록
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

// ADMIN: 답변 작성
const replyOpinion = async (req, res) => {
  const { id } = req.params;
  const { adminReply } = req.body;

  if (!adminReply?.trim()) throw new AppError('답변 내용을 입력해 주세요.');

  const opinion = await prisma.workerOpinion.findUnique({ where: { id } });
  if (!opinion) throw new AppError('의견을 찾을 수 없습니다.', 404);

  const updated = await prisma.workerOpinion.update({
    where: { id },
    data: { adminReply: adminReply.trim(), repliedAt: new Date() },
    include: {
      company: { select: { name: true, bizNo: true } },
      submittedBy: { select: { name: true } },
    },
  });

  res.json({ success: true, data: updated });
};

// 파일 다운로드 Presigned URL
const getOpinionFileUrl = async (req, res) => {
  const { id } = req.params;
  const opinion = await prisma.workerOpinion.findUnique({ where: { id }, select: { fileKey: true, fileName: true } });
  if (!opinion?.fileKey) throw new AppError('첨부파일이 없습니다.', 404);
  const url = await getPresignedUrl(opinion.fileKey, opinion.fileName);
  res.json({ success: true, data: { url } });
};

module.exports = { createOpinion, getOpinions, getAllOpinions, replyOpinion, getOpinionFileUrl };
