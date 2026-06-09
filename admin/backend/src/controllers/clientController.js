const mongoose = require('mongoose');
const { getShopDb } = require('../config/db');

// Helper to get models safely
const getModel = (modelName, collectionName) => {
  const shopDb = getShopDb();
  if (!shopDb) throw new Error('Shop DB not connected');
  
  if (shopDb.models[modelName]) {
    return shopDb.models[modelName];
  }
  
  return shopDb.model(modelName, new mongoose.Schema({}, { strict: false, collection: collectionName }));
};

// GET all clients
const getClients = async (req, res) => {
  try {
    const User = getModel('User', 'users');
    const Order = getModel('Order', 'orders');

    const users = await User.find({ role: 'user' }).lean();
    
    // Attach order count and total spent
    const enhancedUsers = await Promise.all(users.map(async (user) => {
      const orders = await Order.find({ userId: user._id }).lean();
      const totalSpent = orders.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
      return {
        ...user,
        ordersCount: orders.length,
        totalSpent,
      };
    }));

    // Sort by newest
    enhancedUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(enhancedUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET client by ID
const getClientById = async (req, res) => {
  try {
    const User = getModel('User', 'users');
    const user = await User.findById(req.params.id).lean();
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'Client not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE client status/details
const updateClient = async (req, res) => {
  try {
    const User = getModel('User', 'users');
    const user = await User.findById(req.params.id);
    
    if (user) {
      Object.assign(user, req.body);
      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'Client not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET client orders
const getClientOrders = async (req, res) => {
  try {
    const Order = getModel('Order', 'orders');
    const orders = await Order.find({ userId: req.params.id }).sort({ createdAt: -1 }).lean();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET client addresses
const getClientAddresses = async (req, res) => {
  try {
    const Address = getModel('Address', 'addresses');
    const addresses = await Address.find({ userId: req.params.id }).lean();
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET client wishlist
const getClientWishlist = async (req, res) => {
  try {
    const User = getModel('User', 'users');
    const Product = getModel('Product', 'products');
    
    const user = await User.findById(req.params.id).lean();
    if (!user || !user.wishlist || user.wishlist.length === 0) {
      return res.json([]);
    }

    const wishlistProducts = await Product.find({ _id: { $in: user.wishlist } }).lean();
    res.json(wishlistProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET client reviews
const getClientReviews = async (req, res) => {
  try {
    const Review = getModel('Review', 'reviews');
    const Product = getModel('Product', 'products');
    
    // Assuming Review model has userId, rating, comment, productId
    const reviews = await Review.find({ userId: req.params.id }).lean();
    
    const enhancedReviews = await Promise.all(reviews.map(async (rev) => {
      const product = await Product.findById(rev.productId).lean();
      return {
        ...rev,
        productName: product ? product.title || product.name : 'Unknown Product',
        productImage: product && product.images ? product.images[0] : null
      };
    }));
    
    res.json(enhancedReviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getClients,
  getClientById,
  updateClient,
  getClientOrders,
  getClientAddresses,
  getClientWishlist,
  getClientReviews
};
