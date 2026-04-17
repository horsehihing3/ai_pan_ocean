const bcrypt = require('bcrypt');
const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');
const {
  sendRegistrationNotifyToAdmin,
  sendApprovalEmail,
  sendRejectionEmail,
} = require('../utils/email');

const BCRYPT_ROUNDS = 12;
const ADMIN_EMAIL = process.env.EMAIL_USER; // 안전경영팀 이메일

// [2026-04-17] 협력업체 가입신청 (미인증 상태에서 접근)
const submitRegistration = async (req, res) => {
  const { companyName, bizNo, industry, contractDept, applicantName, applicantEmail, applicantPhone, password } = req.body;

  if (!companyName || !bizNo || !applicantName || !applicantEmail || !password) {
    throw new AppError('필수 항목을 모두 입력해 주세요.');
  }

  // 중복 사업자번호 확인
  const existing = await prisma.registrationRequest.findFirst({ where: { bizNo, status: { not: 'REJECTED' } } });
  if (existing) throw new AppError('이미 신청된 사업자번호입니다.');

  const existingUser = await prisma.user.findUnique({ where: { email: applicantEmail } });
  if (existingUser) throw new AppError('이미 사용 중인 이메일입니다.');

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // 트랜잭션: 가입신청 + 미승인 User 생성
  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: { name: companyName, bizNo, industry, contractDept },
    });

    const user = await tx.user.create({
      data: {
        email: applicantEmail,
        password: hashedPassword,
        name: applicantName,
        phone: applicantPhone,
        role: 'PARTNER',
        isApproved: false,
        companyId: company.id,
      },
    });

    const request = await tx.registrationRequest.create({
      data: {
        companyName,
        bizNo,
        industry,
        contractDept,
        applicantName,
        applicantEmail,
        applicantPhone,
        companyId: company.id,
      },
    });

    return { request, user };
  });

  // 관리자 이메일 알림
  try {
    await sendRegistrationNotifyToAdmin({
      adminEmail: ADMIN_EMAIL,
      companyName,
      applicantName,
      requestId: result.request.id,
    });
  } catch (e) {
    console.error('관리자 이메일 발송 실패:', e.message);
  }

  res.status(201).json({
    success: true,
    message: '가입 신청이 완료되었습니다. 안전경영팀 승인 후 로그인하실 수 있습니다.',
    data: { requestId: result.request.id },
  });
};

// [2026-04-17] 가입신청 목록 조회 (관리자)
const getRegistrations = async (req, res) => {
  const { status } = req.query;
  const where = status ? { status } : {};

  const requests = await prisma.registrationRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, companyName: true, bizNo: true, industry: true, contractDept: true,
      applicantName: true, applicantEmail: true, applicantPhone: true,
      status: true, rejectReason: true, createdAt: true, approvedAt: true,
    },
  });

  res.json({ success: true, data: requests });
};

// [2026-04-17] 가입신청 승인 (관리자)
const approveRegistration = async (req, res) => {
  const { id } = req.params;

  const request = await prisma.registrationRequest.findUnique({ where: { id } });
  if (!request) throw new AppError('신청 내역을 찾을 수 없습니다.', 404);
  if (request.status !== 'PENDING') throw new AppError('이미 처리된 신청입니다.');

  await prisma.$transaction(async (tx) => {
    await tx.registrationRequest.update({
      where: { id },
      data: { status: 'APPROVED', approvedAt: new Date(), approvedById: req.user.id },
    });
    await tx.user.updateMany({
      where: { companyId: request.companyId },
      data: { isApproved: true, approvedAt: new Date() },
    });
  });

  try {
    await sendApprovalEmail({ to: request.applicantEmail, companyName: request.companyName });
  } catch (e) {
    console.error('승인 이메일 발송 실패:', e.message);
  }

  res.json({ success: true, message: '가입 신청이 승인되었습니다.' });
};

// [2026-04-17] 가입신청 반려 (관리자)
const rejectRegistration = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) throw new AppError('반려 사유를 입력해 주세요.');

  const request = await prisma.registrationRequest.findUnique({ where: { id } });
  if (!request) throw new AppError('신청 내역을 찾을 수 없습니다.', 404);
  if (request.status !== 'PENDING') throw new AppError('이미 처리된 신청입니다.');

  await prisma.registrationRequest.update({
    where: { id },
    data: { status: 'REJECTED', rejectReason: reason, approvedById: req.user.id },
  });

  try {
    await sendRejectionEmail({ to: request.applicantEmail, companyName: request.companyName, reason });
  } catch (e) {
    console.error('반려 이메일 발송 실패:', e.message);
  }

  res.json({ success: true, message: '가입 신청이 반려되었습니다.' });
};

module.exports = { submitRegistration, getRegistrations, approveRegistration, rejectRegistration };
