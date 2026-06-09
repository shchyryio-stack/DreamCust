const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employeeSchema = new mongoose.Schema({
  login: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  corporateEmail: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  position: { type: String, required: true },
  department: { 
    type: String, 
    required: true,
    enum: ['IT', 'Call Center', 'Warehouse', 'Management', 'Marketing', 'Support']
  },
  age: { type: Number },
  avatar: { type: String },
  role: { type: String, default: 'employee' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

employeeSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

employeeSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Use the collection 'users' to store employees inside admin DB
module.exports = mongoose.model('Employee', employeeSchema, 'users');
