const express = require('express');
const {
  getClients,
  getClientById,
  updateClient,
  getClientOrders,
  getClientAddresses,
  getClientWishlist,
  getClientReviews
} = require('../controllers/clientController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getClients);
router.route('/:id').get(protect, getClientById).put(protect, updateClient);
router.route('/orders/:id').get(protect, getClientOrders);
router.route('/addresses/:id').get(protect, getClientAddresses);
router.route('/wishlist/:id').get(protect, getClientWishlist);
router.route('/reviews/:id').get(protect, getClientReviews);

module.exports = router;
