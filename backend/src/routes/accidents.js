const express = require('express');
const {
  getInjuryTypes, getAccidents, getAccident,
  createAccident, updateAccident, deleteAccident, getStats,
} = require('../controllers/accidentController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/injury-types', getInjuryTypes);
router.get('/stats', requireRole('ADMIN'), getStats);
router.get('/', getAccidents);
router.get('/:id', getAccident);
router.post('/', requireRole('PARTNER'), createAccident);
router.put('/:id', requireRole('PARTNER'), updateAccident);
router.delete('/:id', requireRole('ADMIN', 'PARTNER'), deleteAccident);

module.exports = router;
