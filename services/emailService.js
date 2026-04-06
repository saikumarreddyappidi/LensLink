/**
 * services/emailService.js
 * ─────────────────────────────────────────────────────────
 * Unified email helper — uses Resend (HTTPS API) when
 * RESEND_API_KEY is set, falls back to Nodemailer + Gmail
 * for local development.
 *
 * Production (Railway) env vars needed:
 *   RESEND_API_KEY=re_xxxxxxxxxxxx      ← from resend.com
 *   ADMIN_EMAIL=saikumarreddyappidi9@gmail.com
 *   APP_URL=https://lenslink.live
 *
 * Local dev only (no Resend):
 *   GMAIL_USER=...                 (preferred)
 *   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
 *   EMAIL_USER=...                 (legacy alias)
 *   EMAIL_PASS=xxxx xxxx xxxx xxxx (legacy alias)
 */

const nodemailer = require('nodemailer');

// ── Shared config ─────────────────────────────────────────
const FROM_NAME  = 'LensLink';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@lenslink.live';
const FROM       = `"${FROM_NAME}" <${FROM_EMAIL}>`;
const ADMIN      = process.env.ADMIN_EMAIL || 'saikumarreddyappidi9@gmail.com';
const APP_URL    = process.env.APP_URL || 'https://lenslink.live';

// ── Generic send helper ───────────────────────────────────
// Routes through Resend (HTTPS) or Nodemailer+Gmail depending on env.
async function sendEmail({ to, subject, html, text }) {
  // ── Resend (production — HTTPS, no SMTP port issues) ─────
  if (process.env.RESEND_API_KEY) {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from   : FROM,
      to     : Array.isArray(to) ? to : [to],
      subject: subject,
      html   : html,
      text   : text,
    });
    if (error) throw new Error(error.message || JSON.stringify(error));
    return data;
  }

  // ── Nodemailer fallback (local dev with Gmail App Password) ─
  const user = process.env.GMAIL_USER || process.env.EMAIL_USER;
  const passRaw = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS || '';
  const pass = passRaw.replace(/\s+/g, '');

  if (!user || !pass || pass === 'your_gmail_app_password_here') {
    throw new Error(
      'Email credentials missing. Set RESEND_API_KEY, or set GMAIL_USER + GMAIL_APP_PASSWORD (or EMAIL_USER + EMAIL_PASS).'
    );
  }

  const transporter = nodemailer.createTransport({
    host             : 'smtp.gmail.com',
    port             : 465,
    secure           : true,
    auth             : { user, pass },
    tls              : { rejectUnauthorized: false },
    connectionTimeout: 15000,
    socketTimeout    : 15000,
    greetingTimeout  : 10000,
  });

  return transporter.sendMail({ from: FROM, to, subject, html, text });
}

// ════════════════════════════════════════════════════════════
// 1. REGISTRATION – verification email
// ════════════════════════════════════════════════════════════
/**
 * @param {string} email  - recipient
 * @param {string} name   - user's display name
 * @param {string} token  - verificationToken stored on the User doc
 */
async function sendVerificationEmail(email, name, token) {
  const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8fafc;">
      <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <h2 style="color:#1e293b;margin-bottom:8px;">Welcome to LensLink, ${name}! 📸</h2>
        <p style="color:#475569;">Please verify your email address to activate your account.</p>
        <div style="margin:32px 0;text-align:center;">
          <a href="${verifyUrl}"
             style="background:#f97316;color:white;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;font-size:16px;">
            Verify My Email
          </a>
        </div>
        <p style="color:#94a3b8;font-size:13px;">
          This link expires in <strong>24 hours</strong>.<br>
          If you didn't create an account, you can safely ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
        <p style="color:#94a3b8;font-size:12px;text-align:center;">
          © ${new Date().getFullYear()} LensLink · saikumarreddyappidi9@gmail.com
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '✅ Verify your LensLink account',
    html,
  });
}

// ════════════════════════════════════════════════════════════
// 2. REGISTRATION – welcome email after successful verification
// ════════════════════════════════════════════════════════════
async function sendWelcomeEmail(email, name, role) {
  const ctaUrl = APP_URL;
  const roleMsg =
    role === 'photographer'
      ? 'Your photographer profile is live. Clients are already looking for talent like yours!'
      : 'Browse our talented photographers and book your perfect session today.';

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8fafc;">
      <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <h2 style="color:#1e293b;">You're all set, ${name}! 🎉</h2>
        <p style="color:#475569;">${roleMsg}</p>
        <div style="margin:32px 0;text-align:center;">
          <a href="${ctaUrl}"
             style="background:#f97316;color:white;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;font-size:16px;">
            Get Started
          </a>
        </div>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
        <p style="color:#94a3b8;font-size:12px;text-align:center;">
          © ${new Date().getFullYear()} LensLink
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject: '🎉 Welcome to LensLink!', html });
}

// ════════════════════════════════════════════════════════════
// 3. BOOKING – confirmation email to the CLIENT
// ════════════════════════════════════════════════════════════
/**
 * @param {object} booking        - booking document
 * @param {string} clientEmail
 * @param {string} clientName
 * @param {string} photographerName
 */
async function sendBookingConfirmationToClient(booking, clientEmail, clientName, photographerName) {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8fafc;">
      <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <h2 style="color:#1e293b;">Booking Confirmed! 📅</h2>
        <p style="color:#475569;">Hi ${clientName}, your photography session has been booked successfully.</p>

        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:20px;margin:20px 0;">
          <h3 style="color:#9a3412;margin:0 0 12px;">Booking Details</h3>
          <table style="width:100%;border-collapse:collapse;color:#7c2d12;">
            <tr><td style="padding:6px 0;width:140px;"><strong>Photographer</strong></td><td>${photographerName}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Date</strong></td><td>${new Date(booking.bookingDate || booking.date).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Time</strong></td><td>${booking.startTime || booking.time}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Session Type</strong></td><td>${booking.eventType || booking.sessionType}</td></tr>
            ${booking.totalAmount ? `<tr><td style="padding:6px 0;"><strong>Total</strong></td><td>$${booking.totalAmount}</td></tr>` : ''}
            <tr><td style="padding:6px 0;"><strong>Status</strong></td><td>Pending Confirmation</td></tr>
          </table>
        </div>

        <p style="color:#475569;">
          The photographer will contact you shortly to confirm the details.
          If you have questions, reply to this email.
        </p>

        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
        <p style="color:#94a3b8;font-size:12px;text-align:center;">© ${new Date().getFullYear()} LensLink</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: clientEmail,
    subject: `📸 Your booking with ${photographerName} is confirmed`,
    html,
  });
}

// ════════════════════════════════════════════════════════════
// 3b. BOOKING – notification email to the PHOTOGRAPHER
// ════════════════════════════════════════════════════════════
async function sendBookingNotificationToPhotographer(booking, photographerEmail, photographerName, clientName) {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8fafc;">
      <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <h2 style="color:#1e293b;">📸 New Booking Request!</h2>
        <p style="color:#475569;">Hi ${photographerName}, you have a new booking from <strong>${clientName}</strong>.</p>

        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0;">
          <h3 style="color:#166534;margin:0 0 12px;">Booking Details</h3>
          <table style="width:100%;border-collapse:collapse;color:#14532d;">
            <tr><td style="padding:6px 0;width:140px;"><strong>Client</strong></td><td>${clientName}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Date</strong></td><td>${new Date(booking.bookingDate || booking.date).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Time</strong></td><td>${booking.startTime || booking.time} – ${booking.endTime || ''}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Location</strong></td><td>${booking.location && booking.location.address ? booking.location.address : (booking.location || 'TBD')}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Session Type</strong></td><td>${booking.eventType || booking.sessionType}</td></tr>
            ${booking.totalAmount ? `<tr><td style="padding:6px 0;"><strong>Total</strong></td><td>$${booking.totalAmount}</td></tr>` : ''}
            ${booking.specialRequests ? `<tr><td style="padding:6px 0;"><strong>Notes</strong></td><td>${booking.specialRequests}</td></tr>` : ''}
          </table>
        </div>

        <p style="color:#475569;">
          Please log in to your LensLink dashboard to confirm or manage this booking.
        </p>

        <div style="margin:24px 0;text-align:center;">
          <a href="${APP_URL}"
             style="background:#f97316;color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;">
            Go to My Dashboard
          </a>
        </div>

        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
        <p style="color:#94a3b8;font-size:12px;text-align:center;">© ${new Date().getFullYear()} LensLink</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: photographerEmail,
    subject: `📸 New booking from ${clientName} – LensLink`,
    html,
  });
}

// ════════════════════════════════════════════════════════════
// 4. FEEDBACK – confirmation to sender + alert to admin
// ════════════════════════════════════════════════════════════
async function sendFeedbackEmails(feedback) {
  // a) confirmation to the person who submitted
  const confirmHtml = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8fafc;">
      <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <h2 style="color:#1e293b;">Thanks for reaching out, ${feedback.name}! 🙌</h2>
        <p style="color:#475569;">We've received your message and will get back to you within 24 hours.</p>
        <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin:20px 0;color:#334155;">
          <strong>Your message:</strong><br><br>
          ${feedback.message.replace(/\n/g, '<br>')}
        </div>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
        <p style="color:#94a3b8;font-size:12px;text-align:center;">© ${new Date().getFullYear()} LensLink</p>
      </div>
    </body>
    </html>
  `;

  // b) alert to admin
  const adminHtml = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8fafc;">
      <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <h2 style="color:#dc2626;">🔔 New Feedback / Contact Message</h2>
        <table style="width:100%;border-collapse:collapse;color:#374151;">
          <tr><td style="padding:6px 0;width:100px;"><strong>From</strong></td><td>${feedback.name}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Email</strong></td><td><a href="mailto:${feedback.email}">${feedback.email}</a></td></tr>
          <tr><td style="padding:6px 0;"><strong>Subject</strong></td><td>${feedback.subject}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Received</strong></td><td>${new Date().toLocaleString()}</td></tr>
        </table>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:20px 0;color:#7f1d1d;">
          <strong>Message:</strong><br><br>
          ${feedback.message.replace(/\n/g, '<br>')}
        </div>
      </div>
    </body>
    </html>
  `;

  // Send both in parallel
  await Promise.all([
    sendEmail({
      to: feedback.email,
      subject: `✅ We received your message – LensLink`,
      html: confirmHtml,
    }),
    sendEmail({
      to: ADMIN,
      subject: `[LensLink Feedback] ${feedback.subject || 'New message'} from ${feedback.name}`,
      html: adminHtml,
    }),
  ]);
}

// ── Exports ───────────────────────────────────────────────
module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendBookingConfirmationToClient,
  sendBookingNotificationToPhotographer,
  sendFeedbackEmails,
};
