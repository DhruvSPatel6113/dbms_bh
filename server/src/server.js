const app = require('./app');
const { env } = require('./config/env');
const prisma = require('./config/db');

const PORT = env.PORT || 4000;

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('[server] Connected to PostgreSQL via Prisma.');

    app.listen(PORT, () => {
      console.log(`[server] Library Management System API listening on port ${PORT}`);
      console.log(`[server] Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('[server] Fatal bootstrap error:', error);
    process.exit(1);
  }
}

bootstrap();

