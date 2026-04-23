// [2026-04-23] 근로자 의견조회 라우트
const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { createOpinion, getOpinions, getAllOpinions, replyOpinion } = require('../controllers/opinionController');

// 협력업체: 등록 / 전체 목록 조회
router.post('/', requireAuth, requireRole('PARTNER'), createOpinion);
router.get('/list', requireAuth, requireRole('PARTNER'), getOpinions);

// 관리자: 전체 목록 + 답변
router.get('/', requireAuth, requireRole('ADMIN'), getAllOpinions);
router.patch('/:id/reply', requireAuth, requireRole('ADMIN'), replyOpinion);

module.exports = router;
