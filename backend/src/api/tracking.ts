import { Router } from "express";
import { TrackingService } from "../services";

const router = Router();
const trackingService = new TrackingService();

/**
 * Get tracking health status
 */
router.get("/health", async (req, res) => {
  try {
    const health = await trackingService.getTrackingHealth("tenant_mock");
    res.json({ data: health });
  } catch (error) {
    res.status(500).json({
      error: { message: "Failed to get tracking health" },
    });
  }
});

/**
 * Diagnose tracking issues
 */
router.get("/diagnose", async (req, res) => {
  try {
    const issues = await trackingService.diagnoseIssues("tenant_mock");
    const health = await trackingService.getTrackingHealth("tenant_mock");
    const recommendations = trackingService.getTrackingRecommendations(health);

    res.json({
      data: {
        issues,
        recommendations,
        health,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: { message: "Failed to diagnose tracking" },
    });
  }
});

/**
 * Verify specific events
 */
router.post("/verify-events", async (req, res) => {
  const { events = ["Purchase", "AddToCart", "ViewContent"] } = req.body;

  try {
    const results = await trackingService.verifyEvents("tenant_mock", events);
    res.json({ data: results });
  } catch (error) {
    res.status(500).json({
      error: { message: "Failed to verify events" },
    });
  }
});

/**
 * Get tracking recommendations
 */
router.get("/recommendations", async (req, res) => {
  try {
    const health = await trackingService.getTrackingHealth("tenant_mock");
    const recommendations = trackingService.getTrackingRecommendations(health);

    res.json({ data: recommendations });
  } catch (error) {
    res.status(500).json({
      error: { message: "Failed to get recommendations" },
    });
  }
});

export default router;
