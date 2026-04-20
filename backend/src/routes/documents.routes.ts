import { Router } from 'express';
import { prisma } from '../config/database';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.user!.sub;
    const docs = await prisma.document.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      orderBy: { uploadedAt: 'desc' },
    });
    res.json(
      docs.map((d) => ({
        id: d.id,
        title: d.title,
        category: d.category,
        fileUrl: d.fileUrl,
        fileType: d.fileType,
        fileSize: d.fileSize,
        uploadedAt: d.uploadedAt.toISOString(),
      }))
    );
  } catch (e) {
    next(e);
  }
});

export default router;
