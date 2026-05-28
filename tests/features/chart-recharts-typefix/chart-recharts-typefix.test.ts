import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { createElement } from "react";
import { Bar, BarChart } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

// Feature F-16 — chart-recharts-typefix.
// chart.tsx is a shadcn/ui wrapper that was typed against Recharts v2 while the
// project ships Recharts v3. The authoritative regression guard for this fix is
// `npm run check` (tsc), enforced in CI. These tests additionally verify the
// module imports cleanly and ChartContainer/ChartStyle still render under jsdom.

describe("Chart Recharts Type Fix (F-16)", () => {
  it("exports all chart primitives", () => {
    for (const exported of [
      ChartContainer,
      ChartTooltip,
      ChartTooltipContent,
      ChartLegend,
      ChartLegendContent,
      ChartStyle,
    ]) {
      expect(exported).toBeDefined();
    }
  });

  it("renders the chart wrapper and injects theme CSS variables", () => {
    const config = {
      visitors: { label: "Visitors", color: "#2563eb" },
    } satisfies ChartConfig;

    const chart = createElement(
      BarChart,
      { data: [{ name: "Jan", visitors: 120 }], width: 200, height: 120 },
      createElement(Bar, {
        dataKey: "visitors",
        fill: "var(--color-visitors)",
      }),
    );

    const { container } = render(
      createElement(ChartContainer, { config }, chart),
    );

    const wrapper = container.querySelector("[data-chart]");
    expect(wrapper).not.toBeNull();

    // ChartStyle emits a <style> block defining --color-<key> from the config.
    const style = container.querySelector("style");
    expect(style).not.toBeNull();
    expect(style?.innerHTML).toContain("--color-visitors: #2563eb");
  });
});
