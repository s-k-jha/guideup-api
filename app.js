require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middlewares/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const slotRoutes = require('./routes/slotRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const couponRoutes = require('./routes/couponRoutes');
const mentorRoutes = require('./routes/mentorRoutes');
const workingHoursRoutes = require('./routes/workingHoursRoutes');
const meetingRoutes = require('./routes/meetingRoutes');

const app = express();

// ─── Security Middleware ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limit for payment endpoints
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many payment requests. Please try again later.' },
});
app.use('/api/payment/', paymentLimiter);

// ─── Body Parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Input Sanitization ─────────────────────────────────────────────────────
app.use(mongoSanitize()); // Prevents NoSQL injection attacks

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Mentorship Booking API is running',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/admin', authRoutes);             // POST /api/admin/login
app.use('/api/sessions', sessionRoutes);       // GET/POST/PUT/DELETE
app.use('/api/admin/sessions', sessionRoutes); // Admin prefix alias (POST/PUT/DELETE)
app.use('/api/slots', slotRoutes);             // GET /api/slots
app.use('/api/admin/bookings', bookingRoutes); // GET, PATCH assign-mentor
app.use('/api/payment', paymentRoutes);        // POST create-order, verify
app.use('/api/coupons', couponRoutes);         // POST validate, admin CRUD
app.use('/api/admin/coupons', couponRoutes);   // Admin coupon management
app.use('/api/admin/mentors', mentorRoutes);   // Admin mentor management
app.use('/api/working-hours', workingHoursRoutes);
app.use('/api/meeting', meetingRoutes);           // GET /api/meeting/join/:bookingId

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
