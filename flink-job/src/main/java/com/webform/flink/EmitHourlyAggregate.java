package com.webform.flink;

import java.time.Instant;
import org.apache.flink.streaming.api.functions.windowing.ProcessWindowFunction;
import org.apache.flink.streaming.api.windowing.windows.TimeWindow;
import org.apache.flink.util.Collector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class EmitHourlyAggregate
    extends ProcessWindowFunction<Long, HourlyAggregate, String, TimeWindow> {
  private static final Logger LOG = LoggerFactory.getLogger(EmitHourlyAggregate.class);

  @Override
  public void process(
      String formId, Context context, Iterable<Long> counts, Collector<HourlyAggregate> out) {
    long count = 0;
    for (Long value : counts) {
      count = value;
    }
    TimeWindow window = context.window();
    HourlyAggregate aggregate =
        new HourlyAggregate(
            formId,
            Instant.ofEpochMilli(window.getStart()),
            Instant.ofEpochMilli(window.getEnd()),
            count);
    LOG.info(
        "hourly formId={} windowStart={} count={}",
        formId,
        aggregate.windowStart,
        aggregate.submissionCount);
    out.collect(aggregate);
  }
}
