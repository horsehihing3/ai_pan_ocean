const express = require('express');
const { getVisitRequests, getVisitRequest, createVisitRequest, updateVisitRequest, reviewVisitRequest } = require('../controllers/visitRequestController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', getVisitRequests);
router.get('/:id', getVisitRequest);
router.post('/', requireRole('PARTNER'), createVisitRequest);
router.put('/:id', requireRole('PARTNER'), updateVisitRequest);
router.post('/:id/review', requireRole('ADMIN'), reviewVisitRequest);

module.exports = router;
