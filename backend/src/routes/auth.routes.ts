import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/database';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { revokeToken } from '../utils/tokenBlacklist';
import { upload, avatarUpload } from '../middleware/upload';
import { uploadAvatar } from '../config/supabase';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(401).json({ message: 'Identifiants incorrects' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Identifiants incorrects' });

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    });
  } catch (e) {
    next(e);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) return res.status(400).json({ message: 'refreshToken required' });
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ message: 'User no longer exists' });

    const freshPayload = { sub: user.id, email: user.email, role: user.role };
    res.json({
      token: signAccessToken(freshPayload),
      refreshToken: signRefreshToken(freshPayload),
    });
  } catch {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

router.get('/me', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      role: user.role,
    });
  } catch (e) {
    next(e);
  }
});

router.post('/logout', requireAuth, async (req: AuthedRequest, res) => {
  if (req.user?.jti) revokeToken(req.user.jti);
  res.json({ ok: true });
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

router.patch('/me', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const data = updateProfileSchema.parse(req.body);

    if (data.email) {
      const conflict = await prisma.user.findFirst({
        where: { email: data.email.toLowerCase(), NOT: { id: req.user!.sub } },
      });
      if (conflict) return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }

    const user = await prisma.user.update({
      where: { id: req.user!.sub },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.email !== undefined && { email: data.email.toLowerCase() }),
      },
    });

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      role: user.role,
    });
  } catch (e) {
    next(e);
  }
});

router.post('/avatar', requireAuth, avatarUpload.single('avatar'), async (req: AuthedRequest, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier reçu.' });

    const avatarUrl = await uploadAvatar(req.user!.sub, req.file.buffer, req.file.mimetype);

    await prisma.user.update({
      where: { id: req.user!.sub },
      data: { avatarUrl },
    });

    res.json({ avatarUrl });
  } catch (e) {
    next(e);
  }
});

const pushTokenSchema = z.object({
  token: z.string().min(10),
  platform: z.enum(['ios', 'android']),
});

router.post('/push-token', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { token, platform } = pushTokenSchema.parse(req.body);
    await prisma.pushToken.upsert({
      where: { token },
      update: { userId: req.user!.sub, platform },
      create: { token, platform, userId: req.user!.sub },
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
