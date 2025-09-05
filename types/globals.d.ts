// Minimal shims to satisfy TypeScript when @types packages are unavailable.

declare module "jsonwebtoken";
declare module "web-push";

// Global mongoose cache typing (used by lib/db.ts)
declare global {
  // eslint-disable-next-line no-var
  var mongooseConn:
    | {
        conn: import("mongoose").Mongoose | null;
        promise: Promise<import("mongoose").Mongoose> | null;
      }
    | undefined;
}

export {};