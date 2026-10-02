import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { describe, expect, it } from "vite-plus/test";
import { loadMarketIntelligence } from "../market-intelligence/load";
import { defaultFixtureDir, loadProductKnowledge, unresolvedEventTokens } from "./load";

function isCommercialOrCrmKey(key: string): boolean {
  return (
    key === "npi" ||
    key.startsWith("est_") ||
    key.includes("incumbent") ||
    key.includes("volume") ||
    key.includes("crm")
  );
}

const expectedIds = ["her2-ihc", "hrd", "xf", "xf-plus", "xt", "xt-cdx"];

describe("committed product-knowledge fixtures", () => {
  it("accepts all six assay cards with no skips", () => {
    const result = loadProductKnowledge();
    expect(result.report.skipped).toEqual([]);
    expect(result.report.acceptedAssays).toBe(6);
    expect(result.assays.map((assay) => assay.test_id).sort()).toEqual(expectedIds);
  });

  it("resolves every market-intelligence relevant_tests token", () => {
    const knowledge = loadProductKnowledge();
    const territory = loadMarketIntelligence();
    const missing = unresolvedEventTokens(
      territory.events.map((event) => event.relevant_tests),
      knowledge.assays,
    );
    expect(missing).toEqual([]);
  });

  it("keeps xT CDx TAT unpublished", () => {
    const xtCdx = loadProductKnowledge().assays.find((assay) => assay.test_id === "xt-cdx");
    expect(xtCdx?.tat_days).toBeNull();
    expect(xtCdx?.tat_qualifier).toBe("unpublished");
  });

  it("has no NPI, volume, incumbent, or CRM keys in committed front matter", () => {
    const names = readdirSync(defaultFixtureDir).filter((name) => name.endsWith(".md"));
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      const parsed = matter(readFileSync(join(defaultFixtureDir, name), "utf8"));
      const keys = Object.keys(parsed.data);
      expect(keys.filter((key) => isCommercialOrCrmKey(key))).toEqual([]);
    }
  });

  it("does not require germline, imaging, or data-licensing products", () => {
    const ids = loadProductKnowledge().assays.map((assay) => assay.test_id);
    expect(ids).not.toEqual(expect.arrayContaining(["xg", "imaging", "data"]));
    expect(ids.sort()).toEqual(expectedIds);
  });
});
