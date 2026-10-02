import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCrmNotes, notesForNpi } from "../crm-notes/load";
import type { AcceptedNote } from "../crm-notes/schema";
import { loadMarketIntelligence } from "../market-intelligence/load";
import type { AcceptedEvent, AcceptedProvider } from "../market-intelligence/schema";
import { eventTokens, loadProductKnowledge, resolveAssays } from "../product-knowledge/load";
import type { AcceptedAssay } from "../product-knowledge/schema";
import { loadRankedProviders, type RankedProviderView } from "../ranked-providers/load";
import { briefsArtifactSchema, formatZodIssue, type BriefRow, type BriefsArtifact } from "./schema";

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "../../data/provider-briefs");

export const defaultArtifactPath = join(fixtureDir, "briefs.json");

export class MissingFixtureError extends Error {
  readonly path: string;

  constructor(path: string) {
    super(`Provider briefs artifact could not be loaded: ${path}`);
    this.name = "MissingFixtureError";
    this.path = path;
  }
}

export class BriefCoverageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BriefCoverageError";
  }
}

export class BriefNotFoundError extends Error {
  readonly npi: string;

  constructor(npi: string) {
    super(`No brief found for NPI ${npi}`);
    this.name = "BriefNotFoundError";
    this.npi = npi;
  }
}

export type RelatedAssay = {
  display_name: string;
  tat_days: number | null;
  gene_count: number | null;
};

export type ProviderBriefView = BriefRow & {
  full_name: string;
  specialty: AcceptedProvider["specialty"];
  org_name: string;
  org_type: AcceptedProvider["org_type"];
  health_system: string;
  city: string;
  state: string;
  primary_tumor_focus: AcceptedProvider["primary_tumor_focus"];
  incumbent_lab: AcceptedProvider["incumbent_lab"];
  rank: number;
  impact_score: number;
  opportunity_patients: number;
  why_now: string;
  concern: string;
  interest: string;
  readiness: RankedProviderView["readiness"];
  has_crm: boolean;
  matched_events: AcceptedEvent[];
  crm_notes: AcceptedNote[];
  assays: RelatedAssay[];
};

export type LoadResult = {
  artifact: BriefsArtifact;
  briefs: ProviderBriefView[];
};

export type LoadOptions = {
  artifactPath?: string;
  ranked?: RankedProviderView[];
  providers?: AcceptedProvider[];
  notes?: AcceptedNote[];
  assays?: AcceptedAssay[];
};

export function assaysForProvider(
  provider: AcceptedProvider,
  assays: AcceptedAssay[],
): AcceptedAssay[] {
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

function readArtifact(path: string): string {
  if (!existsSync(path)) {
    throw new MissingFixtureError(path);
  }
  return readFileSync(path, "utf8");
}

function joinBrief(
  row: BriefRow,
  ranked: RankedProviderView,
  provider: AcceptedProvider,
  notes: AcceptedNote[],
  assays: AcceptedAssay[],
): ProviderBriefView {
  return {
    ...row,
    full_name: ranked.full_name,
    specialty: provider.specialty,
    org_name: ranked.org_name,
    org_type: provider.org_type,
    health_system: provider.health_system,
    city: provider.city,
    state: provider.state,
    primary_tumor_focus: ranked.primary_tumor_focus,
    incumbent_lab: ranked.incumbent_lab,
    rank: ranked.rank,
    impact_score: ranked.impact_score,
    opportunity_patients: ranked.opportunity_patients,
    why_now: ranked.why_now,
    concern: ranked.concern,
    interest: ranked.interest,
    readiness: ranked.readiness,
    has_crm: ranked.has_crm,
    matched_events: provider.matched_events,
    crm_notes: notesForNpi(ranked.npi, notes),
    assays: assaysForProvider(provider, assays).map((assay) => ({
      display_name: assay.display_name,
      tat_days: assay.tat_days,
      gene_count: assay.gene_count,
    })),
  };
}

export function parseProviderBriefs(
  json: string,
  ranked: RankedProviderView[],
  providers: AcceptedProvider[],
  notes: AcceptedNote[],
  assays: AcceptedAssay[],
): LoadResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new BriefCoverageError("briefs artifact is not valid JSON");
  }

  const result = briefsArtifactSchema.safeParse(parsed);
  if (!result.success) {
    throw new BriefCoverageError(formatZodIssue(result.error));
  }

  const rankedByNpi = new Map(ranked.map((row) => [row.npi, row]));
  const providerByNpi = new Map(providers.map((row) => [row.npi, row]));
  const briefByNpi = new Map(result.data.briefs.map((row) => [row.npi, row]));
  const briefNpis = new Set(briefByNpi.keys());
  const rankedNpis = new Set(rankedByNpi.keys());

  for (const npi of briefNpis) {
    if (!rankedNpis.has(npi)) {
      throw new BriefCoverageError(`brief NPI ${npi} is not in the ranked list`);
    }
  }
  for (const npi of rankedNpis) {
    if (!briefNpis.has(npi)) {
      throw new BriefCoverageError(`ranked NPI ${npi} is missing from the briefs artifact`);
    }
  }

  const briefs = [...ranked]
    .sort((left, right) => left.rank - right.rank)
    .map((rankedRow) => {
      const brief = briefByNpi.get(rankedRow.npi);
      const provider = providerByNpi.get(rankedRow.npi);
      if (!brief) {
        throw new BriefCoverageError(
          `ranked NPI ${rankedRow.npi} is missing from the briefs artifact`,
        );
      }
      if (!provider) {
        throw new BriefCoverageError(`ranked NPI ${rankedRow.npi} is not an accepted provider`);
      }
      return joinBrief(brief, rankedRow, provider, notes, assays);
    });

  return { artifact: result.data, briefs };
}

export function loadProviderBriefs(options: LoadOptions = {}): LoadResult {
  const artifactPath = options.artifactPath ?? defaultArtifactPath;
  const ranked = options.ranked ?? loadRankedProviders().providers;
  const providers = options.providers ?? loadMarketIntelligence().providers;
  const notes = options.notes ?? loadCrmNotes().notes;
  const assays = options.assays ?? loadProductKnowledge().assays;
  return parseProviderBriefs(readArtifact(artifactPath), ranked, providers, notes, assays);
}

export function loadProviderBrief(npi: string, options: LoadOptions = {}): ProviderBriefView {
  const loaded = loadProviderBriefs(options);
  const brief = loaded.briefs.find((row) => row.npi === npi);
  if (!brief) {
    throw new BriefNotFoundError(npi);
  }
  return brief;
}
