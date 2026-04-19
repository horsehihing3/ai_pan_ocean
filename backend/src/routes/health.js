const express = require('express');
const {
  getHealthRecords, getHealthRecord, getWorkerHistory,
  createHealthRecord, updateHealthRecord, deleteHealthRecord,
  addConsultation, deleteConsultation,
  uploadHealthFile, getHealthFileUrl, deleteHealthFile,
} = require('../controllers/healthController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload } = require('../utils/s3');

// [2026-04-19] 보건파트 라우터 — ADMIN 전용
const router = express.Router();
router.use(requireAuth);
router.use(requireRole('ADMIN'));

router.get('/', getHealthRecords);
router.post('/', createHealthRecord);
router.get('/:id', getHealthRecord);
router.put('/:id', updateHealthRecord);
router.delete('/:id', deleteHealthRecord);
router.get('/:id/history', getWorkerHistory);
router.post('/:id/consultations', addConsultation);
router.delete('/:id/consultations/:consultationId', deleteConsultation);

// [2026-04-19] 병원자료 파일 업로드·다운로드·삭제
router.post('/:id/file', upload.single('file'), uploadHealthFile);
router.get('/:id/file/download', getHealthFileUrl);
router.delete('/:id/file', deleteHealthFile);

module.exports = router;
