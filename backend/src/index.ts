import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { env } from './config/env';
import { prisma } from './config/database';
import { errorHandler } from './middleware/error';

import authRoutes from './routes/auth.routes';
import productsRoutes from './routes/products.routes';
import categoriesRoutes from './routes/categories.routes';
import newsRoutes from './routes/news.routes';
import masterclassRoutes from './routes/masterclass.routes';
import chatRoutes from './routes/chat.routes';
import documentsRoutes from './routes/documents.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

// -----------------------------------------------------------------------------
// Core middleware
// -----------------------------------------------------------------------------
app.set('trust proxy', 1);
app.use(helmet({
  crossOriginResourcePolicy: false, // allow /uploads from mobile app
}));
app.use(cors({
  origin: env.corsOrigin.includes('*') ? true : env.corsOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
if (env.isDev) app.use(morgan('dev'));

// Global rate limit (public endpoints)
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// -----------------------------------------------------------------------------
// Static uploads
// -----------------------------------------------------------------------------
app.use('/uploads', express.static(path.resolve(env.uploadDir), {
  maxAge: '7d',
}));

// -----------------------------------------------------------------------------
// Simple admin panel (static HTML, talks to /api/v1/admin/*)
// -----------------------------------------------------------------------------
app.use('/admin', express.static(path.resolve(__dirname, '../admin/public')));

// -----------------------------------------------------------------------------
// Health check
// -----------------------------------------------------------------------------
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected', env: env.nodeEnv, ts: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'degraded', db: 'disconnected' });
  }
});

// -----------------------------------------------------------------------------
// API
// -----------------------------------------------------------------------------
const api = express.Router();

api.use('/auth', authLimiter, authRoutes);
api.use('/products', publicLimiter, productsRoutes);
api.use('/categories', publicLimiter, categoriesRoutes);
api.use('/news', publicLimiter, newsRoutes);
api.use('/masterclass', publicLimiter, masterclassRoutes);
api.use('/chat', chatRoutes);
api.use('/documents', documentsRoutes);
api.use('/admin', adminRoutes);

app.use('/api/v1', api);

// 404
app.use((_req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Error handler (last)
app.use(errorHandler);

// -----------------------------------------------------------------------------
// Boot
// -----------------------------------------------------------------------------
const server = app.listen(env.port, () => {
  console.log(`🚀 BDC API listening on http://localhost:${env.port}`);
  console.log(`📚 Admin panel: http://localhost:${env.port}/admin`);
  console.log(`❤️  Health:      http://localhost:${env.port}/health`);
});

// Graceful shutdown
for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, async () => {
    console.log(`[${sig}] shutting down...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  });
}

export default app;
