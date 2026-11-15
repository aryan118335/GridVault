/**
 * GridVault ESS - Authentication, Token Refresh, RBAC & Ownership Routes
 * Mounted at /api/auth/*
 */
import crypto from 'crypto';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import {
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  requireAuth,
  requireRole,
} from '../middleware/authMiddleware.js';

const router = express.Router();

const REFRESH_COOKIE_NAME = 'gv_refresh_token';
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_DAYS = 7;

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  };
}

function signAccessToken(operator) {
  return jwt.sign(
    {
      sub: operator.id,
      email: operator.email,
      role: operator.role,
      fullName: operator.full_name,
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

/**
 * POST /api/auth/login
 * Verifies email + bcrypt salted password hash, issues 15m access JWT + 7d HttpOnly refresh cookie.
 */
router.post('/login', async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation error: email and password are required',
        code: 'VALIDATION_ERROR',
        status: 400,
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
    }

    const userRes = await query(
      `SELECT id, email, full_name, password_hash, role
       FROM grid_operators
       WHERE email = $1
       LIMIT 1`,
      [email]
    );

    if (userRes.error) {
      return next(new Error(userRes.error));
    }

    const operator = userRes.rows[0];
    if (!operator) {
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
        status: 401,
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
    }

    const validPassword = await bcrypt.compare(password, operator.password_hash);
    if (!validPassword) {
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
        status: 401,
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
    }

    const accessToken = signAccessToken(operator);
    const refreshToken = jwt.sign(
      { sub: operator.id, tokenId: crypto.randomUUID() },
      REFRESH_TOKEN_SECRET,
      { expiresIn: `${REFRESH_TOKEN_DAYS}d` }
    );

    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
    await query(
      `INSERT INTO operator_refresh_tokens (operator_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [operator.id, sha256(refreshToken), expiresAt.toISOString()]
    );

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());

    return res.json({
      accessToken,
      expiresIn: ACCESS_TOKEN_TTL,
      user: {
        id: operator.id,
        email: operator.email,
        fullName: operator.full_name,
        role: operator.role,
      },
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/auth/refresh
 * Validates HttpOnly refresh token against DB and mints a fresh 15m access JWT.
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const rawRefresh = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!rawRefresh) {
      return res.status(401).json({
        error: 'Missing refresh token cookie',
        code: 'MISSING_REFRESH_TOKEN',
        status: 401,
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(rawRefresh, REFRESH_TOKEN_SECRET);
    } catch {
      return res.status(401).json({
        error: 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN',
        status: 401,
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
    }

    const tokenCheck = await query(
      `SELECT t.id, o.id AS operator_id, o.email, o.full_name, o.role
       FROM operator_refresh_tokens t
       JOIN grid_operators o ON o.id = t.operator_id
       WHERE t.operator_id = $1
         AND t.token_hash = $2
         AND t.revoked = FALSE
         AND t.expires_at > NOW()
       LIMIT 1`,
      [decoded.sub, sha256(rawRefresh)]
    );

    if (tokenCheck.rows.length === 0) {
      return res.status(401).json({
        error: 'Refresh token revoked or expired',
        code: 'REVOKED_REFRESH_TOKEN',
        status: 401,
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
    }

    const row = tokenCheck.rows[0];
    const accessToken = signAccessToken({
      id: row.operator_id,
      email: row.email,
      full_name: row.full_name,
      role: row.role,
    });

    return res.json({ accessToken, expiresIn: ACCESS_TOKEN_TTL });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/auth/logout
 * Revokes refresh token in PostgreSQL and clears the HttpOnly cookie.
 */
router.post('/logout', async (req, res, next) => {
  try {
    const rawRefresh = req.cookies?.[REFRESH_COOKIE_NAME];
    if (rawRefresh) {
      await query(
        `UPDATE operator_refresh_tokens SET revoked = TRUE WHERE token_hash = $1`,
        [sha256(rawRefresh)]
      );
    }
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
    return res.json({ status: 'logged_out', message: 'Refresh token revoked and cookie cleared' });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/auth/me
 * Protected profile endpoint (requires valid Bearer JWT -> 401 if missing).
 */
router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

/**
 * GET /api/auth/admin/audit-summary
 * Admin-only RBAC endpoint (VIEWER/OPERATOR token -> 403 Forbidden).
 */
router.get('/admin/audit-summary', requireAuth, requireRole('ADMIN'), async (_req, res, next) => {
  try {
    const counts = await query(
      `SELECT
         (SELECT COUNT(*)::int FROM grid_operators) AS total_operators,
         (SELECT COUNT(*)::int FROM operator_refresh_tokens WHERE revoked = FALSE AND expires_at > NOW()) AS active_sessions,
         (SELECT COUNT(*)::int FROM grid_state) AS telemetry_rows`
    );
    return res.json({
      authorizedRole: 'ADMIN',
      summary: counts.rows[0],
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/auth/watchlists/:id
 * Ownership-protected resource (prevents User A from reading User B's watchlist -> 403 Forbidden).
 */
router.get('/watchlists/:id', requireAuth, async (req, res, next) => {
  try {
    const watchlistId = Number(req.params.id);
    if (!Number.isInteger(watchlistId) || watchlistId <= 0) {
      return res.status(400).json({
        error: 'Validation error: watchlist id must be a positive integer',
        code: 'VALIDATION_ERROR',
        status: 400,
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
    }

    const result = await query(
      `SELECT id, operator_id, label, alert_threshold_mw, created_at
       FROM operator_watchlists
       WHERE id = $1
       LIMIT 1`,
      [watchlistId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: `Watchlist ${watchlistId} not found`,
        code: 'NOT_FOUND',
        status: 404,
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
    }

    const watchlist = result.rows[0];
    if (watchlist.operator_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Forbidden: you cannot access another operator’s watchlist resource',
        code: 'FORBIDDEN_RESOURCE_OWNER',
        status: 403,
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
    }

    return res.json({
      data: {
        ...watchlist,
        alert_threshold_mw: Number(watchlist.alert_threshold_mw),
      },
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
