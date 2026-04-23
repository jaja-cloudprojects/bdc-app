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
  const CLD = 'https://res.cloudinary.com/dlojepkis/image/upload';
  const categories = [
    { slug: 'extensions-cils', name: 'Extensions de cils',
      imageUrl: `${CLD}/w_400,h_400,c_fill,f_auto,q_auto/v1776765690/cat-cils_lv2vrl.jpg`, order: 1 },
    { slug: 'lash-brow-lift', name: 'Lash & Brow Lift',
      imageUrl: `${CLD}/w_400,h_400,c_fill,f_auto,q_auto/v1776765690/cat-lash-lift_juvv0l.jpg`, order: 2 },
    { slug: 'liquides', name: 'Les liquides',
      imageUrl: `${CLD}/w_400,h_400,c_fill,f_auto,q_auto/v1776765691/cat-liquides_k76l4u.jpg`, order: 3 },
    { slug: 'accessoires', name: 'Accessoires',
      imageUrl: `${CLD}/w_400,h_400,c_fill,f_auto,q_auto/v1776765691/cat-accessoires_c3q86v.jpg`, order: 4 },
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
      price: 19.9,
      imageUrl: `${CLD}/w_600,f_auto,q_auto/v1776765691/product-shampoing_cf14uo.jpg`,
      isNew: true, categoryId: liquidesCat?.id },
    { slug: 'volume-classique-burgundy', name: 'Volume Classique Burgundy',
      description: 'Extensions de cils volume classique, coloris Burgundy.',
      price: 29.9,
      imageUrl: `${CLD}/w_600,f_auto,q_auto/v1776766130/product-volume_pd7i8o.png`,
      isNew: true, categoryId: cilsCat?.id },
    { slug: 'bouteille-pro', name: 'Bouteille Pro',
      description: 'Bouteille pour liquides professionnels.',
      price: 24.0,
      imageUrl: `${CLD}/w_600,f_auto,q_auto/v1776765690/product-bouteille_zjtlrz.jpg`,
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
        imageUrl: `${CLD}/w_800,f_auto,q_auto/v1776765691/news-demi-pose_ob0poe.jpg`,
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
