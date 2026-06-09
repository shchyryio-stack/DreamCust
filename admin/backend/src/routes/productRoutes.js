const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getProducts);
router.route('/create').post(protect, createProduct);
router.route('/:id')
  .get(protect, getProductById)
  .put(protect, updateProduct) // The prompt mentions /api/products/update/:id but usually it's put /:id. I'll add the explicit route below just in case.
  .delete(protect, deleteProduct);

router.route('/update/:id').put(protect, updateProduct);
router.route('/delete/:id').delete(protect, deleteProduct);

module.exports = router;
