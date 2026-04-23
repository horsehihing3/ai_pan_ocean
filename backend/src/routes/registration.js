const express = require('express');
const { submitRegistration, getRegistrations, approveRegistration, rejectRegistration } = require('../controllers/registrationController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload } = require('../utils/s3');

const router = express.Router();

router.post('/', upload.single('bizFile'), submitRegistration); // 미인증 - 가입신청
router.get('/', requireAuth, requireRole('ADMIN'), getRegistrations);
router.post('/:id/approve', requireAuth, requireRole('ADMIN'), approveRegistration);
router.post('/:id/reject', requireAuth, requireRole('ADMIN'), rejectRegistration);

module.exports = router;
