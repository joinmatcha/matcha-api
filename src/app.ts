import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import { env } from '@/config/env';
import swaggerSpec from '@/config/swagger';
import { errorHandler } from '@/middlewares/error.middleware';
import { registerRoutes } from '@/modules';

const app = express();

app.use(express.json());
app.use(cors({ origin: env.CLIENT_URL }));
app.use(helmet());

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

registerRoutes(app);

app.use(errorHandler);

export default app;
