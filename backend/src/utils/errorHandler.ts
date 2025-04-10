import { Response } from 'express';

export const handleError = (res: Response, error: unknown, defaultMessage: string) => {
  console.error('Error:', error);
  
  const status = error instanceof Error && error.message === 'Usuario no autorizado' ? 401 : 500;
  const message = error instanceof Error ? error.message : defaultMessage;

  res.status(status).json({
    success: false,
    message,
    error: error instanceof Error ? error.message : 'Error desconocido'
  });
};