const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  label: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  middleName: { type: String, default: '' },
  phone: { type: String, required: true },
  deliveryType: { type: String, enum: ['courier', 'branch', 'locker'], required: true },
  city: { type: String, required: true },
  cityRef: { type: String, default: '' },
  details: { type: String, default: '' },
  street: { type: String },
  house: { type: String },
  apartment: { type: String },
  courierComment: { type: String, maxlength: 150 },
  warehouseRef: { type: String, default: '' },
  warehouseName: { type: String, default: '' },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Address', addressSchema);
