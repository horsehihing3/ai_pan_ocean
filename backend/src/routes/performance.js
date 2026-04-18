const express = require('express');
const {
  getCategories, getPerformances, getSummary,
  createPerformance, updatePerformance, deletePerformance,
} = require('../controllers/performanceController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/categories', getCategories);
router.get('/summary', requireRole('ADMIN'), getSummary);
router.get('/', requireRole('ADMIN', 'CONTRACT_DEPT'), getPerformances);
router.post('/', requireRole('CONTRACT_DEPT'), createPerformance);
router.put('/:id', requireRole('CONTRACT_DEPT'), updatePerformance);
router.delete('/:id', requireRole('ADMIN', 'CONTRACT_DEPT'), deletePerformance);

module.exports = router;
