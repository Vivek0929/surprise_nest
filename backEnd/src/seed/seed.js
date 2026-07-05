require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Theme = require('../models/Theme');
const AddOn = require('../models/AddOn');
const Inventory = require('../models/Inventory');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/surprisenest';

const themes = [
  {
    name: 'Pink Princess',
    description: 'A dreamy pink-themed celebration with princess vibes for birthdays!',
    occasions: ['Birthday'],
    price: 1499,
    color: '#EC4899',
    isFeatured: true,
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'],
    items: ['Banner', 'Balloons (20)', 'Crown', 'Teddy Bear', 'Fairy Lights', 'Sprays', 'Cake Topper', 'Candles', 'Confetti', 'Photo Props'],
  },
  {
    name: 'Black & Gold',
    description: 'Elegant and luxurious black & gold theme for a premium celebration.',
    occasions: ['Birthday', 'Anniversary'],
    price: 1899,
    color: '#F59E0B',
    isFeatured: true,
    images: ['https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400'],
    items: ['Banner', 'Black & Gold Balloons', 'Crown', 'Fairy Lights', 'Confetti', 'Photo Props', 'Ribbon', 'Candles'],
  },
  {
    name: 'Blue Galaxy',
    description: 'Cosmic blue galaxy theme — perfect for the astronomy lover.',
    occasions: ['Birthday', 'Farewell'],
    price: 1299,
    color: '#3B82F6',
    isFeatured: true,
    images: ['https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400'],
    items: ['Galaxy Banner', 'Blue Balloons', 'Star Confetti', 'Fairy Lights', 'Photo Props', 'Candles'],
  },
  {
    name: 'Red Love',
    description: 'A passionate red-themed decoration for romantic proposals and anniversaries.',
    occasions: ['Proposal', 'Anniversary'],
    price: 1699,
    color: '#EF4444',
    isFeatured: false,
    images: ['https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400'],
    items: ['Heart Banner', 'Red Balloons', 'Rose Petals', 'Fairy Lights', 'Candles', 'Ribbon', 'Photo Frame'],
  },
  {
    name: 'Harry Potter',
    description: 'Magical wizarding world theme for the ultimate Potterhead.',
    occasions: ['Birthday'],
    price: 1999,
    color: '#7C3AED',
    isFeatured: true,
    images: ['https://images.unsplash.com/photo-1518791841217-8f162f1912da?w=400'],
    items: ['Hogwarts Banner', 'House Colour Balloons', 'Sorting Hat', 'Wand Props', 'Stars Confetti', 'Photo Props', 'Candles'],
  },
  {
    name: 'Marvel Universe',
    description: 'Assemble! A superhero-themed party for the Marvel fan.',
    occasions: ['Birthday'],
    price: 1799,
    color: '#DC2626',
    isFeatured: false,
    images: ['https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=400'],
    items: ['Marvel Banner', 'Hero Balloons', 'Shield Props', 'Photo Props', 'Confetti', 'Candles', 'Ribbon'],
  },
  {
    name: 'Barbie Dreamland',
    description: 'Pink and fabulous — the ultimate Barbie-themed celebration!',
    occasions: ['Birthday', 'Friendship Day'],
    price: 1599,
    color: '#F472B6',
    isFeatured: false,
    images: ['https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400'],
    items: ['Barbie Banner', 'Pink Balloons', 'Crown', 'Photo Props', 'Confetti', 'Fairy Lights', 'Candles'],
  },
  {
    name: 'BTS Army',
    description: 'Purple-themed decoration for every devoted Army member.',
    occasions: ['Birthday', 'Friendship Day'],
    price: 1599,
    color: '#8B5CF6',
    isFeatured: false,
    images: ['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'],
    items: ['BTS Banner', 'Purple Balloons', 'ARMY Badge', 'Photo Props', 'Confetti', 'Fairy Lights'],
  },
  {
    name: 'Anime Night',
    description: 'Sakura blossoms and anime vibes for the otaku at heart.',
    occasions: ['Birthday', 'Friendship Day'],
    price: 1399,
    color: '#A78BFA',
    isFeatured: false,
    images: ['https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400'],
    items: ['Anime Banner', 'Sakura Balloons', 'Manga Photo Props', 'Confetti', 'Fairy Lights', 'Candles'],
  },
  {
    name: 'Golden Farewell',
    description: 'A heartfelt golden farewell theme to bid goodbye in style.',
    occasions: ['Farewell'],
    price: 1299,
    color: '#D97706',
    isFeatured: false,
    images: ['https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400'],
    items: ['Farewell Banner', 'Gold Balloons', 'Memory Jar Props', 'Confetti', 'Fairy Lights', 'Photo Frame'],
  },
];

const addons = [
  { name: 'Birthday Cake (1 kg)', price: 599, category: 'Food', description: 'Delicious customised birthday cake' },
  { name: 'Fresh Flowers Bouquet', price: 349, category: 'Flowers', description: 'Beautiful mixed flower bouquet' },
  { name: 'Chocolate Box', price: 249, category: 'Gift', description: 'Premium assorted chocolates' },
  { name: 'Photo Frame', price: 199, category: 'Photo', description: 'Wooden photo frame with message' },
  { name: 'Greeting Card', price: 99, category: 'Gift', description: 'Hand-crafted personalised greeting card' },
  { name: 'Polaroid Photos (12 pcs)', price: 299, category: 'Photo', description: '12 printed polaroid photographs' },
  { name: 'Gift Box', price: 149, category: 'Gift', description: 'Decorated gift box with ribbon' },
  { name: 'Perfume (50ml)', price: 449, category: 'Gift', description: 'Premium fragrance' },
  { name: 'Mini Bluetooth Speaker', price: 699, category: 'Entertainment', description: 'Portable mini speaker' },
  { name: 'Soft Toy', price: 299, category: 'Gift', description: 'Cute stuffed toy' },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Theme.deleteMany({}),
      AddOn.deleteMany({}),
      Inventory.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Create admin
    const admin = await User.create({
      name: 'SurpriseNest Admin',
      email: process.env.SEED_ADMIN_EMAIL || 'admin@surprisenest.com',
      password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123',
      role: 'admin',
      phone: '9999999999',
    });
    console.log(`👤 Admin created: ${admin.email}`);

    // Create delivery partner
    const deliveryPartner = await User.create({
      name: 'Raj Kumar',
      email: 'delivery@surprisenest.com',
      password: 'Delivery@123',
      role: 'delivery',
      phone: '8888888888',
    });
    console.log(`🚴 Delivery partner created: ${deliveryPartner.email}`);

    // Create demo customer
    await User.create({
      name: 'John Doe',
      email: 'customer@surprisenest.com',
      password: 'Customer@123',
      role: 'customer',
      phone: '9876543210',
    });
    console.log('👤 Demo customer created: customer@surprisenest.com');

    // Create themes
    const themesWithSlugs = themes.map(t => ({ ...t, slug: t.name.toLowerCase().replace(/ /g, '-') }));
    const createdThemes = await Theme.insertMany(themesWithSlugs);
    console.log(`🎨 ${createdThemes.length} themes created`);

    // Create add-ons
    const createdAddons = await AddOn.insertMany(addons);
    console.log(`🎁 ${createdAddons.length} add-ons created`);

    // Create inventory for themes
    const themeInventory = createdThemes.map((t) => ({
      itemType: 'theme', itemId: t._id, itemModel: 'Theme', itemName: t.name, quantity: 50, lowStockThreshold: 5,
    }));
    const addonInventory = createdAddons.map((a) => ({
      itemType: 'addon', itemId: a._id, itemModel: 'AddOn', itemName: a.name, quantity: 30, lowStockThreshold: 3,
    }));
    await Inventory.insertMany([...themeInventory, ...addonInventory]);
    console.log('📦 Inventory seeded');

    console.log('\n🎉 Database seeded successfully!');
    console.log('─────────────────────────────────');
    console.log('Admin:     admin@surprisenest.com / Admin@123');
    console.log('Delivery:  delivery@surprisenest.com / Delivery@123');
    console.log('Customer:  customer@surprisenest.com / Customer@123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();
