import { Router } from 'express';
import { prisma } from '../config/database';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { sendPushToUsers } from '../services/notification.service';

const router = Router();

router.get('/my-reservations', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.user!.sub;
    const reservations = await prisma.reservation.findMany({
      where: { userId },
      include: {
        masterclass: {
          select: { id: true, title: true, date: true, endDate: true, location: true, spotsAvailable: true },
        },
      },
      orderBy: { masterclass: { date: 'asc' } },
    });
    res.json(reservations);
  } catch (e) { next(e); }
});

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

router.delete('/:id/reserve', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.user!.sub;
    const masterclassId = req.params.id;

    await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { userId_masterclassId: { userId, masterclassId } },
      });
      if (!reservation) {
        throw Object.assign(new Error('Réservation introuvable'), { status: 404 });
      }
      await tx.reservation.delete({ where: { id: reservation.id } });
      await tx.masterclass.update({
        where: { id: masterclassId },
        data: { spotsAvailable: { increment: 1 } },
      });
    });

    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post('/:id/reserve', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.user!.sub;
    const masterclassId = req.params.id;

    // All checks and updates inside the same transaction to prevent race conditions
    let mcTitle = '';
    const reservation = await prisma.$transaction(async (tx) => {
      const mc = await tx.masterclass.findUnique({ where: { id: masterclassId } });
      if (!mc) throw Object.assign(new Error('Masterclass not found'), { status: 404 });
      if (mc.spotsAvailable <= 0) throw Object.assign(new Error('Complet'), { status: 409 });

      const existing = await tx.reservation.findUnique({
        where: { userId_masterclassId: { userId, masterclassId } },
      });
      if (existing) throw Object.assign(new Error('Déjà réservé'), { status: 409 });

      mcTitle = mc.title;
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
      body: `Votre place pour « ${mcTitle} » est réservée.`,
      data: { type: 'reservation', masterclassId },
    }).catch(() => {});

    res.status(201).json(reservation);
  } catch (e) {
    next(e);
  }
});

export default router;
