"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.isAdmin = void 0;
const isAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        res.status(403).json({ message: 'Access denied. Admin role required.' });
        return;
    }
    next();
};
exports.isAdmin = isAdmin;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user?.role || !roles.includes(req.user.role)) {
            res.status(403).json({ message: 'Access denied. Required role not found.' });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
