package com.webform.flink;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import org.apache.flink.api.common.functions.RichMapFunction;
import org.apache.flink.configuration.Configuration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DeserializeSubmission extends RichMapFunction<String, SubmissionEvent> {
  private static final Logger LOG = LoggerFactory.getLogger(DeserializeSubmission.class);
  private transient ObjectMapper mapper;

  @Override
  public void open(Configuration parameters) {
    mapper = new ObjectMapper();
  }

  @Override
  public SubmissionEvent map(String json) {
    try {
      JsonNode node = mapper.readTree(json);
      String submissionId = text(node, "submissionId");
      String formId = text(node, "formId");
      String submittedRaw = firstText(node, "submittedAt", "createdAt");
      if (submissionId == null || formId == null || submittedRaw == null) {
        LOG.warn("dropping event missing required fields: {}", json);
        return null;
      }
      Instant at = Instant.parse(submittedRaw);
      return new SubmissionEvent(
          submissionId,
          formId,
          text(node, "formVersionId"),
          text(node, "idempotencyKey"),
          at.toEpochMilli());
    } catch (Exception e) {
      LOG.warn("dropping unreadable event: {}", e.toString());
      return null;
    }
  }

  private static String text(JsonNode node, String field) {
    JsonNode value = node.get(field);
    if (value == null || value.isNull()) return null;
    String text = value.asText();
    return text.isBlank() ? null : text;
  }

  private static String firstText(JsonNode node, String... fields) {
    for (String field : fields) {
      String value = text(node, field);
      if (value != null) return value;
    }
    return null;
  }
}
