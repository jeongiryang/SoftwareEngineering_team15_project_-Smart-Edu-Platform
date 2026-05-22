const jwt = require('jsonwebtoken');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const TOKEN_EXPIRES_IN = '1d';

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    const error = new Error('JWT secret is not configured');
    error.statusCode = 500;
    throw error;
  }

  return process.env.JWT_SECRET;
}

function signToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role
    },
    getJwtSecret(),
    { expiresIn: TOKEN_EXPIRES_IN }
  );
}

function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}

module.exports = {
  signToken,
  verifyToken
};
