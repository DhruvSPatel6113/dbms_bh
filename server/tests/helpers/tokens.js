const jwt = require('jsonwebtoken');
const { env } = require('../../src/config/env');

function getAuthToken(role = 'Admin', staffId = 1) {
  return jwt.sign(
    {
      staffId,
      email: `${role.toLowerCase()}@test.internal`,
      name: `Test ${role}`,
      designation: role
    },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

module.exports = {
  getAuthToken
};

