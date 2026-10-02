import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import { formatZodIssue, noteRowSchema, type AcceptedNote, type SkipRecord } from "./schema";

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "../../data/crm-notes");

export const defaultFixturePath = join(fixtureDir, "notes.csv");

export class MissingFixtureError extends Error {
  readonly path: string;

  constructor(path: string) {
    super(`CRM notes fixture could not be loaded: ${path}`);
    this.name = "MissingFixtureError";
    this.path = path;
  }
}

export type LoadResult = {
  notes: AcceptedNote[];
  report: {
    acceptedNotes: number;
    skipped: SkipRecord[];
  };
};

function parseCsvRecords(csv: string): Record<string, string>[] {
  return parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    bom: true,
  }) as Record<string, string>[];
}

export function parseCrmNotes(csv: string, source = "notes.csv"): LoadResult {
  const skipped: SkipRecord[] = [];
  const notes: AcceptedNote[] = [];

  for (const [index, record] of parseCsvRecords(csv).entries()) {
    const result = noteRowSchema.safeParse(record);
    if (!result.success) {
      skipped.push({
        source,
        line: index + 2,
        reason: formatZodIssue(result.error),
      });
      continue;
    }
    notes.push(result.data);
  }

  return {
    notes,
    report: {
      acceptedNotes: notes.length,
      skipped,
    },
  };
}

export function loadCrmNotes(path: string = defaultFixturePath): LoadResult {
  if (!existsSync(path)) {
    throw new MissingFixtureError(path);
  }
  return parseCrmNotes(readFileSync(path, "utf8"), path);
}

export function notesForNpi(npi: string, notes: AcceptedNote[]): AcceptedNote[] {
  return notes.filter((note) => note.npi === npi);
}

export function reservedNpisWithoutNotes(reservedNpis: string[], notes: AcceptedNote[]): string[] {
  const noted = new Set(notes.map((note) => note.npi));
  return reservedNpis.filter((npi) => !noted.has(npi));
}

export function notesOutsideReservedSet(
  reservedNpis: string[],
  notes: AcceptedNote[],
): AcceptedNote[] {
  const reserved = new Set(reservedNpis);
  return notes.filter((note) => !reserved.has(note.npi));
}
