const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES = '7d';

const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role, companyId: user.companyId };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES });
  return { accessToken, refreshToken };
};

// [2026-04-17] 로그인
const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('이메일 또는 비밀번호가 올바르지 않습니다.', 401);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AppError('이메일 또는 비밀번호가 올바르지 않습니다.', 401);

  if (!user.isApproved) throw new AppError('승인 대기 중입니다. 안전경영팀의 승인을 기다려 주세요.', 403);

  const { accessToken, refreshToken } = generateTokens(user);

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    data: {
      accessToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, companyId: user.companyId },
    },
  });
};

// [2026-04-17] 토큰 갱신
const refresh = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) throw new AppError('Refresh token이 없습니다.', 401);

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('유효하지 않은 Refresh token입니다.', 401);
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user || user.refreshToken !== token) throw new AppError('유효하지 않은 Refresh token입니다.', 401);

  const { accessToken, refreshToken: newRefresh } = generateTokens(user);
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefresh } });

  res.cookie('refreshToken', newRefresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ success: true, data: { accessToken } });
};

// [2026-04-17] 로그아웃
const logout = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    const decoded = jwt.decode(token);
    if (decoded?.id) {
      await prisma.user.update({ where: { id: decoded.id }, data: { refreshToken: null } }).catch(() => {});
    }
  }
  res.clearCookie('refreshToken');
  res.json({ success: true, message: '로그아웃 되었습니다.' });
};

// [2026-04-17] 내 정보 조회
const getMe = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, name: true, phone: true, role: true, companyId: true, company: { select: { name: true, bizNo: true, industry: true } } },
  });
  res.json({ success: true, data: user });
};

module.exports = { login, refresh, logout, getMe };
