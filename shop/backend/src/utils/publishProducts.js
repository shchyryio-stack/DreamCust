const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/shop');
  const res = await mongoose.connection.db.collection('products').updateMany({}, { $set: { status: 'Published' } });
  console.log('Successfully published products:', res.modifiedCount || res.matchedCount);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
