const prisma = require('./prisma');
const { sendRegistrationReminder } = require('./email');

const ADMIN_EMAIL = process.env.EMAIL_USER;

// [2026-04-17] 2일 미승인 가입신청 리마인드 (1시간마다 체크)
const startReminderScheduler = () => {
  const check = async () => {
    try {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const pendingRequests = await prisma.registrationRequest.findMany({
        where: {
          status: 'PENDING',
          createdAt: { lte: twoDaysAgo },
          reminderSentAt: null,
        },
      });

      for (const req of pendingRequests) {
        await sendRegistrationReminder({
          adminEmail: ADMIN_EMAIL,
          companyName: req.companyName,
          requestId: req.id,
        }).catch((e) => console.error(`리마인드 이메일 발송 실패 (${req.id}):`, e.message));

        await prisma.registrationRequest.update({
          where: { id: req.id },
          data: { reminderSentAt: new Date() },
        });
      }

      if (pendingRequests.length > 0) {
        console.log(`[Scheduler] ${pendingRequests.length}건 리마인드 이메일 발송 완료`);
      }
    } catch (e) {
      console.error('[Scheduler] 리마인드 처리 오류:', e.message);
    }
  };

  // 서버 시작 후 1분 뒤 첫 실행, 이후 1시간마다
  setTimeout(() => {
    check();
    setInterval(check, 60 * 60 * 1000);
  }, 60 * 1000);

  console.log('[Scheduler] 가입신청 리마인드 스케줄러 시작');
};

module.exports = { startReminderScheduler };
