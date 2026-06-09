const cron = require('node-cron');
const mongoose = require('mongoose');
const { getShopDb } = require('../config/db');
const novaPoshtaService = require('./novaPoshtaService');

// Helper to get models safely
const getModel = (modelName, collectionName) => {
  const shopDb = getShopDb();
  if (!shopDb) throw new Error('Shop DB not connected');

  if (shopDb.models[modelName]) {
    return shopDb.models[modelName];
  }

  return shopDb.model(modelName, new mongoose.Schema({}, { strict: false, collection: collectionName }));
};

/**
 * Map Nova Poshta StatusCode to our internal order status
 */
const mapStatusCode = (statusCode, currentStatus) => {
  const code = Number(statusCode);

  switch (code) {
    case 1: // Створена
      return 'in_processing';
    case 2: // Видалена
      return 'refused';
    case 3: // Номер не знайдено
      return currentStatus;
    case 4: // В місті відправника
    case 5: // В дорозі
    case 6: // В місті одержувача
    case 7: // Прибула на відділення
    case 8: // На відділенні
      return 'in_transit';
    case 9: // Отримана
      return 'received';
    case 10: // Відмова
    case 11: // Відмова
    case 102: // Відмова одержувача
    case 103: // Відмова відправника
      return 'refused';
    case 104: // Змінено адресу
    case 105: // Припинено зберігання
      return 'in_transit';
    case 106: // Одержано і створено ЄН зворотньої доставки
      return 'received';
    case 107: // Нараховується плата за зберігання
      return 'in_transit';
    case 108: // Повернення
      return 'refused';
    default:
      return currentStatus;
  }
};

/**
 * Check tracking for all active orders (manual or cron trigger)
 */
const checkOrderTracking = async () => {
  try {
    const Order = getModel('Order', 'orders');

    const orders = await Order.find({
      status: { $in: ['in_processing', 'in_transit'] },
      ttn: { $exists: true, $ne: null, $ne: '' },
    }).lean();

    if (orders.length === 0) {
      console.log('[TrackingCron] No active orders to track');
      return;
    }

    console.log(`[TrackingCron] Checking tracking for ${orders.length} orders...`);

    for (const order of orders) {
      try {
        const trackingInfo = await novaPoshtaService.getTrackingInfo(order.ttn);

        if (!trackingInfo) {
          console.log(`[TrackingCron] No tracking data for TTN ${order.ttn}`);
          continue;
        }

        const newStatus = mapStatusCode(trackingInfo.StatusCode, order.status);

        const updateData = {
          trackingData: {
            statusCode: trackingInfo.StatusCode,
            statusDescription: trackingInfo.Status || trackingInfo.StatusDescription || '',
            lastUpdate: new Date(),
            cityRecipient: trackingInfo.CityRecipient || trackingInfo.RecipientAddress || '',
            warehouseRecipient: trackingInfo.WarehouseRecipient || trackingInfo.RecipientWarehouse || '',
            scheduledDeliveryDate: trackingInfo.ScheduledDeliveryDate || '',
            actualDeliveryDate: trackingInfo.ActualDeliveryDate || '',
          },
        };

        if (newStatus !== order.status) {
          updateData.status = newStatus;
          console.log(
            `[TrackingCron] Order ${order._id} (TTN: ${order.ttn}): status changed "${order.status}" → "${newStatus}" (NP code: ${trackingInfo.StatusCode})`
          );
        }

        await Order.findByIdAndUpdate(order._id, { $set: updateData });
      } catch (err) {
        console.error(`[TrackingCron] Error tracking order ${order._id} (TTN: ${order.ttn}):`, err.message);
      }
    }

    console.log('[TrackingCron] Tracking check complete');
  } catch (error) {
    console.error('[TrackingCron] Fatal error:', error.message);
  }
};

/**
 * Start the tracking cron job (every 15 minutes)
 */
const startTrackingCron = () => {
  console.log('[TrackingCron] Starting tracking cron job (every 15 minutes)');

  cron.schedule('*/15 * * * *', () => {
    console.log(`[TrackingCron] Cron triggered at ${new Date().toISOString()}`);
    checkOrderTracking();
  });
};

module.exports = {
  startTrackingCron,
  checkOrderTracking,
};
