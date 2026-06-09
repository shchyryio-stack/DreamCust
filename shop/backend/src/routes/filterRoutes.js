const express = require('express');
const router = express.Router();
const { getCategoryFilters } = require('../controllers/filterController');

router.get('/:category', getCategoryFilters);

module.exports = router;
