// Vercel serverless entry point.
// Every request (see vercel.json rewrite) is handled by the Express app.
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (error) {
    console.error('[MongoDB Connection Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Database connection failed.' });
  }
  return app(req, res);
}
