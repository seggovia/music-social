import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './shared/middleware/errorHandler.js';
import { notFound } from './shared/middleware/notFound.js';
import { apiRateLimiter } from './shared/middleware/rateLimit.middleware.js';

export const app = express();

if (env.TRUST_PROXY_HOPS > 0) {
  app.set('trust proxy', env.TRUST_PROXY_HOPS);
}

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use('/api', apiRateLimiter);
app.use(express.json());

app.use('/api', apiRouter);

app.use(notFound);
app.use(errorHandler);
