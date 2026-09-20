package com.webform.flink;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.flink.api.common.state.ListState;
import org.apache.flink.api.common.state.ListStateDescriptor;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.runtime.state.FunctionInitializationContext;
import org.apache.flink.runtime.state.FunctionSnapshotContext;
import org.apache.flink.streaming.api.checkpoint.CheckpointedFunction;
import org.apache.flink.streaming.api.functions.source.RichSourceFunction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.StreamEntryID;
import redis.clients.jedis.params.XReadParams;
import redis.clients.jedis.resps.StreamEntry;

/**
 * Checkpointed Redis Stream source (Phase 2). Last processed ID is restored after a crash so
 * unread entries are replayed. XREAD is exclusive of the stored ID.
 */
public class RedisStreamSource extends RichSourceFunction<String> implements CheckpointedFunction {
  private static final Logger LOG = LoggerFactory.getLogger(RedisStreamSource.class);
  public static final String STREAM = "submission-events";

  private final String redisUrl;
  private volatile boolean running = true;
  private transient Jedis jedis;
  private String lastId = "0-0";
  private transient ListState<String> lastIdState;

  public RedisStreamSource(String redisUrl) {
    this.redisUrl = redisUrl;
  }

  @Override
  public void open(Configuration parameters) {
    jedis = connect();
    LOG.info("redis stream source connected lastId={}", lastId);
  }

  @Override
  public void close() {
    if (jedis != null) {
      jedis.close();
    }
  }

  @Override
  public void run(SourceContext<String> ctx) throws Exception {
    XReadParams params = XReadParams.xReadParams().count(100).block(2000);
    while (running) {
      Map<String, StreamEntryID> streams = new HashMap<>();
      streams.put(STREAM, new StreamEntryID(lastId));
      List<java.util.Map.Entry<String, List<StreamEntry>>> result;
      try {
        result = jedis.xread(params, streams);
      } catch (Exception e) {
        LOG.warn("redis XREAD failed, retrying: {}", e.toString());
        Thread.sleep(1000);
        reconnect();
        continue;
      }
      if (result == null || result.isEmpty()) {
        continue;
      }
      for (java.util.Map.Entry<String, List<StreamEntry>> stream : result) {
        for (StreamEntry entry : stream.getValue()) {
          String json = entry.getFields().get("data");
          if (json == null) {
            lastId = entry.getID().toString();
            continue;
          }
          synchronized (ctx.getCheckpointLock()) {
            ctx.collect(json);
            lastId = entry.getID().toString();
          }
          LOG.info("read stream id={} bytes={}", lastId, json.length());
        }
      }
    }
  }

  private void reconnect() {
    try {
      if (jedis != null) jedis.close();
    } catch (Exception ignored) {
    }
    jedis = connect();
  }

  private Jedis connect() {
    // Socket timeout must exceed XREAD BLOCK (2000ms) or Jedis times out on empty polls.
    return new Jedis(URI.create(redisUrl), 10_000);
  }

  @Override
  public void cancel() {
    running = false;
  }

  @Override
  public void snapshotState(FunctionSnapshotContext context) throws Exception {
    lastIdState.clear();
    lastIdState.add(lastId);
    LOG.info("checkpoint stream offset={}", lastId);
  }

  @Override
  public void initializeState(FunctionInitializationContext context) throws Exception {
    lastIdState =
        context
            .getOperatorStateStore()
            .getListState(new ListStateDescriptor<>("redis-stream-last-id", String.class));
    if (context.isRestored()) {
      for (String id : lastIdState.get()) {
        lastId = id;
      }
      System.out.println("restored redis stream offset=" + lastId);
      LOG.info("restored stream offset={}", lastId);
    } else {
      System.out.println("redis stream offset starts at " + lastId);
    }
  }
}
