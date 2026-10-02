import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { assayDocumentSchema, formatZodIssue, type AcceptedAssay, type SkipRecord } from "./schema";

export const defaultFixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../data/product-knowledge",
);

export class MissingFixtureError extends Error {
  readonly path: string;

  constructor(path: string) {
    super(`Product knowledge fixture could not be loaded: ${path}`);
    this.name = "MissingFixtureError";
    this.path = path;
  }
}

export type LoadResult = {
  assays: AcceptedAssay[];
  report: {
    acceptedAssays: number;
    skipped: SkipRecord[];
  };
};

export function eventTokens(relevantTests: string): string[] {
  return relevantTests
    .split(";")
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

export function resolveAssays(token: string, assays: AcceptedAssay[]): AcceptedAssay[] {
  return assays.filter((assay) => assay.aliases.includes(token));
}

export function unresolvedEventTokens(
  relevantTestsFields: string[],
  assays: AcceptedAssay[],
): string[] {
  const seen = new Set<string>();
  const missing: string[] = [];
  for (const field of relevantTestsFields) {
    for (const token of eventTokens(field)) {
      if (seen.has(token)) {
        continue;
      }
      seen.add(token);
      if (resolveAssays(token, assays).length === 0) {
        missing.push(token);
      }
    }
  }
  return missing;
}

function isFixtureDirectory(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory();
}

export type AssayDocument = {
  source: string;
  text: string;
};

function documentName(source: string): string {
  const parts = source.split(/[/\\]/);
  return parts[parts.length - 1] ?? source;
}

export function parseProductKnowledgeDocuments(documents: AssayDocument[]): LoadResult {
  const assays: AcceptedAssay[] = [];
  const skipped: SkipRecord[] = [];
  const seenIds = new Set<string>();

  const ordered = [...documents].sort((left, right) =>
    documentName(left.source).localeCompare(documentName(right.source)),
  );

  for (const document of ordered) {
    const parsed = matter(document.text);
    const result = assayDocumentSchema.safeParse({
      ...parsed.data,
      body: parsed.content,
    });
    if (!result.success) {
      skipped.push({ source: document.source, reason: formatZodIssue(result.error) });
      continue;
    }
    if (seenIds.has(result.data.test_id)) {
      skipped.push({ source: document.source, reason: "test_id: duplicate" });
      continue;
    }
    seenIds.add(result.data.test_id);
    assays.push(result.data);
  }

  return {
    assays,
    report: {
      acceptedAssays: assays.length,
      skipped,
    },
  };
}

export function loadProductKnowledge(directory: string = defaultFixtureDir): LoadResult {
  if (!isFixtureDirectory(directory)) {
    throw new MissingFixtureError(directory);
  }

  const files = readdirSync(directory).filter((name) => name.endsWith(".md"));
  return parseProductKnowledgeDocuments(
    files.map((name) => ({
      source: join(directory, name),
      text: readFileSync(join(directory, name), "utf8"),
    })),
  );
}
