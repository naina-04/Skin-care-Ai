"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_1 = __importDefault(require("./routes/auth"));
const userModel_1 = require("./models/userModel");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Initialize JSON database
(0, userModel_1.initializeDatabase)();
// Enable credentials for CORS dynamically across local origins (localhost / 127.0.0.1 on any port)
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            callback(null, true);
        }
        else {
            callback(null, true);
        }
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
const analyze_1 = __importDefault(require("./routes/analyze"));
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/analyze', analyze_1.default);
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Skin Analysis API is running.' });
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=server.js.map