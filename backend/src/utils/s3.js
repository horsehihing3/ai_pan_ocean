// [2026-04-19] AWS S3 유틸 — 업로드·Presigned URL 발급
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');

const BUCKET = process.env.AWS_S3_BUCKET || 'pan-ocean-safety';
const REGION = process.env.AWS_REGION || 'ap-northeast-2';

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

// 메모리 버퍼로 파일 수신 (최대 20MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// S3 업로드
const uploadToS3 = async ({ key, buffer, mimetype }) => {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
  }));
  return key;
};

// S3 삭제
const deleteFromS3 = async (key) => {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
};

// Presigned 다운로드 URL (15분) — 원본 파일명 보존
const getPresignedUrl = async (key, fileName) => {
  const disposition = fileName
    ? `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`
    : 'attachment';
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key, ResponseContentDisposition: disposition }),
    { expiresIn: 900 },
  );
};

module.exports = { upload, uploadToS3, deleteFromS3, getPresignedUrl };
