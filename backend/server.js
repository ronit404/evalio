const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const net = require('net'); // For port checking

// Import Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const materialRoutes = require('./routes/materialRoutes');
const teacherRoutes = require('./routes/teacherRoutes');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB (async, won't block)
connectDB().catch(err => {
    console.error('Initial DB connection failed:', err.message);
    console.log('Server will continue and retry DB connection...');
});

// --- Global Error Handlers (PREVENT CRASHES) ---
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION!', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION!', err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully.');
    process.exit(0);
});

const app = express();

// --- Middleware ---
app.use(cors()); 
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api', materialRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.send('Evalio API is running successfully...');
});

// --- Global Error Middleware ---
app.use((err, req, res, next) => {
    console.error('Global error:', err.stack);
    res.status(500).json({ 
        message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// --- Dynamic Port Finder ---
function findFreePort(startPort = 4000, endPort = 6000) {
    return new Promise((resolve, reject) => {
        let tested = 0;
        const tester = net.createServer();
        
        function tryPort(port) {
            tester.once('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    tested++;
                    if (tested < endPort - startPort) {
                        tryPort(port + 1);
                    } else {
                        tester.close();
                        reject(new Error('No free ports found between ' + startPort + '-' + endPort));
                    }
                } else {
                    tester.close();
                    reject(err);
                }
            });
            
            tester.once('listening', () => {
                tester.close();
                resolve(port);
            });
            
            tester.listen(port, '0.0.0.0');
        }
        
        tryPort(startPort);
    });
}

// --- Server Startup ---
const BASE_PORT = process.env.PORT || 5000;

async function startServer() {
    const PORT = await findFreePort(BASE_PORT, BASE_PORT + 100);
    
    const server = app.listen(PORT, '0.0.0.0', (err) => {
        if (err) {
            console.error('FINAL PORT ERROR:', err.message);
            process.exit(1);
        }
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`Check API at http://localhost:${PORT}/`);
        console.log(`Health check: http://localhost:${PORT}/health`);
    });

    server.on('error', (err) => {
        console.error('Server runtime error:', err.code, err.message);
        if (err.code === 'EADDRINUSE') {
            console.log('Kill stuck process: lsof -ti tcp:' + PORT + ' | xargs kill -9');
        }
    });
}

startServer().catch(console.error);

console.log('🔍 Starting server with dynamic port detection...');
