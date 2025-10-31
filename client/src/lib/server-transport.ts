/**
 * Server Transport for Browser-to-Server Log Persistence
 *
 * This transport sends logs from browser clients to the server
 * via HTTP POST requests, enabling file persistence even when
 * running in browser environments.
 */

import { LogEntry, LogTransport } from "./logger";

interface ServerTransportConfig {
  endpoint?: string;
  batchSize?: number;
  flushInterval?: number; // milliseconds
  retryAttempts?: number;
  enableBuffering?: boolean;
}

export class ServerTransport implements LogTransport {
  name = "server";
  private readonly config: Required<ServerTransportConfig>;
  private buffer: LogEntry[] = [];
  private flushTimer: number | null = null;

  constructor(config: ServerTransportConfig = {}) {
    this.config = {
      endpoint: config.endpoint || "/api/logs",
      batchSize: config.batchSize || 10,
      flushInterval: config.flushInterval || 5000, // 5 seconds
      retryAttempts: config.retryAttempts || 3,
      enableBuffering: config.enableBuffering ?? true,
    };

    // Setup periodic flush if buffering is enabled
    if (this.config.enableBuffering) {
      this.startPeriodicFlush();
    }

    // Flush remaining logs when page is unloading
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => this.flush());
      window.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          this.flush();
        }
      });
    }
  }

  async log(entry: LogEntry): Promise<void> {
    if (this.config.enableBuffering) {
      // Add to buffer
      this.buffer.push(entry);

      // Flush if buffer is full
      if (this.buffer.length >= this.config.batchSize) {
        await this.flush();
      }
    } else {
      // Send immediately
      await this.sendLogs([entry]);
    }
  }

  /**
   * Flush all buffered logs to server
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const logsToSend = [...this.buffer];
    this.buffer = []; // Clear buffer immediately

    try {
      await this.sendLogs(logsToSend);
    } catch (error) {
      // On failure, put logs back in buffer (but don't exceed buffer size)
      const maxRestore = this.config.batchSize - this.buffer.length;
      if (maxRestore > 0) {
        this.buffer.unshift(...logsToSend.slice(0, maxRestore));
      }
      throw error;
    }
  }

  /**
   * Send logs to server endpoint
   */
  private async sendLogs(logs: LogEntry[]): Promise<void> {
    if (logs.length === 0) {
      return;
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await fetch(this.config.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ logs }),
        });

        if (!response.ok) {
          throw new Error(
            `Server responded with ${response.status}: ${response.statusText}`,
          );
        }

        // Success - logs sent to server
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Wait before retry (exponential backoff)
        if (attempt < this.config.retryAttempts) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000),
          );
        }
      }
    }

    // All retries failed
    console.error(
      "[ServerTransport] Failed to send logs after",
      this.config.retryAttempts,
      "attempts:",
      lastError,
    );

    // In development, also log using logger as fallback
    if (process.env.NODE_ENV === "development") {
      // Note: We cannot use logger here as it would cause a circular dependency
      // The logs are already being processed by the logger system
    }
  }

  /**
   * Start periodic flush timer
   */
  private startPeriodicFlush(): void {
    if (this.flushTimer) {
      return;
    }

    this.flushTimer = window.setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush().catch((error) => {
          console.error("[ServerTransport] Periodic flush failed:", error);
        });
      }
    }, this.config.flushInterval);
  }

  /**
   * Stop periodic flush timer
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Final flush
    this.flush().catch((error) => {
      console.error("[ServerTransport] Final flush failed:", error);
    });
  }
}
