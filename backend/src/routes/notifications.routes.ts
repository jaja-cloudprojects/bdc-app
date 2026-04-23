import { Router } from 'express';
import { prisma } from '../config/database';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

// Mobile polls this to get in-app notifications newer than `since`
router.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.user!.sub;
    const since = req.query.since as string | undefined;
    const all = await prisma.notification.findMany({
      where: {
        ...(since ? { createdAt: { gt: new Date(since) } } : {}),
        OR: [{ userId: null }, { userId }],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const inapp = all.filter(n => (n.data as any)?.type === 'INAPP');
    res.json(inapp);
  } catch (e) { next(e); }
});

export default router;
