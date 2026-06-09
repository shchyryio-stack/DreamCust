const express = require('express');
const cors = require('cors');

const app = express();
const session = require('express-session');
const passport = require('./config/passport');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret_key',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

const path = require('path');
app.use('/storage', express.static(path.join(__dirname, '../../storage')));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
// Assuming storage might be in the root directory based on the user's hints, or ../storage if it's in the backend directory.
// Let's use `path.join(__dirname, '../storage')` as requested by user example.
app.use('/storage', express.static(path.join(__dirname, '../storage')));
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const configuratorRoutes = require('./routes/configuratorRoutes');
const orderRoutes = require('./routes/orderRoutes');
const addressRoutes = require('./routes/addressRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const userRoutes = require('./routes/userRoutes');
const filterRoutes = require('./routes/filterRoutes');

// Basic healthcheck route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/configurator', configuratorRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/users', userRoutes);
app.use('/api/filters', filterRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;
