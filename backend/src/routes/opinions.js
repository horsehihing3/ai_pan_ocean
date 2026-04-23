// [2026-04-23] 근로자 의견조회 라우트
const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { createOpinion, getMyOpinions, getAllOpinions } = require('../controllers/opinionController');

// 협력업체: 등록 / 목록
router.post('/', requireAuth, requireRole('PARTNER'), createOpinion);
router.get('/my', requireAuth, requireRole('PARTNER'), getMyOpinions);

// 관리자: 전체 목록
router.get('/', requireAuth, requireRole('ADMIN'), getAllOpinions);

module.exports = router;
