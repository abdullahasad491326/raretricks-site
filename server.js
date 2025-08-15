/**
 * Minimal secure proxy server for the "impossible-world" API.
 * Keeps all external calls on server side so secrets are not exposed.
 */
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

dotenv.config();

const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Simple rate limiter — adjust to taste
const limiter = rateLimit({
  windowMs: 30 * 1000, // 30s window
  max: 6, // limit each IP to 6 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Helper to call external API safely
async function callExternal(url) {
  try {
    const resp = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        // If remote API needs API_KEY, include from process.env here:
        // "Authorization": `Bearer ${process.env.API_KEY}`
      },
      timeout: 10000
    });
    const text = await resp.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      // return raw text inside a JSON envelope so client can see something
      return { status: false, message: "Response not JSON", raw: text };
    }
  } catch (err) {
    return { status: false, message: `Request failed: ${err.message}` };
  }
}

/**
 * POST /api/login
 * body: { num: "03001234567" }
 * This proxies the login endpoint and returns the remote response.
 */
app.post("/api/login", async (req, res) => {
  const { num } = req.body || {};
  if (!num || typeof num !== "string") {
    return res.status(400).json({ ok: false, message: "Missing number" });
  }

  const url = `https://data-api.impossible-world.xyz/api/login?num=${encodeURIComponent(num)}`;
  const data = await callExternal(url);
  // sanitize any sensitive fields (none expected)
  return res.json({ ok: true, data });
});

/**
 * POST /api/verify
 * body: { num: "0300...", otp: "1234" }
 */
app.post("/api/verify", async (req, res) => {
  const { num, otp } = req.body || {};
  if (!num || !otp) {
    return res.status(400).json({ ok: false, message: "Missing num or otp" });
  }

  const url = `https://data-api.impossible-world.xyz/api/login?num=${encodeURIComponent(num)}&otp=${encodeURIComponent(otp)}`;
  const data = await callExternal(url);
  return res.json({ ok: true, data });
});

/**
 * POST /api/activate
 * body: { number: "03...", type: "5gb" | "100gb", repeats: 1 }
 *
 * This endpoint can run multiple rounds (repeats) and will return an array of results.
 * Server-side only — front-end gets aggregated results.
 */
app.post("/api/activate", async (req, res) => {
  const { number, type = "100gb", repeats = 3 } = req.body || {};
  if (!number) return res.status(400).json({ ok: false, message: "Missing number" });

  const results = [];
  const endpointPath = type === "5gb" ? "active?number=" : "activate?number=";

  for (let i = 0; i < Math.max(1, Math.min(parseInt(repeats, 10) || 1, 10)); i++) {
    const url = `https://data-api.impossible-world.xyz/api/${endpointPath}${encodeURIComponent(number)}`;
    const data = await callExternal(url);
    results.push({ attempt: i + 1, data });

    // tiny delay so we don't flood the external API
    await new Promise((r) => setTimeout(r, 600));
  }

  return res.json({ ok: true, number, type, results });
});

// Small admin endpoint example (protected by ADMIN_PASS in .env)
app.post("/api/admin/unblock", express.json(), (req, res) => {
  const { pass, number } = req.body || {};
  if (process.env.ADMIN_PASS && pass !== process.env.ADMIN_PASS) {
    return res.status(403).json({ ok: false, message: "Forbidden" });
  }
  // in this minimal example we don't maintain server blocked list persistence
  // implement DB or memory store if you'd like
  return res.json({ ok: true, message: `Would remove ${number} from blocked list (not implemented).` });
});

// Fallback to index.html for SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
