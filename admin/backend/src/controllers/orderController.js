const mongoose = require('mongoose');
const { getShopDb } = require('../config/db');
const novaPoshtaService = require('../services/novaPoshtaService');

// Helper to get models safely (same pattern as clientController)
const getModel = (modelName, collectionName) => {
  const shopDb = getShopDb();
  if (!shopDb) throw new Error('Shop DB not connected');

  if (shopDb.models[modelName]) {
    return shopDb.models[modelName];
  }

  return shopDb.model(modelName, new mongoose.Schema({}, { strict: false, collection: collectionName }));
};

const ALLOWED_STATUSES = [
  'new',
  'pending',
  'in_processing',
  'shipped',
  'in_transit',
  'received',
  'completed',
  'cancelled',
  'refused',
];

// GET all orders
const getOrders = async (req, res) => {
  try {
    const Order = getModel('Order', 'orders');
    const Address = getModel('Address', 'addresses');

    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();

    // Attach address data to each order
    const ordersWithAddress = await Promise.all(
      orders.map(async (order) => {
        let address = null;
        if (order.addressId) {
          try {
            address = await Address.findById(order.addressId).lean();
          } catch (err) {
            console.error(`Failed to fetch address ${order.addressId}:`, err.message);
          }
        }
        return { ...order, address };
      })
    );

    res.json(ordersWithAddress);
  } catch (error) {
    console.error('getOrders error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// GET single order by ID
const getOrderById = async (req, res) => {
  try {
    const Order = getModel('Order', 'orders');
    const Address = getModel('Address', 'addresses');
    const User = getModel('User', 'users');

    const order = await Order.findById(req.params.id).lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Fetch address
    let address = null;
    if (order.addressId) {
      try {
        address = await Address.findById(order.addressId).lean();
      } catch (err) {
        console.error(`Failed to fetch address ${order.addressId}:`, err.message);
      }
    }

    // Fetch user
    let user = null;
    if (order.userId) {
      try {
        user = await User.findById(order.userId).lean();
        if (user) {
          delete user.password;
        }
      } catch (err) {
        console.error(`Failed to fetch user ${order.userId}:`, err.message);
      }
    }

    res.json({ ...order, address, user });
  } catch (error) {
    console.error('getOrderById error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// POST accept an order — just change status to in_processing (no Nova Poshta calls)
const acceptOrder = async (req, res) => {
  try {
    const Order = getModel('Order', 'orders');

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const currentStatus = order.status || order.get('status');
    if (currentStatus !== 'pending' && currentStatus !== 'new') {
      return res.status(400).json({
        message: `Cannot accept order with status "${currentStatus}". Must be "pending" or "new".`,
      });
    }

    await Order.findByIdAndUpdate(order._id, {
      $set: { status: 'in_processing' },
    });

    const updatedOrder = await Order.findById(order._id).lean();
    res.json(updatedOrder);
  } catch (error) {
    console.error('acceptOrder error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// POST create shipment — fill packaging details, call Nova Poshta, generate TTN
const createShipment = async (req, res) => {
  try {
    const Order = getModel('Order', 'orders');
    const Address = getModel('Address', 'addresses');

    const {
      packagingType,
      length,
      width,
      height,
      actualWeight,
      description,
      cargoType,
      comment,
    } = req.body;

    // 1. Find order and verify status
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const currentStatus = order.status || order.get('status');
    if (currentStatus !== 'in_processing') {
      return res.status(400).json({
        message: `Cannot create shipment for order with status "${currentStatus}". Must be "in_processing".`,
      });
    }

    // 2. Validate required fields
    if (!packagingType) {
      return res.status(400).json({ message: 'Packaging type is required' });
    }
    if (!length || !width || !height) {
      return res.status(400).json({ message: 'Dimensions (length, width, height) are required' });
    }
    if (!actualWeight || actualWeight <= 0) {
      return res.status(400).json({ message: 'Actual weight is required and must be > 0' });
    }

    // 3. Calculate volumetric weight
    const volumetricWeight = parseFloat(((length * width * height) / 4000).toFixed(2));
    const finalWeight = Math.max(actualWeight, volumetricWeight);

    // 4. Fetch address
    const addressId = order.addressId || order.get('addressId');
    if (!addressId) {
      return res.status(400).json({ message: 'Order has no address' });
    }

    const address = await Address.findById(addressId).lean();
    if (!address) {
      return res.status(404).json({ message: 'Address not found for this order' });
    }

    // 5. Get sender refs
    const senderData = await novaPoshtaService.getSenderRefs();

    // 6. Determine recipient address ref and service type
    const recipientCityRef = address.cityRef;
    if (!recipientCityRef) {
      return res.status(400).json({ message: 'Address has no cityRef' });
    }

    let recipientAddressRef = '';
    let serviceType = 'WarehouseWarehouse';
    let recipientData = null;

    if (address.deliveryType === 'courier') {
      serviceType = 'WarehouseDoors';

      const streetName = address.street;
      if (!streetName) {
        return res.status(400).json({ message: 'Address has no street name for courier delivery' });
      }

      const streetRef = await novaPoshtaService.findStreetRef(recipientCityRef, streetName);

      recipientData = await novaPoshtaService.createRecipientCounterparty(
        address.firstName,
        address.lastName,
        address.middleName,
        address.phone,
        recipientCityRef
      );

      recipientAddressRef = await novaPoshtaService.createRecipientAddress(
        recipientData.recipientRef,
        streetRef,
        address.house,
        address.apartment
      );
    } else {
      // Branch or Locker delivery
      let recipientWarehouseRef = address.warehouseRef;
      if (!recipientWarehouseRef && address.warehouseName) {
        recipientWarehouseRef = await novaPoshtaService.findWarehouseRef(recipientCityRef, address.warehouseName);
      }
      if (!recipientWarehouseRef) {
        return res.status(400).json({ message: 'Cannot determine recipient warehouse ref' });
      }
      recipientAddressRef = recipientWarehouseRef;

      recipientData = await novaPoshtaService.createRecipientCounterparty(
        address.firstName,
        address.lastName,
        address.middleName,
        address.phone,
        recipientCityRef
      );
    }

    // 7. Build description
    const orderId = order._id.toString();
    const finalDescription = description || `Замовлення №${orderId.slice(-8)}`;
    const totalPrice = order.totalPrice || order.get('totalPrice') || 0;

    // 8. Create internet document with real data
    const documentResult = await novaPoshtaService.createInternetDocument({
      senderCityRef: senderData.senderCityRef,
      senderRef: senderData.senderRef,
      senderAddressRef: senderData.senderWarehouseRef,
      contactSenderRef: senderData.contactSenderRef,
      senderPhone: senderData.senderPhone,
      recipientRef: recipientData.recipientRef,
      recipientAddressRef: recipientAddressRef,
      contactRecipientRef: recipientData.contactRecipientRef,
      recipientPhone: address.phone,
      recipientCityRef: recipientCityRef,
      description: finalDescription,
      cost: totalPrice,
      serviceType: serviceType,
      weight: finalWeight,
      width: width,
      height: height,
      length: length,
      comment: comment || '',
    });

    // 9. Update order with TTN and shipment details
    await Order.findByIdAndUpdate(order._id, {
      $set: {
        status: 'shipped',
        ttn: documentResult.ttn,
        ttnRef: documentResult.ref,
        shipmentDetails: {
          packagingType,
          length,
          width,
          height,
          actualWeight,
          volumetricWeight,
          description: finalDescription,
          cargoType: cargoType || 'Побутова техніка',
          comment: comment || '',
        },
      },
    });

    const updatedOrder = await Order.findById(order._id).lean();

    // Return order + print URL
    const printUrl = `https://my.novaposhta.ua/orders/printDocument/orders[]/${documentResult.ref}/type/html/apiKey/${process.env.NOVA_POSHTA_API_KEY}`;

    res.json({ ...updatedOrder, printUrl });
  } catch (error) {
    console.error('createShipment error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// GET print URL for an order's waybill
const getPrintUrl = async (req, res) => {
  try {
    const Order = getModel('Order', 'orders');

    const order = await Order.findById(req.params.id).lean();
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.ttnRef) {
      return res.status(400).json({ message: 'Order has no waybill reference for printing' });
    }

    const printUrl = `https://my.novaposhta.ua/orders/printDocument/orders[]/${order.ttnRef}/type/html/apiKey/${process.env.NOVA_POSHTA_API_KEY}`;

    res.json({ printUrl, ttn: order.ttn });
  } catch (error) {
    console.error('getPrintUrl error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// PATCH update order status
const updateOrderStatus = async (req, res) => {
  try {
    const Order = getModel('Order', 'orders');

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status "${status}". Allowed: ${ALLOWED_STATUSES.join(', ')}`,
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await Order.findByIdAndUpdate(order._id, { $set: { status } });

    const updatedOrder = await Order.findById(order._id).lean();
    res.json(updatedOrder);
  } catch (error) {
    console.error('updateOrderStatus error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// GET tracking info for an order
const getOrderTracking = async (req, res) => {
  try {
    const Order = getModel('Order', 'orders');

    const order = await Order.findById(req.params.id).lean();
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.ttn) {
      return res.status(400).json({ message: 'Order has no TTN number' });
    }

    const trackingInfo = await novaPoshtaService.getTrackingInfo(order.ttn);
    res.json({ ttn: order.ttn, tracking: trackingInfo });
  } catch (error) {
    console.error('getOrderTracking error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  acceptOrder,
  createShipment,
  getPrintUrl,
  updateOrderStatus,
  getOrderTracking,
};
