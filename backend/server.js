/**
 * GridVault ESS - Express API Server Bootstrap
 * Module: Analytics & Financial Backend (Varad Bhardwaj)
 * Milestone: Nov 05, 2026 16:45:00 +0530
 * Commit: feat(server): bootstrap Express API server with all analytics route modules
 *
 * Main entry point for the GridVault analytics backend.
 * Mounts all route modules, configures CORS, JSON body parsing,
 * global error handling, and starts the HTTP server on PORT 4001.
 *
 * Route prefixes:
 *   /api/roi/*         → roiRoutes.js      (PaybackCurveChart, ExecutiveSummary)
 *   /api/export/*      → exportRoutes.js   (BulkTelemetryExportButton, ComplianceAuditLog)
 *   /api/reports/*     → reportsRoutes.js  (RegulatoryReportTable, PdfVerificationPipeline)
 *   /api/health/*      → healthRoutes.js   (SystemReadinessPanel)
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root and backend .env files
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

import express from 'express';
import cors from 'cors';

import roiRoutes from './routes/roiRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

// ─────────────────────────────────────────────────────────────────────────────
// App bootstrap
// ─────────────────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 4001;

// ─────────────────────────────────────────────────────────────────────────────
// CORS — allow Vite dev server (port 5173) and production frontend origin
// ─────────────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.FRONTEND_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Body parsing
// ─────────────────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────────────────────────────────────
// Request logger (lightweight — no morgan dep)
// ─────────────────────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.path}`);
  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// Route modules
// ─────────────────────────────────────────────────────────────────────────────
app.use('/api/roi', roiRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/health', healthRoutes);

// ─────────────────────────────────────────────────────────────────────────────
// Root ping — basic liveness check
// ─────────────────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    service: 'GridVault ESS Analytics API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    routes: [
      'GET /api/roi/summary',
      'GET /api/roi/payback-curve',
      'GET /api/roi/financial-records/monthly-breakdown',
      'GET /api/export/telemetry-csv',
      'GET /api/export/audit-log-csv',
      'GET /api/export/compliance-json',
      'GET /api/reports/download/:id',
      'GET /api/reports/verify/:id',
      'GET /api/health/supabase',
      'GET /api/health/ws',
      'GET /api/health/auth',
      'GET /api/health/pdf',
      'GET /api/health',
    ],
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 handler
// ─────────────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Global error handler
// ─────────────────────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[GridVault API Error]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🔋 GridVault ESS Analytics API running on http://localhost:${PORT}`);
  console.log(`   Author : Varad Bhardwaj`);
  console.log(`   DB     : Neon PostgreSQL (28 tables)`);
  console.log(`   Routes : ROI · Export · Reports · Health\n`);
});

export default app;
