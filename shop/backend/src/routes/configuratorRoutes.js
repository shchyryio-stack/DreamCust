const express = require('express');
const router = express.Router();
const { getCompatibleParts, validateBuild } = require('../controllers/configuratorController');

router.post('/compatible', getCompatibleParts);
router.post('/validate', validateBuild);

module.exports = router;
