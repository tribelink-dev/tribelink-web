/**
 * OTP Service
 * Handles sending OTP via SMS (Twilio) and Email (Nodemailer)
 */

// SMS Service (Twilio)
async function sendSMS(phoneNumber, otpCode) {
  try {
    // Check if Twilio is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      // In production, avoid logging full OTP codes
      if (process.env.NODE_ENV === 'development') {
        console.log(`[SMS] Twilio not configured. OTP for ${phoneNumber}: ${otpCode}`);
        console.log('To enable SMS, set: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER');
      } else {
        console.warn('[SMS] Twilio not configured. SMS OTP cannot be sent.');
      }
      return { success: false, message: 'SMS service not configured' };
    }

    // Dynamic import to avoid requiring twilio if not installed
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const message = await client.messages.create({
      body: `Your Triberoutes verification code is: ${otpCode}. Valid for 10 minutes.`,
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
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Email] SMTP not configured. OTP for ${email}: ${otpCode}`);
        console.log('To enable email, set: SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT');
      } else {
        console.warn('[Email] SMTP not configured. Email OTP cannot be sent.');
      }
      return { success: false, message: 'Email service not configured' };
    }

    // Dynamic import to avoid requiring nodemailer if not installed
    const nodemailer = require('nodemailer');

    // Create transporter with timeout settings
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      connectionTimeout: 15000, // 15 seconds connection timeout
      socketTimeout: 15000, // 15 seconds socket timeout
      greetingTimeout: 10000, // 10 seconds greeting timeout
      // Retry configuration
      pool: false,
      maxConnections: 1,
      maxMessages: 1,
      // Additional options for better connection handling
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates (for some SMTP servers)
      },
      debug: process.env.NODE_ENV === 'development', // Enable debug logging in dev
      logger: process.env.NODE_ENV === 'development' // Enable logger in dev
    });

    // Email content
    const mailOptions = {
      from: `"Triberoutes" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Triberoutes Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Triberoutes Verification</h2>
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
      text: `Your Triberoutes verification code is: ${otpCode}. Valid for 10 minutes.`
    };

    // Verify SMTP connection first with timeout
    console.log(`[Email] Verifying SMTP connection to ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || '587'}...`);
    try {
      const verifyPromise = transporter.verify();
      const verifyTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('SMTP verification timeout after 15 seconds')), 15000);
      });
      
      await Promise.race([verifyPromise, verifyTimeout]);
      console.log(`[Email] ✅ SMTP connection verified for ${process.env.SMTP_HOST}`);
    } catch (verifyError) {
      console.error('[Email] ❌ SMTP verification failed:', verifyError.message);
      console.error('[Email] SMTP Config:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || '587',
        user: process.env.SMTP_USER ? 'Set' : 'Not set',
        pass: process.env.SMTP_PASS ? 'Set' : 'Not set'
      });
      
      // Provide more helpful error messages
      let errorMessage = verifyError.message;
      if (verifyError.message.includes('timeout') || verifyError.message.includes('ETIMEDOUT')) {
        errorMessage = `Connection timeout to ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || '587'}. Check: 1) SMTP host/port is correct, 2) Firewall allows connection, 3) SMTP server is accessible from this network.`;
      } else if (verifyError.message.includes('ECONNREFUSED')) {
        errorMessage = `Connection refused by ${process.env.SMTP_HOST}. Check: 1) SMTP host is correct, 2) Port ${process.env.SMTP_PORT || '587'} is open, 3) SMTP server is running.`;
      } else if (verifyError.message.includes('authentication')) {
        errorMessage = `Authentication failed. Check: 1) SMTP_USER is correct, 2) SMTP_PASS is correct (use App Password for Gmail), 3) Account allows less secure apps (if applicable).`;
      }
      
      return { success: false, error: errorMessage };
    }

    // Send email with timeout
    console.log(`[Email] Attempting to send OTP to ${email} via ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || '587'}`);
    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email sending timeout after 20 seconds')), 20000);
    });

    const info = await Promise.race([sendPromise, timeoutPromise]);
    console.log(`[Email] ✅ OTP sent successfully to ${email}. Message ID: ${info.messageId}`);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Email] Response:`, JSON.stringify(info, null, 2));
    }
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Error sending OTP:', error.message);
    console.error('[Email] Full error:', error);
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

/**
 * Send Emergency SMS Alert
 * @param {string} phoneNumber - Phone number in E.164 format
 * @param {string} message - Emergency message
 * @returns {Promise<Object>} Result object with success status
 */
async function sendEmergencySMS(phoneNumber, message) {
  try {
    // Check if Twilio is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.log(`[SOS SMS] Twilio not configured. Emergency alert for ${phoneNumber}: ${message.substring(0, 50)}...`);
      return { success: false, message: 'SMS service not configured' };
    }

    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const smsMessage = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log(`[SOS SMS] Emergency alert sent to ${phoneNumber}. Message SID: ${smsMessage.sid}`);
    return { success: true, messageSid: smsMessage.sid };
  } catch (error) {
    console.error('[SOS SMS] Error sending emergency alert:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send Emergency Email Alert
 * @param {string} email - Email address
 * @param {string} subject - Email subject
 * @param {string} message - Emergency message (plain text)
 * @param {string} htmlMessage - Emergency message (HTML format)
 * @returns {Promise<Object>} Result object with success status
 */
async function sendEmergencyEmail(email, subject, message, htmlMessage = null) {
  try {
    // Check if email service is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`[SOS Email] SMTP not configured. Emergency alert for ${email}: ${message.substring(0, 50)}...`);
      return { success: false, message: 'Email service not configured' };
    }

    const nodemailer = require('nodemailer');
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      connectionTimeout: 10000,
      socketTimeout: 10000,
      greetingTimeout: 10000
    });

    const mailOptions = {
      from: `"Triberoutes Emergency" <${process.env.SMTP_USER}>`,
      to: email,
      subject: subject,
      text: message,
      html: htmlMessage || message.replace(/\n/g, '<br>')
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[SOS Email] Emergency alert sent to ${email}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[SOS Email] Error sending emergency alert:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendOTPViaSMS,
  sendOTPViaEmail,
  sendEmergencySMS,
  sendEmergencyEmail
};

