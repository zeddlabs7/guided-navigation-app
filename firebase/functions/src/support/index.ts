import * as functions from 'firebase-functions';
import * as nodemailer from 'nodemailer';

// Environment variables loaded from firebase/functions/.env at deploy time.
// The .env file is gitignored — it must exist on the machine you deploy from.
//
// Required variables:
//   SUPPORT_EMAIL     — Gmail or Google Workspace address used to send emails
//   SUPPORT_PASSWORD  — Gmail App Password (https://myaccount.google.com/apppasswords)
//   SUPPORT_RECIPIENT — Address that receives support request notifications
//
// To deploy: cd firebase && firebase deploy --only functions
// To update env vars without code changes: edit .env then redeploy,
// or set them in Google Cloud Console > Cloud Functions > Edit > Environment Variables.

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || '';
const SUPPORT_PASSWORD = process.env.SUPPORT_PASSWORD || '';
const SUPPORT_RECIPIENT = process.env.SUPPORT_RECIPIENT || '';

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: SUPPORT_EMAIL,
      pass: SUPPORT_PASSWORD,
    },
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

export const onSupportRequestCreated = functions.firestore
  .document('supportRequests/{requestId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const requestId = context.params.requestId;

    const phone = data.phoneNumber || 'N/A';
    const email = data.email || 'N/A';
    const description = data.description || '';
    const platform = data.platform || 'unknown';
    const imageUrls: string[] = data.imageUrls || [];

    if (!SUPPORT_RECIPIENT || !SUPPORT_EMAIL || !SUPPORT_PASSWORD) {
      functions.logger.error(
        'Support email not configured. Add SUPPORT_EMAIL, SUPPORT_PASSWORD, and SUPPORT_RECIPIENT to firebase/functions/.env',
      );
      return;
    }

    const subject = `[Yadul Support] New request from ${phone} (#${requestId.slice(0, 8)})`;

    const imageSection = imageUrls.length > 0
      ? `
        <tr>
          <td style="padding:8px 0;color:#555;font-weight:600;vertical-align:top;">Attachments</td>
          <td style="padding:8px 0;color:#1a1a1a;">
            ${imageUrls.map((url, i) => `<a href="${url}" style="color:#4F46E5;">Image ${i + 1}</a>`).join(' &nbsp; ')}
          </td>
        </tr>`
      : '';

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#4F46E5;padding:20px 24px;border-radius:8px 8px 0 0;">
          <h2 style="color:#fff;margin:0;font-size:18px;">New Support Request</h2>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;padding:24px;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr>
              <td style="padding:8px 0;color:#555;font-weight:600;width:120px;">Request ID</td>
              <td style="padding:8px 0;color:#1a1a1a;font-family:monospace;">${requestId}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#555;font-weight:600;">Phone</td>
              <td style="padding:8px 0;color:#1a1a1a;">${escapeHtml(phone)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#555;font-weight:600;">Email</td>
              <td style="padding:8px 0;color:#1a1a1a;">
                <a href="mailto:${escapeHtml(email)}" style="color:#4F46E5;">${escapeHtml(email)}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#555;font-weight:600;">Platform</td>
              <td style="padding:8px 0;color:#1a1a1a;">${escapeHtml(platform)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#555;font-weight:600;vertical-align:top;">Description</td>
              <td style="padding:8px 0;color:#1a1a1a;line-height:1.5;">${escapeHtml(description)}</td>
            </tr>
            ${imageSection}
          </table>
        </div>
        <p style="color:#999;font-size:12px;margin-top:16px;text-align:center;">
          This is an automated notification from Yadul.
        </p>
      </div>
    `;

    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: `"Yadul Support" <${SUPPORT_EMAIL}>`,
        to: SUPPORT_RECIPIENT,
        replyTo: email,
        subject,
        html,
      });
      functions.logger.info(`Support email sent for request ${requestId}`);
    } catch (err) {
      functions.logger.error('Failed to send support email:', err);
    }
  });
