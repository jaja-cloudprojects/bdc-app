import { Router } from 'express';
import { prisma } from '../config/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

// Mobile polls this to get in-app notifications newer than `since`
router.get('/', async (req, res, next) => {
  try {
    const since = req.query.since as string | undefined;
    const all = await prisma.notification.findMany({
      where: since ? { createdAt: { gt: new Date(since) } } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const inapp = all.filter(n => (n.data as any)?.type === 'INAPP');
    res.json(inapp);
  } catch (e) { next(e); }
});

export default router;
