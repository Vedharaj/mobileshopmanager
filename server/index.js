require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');


const authRoutes = require('./routes/auth');


const app = express();


// Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(
rateLimit({
windowMs: 15 * 60 * 1000, // 15 minutes
max: 100,
})
);


// Routes
app.use('/api/auth', authRoutes);


// Protected test route
const auth = require('./middleware/auth');
app.get('/api/protected', auth, (req, res) => {
res.json({ message: 'This is protected data', user: req.user });
});

app.get('/', (req, res) => {
res.send('API is running...');
});


// DB connect & server start
const PORT = process.env.PORT || 5000;
mongoose
.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
.catch((err) => console.error(err));