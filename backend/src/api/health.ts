import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "0.1.0",
  });
});

router.get("/ready", (_req, res) => {
  // TODO: Check database and external service connectivity
  res.json({
    status: "ready",
    checks: {
      database: true,
      redis: true,
      meta: true,
    },
  });
});

export default router;
