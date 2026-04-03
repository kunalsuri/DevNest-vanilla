/**
 * Notification Service
 *
 * File-based in-app notification system.
 * Notifications are persisted to data/notifications.json.
 *
 * Typical usage: create a notification after register, password change, etc.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import logger from "../logger";

export interface Notification {
  id: string;
  userId: string;
  type: "info" | "warning" | "success" | "error";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const NOTIFICATIONS_FILE = path.resolve(
  process.cwd(),
  "data",
  "notifications.json",
);

class NotificationService {
  private async load(): Promise<Notification[]> {
    try {
      const raw = await fs.readFile(NOTIFICATIONS_FILE, "utf-8");
      return JSON.parse(raw) as Notification[];
    } catch (err: any) {
      if (err.code === "ENOENT") {
        return [];
      }
      throw err;
    }
  }

  private async save(notifications: Notification[]): Promise<void> {
    await fs.mkdir(path.dirname(NOTIFICATIONS_FILE), { recursive: true });
    await fs.writeFile(
      NOTIFICATIONS_FILE,
      JSON.stringify(notifications, null, 2),
      "utf-8",
    );
  }

  async getForUser(userId: string): Promise<Notification[]> {
    const all = await this.load();
    return all
      .filter((n) => n.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  async create(
    userId: string,
    type: Notification["type"],
    title: string,
    message: string,
  ): Promise<Notification> {
    const all = await this.load();
    const notification: Notification = {
      id: randomUUID(),
      userId,
      type,
      title,
      message,
      read: false,
      createdAt: new Date().toISOString(),
    };
    all.push(notification);
    await this.save(all);
    logger.info("Notification created", { userId, type, title });
    return notification;
  }

  async markRead(notificationId: string, userId: string): Promise<boolean> {
    const all = await this.load();
    const n = all.find(
      (item) => item.id === notificationId && item.userId === userId,
    );
    if (!n) {
      return false;
    }
    n.read = true;
    await this.save(all);
    return true;
  }

  async markAllRead(userId: string): Promise<void> {
    const all = await this.load();
    all.forEach((n) => {
      if (n.userId === userId) {
        n.read = true;
      }
    });
    await this.save(all);
  }

  async delete(notificationId: string, userId: string): Promise<boolean> {
    const all = await this.load();
    const idx = all.findIndex(
      (n) => n.id === notificationId && n.userId === userId,
    );
    if (idx === -1) {
      return false;
    }
    all.splice(idx, 1);
    await this.save(all);
    return true;
  }
}

export const notificationService = new NotificationService();
