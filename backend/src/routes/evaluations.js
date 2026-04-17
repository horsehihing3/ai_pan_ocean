const express = require('express');
const { getEvaluationItems, createEvaluationItem, updateEvaluationItem, getEvaluations, createEvaluation, reviewEvaluation } = require('../controllers/evaluationController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// 평가항목
router.get('/items', getEvaluationItems);
router.post('/items', requireRole('ADMIN'), createEvaluationItem);
router.put('/items/:id', requireRole('ADMIN'), updateEvaluationItem);

// 평가
router.get('/', getEvaluations);
router.post('/', requireRole('CONTRACT_DEPT'), createEvaluation);
router.post('/:id/review', requireRole('ADMIN'), reviewEvaluation);

module.exports = router;
