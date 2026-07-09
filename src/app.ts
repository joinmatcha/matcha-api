import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import { env } from '@/config/env';
import swaggerSpec from '@/config/swagger';
import { errorHandler } from '@/middlewares/error.middleware';
import { requestLogger } from '@/middlewares/requestLogger.middleware';
import { registerRoutes } from '@/modules';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: env.BACKOFFICE_URL, credentials: true }));
app.use(helmet());
app.use(requestLogger);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

registerRoutes(app);

app.use(errorHandler);

export default app;
