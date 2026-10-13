import rateLimit from "express-rate-limit";

export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: "Too many authentication attempts. Please try again later." }
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { message: "Too many requests. Please slow down." }
});
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { message: "Too many AI requests. Please wait a moment and try again." }
});