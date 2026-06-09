const User = require('../models/User');

const updateProfile = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { email },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

module.exports = { updateProfile, getUsers };
