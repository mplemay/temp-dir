import { writeFileSync } from "node:fs";
import { z } from "zod";
import { notesForNpi } from "../crm-notes/load";
import type { AcceptedNote } from "../crm-notes/schema";
import type { AcceptedProvider } from "../market-intelligence/schema";
import type { AcceptedAssay } from "../product-knowledge/schema";
import { assertGroundedCopy } from "../ranked-providers/grounding";
import type { RankedProviderView } from "../ranked-providers/load";
import { assaysForProvider } from "./load";
import { briefsArtifactSchema, type BriefsArtifact } from "./schema";

export const MODEL = "gpt-6-luna";
export const REASONING_EFFORT = "medium";
export const AS_OF = "2026-10-02";

export const generatedBriefSchema = z.object({
  npi: z.string().regex(/^\d{10}$/),
  meeting_script: z.string().min(1),
  objection_response: z.string(),
});

export const generateResponseSchema = z.object({
  briefs: z.array(generatedBriefSchema),
});

export type StructuredParseClient = {
  parseJson: <T>(input: {
    schemaName: string;
    schema: z.ZodType<T>;
    system: string;
    user: string;
  }) => Promise<T>;
};

const BRIEF_SYSTEM = `You write Tempus sales-copilot briefs for oncology reps.
Return one brief per NPI in the packet.
meeting_script is a spoken 30-second elevator pitch (about 75 words) tailored to that doctor's tumor focus, incumbent lab, why-now line, and extracted interest when present.
objection_response: if concern is a real sales concern, draft a reply that addresses it using only assay metrics present in the packet. If concern is empty or says that no concern or no preference was stated, return an empty string.
Do not invent a numeric turnaround time, gene count, or accuracy claim. If those numbers are absent from the packet, omit them.
Do not invent a concern that is not in the packet.
Do not change ranks or scores.`;

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

function assayPacket(assays: AcceptedAssay[]) {
  return assays.map((assay) => ({
    display_name: assay.display_name,
    ...(assay.tat_days == null ? {} : { tat_days: assay.tat_days }),
    ...(assay.gene_count == null ? {} : { gene_count: assay.gene_count }),
  }));
}

function hasKnownConcern(concern: string): boolean {
  const trimmed = concern.trim();
  if (trimmed.length === 0) {
    return false;
  }
  return !(/^no\b/i.test(trimmed) && /stated/i.test(trimmed));
}

export async function generateBriefsArtifact(input: {
  ranked: RankedProviderView[];
  providers: AcceptedProvider[];
  notes: AcceptedNote[];
  assays: AcceptedAssay[];
  client: StructuredParseClient;
  now?: Date;
}): Promise<BriefsArtifact> {
  const providerByNpi = new Map(input.providers.map((provider) => [provider.npi, provider]));
  const packets = [...input.ranked]
    .sort((left, right) => left.rank - right.rank)
    .map((ranked) => {
      const provider = providerByNpi.get(ranked.npi);
      if (!provider) {
        throw new Error(`ranked NPI ${ranked.npi} is not an accepted provider`);
      }
      const assays = assaysForProvider(provider, input.assays);
      return {
        npi: ranked.npi,
        org_name: ranked.org_name,
        specialty: provider.specialty,
        primary_tumor_focus: ranked.primary_tumor_focus,
        incumbent_lab: ranked.incumbent_lab,
        why_now: ranked.why_now,
        concern: ranked.concern,
        interest: ranked.interest,
        matched_event_headlines: provider.matched_events.map((event) => event.headline),
        crm_notes: notesForNpi(ranked.npi, input.notes).map((note) => ({
          note_date: note.note_date,
          body: note.body,
        })),
        assays: assayPacket(assays),
        tat_days: assays.map((assay) => assay.tat_days),
        gene_count: assays.map((assay) => assay.gene_count),
      };
    });

  const generated = generateResponseSchema.parse(
    await parseChecked(input.client, {
      schemaName: "provider_briefs",
      schema: generateResponseSchema,
      system: BRIEF_SYSTEM,
      user: JSON.stringify(
        packets.map(({ tat_days: _tat, gene_count: _genes, ...packet }) => packet),
      ),
    }),
  );

  const byNpi = new Map(generated.briefs.map((brief) => [brief.npi, brief]));
  const briefs = packets.map((packet) => {
    const generatedBrief = byNpi.get(packet.npi);
    if (!generatedBrief) {
      throw new Error(`OpenAI briefs omitted NPI ${packet.npi}`);
    }

    const knownConcern = hasKnownConcern(packet.concern);
    const objection_response = knownConcern ? generatedBrief.objection_response.trim() : "";
    if (knownConcern && objection_response.length === 0) {
      throw new Error(`OpenAI briefs omitted objection for NPI ${packet.npi}`);
    }

    const grounding = { tat_days: packet.tat_days, gene_count: packet.gene_count };
    assertGroundedCopy(generatedBrief.meeting_script, grounding, "meeting_script");
    if (objection_response.length > 0) {
      assertGroundedCopy(objection_response, grounding, "objection_response");
    }

    return {
      npi: packet.npi,
      meeting_script: generatedBrief.meeting_script,
      objection_response,
    };
  });

  return briefsArtifactSchema.parse({
    generated_at: (input.now ?? new Date()).toISOString(),
    model: MODEL,
    reasoning_effort: REASONING_EFFORT,
    as_of: AS_OF,
    briefs,
  });
}

export function writeBriefsArtifact(path: string, artifact: BriefsArtifact): void {
  writeFileSync(path, `${JSON.stringify(artifact, null, 2)}\n`);
}
