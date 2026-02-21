import 'dotenv/config'; // Must be first — loads .env before any other import reads process.env
import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { cleanExpiredTokens } from './modules/auth/service';

const startServer = async (): Promise<void> => {
  // ── Database Connection Check ───────────────────────────────────────────
  try {
    await prisma.$connect();
    // Run a lightweight query to confirm DB is truly reachable
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅  PostgreSQL connected');
  } catch (err) {
    console.error('❌  Database connection failed:', err);
    process.exit(1);
  }

  // ── Start HTTP Server ───────────────────────────────────────────────────
  const server = app.listen(env.PORT, () => {
    console.log(`\n🚀  FleetFlow API`);
    console.log(`    ├─ Environment : ${env.NODE_ENV}`);
    console.log(`    ├─ Port        : ${env.PORT}`);
    console.log(`    ├─ URL         : http://localhost:${env.PORT}`);
    console.log(`    └─ Health      : http://localhost:${env.PORT}/health\n`);
  });

  // ── Scheduled Tasks (poor-man's cron — replace with node-cron in prod) ──
  // Clean expired refresh tokens every 24 hours
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  setInterval(async () => {
    try {
      const deleted = await cleanExpiredTokens();
      if (deleted > 0) {
        console.log(`🧹  Cleaned ${deleted} expired refresh token(s)`);
      }
    } catch (err) {
      console.error('⚠️   Token cleanup failed:', err);
    }
  }, TWENTY_FOUR_HOURS);

  // ── Graceful Shutdown ───────────────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n🔻  ${signal} received — shutting down gracefully...`);

    // Stop accepting new connections
    server.close(async () => {
      try {
        await prisma.$disconnect();
        console.log('✅  Database disconnected. Server stopped cleanly.');
        process.exit(0);
      } catch (err) {
        console.error('❌  Error during shutdown:', err);
        process.exit(1);
      }
    });

    // Force exit after 10s if graceful shutdown stalls
    setTimeout(() => {
      console.error('⚠️   Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  // ── Unhandled Errors ────────────────────────────────────────────────────
  process.on('unhandledRejection', (reason) => {
    console.error('❌  Unhandled Promise Rejection:', reason);
    void shutdown('unhandledRejection');
  });

  process.on('uncaughtException', (err) => {
    console.error('❌  Uncaught Exception:', err);
    void shutdown('uncaughtException');
  });
};

void startServer();