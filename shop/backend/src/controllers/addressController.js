const Address = require('../models/Address');

// Whitelist of allowed fields from frontend
const ALLOWED_FIELDS = [
  'label', 'firstName', 'lastName', 'middleName', 'phone', 'deliveryType',
  'city', 'cityRef', 'details', 'street', 'house', 'apartment',
  'courierComment', 'warehouseRef', 'warehouseName'
];

const REQUIRED_FIELDS = ['label', 'firstName', 'lastName', 'phone', 'deliveryType', 'city'];
const VALID_DELIVERY_TYPES = ['courier', 'branch', 'locker'];

/**
 * Sanitize request body — only allow whitelisted fields
 */
const sanitizeBody = (body) => {
  const sanitized = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) {
      sanitized[key] = typeof body[key] === 'string' ? body[key].trim() : body[key];
    }
  }
  return sanitized;
};

/**
 * Validate required fields and enum values
 * Returns null if valid, or an error message string
 */
const validateAddressData = (data) => {
  const missing = REQUIRED_FIELDS.filter(f => !data[f] || (typeof data[f] === 'string' && !data[f].trim()));
  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(', ')}`;
  }
  if (!VALID_DELIVERY_TYPES.includes(data.deliveryType)) {
    return `Invalid delivery type: "${data.deliveryType}". Must be one of: ${VALID_DELIVERY_TYPES.join(', ')}`;
  }
  return null;
};

/**
 * Format Mongoose ValidationError into readable message
 */
const formatValidationError = (error) => {
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(e => e.message);
    return messages.join('; ');
  }
  return error.message || 'Unknown error';
};

// ─── GET ALL ADDRESSES ──────────────────────────────────────────────
exports.getAddresses = async (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });

  try {
    const addresses = await Address.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(addresses);
  } catch (error) {
    console.error('[getAddresses] Error:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching addresses' });
  }
};

// ─── ADD ADDRESS ────────────────────────────────────────────────────
exports.addAddress = async (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });

  console.log('[addAddress] userId:', req.user._id, 'payload:', JSON.stringify(req.body));

  try {
    // Sanitize and validate
    const sanitized = sanitizeBody(req.body);
    const validationError = validateAddressData(sanitized);
    if (validationError) {
      console.log('[addAddress] Validation failed:', validationError);
      return res.status(400).json({ success: false, message: validationError });
    }

    // Check if this is the user's first address (auto-default)
    const addressesCount = await Address.countDocuments({ userId: req.user._id });
    const isDefault = addressesCount === 0;

    const newAddress = new Address({
      ...sanitized,
      userId: req.user._id,
      isDefault
    });

    const savedAddress = await newAddress.save();
    console.log('[addAddress] Saved successfully, id:', savedAddress._id);
    res.status(201).json(savedAddress);
  } catch (error) {
    console.error('[addAddress] Error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: formatValidationError(error) });
    }
    res.status(500).json({ success: false, message: 'Server error while saving address' });
  }
};

// ─── UPDATE ADDRESS ─────────────────────────────────────────────────
exports.updateAddress = async (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });

  console.log('[updateAddress] userId:', req.user._id, 'addressId:', req.params.id, 'payload:', JSON.stringify(req.body));

  try {
    const sanitized = sanitizeBody(req.body);
    const validationError = validateAddressData(sanitized);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      sanitized,
      { new: true, runValidators: true }
    );
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    console.log('[updateAddress] Updated successfully, id:', address._id);
    res.json(address);
  } catch (error) {
    console.error('[updateAddress] Error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: formatValidationError(error) });
    }
    res.status(500).json({ success: false, message: 'Error updating address' });
  }
};

// ─── DELETE ADDRESS ─────────────────────────────────────────────────
exports.deleteAddress = async (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });

  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // If deleted address was default, promote the newest remaining address
    if (address.isDefault) {
      const remainingAddress = await Address.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
      if (remainingAddress) {
        remainingAddress.isDefault = true;
        await remainingAddress.save();
      }
    }

    console.log('[deleteAddress] Deleted successfully, id:', req.params.id);
    res.json({ success: true, message: 'Address deleted' });
  } catch (error) {
    console.error('[deleteAddress] Error:', error);
    res.status(500).json({ success: false, message: 'Error deleting address' });
  }
};

// ─── SET DEFAULT ADDRESS ────────────────────────────────────────────
exports.setDefaultAddress = async (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });

  try {
    const addressId = req.params.id;

    const address = await Address.findOne({ _id: addressId, userId: req.user._id });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // Remove default from all other addresses of this user
    await Address.updateMany(
      { userId: req.user._id, _id: { $ne: addressId } },
      { isDefault: false }
    );

    // Set this address as default
    address.isDefault = true;
    await address.save();

    console.log('[setDefaultAddress] Set default, id:', addressId);
    res.json(address);
  } catch (error) {
    console.error('[setDefaultAddress] Error:', error);
    res.status(500).json({ success: false, message: 'Error setting default address' });
  }
};
