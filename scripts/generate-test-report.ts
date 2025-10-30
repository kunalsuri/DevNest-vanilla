/**
 * Test Report Generator
 * Generates a markdown test report from Vitest JSON output
 * Output format: yyyymmdd-hhmm-test-results-summary.md
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

interface TestAssertion {
  ancestorTitles: string[];
  title: string;
  status: string;
  duration?: number;
  failureMessages?: string[];
}

interface TestSuite {
  name: string;
  status: string;
  duration?: number;
  assertionResults: TestAssertion[];
}

interface VitestResult {
  testResults?: TestSuite[];
  numTotalTests?: number;
  numPassedTests?: number;
  numFailedTests?: number;
  numPendingTests?: number;
  startTime?: number;
  success?: boolean;
}

function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}${month}${day}-${hours}${minutes}`;
}

function formatDuration(ms?: number): string {
  if (!ms) {
    return "N/A";
  }
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

function getLatestJsonFile(files: string[]): string | null {
  const jsonFiles = files
    .filter((f) => f.endsWith("-test-results-vitest.json"))
    .sort()
    .reverse();

  return jsonFiles.length > 0 ? jsonFiles[0] : null;
}

function findLatestTestResults(testsDir: string): string | null {
  try {
    const files = readdirSync(testsDir);
    const latestFile = getLatestJsonFile(files);
    return latestFile ? join(testsDir, latestFile) : null;
  } catch (error) {
    console.error("Error finding test results:", error);
    return null;
  }
}

function getStatusIcon(status: string): string {
  if (status === "passed") {
    return "✅";
  }
  if (status === "failed") {
    return "❌";
  }
  return "⏭️";
}

function buildSummarySection(results: VitestResult): string {
  const timestamp = new Date().toISOString();
  const passed = results.numPassedTests || 0;
  const failed = results.numFailedTests || 0;
  const pending = results.numPendingTests || 0;
  const total = results.numTotalTests || 0;
  const success = results.success ?? false;

  let markdown = `# Test Results Report\n\n`;
  markdown += `**Generated:** ${timestamp}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `| Status | Count |\n`;
  markdown += `|--------|-------|\n`;
  markdown += `| ✅ Passed | ${passed} |\n`;
  markdown += `| ❌ Failed | ${failed} |\n`;
  markdown += `| ⏭️ Skipped | ${pending} |\n`;
  markdown += `| **Total** | **${total}** |\n\n`;
  markdown += `**Overall Status:** ${success ? "✅ PASSED" : "❌ FAILED"}\n\n`;

  return markdown;
}

function buildTestSuiteSection(suite: TestSuite): string {
  const suiteStatus = getStatusIcon(suite.status);
  let markdown = `### ${suiteStatus} ${suite.name}\n\n`;
  markdown += `**Duration:** ${formatDuration(suite.duration)}\n\n`;

  if (suite.assertionResults && suite.assertionResults.length > 0) {
    markdown += `| Test | Status | Duration |\n`;
    markdown += `|------|--------|----------|\n`;

    for (const test of suite.assertionResults) {
      const testStatus = getStatusIcon(test.status);
      const fullTitle = [...test.ancestorTitles, test.title].join(" > ");
      markdown += `| ${fullTitle} | ${testStatus} | ${formatDuration(test.duration)} |\n`;

      if (test.failureMessages && test.failureMessages.length > 0) {
        markdown += `\n**Failure Details:**\n\n`;
        markdown += "```\n";
        markdown += test.failureMessages.join("\n\n");
        markdown += "\n```\n\n";
      }
    }
    markdown += `\n`;
  }

  return markdown;
}

function generateMarkdownReport(jsonPath: string, outputPath: string): void {
  try {
    const jsonData = readFileSync(jsonPath, "utf-8");
    const results: VitestResult = JSON.parse(jsonData);

    let markdown = buildSummarySection(results);

    if (results.testResults && results.testResults.length > 0) {
      markdown += `## Test Suites\n\n`;

      for (const suite of results.testResults) {
        markdown += buildTestSuiteSection(suite);
      }
    }

    markdown += `---\n\n`;
    markdown += `*Report generated from: ${jsonPath}*\n`;

    writeFileSync(outputPath, markdown, "utf-8");
    console.log(`✅ Test report generated: ${outputPath}`);
  } catch (error) {
    console.error("Error generating report:", error);
    process.exit(1);
  }
}

// Main execution
const testsDir = join(process.cwd(), "tests");
const jsonPath = process.argv[2] || findLatestTestResults(testsDir);

if (!jsonPath) {
  console.error("❌ No test results found. Please run tests first.");
  process.exit(1);
}

const timestamp = getTimestamp();
const outputPath = join(testsDir, `${timestamp}-test-results-summary.md`);

generateMarkdownReport(jsonPath, outputPath);
