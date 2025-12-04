import type { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function cleanupExpiredEntries() {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, entry] of entries) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

setInterval(cleanupExpiredEntries, 60000);

export function rateLimit(config: RateLimitConfig) {
  const {
    windowMs = 60000,
    max = 100,
    message = "Too many requests, please try again later.",
    keyGenerator = (req: Request) => {
      const forwarded = req.headers["x-forwarded-for"];
      const ip = typeof forwarded === "string" ? forwarded.split(",")[0] : req.ip;
      return ip || "unknown";
    },
  } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, entry);
    } else {
      entry.count++;
    }

    const remaining = Math.max(0, max - entry.count);
    const resetSeconds = Math.ceil((entry.resetTime - now) / 1000);

    res.setHeader("X-RateLimit-Limit", max.toString());
    res.setHeader("X-RateLimit-Remaining", remaining.toString());
    res.setHeader("X-RateLimit-Reset", resetSeconds.toString());

    if (entry.count > max) {
      console.warn(`[RateLimit] IP ${key} exceeded limit (${entry.count}/${max})`);
      return res.status(429).json({
        message,
        retryAfter: resetSeconds,
      });
    }

    next();
  };
}

export const standardLimiter = rateLimit({
  windowMs: 60000,
  max: 100,
  message: "Too many requests. Please try again in a minute.",
});

export const strictLimiter = rateLimit({
  windowMs: 60000,
  max: 10,
  message: "Rate limit exceeded. Please wait before trying again.",
});

export const authLimiter = rateLimit({
  windowMs: 900000,
  max: 5,
  message: "Too many authentication attempts. Please try again in 15 minutes.",
});

export const apiLimiter = rateLimit({
  windowMs: 60000,
  max: 60,
  message: "API rate limit exceeded. Please slow down your requests.",
});

export function logFailedAttempt(type: string, identifier: string, details?: string) {
  const timestamp = new Date().toISOString();
  console.warn(`[SecurityLog] ${timestamp} | ${type} | ${identifier} | ${details || "No details"}`);
}

export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";
  
  return input
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim()
    .slice(0, 10000);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function validatePhone(phone: string): boolean {
  const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, "");
  return /^\+?[0-9]{7,15}$/.test(cleanPhone);
}
