const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const Review = require('../models/Review');
const ReviewComment = require('../models/ReviewComment');
const User = require('../models/User');

const { getFiltersForProductType } = require('../filters/filterProcessor');

/**
 * Dynamically loads the filter schema/structure for a given category.
 */
const loadSchema = (category) => {
  const filePath = path.join(__dirname, '../filters', `${category.toLowerCase()}.filters.js`);
  if (!fs.existsSync(filePath)) return null;
  delete require.cache[require.resolve(filePath)];
  return require(filePath);
};

// @desc    Fetch all products with schema-driven filtering, sorting, pagination
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const {
      category, q, brand, minPrice, maxPrice, rating, sort,
      page = 1, limit = 20, availability, ...rest
    } = req.query;

    let filter = {};

    // 1. Category mapping to productType
    if (category && category.toLowerCase() !== 'all') {
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

      const types = mapCategoryToProductTypes(category);
      const typeQueries = [];
      types.forEach(t => {
        typeQueries.push(t, t.toLowerCase(), t.toUpperCase());
      });
      filter.productType = { $in: [...new Set(typeQueries)] };
    }

    // 2. Search query
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ];
    }

    // 3. Brand
    if (brand) {
      const brands = brand.split(',').map(b => new RegExp(`^${b.trim()}$`, 'i'));
      filter.brand = { $in: brands };
    }

    // 4. Price range
    if (minPrice || maxPrice) {
      filter['pricing.price'] = {};
      if (minPrice) filter['pricing.price'].$gte = Number(minPrice);
      if (maxPrice) filter['pricing.price'].$lte = Number(maxPrice);
    }

    // 5. Rating
    if (rating) {
      filter.rating = { $gte: Number(rating) };
    }

    // 6. Availability
    if (availability) {
      const avails = availability.split(',');
      let availFilters = [];
      if (avails.includes('inStock')) {
        availFilters.push({ 'computed.inStock': true });
      }
      if (avails.includes('discounted')) {
        availFilters.push({ 'pricing.discount': { $gt: 0 } });
      }
      if (availFilters.length > 0) {
        filter.$or = filter.$or ? filter.$or.concat(availFilters) : availFilters;
      }
    }

    // 7. Schema-driven specification filters
    if (category && category.toLowerCase() !== 'all' && category.toLowerCase() !== 'peripherals') {
      const schema = loadSchema(category);
      if (schema) {
        schema.forEach(f => {
          if (f.key === 'brand' || f.key === 'price') return;

          const qVal = req.query[f.key];
          if (qVal === undefined || qVal === null || qVal === '') return;

          switch (f.type) {
            case 'range': {
              const parts = qVal.split(',').map(v => Number(v.trim()));
              if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                filter[f.field] = { $gte: parts[0], $lte: parts[1] };
              }
              break;
            }
            case 'boolean': {
              filter[f.field] = qVal === 'true';
              break;
            }
            case 'checkbox':
            case 'select':
            case 'multi-select':
            default: {
              const values = qVal.split(',').map(v => v.trim());
              filter[f.field] = { $in: values.map(v => new RegExp(`^${v}$`, 'i')) };
              break;
            }
          }
        });
      }
    }

    // Sorting
    let sortObj = { numReviews: -1 }; // Default: popularity
    if (sort) {
      switch (sort) {
        case 'Price: Low to High': sortObj = { 'pricing.price': 1 }; break;
        case 'Price: High to Low': sortObj = { 'pricing.price': -1 }; break;
        case 'Newest': sortObj = { createdAt: -1 }; break;
        case 'Best Rated': sortObj = { rating: -1, numReviews: -1 }; break;
        default: sortObj = { numReviews: -1 }; break;
      }
    }

    // Pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const totalProducts = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    res.json({
      products,
      pagination: {
        total: totalProducts,
        page: pageNum,
        pages: Math.ceil(totalProducts / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dynamic filters list (for general catalog page)
// @route   GET /api/products/filters
// @access  Public
const getFilters = async (req, res, next) => {
  try {
    const { category } = req.query;

    if (!category || category.toLowerCase() === 'all') {
      // General catalog page filters (group all published in-stock products)
      const pipeline = [
        {
          $match: {
            status: 'Published',
            'computed.inStock': true
          }
        },
        {
          $group: {
            _id: null,
            brands: { $addToSet: '$brand' },
            minPrice: { $min: '$pricing.price' },
            maxPrice: { $max: '$pricing.price' }
          }
        }
      ];

      const results = await Product.aggregate(pipeline);
      if (results.length === 0) {
        return res.json({ brands: [], minPrice: 0, maxPrice: 0, specs: {} });
      }

      const { brands, minPrice, maxPrice } = results[0];
      return res.json({
        brands: (brands || []).filter(Boolean).sort(),
        minPrice: minPrice || 0,
        maxPrice: maxPrice || 0,
        specs: {}
      });
    }

    if (category.toLowerCase() === 'peripherals') {
      // Group keyboard, mouse, and headphones together
      const pipeline = [
        {
          $match: {
            productType: { $in: ['keyboard', 'mouse', 'headphones', 'Keyboard', 'Mouse', 'Headphones', 'KEYBOARD', 'MOUSE', 'HEADPHONES'] },
            status: 'Published',
            'computed.inStock': true
          }
        },
        {
          $group: {
            _id: null,
            brands: { $addToSet: '$brand' },
            minPrice: { $min: '$pricing.price' },
            maxPrice: { $max: '$pricing.price' }
          }
        }
      ];

      const results = await Product.aggregate(pipeline);
      if (results.length === 0) {
        return res.json({ brands: [], minPrice: 0, maxPrice: 0, specs: {} });
      }

      const { brands, minPrice, maxPrice } = results[0];
      return res.json({
        brands: (brands || []).filter(Boolean).sort(),
        minPrice: minPrice || 0,
        maxPrice: maxPrice || 0,
        specs: {}
      });
    }

    // Category-specific filters leveraging central filterProcessor
    const result = await getFiltersForProductType(category);
    
    const brands = result.values?.brand || [];
    const minPrice = result.values?.minPrice ?? 0;
    const maxPrice = result.values?.maxPrice ?? 0;

    const specs = {};
    if (result.filters) {
      result.filters.forEach(f => {
        if (f.key === 'brand' || f.key === 'price') return;
        specs[f.key] = f.values || [];
      });
    }

    res.json({
      brands: brands.filter(Boolean).sort(),
      minPrice,
      maxPrice,
      specs
    });
  } catch (error) {
    next(error);
  }
};

// Helper to fetch populated reviews and comments for a product
const getProductReviewsAndComments = async (productId) => {
  const reviews = await Review.find({ productId }).lean();

  const populatedReviews = await Promise.all(reviews.map(async (review) => {
    // Find reviewer
    const reviewer = await User.findById(review.userId).lean();
    const name = reviewer ? (reviewer.fullName || reviewer.username || reviewer.email.split('@')[0]) : 'Anonymous';

    // Find comments/replies for this review
    const comments = await ReviewComment.find({ reviewId: review._id }).lean();
    const populatedComments = await Promise.all(comments.map(async (comment) => {
      const replier = await User.findById(comment.userId).lean();
      const replierName = replier ? (replier.fullName || replier.username || replier.email.split('@')[0]) : 'Anonymous';
      return {
        _id: comment._id,
        name: replierName,
        text: comment.text,
        createdAt: comment.createdAt,
      };
    }));

    return {
      _id: review._id,
      name,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      comments: populatedComments,
    };
  }));

  return populatedReviews;
};

// @desc    Fetch single product by slug
// @route   GET /api/products/:slug
// @access  Public
const getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });

    if (product) {
      const productObj = product.toObject();
      const reviews = await getProductReviewsAndComments(product._id);
      res.json({ ...productObj, reviews });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create new review
// @route   POST /api/products/:id/review
// @access  Private
const createProductReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;
    const product = await Product.findById(productId);

    if (product) {
      const alreadyReviewed = await Review.findOne({
        productId,
        userId: req.user._id
      });

      if (alreadyReviewed) {
        alreadyReviewed.rating = Number(rating);
        alreadyReviewed.comment = comment;
        await alreadyReviewed.save();
      } else {
        await Review.create({
          productId,
          userId: req.user._id,
          rating: Number(rating),
          comment,
        });
      }

      const reviews = await Review.find({ productId });
      product.numReviews = reviews.length;
      product.rating =
        reviews.length > 0
          ? reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length
          : 0;

      await product.save();

      const populatedReviews = await getProductReviewsAndComments(product._id);
      res.status(201).json({ message: 'Review added', reviews: populatedReviews });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to a review
// @route   POST /api/products/:productId/reviews/:reviewId/comment
// @access  Private
const addReviewComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    const { productId, reviewId } = req.params;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const newComment = await ReviewComment.create({
      reviewId,
      userId: req.user._id,
      text,
    });

    const user = await User.findById(req.user._id).lean();
    const name = user ? (user.fullName || user.username || user.email.split('@')[0]) : 'Anonymous';

    res.status(201).json({
      _id: newComment._id,
      name,
      text: newComment.text,
      createdAt: newComment.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getFilters,
  getProductBySlug,
  createProductReview,
  addReviewComment,
};
