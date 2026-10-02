import { existsSync, readFileSync } from "node:fs";

export type FixtureAssetStore = {
  getItem(key: string): Promise<unknown>;
  getKeys(): Promise<string[]>;
};

function textFromAsset(value: unknown, key: string, Missing: new (path: string) => Error): string {
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof Uint8Array) {
    return new TextDecoder().decode(value);
  }
  if (value !== null && typeof value === "object") {
    return JSON.stringify(value);
  }
  throw new Missing(key);
}

export async function resolveFixtureText(
  sourcePath: string,
  assetKey: string,
  store: FixtureAssetStore,
  Missing: new (path: string) => Error,
): Promise<string> {
  if (existsSync(sourcePath)) {
    return readFileSync(sourcePath, "utf8");
  }
  const value = await store.getItem(assetKey);
  if (value == null) {
    throw new Missing(assetKey);
  }
  return textFromAsset(value, assetKey, Missing);
}
