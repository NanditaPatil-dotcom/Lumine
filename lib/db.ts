import mongoose from "mongoose";

interface MongooseCache {
  conn: mongoose.Mongoose | null;
  promise: Promise<mongoose.Mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseConn: MongooseCache | undefined;
}

/**
 * Reusable, cached Mongo connection for Next.js route handlers and server components.
 * Prevents creating multiple connections during hot reloads and lambda invocations.
 */
export async function connectToDB(): Promise<mongoose.Mongoose> {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/Lumine";

  if (!global.mongooseConn) {
    global.mongooseConn = { conn: null, promise: null };
  }

  const cache = global.mongooseConn;

  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    mongoose.set("strictQuery", true);
    cache.promise = mongoose.connect(uri);
  }

  cache.conn = await cache.promise;
  return cache.conn;
}