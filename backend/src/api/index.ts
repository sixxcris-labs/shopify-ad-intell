import { Router } from "express";
import health from "./health";
import authShopify from "./authShopify";
import authMeta from "./authMeta";
import overview from "./overview";
import campaigns from "./campaigns";
import rules from "./rules";
import creatives from "./creatives";
import alerts from "./alerts";
import reports from "./reports";
import settings from "./settings";
import tracking from "./tracking";

const api = Router();

// Health check
api.use("/health", health);

// Auth
api.use("/auth/shopify", authShopify);
api.use("/auth/meta", authMeta);

// Core API
api.use("/overview", overview);
api.use("/campaigns", campaigns);
api.use("/rules", rules);
api.use("/creatives", creatives);
api.use("/alerts", alerts);
api.use("/reports", reports);
api.use("/settings", settings);
api.use("/tracking", tracking);

export default api;
