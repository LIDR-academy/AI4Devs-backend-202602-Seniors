import { Request, Response, NextFunction } from 'express';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import candidateRoutes from './routes/candidateRoutes';
import positionRoutes from './routes/positionRoutes';
import { uploadFile } from './application/services/fileUploadService';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../swagger';
import { observabilityMiddleware, stagUpdateObservabilityMiddleware, getMetrics, getHealthStatus } from './middleware/observabilityMiddleware';

// Extender la interfaz Request para incluir prisma
declare global {
  namespace Express {
    interface Request {
      prisma: PrismaClient;
    }
  }
}

dotenv.config();
const prisma = new PrismaClient();

export const app = express();
export default app;

// Middleware para parsear JSON. Asegúrate de que esto esté antes de tus rutas.
app.use(express.json());

// Middleware para adjuntar prisma al objeto de solicitud
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Observability middleware for monitoring and logging
app.use(observabilityMiddleware);
app.use(stagUpdateObservabilityMiddleware);

// Middleware para permitir CORS desde localhost (desarrollo)
app.use(cors({
  origin: (origin, callback) => {
    // En desarrollo, permitir localhost en cualquier puerto
    if (!origin || origin.includes('localhost')) {
      callback(null, true);
    } else if (process.env.NODE_ENV === 'production') {
      // En producción, usar origin específico de variable de entorno
      const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';
      if (origin === allowedOrigin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

// Swagger API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    persistAuthorization: true,
  },
}));

// Import and use candidateRoutes
app.use('/candidates', candidateRoutes);

// Position routes
app.use('/positions', positionRoutes);

// Route for file uploads
app.post('/upload', uploadFile);

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

const port = 3010;

app.get('/', (req, res) => {
  res.send('Hola LTI!');
});

// Health check endpoint
app.get('/health', (req, res) => {
  const health = getHealthStatus();
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.json(getMetrics());
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.type('text/plain');
  res.status(500).send('Something broke!');
});

// Only start the server if this file is run directly
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}
