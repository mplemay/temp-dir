import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { loadCrmNotes } from "../src/lib/crm-notes/load";
import { loadMarketIntelligence } from "../src/lib/market-intelligence/load";
import { loadProductKnowledge } from "../src/lib/product-knowledge/load";
import {
  generateBriefsArtifact,
  writeBriefsArtifact,
  type StructuredParseClient,
} from "../src/lib/provider-briefs/generate";
import { defaultArtifactPath } from "../src/lib/provider-briefs/load";
import { loadRankedProviders } from "../src/lib/ranked-providers/load";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(): void {
  const envPath = join(rootDir, ".env");
  if (!existsSync(envPath)) {
    return;
  }
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator <= 0) {
      continue;
    }
    const key = trimmed.slice(0, separator);
    const value = trimmed.slice(separator + 1).replace(/^['"]|['"]$/g, "");
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function printHelp(): void {
  console.log(`Usage: vp run generate-briefs

Generate src/data/provider-briefs/briefs.json from the ranked list and committed feeds.

Requires OPENAI_API_KEY (environment or .env). The site runtime does not use this key.
`);
}

function createOpenAIClient(): StructuredParseClient {
  const openai = new OpenAI();
  return {
    async parseJson({ schemaName, schema, system, user }) {
      const response = await openai.responses.parse({
        model: "gpt-6-luna",
        reasoning: { effort: "medium" },
        input: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        text: { format: zodTextFormat(schema, schemaName) },
      });
      if (response.output_parsed == null) {
        throw new Error(`OpenAI ${schemaName} returned no parsed output`);
      }
      return response.output_parsed;
    },
  };
}

async function main(): Promise<void> {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printHelp();
    return;
  }

  loadEnvFile();
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is required to generate src/data/provider-briefs/briefs.json");
    process.exitCode = 1;
    return;
  }

  const ranked = loadRankedProviders();
  const market = loadMarketIntelligence();
  const notes = loadCrmNotes();
  const product = loadProductKnowledge();
  const artifact = await generateBriefsArtifact({
    ranked: ranked.providers,
    providers: market.providers,
    notes: notes.notes,
    assays: product.assays,
    client: createOpenAIClient(),
  });
  writeBriefsArtifact(defaultArtifactPath, artifact);
  console.log(`Wrote ${defaultArtifactPath} (${artifact.briefs.length} briefs)`);
}

await main();
