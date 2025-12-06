"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommerceModel = void 0;
const mongoose_1 = require("mongoose");
const dayScheduleSchema = {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '18:00' },
    isClosed: { type: Boolean, default: false }
};
const commerceSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    imageUrl: {
        type: String,
        required: [true, 'Image URL is required'],
        trim: true
    },
    category: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required']
    },
    schedule: {
        monday: dayScheduleSchema,
        tuesday: dayScheduleSchema,
        wednesday: dayScheduleSchema,
        thursday: dayScheduleSchema,
        friday: dayScheduleSchema,
        saturday: { ...dayScheduleSchema, end: { type: String, default: '14:00' } },
        sunday: { ...dayScheduleSchema, isClosed: { type: Boolean, default: true } }
    },
    googleMapsIframe: {
        type: String,
        required: false, // No es obligatorio
        trim: true
    },
    contact: {
        email: {
            type: String,
            required: false,
            trim: true
        },
        phone: {
            type: String,
            required: false,
            trim: true
        },
        website: {
            type: String,
            required: false,
            trim: true
        },
        socialMedia: {
            facebook: {
                type: String,
                required: false,
                trim: true
            },
            instagram: {
                type: String,
                required: false,
                trim: true
            },
            whatsapp: {
                type: String,
                required: false,
                trim: true
            }
        }
    }
}, {
    timestamps: true
});
exports.CommerceModel = (0, mongoose_1.model)('Commerce', commerceSchema);
