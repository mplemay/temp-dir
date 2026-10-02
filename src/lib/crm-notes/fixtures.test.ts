import { readFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import { loadMarketIntelligence } from "../market-intelligence/load";
import {
  defaultFixturePath,
  loadCrmNotes,
  notesOutsideReservedSet,
  reservedNpisWithoutNotes,
} from "./load";

function headerColumns(path: string): string[] {
  const firstLine = readFileSync(path, "utf8").split(/\r?\n/, 1)[0] ?? "";
  return firstLine.split(",");
}

const forbiddenHeader = /turnaround|\btat\b|gene.?count|accuracy|volume|\brank\b/i;
const namedPatientMarker = /\b(MRN|DOB|patient)\b/i;
const assayClaim = /\d+\s*-?\s*days?\b|\d+\s*genes?\b|\d+(?:\.\d+)?\s*%/i;

describe("committed crm-notes fixtures", () => {
  it("accepts eight reserved-NPI notes with no skips", () => {
    const result = loadCrmNotes();
    expect(result.report.skipped).toEqual([]);
    expect(result.report.acceptedNotes).toBe(8);
    expect(result.notes.map((note) => note.npi)).toEqual([
      "1600000001",
      "1600000002",
      "1600000003",
      "1600000004",
      "1600000005",
      "1600000006",
      "1600000007",
      "1600000008",
    ]);
    const quinn = result.notes.find((note) => note.npi === "1600000004");
    expect(quinn?.body).toMatch(/turnaround time/i);
  });

  it("covers every reserved CRM NPI and invents none", () => {
    const notes = loadCrmNotes();
    const territory = loadMarketIntelligence();
    const reservedNpis = territory.providers
      .filter((provider) => provider.reserved_for_crm)
      .map((provider) => provider.npi);

    expect(reservedNpisWithoutNotes(reservedNpis, notes.notes)).toEqual([]);
    expect(notesOutsideReservedSet(reservedNpis, notes.notes)).toEqual([]);
  });

  it("has no turnaround, gene-count, accuracy, volume, or rank columns", () => {
    const headers = headerColumns(defaultFixturePath);
    expect(headers.some((column) => forbiddenHeader.test(column))).toBe(false);
  });

  it("keeps bodies free of PHI markers and numeric assay claims", () => {
    const result = loadCrmNotes();
    for (const note of result.notes) {
      expect(note.body).not.toMatch(namedPatientMarker);
      expect(note.body).not.toMatch(assayClaim);
    }
  });
});
