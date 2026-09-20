package com.webform.flink;

import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.stream.Stream;

/** Picks the newest completed Flink checkpoint under the configured directory. */
public final class LatestCheckpoint {
  private LatestCheckpoint() {}

  public static String find(String checkpointDir) {
    Path root = toPath(checkpointDir);
    if (!Files.isDirectory(root)) return null;
    try (Stream<Path> walk = Files.walk(root)) {
      return walk
          .filter(path -> path.getFileName().toString().equals("_metadata"))
          .max(Comparator.comparingLong(path -> path.toFile().lastModified()))
          .map(path -> path.getParent().toUri().toString())
          .orElse(null);
    } catch (Exception e) {
      System.err.println("checkpoint scan failed: " + e);
      return null;
    }
  }

  static Path toPath(String checkpointDir) {
    String raw = checkpointDir.trim();
    if (raw.startsWith("file:")) {
      return Path.of(URI.create(raw));
    }
    return Path.of(raw);
  }
}
