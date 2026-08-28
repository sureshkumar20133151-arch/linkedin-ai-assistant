/**
 * Express Server Entry Point - Personal LinkedIn AI Assistant Backend
 * Compatible with local running (node server.js) and Vercel Serverless Deployment.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const commentRoutes = require('./routes/comment');
const assistantRoutes = require('./routes/assistant');
const messageRoutes = require('./routes/message');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for Chrome Extension requests, Vercel apps, and local UI
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
  res.json({
    status: 'online',
    service: 'LinkedIn AI Assistant Backend',
    geminiConfigured: hasKey,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    timestamp: new Date().toISOString()
  });
});

// Root route for Vercel landing check
app.get('/', (req, res) => {
  res.json({
    message: 'Personal LinkedIn AI Assistant Backend API is live on Vercel!',
    healthEndpoint: '/api/health'
  });
});

// API Routes
app.use('/api', commentRoutes);
app.use('/api', assistantRoutes);
app.use('/api', messageRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error occurred.'
  });
});

// Start server locally if run directly via `node server.js`
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Personal LinkedIn AI Assistant Backend Running!`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🔑 Gemini Key Status: ${process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here' ? 'CONFIGURED ✅' : 'MISSING ⚠️ (Update server/.env)'}`);
    console.log(`====================================================`);
  });
}

// Export express app for Vercel serverless function wrapper
module.exports = app;
