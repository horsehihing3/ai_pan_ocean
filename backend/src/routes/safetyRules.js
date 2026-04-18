const express = require('express');
const {
  getSafetyRules, getIndustries, createSafetyRule, updateSafetyRule, deleteSafetyRule,
} = require('../controllers/safetyRuleController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/industries', getIndustries);
router.get('/', getSafetyRules);
router.post('/', requireRole('ADMIN'), createSafetyRule);
router.put('/:id', requireRole('ADMIN'), updateSafetyRule);
router.delete('/:id', requireRole('ADMIN'), deleteSafetyRule);

module.exports = router;
