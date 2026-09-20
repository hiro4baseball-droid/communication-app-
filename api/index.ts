import type { IncomingMessage, ServerResponse } from 'http';
import app from '../backend/src/app';

// Vercel's catch-all filesystem routing only matched a single path segment
// here, so /api/auth/login never reached the function. vercel.json instead
// rewrites every /api/* request to this file, carrying the original sub-path
// in __path. Rebuild the URL Express expects before handing the request over.
export default function handler(req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url || '/', 'http://localhost');
  const path = url.searchParams.get('__path');
  if (path !== null) {
    url.searchParams.delete('__path');
    const query = url.searchParams.toString();
    req.url = `/api/${path}${query ? `?${query}` : ''}`;
  }
  (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}
