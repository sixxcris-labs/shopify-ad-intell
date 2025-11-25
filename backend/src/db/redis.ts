import Redis from "ioredis";
import { config } from "../config/env";

const globalForRedis = globalThis as unknown as {
  redis?: Redis;
};

export const redis =
  globalForRedis.redis ||
  new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
    reconnectOnError: () => true,
  });

redis.on("error", (error) => {
  console.error("[Redis] connection error", error);
});

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

