"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestModel = void 0;
const mongoose_1 = require("mongoose");
const messageSchema = new mongoose_1.Schema({
    sender: { type: String, enum: ['user', 'admin'], required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    senderName: { type: String, required: true },
    senderEmail: { type: String }
});
const requestSchema = new mongoose_1.Schema({
    email: { type: String, required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['problem', 'suggestion'], required: true },
    status: { type: String, enum: ['pending', 'in_process', 'resolved'], default: 'pending' },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    messages: [messageSchema]
}, {
    timestamps: true
});
exports.RequestModel = (0, mongoose_1.model)('Request', requestSchema);
