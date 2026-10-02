import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadMarketIntelligence } from "../market-intelligence/load";
import type { AcceptedProvider } from "../market-intelligence/schema";
import {
  formatZodIssue,
  rankedArtifactSchema,
  type RankedArtifact,
  type RankedRow,
} from "./schema";

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "../../data/ranked-providers");

export const defaultArtifactPath = join(fixtureDir, "list.json");

export class MissingFixtureError extends Error {
  readonly path: string;

  constructor(path: string) {
    super(`Ranked providers artifact could not be loaded: ${path}`);
    this.name = "MissingFixtureError";
    this.path = path;
  }
}

export class RankCoverageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RankCoverageError";
  }
}

export type RankedProviderView = RankedRow & {
  full_name: string;
  org_name: string;
  primary_tumor_focus: AcceptedProvider["primary_tumor_focus"];
  incumbent_lab: AcceptedProvider["incumbent_lab"];
  opportunity_patients: number;
};

export type LoadResult = {
  artifact: RankedArtifact;
  providers: RankedProviderView[];
};

export type LoadOptions = {
  artifactPath?: string;
  providers?: AcceptedProvider[];
};

function readArtifact(path: string): string {
  if (!existsSync(path)) {
    throw new MissingFixtureError(path);
  }
  return readFileSync(path, "utf8");
}

export function parseRankedProviders(
  json: string,
  acceptedProviders: AcceptedProvider[],
): LoadResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new RankCoverageError("ranked artifact is not valid JSON");
  }

  const result = rankedArtifactSchema.safeParse(parsed);
  if (!result.success) {
    throw new RankCoverageError(formatZodIssue(result.error));
  }

  const byNpi = new Map(acceptedProviders.map((provider) => [provider.npi, provider]));
  const rankedNpis = new Set(result.data.providers.map((row) => row.npi));

  for (const row of result.data.providers) {
    if (!byNpi.has(row.npi)) {
      throw new RankCoverageError(`ranked NPI ${row.npi} is not an accepted provider`);
    }
  }
  for (const provider of acceptedProviders) {
    if (!rankedNpis.has(provider.npi)) {
      throw new RankCoverageError(
        `accepted provider ${provider.npi} is missing from the ranked list`,
      );
    }
  }

  const providers = [...result.data.providers]
    .sort((left, right) => left.rank - right.rank)
    .map((row) => {
      const provider = byNpi.get(row.npi);
      if (!provider) {
        throw new RankCoverageError(`ranked NPI ${row.npi} is not an accepted provider`);
      }
      return {
        ...row,
        full_name: provider.full_name,
        org_name: provider.org_name,
        primary_tumor_focus: provider.primary_tumor_focus,
        incumbent_lab: provider.incumbent_lab,
        opportunity_patients: provider.opportunity_patients,
      };
    });

  return { artifact: result.data, providers };
}

export function loadRankedProviders(options: LoadOptions = {}): LoadResult {
  const artifactPath = options.artifactPath ?? defaultArtifactPath;
  const accepted = options.providers ?? loadMarketIntelligence().providers;
  return parseRankedProviders(readArtifact(artifactPath), accepted);
}
