require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Register all models upfront
require('./models/Counter');
require('./models/Product');
require('./models/Shop');
require('./models/User');
require('./models/Auth');
require('./models/Category');
require('./models/Customer');
require('./models/Service');
require('./models/Sales');
require('./models/SalesItem');
require('./models/RequestItem');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const shopsRoutes = require('./routes/shops');
const staffRoutes = require('./routes/staff');
const categoryRoutes = require('./routes/categories');
const customerRoutes = require('./routes/customers');
const productRoutes = require('./routes/products');
const serviceRoutes = require('./routes/services');
const salesRoutes = require('./routes/sales');
const salesItemsRoutes = require('./routes/salesItems');
const requestItemsRoutes = require('./routes/requestItems');


const app = express();


// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check & diagnostics (public endpoints)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Server is running'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shops', shopsRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/sales-items', salesItemsRoutes);
app.use('/api/request-items', requestItemsRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// Protected test route


// DB connect & server start
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Listen on all network interfaces (not just localhost)
const mongouri = process.env.MONGO_URI;

connectDB(mongouri).then(() => {
  const server = app.listen(PORT, HOST, () => {
    console.log(`✅ Server listening on ${HOST}:${PORT}`);
    console.log(`📡 Access from network: http://10.40.5.238:${PORT}`);
  });

  // Handle EADDRINUSE error
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Trying alternative port...`);
      const altPort = PORT + 1;
      const altServer = app.listen(altPort, HOST, () => {
        console.log(`✅ Server listening on alternative port ${HOST}:${altPort}`);
        console.log(`⚠️ UPDATE CLIENT: Change API URL to http://10.40.5.238:${altPort}/api`);
      });
      altServer.on('error', (altErr) => {
        console.error(`Could not bind to port ${altPort}:`, altErr.message);
        process.exit(1);
      });
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
});
  