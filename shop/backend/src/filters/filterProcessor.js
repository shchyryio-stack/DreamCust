const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');

/**
 * Dynamically loads the filter configuration for a given productType.
 * Returns null if the file does not exist.
 */
const loadFiltersConfig = (productType) => {
  const filePath = path.join(__dirname, `${productType.toLowerCase()}.filters.js`);
  if (!fs.existsSync(filePath)) return null;

  // Clear require cache so changes are picked up in development
  delete require.cache[require.resolve(filePath)];
  return require(filePath);
};

/**
 * Main processor function to get dynamic filters and distinct values from MongoDB.
 */
const getFiltersForProductType = async (productType) => {
  const schema = loadFiltersConfig(productType);
  if (!schema) {
    return { filters: [] };
  }

  // Build a $facet pipeline dynamically from the schema
  const facetStages = {};
  
  // Check if price is in schema to compute range
  const hasPrice = schema.some(f => f.key === 'price');
  if (hasPrice) {
    facetStages.priceRange = [
      {
        $group: {
          _id: null,
          minPrice: { $min: '$pricing.price' },
          maxPrice: { $max: '$pricing.price' }
        }
      }
    ];
  }

  schema.forEach(filter => {
    if (filter.key === 'price') return;

    switch (filter.type) {
      case 'range':
        if (filter.key === 'price') {
          // Price stays as min/max range
          break;
        }
        // Non-price ranges → collect distinct values for checkbox display
        facetStages[filter.key] = [
          { $match: { [filter.field]: { $exists: true, $ne: null } } },
          { $group: { _id: null, values: { $addToSet: `$${filter.field}` } } }
        ];
        break;

      case 'checkbox':
      case 'select':
      case 'multi-select':
        if (filter.type === 'multi-select') {
          facetStages[filter.key] = [
            { $unwind: { path: `$${filter.field}`, preserveNullAndEmptyArrays: false } },
            { $group: { _id: null, values: { $addToSet: `$${filter.field}` } } }
          ];
        } else {
          facetStages[filter.key] = [
            { $match: { [filter.field]: { $exists: true, $ne: null } } },
            { $group: { _id: null, values: { $addToSet: `$${filter.field}` } } }
          ];
        }
        break;

      case 'boolean':
        facetStages[filter.key] = [
          { $match: { [filter.field]: { $exists: true } } },
          { $group: { _id: null, values: { $addToSet: `$${filter.field}` } } }
        ];
        break;

      default:
        break;
    }
  });

  const mapCategoryToProductTypes = (cat) => {
    const normalized = (cat || '').toLowerCase().trim();
    const map = {
      cpu: ['CPU'],
      motherboard: ['Motherboard'],
      ram: ['RAM'],
      gpu: ['GPU'],
      storage: ['SSD'],
      case: ['Case'],
      psu: ['PSU'],
      cooling: ['Cooler'],
      monitor: ['Monitor'],
      peripherals: ['keyboard', 'mouse', 'headphones', 'Keyboard', 'Mouse', 'Headphones'],
      networking: ['Router', 'Switch', 'Network Card'],
      accessories: ['Mousepad', 'Microphone', 'Webcam']
    };
    return map[normalized] || [cat];
  };

  const types = mapCategoryToProductTypes(productType);
  const typeQueries = [];
  types.forEach(t => {
    typeQueries.push(t, t.toLowerCase(), t.toUpperCase());
  });

  const pipeline = [
    { 
      $match: { 
        productType: { $in: [...new Set(typeQueries)] },
        status: 'Published',
        'computed.inStock': true
      } 
    }
  ];

  if (Object.keys(facetStages).length > 0) {
    pipeline.push({ $facet: facetStages });
  }

  const aggregationResult = await Product.aggregate(pipeline);
  const result = aggregationResult[0] || {};

  const valuesMap = {};
  
  if (hasPrice) {
    const priceData = result.priceRange?.[0];
    valuesMap.minPrice = priceData?.minPrice ?? 0;
    valuesMap.maxPrice = priceData?.maxPrice ?? 0;
  }

  const enrichedFilters = schema.map(filter => {
    const enriched = { 
      key: filter.key,
      label: filter.label,
      type: filter.type || 'checkbox',
      field: filter.field,
      values: []
    };

    if (filter.key === 'price') {
      enriched.min = valuesMap.minPrice;
      enriched.max = valuesMap.maxPrice;
      enriched.values = [valuesMap.minPrice, valuesMap.maxPrice];
      enriched.options = enriched.values;
      valuesMap[filter.key] = { min: enriched.min, max: enriched.max };
      return enriched;
    }

    const data = result[filter.key]?.[0];

    if (filter.type === 'range') {
      if (filter.key === 'price') {
        // price is handled above
      } else {
        // Non-price range: treated as distinct values (for checkbox rendering)
        const raw = (data?.values ?? []).filter(v => {
          if (v === null || v === undefined) return false;
          if (typeof v === 'object') return false;
          return true;
        });
        const sorted = raw.sort((a, b) => {
          if (typeof a === 'number' && typeof b === 'number') return a - b;
          return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
        });
        enriched.options = sorted;
        enriched.values = sorted;
        valuesMap[filter.key] = sorted;
      }
    } else if (filter.type === 'boolean') {
      enriched.options = [true, false];
      enriched.values = data?.values ?? [];
      valuesMap[filter.key] = enriched.values;
    } else {
      const raw = (data?.values ?? []).filter(v => {
        if (v === null || v === undefined) return false;
        if (typeof v === 'object') return false;
        const str = String(v);
        if (str === '[object Object]' || str === '' || str === 'undefined') return false;
        return true;
      });
      const sorted = raw.sort((a, b) => {
        if (typeof a === 'number' && typeof b === 'number') return a - b;
        return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
      });
      enriched.options = sorted;
      enriched.values = sorted;
      valuesMap[filter.key] = sorted;
    }

    return enriched;
  });

  return {
    filters: enrichedFilters,
    values: valuesMap
  };
};

module.exports = { getFiltersForProductType };
