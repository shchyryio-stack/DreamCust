const { getFiltersForProductType } = require('../filters/filterProcessor');

/**
 * GET /api/filters/:category
 *
 * Returns dynamic filters for the category/productType using filterProcessor.
 */
const getCategoryFilters = async (req, res, next) => {
  try {
    const { category } = req.params;
    const result = await getFiltersForProductType(category);
    
    if (!result || !result.filters || result.filters.length === 0) {
      return res.status(404).json({ message: `No filter schema found for category/productType "${category}"` });
    }

    res.json({
      category: category.toLowerCase(),
      filters: result.filters,
      values: result.values
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCategoryFilters };

