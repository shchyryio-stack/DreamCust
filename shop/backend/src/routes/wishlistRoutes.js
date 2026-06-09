const express = require('express');
const router = express.Router();
const { toggleWishlist, getWishlist, syncWishlist } = require('../controllers/wishlistController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/toggle', protect, toggleWishlist);
router.post('/sync', protect, syncWishlist);
router.get('/', protect, getWishlist);
router.get('/:userId', protect, getWishlist); // To fulfill prompt exactly, though '/' handles it via protect

module.exports = router;
