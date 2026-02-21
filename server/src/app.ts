import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { corsOptions } from './config/cors';
import { logger } from './middleware/logger.middleware';
import { errorMiddleware } from './middleware/error.middleware';

// ── Module Routers ────────────────────────────────────────────────────────────
import authRouter from './modules/auth/auth.routes';

const app = express();

// ── Security Headers ──────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // pre-flight requests

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

// ── Request Logging ───────────────────────────────────────────────────────────
app.use(logger);

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // required for httpOnly refresh token cookie

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
  },
});

// Stricter limit specifically for login — prevents brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15, // 15 login attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many login attempts, please try again later' },
  },
});

app.use('/api', globalLimiter);
app.use('/api/v1/auth/login', authLimiter);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      service: 'FleetFlow API',
      timestamp: new Date().toISOString(),
      version: process.env['npm_package_version'] ?? '1.0.0',
    },
  });
});

// ── API v1 Routes ─────────────────────────────────────────────────────────────
const API_V1 = '/api/v1';

app.use(`${API_V1}/auth`, authRouter);
// app.use(`${API_V1}/vehicles`, vehiclesRouter);
// app.use(`${API_V1}/drivers`, driversRouter);
// app.use(`${API_V1}/trips`, tripsRouter);
// app.use(`${API_V1}/maintenance`, maintenanceRouter);
// app.use(`${API_V1}/fuel-logs`, fuelLogsRouter);
// app.use(`${API_V1}/analytics`, analyticsRouter);

// ── 404 Catch-All ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested route does not exist',
    },
  });
});

// ── Global Error Handler (MUST be last) ──────────────────────────────────────
app.use(errorMiddleware);

export default app;