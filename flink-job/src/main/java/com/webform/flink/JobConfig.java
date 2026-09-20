package com.webform.flink;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

public final class JobConfig {
  public final String redisUrl;
  public final String jdbcUrl;
  public final String jdbcUser;
  public final String jdbcPassword;
  public final String checkpointDir;

  private JobConfig(
      String redisUrl, String jdbcUrl, String jdbcUser, String jdbcPassword, String checkpointDir) {
    this.redisUrl = redisUrl;
    this.jdbcUrl = jdbcUrl;
    this.jdbcUser = jdbcUser;
    this.jdbcPassword = jdbcPassword;
    this.checkpointDir = checkpointDir;
  }

  public static JobConfig fromEnv() {
    String redisUrl = envOr("REDIS_URL", "redis://localhost:6379");
    String databaseUrl = required("DATABASE_URL");
    ParsedJdbc parsed = parseDatabaseUrl(databaseUrl);
    String checkpointDir =
        envOr("FLINK_CHECKPOINT_DIR", "file:///D:/dev-tools/flink-checkpoints");
    return new JobConfig(redisUrl, parsed.jdbcUrl, parsed.user, parsed.password, checkpointDir);
  }

  public static String required(String key) {
    String value = System.getenv(key);
    if (value == null || value.isBlank()) {
      throw new IllegalStateException(key + " is required");
    }
    return value;
  }

  private static String envOr(String key, String fallback) {
    String value = System.getenv(key);
    return value == null || value.isBlank() ? fallback : value;
  }

  static ParsedJdbc parseDatabaseUrl(String databaseUrl) {
    String raw = databaseUrl.trim();
    if (raw.startsWith("postgresql://")) {
      raw = "postgres://" + raw.substring("postgresql://".length());
    }
    URI uri = URI.create(raw);
    String userInfo = uri.getUserInfo();
    String user = "";
    String password = "";
    if (userInfo != null) {
      int colon = userInfo.indexOf(':');
      if (colon >= 0) {
        user = decode(userInfo.substring(0, colon));
        password = decode(userInfo.substring(colon + 1));
      } else {
        user = decode(userInfo);
      }
    }
    String host = uri.getHost();
    int port = uri.getPort() > 0 ? uri.getPort() : 5432;
    String path = uri.getPath() == null ? "" : uri.getPath();
    String db = path.startsWith("/") ? path.substring(1) : path;
    int q = db.indexOf('?');
    if (q >= 0) db = db.substring(0, q);
    String query = uri.getQuery();
    StringBuilder jdbc = new StringBuilder("jdbc:postgresql://").append(host).append(':').append(port).append('/').append(db);
    if (query == null || query.isBlank()) {
      jdbc.append("?sslmode=require");
    } else if (!query.contains("sslmode=")) {
      jdbc.append('?').append(query).append("&sslmode=require");
    } else {
      jdbc.append('?').append(query);
    }
    return new ParsedJdbc(jdbc.toString(), user, password);
  }

  private static String decode(String value) {
    return URLDecoder.decode(value, StandardCharsets.UTF_8);
  }

  static final class ParsedJdbc {
    final String jdbcUrl;
    final String user;
    final String password;

    ParsedJdbc(String jdbcUrl, String user, String password) {
      this.jdbcUrl = jdbcUrl;
      this.user = user;
      this.password = password;
    }
  }
}
