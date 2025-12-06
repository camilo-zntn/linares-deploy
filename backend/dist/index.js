"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Configuracion de variables de entorno
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const chalk_1 = __importDefault(require("chalk"));
// Importar modelos
require("./models/user.model");
// Importar rutas
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const log_routes_1 = __importDefault(require("./routes/log.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const commerce_routes_1 = __importDefault(require("./routes/commerce.routes"));
const request_routes_1 = __importDefault(require("./routes/request.routes"));
const referral_routes_1 = __importDefault(require("./routes/referral.routes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const discounts_routes_1 = __importDefault(require("./routes/discounts.routes"));
// Importar configuración de WebSocket
const socket_config_1 = require("./config/socket.config");
// Inicializacion de Express
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// Configurar Socket.IO
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
// Configurar eventos de Socket.IO
(0, socket_config_1.setupSocketIO)(io);
// Middlewares
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Hacer io disponible en las rutas
app.set('io', io);
// Update the static file serving configuration
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.webp')) {
            res.setHeader('Content-Type', 'image/webp');
        }
    }
}));
// Rutas API
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/logs', log_routes_1.default);
app.use('/api/categories', category_routes_1.default);
app.use('/api/commerces', commerce_routes_1.default);
app.use('/api/requests', request_routes_1.default);
app.use('/api/referrals', referral_routes_1.default);
app.use('/api/analytics', analyticsRoutes_1.default);
app.use('/api/discounts', discounts_routes_1.default);
// Banner de inicio
console.log(chalk_1.default.cyan.bold(`
  ╔════════════════════════════╗
  ║                            ║
  ║     Sistema de Linares     ║
  ║                            ║ 
  ╚════════════════════════════╝
  `));
// Ruta base
app.get('/api', (_req, res) => {
    res.json({
        status: 'ok',
        message: chalk_1.default.green.bold('✓ API Sistema de Digitalizacion'),
        version: chalk_1.default.yellow('1.0.0'),
        environment: chalk_1.default.cyan(process.env.NODE_ENV || 'development')
    });
});
// Error Handler 
app.use((err, req, res, _next) => {
    console.error(chalk_1.default.red.bold('\n⚠ Error:'), chalk_1.default.red(err.stack), '\n');
    res.status(500).json({
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});
// Suprimir warnings de deprecacion
process.removeAllListeners('warning');
process.env.NODE_NO_WARNINGS = '1';
// Conexion a MongoDB
mongoose_1.default.connect(process.env.MONGODB_URI)
    .then(() => {
    console.log(chalk_1.default.green.bold('\n✓ Base de datos:'), chalk_1.default.cyan('Conectada'));
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log(chalk_1.default.yellow.bold('\n⚡ Servidor:'), chalk_1.default.cyan(`http://localhost:${PORT}`), '\n');
        console.log(chalk_1.default.green.bold('🔌 WebSocket:'), chalk_1.default.cyan('Configurado y listo'), '\n');
    });
})
    .catch(err => {
    console.error(chalk_1.default.red.bold('\n✖ Error de conexion:'), chalk_1.default.red(err), '\n');
    process.exit(1);
});
exports.default = app;
