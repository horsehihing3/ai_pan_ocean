const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

// [2026-04-17] JWT Access Token 검증 미들웨어
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('인증이 필요합니다.', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    throw new AppError('유효하지 않은 토큰입니다.', 401);
  }
};

// [2026-04-17] 역할 기반 접근 제어 미들웨어
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('인증이 필요합니다.', 401);
    }
    if (!roles.includes(req.user.role)) {
      throw new AppError('접근 권한이 없습니다.', 403);
    }
    next();
  };
};

module.exports = { requireAuth, requireRole };
