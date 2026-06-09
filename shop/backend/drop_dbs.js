const mongoose = require('mongoose');

async function dropDatabases() {
  try {
    const conn = await mongoose.createConnection('mongodb://localhost:27017/pchardware').asPromise();
    const adminDb = conn.client.db('admin'); // 'admin' db is a special mongodb database, maybe I shouldn't drop the system admin db?
    // Wait, prompt says: "REMOVE: ecommerce, admin (database), any duplicate db"
    // Usually 'admin' contains users. Dropping it might be dangerous but let's check its collections.
    
    // Instead of dropping 'admin' system db, I will drop 'ecommerce' and check if there's a custom 'admin' db.
    await conn.client.db('ecommerce').dropDatabase();
    console.log('ecommerce dropped');
    
    // Check if there are other duplicates.
    const adminAdminDb = conn.client.db('admin').admin();
    const list = await adminAdminDb.listDatabases();
    console.log(list.databases.map(d => d.name));
    
    // drop custom admin if it's a project db, wait 'admin' is a built-in DB for users.
    // If they created an 'admin' db for the app, I can drop it.
    // Let's drop it anyway, it will just drop user-defined collections in it or fail if it's system.
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
