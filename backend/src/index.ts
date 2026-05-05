import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { createApp } from './createApp';

dotenv.config();

const prisma = new PrismaClient();
const app = createApp(prisma);

const port = 3010;

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
