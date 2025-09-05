import { NextResponse } from "next/server";
import { resolveSrv, resolve4 } from "node:dns/promises";

export const runtime = "nodejs";

function parseSrvHost(uri: string): string | null {
  // Example: mongodb+srv://user:pass@cluster0.abc12.mongodb.net/?retryWrites=true
  const m = uri.match(/^mongodb\+srv:\/\/(?:[^@]+@)?([^\/?]+)(?:[\/?]|$)/i);
  return m?.[1] || null;
}

/**
 * GET /api/diagnostics/mongo
 * - Verifies presence of env vars
 * - If URI is SRV (+srv), attempts DNS SRV resolution for the cluster
 * - Resolves IPv4 addresses for targets to detect DNS/IPv4 issues
 * - Does NOT open a DB connection (safe to run even when DB is blocked)
 */
export async function GET() {
  const uri = process.env.MONGODB_URI || "";
  const dbName = process.env.MONGODB_DB || "Lumine";
  const isSrv = uri.startsWith("mongodb+srv://");
  const host = isSrv ? parseSrvHost(uri) : null;

  const result: any = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.versions.node,
    runtime: "nodejs",
    env: {
      hasMongoUri: Boolean(uri),
      uriHasSrv: isSrv,
      dbName,
      uriAppNameParam: uri.includes("appName="),
      uriSanitized: uri ? uri.replace(/:[^@]+@/, ":********@") : null,
    },
    srv: {
      host,
      records: [] as any[],
      error: null as any,
    },
    targets: [] as { target: string; port: number; ipv4?: string[]; error?: string }[],
    advice: [] as string[],
  };

  if (!uri) {
    result.advice.push("Set MONGODB_URI in .env.local");
    return NextResponse.json(result, { status: 200 });
  }

  if (/[<>]/.test(uri)) {
    result.advice.push("Remove angle brackets from credentials and URL-encode your password.");
    return NextResponse.json(result, { status: 200 });
  }

  if (isSrv && !host) {
    result.srv.error = "Could not parse SRV host from mongodb+srv URI";
    result.advice.push("Ensure your URI matches the Atlas format and contains a valid cluster host.");
    return NextResponse.json(result, { status: 200 });
  }

  if (isSrv && host) {
    try {
      const records = await resolveSrv(`_mongodb._tcp.${host}`);
      result.srv.records = records.map((r) => ({
        name: r.name,
        port: r.port,
        target: r.name || r.name,
        priority: (r as any).priority,
        weight: (r as any).weight,
      }));

      // Resolve IPv4 of each target to catch IPv6-only or DNS issues
      const addrResults = await Promise.allSettled(
        records.map(async (r) => {
          const target = r.name ?? (r as any).name ?? r.name;
          try {
            const ipv4 = await resolve4(target);
            return { target, port: r.port, ipv4 };
          } catch (e: any) {
            return { target, port: r.port, error: e?.message || String(e) };
          }
        })
      );

      result.targets = addrResults.map((ar) => (ar.status === "fulfilled" ? ar.value : (ar as any).reason));

      // If all targets failed to resolve IPv4, advise IPv4 preference or network/DNS fix
      const anyIPv4 = result.targets.some((t: any) => Array.isArray(t.ipv4) && t.ipv4.length > 0);
      if (!anyIPv4) {
        result.advice.push(
          "No IPv4 addresses resolved for Atlas SRV targets. Check your DNS/IPv4 connectivity. We already prefer IPv4 in mongoose (family=4)."
        );
      }
    } catch (e: any) {
      result.srv.error = e?.message || String(e);
      result.advice.push(
        "SRV lookup failed. This typically indicates DNS issues on this machine/network. Try a non-SRV connection string from Atlas (Driver: Node, 'mongodb://' without +srv) or test on a different network."
      );
    }
  }

  // General advice for Atlas connectivity errors
  result.advice.push(
    "Ensure Atlas Network Access allows your IP (or 0.0.0.0/0 for development).",
    "If your network blocks outbound 27017/tcp, use a different network or a VPN.",
    "If issues persist, switch to a non-SRV URI from Atlas (seed list with tls=true & replicaSet) and set it as MONGODB_URI."
  );

  return NextResponse.json(result, { status: 200 });
}