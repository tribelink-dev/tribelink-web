/**
 * OTP Service
 * Handles sending OTP via SMS (Twilio) and Email (Nodemailer)
 */

// SMS Service (Twilio)
async function sendSMS(phoneNumber, otpCode) {
  try {
    // Check if Twilio is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.log(`[SMS] Twilio not configured. OTP for ${phoneNumber}: ${otpCode}`);
      console.log('To enable SMS, set: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER');
      return { success: false, message: 'SMS service not configured' };
    }

    // Dynamic import to avoid requiring twilio if not installed
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const message = await client.messages.create({
      body: `Your Tribelink verification code is: ${otpCode}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log(`[SMS] OTP sent to ${phoneNumber}. Message SID: ${message.sid}`);
    return { success: true, messageSid: message.sid };
  } catch (error) {
    console.error('[SMS] Error sending OTP:', error.message);
    // Don't throw - allow fallback to console log
    return { success: false, error: error.message };
  }
}

// Email Service (Nodemailer)
async function sendEmail(email, otpCode, phoneNumber) {
  try {
    // Check if email service is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`[Email] SMTP not configured. OTP for ${email}: ${otpCode}`);
      console.log('To enable email, set: SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT');
      return { success: false, message: 'Email service not configured' };
    }

    // Dynamic import to avoid requiring nodemailer if not installed
    const nodemailer = require('nodemailer');

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Email content
    const mailOptions = {
      from: `"Tribelink" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Tribelink Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Tribelink Verification</h2>
          <p>Hello,</p>
          <p>Your verification code is:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 32px; letter-spacing: 4px;">${otpCode}</h1>
          </div>
          <p>This code is valid for <strong>10 minutes</strong>.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">This is an automated message. Please do not reply.</p>
        </div>
      `,
      text: `Your Tribelink verification code is: ${otpCode}. Valid for 10 minutes.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] OTP sent to ${email}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Error sending OTP:', error.message);
    // Don't throw - allow fallback to console log
    return { success: false, error: error.message };
  }
}

/**
 * Send OTP via SMS
 * @param {string} phoneNumber - Phone number in E.164 format (e.g., +1234567890)
 * @param {string} otpCode - 6-digit OTP code
 * @returns {Promise<Object>} Result object with success status
 */
async function sendOTPViaSMS(phoneNumber, otpCode) {
  // In development, always log to console
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n📱 [DEV] SMS OTP for ${phoneNumber}: ${otpCode}\n`);
  }

  // Try to send via Twilio if configured
  const result = await sendSMS(phoneNumber, otpCode);
  
  // If Twilio is not configured or fails, we've already logged to console
  return result;
}

/**
 * Send OTP via Email
 * @param {string} email - Email address
 * @param {string} otpCode - 6-digit OTP code
 * @param {string} phoneNumber - Phone number (for context)
 * @returns {Promise<Object>} Result object with success status
 */
async function sendOTPViaEmail(email, otpCode, phoneNumber = '') {
  // In development, always log to console
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n📧 [DEV] Email OTP for ${email}: ${otpCode}\n`);
  }

  // Try to send via SMTP if configured
  const result = await sendEmail(email, otpCode, phoneNumber);
  
  // If SMTP is not configured or fails, we've already logged to console
  return result;
}

module.exports = {
  sendOTPViaSMS,
  sendOTPViaEmail
};

