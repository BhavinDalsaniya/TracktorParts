/**
 * Prisma seed file
 * Run with: npm run prisma:seed
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { phone: '9876543210' },
    update: {},
    create: {
      name: 'Admin',
      phone: '9876543210',
      email: 'admin@tractorparts.com',
      password: hashedPassword,
      role: 'ADMIN',
      language: 'ENGLISH',
      isActive: true,
      isVerified: true,
    },
  });
  console.log('✅ Admin user created:', admin.phone);
  console.log('   Phone: 9876543210');
  console.log('   Password: admin123');

  // Create categories
  const categories = [
    {
      name: 'Engine Parts',
      nameGu: 'એન્જિન પાર્ટ્સ',
      slug: 'engine-parts',
      description: 'All engine related parts',
      descriptionGu: 'બધા એન્જિન સંબંધિત પાર્ટ્સ',
      displayOrder: 1,
    },
    {
      name: 'Transmission',
      nameGu: 'ટ્રાન્સમિશન',
      slug: 'transmission',
      description: 'Transmission and clutch parts',
      descriptionGu: 'ટ્રાન્સમિશન અને ક્લચ પાર્ટ્સ',
      displayOrder: 2,
    },
    {
      name: 'Hydraulic',
      nameGu: 'હાઇડ્રોલિક',
      slug: 'hydraulic',
      description: 'Hydraulic lift and parts',
      descriptionGu: 'હાઇડ્રોલિક લિફ્ટ અને પાર્ટ્સ',
      displayOrder: 3,
    },
    {
      name: 'Electrical',
      nameGu: 'વીજળી',
      slug: 'electrical',
      description: 'Electrical components',
      descriptionGu: 'વીજળી ઘટકો',
      displayOrder: 4,
    },
    {
      name: 'Brakes',
      nameGu: 'બ્રેક',
      slug: 'brakes',
      description: 'Brake system parts',
      descriptionGu: 'બ્રેક સિસ્ટમ પાર્ટ્સ',
      displayOrder: 5,
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log('✅ Categories created');

  // Get engine category
  const engineCategory = await prisma.category.findUnique({
    where: { slug: 'engine-parts' },
  });

  // Create sample products
  if (engineCategory) {
    const products = [
      {
        name: 'Piston Kit - Mahindra 575',
        nameGu: 'પિસ્ટન કિટ - મહિન્દ્રા 575',
        slug: 'piston-kit-mahindra-575',
        description: 'High quality piston kit for Mahindra 575 tractor',
        descriptionGu: 'મહિન્દ્રા 575 ટ્રેક્ટર માટે ઉચ્ચ ગુણવત્તાનું પિસ્ટન કિટ',
        shortDescription: 'Complete piston kit with rings, pin and clips',
        shortDescriptionGu: 'રિંગ્સ, પિન અને ક્લિપ્સ સાથે સંપૂર્ણ પિસ્ટન કિટ',
        price: 4500,
        compareAtPrice: 5000,
        sku: 'PK-MH-575-001',
        stock: 25,
        images: ['https://placehold.co/400x400/png'],
        categoryId: engineCategory.id,
        weight: 2000,
        taxIncluded: true,
      },
      {
        name: 'Engine Oil Filter - Universal',
        nameGu: 'એન્જિન ઓઇલ ફિલ્ટર - યુનિવર્સલ',
        slug: 'engine-oil-filter-universal',
        description: 'Universal engine oil filter for all tractors',
        descriptionGu: 'બધા ટ્રેક્ટરો માટે યુનિવર્સલ એન્જિન ઓઇલ ફિલ્ટર',
        shortDescription: 'High quality oil filter for better engine performance',
        shortDescriptionGu: 'વધુ એન્જિન પર્ફોર્મન્સ માટે ઉચ્ચ ગુણવત્તાનું ઓઇલ ફિલ્ટર',
        price: 350,
        sku: 'EOF-UNI-001',
        stock: 100,
        images: ['https://placehold.co/400x400/png'],
        categoryId: engineCategory.id,
        weight: 300,
        taxIncluded: true,
      },
    ];

    for (const product of products) {
      await prisma.product.upsert({
        where: { sku: product.sku },
        update: {},
        create: product,
      });
    }
    console.log('✅ Sample products created');
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
