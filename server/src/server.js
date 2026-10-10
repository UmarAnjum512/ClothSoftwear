import dotenv from 'dotenv';
dotenv.config();

import dns from 'dns';
// Some ISPs/routers refuse the SRV lookups used by mongodb+srv:// links, which
// shows up as "querySrv ECONNREFUSED". Use public DNS for local runs.
// Set PUBLIC_DNS=off in .env to use your system DNS instead.
if (process.env.PUBLIC_DNS !== 'off') {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

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
  process.exit(1);
});
