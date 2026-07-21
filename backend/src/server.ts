import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import sessionFileStore from 'session-file-store';
import authRoutes from './routes/auth';
import { initializeDatabase } from './models/userModel';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize JSON database
initializeDatabase();

// Enable credentials for CORS
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

// Session Configuration
const FileStore = sessionFileStore(session);
const SESSION_SECRET = process.env.SESSION_SECRET || 'super-secret-fallback-key';

const sessionConfig = {
  name: 'connect.sid',
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new FileStore({
    path: './sessions',
    ttl: 3600 * 2 // 2 hours
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 2, // 2 hours
    httpOnly: true,
    secure: false, // set to true in production if using HTTPS
    sameSite: 'lax' as const,
  }
};

app.use(session(sessionConfig));

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
