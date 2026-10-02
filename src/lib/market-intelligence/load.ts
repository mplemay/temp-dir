import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import { deriveOpportunity } from "./derive";
import {
  eventRowSchema,
  formatZodIssue,
  providerRowSchema,
  type AcceptedEvent,
  type AcceptedProvider,
  type SkipRecord,
} from "./schema";

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "../../data/market-intelligence");

export const defaultFixturePaths = {
  providers: join(fixtureDir, "providers.csv"),
  events: join(fixtureDir, "events.csv"),
};

export class MissingFixtureError extends Error {
  readonly path: string;

  constructor(path: string) {
    super(`Market intelligence fixture could not be loaded: ${path}`);
    this.name = "MissingFixtureError";
    this.path = path;
  }
}

export type LoadResult = {
  providers: AcceptedProvider[];
  events: AcceptedEvent[];
  report: {
    acceptedProviders: number;
    acceptedEvents: number;
    skipped: SkipRecord[];
  };
};

export type FixturePaths = {
  providers: string;
  events: string;
};

function readFixture(path: string): string {
  if (!existsSync(path)) {
    throw new MissingFixtureError(path);
  }
  return readFileSync(path, "utf8");
}

function parseCsvRecords(csv: string): Record<string, string>[] {
  return parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    bom: true,
  }) as Record<string, string>[];
}

function matchEvents(
  focus: AcceptedProvider["primary_tumor_focus"],
  events: AcceptedEvent[],
): AcceptedEvent[] {
  if (focus === "mixed") {
    return events;
  }
  return events.filter((event) => event.tumor_type === focus);
}

export function parseMarketIntelligence(
  providerCsv: string,
  eventCsv: string,
  sources: { providers?: string; events?: string } = {},
): LoadResult {
  const providerSource = sources.providers ?? "providers.csv";
  const eventSource = sources.events ?? "events.csv";
  const skipped: SkipRecord[] = [];

  const events: AcceptedEvent[] = [];
  for (const [index, record] of parseCsvRecords(eventCsv).entries()) {
    const result = eventRowSchema.safeParse(record);
    if (!result.success) {
      skipped.push({
        source: eventSource,
        line: index + 2,
        reason: formatZodIssue(result.error),
      });
      continue;
    }
    events.push(result.data);
  }

  const seenNpi = new Set<string>();
  const providers: AcceptedProvider[] = [];
  for (const [index, record] of parseCsvRecords(providerCsv).entries()) {
    const line = index + 2;
    const result = providerRowSchema.safeParse(record);
    if (!result.success) {
      skipped.push({
        source: providerSource,
        line,
        reason: formatZodIssue(result.error),
      });
      continue;
    }
    if (seenNpi.has(result.data.npi)) {
      skipped.push({
        source: providerSource,
        line,
        reason: "npi: duplicate",
      });
      continue;
    }
    seenNpi.add(result.data.npi);
    const opportunity = deriveOpportunity(result.data);
    providers.push({
      ...result.data,
      ...opportunity,
      matched_events: matchEvents(result.data.primary_tumor_focus, events),
    });
  }

  return {
    providers,
    events,
    report: {
      acceptedProviders: providers.length,
      acceptedEvents: events.length,
      skipped,
    },
  };
}

export function loadMarketIntelligence(paths: FixturePaths = defaultFixturePaths): LoadResult {
  const providerCsv = readFixture(paths.providers);
  const eventCsv = readFixture(paths.events);
  return parseMarketIntelligence(providerCsv, eventCsv, {
    providers: paths.providers,
    events: paths.events,
  });
}
