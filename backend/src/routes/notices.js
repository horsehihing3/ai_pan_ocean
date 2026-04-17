const express = require('express');
const { getNotices, createNotice, updateNotice, deleteNotice } = require('../controllers/noticeController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', getNotices);
router.post('/', requireRole('ADMIN'), createNotice);
router.put('/:id', requireRole('ADMIN'), updateNotice);
router.delete('/:id', requireRole('ADMIN'), deleteNotice);

module.exports = router;
