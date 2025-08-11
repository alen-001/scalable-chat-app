import Redis from "ioredis";
import 'dotenv/config';
console.log(process.env.REDIS_PASSWORD )
const redisPublisher = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
});
const redisSubscriber = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
});

export { redisPublisher,redisSubscriber};