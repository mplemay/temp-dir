import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import {
  eventTokens,
  loadProductKnowledge,
  MissingFixtureError,
  resolveAssays,
  unresolvedEventTokens,
} from "./load";
import { validAssayInput } from "./schema.test";
import { assayDocumentSchema, type AcceptedAssay } from "./schema";

function yamlValue(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => JSON.stringify(entry)).join(", ")}]`;
  }
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

function assayMarkdown(
  overrides: Record<string, unknown> = {},
  body = validAssayInput.body,
): string {
  const front: Record<string, unknown> = { ...validAssayInput, ...overrides };
  delete front.body;
  for (const [key, value] of Object.entries(front)) {
    if (value === undefined) {
      delete front[key];
    }
  }
  const lines = Object.entries(front).map(([key, value]) => `${key}: ${yamlValue(value)}`);
  return `---\n${lines.join("\n")}\n---\n\n${body}\n`;
}

function withFixtureDir(files: Record<string, string>, run: (directory: string) => void): void {
  const directory = mkdtempSync(join(tmpdir(), "product-knowledge-"));
  try {
    for (const [name, content] of Object.entries(files)) {
      writeFileSync(join(directory, name), content);
    }
    run(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

const xfPlusInput = {
  ...validAssayInput,
  test_id: "xf-plus",
  display_name: "Tempus xF+",
  aliases: ["xF+", "xF/xF+"],
  gene_count: 523,
  body: "Public Tempus site claim: xF+ is a 523-gene liquid biopsy.",
};

describe("eventTokens", () => {
  it("splits on semicolons, trims, and drops empties", () => {
    expect(eventTokens("xT CDx; HER2 IHC")).toEqual(["xT CDx", "HER2 IHC"]);
    expect(eventTokens("xF/xF+")).toEqual(["xF/xF+"]);
    expect(eventTokens("xT CDx; ; HRD")).toEqual(["xT CDx", "HRD"]);
  });
});

describe("resolveAssays", () => {
  const assays = [assayDocument("xf"), assayDocument("xf-plus")];

  it("returns both liquid assays for xF/xF+", () => {
    expect(resolveAssays("xF/xF+", assays).map((assay) => assay.test_id)).toEqual([
      "xf",
      "xf-plus",
    ]);
  });

  it("returns only xF for xF", () => {
    expect(resolveAssays("xF", assays).map((assay) => assay.test_id)).toEqual(["xf"]);
  });

  it("returns none for nP", () => {
    expect(resolveAssays("nP", assays)).toEqual([]);
    expect(unresolvedEventTokens(["nP"], assays)).toEqual(["nP"]);
  });
});

function assayDocument(which: "xf" | "xf-plus"): AcceptedAssay {
  const source = which === "xf" ? validAssayInput : xfPlusInput;
  return assayDocumentSchema.parse(source);
}

describe("loadProductKnowledge", () => {
  it("loads a temp directory of valid markdown", () => {
    withFixtureDir(
      {
        "xf.md": assayMarkdown(),
        "xf-plus.md": assayMarkdown(xfPlusInput, xfPlusInput.body),
      },
      (directory) => {
        const result = loadProductKnowledge(directory);
        expect(result.report.skipped).toEqual([]);
        expect(result.report.acceptedAssays).toBe(2);
        expect(result.assays.map((assay) => assay.test_id).sort()).toEqual(["xf", "xf-plus"]);
      },
    );
  });

  it("skips bad regulatory status, missing test_id, and empty body while keeping valid files", () => {
    withFixtureDir(
      {
        "xf.md": assayMarkdown(),
        "bad-status.md": assayMarkdown({
          test_id: "bad-status",
          regulatory_status: "research_use",
        }),
        "missing-id.md": assayMarkdown({ test_id: undefined }),
        "empty-body.md": assayMarkdown({ test_id: "empty-body" }, "   "),
      },
      (directory) => {
        const result = loadProductKnowledge(directory);
        expect(result.assays.map((assay) => assay.test_id)).toEqual(["xf"]);
        expect(result.report.skipped).toHaveLength(3);
        expect(
          result.report.skipped.some((skip) => skip.reason.includes("regulatory_status")),
        ).toBe(true);
        expect(result.report.skipped.some((skip) => skip.reason.includes("test_id"))).toBe(true);
        expect(result.report.skipped.some((skip) => skip.reason.includes("body"))).toBe(true);
      },
    );
  });

  it("skips a duplicate test_id after the first filename", () => {
    withFixtureDir(
      {
        "a-xf.md": assayMarkdown({ test_id: "xf" }),
        "z-xf.md": assayMarkdown({ test_id: "xf", display_name: "Duplicate xF" }),
      },
      (directory) => {
        const result = loadProductKnowledge(directory);
        expect(result.assays).toHaveLength(1);
        expect(result.assays[0]?.display_name).toBe("Tempus xF");
        expect(result.report.skipped).toEqual([
          expect.objectContaining({ reason: "test_id: duplicate" }),
        ]);
      },
    );
  });

  it("preserves body text and leaves omitted tat_days as null", () => {
    withFixtureDir(
      {
        "xt-cdx.md": assayMarkdown(
          {
            test_id: "xt-cdx",
            tat_days: null,
            tat_qualifier: "unpublished",
          },
          "FDA-approved 648-gene tissue test.",
        ),
      },
      (directory) => {
        const result = loadProductKnowledge(directory);
        expect(result.report.skipped).toEqual([]);
        expect(result.assays).toHaveLength(1);
        expect(result.assays[0]?.tat_days).toBeNull();
        expect(result.assays[0]?.body).toContain("FDA-approved 648-gene tissue test.");
      },
    );
  });

  it("throws when the directory is missing", () => {
    expect(() => loadProductKnowledge(join(tmpdir(), "product-knowledge-missing"))).toThrow(
      MissingFixtureError,
    );
  });
});
