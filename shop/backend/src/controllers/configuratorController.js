const configuratorService = require('../services/configuratorService');

const getCompatibleParts = async (req, res, next) => {
  try {
    const { category, currentBuildIds } = req.body;
    const ids = Array.isArray(currentBuildIds) ? currentBuildIds : [];
    
    const parts = await configuratorService.getCompatibleParts(category, ids);
    res.json(parts);
  } catch (error) {
    next(error);
  }
};

const validateBuild = async (req, res, next) => {
  try {
    const { buildIds } = req.body;
    const ids = Array.isArray(buildIds) ? buildIds : [];
    
    const result = await configuratorService.validateBuild(ids);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { getCompatibleParts, validateBuild };
