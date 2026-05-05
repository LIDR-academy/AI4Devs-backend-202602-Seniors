import { Request, Response, NextFunction } from 'express';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import candidateRoutes from './routes/candidateRoutes';
import positionRoutes from './routes/positionRoutes';
import { uploadFile } from './application/services/fileUploadService';
import cors from 'cors';

export function createApp(prisma: PrismaClient): express.Application {
    const app = express();

    app.use(express.json());

    app.use((req, _res, next) => {
        req.prisma = prisma;
        next();
    });

    app.use(
        cors({
            origin: 'http://localhost:3000',
            credentials: true,
        })
    );

    app.use('/candidates', candidateRoutes);
    app.use('/positions', positionRoutes);

    app.post('/upload', uploadFile);

    app.use((req, _res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });

    app.get('/', (_req, res) => {
        res.send('Hola LTI!');
    });

    app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
        console.error(err instanceof Error ? err.stack : err);
        res.type('text/plain');
        res.status(500).send('Something broke!');
    });

    return app;
}
