const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // ── Global Product Data ──
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  blueprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'CategoryBlueprint' },
  productType: { type: String },

  status: {
    type: String,
    enum: ['Published', 'Hidden', 'Draft', 'Scheduled', 'Archived'],
    default: 'Draft'
  },
  publishing: {
    isScheduled: { type: Boolean, default: false },
    publishAt: { type: Date }
  },

  // Characteristics (blueprint-driven, dynamic object)
  specifications: { type: mongoose.Schema.Types.Mixed, default: {} },

  // Key Highlights
  highlights: [{
    id: String,
    title: String,
    description: String,
    icon: String
  }],

  // Compatibility Rules
  compatibility: [{
    id: String,
    title: String,
    tags: [{
      id: String,
      label: String,
      color: String
    }]
  }],

  // Global Media (3D models, videos, documents — shared across variants)
  media: {
    models: [String],
    videos: [String],
    documents: [String]
  },

  // ── Color Variants ──
  variants: [{
    id: String,
    colorName: { type: String, required: true },
    colorHex: { type: String, required: true },
    slug: String,

    gallery: [{
      url: String,
      isPrimary: Boolean,
      order: Number
    }],

    pricing: {
      price: { type: Number, default: 0, min: 0 }
    },

    inventory: {
      quantity: { type: Number, default: 0 },
      warehouses: [{
        id: String,
        name: String,
        quantity: { type: Number, default: 0 },
        reserved: { type: Number, default: 0 }
      }]
    },

    discounts: [{
      id: String,
      name: String,
      value: { type: Number, min: 0, max: 99 },
      startDate: Date,
      endDate: Date,
      isEnabled: { type: Boolean, default: false }
    }]
  }],

  // ── Computed Normalized Availability ──
  computed: {
    inStock: { type: Boolean, default: false },
    totalQuantity: { type: Number, default: 0 }
  },

  // ── Metadata ──
  rating: { type: Number, required: true, default: 0 },
  numReviews: { type: Number, required: true, default: 0 },
  featured: { type: Boolean, default: false },
  badges: [String]
}, { timestamps: true });

module.exports = productSchema;
