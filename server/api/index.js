// Vercel serverless entry point.
// Every request (see vercel.json rewrite) is handled by the Express app, which
// applies CORS first and connects to MongoDB on demand.
import app from '../src/app.js';

export default app;
