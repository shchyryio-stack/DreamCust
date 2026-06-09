const express = require('express');
const {
  getOrders,
  getOrderById,
  acceptOrder,
  createShipment,
  getPrintUrl,
  updateOrderStatus,
  getOrderTracking,
} = require('../controllers/orderController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/accept').post(protect, acceptOrder);
router.route('/:id/ship').post(protect, createShipment);
router.route('/:id/print-url').get(protect, getPrintUrl);
router.route('/:id/status').patch(protect, updateOrderStatus);
router.route('/:id/tracking').get(protect, getOrderTracking);

module.exports = router;
