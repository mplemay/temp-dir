import { readFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import { loadMarketIntelligence } from "../market-intelligence/load";
import {
  defaultFixturePath,
  loadCrmNotes,
  notesOutsideReservedSet,
  reservedNpisBelowMinNotes,
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
  it("accepts twenty-four reserved-NPI notes with no skips", () => {
    const result = loadCrmNotes();
    expect(result.report.skipped).toEqual([]);
    expect(result.report.acceptedNotes).toBe(24);
    const ids = result.notes.map((note) => note.note_id);
    expect(new Set(ids).size).toBe(24);
    const quinn = result.notes.find((note) => note.note_id === "quinn-chen-tat");
    expect(quinn?.body).toMatch(/turnaround time/i);
  });

  it("covers every reserved CRM NPI at least twice and invents none", () => {
    const notes = loadCrmNotes();
    const territory = loadMarketIntelligence();
    const reservedNpis = territory.providers
      .filter((provider) => provider.reserved_for_crm)
      .map((provider) => provider.npi);

    expect(reservedNpisWithoutNotes(reservedNpis, notes.notes)).toEqual([]);
    expect(reservedNpisBelowMinNotes(reservedNpis, notes.notes, 2)).toEqual([]);
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
