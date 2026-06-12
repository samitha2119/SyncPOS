const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const User = require('./models/User');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

app.set('socketio', io);

// Socket connection listener
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/sales', require('./routes/saleRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/hospitality', require('./routes/hospitalityRoutes'));
app.use('/api/repairs', require('./routes/repairRoutes'));
app.use('/api/deliveries', require('./routes/deliveryRoutes'));
app.use('/api/hp', require('./routes/hpRoutes'));
app.use('/api/tradeins', require('./routes/tradeinRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/shifts', require('./routes/shiftRoutes'));
app.use('/api/settings', require('./routes/settingRoutes'));

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'SyncPOS Backend' });
});

// Seed default admin user
const seedDefaultAdmin = async () => {
  try {
    const adminCount = await User.countDocuments({ role: 'Admin' });
    if (adminCount === 0) {
      const defaultAdmin = new User({
        name: 'SyncPOS Administrator',
        email: 'admin@syncpos.com',
        password: 'adminpassword123',
        pin: '1234',
        role: 'Admin',
        isActive: true
      });
      await defaultAdmin.save();
      console.log('Seeded default admin user: admin@syncpos.com / PIN: 1234');
    }
  } catch (error) {
    console.error('Error seeding default admin:', error);
  }
};

// Connect to MongoDB
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/syncpos';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB database');
    await seedDefaultAdmin();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
  });
