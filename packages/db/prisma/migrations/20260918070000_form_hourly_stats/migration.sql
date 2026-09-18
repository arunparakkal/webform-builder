-- Pre-aggregated submission counts per form per hour.
-- The Flink job upserts on (form_id, hour_bucket); the API only reads.

-- CreateTable
CREATE TABLE "form_hourly_stats" (
    "form_id" UUID NOT NULL,
    "hour_bucket" TIMESTAMP(3) NOT NULL,
    "submission_count" BIGINT NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_hourly_stats_pkey" PRIMARY KEY ("form_id", "hour_bucket")
);

-- The Flink sink writes only the count, so keep the freshness stamp in the database.
CREATE OR REPLACE FUNCTION form_hourly_stats_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER form_hourly_stats_set_updated_at
BEFORE UPDATE ON "form_hourly_stats"
FOR EACH ROW EXECUTE FUNCTION form_hourly_stats_touch_updated_at();
