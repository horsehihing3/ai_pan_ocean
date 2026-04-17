const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');
const { sendImprovementRequestEmail } = require('../utils/email');

// [2026-04-17] 출입신청 목록
const getVisitRequests = async (req, res) => {
  const { role, id: userId, companyId } = req.user;
  const where = role === 'PARTNER' ? { companyId } : {};

  const requests = await prisma.visitRequest.findMany({
    where,
    include: {
      company: { select: { name: true } },
      submittedBy: { select: { name: true } },
      documents: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: requests });
};

// [2026-04-17] 출입신청 단건 조회
const getVisitRequest = async (req, res) => {
  const { id } = req.params;
  const { role, companyId } = req.user;

  const request = await prisma.visitRequest.findUnique({
    where: { id },
    include: { company: true, submittedBy: { select: { name: true, email: true } }, documents: true },
  });

  if (!request) throw new AppError('신청 내역을 찾을 수 없습니다.', 404);
  if (role === 'PARTNER' && request.companyId !== companyId) throw new AppError('접근 권한이 없습니다.', 403);

  res.json({ success: true, data: request });
};

// [2026-04-17] 출입신청 생성 (협력업체)
const createVisitRequest = async (req, res) => {
  const { title, vesselName, location, workStartDate, workEndDate, workerCount, workerList } = req.body;
  const { id: submittedById, companyId } = req.user;

  if (!title || !workStartDate || !workEndDate || !workerCount) {
    throw new AppError('필수 항목을 모두 입력해 주세요.');
  }

  const request = await prisma.visitRequest.create({
    data: {
      title, vesselName, location,
      workStartDate: new Date(workStartDate),
      workEndDate: new Date(workEndDate),
      workerCount: parseInt(workerCount),
      workerList,
      companyId,
      submittedById,
    },
  });

  res.status(201).json({ success: true, data: request });
};

// [2026-04-17] 출입신청 수정 (협력업체, REVIEWING 상태만)
const updateVisitRequest = async (req, res) => {
  const { id } = req.params;
  const { companyId } = req.user;

  const existing = await prisma.visitRequest.findUnique({ where: { id } });
  if (!existing) throw new AppError('신청 내역을 찾을 수 없습니다.', 404);
  if (existing.companyId !== companyId) throw new AppError('접근 권한이 없습니다.', 403);
  if (existing.status === 'COMPLETED') throw new AppError('완료된 신청은 수정할 수 없습니다.');

  const { title, vesselName, location, workStartDate, workEndDate, workerCount, workerList } = req.body;

  const updated = await prisma.visitRequest.update({
    where: { id },
    data: {
      title, vesselName, location,
      workStartDate: workStartDate ? new Date(workStartDate) : undefined,
      workEndDate: workEndDate ? new Date(workEndDate) : undefined,
      workerCount: workerCount ? parseInt(workerCount) : undefined,
      workerList,
      status: 'REVIEWING',
    },
  });

  res.json({ success: true, data: updated });
};

// [2026-04-17] 상태 변경: 개선요청 또는 완료 (관리자)
const reviewVisitRequest = async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!['IMPROVEMENT_REQUESTED', 'COMPLETED'].includes(status)) {
    throw new AppError('유효하지 않은 상태입니다.');
  }

  const existing = await prisma.visitRequest.findUnique({
    where: { id },
    include: { company: true, submittedBy: { select: { email: true, name: true } } },
  });
  if (!existing) throw new AppError('신청 내역을 찾을 수 없습니다.', 404);
  if (existing.status === 'COMPLETED') throw new AppError('이미 완료된 신청입니다.');

  if (status === 'IMPROVEMENT_REQUESTED' && !note) {
    throw new AppError('개선요청 사유를 입력해 주세요.');
  }

  const updated = await prisma.visitRequest.update({
    where: { id },
    data: {
      status,
      improvementNote: note || null,
      completedAt: status === 'COMPLETED' ? new Date() : null,
    },
  });

  if (status === 'IMPROVEMENT_REQUESTED') {
    try {
      await sendImprovementRequestEmail({
        to: existing.submittedBy.email,
        companyName: existing.company.name,
        title: existing.title,
        note,
      });
    } catch (e) {
      console.error('개선요청 이메일 발송 실패:', e.message);
    }
  }

  res.json({ success: true, data: updated });
};

module.exports = { getVisitRequests, getVisitRequest, createVisitRequest, updateVisitRequest, reviewVisitRequest };
