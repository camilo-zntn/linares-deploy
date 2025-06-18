import { Schema, model } from 'mongoose';
import { Multer } from 'multer';

interface DaySchedule {
  start: string;
  end: string;
  isClosed: boolean;
}

interface Schedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface ICommerce {
  name: string;
  description: string;
  imageUrl: string;
  image?: Express.Multer.File;
  category: Schema.Types.ObjectId;  
  schedule: Schedule;
  createdAt: Date;
  updatedAt: Date;
  googleMapsIframe: string;
  contact: {
    email: string;
    phone: string;
    website: string;
    socialMedia: {
      facebook: string;
      instagram: string;
      whatsapp: string;
    };
  };
}

const dayScheduleSchema = {
  start: { type: String, default: '09:00' },
  end: { type: String, default: '18:00' },
  isClosed: { type: Boolean, default: false }
};

const commerceSchema = new Schema<ICommerce>({
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
    type: Schema.Types.ObjectId,
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

export const CommerceModel = model<ICommerce>('Commerce', commerceSchema);