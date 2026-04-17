const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

// [2026-04-17] 공지사항 목록
const getNotices = async (req, res) => {
  const notices = await prisma.notice.findMany({ orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }] });
  res.json({ success: true, data: notices });
};

// [2026-04-17] 공지사항 생성 (관리자)
const createNotice = async (req, res) => {
  const { title, content, isPinned } = req.body;
  if (!title || !content) throw new AppError('제목과 내용을 입력해 주세요.');

  const notice = await prisma.notice.create({ data: { title, content, isPinned: !!isPinned } });
  res.status(201).json({ success: true, data: notice });
};

// [2026-04-17] 공지사항 수정 (관리자)
const updateNotice = async (req, res) => {
  const { id } = req.params;
  const { title, content, isPinned } = req.body;

  const notice = await prisma.notice.update({ where: { id }, data: { title, content, isPinned } });
  res.json({ success: true, data: notice });
};

// [2026-04-17] 공지사항 삭제 (관리자)
const deleteNotice = async (req, res) => {
  const { id } = req.params;
  await prisma.notice.delete({ where: { id } });
  res.json({ success: true, message: '공지사항이 삭제되었습니다.' });
};

module.exports = { getNotices, createNotice, updateNotice, deleteNotice };
