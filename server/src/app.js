import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import masterDataRoutes from './routes/masterDataRoutes.js';
import productRoutes from './routes/productRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import cashRegisterRoutes from './routes/cashRegisterRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import saleReturnRoutes from './routes/saleReturnRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import settingRoutes from './routes/settingRoutes.js';

const app = express();

// Allow only the deployed frontend when CLIENT_URL is set (comma separated list);
// otherwise allow any origin (local development).
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((o) => o.trim().replace(/\/$/, ''))
  : null;
app.use(cors(allowedOrigins ? { origin: allowedOrigins } : undefined));
app.use(express.json());
app.use(morgan('dev'));

// Health check. It also tries the database connection, so opening
// /api/health in a browser shows immediately whether MongoDB is reachable.
app.get('/api/health', async (req, res) => {
  const body = {
    status: 'online',
    appName: 'HOORIYA ARTS POS & Store Management',
    timestamp: new Date().toISOString()
  };
  try {
    await connectDB();
    body.database = 'connected';
  } catch (error) {
    body.database = 'failed';
    body.reason = error.name;
    body.hint =
      error.name === 'MongooseServerSelectionError'
        ? 'Cannot reach MongoDB. Check MONGODB_URI and allow 0.0.0.0/0 in Atlas Network Access.'
        : /auth/i.test(error.message)
        ? 'MongoDB rejected the username or password in MONGODB_URI.'
        : 'Check the MONGODB_URI environment variable.';
  }
  res.status(body.database === 'connected' ? 200 : 503).json(body);
});

// Connect to MongoDB on demand (serverless platforms start cold on each deploy).
// This runs AFTER cors(), so even a database failure is returned with CORS headers
// and the browser shows the real error instead of a misleading CORS message.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('[MongoDB Connection Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Database connection failed. Check MONGODB_URI and Atlas network access.',
      reason: error.name
    });
  }
});

// Serve uploaded product images as static files
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/master', masterDataRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/register', cashRegisterRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/returns', saleReturnRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

export default app;
