const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_super_secret_key_change_in_prod', {
    expiresIn: '30d',
  });
};

module.exports = generateToken;
