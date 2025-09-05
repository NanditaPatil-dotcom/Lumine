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
 * Adds shorter timeouts, IPv4 preference, and clearer diagnostics to help with Atlas connectivity.
 */
export async function connectToDB(): Promise<mongoose.Mongoose> {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/Lumine";
  const dbName = process.env.MONGODB_DB || "Lumine";

  // Fast-fail on common misconfigurations to surface clear errors
  if (process.env.MONGODB_URI && /[<>]/.test(process.env.MONGODB_URI)) {
    const sanitized = process.env.MONGODB_URI.replace(/:[^@]+@/, ":********@");
    const msg =
      "Invalid MONGODB_URI: contains placeholder characters '<' or '>'. Remove angle brackets and URL-encode your password if it has special characters. Current value (sanitized): " +
      sanitized;
    console.error(msg);
    throw new Error(msg);
  }

  if (!global.mongooseConn) {
    global.mongooseConn = { conn: null, promise: null };
  }

  const cache = global.mongooseConn;

  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    mongoose.set("strictQuery", true);
    mongoose.set("bufferCommands", false);

    // Prefer IPv4 to avoid some ISP/IPv6 SRV resolution issues; keep pool modest for serverless/dev.
    const opts: mongoose.ConnectOptions = {
      dbName,
      serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 8000),
      socketTimeoutMS: Number(process.env.MONGODB_SOCKET_TIMEOUT_MS || 20000),
      maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 10),
      family: 4,
    };

    // Attach connection listeners once (no-op if already attached)
    const conn = mongoose.connection;
    if (conn.listeners("error").length === 0) {
      conn.on("error", (err) => {
        console.error("Mongoose connection error:", err?.message || err);
      });
      conn.on("disconnected", () => {
        console.warn("Mongoose disconnected");
      });
      conn.on("connected", () => {
        console.log("Mongoose connected");
      });
    }

    cache.promise = mongoose
      .connect(uri, opts)
      .then(async (m) => {
        // Optional: ping admin to fail fast if something is off with TLS/auth/network
        try {
          await m.connection.db.admin().command({ ping: 1 });
        } catch (pingErr) {
          console.error("Mongo ping failed:", (pingErr as any)?.message || pingErr);
          throw pingErr;
        }
        return m;
      })
      .catch((err) => {
        // Provide richer diagnostics to surface root cause behind TopologyDescription
        const details = {
          name: err?.name,
          code: err?.code,
          message: err?.message,
          reason: err?.reason,
          cause: err?.cause,
          uriHasSrv: uri.startsWith("mongodb+srv://"),
          dbName,
        };
        console.error("Mongo connection failed:", details);
        throw err;
      });
  }

  try {
    cache.conn = await cache.promise;
  } catch (e) {
    // Reset promise so next request can retry after a transient failure
    cache.promise = null;
    throw e;
  }

  return cache.conn;
}