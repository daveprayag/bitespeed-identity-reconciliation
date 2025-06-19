import rateLimit from "express-rate-limit";

export const identifyRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // Limit each IP to 20 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "Too many requests. Please try again later.",
    },
});
