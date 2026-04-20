import bcrypt from 'bcryptjs';
import { prisma } from './config/database';
import { env } from './config/env';

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const adminHash = await bcrypt.hash(env.adminPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: env.adminEmail.toLowerCase() },
    update: {},
    create: {
      email: env.adminEmail.toLowerCase(),
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'BDC',
      role: 'ADMIN',
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // Demo student user
  const studentHash = await bcrypt.hash('password123', 10);
  const student = await prisma.user.upsert({
    where: { email: 'chloe@test.com' },
    update: {},
    create: {
      email: 'chloe@test.com',
      passwordHash: studentHash,
      firstName: 'Chloé',
      lastName: 'Demo',
      role: 'STUDENT',
    },
  });
  console.log(`✅ Student: ${student.email} / password123`);

  // Categories
  const categories = [
    { slug: 'extensions-cils', name: 'Extensions de cils',
      imageUrl: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=400', order: 1 },
    { slug: 'lash-brow-lift', name: 'Lash & Brow Lift',
      imageUrl: 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=400', order: 2 },
    { slug: 'liquides', name: 'Les liquides',
      imageUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400', order: 3 },
    { slug: 'accessoires', name: 'Accessoires',
      imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400', order: 4 },
  ];
  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: c, create: c });
  }
  const cilsCat = await prisma.category.findUnique({ where: { slug: 'extensions-cils' } });
  const liquidesCat = await prisma.category.findUnique({ where: { slug: 'liquides' } });

  // Products (Les Nouveautés BDC)
  const products = [
    { slug: 'shampoing-chantilly', name: 'Shampoing Chantilly',
      description: 'Shampoing doux pour cils, parfumé vanille.',
      price: 19.9, imageUrl: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600',
      isNew: true, categoryId: liquidesCat?.id },
    { slug: 'volume-classique-burgundy', name: 'Volume Classique Burgundy',
      description: 'Extensions de cils volume classique, coloris Burgundy.',
      price: 29.9, imageUrl: 'https://images.unsplash.com/photo-1599733589046-8a35ed0c6b8d?w=600',
      isNew: true, categoryId: cilsCat?.id },
    { slug: 'bouteille-pro', name: 'Bouteille Pro',
      description: 'Bouteille pour liquides professionnels.',
      price: 24.0, imageUrl: 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=600',
      isNew: true, categoryId: liquidesCat?.id },
  ];
  for (const p of products) {
    await prisma.product.upsert({ where: { slug: p.slug }, update: p, create: p });
  }
  console.log(`✅ ${products.length} products seeded`);

  // News
  const newsCount = await prisma.newsItem.count();
  if (newsCount === 0) {
    await prisma.newsItem.create({
      data: {
        title: 'LA DEMI-POSE DE CILS',
        subtitle: 'LA RÉVOLUTION BEAUTÉ 2025 ALLIANT LASH LIFT ET EXTENSIONS',
        body: "Découvrez la technique révolutionnaire qui combine lash lift et extensions pour un résultat naturel et longue durée.",
        imageUrl: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=800',
        publishedAt: new Date(),
      },
    });
    console.log(`✅ News seeded`);
  }

  // Masterclass
  const mcCount = await prisma.masterclass.count();
  if (mcCount === 0) {
    const now = new Date();
    const in7d = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
    const in14d = new Date(now.getTime() + 14 * 24 * 3600 * 1000);
    await prisma.masterclass.createMany({
      data: [
        { title: 'Masterclass Volume Russe', date: in7d, capacity: 6, spotsAvailable: 4,
          location: 'Toulouse' },
        { title: 'Masterclass Lash Lift', date: in14d, capacity: 8, spotsAvailable: 3,
          location: 'Toulouse' },
      ],
    });
    console.log(`✅ Masterclass seeded`);
  }

  console.log('🎉 Seed complete!');
  console.log(`
  ADMIN LOGIN:   ${env.adminEmail} / ${env.adminPassword}
  STUDENT LOGIN: chloe@test.com / password123
  `);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
