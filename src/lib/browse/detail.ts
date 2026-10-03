import { notesWithClinicianNames, type ProviderName } from "./display";
import type { AcceptedNote } from "@/lib/crm-notes/schema";
import type { AcceptedEvent } from "@/lib/market-intelligence/schema";
import { eventTokens, resolveAssays } from "@/lib/product-knowledge/load";
import type { AcceptedAssay } from "@/lib/product-knowledge/schema";

export type AssayPagePayload = AcceptedAssay;

export type EventAssayLink = {
  test_id: string;
  display_name: string;
};

export type EventPagePayload = {
  event_id: string;
  tumor_type: AcceptedEvent["tumor_type"];
  event_date: string;
  headline: string;
  why_now: string;
  assays: EventAssayLink[];
};

export type NoteSibling = {
  note_id: string;
  note_date: string;
  body: string;
};

export type NotePagePayload = AcceptedNote & {
  clinician_name: string | null;
  siblings: NoteSibling[];
};

export function toAssayPagePayload(assay: AcceptedAssay): AssayPagePayload {
  return {
    test_id: assay.test_id,
    display_name: assay.display_name,
    aliases: [...assay.aliases],
    specimen: assay.specimen,
    regulatory_status: assay.regulatory_status,
    gene_count: assay.gene_count,
    tat_days: assay.tat_days,
    tat_qualifier: assay.tat_qualifier,
    source_url: assay.source_url,
    retrieved_on: assay.retrieved_on,
    body: assay.body,
  };
}

export function toEventPagePayload(
  event: AcceptedEvent,
  assays: AcceptedAssay[],
): EventPagePayload {
  const seen = new Set<string>();
  const linked: EventAssayLink[] = [];
  for (const token of eventTokens(event.relevant_tests)) {
    for (const assay of resolveAssays(token, assays)) {
      if (seen.has(assay.test_id)) {
        continue;
      }
      seen.add(assay.test_id);
      linked.push({ test_id: assay.test_id, display_name: assay.display_name });
    }
  }
  return {
    event_id: event.event_id,
    tumor_type: event.tumor_type,
    event_date: event.event_date,
    headline: event.headline,
    why_now: event.why_now,
    assays: linked,
  };
}

export function toNotePagePayload(
  note: AcceptedNote,
  notes: AcceptedNote[],
  providers: ProviderName[],
): NotePagePayload {
  const siblings = notes
    .filter((row) => row.npi === note.npi && row.note_id !== note.note_id)
    .sort((left, right) => right.note_date.localeCompare(left.note_date))
    .map((row) => ({
      note_id: row.note_id,
      note_date: row.note_date,
      body: row.body,
    }));
  const [named] = notesWithClinicianNames([note], providers);
  return {
    ...(named ?? { ...note, clinician_name: null }),
    siblings,
  };
}
