import "dotenv/config";
import { connectMongoDB } from "./src/server/mongodb";
import { app } from "./app";
import type { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  try {
    // CONNECT TO MONGODB FIRST
    await connectMongoDB();

    console.log("✅ MongoDB connected successfully");

    // VITE / STATIC SERVING
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });

      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");

      app.use(expressStaticSafe(distPath));

      app.get("*", (req: Request, res: Response) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `🚀 NexGuard Express Server listening on http://0.0.0.0:${PORT}`
      );
    });
  } catch (error) {
    console.error("❌ Failed to start NexGuard:", error);
    process.exit(1);
  }
}

function expressStaticSafe(distPath: string) {
  const express = require("express");
  return express.static(distPath);
}

startServer();
