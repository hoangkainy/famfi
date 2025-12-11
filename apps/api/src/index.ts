import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { supabase } from './lib/supabase';
import authRoutes from './routes/auth';
import familyRoutes from './routes/family';

const app: Express = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'FamFi API v1.0' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Family routes
app.use('/api/families', familyRoutes);

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
  console.log(`⚡️ Server running at http://localhost:${port}`);
});
