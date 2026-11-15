/**
 * GridVault ESS - Authentication & Role-Based Authorization Middleware
 * Validates short-lived Bearer JWT access tokens (401) and enforces RBAC roles (403).
 */
import jwt from 'jsonwebtoken';

export const ACCESS_TOKEN_SECRET =
  process.env.JWT_SECRET || 'gv_dev_access_secret_9a8f2c71d4e6b3058f12c9a0e4d7b21f';
export const REFRESH_TOKEN_SECRET =
  process.env.JWT_REFRESH_SECRET || 'gv_dev_refresh_secret_3e7b91c4a0d5f8261b9e4c3a7d0f6281';

/**
 * Verifies Authorization: Bearer <accessToken> header and attaches req.user.
 * Returns 401 Unauthorized when missing, malformed, or expired.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required: missing Bearer access token',
      code: 'UNAUTHORIZED',
      status: 401,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }

  const token = authHeader.slice(7).trim();
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      fullName: decoded.fullName,
    };
    return next();
  } catch (err) {
    return res.status(401).json({
      error:
        err.name === 'TokenExpiredError'
          ? 'Access token expired; call POST /api/auth/refresh'
          : 'Invalid access token',
      code: 'INVALID_TOKEN',
      status: 401,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Role-based access control guard (RBAC).
 * Returns 403 Forbidden if the authenticated operator lacks a permitted role.
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
        status: 401,
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: role '${req.user.role}' cannot access this resource (requires ${allowedRoles.join(' or ')})`,
        code: 'FORBIDDEN_ROLE',
        status: 403,
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
    }

    return next();
  };
}
