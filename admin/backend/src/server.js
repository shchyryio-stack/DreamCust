const app = require('./app');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const { startTrackingCron } = require('./services/trackingCron');

dotenv.config();

const PORT = process.env.PORT || 5001;

(async () => {
  await connectDB();

  // Start tracking cron after DB connects
  startTrackingCron();

  app.listen(PORT, () => {
    console.log(`AWIS Admin Backend running on port ${PORT}`);
  });
})();
