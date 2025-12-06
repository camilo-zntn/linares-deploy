"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRateLimiter = analyticsRateLimiter;
const bucket = new Map();
function analyticsRateLimiter(req, res, next) {
    var _a;
    const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || 'anon';
    const now = Date.now();
    const windowMs = 1000;
    const maxPerWindow = 3; // permitir hasta 3 eventos por segundo por usuario
    const e = bucket.get(userId) || { last: now, tokens: maxPerWindow };
    const elapsed = now - e.last;
    if (elapsed > windowMs) {
        e.tokens = maxPerWindow;
        e.last = now;
    }
    if (e.tokens <= 0) {
        res.status(204).end();
        return;
    }
    e.tokens -= 1;
    bucket.set(userId, e);
    next();
}
