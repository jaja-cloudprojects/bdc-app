import { Router } from 'express';
import { prisma } from '../config/database';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const items = await prisma.newsItem.findMany({
      orderBy: { publishedAt: 'desc' },
    });
    res.json(items);
  } catch (e) {
    next(e);
  }
});

router.get('/latest', async (_req, res, next) => {
  try {
    const items = await prisma.newsItem.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 5,
    });
    res.json(items);
  } catch (e) {
    next(e);
  }
});

export default router;
