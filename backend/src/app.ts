import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import studentRoutes from './routes/students';
import communicationRoutes from './routes/communications';
import adminRoutes from './routes/admin';
import parentReportRoutes from './routes/parentReports';

dotenv.config();

const app = express();

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:5173']
  : ['http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Serverless runtimes may parse the JSON body before Express sees the request.
// body-parser honours this flag and skips re-reading the already consumed stream.
app.use((req, _res, next) => {
  if (req.body !== undefined) (req as any)._body = true;
  next();
});
app.use(express.json());

const api = express.Router();
api.use('/auth', authRoutes);
api.use('/students', studentRoutes);
api.use('/communications', communicationRoutes);
api.use('/admin', adminRoutes);
api.use('/parent-reports', parentReportRoutes);

app.use('/api', api);
// A serverless function may be handed the path with its /api prefix already
// stripped, so the same routes are mounted at the root as well.
app.use('/', api);

export default app;
