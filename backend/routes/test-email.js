const express = require('express');
const router = express.Router();
const { sendOTPViaEmail } = require('../services/otpService');

// Test email endpoint (for debugging)
router.post('/test', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    console.log('[Test Email] Testing email configuration...');
    console.log('[Test Email] SMTP_HOST:', process.env.SMTP_HOST ? 'Set' : 'Not set');
    console.log('[Test Email] SMTP_USER:', process.env.SMTP_USER ? 'Set' : 'Not set');
    console.log('[Test Email] SMTP_PASS:', process.env.SMTP_PASS ? 'Set' : 'Not set');
    console.log('[Test Email] SMTP_PORT:', process.env.SMTP_PORT || '587 (default)');

    const testOTP = '123456';
    const result = await sendOTPViaEmail(email, testOTP, '+1234567890');

    res.json({
      success: result.success,
      message: result.success 
        ? 'Test email sent successfully. Check your inbox (and spam folder).' 
        : `Test email failed: ${result.error || result.message}`,
      result: result,
      smtpConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
    });
  } catch (error) {
    console.error('[Test Email] Error:', error);
    res.status(500).json({ 
      message: 'Test email error', 
      error: error.message 
    });
  }
});

module.exports = router;

