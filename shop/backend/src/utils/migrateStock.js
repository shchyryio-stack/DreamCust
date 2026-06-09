const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from shop backend config
dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/shop';

console.log('Connecting to MongoDB at:', mongoUri);

// Define the updated schema
const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    productType: { type: String },
    status: { type: String, default: 'Draft' },
    variants: [{
      id: String,
      colorName: String,
      inventory: {
        quantity: { type: Number, default: 0 },
        warehouses: [{
          quantity: { type: Number, default: 0 }
        }]
      }
    }],
    computed: {
      inStock: { type: Boolean, default: false },
      totalQuantity: { type: Number, default: 0 }
    }
  },
  { strict: false }
);

const Product = mongoose.model('Product', productSchema);

async function migrate() {
  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully.');

    const products = await Product.find({});
    console.log(`Found ${products.length} products to migrate.`);

    let updatedCount = 0;

    for (const prod of products) {
      console.log(`Processing product: "${prod.title}" (ID: ${prod._id}, Type: ${prod.productType}, Status: ${prod.status})`);
      
      // Update variants inventory quantity
      let totalQuantity = 0;
      if (prod.variants && prod.variants.length > 0) {
        prod.variants.forEach(v => {
          const warehouses = v.inventory?.warehouses || [];
          const variantQty = warehouses.reduce((sum, w) => sum + (w.quantity || 0), 0);
          
          if (!v.inventory) {
            v.inventory = {};
          }
          v.inventory.quantity = variantQty;
          totalQuantity += variantQty;
        });
      } else {
        // Fallback for non-variant structure if any exists
        const oldQty = prod.inventory?.quantity || 0;
        totalQuantity = oldQty;
      }

      const inStock = totalQuantity > 0;
      
      prod.computed = {
        inStock,
        totalQuantity
      };

      // Ensure productType is lowercase if it exists
      if (prod.productType) {
        prod.productType = prod.productType.toLowerCase();
      } else if (prod.category) {
        // Fallback category to lowercase productType if productType is missing
        prod.productType = prod.category.toLowerCase();
      }

      // Mark fields as modified so Mongoose saves them
      prod.markModified('variants');
      prod.markModified('computed');
      prod.markModified('productType');

      await prod.save();
      console.log(`  -> Migrated successfully. Total Qty: ${totalQuantity}, In Stock: ${inStock}, ProductType: ${prod.productType}`);
      updatedCount++;
    }

    console.log(`Migration finished. Successfully updated ${updatedCount} products.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
