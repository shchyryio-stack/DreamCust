const mongoose = require('mongoose');

async function dropDatabases() {
  try {
    const conn = await mongoose.createConnection('mongodb://localhost:27017/pchardware?retryWrites=false').asPromise();
    
    // We've already dropped ecommerce in the last script.
    
    try {
       await conn.client.db('admin').dropDatabase();
       console.log('admin dropped');
    } catch (e) {
       console.log('could not drop admin: ', e.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

dropDatabases();
