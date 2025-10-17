require('dotenv').config();
const vendorService = require('../services/vendorService');
const productService = require('../services/productService');

const sampleVendors = [
  {
    name: 'TechShop229',
    whatsappNumber: '+22997000001',
    city: 'Cotonou',
    category: ['Électronique', 'Téléphones'],
    verified: false
  },
  {
    name: 'Mode Boutique',
    whatsappNumber: '+22997000002',
    city: 'Porto-Novo',
    category: ['Vêtements', 'Accessoires'],
    verified: true
  },
  {
    name: 'Home & Living',
    whatsappNumber: '+22997000003',
    city: 'Abomey-Calavi',
    category: ['Électroménager', 'Décoration'],
    verified: false
  }
];

const sampleProducts = [
  {
    name: 'iPhone 13 128GB',
    category: 'Téléphones',
    price: 350000,
    description: 'Neuf, jamais utilisé',
    condition: 'Neuf',
    availability: 'in_stock'
  },
  {
    name: 'Samsung Galaxy S21',
    category: 'Téléphones',
    price: 280000,
    description: 'Excellent état',
    condition: 'Occasion',
    availability: 'in_stock'
  },
  {
    name: 'Laptop HP Pavilion',
    category: 'Électronique',
    price: 450000,
    description: 'Intel Core i5, 8GB RAM',
    condition: 'Neuf',
    availability: 'sur_commande'
  }
];

async function seedDatabase() {
  console.log('🌱 Seeding database with sample data...\n');

  try {
    // Add vendors
    const vendors = [];
    for (const vendorData of sampleVendors) {
      console.log(`Adding vendor: ${vendorData.name}`);
      const vendor = await vendorService.create(vendorData);
      vendors.push(vendor);
    }

    console.log(`\n✓ Added ${vendors.length} vendors\n`);

    // Add products
    for (let i = 0; i < sampleProducts.length; i++) {
      const product = sampleProducts[i];
      const vendor = vendors[Math.floor(Math.random() * vendors.length)];

      console.log(`Adding product: ${product.name}`);
      await productService.create({
        ...product,
        vendorId: vendor.id
      });
    }

    console.log(`\n✓ Added ${sampleProducts.length} products\n`);
    console.log('✅ Seeding complete!\n');

  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
}

seedDatabase();
