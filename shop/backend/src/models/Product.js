const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    // Global Product Data
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, maxlength: 500 },
    brand: { type: String },
    category: { type: String, required: true },
    subcategory: { type: String },
    blueprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'CategoryBlueprint' },
    productType: { type: String },

    // Flat price for legacy compatibility
    price: { type: Number },
    oldPrice: { type: Number },

    // Structured pricing
    pricing: {
      price: { type: Number, required: true, default: 0, min: 0 },
      discount: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' }
    },

    // Characteristics / Specifications (Mixed object)
    specifications: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    // Highlights
    highlights: [{
      id: String,
      title: String,
      description: String,
      icon: String
    }],

    // Compatibility metadata
    compatibility: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    // Inventory tracking
    inventory: {
      quantity: { type: Number, default: 0 },
      reserved: { type: Number, default: 0 },
      incoming: { type: Number, default: 0 },
      sold: { type: Number, default: 0 },
      warehouseLocation: { type: String }
    },

    // Media assets
    media: {
      images: [{ type: String }],
      thumbnail: { type: String },
      models: [{ type: String }],     // .glb, .gltf
      textures: [{ type: String }],
      videos: [{ type: String }],
      documents: [{ type: String }]   // manuals, spec sheets
    },

    // Legacy fields
    images: [{ type: String }],
    thumbnail: { type: String },

    // Builder configurator flag
    builderReady: { type: Boolean, default: false },

    // SKU / status
    sku: { type: String },
    status: {
      type: String,
      default: 'Draft'
    },
    publishing: {
      isScheduled: { type: Boolean, default: false },
      publishAt: { type: Date }
    },

    // Color Variants
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

      // Keep images/color for legacy frontends if needed
      images: [String],
      color: String,
      name: String,
      price: Number,
      oldPrice: Number,

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

    // Pack pricing (legacy support)
    packPricing: {
      isPack: { type: Boolean, default: false },
      basePrice: { type: Number },
      unitsPerPack: { type: Number },
      pricePerUnit: { type: Number },
      packPrice: { type: Number }
    },

    // Promotions
    promotions: {
      type: {
        type: String,
        default: 'None'
      },
      value: { type: Number },
      startDate: { type: Date },
      endDate: { type: Date },
      isActive: { type: Boolean, default: false }
    },

    // Relations
    relations: {
      relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
      recommendedUpgrades: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
      alternativeProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
    },

    badges: [{ type: String }],
    rating: { type: Number, required: true, default: 0 },
    numReviews: { type: Number, required: true, default: 0 },
    featured: { type: Boolean, default: false },

    // Computed Normalized Availability
    computed: {
      inStock: { type: Boolean, default: false },
      totalQuantity: { type: Number, default: 0 }
    },
  },
  { timestamps: true }
);

productSchema.index({ title: 'text', brand: 'text' });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
