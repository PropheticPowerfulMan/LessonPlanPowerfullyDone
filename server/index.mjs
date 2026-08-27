import "dotenv/config";
import http from "node:http";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";
import { recoveryEmail } from "./emailTemplate.mjs";

const required = [
  "APP_URL", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY",
  "LWS_SMTP_HOST", "LWS_SMTP_USER", "LWS_SMTP_PASSWORD",
  "MAIL_FROM_ADDRESS", "PUBLIC_LOGO_URL"
];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) throw new Error("Missing environment variables: " + missing.join(", "));
if (process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith("sb_publishable_")) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY must be a secret/service_role key, not a publishable key.");
}

const port = Number(process.env.PORT || 3001);
const appUrl = process.env.APP_URL.replace(/\/$/, "");
const allowedOrigins = new Set((process.env.ALLOWED_ORIGINS || appUrl).split(",").map((value) => value.trim()));
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});
const transporter = nodemailer.createTransport({
  host: process.env.LWS_SMTP_HOST,
  port: Number(process.env.LWS_SMTP_PORT || 465),
  secure: String(process.env.LWS_SMTP_SECURE || "true") === "true",
  auth: { user: process.env.LWS_SMTP_USER, pass: process.env.LWS_SMTP_PASSWORD }
});
const attempts = new Map();

const sendJson = (response, status, body, origin) => {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": origin || appUrl,
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(body));
};

const readJson = (request) => new Promise((resolve, reject) => {
  let raw = "";
  request.on("data", (chunk) => {
    raw += chunk;
    if (raw.length > 10000) request.destroy();
  });
  request.on("end", () => {
    try { resolve(JSON.parse(raw || "{}")); } catch { reject(new Error("Invalid JSON")); }
  });
  request.on("error", reject);
});

const allowed = (key) => {
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter((time) => now - time < 15 * 60 * 1000);
  recent.push(now);
  attempts.set(key, recent);
  return recent.length <= 5;
};

const server = http.createServer(async (request, response) => {
  const origin = request.headers.origin || "";
  const corsOrigin = allowedOrigins.has(origin) ? origin : appUrl;
  if (request.method === "OPTIONS") return sendJson(response, 204, {}, corsOrigin);
  if (request.method === "GET" && request.url === "/api/health") {
    return sendJson(response, 200, { status: "ok" }, corsOrigin);
  }
  if (request.method !== "POST" || request.url !== "/api/auth/recovery") {
    return sendJson(response, 404, { error: "Not found" }, corsOrigin);
  }
  if (origin && !allowedOrigins.has(origin)) {
    return sendJson(response, 403, { error: "Origin not allowed" }, appUrl);
  }

  const ip = String(request.headers["x-forwarded-for"] || request.socket.remoteAddress || "").split(",")[0].trim();
  if (!allowed(ip)) return sendJson(response, 429, { error: "Trop de demandes. Réessayez dans 15 minutes." }, corsOrigin);

  try {
    const body = await readJson(request);
    const email = String(body.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return sendJson(response, 400, { error: "Adresse email invalide." }, corsOrigin);
    }

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: appUrl + "/#/login" }
    });
    if (!error && data?.properties?.action_link) {
      const message = recoveryEmail({
        actionLink: data.properties.action_link,
        logoUrl: process.env.PUBLIC_LOGO_URL
      });
      await transporter.sendMail({
        from: '"' + (process.env.MAIL_FROM_NAME || "KCS EduPlanner") + '" <' + process.env.MAIL_FROM_ADDRESS + '>',
        to: email,
        replyTo: process.env.MAIL_REPLY_TO || process.env.MAIL_FROM_ADDRESS,
        ...message
      });
    } else if (error) {
      console.error("Recovery link generation failed:", error.message);
    }
  } catch (error) {
    console.error("Recovery request failed:", error instanceof Error ? error.message : error);
  }

  return sendJson(response, 202, {
    message: "Si ce compte existe, un email de récupération KCS a été envoyé."
  }, corsOrigin);
});

server.listen(port, "127.0.0.1", () => {
  console.log("KCS mail service listening on 127.0.0.1:" + port);
});