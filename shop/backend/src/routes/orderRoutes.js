const express = require('express');
const router = express.Router();
const { createOrder, getOrders, cancelOrder } = require('../controllers/orderController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').post(protect, createOrder).get(protect, getOrders);
router.route('/:id/cancel').put(protect, cancelOrder);

module.exports = router;
