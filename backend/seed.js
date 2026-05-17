/**
 * CoffeeBlend - Database Seeder
 * Run: node seed.js
 * Seeds sample products into MongoDB
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const products = [
  { name: 'Coffee Cappuccino', description: 'Rich espresso with creamy steamed milk foam', price: 5.90, category: 'coffee', image: 'images/menu-1.jpg', isFeatured: true, isAvailable: true },
  { name: 'Caramel Latte', description: 'Smooth espresso with caramel syrup and milk', price: 6.50, category: 'coffee', image: 'images/menu-2.jpg', isFeatured: true, isAvailable: true },
  { name: 'Mocha Blend', description: 'Espresso with chocolate and whipped cream', price: 6.90, category: 'coffee', image: 'images/menu-3.jpg', isFeatured: true, isAvailable: true },
  { name: 'Cold Brew', description: 'Slow-steeped cold brew coffee served over ice', price: 5.50, category: 'coffee', image: 'images/menu-4.jpg', isFeatured: true, isAvailable: true },
  { name: 'Mango Smoothie', description: 'Fresh mango blended with yogurt and honey', price: 4.90, category: 'drinks', image: 'images/drink-1.jpg', isAvailable: true },
  { name: 'Strawberry Shake', description: 'Classic strawberry milkshake with whipped cream', price: 5.20, category: 'drinks', image: 'images/drink-2.jpg', isAvailable: true },
  { name: 'Chocolate Cake', description: 'Rich dark chocolate layer cake with ganache', price: 4.50, category: 'desserts', image: 'images/dessert-1.jpg', isAvailable: true },
  { name: 'Cheesecake', description: 'Classic New York style creamy cheesecake', price: 5.00, category: 'desserts', image: 'images/dessert-2.jpg', isAvailable: true },
  { name: 'Beef Burger', description: 'Juicy beef patty with fresh veggies and special sauce', price: 8.90, category: 'burgers', image: 'images/burger-1.jpg', isAvailable: true },
  { name: 'Chicken Burger', description: 'Crispy chicken breast with lettuce and mayo', price: 7.90, category: 'burgers', image: 'images/burger-2.jpg', isAvailable: true },
  { name: 'Grilled Salmon', description: 'Fresh Atlantic salmon with herbs and lemon butter', price: 14.90, category: 'dishes', image: 'images/dish-1.jpg', isAvailable: true },
  { name: 'Pasta Primavera', description: 'Penne with seasonal vegetables in tomato sauce', price: 11.90, category: 'dishes', image: 'images/dish-2.jpg', isAvailable: true },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    const inserted = await Product.insertMany(products);
    console.log(`✅ Inserted ${inserted.length} products`);

    console.log('\n🎉 Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    process.exit(1);
  }
}

seed();
