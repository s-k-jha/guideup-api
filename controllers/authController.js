const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');

    if (!admin || !(await admin.comparePassword(password))) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return successResponse(res, { token, admin: { id: admin._id, email: admin.email, name: admin.name } }, 'Login successful');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { adminLogin };
