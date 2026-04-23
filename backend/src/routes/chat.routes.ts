import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const router = Router();

/** GET /chat/messages — returns active conversation messages for current user */
router.get('/messages', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.user!.sub;
    let conversation = await prisma.conversation.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { userId },
        include: { messages: true },
      });
    }
    res.json(
      conversation.messages.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        role: m.role,
        content: m.content,
        attachments: m.attachments ?? null,
        createdAt: m.createdAt.toISOString(),
      }))
    );
  } catch (e) {
    next(e);
  }
});

const sendSchema = z.object({
  content: z.string().min(1).max(2000),
  conversationId: z.string().optional(),
});

/**
 * POST /chat/messages — user sends a message.
 * The BDC "bot" will auto-reply with a stock acknowledgement for MVP.
 * Real AI integration can be plugged in here later.
 */
router.post('/messages', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.user!.sub;
    const { content, conversationId } = sendSchema.parse(req.body);

    let conv = conversationId
      ? await prisma.conversation.findFirst({ where: { id: conversationId, userId } })
      : await prisma.conversation.findFirst({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
        });
    if (!conv) {
      conv = await prisma.conversation.create({ data: { userId } });
    }

    const priorUserMsgs = await prisma.message.count({
      where: { conversationId: conv.id, role: 'USER' },
    });

    const userMessage = await prisma.message.create({
      data: { conversationId: conv.id, role: 'USER', content },
    });

    // Welcome reply only on the very first message of the conversation
    if (priorUserMsgs === 0) {
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          role: 'BOT',
          content: "Merci pour votre message. Un membre de l'équipe BDC vous répondra très vite.",
        },
      });
    }

    res.status(201).json({
      id: userMessage.id,
      conversationId: userMessage.conversationId,
      role: userMessage.role,
      content: userMessage.content,
      createdAt: userMessage.createdAt.toISOString(),
    });
  } catch (e) {
    next(e);
  }
});

export default router;
