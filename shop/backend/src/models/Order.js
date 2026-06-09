const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [
      {
        productId: { type: String, required: true },
        name: { type: String, required: true },
        qty: { type: Number, required: true, default: 1 },
        price: { type: Number, required: true },
        image: { type: String },
        isCustomBuild: { type: Boolean, default: false },
        components: { type: mongoose.Schema.Types.Mixed },
        services: { type: mongoose.Schema.Types.Mixed }
      },
    ],
    totalPrice: { type: Number, required: true, default: 0 },
    addressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
    ttn: { type: String },
    ttnRef: { type: String },
    shipmentDetails: {
      packagingType: { type: String },
      length: { type: Number },
      width: { type: Number },
      height: { type: Number },
      actualWeight: { type: Number },
      volumetricWeight: { type: Number },
      description: { type: String },
      cargoType: { type: String },
      comment: { type: String },
    },
    status: {
      type: String,
      enum: ['pending', 'new', 'confirmed', 'in_processing', 'shipped', 'in_transit', 'delivered', 'received', 'cancelled', 'refused'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
