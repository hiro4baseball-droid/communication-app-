import app from './app';
import { getDb } from './database';

const PORT = process.env.PORT || 3001;

// Warm the connection and run migrations on boot for long-running servers.
getDb();

app.listen(PORT, () => {
  console.log(`サーバー起動: http://localhost:${PORT}`);
});
