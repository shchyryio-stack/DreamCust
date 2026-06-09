const mongoose = require('mongoose');

let adminDb;
let shopDb;

const connectDB = async () => {
  try {
    adminDb = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Admin MongoDB Connected: ${mongoose.connection.host}`);
    
    shopDb = mongoose.createConnection(process.env.SHOP_MONGO_URI);
    shopDb.on('connected', () => {
      console.log(`Shop MongoDB Connected: ${shopDb.host}`);
    });
    shopDb.on('error', (err) => {
      console.error(`Shop MongoDB Connection Error: ${err.message}`);
    });

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const getShopDb = () => shopDb;

module.exports = { connectDB, getShopDb };
