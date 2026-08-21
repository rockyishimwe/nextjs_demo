import mongoose from "mongoose";

/**
 * Cloudflare Workers-friendly MongoDB connection.
 *
 * Uses globalThis caching so the connection survives across warm invocations
 * within the same isolate. Each Worker invocation gets a fresh isolate on cold
 * start, but warm requests reuse the cached connection — saving subrequests
 * and keeping us within the Free plan's 50-subrequest limit.
 */

// Use globalThis (standard for Workers) to cache the connection across warm requests
const cached = globalThis as typeof globalThis & {
  mongoose?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

if (!cached.mongoose) {
  cached.mongoose = {
    conn: null,
    promise: null,
  };
}

/**
 * Establishes a connection to MongoDB using Mongoose.
 * Returns the cached connection on warm requests to avoid
 * repeated connection setup (which eats into subrequest limits).
 */
async function connectDB(): Promise<typeof mongoose> {
  // Return existing connection if available (warm request)
  if (cached.mongoose!.conn) {
    return cached.mongoose!.conn;
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  // Create a new connection only if one isn't in progress
  if (!cached.mongoose!.promise) {
    cached.mongoose!.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,        // Don't buffer — fail fast
      maxPoolSize: 1,               // Single connection per Worker isolate
      minPoolSize: 0,               // Don't keep idle connections
      serverSelectionTimeoutMS: 5000, // Fail fast if MongoDB is unreachable
      heartbeatFrequencyMS: 0,      // No heartbeats — saves subrequests
    });
  }

  try {
    cached.mongoose!.conn = await cached.mongoose!.promise;
  } catch (error) {
    // Reset so the next request can retry
    cached.mongoose!.promise = null;
    cached.mongoose!.conn = null;
    throw error;
  }

  return cached.mongoose!.conn;
}

export default connectDB;
