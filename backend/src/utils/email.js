const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// [2026-04-17] 공통 이메일 발송 유틸
const sendMail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `"팬오션 안전경영팀" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

// 가입 신청 접수 → 안전경영팀 알림
const sendRegistrationNotifyToAdmin = async ({ adminEmail, companyName, applicantName, requestId }) => {
  await sendMail({
    to: adminEmail,
    subject: `[팬오션] 협력업체 가입신청 - ${companyName}`,
    html: `
      <h2>협력업체 가입 신청이 접수되었습니다.</h2>
      <p><strong>업체명:</strong> ${companyName}</p>
      <p><strong>신청자:</strong> ${applicantName}</p>
      <p><strong>신청 ID:</strong> ${requestId}</p>
      <p>포털에서 승인/반려 처리해 주세요.</p>
    `,
  });
};

// 2일 미승인 리마인드 → 안전경영팀
const sendRegistrationReminder = async ({ adminEmail, companyName, requestId }) => {
  await sendMail({
    to: adminEmail,
    subject: `[팬오션] 미승인 가입신청 리마인드 - ${companyName}`,
    html: `
      <h2>2일 이상 미승인된 가입신청이 있습니다.</h2>
      <p><strong>업체명:</strong> ${companyName}</p>
      <p><strong>신청 ID:</strong> ${requestId}</p>
      <p>빠른 처리 부탁드립니다.</p>
    `,
  });
};

// 승인 완료 → 협력업체
const sendApprovalEmail = async ({ to, companyName }) => {
  await sendMail({
    to,
    subject: `[팬오션] 가입 승인 완료 - ${companyName}`,
    html: `
      <h2>가입 신청이 승인되었습니다.</h2>
      <p>팬오션 안전보건 포털을 이용하실 수 있습니다.</p>
      <p>로그인 후 서비스를 시작해 주세요.</p>
    `,
  });
};

// 반려 → 협력업체
const sendRejectionEmail = async ({ to, companyName, reason }) => {
  await sendMail({
    to,
    subject: `[팬오션] 가입 신청 반려 - ${companyName}`,
    html: `
      <h2>가입 신청이 반려되었습니다.</h2>
      <p><strong>반려 사유:</strong> ${reason}</p>
      <p>문의사항은 안전경영팀으로 연락해 주세요.</p>
    `,
  });
};

// 출입신청 개선요청 → 협력업체
const sendImprovementRequestEmail = async ({ to, companyName, title, note }) => {
  await sendMail({
    to,
    subject: `[팬오션] 출입신청 개선요청 - ${title}`,
    html: `
      <h2>출입신청 서류 개선이 요청되었습니다.</h2>
      <p><strong>신청 제목:</strong> ${title}</p>
      <p><strong>개선 요청 사유:</strong> ${note}</p>
      <p>포털에서 내용을 수정 후 재제출해 주세요.</p>
    `,
  });
};

module.exports = {
  sendMail,
  sendRegistrationNotifyToAdmin,
  sendRegistrationReminder,
  sendApprovalEmail,
  sendRejectionEmail,
  sendImprovementRequestEmail,
};
