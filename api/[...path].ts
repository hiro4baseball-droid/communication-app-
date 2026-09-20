// Vercel serverless entry point: every /api/* request is handled by the
// Express app that also powers `npm run dev --prefix backend` locally.
import app from '../backend/src/app';

export default app;
