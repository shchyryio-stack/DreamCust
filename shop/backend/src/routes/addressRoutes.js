const express = require('express');
const router = express.Router();
const { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = require('../controllers/addressController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
  .get(protect, getAddresses)
  .post(protect, addAddress);

router.route('/:id')
  .put(protect, updateAddress)
  .delete(protect, deleteAddress);

router.patch('/:id/default', protect, setDefaultAddress);

module.exports = router;
