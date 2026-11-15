/**
 * GridVault ESS - Security Headers & Rate Limiting Middleware
 * Configures Helmet HTTP security headers and route-scoped rate limiters.
 */
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", 'http://localhost:5173', 'http://localhost:4001'],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

/**
 * General API rate limiter (protects all /api/* routes from scraping / floods).
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests from this IP; please retry after 60 seconds',
      code: 'RATE_LIMITED',
      status: 429,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Strict write/auth rate limiter for sensitive mutation & login endpoints
 * (e.g., POST /api/grid/tick and POST /api/auth/login -> 5 requests/min).
 */
export const strictWriteRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded for sensitive endpoint (max 5 requests per minute)',
      code: 'RATE_LIMITED',
      status: 429,
      retryAfterSeconds: 60,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  },
});
