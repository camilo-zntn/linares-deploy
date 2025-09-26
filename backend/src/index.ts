// Configuracion de variables de entorno
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';

import chalk from 'chalk';

// Importar modelos
import './models/user.model';

// Importar rutas
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import logRoutes from './routes/log.routes';
import categoryRoutes from './routes/category.routes';
import commerceRoutes from './routes/commerce.routes';
import requestRoutes from './routes/request.routes';
import referralRoutes from './routes/referral.routes';
import analyticsRoutes from './routes/analyticsRoutes';

// Inicializacion de Express
const app = express();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Update the static file serving configuration
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    }
  }
}));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/commerces', commerceRoutes); 
app.use('/api/requests', requestRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/analytics', analyticsRoutes);

// Banner de inicio
console.log(chalk.cyan.bold(`
  ╔════════════════════════════╗
  ║                            ║
  ║     Sistema de Linares     ║
  ║                            ║ 
  ╚════════════════════════════╝
  `));

// Ruta base
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: chalk.green.bold('✓ API Sistema de Digitalizacion'),
    version: chalk.yellow('1.0.0'),
    environment: chalk.cyan(process.env.NODE_ENV || 'development')
  });
});

// Error Handler 
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(chalk.red.bold('\n⚠ Error:'), chalk.red(err.stack), '\n');
  res.status(500).json({
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Suprimir warnings de deprecacion
process.removeAllListeners('warning');
process.env.NODE_NO_WARNINGS = '1';

// Conexion a MongoDB
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log(chalk.green.bold('\n✓ Base de datos:'), chalk.cyan('Conectada'));
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(
        chalk.yellow.bold('\n⚡ Servidor:'), 
        chalk.cyan(`http://localhost:${PORT}`),
        '\n'
      );
    });
  })
  .catch(err => {
    console.error(
      chalk.red.bold('\n✖ Error de conexion:'),
      chalk.red(err),
      '\n'
    );
    process.exit(1);
  });

export default app;