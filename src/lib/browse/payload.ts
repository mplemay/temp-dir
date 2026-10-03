import type { Readiness } from "@/lib/ranked-providers/schema";

export type RankedListRow = {
  rank: number;
  npi: string;
  full_name: string;
  org_name: string;
  primary_tumor_focus: string;
  incumbent_lab: string;
  readiness: Readiness;
  opportunity_patients: number;
  why_now: string;
};

export type BriefAssayPayload = {
  test_id: string;
  display_name: string;
  tat_days: number | null;
  gene_count: number | null;
};

export type BriefEventPayload = {
  headline: string;
  event_date: string;
  tumor_type: string;
};

export type BriefNotePayload = {
  note_date: string;
  body: string;
};

export type BriefPagePayload = {
  npi: string;
  full_name: string;
  specialty: string;
  org_name: string;
  city: string;
  state: string;
  primary_tumor_focus: string;
  incumbent_lab: string;
  rank: number;
  opportunity_patients: number;
  why_now: string;
  readiness: Readiness;
  concern: string;
  interest: string;
  impact_score: number;
  matched_events: BriefEventPayload[];
  crm_notes: BriefNotePayload[];
  assays: BriefAssayPayload[];
  meeting_script: string;
  objection_response: string;
};

export function toRankedListRow(provider: RankedListRow): RankedListRow {
  return {
    rank: provider.rank,
    npi: provider.npi,
    full_name: provider.full_name,
    org_name: provider.org_name,
    primary_tumor_focus: provider.primary_tumor_focus,
    incumbent_lab: provider.incumbent_lab,
    readiness: provider.readiness,
    opportunity_patients: provider.opportunity_patients,
    why_now: provider.why_now,
  };
}

export function toBriefPagePayload(brief: BriefPagePayload): BriefPagePayload {
  return {
    npi: brief.npi,
    full_name: brief.full_name,
    specialty: brief.specialty,
    org_name: brief.org_name,
    city: brief.city,
    state: brief.state,
    primary_tumor_focus: brief.primary_tumor_focus,
    incumbent_lab: brief.incumbent_lab,
    rank: brief.rank,
    opportunity_patients: brief.opportunity_patients,
    why_now: brief.why_now,
    readiness: brief.readiness,
    concern: brief.concern,
    interest: brief.interest,
    impact_score: brief.impact_score,
    matched_events: brief.matched_events.map((event) => ({
      headline: event.headline,
      event_date: event.event_date,
      tumor_type: event.tumor_type,
    })),
    crm_notes: brief.crm_notes.map((note) => ({
      note_date: note.note_date,
      body: note.body,
    })),
    assays: brief.assays.map((assay) => ({
      test_id: assay.test_id,
      display_name: assay.display_name,
      tat_days: assay.tat_days,
      gene_count: assay.gene_count,
    })),
    meeting_script: brief.meeting_script,
    objection_response: brief.objection_response,
  };
}
