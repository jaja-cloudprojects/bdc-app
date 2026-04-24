import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import cron from 'node-cron';
import { prisma } from '../config/database';
import { requireAdmin, requireSuperAdmin, AuthedRequest } from '../middleware/auth';
import { upload, fileUrl, pdfUpload } from '../middleware/upload';
import { broadcastPush, sendPushToUsers } from '../services/notification.service';
import { registerRecurring, unregisterRecurring, fireCampaign } from '../services/campaign.scheduler';
import { uploadDocument, deleteDocument } from '../config/supabase';

const router = Router();

// All routes require at least ADMIN/FORMATRICE/SUPER_ADMIN
router.use(requireAdmin);

// ============================================================================
// USERS — SuperAdmin only
// ============================================================================
router.get('/users', requireSuperAdmin, async (_req, res, next) => {
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
  role: z.enum(['STUDENT', 'FORMATRICE', 'ADMIN', 'SUPER_ADMIN']).default('STUDENT'),
});

router.post('/users', requireSuperAdmin, async (req, res, next) => {
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
  role:      z.enum(['STUDENT', 'FORMATRICE', 'ADMIN', 'SUPER_ADMIN']).optional(),
});

router.patch('/users/:id', requireSuperAdmin, async (req, res, next) => {
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

router.delete('/users/:id', requireSuperAdmin, async (req, res, next) => {
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

router.patch('/products/:id/stock', async (req, res, next) => {
  try {
    const stock = req.body.stock;
    const isValidStock = Number.isInteger(stock) && stock >= 0;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        stock: isValidStock ? stock : null,
        inStock: isValidStock ? stock > 0 : true,
      },
    });
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

router.get('/masterclass', async (_req, res, next) => {
  try {
    const list = await prisma.masterclass.findMany({
      where: { date: { gte: new Date() } },
      orderBy: { date: 'asc' },
      include: { _count: { select: { reservations: true } } },
    });
    res.json(list);
  } catch (e) { next(e); }
});

router.get('/masterclass/:id/students', async (req, res, next) => {
  try {
    const reservations = await prisma.reservation.findMany({
      where: { masterclassId: req.params.id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(reservations);
  } catch (e) { next(e); }
});

router.delete('/masterclass/:id/reservation/:reservationId', async (req, res, next) => {
  try {
    await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: req.params.reservationId },
      });
      if (!reservation || reservation.masterclassId !== req.params.id) {
        throw Object.assign(new Error('Réservation introuvable'), { status: 404 });
      }
      await tx.reservation.delete({ where: { id: req.params.reservationId } });
      await tx.masterclass.update({
        where: { id: req.params.id },
        data: { spotsAvailable: { increment: 1 } },
      });
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
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
// DOCUMENTS — SuperAdmin only
// ============================================================================
router.get('/documents', requireSuperAdmin, async (_req, res, next) => {
  try {
    const docs = await prisma.document.findMany({ orderBy: { uploadedAt: 'desc' } });
    res.json(docs);
  } catch (e) { next(e); }
});

const documentBodySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  category: z.string().min(1).max(100).optional(),
});

router.post('/documents', requireSuperAdmin, pdfUpload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'Fichier PDF requis.' });

    // Verify PDF magic bytes to block disguised file uploads
    if (file.buffer.slice(0, 4).toString('ascii') !== '%PDF') {
      return res.status(400).json({ message: 'Le fichier n\'est pas un PDF valide.' });
    }

    const { title, category } = documentBodySchema.parse(req.body);

    const fileUrl = await uploadDocument(file.buffer, file.originalname, file.mimetype);

    const doc = await prisma.document.create({
      data: {
        title: (title?.trim()) || file.originalname.replace(/\.pdf$/i, ''),
        category: category?.trim() || 'Cours',
        fileUrl,
        fileType: 'application/pdf',
        fileSize: file.size,
        userId: null, // visible by all students
      },
    });
    res.status(201).json(doc);
  } catch (e) { next(e); }
});

router.delete('/documents/:id', requireSuperAdmin, async (req, res, next) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!doc) return res.status(404).json({ message: 'Document introuvable.' });

    // Remove from Supabase Storage (extract path from public URL)
    try {
      const url = new URL(doc.fileUrl);
      const parts = url.pathname.split('/');
      const bucketIdx = parts.findIndex((p) => p === 'documents');
      if (bucketIdx !== -1) {
        const storagePath = parts.slice(bucketIdx + 1).join('/');
        await deleteDocument(storagePath);
      }
    } catch { /* ignore storage errors — still delete DB record */ }

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

router.post('/notifications/push', requireSuperAdmin, async (req, res, next) => {
  try {
    const { title, body, data, userIds } = pushSchema.parse(req.body);
    const result = userIds?.length
      ? await sendPushToUsers(userIds, { title, body, data })
      : await broadcastPush({ title, body, data });
    res.json(result);
  } catch (e) { next(e); }
});

router.get('/notifications', requireSuperAdmin, async (_req, res, next) => {
  try {
    const items = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(items);
  } catch (e) { next(e); }
});

router.delete('/notifications', requireSuperAdmin, async (_req, res, next) => {
  try {
    const { count } = await prisma.notification.deleteMany({});
    res.json({ ok: true, deleted: count });
  } catch (e) { next(e); }
});

// In-app notification (stored in DB, polled by mobile — no Expo push)
const inappSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(400),
});

router.post('/notifications/inapp', requireSuperAdmin, async (req, res, next) => {
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
// NOTIFICATION CAMPAIGNS
// ============================================================================
const campaignSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(400),
  isRecurring: z.boolean().default(false),
  cronExpr: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
});

router.get('/campaigns', requireSuperAdmin, async (_req, res, next) => {
  try {
    const campaigns = await prisma.notificationCampaign.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(campaigns);
  } catch (e) { next(e); }
});

router.post('/campaigns', requireSuperAdmin, async (req, res, next) => {
  try {
    const data = campaignSchema.parse(req.body);

    if (data.isRecurring && data.cronExpr && !cron.validate(data.cronExpr)) {
      return res.status(400).json({ message: 'Expression cron invalide.' });
    }

    const campaign = await prisma.notificationCampaign.create({
      data: {
        name: data.name,
        title: data.title,
        body: data.body,
        isRecurring: data.isRecurring,
        cronExpr: data.isRecurring ? (data.cronExpr ?? null) : null,
        scheduledAt: !data.isRecurring && data.scheduledAt ? new Date(data.scheduledAt) : null,
        isActive: data.isActive,
      },
    });

    if (campaign.isActive && campaign.isRecurring) {
      registerRecurring(campaign);
    }

    res.status(201).json(campaign);
  } catch (e) { next(e); }
});

router.patch('/campaigns/:id', requireSuperAdmin, async (req, res, next) => {
  try {
    const data = campaignSchema.partial().parse(req.body);

    if (data.cronExpr && !cron.validate(data.cronExpr)) {
      return res.status(400).json({ message: 'Expression cron invalide.' });
    }

    const campaign = await prisma.notificationCampaign.update({
      where: { id: req.params.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.body !== undefined && { body: data.body }),
        ...(data.isRecurring !== undefined && { isRecurring: data.isRecurring }),
        ...(data.cronExpr !== undefined && { cronExpr: data.cronExpr }),
        ...(data.scheduledAt !== undefined && { scheduledAt: new Date(data.scheduledAt) }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    // Re-sync scheduler
    if (campaign.isActive && campaign.isRecurring) {
      registerRecurring(campaign);
    } else {
      unregisterRecurring(campaign.id);
    }

    res.json(campaign);
  } catch (e) { next(e); }
});

router.delete('/campaigns/:id', requireSuperAdmin, async (req, res, next) => {
  try {
    unregisterRecurring(req.params.id);
    await prisma.notificationCampaign.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post('/campaigns/:id/send', requireSuperAdmin, async (req, res, next) => {
  try {
    await fireCampaign(req.params.id);
    const campaign = await prisma.notificationCampaign.findUnique({ where: { id: req.params.id } });
    res.json(campaign);
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

// ============================================================================
// DB EXPLORER — SuperAdmin only (SELECT queries only)
// ============================================================================
router.get('/db-tables', requireSuperAdmin, async (_req, res, next) => {
  try {
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    res.json(tables.map((t) => t.table_name));
  } catch (e) { next(e); }
});

const dbQuerySchema = z.object({
  sql: z.string().min(1).max(2000).refine(
    (s) => /^\s*SELECT\b/i.test(s),
    { message: 'Seules les requêtes SELECT sont autorisées.' }
  ),
});

router.post('/db-query', requireSuperAdmin, async (req, res, next) => {
  try {
    const { sql } = dbQuerySchema.parse(req.body);
    const rows = await prisma.$queryRawUnsafe(sql);
    res.json({ rows });
  } catch (e) { next(e); }
});

export default router;
