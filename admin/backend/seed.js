const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('./src/models/Employee');

dotenv.config();

mongoose.connect(process.env.MONGO_URI);

const seedAdmin = async () => {
  try {
    const existingAdmin = await Employee.findOne({ login: 'admin' });
    if (!existingAdmin) {
      await Employee.create({
        login: 'admin',
        password: 'password123',
        corporateEmail: 'admin@awis.com',
        fullName: 'Admin User',
        phoneNumber: '+1234567890',
        position: 'System Administrator',
        department: 'IT',
        role: 'admin',
        age: 30
      });
      console.log('Admin user created. Login: admin, Password: password123');
    } else {
      console.log('Admin user already exists.');
    }
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedAdmin();
