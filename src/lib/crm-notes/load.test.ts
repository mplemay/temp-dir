import { describe, expect, it } from "vite-plus/test";
import {
  loadCrmNotes,
  MissingFixtureError,
  notesForNpi,
  notesOutsideReservedSet,
  parseCrmNotes,
  reservedNpisWithoutNotes,
} from "./load";

const noteHeader = ["npi", "note_date", "body"];

function csv(header: string[], rows: string[][]): string {
  return [header.join(","), ...rows.map((row) => row.map(csvField).join(","))].join("\n");
}

function csvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function noteRow(
  overrides: {
    npi?: string;
    note_date?: string;
    body?: string;
    extra?: string[];
  } = {},
): string[] {
  return [
    overrides.npi ?? "1600000004",
    overrides.note_date ?? "2026-09-12",
    overrides.body ?? "Dr. Quinn Chen is concerned about turnaround time versus Guardant liquid.",
    ...(overrides.extra ?? []),
  ];
}

describe("parseCrmNotes", () => {
  it("loads inline valid CSV", () => {
    const result = parseCrmNotes(csv(noteHeader, [noteRow()]));
    expect(result.report.acceptedNotes).toBe(1);
    expect(result.report.skipped).toEqual([]);
    expect(result.notes[0]?.npi).toBe("1600000004");
  });

  it("skips bad NPI, empty body, and invalid date while keeping valid rows", () => {
    const result = parseCrmNotes(
      csv(noteHeader, [
        noteRow({ npi: "1600000001", body: "Valid note about liquid at progression." }),
        noteRow({ npi: "123", body: "Bad NPI row." }),
        noteRow({ npi: "1600000002", body: "" }),
        noteRow({ npi: "1600000003", note_date: "09/12/2026" }),
      ]),
    );
    expect(result.report.acceptedNotes).toBe(1);
    expect(result.notes.map((note) => note.npi)).toEqual(["1600000001"]);
    expect(result.report.skipped.some((skip) => skip.reason.includes("npi"))).toBe(true);
    expect(result.report.skipped.some((skip) => skip.reason.includes("body"))).toBe(true);
    expect(result.report.skipped.some((skip) => skip.reason.includes("note_date"))).toBe(true);
  });

  it("accepts two valid rows that share an NPI", () => {
    const result = parseCrmNotes(
      csv(noteHeader, [
        noteRow({ npi: "1600000004", body: "First visit: concerned about turnaround time." }),
        noteRow({ npi: "1600000004", body: "Follow-up: still comparing to Guardant liquid." }),
      ]),
    );
    expect(result.report.acceptedNotes).toBe(2);
    expect(result.report.skipped).toEqual([]);
    expect(result.notes.map((note) => note.body)).toEqual([
      "First visit: concerned about turnaround time.",
      "Follow-up: still comparing to Guardant liquid.",
    ]);
  });

  it("ignores extra TAT or rank columns", () => {
    const result = parseCrmNotes(
      csv([...noteHeader, "tat_days", "rank"], [noteRow({ extra: ["6", "1"] })]),
    );
    expect(result.report.acceptedNotes).toBe(1);
    expect(result.notes[0]).not.toHaveProperty("tat_days");
    expect(result.notes[0]).not.toHaveProperty("rank");
    expect(result.notes[0]?.npi).toBe("1600000004");
  });
});

describe("notesForNpi and coverage helpers", () => {
  const notes = parseCrmNotes(
    csv(noteHeader, [
      noteRow({ npi: "1600000004", body: "Concerned about turnaround time." }),
      noteRow({ npi: "1600000004", body: "Still using Guardant liquid." }),
      noteRow({ npi: "1600000001", body: "Already orders Tempus tissue." }),
    ]),
  ).notes;

  it("returns only notes for 1600000004", () => {
    const matched = notesForNpi("1600000004", notes);
    expect(matched).toHaveLength(2);
    expect(matched.every((note) => note.npi === "1600000004")).toBe(true);
  });

  it("returns no notes for 1699999999", () => {
    expect(notesForNpi("1699999999", notes)).toEqual([]);
  });

  it("returns both notes when two share an NPI", () => {
    expect(notesForNpi("1600000004", notes).map((note) => note.body)).toEqual([
      "Concerned about turnaround time.",
      "Still using Guardant liquid.",
    ]);
  });

  it("reports a reserved NPI with no notes as uncovered", () => {
    expect(reservedNpisWithoutNotes(["1600000004", "1600000008"], notes)).toEqual(["1600000008"]);
  });

  it("reports a note NPI not in the reserved set as extra", () => {
    const extra = notesOutsideReservedSet(["1600000004"], notes);
    expect(extra.map((note) => note.npi)).toEqual(["1600000001"]);
  });
});

describe("loadCrmNotes", () => {
  it("throws when the fixture path is missing", () => {
    expect(() => loadCrmNotes("/tmp/crm-notes-missing.csv")).toThrow(MissingFixtureError);
  });
});
