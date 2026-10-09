import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

// Connect to MongoDB then start listening
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(` HOORIYA ARTS POS Backend Server Running on port ${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` Health check: http://localhost:${PORT}/api/health`);
    console.log(`=================================================`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
});
