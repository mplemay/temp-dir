import { describe, expect, it } from "vite-plus/test";
import {
  loadCrmNotes,
  MissingFixtureError,
  noteForId,
  notesForNpi,
  notesOutsideReservedSet,
  parseCrmNotes,
  reservedNpisBelowMinNotes,
  reservedNpisWithoutNotes,
} from "./load";

const noteHeader = ["note_id", "npi", "note_date", "channel", "body"];

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
    note_id?: string;
    npi?: string;
    note_date?: string;
    channel?: string;
    body?: string;
    extra?: string[];
  } = {},
): string[] {
  const npi = overrides.npi ?? "1600000004";
  return [
    overrides.note_id ?? `note-${npi}`,
    npi,
    overrides.note_date ?? "2026-09-12",
    overrides.channel ?? "in_person",
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
    expect(result.notes[0]?.note_id).toBe("note-1600000004");
    expect(result.notes[0]?.channel).toBe("in_person");
  });

  it("skips bad NPI, empty body, and invalid date while keeping valid rows", () => {
    const result = parseCrmNotes(
      csv(noteHeader, [
        noteRow({
          note_id: "avery-valid",
          npi: "1600000001",
          body: "Valid note about liquid at progression.",
        }),
        noteRow({ note_id: "bad-npi", npi: "123", body: "Bad NPI row." }),
        noteRow({ note_id: "empty-body", npi: "1600000002", body: "" }),
        noteRow({ note_id: "bad-date", npi: "1600000003", note_date: "09/12/2026" }),
      ]),
    );
    expect(result.report.acceptedNotes).toBe(1);
    expect(result.notes.map((note) => note.npi)).toEqual(["1600000001"]);
    expect(result.report.skipped.some((skip) => skip.reason.includes("npi"))).toBe(true);
    expect(result.report.skipped.some((skip) => skip.reason.includes("body"))).toBe(true);
    expect(result.report.skipped.some((skip) => skip.reason.includes("note_date"))).toBe(true);
  });

  it("accepts two valid rows that share an NPI and have distinct note ids", () => {
    const result = parseCrmNotes(
      csv(noteHeader, [
        noteRow({
          note_id: "quinn-chen-tat",
          npi: "1600000004",
          body: "First visit: concerned about turnaround time.",
        }),
        noteRow({
          note_id: "quinn-chen-followup",
          npi: "1600000004",
          channel: "call",
          body: "Follow-up: still comparing to Guardant liquid.",
        }),
      ]),
    );
    expect(result.report.acceptedNotes).toBe(2);
    expect(result.report.skipped).toEqual([]);
    expect(result.notes.map((note) => note.body)).toEqual([
      "First visit: concerned about turnaround time.",
      "Follow-up: still comparing to Guardant liquid.",
    ]);
  });

  it("skips a duplicate note_id after the first row", () => {
    const result = parseCrmNotes(
      csv(noteHeader, [
        noteRow({ note_id: "dup-id", npi: "1600000001", body: "First visit about liquid." }),
        noteRow({ note_id: "dup-id", npi: "1600000002", body: "Different NPI same id." }),
      ]),
    );
    expect(result.report.acceptedNotes).toBe(1);
    expect(result.notes[0]?.npi).toBe("1600000001");
    expect(result.report.skipped).toEqual([
      expect.objectContaining({ reason: "note_id: duplicate" }),
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

describe("notesForNpi, noteForId, and coverage helpers", () => {
  const notes = parseCrmNotes(
    csv(noteHeader, [
      noteRow({
        note_id: "quinn-chen-tat",
        npi: "1600000004",
        body: "Concerned about turnaround time.",
      }),
      noteRow({
        note_id: "quinn-chen-followup",
        npi: "1600000004",
        note_date: "2026-09-20",
        channel: "call",
        body: "Still using Guardant liquid.",
      }),
      noteRow({
        note_id: "avery-chen-liquid-progression",
        npi: "1600000001",
        body: "Already orders Tempus tissue.",
      }),
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

  it("returns the note for quinn-chen-tat", () => {
    const note = noteForId("quinn-chen-tat", notes);
    expect(note?.body).toContain("turnaround time");
    expect(note?.npi).toBe("1600000004");
  });

  it("returns no note for missing-note", () => {
    expect(noteForId("missing-note", notes)).toBeUndefined();
  });

  it("reports a reserved NPI with no notes as uncovered", () => {
    expect(reservedNpisWithoutNotes(["1600000004", "1600000008"], notes)).toEqual(["1600000008"]);
  });

  it("reports a reserved NPI with only one note as below min 2", () => {
    expect(reservedNpisBelowMinNotes(["1600000004", "1600000001"], notes, 2)).toEqual([
      "1600000001",
    ]);
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
