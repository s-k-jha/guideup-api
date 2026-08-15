const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const PHONE_REGEX = /^\+?[\d\s\-().]{7,20}$/;

const signUserToken = (user) => {
  return jwt.sign({ id: user._id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
});

/**
 * POST /api/auth/register
 * Public. Creates a real (password-backed) student account, upgrading
 * a prior guest-booking User record in place if one exists.
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const errors = [];

    if (!name || name.trim().length < 2) errors.push('Name must be at least 2 characters');
    if (!email || !validator.isEmail(email)) errors.push('Valid email is required');
    if (!phone || !PHONE_REGEX.test(phone)) errors.push('Valid phone number is required');
    if (!password || password.length < 8) errors.push('Password must be at least 8 characters');

    if (errors.length > 0) return errorResponse(res, 'Validation failed', 400, errors);

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (user && user.password) {
      return errorResponse(res, 'An account with this email already exists', 409);
    }

    if (user) {
      // Upgrade a prior guest-booking record into a real account.
      user.name = name;
      user.phone = phone;
      user.password = password;
      await user.save();
    } else {
      user = await User.create({ name, email: normalizedEmail, phone, password });
    }

    const token = signUserToken(user);
    return successResponse(res, { token, user: toPublicUser(user) }, 'Account created', 201);
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, 'An account with this email already exists', 409);
    }
    return errorResponse(res, error.message, 500);
  }
};

/**
 * POST /api/auth/login
 * Public.
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user || !user.password || !(await user.comparePassword(password))) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const token = signUserToken(user);
    return successResponse(res, { token, user: toPublicUser(user) }, 'Login successful');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * GET /api/auth/me
 * protectUser
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return errorResponse(res, 'User not found', 404);
    return successResponse(res, { user: toPublicUser(user) });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { registerUser, loginUser, getMe };
