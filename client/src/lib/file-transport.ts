/**
 * File System Transport for Local Log Persistence
 * 
 * Implements local file logging following 2024-2025 best practices:
 * - Structured log files in /logs directory
 * - Log rotation to prevent disk space issues
 * - Different files for different log levels
 * - JSON format for easy parsing
 * - Automatic cleanup of old files
 */

import { LogEntry, LogTransport, LogLevel } from './logger';

interface FileTransportConfig {
  logDirectory?: string;
  maxFileSize?: number; // bytes
  maxFiles?: number;    // number of rotated files to keep
  rotateDaily?: boolean;
  includeLogLevels?: LogLevel[];
  separateByLevel?: boolean; // create separate files per log level
}

export class FileTransport implements LogTransport {
  name = 'file';
  private config: Required<FileTransportConfig>;
  private currentFiles: Map<string, any> = new Map(); // File handles
  private fileSizes: Map<string, number> = new Map();

  constructor(config: FileTransportConfig = {}) {
    this.config = {
      logDirectory: config.logDirectory || 'logs',
      maxFileSize: config.maxFileSize || 10 * 1024 * 1024, // 10MB
      maxFiles: config.maxFiles || 5,
      rotateDaily: config.rotateDaily ?? true,
      includeLogLevels: config.includeLogLevels || [
        LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL
      ],
      separateByLevel: config.separateByLevel ?? true,
    };

    this.initializeFileSystem();
  }

  async log(entry: LogEntry): Promise<void> {
    try {
      // Skip if this log level is not configured to be written to files
      if (!this.config.includeLogLevels.includes(entry.level)) {
        return;
      }

      const fileName = this.getFileName(entry);
      const logLine = this.formatLogEntry(entry);

      await this.writeToFile(fileName, logLine);
      
      // Check if rotation is needed
      await this.checkRotation(fileName);
    } catch (error) {
      // Fallback to console if file logging fails
      console.error('[FileTransport] Failed to write log:', error);
      console.log(entry);
    }
  }

  private async initializeFileSystem(): Promise<void> {
    try {
      // Create logs directory if it doesn't exist
      if (typeof window === 'undefined' && typeof require !== 'undefined') {
        // Node.js environment (server-side)
        const fs = require('fs').promises;
        const path = require('path');
        
        // Resolve to absolute path - if relative, resolve from project root
        const logDir = path.isAbsolute(this.config.logDirectory) 
          ? this.config.logDirectory
          : path.resolve(process.cwd(), this.config.logDirectory);
          
        console.log(`[FileTransport] Initializing log directory: ${logDir}`);
        await fs.mkdir(logDir, { recursive: true });
        
        // Verify directory is writable
        await fs.access(logDir, fs.constants.W_OK);
        console.log(`[FileTransport] Log directory ready: ${logDir}`);
      } else {
        // Browser environment - logs will go to localStorage with prefix
        console.log(`[FileTransport] Browser mode - logs stored in localStorage with prefix: devnest_logs_`);
      }
    } catch (error) {
      console.warn('[FileTransport] Could not initialize file system:', error);
      // In browser or if file system fails, fall back to localStorage
    }
  }

  private getFileName(entry: LogEntry): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const baseDir = this.config.logDirectory;
    
    if (this.config.separateByLevel) {
      const level = LogLevel[entry.level].toLowerCase();
      return this.config.rotateDaily 
        ? `${baseDir}/${level}-${date}.log`
        : `${baseDir}/${level}.log`;
    } else {
      return this.config.rotateDaily
        ? `${baseDir}/application-${date}.log`
        : `${baseDir}/application.log`;
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    // Structured JSON format for easy parsing
    const logObject = {
      timestamp: entry.timestamp,
      level: entry.levelName.toUpperCase(),
      message: entry.message,
      ...(entry.component && { component: entry.component }),
      ...(entry.module && { module: entry.module }),
      ...(entry.userId && { userId: entry.userId }),
      ...(entry.sessionId && { sessionId: entry.sessionId }),
      ...(entry.requestId && { requestId: entry.requestId }),
      environment: entry.environment,
      ...(entry.url && { url: entry.url }),
      ...(entry.metadata && { metadata: entry.metadata }),
      ...(entry.error && { 
        error: {
          name: entry.error.name,
          message: entry.error.message,
          ...(entry.error.stack && { stack: entry.error.stack.split('\n') }),
          ...(entry.error.code && { code: entry.error.code }),
        }
      }),
    };

    return JSON.stringify(logObject) + '\n';
  }

  private async writeToFile(fileName: string, logLine: string): Promise<void> {
    if (typeof window !== 'undefined') {
      // Browser environment - use localStorage as fallback
      await this.writeToBrowserStorage(fileName, logLine);
      return;
    }

    // Node.js environment
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const filePath = path.resolve(process.cwd(), fileName);
      
      // Append to file
      await fs.appendFile(filePath, logLine, 'utf8');
      
      // Track file size
      const stats = await fs.stat(filePath);
      this.fileSizes.set(fileName, stats.size);
      
    } catch (error) {
      throw new Error(`Failed to write to log file ${fileName}: ${error}`);
    }
  }

  private async writeToBrowserStorage(fileName: string, logLine: string): Promise<void> {
    try {
      const key = `devnest_logs_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const existing = localStorage.getItem(key) || '';
      
      // Limit browser storage size (max 2MB per file)
      const maxSize = 2 * 1024 * 1024;
      const newContent = existing + logLine;
      
      if (newContent.length > maxSize) {
        // Remove oldest entries (first lines)
        const lines = newContent.split('\n');
        const keptLines = lines.slice(Math.floor(lines.length / 2));
        localStorage.setItem(key, keptLines.join('\n'));
      } else {
        localStorage.setItem(key, newContent);
      }
    } catch (error) {
      // localStorage might be full or disabled
      console.warn('[FileTransport] Browser storage write failed:', error);
    }
  }

  private async checkRotation(fileName: string): Promise<void> {
    const currentSize = this.fileSizes.get(fileName) || 0;
    
    if (currentSize > this.config.maxFileSize) {
      await this.rotateFile(fileName);
    }
  }

  private async rotateFile(fileName: string): Promise<void> {
    if (typeof window !== 'undefined') {
      // Browser: Just clear the storage
      const key = `devnest_logs_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`;
      localStorage.removeItem(key);
      return;
    }

    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const filePath = path.resolve(process.cwd(), fileName);
      const fileExt = path.extname(fileName);
      const baseName = path.basename(fileName, fileExt);
      const dirName = path.dirname(fileName);
      
      // Rotate existing files
      for (let i = this.config.maxFiles - 1; i >= 1; i--) {
        const oldFile = path.join(dirName, `${baseName}.${i}${fileExt}`);
        const newFile = path.join(dirName, `${baseName}.${i + 1}${fileExt}`);
        
        try {
          await fs.access(oldFile);
          await fs.rename(oldFile, newFile);
        } catch {
          // File doesn't exist, continue
        }
      }
      
      // Move current file to .1
      const rotatedFile = path.join(dirName, `${baseName}.1${fileExt}`);
      await fs.rename(filePath, rotatedFile);
      
      // Clean up old files beyond maxFiles
      for (let i = this.config.maxFiles + 1; i <= this.config.maxFiles + 5; i++) {
        const oldFile = path.join(dirName, `${baseName}.${i}${fileExt}`);
        try {
          await fs.unlink(oldFile);
        } catch {
          // File doesn't exist, ignore
        }
      }
      
      this.fileSizes.delete(fileName);
    } catch (error) {
      console.error(`[FileTransport] Failed to rotate log file ${fileName}:`, error);
    }
  }

  shouldLog(level: LogLevel): boolean {
    return this.config.includeLogLevels.includes(level);
  }

  /**
   * Get current log files information
   */
  async getLogFiles(): Promise<{ fileName: string; size: number; lastModified: Date }[]> {
    if (typeof window !== 'undefined') {
      // Browser environment - return localStorage info
      const files = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('devnest_logs_')) {
          const content = localStorage.getItem(key) || '';
          files.push({
            fileName: key.replace('devnest_logs_', '').replace(/_/g, '/'),
            size: content.length,
            lastModified: new Date(), // Can't get actual date from localStorage
          });
        }
      }
      return files;
    }

    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const logDir = path.resolve(process.cwd(), this.config.logDirectory);
      const files = await fs.readdir(logDir);
      
      const fileInfo = await Promise.all(
        files
          .filter((file: string) => file.endsWith('.log'))
          .map(async (file: string) => {
            const filePath = path.join(logDir, file);
            const stats = await fs.stat(filePath);
            return {
              fileName: file,
              size: stats.size,
              lastModified: stats.mtime,
            };
          })
      );
      
      return fileInfo.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    } catch (error) {
      console.error('[FileTransport] Failed to get log files:', error);
      return [];
    }
  }

  /**
   * Clear all log files
   */
  async clearLogs(): Promise<void> {
    if (typeof window !== 'undefined') {
      // Browser environment
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('devnest_logs_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      return;
    }

    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const logDir = path.resolve(process.cwd(), this.config.logDirectory);
      const files = await fs.readdir(logDir);
      
      await Promise.all(
        files
          .filter((file: string) => file.endsWith('.log'))
          .map((file: string) => fs.unlink(path.join(logDir, file)))
      );
      
      this.fileSizes.clear();
    } catch (error) {
      console.error('[FileTransport] Failed to clear log files:', error);
    }
  }

  /**
   * Read logs from a specific file
   */
  async readLogFile(fileName: string, lines: number = 100): Promise<LogEntry[]> {
    if (typeof window !== 'undefined') {
      // Browser environment
      const key = `devnest_logs_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const content = localStorage.getItem(key) || '';
      const logLines = content.split('\n').filter(Boolean).slice(-lines);
      
      return logLines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);
    }

    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const filePath = path.resolve(process.cwd(), this.config.logDirectory, fileName);
      const content = await fs.readFile(filePath, 'utf8');
      const logLines = content.split('\n').filter(Boolean).slice(-lines);
      
      return logLines.map((line: string) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);
    } catch (error) {
      console.error(`[FileTransport] Failed to read log file ${fileName}:`, error);
      return [];
    }
  }
}