-- Flink emits explicit tumbling-window bounds, so hour_bucket becomes window_start
-- and the matching window_end is stored next to it.

-- AlterTable
ALTER TABLE "form_hourly_stats" RENAME COLUMN "hour_bucket" TO "window_start";

-- AlterTable
ALTER TABLE "form_hourly_stats" ADD COLUMN "window_end" TIMESTAMP(3);

-- The table is still empty, but keep the backfill explicit so the migration is replayable.
UPDATE "form_hourly_stats"
SET "window_end" = "window_start" + INTERVAL '1 hour'
WHERE "window_end" IS NULL;

ALTER TABLE "form_hourly_stats" ALTER COLUMN "window_end" SET NOT NULL;

-- One-hour tumbling windows are the contract, so reject any other width at write time.
ALTER TABLE "form_hourly_stats" ADD CONSTRAINT "form_hourly_stats_window_one_hour" CHECK ("window_end" = "window_start" + INTERVAL '1 hour');

-- AddForeignKey
ALTER TABLE "form_hourly_stats" ADD CONSTRAINT "form_hourly_stats_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
