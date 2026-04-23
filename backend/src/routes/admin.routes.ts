import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/database';
import { requireAdmin, AuthedRequest } from '../middleware/auth';
import { upload, fileUrl } from '../middleware/upload';
import { broadcastPush, sendPushToUsers } from '../services/notification.service';

const router = Router();

// All routes here require admin
router.use(requireAdmin);

// ============================================================================
// USERS
// ============================================================================
router.get('/users', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, email: true, firstName: true, lastName: true,
        avatarUrl: true, role: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (e) { next(e); }
});

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['STUDENT', 'ADMIN']).default('STUDENT'),
});

router.post('/users', async (req, res, next) => {
  try {
    const data = createUserSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });
    res.status(201).json(user);
  } catch (e) { next(e); }
});

const updateUserSchema = z.object({
  email:     z.string().email().optional(),
  password:  z.string().min(8).optional(),
  firstName: z.string().min(1).optional(),
  lastName:  z.string().min(1).optional(),
  role:      z.enum(['STUDENT', 'ADMIN']).optional(),
});

router.patch('/users/:id', async (req, res, next) => {
  try {
    const data = updateUserSchema.parse(req.body);

    if (data.email) {
      const conflict = await prisma.user.findFirst({
        where: { email: data.email.toLowerCase(), NOT: { id: req.params.id } },
      });
      if (conflict) return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }

    const update: Record<string, unknown> = {};
    if (data.firstName) update.firstName = data.firstName;
    if (data.lastName)  update.lastName  = data.lastName;
    if (data.email)     update.email     = data.email.toLowerCase();
    if (data.role)      update.role      = data.role;
    if (data.password)  update.passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: update,
      select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
    });
    res.json(user);
  } catch (e) { next(e); }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ============================================================================
// CATEGORIES
// ============================================================================
const categorySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  order: z.number().int().optional(),
});

router.post('/categories', async (req, res, next) => {
  try {
    const data = categorySchema.parse(req.body);
    const cat = await prisma.category.create({ data: data as any });
    res.status(201).json(cat);
  } catch (e) { next(e); }
});

router.put('/categories/:id', async (req, res, next) => {
  try {
    const data = categorySchema.partial().parse(req.body);
    const cat = await prisma.category.update({ where: { id: req.params.id }, data: data as any });
    res.json(cat);
  } catch (e) { next(e); }
});

router.delete('/categories/:id', async (req, res, next) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ============================================================================
// PRODUCTS
// ============================================================================
const productSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  currency: z.string().default('EUR'),
  imageUrl: z.string().url().optional(),
  gallery: z.array(z.string()).default([]),
  isNew: z.boolean().default(false),
  inStock: z.boolean().default(true),
  categoryId: z.string().optional(),
});

router.post('/products', async (req, res, next) => {
  try {
    const data = productSchema.parse(req.body);
    const product = await prisma.product.create({ data: data as any });
    res.status(201).json(product);
  } catch (e) { next(e); }
});

router.put('/products/:id', async (req, res, next) => {
  try {
    const data = productSchema.partial().parse(req.body);
    const product = await prisma.product.update({ where: { id: req.params.id }, data: data as any });
    res.json(product);
  } catch (e) { next(e); }
});

router.delete('/products/:id', async (req, res, next) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ============================================================================
// NEWS
// ============================================================================
const newsSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  body: z.string().optional(),
  imageUrl: z.string().url().optional(),
  publishedAt: z.string().datetime().optional(),
});

router.post('/news', async (req, res, next) => {
  try {
    const data = newsSchema.parse(req.body);
    const item = await prisma.newsItem.create({
      data: {
        ...data,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
      } as any,
    });
    // Auto-broadcast push when publishing news
    broadcastPush({
      title: 'Nouvelle actualité',
      body: item.title,
      data: { type: 'news', id: item.id },
    }).catch(() => {});
    res.status(201).json(item);
  } catch (e) { next(e); }
});

router.delete('/news/:id', async (req, res, next) => {
  try {
    await prisma.newsItem.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ============================================================================
// MASTERCLASS
// ============================================================================
const masterclassSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  date: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  capacity: z.number().int().positive().default(10),
});

router.post('/masterclass', async (req, res, next) => {
  try {
    const data = masterclassSchema.parse(req.body);
    const mc = await prisma.masterclass.create({
  data: {
    ...data,
    date: new Date(data.date),
    endDate: data.endDate ? new Date(data.endDate) : null,
    spotsAvailable: data.capacity,
  } as any,
});
    res.status(201).json(mc);
  } catch (e) { next(e); }
});

router.delete('/masterclass/:id', async (req, res, next) => {
  try {
    await prisma.masterclass.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ============================================================================
// DOCUMENTS
// ============================================================================
router.get('/documents', async (_req, res, next) => {
  try {
    const docs = await prisma.document.findMany({ orderBy: { uploadedAt: 'desc' } });
    res.json(docs);
  } catch (e) { next(e); }
});

router.post('/documents', upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'file required' });
    const { title, category, userId } = req.body as Record<string, string>;
    const doc = await prisma.document.create({
      data: {
        title: title || file.originalname,
        category: category || 'general',
        fileUrl: fileUrl(file.filename),
        fileType: file.mimetype,
        fileSize: file.size,
        userId: userId || null,
      },
    });
    res.status(201).json(doc);
  } catch (e) { next(e); }
});

router.delete('/documents/:id', async (req, res, next) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    const filename = path.basename(doc.fileUrl);
    const fullPath = path.resolve('./uploads', filename);
    fs.unlink(fullPath, () => {});
    await prisma.document.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ============================================================================
// UPLOAD (generic, e.g. product images)
// ============================================================================
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'file required' });
  res.status(201).json({
    url: fileUrl(req.file.filename),
    filename: req.file.filename,
    size: req.file.size,
    mimeType: req.file.mimetype,
  });
});

// ============================================================================
// PUSH NOTIFICATIONS (broadcast or targeted)
// ============================================================================
const pushSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(400),
  data: z.record(z.any()).optional(),
  userIds: z.array(z.string()).optional(), // if omitted => broadcast
});

router.post('/notifications/push', async (req, res, next) => {
  try {
    const { title, body, data, userIds } = pushSchema.parse(req.body);
    const result = userIds?.length
      ? await sendPushToUsers(userIds, { title, body, data })
      : await broadcastPush({ title, body, data });
    res.json(result);
  } catch (e) { next(e); }
});

router.get('/notifications', async (_req, res, next) => {
  try {
    const items = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(items);
  } catch (e) { next(e); }
});

// In-app notification (stored in DB, polled by mobile — no Expo push)
const inappSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(400),
});

router.post('/notifications/inapp', async (req, res, next) => {
  try {
    const { title, body } = inappSchema.parse(req.body);
    const item = await prisma.notification.create({
      data: { title, body, data: { type: 'INAPP' }, sentTo: 0 },
    });
    res.status(201).json(item);
  } catch (e) { next(e); }
});

// ============================================================================
// CONVERSATIONS (messagerie BDC Bot admin)
// ============================================================================
router.get('/conversations', async (_req, res, next) => {
  try {
    const conversations = await prisma.conversation.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(conversations.map(c => ({
      id: c.id,
      user: c.user,
      lastMessage: c.messages[0]
        ? { role: c.messages[0].role, content: c.messages[0].content, createdAt: c.messages[0].createdAt.toISOString() }
        : null,
      updatedAt: c.updatedAt.toISOString(),
    })));
  } catch (e) { next(e); }
});

router.get('/conversations/:id/messages', async (req, res, next) => {
  try {
    const conv = await prisma.conversation.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!conv) return res.status(404).json({ message: 'Conversation introuvable' });
    res.json({
      id: conv.id,
      user: conv.user,
      messages: conv.messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (e) { next(e); }
});

const adminMsgSchema = z.object({
  content: z.string().min(1).max(2000),
});

router.post('/conversations/:id/messages', async (req: AuthedRequest, res, next) => {
  try {
    const { content } = adminMsgSchema.parse(req.body);
    const conv = await prisma.conversation.findUnique({ where: { id: req.params.id } });
    if (!conv) return res.status(404).json({ message: 'Conversation introuvable' });

    const adminUser = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: { firstName: true, lastName: true },
    });
    const senderName = adminUser ? `${adminUser.firstName} ${adminUser.lastName}` : 'BDC Support';

    const msg = await prisma.message.create({
      data: { conversationId: conv.id, role: 'ADMIN', content, attachments: { senderName } },
    });
    await prisma.conversation.update({ where: { id: conv.id }, data: {} });

    // In-app notification ciblée pour l'utilisateur de la conversation
    const preview = content.length > 100 ? content.substring(0, 100) + '…' : content;
    await prisma.notification.create({
      data: {
        userId: conv.userId,
        title: senderName,
        body: preview,
        data: { type: 'INAPP', source: 'chat' },
      },
    });

    res.status(201).json({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      senderName,
      createdAt: msg.createdAt.toISOString(),
    });
  } catch (e) { next(e); }
});

// ============================================================================
// STATS
// ============================================================================
router.get('/stats', async (_req, res, next) => {
  try {
    const [users, products, masterclass, reservations, pushTokens] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.masterclass.count({ where: { date: { gte: new Date() } } }),
      prisma.reservation.count(),
      prisma.pushToken.count(),
    ]);
    res.json({ users, products, upcomingMasterclass: masterclass, reservations, pushTokens });
  } catch (e) { next(e); }
});

export default router;
