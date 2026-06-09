const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String },
    username: { type: String },
    phone: { type: String },
    avatar: { type: String },
    role: { type: String, enum: ['user', 'admin', 'manager'], default: 'user' },
    status: { type: String, enum: ['Active', 'Blocked', 'Suspended', 'VIP', 'Inactive'], default: 'Active' },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
module.exports = User;
