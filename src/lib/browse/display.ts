import type { AcceptedNote } from "@/lib/crm-notes/schema";

export type ProviderName = {
  npi: string;
  full_name: string;
};

export type NoteWithClinicianName = AcceptedNote & {
  clinician_name: string | null;
};

export function notesWithClinicianNames(
  notes: AcceptedNote[],
  providers: ProviderName[],
): NoteWithClinicianName[] {
  const namesByNpi = new Map(providers.map((provider) => [provider.npi, provider.full_name]));
  return notes.map((note) => ({
    ...note,
    clinician_name: namesByNpi.get(note.npi) ?? null,
  }));
}

export function unpublishedMetric(value: number | null): string {
  return value === null ? "" : String(value);
}
