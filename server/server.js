require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

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


const app = express();


// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));


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

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// Protected test route


// DB connect & server start
const PORT = process.env.PORT || 5000;
const mongouri = process.env.MONGO_URI;

connectDB(mongouri).then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });

  // Handle EADDRINUSE error
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Trying alternative port...`);
      const altPort = PORT + 1;
      const altServer = app.listen(altPort, () => {
        console.log(`Server listening on alternative port ${altPort}`);
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
  