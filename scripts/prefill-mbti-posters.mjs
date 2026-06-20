#!/usr/bin/env node
/**
 * One-time (or --force refresh) prefill of 16 MBTI result posters into Supabase Storage.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=xxx VITE_SUPABASE_URL=https://xxx.supabase.co node scripts/prefill-mbti-posters.mjs
 *   # or with --force to regenerate even if files exist
 *
 * Requires `prefill-mbti-posters` edge function deployed on the project.
 */

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://ulpnxankxkxpqnjahkri.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const force = process.argv.includes("--force");

if (!SERVICE_KEY) {
  console.error(
    "Missing SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Get it from Supabase Dashboard → Project Settings → API → service_role (secret).\n" +
      "Then run:\n" +
      "  SUPABASE_SERVICE_ROLE_KEY='your-key' node scripts/prefill-mbti-posters.mjs",
  );
  process.exit(1);
}

const endpoint = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/prefill-mbti-posters`;

console.log(`Prefilling MBTI posters → ${endpoint}${force ? " (force)" : ""}`);
console.log("This calls Gemini 16 times and may take several minutes…\n");

const res = await fetch(endpoint, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ force }),
});

const text = await res.text();
let json;
try {
  json = JSON.parse(text);
} catch {
  console.error("Non-JSON response:", res.status, text.slice(0, 500));
  process.exit(1);
}

if (!res.ok) {
  console.error("Prefill failed:", res.status, json);
  process.exit(1);
}

console.log(JSON.stringify(json.summary, null, 2));
if (json.results?.some((r) => r.status === "error")) {
  console.error("\nErrors:");
  json.results.filter((r) => r.status === "error").forEach((r) => console.error(`  ${r.type}: ${r.error}`));
  process.exit(1);
}

console.log("\nDone. MBTI result pages should now load posters from CDN cache.");
