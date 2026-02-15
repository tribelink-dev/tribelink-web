const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('../config/passport');
const User = require('../models/User');
const Host = require('../models/Host'); // Backward compatibility alias
const Provider = require('../models/Provider');
const OTP = require('../models/OTP');
const { sendOTPViaSMS, sendOTPViaEmail } = require('../services/otpService');
const oauthService = require('../services/oauthService');

const router = express.Router();

// Helper function to normalize phone numbers consistently
function normalizePhoneNumber(phoneNumber) {
  if (!phoneNumber) return '';
  // Remove all whitespace, dashes, parentheses, dots, and other common separators
  return phoneNumber.replace(/[\s\-\(\)\.]/g, '').trim();
}

// Helper function to generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate OTP for phone number
router.post('/otp/generate/phone', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    
    // Validate phone number format
    if (!/^\+?[1-9]\d{1,14}$/.test(normalizedPhone)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTPs for this phone number
    await OTP.deleteMany({ phoneNumber: normalizedPhone, type: 'phone' });

    // Create new OTP
    const otp = new OTP({
      phoneNumber: normalizedPhone,
      otp: otpCode,
      type: 'phone',
      expiresAt
    });

    await otp.save();

    // Send OTP via SMS
    const smsResult = await sendOTPViaSMS(normalizedPhone, otpCode);
    
    // In development, always return OTP for testing
    // In production, only return if SMS service is not configured (fallback)
    const shouldReturnOTP = process.env.NODE_ENV === 'development' || !smsResult.success;

    res.json({
      message: smsResult.success ? 'OTP sent successfully via SMS' : 'OTP generated (SMS service not configured - check console/logs)',
      otp: shouldReturnOTP ? otpCode : undefined
    });
  } catch (error) {
    console.error('OTP generation error:', error);
    res.status(500).json({ message: 'Failed to generate OTP', error: error.message });
  }
});

// Generate OTP for email
router.post('/otp/generate/email', async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email || !phoneNumber) {
      return res.status(400).json({ message: 'Email and phone number are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTPs for this email and phone combination
    await OTP.deleteMany({ email: normalizedEmail, phoneNumber: normalizedPhone, type: 'email' });

    // Create new OTP
    const otp = new OTP({
      phoneNumber: normalizedPhone,
      email: normalizedEmail,
      otp: otpCode,
      type: 'email',
      expiresAt
    });

    await otp.save();

    // Send OTP via Email (don't wait if it takes too long)
    let emailResult = { success: false, message: 'Email sending in progress...' };
    try {
      // Set a timeout for the entire email sending process
      const emailPromise = sendOTPViaEmail(normalizedEmail, otpCode, normalizedPhone);
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => resolve({ success: false, message: 'Email sending timeout' }), 20000);
      });
      
      emailResult = await Promise.race([emailPromise, timeoutPromise]);
    } catch (err) {
      console.error('[Auth] Error in email sending:', err);
      emailResult = { success: false, error: err.message };
    }
    
    // In development, always return OTP for testing
    // In production, only return if email service is not configured (fallback)
    const shouldReturnOTP = process.env.NODE_ENV === 'development' || !emailResult.success;

    // Log the result for debugging
    console.log('[Auth] Email OTP result:', {
      success: emailResult.success,
      message: emailResult.message,
      error: emailResult.error,
      email: normalizedEmail,
      otpReturned: shouldReturnOTP
    });

    // Always respond, even if email sending failed or timed out
    res.json({
      message: emailResult.success 
        ? 'OTP sent successfully via Email' 
        : emailResult.error 
          ? `OTP generated. Email sending failed: ${emailResult.error}` 
          : 'OTP generated (Email service not configured - check console/logs)',
      otp: shouldReturnOTP ? otpCode : undefined,
      emailSent: emailResult.success,
      debug: process.env.NODE_ENV === 'development' ? {
        smtpConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
        smtpHost: process.env.SMTP_HOST,
        emailResult: emailResult
      } : undefined
    });
  } catch (error) {
    console.error('OTP generation error:', error);
    res.status(500).json({ message: 'Failed to generate OTP', error: error.message });
  }
});

// Verify OTP
router.post('/otp/verify', async (req, res) => {
  try {
    const { phoneNumber, email, otp, type } = req.body;

    if (!phoneNumber || !otp || !type) {
      return res.status(400).json({ message: 'Phone number, OTP, and type are required' });
    }

    if (type === 'email' && !email) {
      return res.status(400).json({ message: 'Email is required for email OTP verification' });
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    const normalizedEmail = email ? email.toLowerCase().trim() : null;

    // Find OTP
    const query = {
      phoneNumber: normalizedPhone,
      type,
      verified: false
    };

    if (type === 'email') {
      query.email = normalizedEmail;
    }

    const otpRecord = await OTP.findOne(query).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    res.json({
      message: 'OTP verified successfully',
      verified: true
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Failed to verify OTP', error: error.message });
  }
});

// User Signup (requires OTP verification for both phone and email)
router.post('/signup', async (req, res) => {
  try {
    const { email, phoneNumber, password, name } = req.body;

    if (!email || !phoneNumber || !password || !name) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Normalize phone number (remove spaces, dashes, etc.)
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    
    // Validate phone number format (E.164 format)
    if (!/^\+?[1-9]\d{1,14}$/.test(normalizedPhone)) {
      return res.status(400).json({ message: 'Invalid phone number format. Please use international format (e.g., +1234567890)' });
    }

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Verify that phone OTP has been verified
    const phoneOTP = await OTP.findOne({
      phoneNumber: normalizedPhone,
      type: 'phone',
      verified: true
    }).sort({ createdAt: -1 });

    if (!phoneOTP) {
      return res.status(400).json({ message: 'Phone number must be verified with OTP first' });
    }

    // Verify that email OTP has been verified
    const emailOTP = await OTP.findOne({
      phoneNumber: normalizedPhone,
      email: normalizedEmail,
      type: 'email',
      verified: true
    }).sort({ createdAt: -1 });

    if (!emailOTP) {
      return res.status(400).json({ message: 'Email must be verified with OTP first' });
    }

    // Check if user already exists by email or phone
    console.log('Checking for existing user:', { normalizedEmail, normalizedPhone });
    const existingUserByEmail = await User.findOne({ email: normalizedEmail });
    if (existingUserByEmail) {
      console.log('Found existing user by email:', existingUserByEmail.email);
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const existingUserByPhone = await User.findOne({ phoneNumber: normalizedPhone });
    if (existingUserByPhone) {
      console.log('Found existing user by phone:', existingUserByPhone.phoneNumber);
      return res.status(400).json({ message: 'User with this phone number already exists' });
    }
    
    // SECURITY: Check if email/phone is already registered as a Host/Provider
    const existingHostByEmail = await Host.findOne({ email: normalizedEmail });
    const existingProviderByEmail = existingHostByEmail ? null : await Provider.findOne({ email: normalizedEmail });
    if (existingHostByEmail || existingProviderByEmail) {
      console.log('Security: Email is already registered as a Host/Provider');
      return res.status(400).json({ 
        message: 'This email is already registered as a host/provider account. Please use the host login page or use a different email.' 
      });
    }
    
    // Check phone variations for Host/Provider
    let existingHostByPhone = await Host.findOne({ phoneNumber: normalizedPhone });
    let existingProviderByPhone = existingHostByPhone ? null : await Provider.findOne({ phoneNumber: normalizedPhone });
    
    // Also check phone variations
    if (!existingHostByPhone && !existingProviderByPhone && normalizedPhone.startsWith('+')) {
      const phoneWithoutPlus = normalizedPhone.substring(1);
      existingHostByPhone = await Host.findOne({ phoneNumber: phoneWithoutPlus });
      existingProviderByPhone = existingHostByPhone ? null : await Provider.findOne({ phoneNumber: phoneWithoutPlus });
    }
    if (!existingHostByPhone && !existingProviderByPhone && !normalizedPhone.startsWith('+')) {
      const phoneWithPlus = '+' + normalizedPhone;
      existingHostByPhone = await Host.findOne({ phoneNumber: phoneWithPlus });
      existingProviderByPhone = existingHostByPhone ? null : await Provider.findOne({ phoneNumber: phoneWithPlus });
    }
    
    if (existingHostByPhone || existingProviderByPhone) {
      console.log('Security: Phone number is already registered as a Host/Provider');
      return res.status(400).json({ 
        message: 'This phone number is already registered as a host/provider account. Please use the host login page or use a different phone number.' 
      });
    }
    
    console.log('No existing user found, proceeding with creation...');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      email: normalizedEmail,
      phoneNumber: normalizedPhone,
      password: hashedPassword,
      name: name.trim(),
      tripWallet: { balance: 0, currency: 'USD' },
      tokens: 2 // Give 2 tokens on signup
      // Don't set googleId for non-OAuth signups
    });

    await user.save();
    console.log('User created successfully:', user._id);

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        name: user.name
      }
    });
  } catch (error) {
    console.error('User signup error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      keyPattern: error.keyPattern,
      errors: error.errors
    });
    
    if (error.code === 11000) {
      // Duplicate key error
      console.error('Duplicate key error:', error.keyPattern);
      if (error.keyPattern?.email) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
      if (error.keyPattern?.phoneNumber) {
        return res.status(400).json({ message: 'User with this phone number already exists' });
      }
      if (error.keyPattern?.googleId) {
        console.error('Unexpected googleId duplicate error for non-OAuth signup');
        return res.status(400).json({ 
          message: 'An account with this Google ID already exists. Please try logging in instead.',
          details: 'If you used Google OAuth, please use the Google sign-in option'
        });
      }
      const duplicateFields = Object.keys(error.keyPattern || {});
      if (duplicateFields.length > 0) {
        return res.status(400).json({ 
          message: `User with this ${duplicateFields.join(', ')} already exists` 
        });
      }
      return res.status(400).json({ message: 'A user with this information already exists' });
    }
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => 
        `${err.path}: ${err.message}`
      ).join(', ');
      console.error('Validation errors:', validationErrors);
      return res.status(400).json({ message: `Validation error: ${validationErrors}` });
    }
    // Handle mongoose connection errors
    if (error.name === 'MongoServerError' || error.message?.includes('Mongo')) {
      console.error('MongoDB error:', error.message);
      return res.status(500).json({ message: 'Database connection error. Please try again later.' });
    }
    console.error('Unexpected error:', error.message);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// User Login (accepts either email OR phone number)
router.post('/login', async (req, res) => {
  try {
    const { email, phoneNumber, password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Handle empty strings as missing values
    const hasEmail = email && email.trim().length > 0;
    const hasPhone = phoneNumber && phoneNumber.trim().length > 0;

    if (!hasEmail && !hasPhone) {
      return res.status(400).json({ message: 'Either email or phone number is required' });
    }

    if (hasEmail && hasPhone) {
      return res.status(400).json({ message: 'Please provide either email OR phone number, not both' });
    }

    let user = null;
    let normalizedEmail = null;
    let normalizedPhone = null;

    if (hasEmail) {
      normalizedEmail = email.toLowerCase().trim();
      
      // SECURITY: Check if this email belongs to a Host/Provider account first
      const existingHost = await Host.findOne({ email: normalizedEmail });
      const existingProvider = existingHost ? null : await Provider.findOne({ email: normalizedEmail });
      if (existingHost || existingProvider) {
        console.log('Security: Email belongs to a Host/Provider account, not a User');
        return res.status(401).json({ message: 'Invalid credentials. This email is registered as a host/provider account. Please use the host login page.' });
      }
      
      user = await User.findOne({ email: normalizedEmail });
    } else if (hasPhone) {
      normalizedPhone = normalizePhoneNumber(phoneNumber);
      
      // SECURITY: Check if this phone belongs to a Host/Provider account first
      let existingHost = await Host.findOne({ phoneNumber: normalizedPhone });
      let existingProvider = existingHost ? null : await Provider.findOne({ phoneNumber: normalizedPhone });
      
      // Also check phone variations for Host/Provider accounts
      if (!existingHost && !existingProvider && normalizedPhone.startsWith('+')) {
        const phoneWithoutPlus = normalizedPhone.substring(1);
        existingHost = await Host.findOne({ phoneNumber: phoneWithoutPlus });
        existingProvider = existingHost ? null : await Provider.findOne({ phoneNumber: phoneWithoutPlus });
      }
      if (!existingHost && !existingProvider && !normalizedPhone.startsWith('+')) {
        const phoneWithPlus = '+' + normalizedPhone;
        existingHost = await Host.findOne({ phoneNumber: phoneWithPlus });
        existingProvider = existingHost ? null : await Provider.findOne({ phoneNumber: phoneWithPlus });
      }
      
      if (existingHost || existingProvider) {
        console.log('Security: Phone number belongs to a Host/Provider account, not a User');
        return res.status(401).json({ message: 'Invalid credentials. This phone number is registered as a host/provider account. Please use the host login page.' });
      }
      
      user = await User.findOne({ phoneNumber: normalizedPhone });
    }

    console.log('Login attempt:', {
      providedEmail: hasEmail ? email : null,
      providedPhone: hasPhone ? phoneNumber : null,
      normalizedEmail: normalizedEmail,
      normalizedPhone: normalizedPhone,
      foundUser: !!user,
      searchBy: hasEmail ? 'email' : 'phone'
    });
      
    if (!user) {
      console.log('User not found:', {
        searchedEmail: normalizedEmail,
        searchedPhone: normalizedPhone,
        hasEmail,
        hasPhone
      });
      return res.status(401).json({ message: 'Invalid credentials. User not found.' });
    }

    // Verify password (skip for OAuth users who don't have passwords)
    if (user.googleId) {
      // OAuth user - allow login without password if email and phone match
      // In production, you might want to add additional verification
      console.log('OAuth user login - skipping password verification');
    } else {
      // Regular user - verify password
      if (!user.password) {
        console.log('User has no password set');
        return res.status(401).json({ message: 'Invalid credentials. Password not set.' });
      }
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log('Password verification:', {
        isValid: isValidPassword,
        userId: user._id
      });
      
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials. Incorrect password.' });
      }
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Host Signup (now Provider Signup)
router.post('/host/signup', async (req, res) => {
  try {
    const { email, phoneNumber, password, name, providerType, role } = req.body;

    if (!email || !phoneNumber || !password || !name) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate providerType - only allow LOCAL_HOST and EXPERIENCE_HOST
    const validProviderTypes = ['EXPERIENCE_HOST', 'LOCAL_HOST'];
    
    if (!providerType) {
      return res.status(400).json({ message: 'Provider type is required. Please select either Local Host or Experience Provider.' });
    }
    
    if (!validProviderTypes.includes(providerType)) {
      return res.status(400).json({ 
        message: 'Invalid provider type. Only Local Host and Experience Provider are allowed for signup.' 
      });
    }

    const finalProviderType = providerType;

    // Set role for backward compatibility (map providerType to role)
    let finalRole = null;
    if (finalProviderType === 'EXPERIENCE_HOST') {
      finalRole = role || 'Host'; // Default to Host if not specified
    }
    // LOCAL_HOST doesn't need a role

    // Normalize phone number (remove spaces, dashes, etc.)
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    
    // Validate phone number format (E.164 format)
    if (!/^\+?[1-9]\d{1,14}$/.test(normalizedPhone)) {
      return res.status(400).json({ message: 'Invalid phone number format. Please use international format (e.g., +1234567890)' });
    }

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim();

    // Check if provider already exists by email or phone
    // Note: Email field has lowercase: true in schema, so Mongoose will auto-lowercase
    console.log('Checking for existing provider:', { 
      normalizedEmail, 
      normalizedPhone,
      originalEmail: email,
      originalPhone: phoneNumber
    });
    
    const existingProviderByEmail = await Provider.findOne({ email: normalizedEmail });
    if (existingProviderByEmail) {
      console.log('Found existing provider by email:', {
        existingEmail: existingProviderByEmail.email,
        searchingFor: normalizedEmail,
        existingId: existingProviderByEmail._id
      });
      return res.status(400).json({ 
        message: 'Provider with this email already exists',
        details: 'An account with this email address is already registered'
      });
    }

    const existingProviderByPhone = await Provider.findOne({ phoneNumber: normalizedPhone });
    if (existingProviderByPhone) {
      console.log('Found existing provider by phone:', {
        existingPhone: existingProviderByPhone.phoneNumber,
        searchingFor: normalizedPhone,
        existingId: existingProviderByPhone._id
      });
      return res.status(400).json({ 
        message: 'Provider with this phone number already exists',
        details: 'An account with this phone number is already registered'
      });
    }
    
    // Also check legacy Host model
    const existingHostByEmail = await Host.findOne({ email: normalizedEmail });
    if (existingHostByEmail) {
      console.log('Found existing host by email (legacy model)');
      return res.status(400).json({ 
        message: 'Host with this email already exists',
        details: 'An account with this email address is already registered'
      });
    }
    
    const existingHostByPhone = await Host.findOne({ phoneNumber: normalizedPhone });
    if (existingHostByPhone) {
      console.log('Found existing host by phone (legacy model)');
      return res.status(400).json({ 
        message: 'Host with this phone number already exists',
        details: 'An account with this phone number is already registered'
      });
    }
    
    // SECURITY: Check if email/phone is already registered as a User
    const existingUserByEmail = await User.findOne({ email: normalizedEmail });
    if (existingUserByEmail) {
      console.log('Security: Email is already registered as a User');
      return res.status(400).json({ 
        message: 'This email is already registered as a traveler account. Please use the traveler login page or use a different email.' 
      });
    }
    
    // Check phone variations for User
    let existingUserByPhone = await User.findOne({ phoneNumber: normalizedPhone });
    
    // Also check phone variations
    if (!existingUserByPhone && normalizedPhone.startsWith('+')) {
      const phoneWithoutPlus = normalizedPhone.substring(1);
      existingUserByPhone = await User.findOne({ phoneNumber: phoneWithoutPlus });
    }
    if (!existingUserByPhone && !normalizedPhone.startsWith('+')) {
      const phoneWithPlus = '+' + normalizedPhone;
      existingUserByPhone = await User.findOne({ phoneNumber: phoneWithPlus });
    }
    
    if (existingUserByPhone) {
      console.log('Security: Phone number is already registered as a User');
      return res.status(400).json({ 
        message: 'This phone number is already registered as a traveler account. Please use the traveler login page or use a different phone number.' 
      });
    }
    
    console.log('No existing provider found, proceeding with creation...');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create provider
    const providerData = {
      email: normalizedEmail,
      phoneNumber: normalizedPhone,
      password: hashedPassword,
      name: name.trim(),
      providerType: finalProviderType
      // Don't set googleId for non-OAuth signups - let it remain undefined
      // This ensures sparse unique index works correctly
    };

    // Add role only if defined (for EXPERIENCE_HOST and GUIDE)
    // Don't set role for LOCAL_HOST
    if (finalRole) {
      providerData.role = finalRole;
    }

    console.log('Creating provider:', { 
      email: normalizedEmail, 
      phoneNumber: normalizedPhone,
      name: name.trim(),
      providerType: finalProviderType,
      role: finalRole || 'not set',
      hasGoogleId: false
    });

    const provider = new Provider(providerData);

    await provider.save();
    
    console.log('Provider created successfully:', provider._id);

    // Generate token
    const token = jwt.sign(
      { userId: provider._id },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Provider account created successfully',
      token,
      host: { // Keep 'host' key for backward compatibility
        _id: provider._id.toString(),
        id: provider._id.toString(), // Also include id for compatibility
        email: provider.email,
        phoneNumber: provider.phoneNumber,
        name: provider.name,
        providerType: provider.providerType,
        role: provider.role || null
      }
    });
  } catch (error) {
    console.error('Provider signup error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      keyPattern: error.keyPattern,
      errors: error.errors
    });
    
    if (error.code === 11000) {
      // Duplicate key error
      console.error('Duplicate key error:', error.keyPattern);
      if (error.keyPattern?.email) {
        return res.status(400).json({ message: 'Provider with this email already exists' });
      }
      if (error.keyPattern?.phoneNumber) {
        return res.status(400).json({ message: 'Provider with this phone number already exists' });
      }
      if (error.keyPattern?.googleId) {
        // This shouldn't happen for non-OAuth signups, but handle it just in case
        console.error('Unexpected googleId duplicate error for non-OAuth signup');
        return res.status(400).json({ 
          message: 'An account with this Google ID already exists. Please try logging in instead.',
          details: 'If you used Google OAuth, please use the Google sign-in option'
        });
      }
      // Check for other duplicate fields
      const duplicateFields = Object.keys(error.keyPattern || {});
      if (duplicateFields.length > 0) {
        return res.status(400).json({ 
          message: `Provider with this ${duplicateFields.join(', ')} already exists` 
        });
      }
      return res.status(400).json({ message: 'A provider with this information already exists' });
    }
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => 
        `${err.path}: ${err.message}`
      ).join(', ');
      console.error('Validation errors:', validationErrors);
      return res.status(400).json({ message: `Validation error: ${validationErrors}` });
    }
    // Handle mongoose connection errors
    if (error.name === 'MongoServerError' || error.message?.includes('Mongo')) {
      console.error('MongoDB error:', error.message);
      return res.status(500).json({ message: 'Database connection error. Please try again later.' });
    }
    console.error('Unexpected error:', error.message);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Host Login (accepts either email OR phone number)
router.post('/host/login', async (req, res) => {
  try {
    const { email, phoneNumber, password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Handle empty strings as missing values
    const hasEmail = email && email.trim().length > 0;
    const hasPhone = phoneNumber && phoneNumber.trim().length > 0;

    if (!hasEmail && !hasPhone) {
      return res.status(400).json({ message: 'Either email or phone number is required' });
    }

    if (hasEmail && hasPhone) {
      return res.status(400).json({ message: 'Please provide either email OR phone number, not both' });
    }

    let host = null;
    let normalizedEmail = null;
    let normalizedPhone = null;

    if (hasEmail) {
      normalizedEmail = email.toLowerCase().trim();
      
      // SECURITY: Check if this email belongs to a User account first
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        console.log('Security: Email belongs to a User account, not a Host');
        return res.status(401).json({ message: 'Invalid credentials. This email is registered as a traveler account. Please use the traveler login page.' });
      }
      
      host = await Host.findOne({ email: normalizedEmail });
      // Also try Provider model (in case Host is an alias)
      if (!host) {
        host = await Provider.findOne({ email: normalizedEmail });
      }
    } else if (hasPhone) {
      normalizedPhone = normalizePhoneNumber(phoneNumber);
      
      // SECURITY: Check if this phone belongs to a User account first
      const existingUser = await User.findOne({ phoneNumber: normalizedPhone });
      if (existingUser) {
        console.log('Security: Phone number belongs to a User account, not a Host');
        return res.status(401).json({ message: 'Invalid credentials. This phone number is registered as a traveler account. Please use the traveler login page.' });
      }
      
      // Also check phone variations for User accounts
      if (!existingUser && normalizedPhone.startsWith('+')) {
        const phoneWithoutPlus = normalizedPhone.substring(1);
        const userWithoutPlus = await User.findOne({ phoneNumber: phoneWithoutPlus });
        if (userWithoutPlus) {
          console.log('Security: Phone number (without +) belongs to a User account');
          return res.status(401).json({ message: 'Invalid credentials. This phone number is registered as a traveler account. Please use the traveler login page.' });
        }
      }
      if (!existingUser && !normalizedPhone.startsWith('+')) {
        const phoneWithPlus = '+' + normalizedPhone;
        const userWithPlus = await User.findOne({ phoneNumber: phoneWithPlus });
        if (userWithPlus) {
          console.log('Security: Phone number (with +) belongs to a User account');
          return res.status(401).json({ message: 'Invalid credentials. This phone number is registered as a traveler account. Please use the traveler login page.' });
        }
      }
      
      // Try to find host with normalized phone number
      host = await Host.findOne({ phoneNumber: normalizedPhone });
      
      // If not found, try Provider model
      if (!host) {
        host = await Provider.findOne({ phoneNumber: normalizedPhone });
      }
      
      // If not found and phone starts with +, try without +
      if (!host && normalizedPhone.startsWith('+')) {
        const phoneWithoutPlus = normalizedPhone.substring(1);
        host = await Host.findOne({ phoneNumber: phoneWithoutPlus });
        if (!host) {
          host = await Provider.findOne({ phoneNumber: phoneWithoutPlus });
        }
        if (host) {
          console.log('Found host using phone without + prefix');
        }
      }
      // If not found and phone doesn't start with +, try with +
      if (!host && !normalizedPhone.startsWith('+')) {
        const phoneWithPlus = '+' + normalizedPhone;
        host = await Host.findOne({ phoneNumber: phoneWithPlus });
        if (!host) {
          host = await Provider.findOne({ phoneNumber: phoneWithPlus });
        }
        if (host) {
          console.log('Found host using phone with + prefix');
          normalizedPhone = phoneWithPlus; // Update normalized phone for consistency
        }
      }
    }

    console.log('Host login attempt:', {
      providedEmail: hasEmail ? email : null,
      providedPhone: hasPhone ? phoneNumber : null,
      normalizedEmail: normalizedEmail,
      normalizedPhone: normalizedPhone,
      foundHost: !!host,
      searchBy: hasEmail ? 'email' : 'phone'
    });
      
    if (!host) {
      return res.status(401).json({ message: 'Invalid credentials. Host not found.' });
    }

    // Verify password (skip for OAuth hosts who don't have passwords)
    if (host.googleId) {
      // OAuth host - allow login without password if email and phone match
      // In production, you might want to add additional verification
    } else {
      // Regular host - verify password
      const isValidPassword = await bcrypt.compare(password, host.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }

    // Generate token
    const token = jwt.sign(
      { userId: host._id },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      host: {
        _id: host._id.toString(),
        id: host._id.toString(), // Also include id for compatibility
        email: host.email,
        phoneNumber: host.phoneNumber,
        name: host.name,
        providerType: host.providerType || 'EXPERIENCE_HOST',
        role: host.role || null
      }
    });
  } catch (error) {
    console.error('Host login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Google OAuth Routes for Users
 * Modern implementation with proper error handling and state management
 */

// Initiate Google OAuth for users
router.get('/google', (req, res, next) => {
  // Verify OAuth credentials
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('[OAuth] Google OAuth credentials missing');
    return res.status(500).json({ 
      success: false,
      message: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env',
      error: 'Missing OAuth credentials'
    });
  }
  
  // Generate state token for CSRF protection
  const returnUrl = req.query.returnUrl || '/';
  const state = oauthService.generateStateToken({ 
    type: 'user',
    returnUrl,
    timestamp: Date.now()
  });
  
  // Store state in session/cookie for validation
  req.session = req.session || {};
  req.session.oauthState = state;
  
  // Call passport authenticate with state
  const authMiddleware = passport.authenticate('google-user', { 
    scope: ['profile', 'email'],
    state: state
  });
  authMiddleware(req, res, next);
});

// Google OAuth callback for users
router.get('/google/callback', 
  passport.authenticate('google-user', { session: false, failureRedirect: '/login?error=oauth_failed' }),
  async (req, res) => {
    try {
      const profile = req.user;
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      if (!profile) {
        throw new Error('OAuth profile not received');
      }

      // User is fully registered and logged in
      if (profile.token && profile.user) {
        const redirectUrl = oauthService.buildRedirectUrl(frontendUrl, '/auth/google/success', {
          token: profile.token,
          type: 'user',
          name: profile.user.name,
          email: profile.user.email
        });
        return res.redirect(redirectUrl);
      }

      // User needs to complete registration (phone number required)
      if (profile.needsPhoneNumber) {
        const redirectUrl = oauthService.buildRedirectUrl(frontendUrl, '/auth/google/complete', {
          email: profile.email,
          name: profile.name,
          googleId: profile.googleId,
          type: 'user',
          profilePicture: profile.profilePicture || ''
        });
        return res.redirect(redirectUrl);
      }

      // Fallback error
      throw new Error('Unexpected OAuth state');
    } catch (error) {
      console.error('[OAuth] Google OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const errorMessage = encodeURIComponent(error.message || 'OAuth authentication failed');
      return res.redirect(`${frontendUrl}/login?error=${errorMessage}`);
    }
  }
);

/**
 * Google OAuth Routes for Hosts
 * Modern implementation with proper error handling and state management
 */

// Initiate Google OAuth for hosts
router.get('/google/host', (req, res, next) => {
  // Verify OAuth credentials
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('[OAuth] Google OAuth credentials missing');
    return res.status(500).json({ 
      success: false,
      message: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env',
      error: 'Missing OAuth credentials'
    });
  }
  
  // Generate state token for CSRF protection
  const returnUrl = req.query.returnUrl || '/host/dashboard';
  const state = oauthService.generateStateToken({ 
    type: 'host',
    returnUrl,
    timestamp: Date.now()
  });
  
  // Store state in session/cookie for validation
  req.session = req.session || {};
  req.session.oauthState = state;
  
  // Call passport authenticate with state
  const authMiddleware = passport.authenticate('google-host', { 
    scope: ['profile', 'email'],
    state: state
  });
  authMiddleware(req, res, next);
});

// Google OAuth callback for hosts
router.get('/google/host/callback',
  passport.authenticate('google-host', { session: false, failureRedirect: '/host/login?error=oauth_failed' }),
  async (req, res) => {
    try {
      const profile = req.user;
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      if (!profile) {
        throw new Error('OAuth profile not received');
      }

      // Host is fully registered and logged in
      if (profile.token && profile.host) {
        const redirectUrl = oauthService.buildRedirectUrl(frontendUrl, '/auth/google/success', {
          token: profile.token,
          type: 'host',
          name: profile.host.name,
          email: profile.host.email,
          providerType: profile.host.providerType
        });
        return res.redirect(redirectUrl);
      }

      // Host needs to complete registration (phone number and provider type required)
      if (profile.needsPhoneNumber) {
        const redirectUrl = oauthService.buildRedirectUrl(frontendUrl, '/auth/google/complete', {
          email: profile.email,
          name: profile.name,
          googleId: profile.googleId,
          type: 'host',
          profilePicture: profile.profilePicture || ''
        });
        return res.redirect(redirectUrl);
      }

      // Fallback error
      throw new Error('Unexpected OAuth state');
    } catch (error) {
      console.error('[OAuth] Google OAuth host callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const errorMessage = encodeURIComponent(error.message || 'OAuth authentication failed');
      return res.redirect(`${frontendUrl}/host/login?error=${errorMessage}`);
    }
  }
);

/**
 * Complete Google OAuth registration
 * Handles phone number and provider type collection for new OAuth users
 */
router.post('/google/complete', async (req, res) => {
  try {
    const { email, name, googleId, phoneNumber, type, providerType, profilePicture } = req.body;

    // Validate required fields
    if (!email || !phoneNumber || !googleId || !type) {
      return res.status(400).json({ 
        success: false,
        message: 'Email, phone number, and account type are required' 
      });
    }

    let result;
    
    if (type === 'user') {
      // Complete user registration
      result = await oauthService.completeUserRegistration({
        email,
        name,
        googleId,
        phoneNumber,
        profilePicture
      });
      
      return res.json({
        success: true,
        message: 'Account created successfully',
        token: result.token,
        user: result.user
      });
      
    } else if (type === 'host') {
      // Validate provider type for hosts
      if (!providerType) {
        return res.status(400).json({ 
          success: false,
          message: 'Provider type is required for host accounts' 
        });
      }

      // Complete host registration
      result = await oauthService.completeHostRegistration({
        email,
        name,
        googleId,
        phoneNumber,
        providerType,
        profilePicture
      });
      
      return res.json({
        success: true,
        message: 'Host account created successfully',
        token: result.token,
        host: result.host
      });
    }

    return res.status(400).json({ 
      success: false,
      message: 'Invalid account type. Must be "user" or "host"' 
    });
    
  } catch (error) {
    console.error('[OAuth] Complete registration error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      if (error.keyPattern?.email) {
        return res.status(400).json({ 
          success: false,
          message: 'Account with this email already exists' 
        });
      }
      if (error.keyPattern?.phoneNumber) {
        return res.status(400).json({ 
          success: false,
          message: 'Account with this phone number already exists' 
        });
      }
    }
    
    // Handle validation errors
    if (error.message) {
      return res.status(400).json({ 
        success: false,
        message: error.message 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;


