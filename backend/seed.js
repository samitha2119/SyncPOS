const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const TableOrder = require('./models/TableOrder');
const Customer = require('./models/Customer');
const User = require('./models/User');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/syncpos';

const products = [
  {
    name: 'iPhone 15 Pro',
    barcode: '190198453215',
    price: 349000,
    costPrice: 280000,
    stock: 15,
    minStock: 3,
    brand: 'Apple',
    category: 'Smartphones',
    businessType: 'Retail',
    batches: [
      { batchNumber: 'B01', expiryDate: new Date('2028-12-31'), quantity: 15 }
    ]
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    barcode: '880609876543',
    price: 389000,
    costPrice: 310000,
    stock: 8,
    minStock: 2,
    brand: 'Samsung',
    category: 'Smartphones',
    businessType: 'Retail',
    batches: [
      { batchNumber: 'B02', expiryDate: new Date('2028-12-31'), quantity: 8 }
    ]
  },
  {
    name: 'Logitech MX Master 3S',
    barcode: '097855160892',
    price: 32000,
    costPrice: 22000,
    stock: 25,
    minStock: 5,
    brand: 'Logitech',
    category: 'Accessories',
    businessType: 'Retail'
  },
  {
    name: 'Chicken Burger Combo',
    price: 1850,
    costPrice: 950,
    stock: 999, // infinite / high stock for kitchen food items
    minStock: 10,
    brand: 'Kitchen',
    category: 'Food',
    businessType: 'Hospitality'
  },
  {
    name: 'Cheese Pizza Large',
    price: 2950,
    costPrice: 1400,
    stock: 999,
    minStock: 10,
    brand: 'Kitchen',
    category: 'Food',
    businessType: 'Hospitality'
  },
  {
    name: 'Coca Cola 250ml',
    barcode: '5449000000996',
    price: 250,
    costPrice: 180,
    stock: 100,
    minStock: 15,
    brand: 'Coca Cola',
    category: 'Beverages',
    businessType: 'Hospitality'
  },
  {
    name: 'Screen Replacement - iPhone 13',
    price: 45000,
    costPrice: 20000,
    stock: 5,
    minStock: 1,
    brand: 'Repair Service',
    category: 'Hardware',
    businessType: 'Repair'
  }
];

const tables = [
  { tableNumber: 'Table 1', status: 'Available' },
  { tableNumber: 'Table 2', status: 'Available' },
  { tableNumber: 'Table 3', status: 'Available' },
  { tableNumber: 'Table 4', status: 'Available' },
  { tableNumber: 'VIP Lounge', status: 'Available' }
];

const customers = [
  { name: 'John Doe', phone: '0771234567', email: 'john@gmail.com', nic: '199512345678', loyaltyPoints: 6000 },
  { name: 'Jane Smith', phone: '0719876543', email: 'jane@gmail.com', nic: '199898765432', loyaltyPoints: 200 },
  { name: 'Amara Perera', phone: '0761112223', email: 'amara@yahoo.com', nic: '198033344455', loyaltyPoints: 22000 }
];

const seedData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to seed database...');

    // Clear old data
    await Product.deleteMany({ brand: { $in: ['Apple', 'Samsung', 'Logitech', 'Kitchen', 'Coca Cola', 'Repair Service'] } });
    await TableOrder.deleteMany({});
    await Customer.deleteMany({ phone: { $in: ['0771234567', '0719876543', '0761112223'] } });

    // Seed products
    await Product.insertMany(products);
    console.log('Mock Products seeded.');

    // Seed tables
    await TableOrder.insertMany(tables);
    console.log('Hospitality Tables seeded.');

    // Seed customers
    await Customer.insertMany(customers);
    console.log('Mock Customers seeded.');

    // Seed technician staff
    const techExists = await User.findOne({ email: 'technician@syncpos.com' });
    if (!techExists) {
      const technician = new User({
        name: 'Alex Technician',
        email: 'technician@syncpos.com',
        password: 'techpassword123',
        pin: '2233',
        role: 'Technician',
        isActive: true
      });
      await technician.save();
      console.log('Seeded Technician user (Alex Technician / PIN: 2233)');
    }

    // Seed driver staff
    const driverExists = await User.findOne({ email: 'driver@syncpos.com' });
    if (!driverExists) {
      const driver = new User({
        name: 'Roy Driver',
        email: 'driver@syncpos.com',
        password: 'driverpassword123',
        pin: '4455',
        role: 'Driver',
        isActive: true
      });
      await driver.save();
      console.log('Seeded Driver user (Roy Driver / PIN: 4455)');
    }

    console.log('All mock data seeded successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
