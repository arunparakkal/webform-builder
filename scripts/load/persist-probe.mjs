/**
 * Times Prisma upserts sequentially vs in parallel against the real DB.
 * Used to distinguish worker concurrency=1 from Postgres round-trip cost.
 */
import { connectPrisma, loadRootEnvFile, newRunId } from "./lib.mjs";

loadRootEnvFile();
const n = Number(process.argv[2] ?? "8");
const prisma = await connectPrisma();
const runId = newRunId("probe");

try {
  const version = await prisma.formVersion.findFirst({
    orderBy: { publishedAt: "desc" },
    select: { id: true, formId: true },
  });
  if (!version) {
    console.error("No form_versions row. Run npm run load:setup first.");
    process.exit(1);
  }

  async function upsertOne(i, suffix) {
    const started = performance.now();
    await prisma.formSubmission.upsert({
      where: { idempotencyKey: `${runId}-${suffix}-${i}` },
      create: {
        formId: version.formId,
        formVersionId: version.id,
        payload: { email: `${runId}-${i}@probe.example` },
        idempotencyKey: `${runId}-${suffix}-${i}`,
      },
      update: {},
    });
    return performance.now() - started;
  }

  const seqTimes = [];
  const seqStart = performance.now();
  for (let i = 0; i < n; i++) seqTimes.push(await upsertOne(i, "seq"));
  const seqMs = performance.now() - seqStart;

  const parStart = performance.now();
  const parTimes = await Promise.all(Array.from({ length: n }, (_, i) => upsertOne(i, "par")));
  const parMs = performance.now() - parStart;

  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  console.log(`runId=${runId} n=${n}`);
  console.log(
    `sequential: wall ${seqMs.toFixed(0)} ms  avg_upsert ${avg(seqTimes).toFixed(0)} ms  ${((n / seqMs) * 1000).toFixed(1)} rows/s`,
  );
  console.log(
    `parallel:   wall ${parMs.toFixed(0)} ms  avg_upsert ${avg(parTimes).toFixed(0)} ms  ${((n / parMs) * 1000).toFixed(1)} rows/s`,
  );
} finally {
  await prisma.formSubmission.deleteMany({
    where: { idempotencyKey: { startsWith: `${runId}-` } },
  });
  await prisma.$disconnect();
}
