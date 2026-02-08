const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const dns = require('dns');

// Fix for MongoDB querySrv ECONNREFUSED issues
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


// Health Check Endpoint (Critical for "Real World" monitoring)
app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
        status: 'UP',
        timestamp: new Date(),
        database: dbStatus,
        environment: process.env.NODE_ENV || 'development'
    });
});

// Ping endpoint for connectivity testing
app.get('/api/ping', (req, res) => {
    res.json({ message: 'pong', timestamp: new Date() });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/purchases', require('./routes/purchaseRoutes'));
app.use('/api/sales', require('./routes/saleRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/dashboard', require('./routes/reportRoutes')); // Using same controller for dashboard summary
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));

app.get('/', (req, res) => {
    res.send('TechnoZone API is running');
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Database Connection and Server Start
const startServer = async () => {
    try {
        // Attempt to connect to MongoDB with a longer timeout
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000 // 10 seconds
        });
        console.log('✅ MongoDB Connected Successfully');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
        console.log('⚠️ Server starting in LIMITED MODE (No DB)...');
        // We still start the server so the health check endpoint works!
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`👉 Local: http://localhost:${PORT}`);
    });
};

startServer();
