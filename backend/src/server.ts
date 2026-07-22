import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import { initializeDatabase } from './models/userModel';

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize JSON database
initializeDatabase();

// Enable credentials for CORS dynamically across local origins (localhost / 127.0.0.1 on any port)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

import analyzeRoutes from './routes/analyze';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/analyze', analyzeRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Skin Analysis API is running.' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
