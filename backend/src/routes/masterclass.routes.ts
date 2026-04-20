import { Router } from 'express';
import { prisma } from '../config/database';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { sendPushToUsers } from '../services/notification.service';

const router = Router();

router.get('/upcoming', async (_req, res, next) => {
  try {
    const items = await prisma.masterclass.findMany({
      where: { date: { gte: new Date() } },
      orderBy: { date: 'asc' },
      take: 10,
    });
    res.json(items);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/reserve', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.user!.sub;
    const masterclassId = req.params.id;

    const mc = await prisma.masterclass.findUnique({ where: { id: masterclassId } });
    if (!mc) return res.status(404).json({ message: 'Masterclass not found' });
    if (mc.spotsAvailable <= 0) {
      return res.status(409).json({ message: 'Complet' });
    }

    // Atomic reservation
    const reservation = await prisma.$transaction(async (tx) => {
      const existing = await tx.reservation.findUnique({
        where: { userId_masterclassId: { userId, masterclassId } },
      });
      if (existing) {
        throw Object.assign(new Error('Déjà réservé'), { status: 409 });
      }
      await tx.masterclass.update({
        where: { id: masterclassId },
        data: { spotsAvailable: { decrement: 1 } },
      });
      return tx.reservation.create({
        data: { userId, masterclassId, status: 'CONFIRMED' },
      });
    });

    // Push confirmation (non-blocking)
    sendPushToUsers([userId], {
      title: 'Réservation confirmée',
      body: `Votre place pour « ${mc.title} » est réservée.`,
      data: { type: 'reservation', masterclassId },
    }).catch(() => {});

    res.status(201).json(reservation);
  } catch (e) {
    next(e);
  }
});

export default router;
