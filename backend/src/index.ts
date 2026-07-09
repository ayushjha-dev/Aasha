import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/db';

// Route imports
import authRoutes from './routes/auth';
import incidentRoutes from './routes/incidents';
import shelterRoutes from './routes/shelters';
import volunteerRoutes from './routes/volunteers';
import teamRoutes from './routes/teams';
import donationRoutes from './routes/donations';
import adminRoutes from './routes/admin';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(helmet());
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'aasha-api',
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/shelters', shelterRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/admin', adminRoutes);

// ---------------------------------------------------------------------------
// 404 handler
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { message: err.message }),
  });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Aasha API running on http://localhost:${PORT}`);
    console.log(`   CORS origin: ${FRONTEND_URL}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

start();

export default app;
