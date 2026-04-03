import { describe, it, expect, beforeEach } from "vitest";
import { notificationService } from "@server/services/notification-service";
import { randomUUID } from "node:crypto";

const uid = () => `notify-test-${randomUUID().slice(0, 8)}`;

describe("NotificationService", () => {
  const userId = uid();

  beforeEach(async () => {
    // Clean up any notifications for this user between tests
    const existing = await notificationService.getForUser(userId);
    for (const n of existing) {
      await notificationService.delete(n.id, userId);
    }
  });

  it("creates a notification and retrieves it for the user", async () => {
    const n = await notificationService.create(
      userId,
      "info",
      "Welcome",
      "Thanks for joining",
    );

    expect(n.id).toBeDefined();
    expect(n.userId).toBe(userId);
    expect(n.type).toBe("info");
    expect(n.title).toBe("Welcome");
    expect(n.read).toBe(false);

    const list = await notificationService.getForUser(userId);
    expect(list.some((x) => x.id === n.id)).toBe(true);
  });

  it("marks a notification as read", async () => {
    const n = await notificationService.create(userId, "success", "Done", "OK");
    await notificationService.markRead(n.id, userId);

    const list = await notificationService.getForUser(userId);
    const updated = list.find((x) => x.id === n.id);
    expect(updated?.read).toBe(true);
  });

  it("marks all notifications as read", async () => {
    await notificationService.create(userId, "warning", "A", "first");
    await notificationService.create(userId, "error", "B", "second");

    await notificationService.markAllRead(userId);

    const list = await notificationService.getForUser(userId);
    list.forEach((n) => expect(n.read).toBe(true));
  });

  it("deletes a notification", async () => {
    const n = await notificationService.create(userId, "info", "Temp", "gone");
    await notificationService.delete(n.id, userId);

    const list = await notificationService.getForUser(userId);
    expect(list.some((x) => x.id === n.id)).toBe(false);
  });

  it("returns notifications newest-first", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
    const first = await notificationService.create(
      userId,
      "info",
      "First",
      "oldest",
    );
    vi.setSystemTime(new Date("2024-01-01T00:01:00.000Z"));
    const second = await notificationService.create(
      userId,
      "info",
      "Second",
      "newest",
    );
    vi.useRealTimers();

    const list = await notificationService.getForUser(userId);
    const firstIdx = list.findIndex((n) => n.id === first.id);
    const secondIdx = list.findIndex((n) => n.id === second.id);

    expect(secondIdx).toBeLessThan(firstIdx);
  });

  it("does not expose notifications of other users", async () => {
    const otherUserId = uid();
    await notificationService.create(otherUserId, "info", "Other", "not yours");

    const list = await notificationService.getForUser(userId);
    const leaked = list.some((n) => n.userId === otherUserId);
    expect(leaked).toBe(false);
  });
});
