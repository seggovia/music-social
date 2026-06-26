import { Router } from 'express';
import { authRouter } from '../features/auth/auth.routes.js';
import { albumsRouter } from '../features/albums/albums.routes.js';
import { artistsRouter } from '../features/artists/artists.routes.js';
import { reviewsRouter } from '../features/reviews/reviews.routes.js';
import { messagesRouter } from '../features/messages/messages.routes.js';
import { usersRouter } from '../features/users/users.routes.js';
import { chartsRouter } from '../features/charts/charts.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/albums', albumsRouter);
apiRouter.use('/artists', artistsRouter);
apiRouter.use('/reviews', reviewsRouter);
apiRouter.use('/messages', messagesRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/charts', chartsRouter);