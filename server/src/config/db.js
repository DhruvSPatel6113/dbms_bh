const { PrismaClient } = require('@prisma/client');
const { env } = require('./env');

const connectionUrl = env.NODE_ENV === 'test' && env.TEST_DATABASE_URL 
  ? env.TEST_DATABASE_URL 
  : env.DATABASE_URL;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: connectionUrl
    }
  },
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
});

module.exports = prisma;

