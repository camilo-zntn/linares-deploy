"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.isAdmin = void 0;
const isAdmin = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        res.status(403).json({ message: 'Access denied. Admin role required.' });
        return;
    }
    next();
};
exports.isAdmin = isAdmin;
const requireRole = (roles) => {
    return (req, res, next) => {
        var _a;
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) || !roles.includes(req.user.role)) {
            res.status(403).json({ message: 'Access denied. Required role not found.' });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
