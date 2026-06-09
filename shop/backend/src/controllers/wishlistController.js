const User = require('../models/User');

// @desc    Toggle product in wishlist
// @route   POST /api/wishlist/toggle
// @access  Private
const toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const index = user.wishlist.indexOf(productId);
    if (index === -1) {
      user.wishlist.push(productId);
    } else {
      user.wishlist.splice(index, 1);
    }

    await user.save();
    
    // Optionally populate if needed, but returning array of IDs is often enough for sync
    res.json(user.wishlist);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.wishlist);
  } catch (error) {
    next(error);
  }
};

// @desc    Sync local wishlist to backend
// @route   POST /api/wishlist/sync
// @access  Private
const syncWishlist = async (req, res, next) => {
  try {
    const { productIds } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(productIds)) {
      return res.status(400).json({ message: 'productIds must be an array' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentSet = new Set(user.wishlist.map(id => id.toString()));
    productIds.forEach(id => currentSet.add(id));

    user.wishlist = Array.from(currentSet);
    await user.save();

    res.json(user.wishlist);
  } catch (error) {
    next(error);
  }
};

module.exports = { toggleWishlist, getWishlist, syncWishlist };
