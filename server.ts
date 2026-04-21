import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

// REMOVED dotenv.config() to prevent ghost .env files from persisting secrets
// dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVER_START_TIME = new Date().toISOString();
const SERVER_INSTANCE_ID = Math.random().toString(36).substring(7);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const DISCORD_API_BASE = "https://discord.com/api/v9";
  // Middleware to inject Discord token into headers
  const discordRequest = async (endpoint: string, options: RequestInit = {}) => {
    // FORCE RELOAD ENV (Directly from process.env, no dotenv)
    const currentToken = (process.env.DISCORD_USER_TOKEN || process.env.VITE_DISCORD_USER_TOKEN || "").trim();

    if (!currentToken || currentToken === "") {
      console.error(`[INSTANCE-${SERVER_INSTANCE_ID}] BLOCKED: No token found in OS environment.`);
      return { 
        status: 401, 
        error: { message: "AUTH_REQUIRED" } 
      };
    }

    console.log(`[INSTANCE-${SERVER_INSTANCE_ID}] Requesting ${endpoint} | Token: ${currentToken.slice(0, 4)}...${currentToken.slice(-4)}`);

    const response = await fetch(`${DISCORD_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        "Authorization": currentToken,
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (response.status === 429) {
      let retryAfterValue = 5;
      try {
        const rateLimitData = await response.json();
        retryAfterValue = rateLimitData.retry_after || 5;
      } catch (e) {
        console.warn("Could not parse 429 JSON response from Discord");
      }
      console.warn(`Discord Rate Limit on ${endpoint}: retrying after ${retryAfterValue}s`);
      return { status: 429, retryAfter: retryAfterValue };
    }

    const text = await response.text();

    if (!response.ok) {
      let errorJson;
      try {
        errorJson = JSON.parse(text);
      } catch (e) {
        errorJson = { message: text.slice(0, 500) };
      }
      console.error(`Discord API Error [${response.status}] on ${endpoint}:`, errorJson);
      return { status: response.status, error: errorJson };
    }

    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error(`Failed to parse successful Discord response as JSON: ${text.slice(0, 100)}`);
    }
    return { status: response.status, data };
  };

  // Middleware to disable caching for API routes
  app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
  });

  // API Routes
  app.get("/api/v2/discord/identity", async (req, res) => {
    const currentToken = (process.env.DISCORD_USER_TOKEN || process.env.VITE_DISCORD_USER_TOKEN || "").trim();
    const result = await discordRequest("/users/@me");
    res.status(result.status).json({
      ...(result.data || result.error),
      _server: {
        id: SERVER_INSTANCE_ID,
        start: SERVER_START_TIME,
        envTokenPresent: !!currentToken,
        maskedToken: currentToken ? `${currentToken.slice(0, 4)}...${currentToken.slice(-4)}` : "None"
      }
    });
  });

  app.get("/api/discord/dms", async (req, res) => {
    const result = await discordRequest("/users/@me/channels");
    res.status(result.status).json(result.data || result.error);
  });

  app.get("/api/discord/channels/:channelId/messages", async (req, res) => {
    const { channelId } = req.params;
    const { before, limit } = req.query;
    let url = `/channels/${channelId}/messages?limit=${limit || 100}`;
    if (before) url += `&before=${before}`;

    const result = await discordRequest(url);
    res.status(result.status).json(result.data || result.error);
  });

  // Bulk Delete API (Server-side optimized)
  app.post("/api/discord/channels/:channelId/purge", async (req, res) => {
    const { channelId } = req.params;
    const { messageIds, concurrency = 5 } = req.body;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ error: "No message IDs provided" });
    }

    const results = {
      deleted: 0,
      failed: 0,
      rateLimited: false,
      retryAfter: 0
    };

    // Process chunk in controlled small batches
    // Increase concurrency for Turbo mode
    const CHUNK_SIZE = Math.min(Math.max(concurrency, 1), 20); 

    for (let i = 0; i < messageIds.length; i += CHUNK_SIZE) {
      if (results.rateLimited) break;

      const chunk = messageIds.slice(i, i + CHUNK_SIZE);
      await Promise.all(chunk.map(async (msgId) => {
        const result = await discordRequest(`/channels/${channelId}/messages/${msgId}`, {
          method: "DELETE",
        });

        if (result.status === 204 || result.status === 404) {
          results.deleted++;
        } else if (result.status === 429) {
          results.rateLimited = true;
          results.retryAfter = Math.max(results.retryAfter, result.retryAfter || 0);
        } else {
          results.failed++;
        }
      }));

      // In Turbo mode (concurrency > 8), we reduce wait time to almost zero
      // Standard mode keeps a small buffer
      if (!results.rateLimited && i + CHUNK_SIZE < messageIds.length) {
        const delay = CHUNK_SIZE > 8 ? 50 : 150;
        await new Promise(r => setTimeout(r, delay));
      }
    }

    res.json(results);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
