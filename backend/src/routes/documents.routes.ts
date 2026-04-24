import { Router } from 'express';
import { prisma } from '../config/database';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { getDocumentSignedUrl } from '../config/supabase';

const router = Router();

router.get('/', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.user!.sub;
    const docs = await prisma.document.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      orderBy: { uploadedAt: 'desc' },
    });

    // Generate fresh signed URLs (valid 1h) — documents bucket is private
    const results = await Promise.all(
      docs.map(async (d) => {
        let fileUrl = d.fileUrl;
        try {
          // Only generate signed URL if fileUrl looks like a storage path (not a legacy public URL)
          if (!d.fileUrl.startsWith('http')) {
            fileUrl = await getDocumentSignedUrl(d.fileUrl);
          }
        } catch {
          // Keep original URL as fallback (legacy public documents)
        }
        return {
          id: d.id,
          title: d.title,
          category: d.category,
          fileUrl,
          fileType: d.fileType,
          fileSize: d.fileSize,
          uploadedAt: d.uploadedAt.toISOString(),
        };
      })
    );

    res.json(results);
  } catch (e) {
    next(e);
  }
});

export default router;
