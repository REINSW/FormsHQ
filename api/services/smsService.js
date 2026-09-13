const twilio = require('twilio');

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || sid === 'your-twilio-account-sid' || !token || token === 'your-twilio-auth-token') {
    throw new Error('Twilio credentials not configured');
  }
  return twilio(sid, token);
}

/**
 * Normalise an Australian mobile to E.164 (+614xxxxxxxx)
 */
function normaliseAuMobile(mobile) {
  const digits = mobile.replace(/\D/g, '');
  if (digits.startsWith('614')) return '+' + digits;
  if (digits.startsWith('04')) return '+61' + digits.slice(1);
  if (digits.startsWith('4') && digits.length === 9) return '+61' + digits;
  return '+' + digits; // fallback — let Twilio validate
}

/**
 * Send intake link SMS to client
 */
async function sendIntakeSms({ to, toName, agencyName, propertyAddress, intakeUrl }) {
  const client = getClient();
  const senderId = process.env.TWILIO_SENDER_ID || 'FormsHQ';

  const addressLine = propertyAddress ? ` for ${propertyAddress}` : '';
  const body =
    `Hi ${toName || 'there'}, ${agencyName || 'your property manager'} has sent you an owner intake form${addressLine}. ` +
    `Please complete it here: ${intakeUrl} — it only takes a few minutes.`;

  const result = await client.messages.create({
    body,
    from: senderId,
    to: normaliseAuMobile(to),
  });

  return { sid: result.sid, status: result.status };
}

module.exports = { sendIntakeSms };
