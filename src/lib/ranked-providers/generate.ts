import { writeFileSync } from "node:fs";
import { notesForNpi } from "../crm-notes/load";
import type { AcceptedNote } from "../crm-notes/schema";
import { eventTokens, resolveAssays } from "../product-knowledge/load";
import type { AcceptedAssay } from "../product-knowledge/schema";
import type { AcceptedProvider } from "../market-intelligence/schema";
import { assertGroundedWhyNow } from "./grounding";
import { compareImpact, scoreProvider } from "./score";
import type { RankedArtifact, RankedRow, Readiness } from "./schema";
import { z } from "zod";

export const MODEL = "gpt-6-luna";
export const REASONING_EFFORT = "medium";
export const AS_OF = "2026-10-02";

export const extractedSignalSchema = z.object({
  npi: z.string().regex(/^\d{10}$/),
  readiness: z.enum(["switch", "expand", "retain"]),
  concern: z.string().min(1),
  interest: z.string().min(1),
});

export const extractResponseSchema = z.object({
  signals: z.array(extractedSignalSchema),
});

export const whyNowItemSchema = z.object({
  npi: z.string().regex(/^\d{10}$/),
  why_now: z.string().min(1),
});

export const explainResponseSchema = z.object({
  explanations: z.array(whyNowItemSchema),
});

export type StructuredParseClient = {
  parseJson: <T>(input: {
    schemaName: string;
    schema: z.ZodType<T>;
    system: string;
    user: string;
  }) => Promise<T>;
};

const EXTRACT_SYSTEM = `You extract sales-readiness signals from CRM notes for Tempus oncology reps.
Return one signal per NPI.
readiness must be switch (open to changing labs), expand (already uses Tempus and there is room to add a test), or retain (already uses Tempus and wants operational follow-through, not a new assay pitch).
Use only the note text. Do not invent patient volumes, ranks, turnaround times, gene counts, or accuracy.`;

const EXPLAIN_SYSTEM = `Write one sentence "Why Tempus, Why Now" for each provider.
Do not change ranks or scores.
Do not invent a numeric turnaround time, gene count, or accuracy claim.
If those numbers are absent from the packet, omit them.
Ground each sentence in the packet only: tumor focus, incumbent, matched event headlines, extracted concern/interest, and assay display names.`;

type ScoredDraft = {
  npi: string;
  impact_score: number;
  score_breakdown: RankedRow["score_breakdown"];
  readiness: Readiness;
  concern: string;
  interest: string;
  has_crm: boolean;
  opportunity_patients: number;
  tat_days: Array<number | null>;
  gene_count: Array<number | null>;
};

function assayFacts(provider: AcceptedProvider, assays: AcceptedAssay[]): AcceptedAssay[] {
  const seen = new Set<string>();
  const matched: AcceptedAssay[] = [];
  for (const event of provider.matched_events) {
    for (const token of eventTokens(event.relevant_tests)) {
      for (const assay of resolveAssays(token, assays)) {
        if (seen.has(assay.test_id)) {
          continue;
        }
        seen.add(assay.test_id);
        matched.push(assay);
      }
    }
  }
  return matched;
}

async function parseChecked<T>(
  client: StructuredParseClient,
  input: {
    schemaName: string;
    schema: z.ZodType<T>;
    system: string;
    user: string;
  },
): Promise<T> {
  const parsed = input.schema.safeParse(
    await client.parseJson({
      schemaName: input.schemaName,
      schema: input.schema,
      system: input.system,
      user: input.user,
    }),
  );
  if (!parsed.success) {
    throw new Error(`OpenAI ${input.schemaName} output failed schema validation`);
  }
  return parsed.data;
}

export async function extractCrmSignals(
  notes: AcceptedNote[],
  client: StructuredParseClient,
): Promise<Map<string, z.infer<typeof extractedSignalSchema>>> {
  const notedNpis = [...new Set(notes.map((note) => note.npi))];
  if (notedNpis.length === 0) {
    return new Map();
  }

  const payload = extractResponseSchema.parse(
    await parseChecked(client, {
      schemaName: "crm_signals",
      schema: extractResponseSchema,
      system: EXTRACT_SYSTEM,
      user: JSON.stringify(
        notes.map((note) => ({ npi: note.npi, note_date: note.note_date, body: note.body })),
      ),
    }),
  );

  const byNpi = new Map(payload.signals.map((signal) => [signal.npi, signal]));
  for (const npi of notedNpis) {
    if (!byNpi.has(npi)) {
      throw new Error(`OpenAI extract omitted NPI ${npi}`);
    }
  }
  return byNpi;
}

export async function generateRankedArtifact(input: {
  providers: AcceptedProvider[];
  notes: AcceptedNote[];
  assays: AcceptedAssay[];
  client: StructuredParseClient;
  now?: Date;
}): Promise<RankedArtifact> {
  const signals = await extractCrmSignals(input.notes, input.client);
  const drafts: ScoredDraft[] = [];

  for (const provider of input.providers) {
    const providerNotes = notesForNpi(provider.npi, input.notes);
    const extracted = signals.get(provider.npi);
    if (providerNotes.length > 0 && !extracted) {
      throw new Error(`OpenAI extract omitted NPI ${provider.npi}`);
    }

    const scored = scoreProvider({
      opportunity_patients: provider.opportunity_patients,
      est_ngs_testing_rate: provider.est_ngs_testing_rate,
      incumbent_lab: provider.incumbent_lab,
      has_matched_events: provider.matched_events.length > 0,
      readiness: extracted?.readiness ?? "unknown",
    });
    const assays = assayFacts(provider, input.assays);
    drafts.push({
      npi: provider.npi,
      impact_score: scored.impact_score,
      score_breakdown: scored.score_breakdown,
      readiness: scored.readiness,
      concern: extracted?.concern ?? "",
      interest: extracted?.interest ?? "",
      has_crm: providerNotes.length > 0,
      opportunity_patients: provider.opportunity_patients,
      tat_days: assays.map((assay) => assay.tat_days),
      gene_count: assays.map((assay) => assay.gene_count),
    });
  }

  drafts.sort(compareImpact);

  const packets = drafts.map((draft, index) => {
    const provider = input.providers.find((row) => row.npi === draft.npi);
    if (!provider) {
      throw new Error(`scored NPI ${draft.npi} missing from providers`);
    }
    const assays = assayFacts(provider, input.assays);
    return {
      rank: index + 1,
      npi: draft.npi,
      org_name: provider.org_name,
      primary_tumor_focus: provider.primary_tumor_focus,
      incumbent_lab: provider.incumbent_lab,
      opportunity_patients: provider.opportunity_patients,
      score_breakdown: draft.score_breakdown,
      readiness: draft.readiness,
      concern: draft.concern,
      interest: draft.interest,
      matched_event_headlines: provider.matched_events.map((event) => event.headline),
      assays: assays.map((assay) => ({
        display_name: assay.display_name,
        ...(assay.tat_days == null ? {} : { tat_days: assay.tat_days }),
        ...(assay.gene_count == null ? {} : { gene_count: assay.gene_count }),
      })),
    };
  });

  const explained = explainResponseSchema.parse(
    await parseChecked(input.client, {
      schemaName: "why_now",
      schema: explainResponseSchema,
      system: EXPLAIN_SYSTEM,
      user: JSON.stringify(packets),
    }),
  );

  const whyNowByNpi = new Map(explained.explanations.map((item) => [item.npi, item.why_now]));
  const providers: RankedRow[] = drafts.map((draft, index) => {
    const whyNow = whyNowByNpi.get(draft.npi);
    if (!whyNow) {
      throw new Error(`OpenAI explain omitted NPI ${draft.npi}`);
    }
    assertGroundedWhyNow(whyNow, { tat_days: draft.tat_days, gene_count: draft.gene_count });
    return {
      rank: index + 1,
      npi: draft.npi,
      impact_score: draft.impact_score,
      score_breakdown: draft.score_breakdown,
      readiness: draft.readiness,
      concern: draft.concern,
      interest: draft.interest,
      why_now: whyNow,
      has_crm: draft.has_crm,
    };
  });

  return {
    generated_at: (input.now ?? new Date()).toISOString(),
    model: MODEL,
    reasoning_effort: REASONING_EFFORT,
    as_of: AS_OF,
    providers,
  };
}

export function writeRankedArtifact(path: string, artifact: RankedArtifact): void {
  writeFileSync(path, `${JSON.stringify(artifact, null, 2)}\n`);
}
