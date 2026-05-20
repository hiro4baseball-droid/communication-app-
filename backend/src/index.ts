import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getDb } from './database';
import authRoutes from './routes/auth';
import studentRoutes from './routes/students';
import communicationRoutes from './routes/communications';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:5173']
  : ['http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

getDb();

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/admin', adminRoutes);

app.listen(PORT, () => {
  console.log(`サーバー起動: http://localhost:${PORT}`);
});
