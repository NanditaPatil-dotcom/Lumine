/**
 * Client-side Gemini usage is intentionally disabled.
 * All AI requests must be routed through the backend (see server/routes/ai.js).
 * This prevents leaking API keys into the browser bundle.
 */
export function getClientGenAI(): never {
  throw new Error("Client-side AI is disabled. Use server endpoints (/api/ai/*).");
}