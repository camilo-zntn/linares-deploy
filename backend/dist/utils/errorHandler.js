"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = void 0;
const handleError = (res, error, defaultMessage) => {
    console.error('Error:', error);
    const status = error instanceof Error && error.message === 'Usuario no autorizado' ? 401 : 500;
    const message = error instanceof Error ? error.message : defaultMessage;
    res.status(status).json({
        success: false,
        message,
        error: error instanceof Error ? error.message : 'Error desconocido'
    });
};
exports.handleError = handleError;
