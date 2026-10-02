import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { MissingFixtureError, defaultArtifactPath } from "@/lib/ranked-providers/load";
import {
  productKnowledgeAssetKeys,
  resolveFixtureText,
  type FixtureAssetStore,
} from "./fixture-text";

function missingPath(): string {
  return join(mkdtempSync(join(tmpdir(), "hosted-fixture-")), "list.json");
}

describe("resolveFixtureText", () => {
  it("returns committed fixture text when the source path is missing", async () => {
    const committed = readFileSync(defaultArtifactPath, "utf8");
    const store: FixtureAssetStore = {
      getItem: async () => committed,
      getKeys: async () => [],
    };

    const text = await resolveFixtureText(
      missingPath(),
      "ranked-providers/list.json",
      store,
      MissingFixtureError,
    );

    expect(text).toBe(committed);
    expect(text).toContain('"rank"');
  });

  it("accepts Nitro's colon-separated product-knowledge keys", () => {
    expect(
      productKnowledgeAssetKeys(["product-knowledge:her2-ihc.md", "ranked-providers:list.json"]),
    ).toEqual(["product-knowledge/her2-ihc.md"]);
  });

  it("throws the ranked missing-fixture error when the asset key is absent", async () => {
    const store: FixtureAssetStore = {
      getItem: async () => null,
      getKeys: async () => [],
    };

    await expect(
      resolveFixtureText(missingPath(), "ranked-providers/list.json", store, MissingFixtureError),
    ).rejects.toBeInstanceOf(MissingFixtureError);
  });
});
