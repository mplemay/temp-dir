import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import { loadCrmNotes } from "../crm-notes/load";
import {
  defaultArtifactPath as rankedArtifactPath,
  loadRankedProviders,
} from "../ranked-providers/load";
import { defaultArtifactPath, loadProviderBriefs } from "./load";

describe("committed provider-briefs fixture", () => {
  it("covers every ranked provider with gpt-6-luna metadata", () => {
    const ranked = loadRankedProviders();
    const loaded = loadProviderBriefs();
    const rankedNpis = ranked.providers.map((row) => row.npi);
    const briefNpis = loaded.briefs.map((row) => row.npi);

    expect(loaded.artifact.model).toBe("gpt-6-luna");
    expect(loaded.artifact.reasoning_effort).toBe("medium");
    expect(briefNpis.sort()).toEqual([...rankedNpis].sort());
    expect(loaded.briefs.every((row) => row.meeting_script.trim().length > 0)).toBe(true);
  });

  it("keeps providers without CRM notes on the briefs list", () => {
    const notes = loadCrmNotes();
    const noted = new Set(notes.notes.map((note) => note.npi));
    const loaded = loadProviderBriefs();
    const withoutNotes = loaded.briefs.filter((row) => !noted.has(row.npi));

    expect(withoutNotes.length).toBeGreaterThan(0);
    expect(withoutNotes.every((row) => row.meeting_script.trim().length > 0)).toBe(true);
  });

  it("does not store brief copy on the ranked artifact", () => {
    const ranked = JSON.parse(readFileSync(rankedArtifactPath, "utf8")) as {
      providers: Array<Record<string, unknown>>;
    };
    expect(readFileSync(defaultArtifactPath, "utf8")).toContain('"meeting_script"');
    expect(ranked.providers.every((row) => !("meeting_script" in row))).toBe(true);
    expect(ranked.providers.every((row) => !("objection_response" in row))).toBe(true);
  });

  it("loads a non-empty Quinn Chen objection from the committed artifact", () => {
    const loaded = loadProviderBriefs();
    const quinn = loaded.briefs.find((row) => row.npi === "1600000004");
    expect(quinn?.objection_response.trim().length).toBeGreaterThan(0);
    expect(quinn?.objection_response).toMatch(/6-day|6 day/i);
  });

  it("composes the brief page without cards and keeps the empty-concern copy", () => {
    const source = readFileSync(
      join(fileURLToPath(new URL("../../routes/providers/$npi.tsx", import.meta.url))),
      "utf8",
    );
    expect(source).toMatch("/product-knowledge/$testId");
    expect(source).not.toMatch(/openai/);
    expect(source).not.toMatch("@/components/ui/card");
    expect(source).toMatch("@/components/ui/table");
    expect(source).toMatch("@/components/ui/badge");
    expect(source).toMatch("@/components/ui/separator");
    expect(source).toMatch("No known concern was recorded for this provider.");
    expect(source).not.toMatch(/drafted objection/i);
  });
});
