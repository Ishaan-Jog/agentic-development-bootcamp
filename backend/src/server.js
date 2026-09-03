import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { initDatabase } from './db/index.js';
import apiRouter from './routes/api.js';

const app = express();

// Initialize DB schema
initDatabase();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Event Management System (EMS) Backend API 🎪',
    version: '1.0.0',
    documentation: {
      health: '/health',
      publicEvents: '/api/v1/events',
      login: '/api/v1/auth/login',
      register: '/api/v1/auth/register'
    }
  });
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', system: 'Event Management System API', time: new Date().toISOString() });
});


// API Routes
app.use('/api/v1', apiRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    statusCode: err.status || 500,
    error: err.name || 'SERVER_ERROR',
    message: err.message || 'Internal Server Error'
  });
});

app.listen(config.port, () => {
  console.log(`🚀 EMS Backend Server listening on http://localhost:${config.port}`);
});

export default app;
