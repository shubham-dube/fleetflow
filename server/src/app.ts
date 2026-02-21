import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { corsOptions } from './config/cors';
import { logger } from './middleware/logger.middleware';
import { errorMiddleware } from './middleware/error.middleware';

// ── Module Routers ──────────────────────────────────────────────────
import authRouter from './modules/auth/auth.routes';
import vehiclesRouter from './modules/vehicles/vehicles.routes';
import driversRouter from './modules/drivers/drivers.route';
import tripsRouter from './modules/trips/trips.routes';
import maintenanceRouter from './modules/vehicle_maintenance/maintenance.routes';
import fuelLogsRouter from './modules/fuel_logs/fuel_logs.routes';
import analyticsRouter from './modules/analytics/analytics.routes';

const app = express();

// ── Security & Performance ──────────────────────────────────────────
app.use(helmet());
app.use(cors(corsOptions));
app.use(compression());
app.use(cookieParser()); // parse cookies for refresh token httpOnly cookie
app.use(logger);

// ── Rate Limiting ───────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' } },
});
app.use('/api', globalLimiter);

// Stricter limit on auth endpoints (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many login attempts, please try again in 15 minutes' } },
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/refresh', authLimiter);

// ── Body Parsing ────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health Check (unauthenticated) ──────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// ── API Routes ──────────────────────────────────────────────────────
const API = '/api/v1';
app.use(`${API}/auth`, authRouter);
app.use(`${API}/vehicles`, vehiclesRouter);
app.use(`${API}/drivers`, driversRouter);
app.use(`${API}/trips`, tripsRouter);
app.use(`${API}/maintenance`, maintenanceRouter);
app.use(`${API}/fuel-logs`, fuelLogsRouter);
app.use(`${API}/analytics`, analyticsRouter);

// ── 404 for unmatched routes ────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'The requested endpoint does not exist' },
  });
});

// ── Global Error Handler (must be registered last) ──────────────────
app.use(errorMiddleware);

export default app;