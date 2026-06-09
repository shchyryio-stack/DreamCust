const express = require('express');
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getCategories);
router.route('/create').post(protect, createCategory);
router.route('/demo/gpu').post(protect, require('../controllers/categoryController').createDemoGpuBlueprint);
router.route('/:id').get(protect, getCategoryById);
router.route('/update/:id').put(protect, updateCategory);
router.route('/delete/:id').delete(protect, deleteCategory);

module.exports = router;
