/**
 * Subscription Service (Placeholder)
 *
 * Models a basic SaaS subscription / billing-plan system.
 * Data is persisted in data/subscriptions.json.
 *
 * This is a structural placeholder — connect to a real payment provider
 * (Stripe, Paddle, etc.) to implement actual billing.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import logger from "../logger";

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingInterval: "monthly" | "annual";
  features: string[];
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: "active" | "cancelled" | "trialing" | "past_due";
  trialEndsAt: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Get started at no cost",
    price: 0,
    currency: "USD",
    billingInterval: "monthly",
    features: ["Up to 3 projects", "Community support", "Basic analytics"],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing teams",
    price: 19,
    currency: "USD",
    billingInterval: "monthly",
    features: [
      "Unlimited projects",
      "Priority support",
      "Advanced analytics",
      "API access",
      "Custom integrations",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations",
    price: 99,
    currency: "USD",
    billingInterval: "monthly",
    features: [
      "Everything in Pro",
      "SSO / SAML",
      "Dedicated support",
      "SLA guarantees",
      "Custom billing",
      "Audit logs",
    ],
  },
];

const SUBSCRIPTIONS_FILE = path.resolve(
  process.cwd(),
  "data",
  "subscriptions.json",
);

class SubscriptionService {
  private async load(): Promise<Subscription[]> {
    try {
      const raw = await fs.readFile(SUBSCRIPTIONS_FILE, "utf-8");
      return JSON.parse(raw) as Subscription[];
    } catch (err: any) {
      if (err.code === "ENOENT") {
        return [];
      }
      throw err;
    }
  }

  private async save(subs: Subscription[]): Promise<void> {
    await fs.mkdir(path.dirname(SUBSCRIPTIONS_FILE), { recursive: true });
    await fs.writeFile(
      SUBSCRIPTIONS_FILE,
      JSON.stringify(subs, null, 2),
      "utf-8",
    );
  }

  getPlans(): Plan[] {
    return PLANS;
  }

  getPlan(planId: string): Plan | undefined {
    return PLANS.find((p) => p.id === planId);
  }

  async getSubscription(userId: string): Promise<Subscription | null> {
    const all = await this.load();
    return (
      all.find((s) => s.userId === userId && s.status === "active") ?? null
    );
  }

  async createFreeSubscription(userId: string): Promise<Subscription> {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const sub: Subscription = {
      id: randomUUID(),
      userId,
      planId: "free",
      status: "active",
      trialEndsAt: null,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      createdAt: now.toISOString(),
    };

    const all = await this.load();
    all.push(sub);
    await this.save(all);

    logger.info("Free subscription created", {
      userId,
      subscriptionId: sub.id,
    });
    return sub;
  }
}

export const subscriptionService = new SubscriptionService();
