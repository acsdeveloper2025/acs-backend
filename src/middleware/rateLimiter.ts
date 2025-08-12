import rateLimit from 'express-rate-limit';
import { config } from '@/config';
import { ApiResponse } from '@/types/api';

const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
      },
    } as ApiResponse,
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// General API rate limiter
export const generalRateLimit = createRateLimiter(
  config.rateLimitWindowMs,
  config.rateLimitMaxRequests,
  'Too many requests from this IP, please try again later'
);

// Auth endpoints - stricter limits
export const authRateLimit = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts per 15 minutes
  'Too many authentication attempts, please try again later'
);

// File upload - moderate limits
export const uploadRateLimit = createRateLimiter(
  60 * 1000, // 1 minute
  10, // 10 uploads per minute
  'Too many file uploads, please try again later'
);

// Case operations - moderate limits
export const caseRateLimit = createRateLimiter(
  60 * 1000, // 1 minute
  30, // 30 requests per minute
  'Too many case operations, please try again later'
);

// Geolocation - moderate limits
export const geoRateLimit = createRateLimiter(
  60 * 1000, // 1 minute
  20, // 20 requests per minute
  'Too many geolocation requests, please try again later'
);
