import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
import { defaultLimiter } from '../middleware/rateLimiter';
import { getHomeFeed } from '../services/homeService';
import { success } from '../utils/response';

export const homeRouter = Router();

homeRouter.use(defaultLimiter);

homeRouter.get('/feed', optionalAuth, async (req, res, next) => {
  try {
    const feed = await getHomeFeed(req.user?.id);
    return success(res, feed);
  } catch (caughtError) {
    return next(caughtError);
  }
});
