package com.webform.flink;

import java.sql.Timestamp;
import java.time.Duration;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.restartstrategy.RestartStrategies;
import org.apache.flink.api.common.time.Time;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.configuration.RestOptions;
import org.apache.flink.connector.jdbc.JdbcConnectionOptions;
import org.apache.flink.connector.jdbc.JdbcExecutionOptions;
import org.apache.flink.connector.jdbc.JdbcSink;
import org.apache.flink.runtime.state.hashmap.HashMapStateBackend;
import org.apache.flink.streaming.api.CheckpointingMode;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.CheckpointConfig;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.assigners.TumblingEventTimeWindows;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class SubmissionAnalyticsJob {
  private static final Logger LOG = LoggerFactory.getLogger(SubmissionAnalyticsJob.class);

  public static void main(String[] args) throws Exception {
    JobConfig config = JobConfig.fromEnv();
    Configuration conf = new Configuration();
    conf.setString(RestOptions.BIND_PORT, "8081");
    String restorePath = null;
    String restoreFlag = System.getenv("FLINK_RESTORE");
    boolean skipRestore =
        restoreFlag != null
            && (restoreFlag.equals("0")
                || restoreFlag.equalsIgnoreCase("false")
                || restoreFlag.equalsIgnoreCase("skip"));
    if (!skipRestore) {
      restorePath = LatestCheckpoint.find(config.checkpointDir);
    }
    if (restorePath != null) {
      conf.setString("execution.savepoint.path", restorePath);
      conf.setBoolean("execution.savepoint.ignore-unclaimed-state", true);
      System.out.println("Restoring from checkpoint " + restorePath);
    } else {
      System.out.println("Starting Flink with empty state (no checkpoint found)");
    }
    StreamExecutionEnvironment env = StreamExecutionEnvironment.createLocalEnvironmentWithWebUI(conf);

    env.setParallelism(1);
    env.setStateBackend(new HashMapStateBackend());
    env.getCheckpointConfig().setCheckpointStorage(config.checkpointDir);
    env.enableCheckpointing(10_000, CheckpointingMode.EXACTLY_ONCE);
    env.getCheckpointConfig().setMinPauseBetweenCheckpoints(5_000);
    env.getCheckpointConfig().setCheckpointTimeout(60_000);
    env.getCheckpointConfig().setTolerableCheckpointFailureNumber(3);
    env.getCheckpointConfig()
        .enableExternalizedCheckpoints(
            CheckpointConfig.ExternalizedCheckpointCleanup.RETAIN_ON_CANCELLATION);
    env.setRestartStrategy(RestartStrategies.fixedDelayRestart(5, Time.seconds(10)));

    LOG.info("starting submission analytics job checkpointDir={}", config.checkpointDir);

    DataStream<String> raw =
        env.addSource(new RedisStreamSource(config.redisUrl))
            .name("redis-submission-events")
            .uid("redis-submission-events")
            .setParallelism(1);

    DataStream<SubmissionEvent> events =
        raw.map(new DeserializeSubmission())
            .name("deserialize")
            .uid("deserialize")
            .filter(event -> event != null)
            .name("drop-invalid")
            .uid("drop-invalid");

    DataStream<SubmissionEvent> unique =
        events
            .keyBy(event -> event.idempotencyKey == null ? event.submissionId : event.idempotencyKey)
            .process(new DedupByIdempotencyKey())
            .name("dedup-idempotency-key")
            .uid("dedup-idempotency-key");

    DataStream<SubmissionEvent> timed =
        unique
            .assignTimestampsAndWatermarks(
                WatermarkStrategy.<SubmissionEvent>forBoundedOutOfOrderness(Duration.ofSeconds(30))
                    .withTimestampAssigner((event, ts) -> event.submittedAtMillis)
                    .withIdleness(Duration.ofMinutes(1)))
            .uid("event-timestamps");

    DataStream<HourlyAggregate> hourly =
        timed
            .keyBy(event -> event.formId)
            .window(TumblingEventTimeWindows.of(org.apache.flink.streaming.api.windowing.time.Time.hours(1)))
            .trigger(new EmitOnElementTrigger())
            .allowedLateness(org.apache.flink.streaming.api.windowing.time.Time.minutes(5))
            .aggregate(new CountAggregate(), new EmitHourlyAggregate())
            .name("hourly-count-by-form")
            .uid("hourly-count-by-form");

    hourly
        .addSink(
            JdbcSink.sink(
                """
                INSERT INTO form_hourly_stats
                  (form_id, window_start, window_end, submission_count, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT (form_id, window_start)
                DO UPDATE SET
                  submission_count = EXCLUDED.submission_count,
                  updated_at = CURRENT_TIMESTAMP
                """,
                (statement, value) -> {
                  java.util.Calendar utc =
                      java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("UTC"));
                  statement.setObject(1, java.util.UUID.fromString(value.formId));
                  statement.setTimestamp(2, Timestamp.from(value.windowStart), utc);
                  statement.setTimestamp(3, Timestamp.from(value.windowEnd), utc);
                  statement.setLong(4, value.submissionCount);
                },
                JdbcExecutionOptions.builder()
                    .withBatchSize(1)
                    .withBatchIntervalMs(1000)
                    .withMaxRetries(5)
                    .build(),
                new JdbcConnectionOptions.JdbcConnectionOptionsBuilder()
                    .withUrl(config.jdbcUrl)
                    .withDriverName("org.postgresql.Driver")
                    .withUsername(config.jdbcUser)
                    .withPassword(config.jdbcPassword)
                    .build()))
        .uid("postgres-hourly-upsert")
        .name("postgres-hourly-upsert");

    System.out.println("Flink hourly analytics starting. UI http://localhost:8081");
    env.execute("webform-hourly-submission-analytics");
  }
}
