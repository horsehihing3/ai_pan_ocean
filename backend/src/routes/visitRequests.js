const express = require('express');
const {
  getVisitRequests, getVisitRequest, createVisitRequest, updateVisitRequest, reviewVisitRequest,
  uploadDocument, getDocumentUrl, deleteDocument,
} = require('../controllers/visitRequestController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload } = require('../utils/s3');

const router = express.Router();
router.use(requireAuth);

router.get('/', getVisitRequests);
router.get('/:id', getVisitRequest);
router.post('/', requireRole('PARTNER'), createVisitRequest);
router.put('/:id', requireRole('PARTNER'), updateVisitRequest);
router.post('/:id/review', requireRole('ADMIN'), reviewVisitRequest);

// [2026-04-19] 서류 업로드·조회·삭제
router.post('/:id/documents', requireRole('PARTNER'), upload.single('file'), uploadDocument);
router.get('/:id/documents/:docId/download', getDocumentUrl);
router.delete('/:id/documents/:docId', requireRole('PARTNER'), deleteDocument);

module.exports = router;
