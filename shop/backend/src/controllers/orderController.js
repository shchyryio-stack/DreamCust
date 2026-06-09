const Order = require('../models/Order');
const Address = require('../models/Address');

// wrapper щоб не писати try/catch всюди
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);


// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const { items, addressId, ttn } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No order items' });
  }

  if (!addressId) {
    return res.status(400).json({ message: 'Address is required' });
  }

  const addressDoc = await Address.findOne({
    _id: addressId,
    userId: req.user._id
  });

  if (!addressDoc) {
    return res.status(404).json({ message: 'Delivery address not found' });
  }

  const orderItems = items.map(item => ({
    productId: item.productId,
    name: item.name,
    qty: item.qty || item.quantity || 1,
    price: item.price,
    image: item.image,
    isCustomBuild: item.isCustomBuild || false,
    components: item.components || null,
    services: item.services || null
  }));

  const totalPrice = orderItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0
  );

  const order = new Order({
    userId: req.user._id,
    items: orderItems,
    totalPrice,
    addressId: addressDoc._id,
    ttn: ttn || '',
    status: 'pending'
  });

  const createdOrder = await order.save();

  res.status(201).json(createdOrder);
});


// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ userId: req.user._id })
    .populate('addressId')
    .sort({ createdAt: -1 });

  const mappedOrders = orders.map(order => {
    const orderObj = order.toObject();
    if (orderObj.addressId && typeof orderObj.addressId === 'object') {
      const addr = orderObj.addressId;
      orderObj.delivery = {
        type: addr.deliveryType,
        city: addr.city,
        address: addr.street ? `${addr.street}, ${addr.house}${addr.apartment ? `, apt. ${addr.apartment}` : ''}` : '',
        warehouse: addr.warehouseName || '',
      };
    }
    return orderObj;
  });

  res.json(mappedOrders);
});


// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  if (order.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to modify this order' });
  }

  if (order.status !== 'pending') {
    return res.status(400).json({
      message: 'Only pending orders can be cancelled'
    });
  }

  order.status = 'cancelled';

  const updatedOrder = await order.save();

  res.json(updatedOrder);
});

module.exports = {
  createOrder,
  getOrders,
  cancelOrder
};