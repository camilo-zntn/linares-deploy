import { Request } from 'express';

export interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: string;
    name?: string;
    email?: string;
  };
}