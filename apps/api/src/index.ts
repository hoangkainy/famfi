import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes placeholder
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'FamFi API v1.0' });
});

app.listen(port, () => {
  console.log(`⚡️ Server running at http://localhost:${port}`);
});
