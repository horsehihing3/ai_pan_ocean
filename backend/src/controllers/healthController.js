const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');
const { uploadToS3, deleteFromS3, getPresignedUrl } = require('../utils/s3');

// [2026-04-19] 보건파트 — 건강기록 목록 (ADMIN)
// 필터: workerName, bizNo, checkupYear
const getHealthRecords = async (req, res) => {
  const { workerName, bizNo, year } = req.query;

  const where = {};
  if (workerName) where.workerName = { contains: workerName, mode: 'insensitive' };
  if (bizNo) where.bizNo = { contains: bizNo };
  if (year) where.checkupYear = Number(year);

  const records = await prisma.healthRecord.findMany({
    where,
    include: { consultations: { orderBy: { date: 'desc' } } },
    orderBy: [{ checkupYear: 'desc' }, { createdAt: 'desc' }],
  });

  res.json({ success: true, data: records });
};

// [2026-04-19] 건강기록 단건 조회
const getHealthRecord = async (req, res) => {
  const { id } = req.params;
  const record = await prisma.healthRecord.findUnique({
    where: { id },
    include: { consultations: { orderBy: { date: 'desc' } } },
  });
  if (!record) throw new AppError('건강기록을 찾을 수 없습니다.', 404);
  res.json({ success: true, data: record });
};

// [2026-04-19] 동일 근로자(bizNo + workerName) 3개년 수치 조회
const getWorkerHistory = async (req, res) => {
  const { id } = req.params;
  const record = await prisma.healthRecord.findUnique({ where: { id } });
  if (!record) throw new AppError('건강기록을 찾을 수 없습니다.', 404);

  const history = await prisma.healthRecord.findMany({
    where: { bizNo: record.bizNo, workerName: record.workerName },
    orderBy: { checkupYear: 'desc' },
    take: 5,
  });

  res.json({ success: true, data: history });
};

// [2026-04-19] 건강기록 추가 (ADMIN)
const createHealthRecord = async (req, res) => {
  const { workerName, bizNo, checkupYear, data } = req.body;
  if (!workerName || !bizNo || !checkupYear) {
    throw new AppError('근로자명, 사업자번호, 검진연도는 필수입니다.', 400);
  }

  const record = await prisma.healthRecord.create({
    data: {
      workerName,
      bizNo,
      checkupYear: Number(checkupYear),
      data: data || {},
    },
    include: { consultations: true },
  });

  res.status(201).json({ success: true, data: record });
};

// [2026-04-19] 건강기록 수정 (ADMIN)
const updateHealthRecord = async (req, res) => {
  const { id } = req.params;
  const { workerName, bizNo, checkupYear, data } = req.body;

  const record = await prisma.healthRecord.findUnique({ where: { id } });
  if (!record) throw new AppError('건강기록을 찾을 수 없습니다.', 404);

  const updated = await prisma.healthRecord.update({
    where: { id },
    data: {
      workerName: workerName ?? record.workerName,
      bizNo: bizNo ?? record.bizNo,
      checkupYear: checkupYear !== undefined ? Number(checkupYear) : record.checkupYear,
      data: data ?? record.data,
    },
    include: { consultations: { orderBy: { date: 'desc' } } },
  });

  res.json({ success: true, data: updated });
};

// [2026-04-19] 건강기록 삭제 (ADMIN) — 상담이력 cascade 삭제
const deleteHealthRecord = async (req, res) => {
  const { id } = req.params;
  const record = await prisma.healthRecord.findUnique({ where: { id } });
  if (!record) throw new AppError('건강기록을 찾을 수 없습니다.', 404);

  await prisma.healthConsultation.deleteMany({ where: { healthRecordId: id } });
  await prisma.healthRecord.delete({ where: { id } });

  res.json({ success: true, message: '건강기록이 삭제되었습니다.' });
};

// [2026-04-19] 상담이력 추가 (ADMIN)
const addConsultation = async (req, res) => {
  const { id } = req.params;
  const { date, content } = req.body;

  if (!date || !content) throw new AppError('상담일과 내용은 필수입니다.', 400);

  const record = await prisma.healthRecord.findUnique({ where: { id } });
  if (!record) throw new AppError('건강기록을 찾을 수 없습니다.', 404);

  const consultation = await prisma.healthConsultation.create({
    data: { healthRecordId: id, date: new Date(date), content },
  });

  res.status(201).json({ success: true, data: consultation });
};

// [2026-04-19] 상담이력 삭제 (ADMIN)
const deleteConsultation = async (req, res) => {
  const { consultationId } = req.params;
  const c = await prisma.healthConsultation.findUnique({ where: { id: consultationId } });
  if (!c) throw new AppError('상담 기록을 찾을 수 없습니다.', 404);

  await prisma.healthConsultation.delete({ where: { id: consultationId } });
  res.json({ success: true, message: '상담 기록이 삭제되었습니다.' });
};

// [2026-04-19] 병원자료 업로드 (ADMIN)
const uploadHealthFile = async (req, res) => {
  const { id } = req.params;
  if (!req.file) throw new AppError('파일을 첨부해 주세요.', 400);

  const record = await prisma.healthRecord.findUnique({ where: { id } });
  if (!record) throw new AppError('건강기록을 찾을 수 없습니다.', 404);

  // 기존 파일 S3 삭제
  if (record.s3Key) {
    try { await deleteFromS3(record.s3Key); } catch {}
  }

  const fileName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
  const ext = fileName.split('.').pop();
  const s3Key = `health/${id}/${Date.now()}.${ext}`;

  await uploadToS3({ key: s3Key, buffer: req.file.buffer, mimetype: req.file.mimetype });

  const updated = await prisma.healthRecord.update({
    where: { id },
    data: { s3Key, s3FileName: fileName },
    include: { consultations: { orderBy: { date: 'desc' } } },
  });

  res.json({ success: true, data: updated });
};

// [2026-04-19] 병원자료 다운로드 Presigned URL (ADMIN)
const getHealthFileUrl = async (req, res) => {
  const { id } = req.params;
  const record = await prisma.healthRecord.findUnique({ where: { id } });
  if (!record) throw new AppError('건강기록을 찾을 수 없습니다.', 404);
  if (!record.s3Key) throw new AppError('첨부된 파일이 없습니다.', 404);

  const url = await getPresignedUrl(record.s3Key, record.s3FileName || undefined);
  res.json({ success: true, data: { url, fileName: record.s3FileName } });
};

// [2026-04-19] 병원자료 삭제 (ADMIN)
const deleteHealthFile = async (req, res) => {
  const { id } = req.params;
  const record = await prisma.healthRecord.findUnique({ where: { id } });
  if (!record) throw new AppError('건강기록을 찾을 수 없습니다.', 404);
  if (!record.s3Key) throw new AppError('첨부된 파일이 없습니다.', 404);

  try { await deleteFromS3(record.s3Key); } catch {}
  await prisma.healthRecord.update({ where: { id }, data: { s3Key: null, s3FileName: null } });

  res.json({ success: true, message: '파일이 삭제되었습니다.' });
};

module.exports = {
  getHealthRecords, getHealthRecord, getWorkerHistory,
  createHealthRecord, updateHealthRecord, deleteHealthRecord,
  addConsultation, deleteConsultation,
  uploadHealthFile, getHealthFileUrl, deleteHealthFile,
};
