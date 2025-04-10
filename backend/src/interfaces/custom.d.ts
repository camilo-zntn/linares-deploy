import { Request } from 'express';

export interface IPayload {
  _id: string;
  role: string;
  username: string;
}

export interface CustomRequest extends Request {
  user?: IPayload;
}