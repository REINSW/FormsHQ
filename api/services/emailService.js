const { Resend } = require('resend');

function getClient() {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your-resend-api-key-here') {
    throw new Error('RESEND_API_KEY not configured');
  }
  return new Resend(process.env.RESEND_API_KEY);
}

/**
 * Send intake link email to client
 */
async function sendIntakeEmail({ to, toName, agencyName, propertyAddress, intakeUrl }) {
  const resend = getClient();
  const displayUrl = intakeUrl;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #1a1a2e; padding: 28px 36px; }
    .header-logo { color: #b7ff4a; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    .header-sub { color: rgba(255,255,255,0.5); font-size: 12px; margin-top: 2px; }
    .body { padding: 36px; }
    .greeting { font-size: 22px; font-weight: 700; color: #111; margin-bottom: 12px; }
    .text { font-size: 15px; color: #555; line-height: 1.6; margin-bottom: 20px; }
    .property { background: #f8f8f8; border-left: 3px solid #b7ff4a; padding: 12px 16px; border-radius: 4px; font-size: 14px; color: #333; margin-bottom: 28px; }
    .btn-wrap { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background: #1a1a2e; color: #b7ff4a !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 8px; letter-spacing: 0.3px; }
    .link-fallback { font-size: 12px; color: #999; word-break: break-all; text-align: center; margin-top: 16px; }
    .link-fallback a { color: #555; }
    .footer { background: #f8f8f8; padding: 20px 36px; font-size: 12px; color: #aaa; border-top: 1px solid #eee; }
    .footer a { color: #aaa; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-logo">FormsHQ</div>
      <div class="header-sub">${agencyName || 'Real Estate'}</div>
    </div>
    <div class="body">
      <div class="greeting">Hi ${toName || 'there'},</div>
      <p class="text">
        Thank you for choosing ${agencyName || 'us'} to manage your property.
        To get started, we need a few details from you. Please click the button below
        to complete your owner intake form — it only takes a few minutes.
      </p>
      ${propertyAddress ? `<div class="property">Property: <strong>${propertyAddress}</strong></div>` : ''}
      <div class="btn-wrap">
        <a href="${displayUrl}" class="btn">Complete intake form &rarr;</a>
      </div>
      <p class="text" style="font-size:13px; color:#999; margin-bottom:0;">
        This link is unique to you. Once submitted, your property manager will be in touch to arrange signing of the Management Agency Agreement.
      </p>
      <div class="link-fallback">
        If the button doesn't work, copy this link into your browser:<br>
        <a href="${displayUrl}">${displayUrl}</a>
      </div>
    </div>
    <div class="footer">
      This email was sent by ${agencyName || 'your property management agency'} via FormsHQ.
      If you believe you received this in error, please disregard it.
    </div>
  </div>
</body>
</html>`;

  const text = `Hi ${toName || 'there'},\n\nPlease complete your owner intake form using the link below:\n\n${intakeUrl}\n\nThank you,\n${agencyName || 'Your Property Manager'}`;

  const result = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'FormsHQ <noreply@reinsw.com.au>',
    to: [to],
    subject: `Action required: Complete your property intake form${propertyAddress ? ' — ' + propertyAddress : ''}`,
    html,
    text,
  });

  return result;
}

module.exports = { sendIntakeEmail };
