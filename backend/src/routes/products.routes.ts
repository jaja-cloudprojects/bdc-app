import { Router } from 'express';
import { prisma } from '../config/database';

const router = Router();

function format(p: any) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category?.slug ?? null,
    price: p.price,
    currency: p.currency,
    imageUrl: p.imageUrl,
    gallery: p.gallery,
    description: p.description,
    isNew: p.isNew,
    inStock: p.inStock,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const products = await prisma.product.findMany({
      where: category
        ? { category: { slug: category } }
        : undefined,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(products.map(format));
  } catch (e) {
    next(e);
  }
});

router.get('/newest', async (_req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { isNew: true },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    res.json(products.map(format));
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true },
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(format(product));
  } catch (e) {
    next(e);
  }
});

export default router;
