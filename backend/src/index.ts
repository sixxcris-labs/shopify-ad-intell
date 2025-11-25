import express from "express";
import cors from "cors";
import api from "./api";
import { config } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use("/api", api);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║   Shopify Ad Intelligence API                              ║
║   Running on http://localhost:${config.port}                        ║
║   Environment: ${config.nodeEnv.padEnd(40)}║
╚════════════════════════════════════════════════════════════╝
  `);
});
