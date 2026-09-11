import { loadEnv } from "./env.js";
import { createRedis } from "./redis.js";
import { buildApp } from "./app.js";

async function main() {
  const env = loadEnv();
  const redis = createRedis(env.REDIS_URL);
  const app = await buildApp(env, redis);

  await app.listen({ port: env.PORT, host: env.HOST });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
