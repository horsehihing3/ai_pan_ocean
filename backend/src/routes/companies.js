const express = require('express');
const { getCompanies, getCompany, toggleWatchlist } = require('../controllers/companyController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', requireRole('ADMIN', 'CONTRACT_DEPT'), getCompanies);
router.get('/:id', getCompany);
router.patch('/:id/watchlist', requireRole('ADMIN'), toggleWatchlist);

module.exports = router;
