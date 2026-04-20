import { Router } from 'express';
import { prisma } from '../config/database';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const cats = await prisma.category.findMany({ orderBy: { order: 'asc' } });
    res.json(cats);
  } catch (e) {
    next(e);
  }
});

export default router;
