const express = require('express');
const router = express.Router();
const { getProducts, getFilters, getProductBySlug, createProductReview, addReviewComment } = require('../controllers/productController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').get(getProducts);
router.route('/filters').get(getFilters);
router.route('/:slug').get(getProductBySlug);
router.route('/:id/review').post(protect, createProductReview);
router.route('/:productId/reviews/:reviewId/comment').post(protect, addReviewComment);

module.exports = router;
