const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

// [2026-04-17] 협력업체 목록 (관리자)
const getCompanies = async (req, res) => {
  const companies = await prisma.company.findMany({
    include: {
      _count: { select: { visitRequests: true, evaluations: true, accidents: true } },
    },
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data: companies });
};

// [2026-04-17] 협력업체 단건 조회
const getCompany = async (req, res) => {
  const { id } = req.params;
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      users: { select: { id: true, name: true, email: true, phone: true } },
      visitRequests: { orderBy: { createdAt: 'desc' }, take: 5 },
      evaluations: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });
  if (!company) throw new AppError('업체를 찾을 수 없습니다.', 404);
  res.json({ success: true, data: company });
};

// [2026-04-17] 요주의 업체 플래그 토글 (관리자)
const toggleWatchlist = async (req, res) => {
  const { id } = req.params;
  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) throw new AppError('업체를 찾을 수 없습니다.', 404);

  const updated = await prisma.company.update({
    where: { id },
    data: { isWatchlist: !company.isWatchlist },
  });
  res.json({ success: true, data: updated });
};

module.exports = { getCompanies, getCompany, toggleWatchlist };
