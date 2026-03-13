require('dotenv').config();
const app = require('./app');
const connectDB = require('./database/connection');
const { startReminderScheduler } = require('./utils/reminderScheduler');
const seedAdmin = require('./database/seedAdmin');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Seed admin account if not exists
    await seedAdmin();

    // Start reminder scheduler
    startReminderScheduler();

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`\n🚀 Mentorship Booking API running on port ${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err.message);
  process.exit(1);
});

startServer();
