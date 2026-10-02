import { readFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import { defaultFixturePaths, loadMarketIntelligence } from "../market-intelligence/load";
import { loadCrmNotes } from "../crm-notes/load";
import { defaultArtifactPath, loadRankedProviders } from "./load";

function headerColumns(path: string): string[] {
  const firstLine = readFileSync(path, "utf8").split(/\r?\n/, 1)[0] ?? "";
  return firstLine.split(",");
}

describe("committed ranked-providers fixture", () => {
  it("covers every accepted provider with unique ranks and gpt-6-luna metadata", () => {
    const market = loadMarketIntelligence();
    const ranked = loadRankedProviders();
    const acceptedNpis = new Set(market.providers.map((provider) => provider.npi));
    const rankedNpis = ranked.providers.map((row) => row.npi);

    expect(ranked.artifact.model).toBe("gpt-6-luna");
    expect(ranked.artifact.reasoning_effort).toBe("medium");
    expect(rankedNpis.sort()).toEqual([...acceptedNpis].sort());
    expect(ranked.providers.map((row) => row.rank)).toEqual(
      ranked.providers.map((_, index) => index + 1),
    );
    expect(ranked.providers.every((row) => row.why_now.trim().length > 0)).toBe(true);
    expect(ranked.providers.find((row) => row.npi === "1600000007")?.rank).not.toBe(1);
  });

  it("keeps providers without CRM notes on the list as unknown readiness", () => {
    const notes = loadCrmNotes();
    const noted = new Set(notes.notes.map((note) => note.npi));
    const ranked = loadRankedProviders();
    const withoutNotes = ranked.providers.filter((row) => !noted.has(row.npi));

    expect(withoutNotes.length).toBeGreaterThan(0);
    expect(withoutNotes.every((row) => row.readiness === "unknown")).toBe(true);
  });

  it("does not store rank on the provider CSV", () => {
    const headers = headerColumns(defaultFixturePaths.providers);
    expect(headers).not.toContain("rank");
    expect(headers).not.toContain("impact_score");
    expect(readFileSync(defaultArtifactPath, "utf8")).toContain('"rank"');
  });
});
