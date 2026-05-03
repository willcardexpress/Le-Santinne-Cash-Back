import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // explicitly allow embedding in iframe
  app.use((req, res, next) => {
    res.removeHeader("X-Frame-Options");
    res.setHeader("Content-Security-Policy", "frame-ancestors *");
    next();
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Proxy Route for external requests
  app.get("/api/proxy", async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: "Missing url parameter" });
    }
    
    try {
      const response = await fetch(targetUrl);
      const isJson = response.headers.get("content-type")?.includes("application/json");
      
      const data = isJson ? await response.json() : await response.text();
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch from proxy" });
    }
  });

  // Proxy Route for POST (e.g. GraphQL)
  app.post("/api/proxy", async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: "Missing url parameter" });
    }
    
    try {
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": req.headers["content-type"] || "application/json",
          "X-Shopify-Storefront-Access-Token": req.headers["x-shopify-storefront-access-token"] as string || ""
        },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch from proxy" });
    }
  });

  // Mock Bling Webhook / API endpoints
  app.post("/api/bling/webhook", (req, res) => {
    console.log("Received Bling webhook:", req.body);
    // In a real scenario, this would process the sale,
    // match the CPF/CNPJ, and add points or cashback.
    res.json({ success: true, message: "Webhook processed" });
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

  app.listen(PORT, () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
