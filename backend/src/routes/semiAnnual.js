const express = require('express');
const {
  getQuestions, getSemiAnnuals, getSemiAnnual,
  createSemiAnnual, updateSemiAnnual, submitSemiAnnual, getSummary,
} = require('../controllers/semiAnnualController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/questions', getQuestions);
router.get('/summary', requireRole('ADMIN'), getSummary);
router.get('/', getSemiAnnuals);
router.get('/:id', getSemiAnnual);
router.post('/', requireRole('PARTNER'), createSemiAnnual);
router.put('/:id', requireRole('PARTNER'), updateSemiAnnual);
router.post('/:id/submit', requireRole('PARTNER'), submitSemiAnnual);

module.exports = router;
