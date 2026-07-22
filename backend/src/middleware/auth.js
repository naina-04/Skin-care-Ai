"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthenticated = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const isAuthenticated = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No active session' });
    }
    try {
        const secret = process.env.JWT_SECRET || 'super_secure_jwt_secret_key_2026';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = decoded;
        return next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
    }
};
exports.isAuthenticated = isAuthenticated;
//# sourceMappingURL=auth.js.map