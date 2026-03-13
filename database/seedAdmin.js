const Admin = require('../models/Admin');
const WorkingHours = require('../models/WorkingHours');

const seedAdmin = async () => {
  try {
    const existingAdmin = await Admin.findOne({ email: process.env.ADMIN_EMAIL });

    if (!existingAdmin) {
      await Admin.create({
        name: 'Admin',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      });
      console.log(`Default admin created: ${process.env.ADMIN_EMAIL}`);
    }

    // Seed default working hours if none exist
    const existingWH = await WorkingHours.findOne({ isActive: true });
    if (!existingWH) {
      await WorkingHours.create({
        startTime: '18:00',
        endTime: '21:00',
        slotResolutionMinutes: 15,
        isActive: true,
      });
      console.log('Default working hours seeded: 18:00 - 21:00');
    }
  } catch (error) {
    console.error('Seed error:', error.message);
  }
};

module.exports = seedAdmin;
