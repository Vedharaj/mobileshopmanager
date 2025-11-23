require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');


const app = express();


// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// Protected test route


// DB connect & server start
const PORT = process.env.PORT || 5000;
const mongouri = process.env.MONGO_URI;

connectDB(mongouri).then(() => {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
});
  