import { loadEnv } from "./env.js";
import { createRedis } from "./redis.js";
import { buildApp } from "./app.js";
import { startSubmissionWorker } from "./submission-worker.js";

async function main() {
  const env = loadEnv();
  const redis = createRedis(env.REDIS_URL);
  const app = await buildApp(env, redis);
  const worker = startSubmissionWorker(env.REDIS_URL);

  app.addHook("onClose", async () => {
    await worker.close();
  });

  await app.listen({ port: env.PORT, host: env.HOST });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
