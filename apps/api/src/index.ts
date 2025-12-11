import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { supabase } from './lib/supabase';
import authRoutes from './routes/auth';
import familyRoutes from './routes/family';
import transactionRoutes from './routes/transaction';
import categoryRoutes from './routes/category';
import reportRoutes from './routes/report';

const app: Express = express();
const port = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL, // Production frontend URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(null, true); // Allow all for now, tighten later
    }
  },
  credentials: true,
}));

app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'FamFi API v1.0', environment: process.env.NODE_ENV });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reports', reportRoutes);

// Supabase connection test
app.get('/api/db-test', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('families').select('count').limit(1);
    if (error) {
      res.status(500).json({ success: false, error: error.message });
      return;
    }
    res.json({ success: true, message: 'Database connected successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database connection failed' });
  }
});

app.listen(port, () => {
  console.log(`⚡️ Server running on port ${port}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});
