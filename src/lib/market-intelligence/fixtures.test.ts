import { readFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import { defaultFixturePaths, loadMarketIntelligence } from "./load";

function headerColumns(path: string): string[] {
  const firstLine = readFileSync(path, "utf8").split(/\r?\n/, 1)[0] ?? "";
  return firstLine.split(",");
}

const forbiddenHeader = /turnaround|\btat\b|gene.?count|accuracy/i;

describe("committed market-intelligence fixtures", () => {
  it("loads 40-80 providers with mixed org types and CRM join keys", () => {
    const result = loadMarketIntelligence();
    expect(result.report.skipped).toEqual([]);
    expect(result.report.acceptedProviders).toBeGreaterThanOrEqual(40);
    expect(result.report.acceptedProviders).toBeLessThanOrEqual(80);
    expect(result.report.acceptedEvents).toBe(6);

    const orgTypes = new Set(result.providers.map((row) => row.org_type));
    expect(orgTypes.has("academic") || orgTypes.has("nci_designated")).toBe(true);
    expect(orgTypes.has("community_hospital") || orgTypes.has("independent_practice")).toBe(true);

    const crmNpis = result.providers.filter((row) => row.reserved_for_crm).map((row) => row.npi);
    expect(crmNpis.length).toBeGreaterThanOrEqual(8);
    expect(new Set(crmNpis).size).toBe(crmNpis.length);
  });

  it("accepts every committed event row", () => {
    const result = loadMarketIntelligence();
    expect(result.events).toHaveLength(6);
    expect(result.report.skipped.filter((skip) => skip.source.includes("events"))).toEqual([]);
    for (const event of result.events) {
      expect(event.tumor_type).toBeTruthy();
      expect(event.event_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(event.headline).toBeTruthy();
      expect(event.relevant_tests).toBeTruthy();
      expect(event.why_now).toBeTruthy();
      expect(event.why_now).not.toMatch(/\d+(\.\d+)?\s*%/);
      expect(event.why_now).not.toMatch(/turnaround/i);
    }
  });

  it("has no turnaround, gene-count, or accuracy columns", () => {
    const providerHeaders = headerColumns(defaultFixturePaths.providers);
    const eventHeaders = headerColumns(defaultFixturePaths.events);
    expect(providerHeaders.some((column) => forbiddenHeader.test(column))).toBe(false);
    expect(eventHeaders.some((column) => forbiddenHeader.test(column))).toBe(false);
  });
});
