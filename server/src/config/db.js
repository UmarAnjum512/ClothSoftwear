import mongoose from 'mongoose';

// The connection is cached on globalThis so that serverless platforms (Vercel)
// re-use it between requests instead of opening a new one every time.
const cache = globalThis.__mongooseCache || (globalThis.__mongooseCache = { promise: null });

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cloth_pos_db', {
        serverSelectionTimeoutMS: 10000
      })
      .then((conn) => {
        console.log(`[MongoDB Connected]: ${conn.connection.host} / ${conn.connection.name}`);
        return conn.connection;
      })
      .catch((error) => {
        cache.promise = null; // allow a retry on the next request
        throw error;
      });
  }
  return cache.promise;
};
