import { existsSync } from "node:fs";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  defaultFixturePath as defaultNotesPath,
  loadCrmNotes,
  MissingFixtureError as CrmMissingFixtureError,
  parseCrmNotes,
} from "@/lib/crm-notes/load";
import {
  defaultFixturePaths,
  loadMarketIntelligence,
  parseMarketIntelligence,
  MissingFixtureError as MarketMissingFixtureError,
} from "@/lib/market-intelligence/load";
import {
  defaultFixtureDir,
  loadProductKnowledge,
  parseProductKnowledgeDocuments,
  MissingFixtureError as ProductMissingFixtureError,
} from "@/lib/product-knowledge/load";
import {
  BriefNotFoundError,
  defaultArtifactPath as defaultBriefsPath,
  loadProviderBrief,
  loadProviderBriefs,
  MissingFixtureError as BriefMissingFixtureError,
  parseProviderBriefs,
} from "@/lib/provider-briefs/load";
import {
  defaultArtifactPath,
  loadRankedProviders,
  parseRankedProviders,
  MissingFixtureError as RankedMissingFixtureError,
} from "@/lib/ranked-providers/load";
import { notesWithClinicianNames } from "./display";
import { resolveFixtureText, type FixtureAssetStore } from "./fixture-text";
import { toBriefPagePayload, toRankedListRow } from "./payload";

async function assetStore(): Promise<FixtureAssetStore> {
  const { useStorage } = await import("nitro/storage");
  const storage = useStorage("assets:data");
  return {
    getItem: (key) => storage.getItem(key),
    getKeys: () => storage.getKeys(),
  };
}

async function hostedMarket(store: FixtureAssetStore) {
  if (existsSync(defaultFixturePaths.providers) && existsSync(defaultFixturePaths.events)) {
    return loadMarketIntelligence();
  }
  const providerCsv = await resolveFixtureText(
    defaultFixturePaths.providers,
    "market-intelligence/providers.csv",
    store,
    MarketMissingFixtureError,
  );
  const eventCsv = await resolveFixtureText(
    defaultFixturePaths.events,
    "market-intelligence/events.csv",
    store,
    MarketMissingFixtureError,
  );
  return parseMarketIntelligence(providerCsv, eventCsv, {
    providers: "market-intelligence/providers.csv",
    events: "market-intelligence/events.csv",
  });
}

async function hostedNotes(store: FixtureAssetStore) {
  if (existsSync(defaultNotesPath)) {
    return loadCrmNotes();
  }
  const csv = await resolveFixtureText(
    defaultNotesPath,
    "crm-notes/notes.csv",
    store,
    CrmMissingFixtureError,
  );
  return parseCrmNotes(csv, "crm-notes/notes.csv");
}

async function hostedKnowledge(store: FixtureAssetStore) {
  if (existsSync(defaultFixtureDir)) {
    return loadProductKnowledge();
  }
  const keys = (await store.getKeys())
    .map((key) => key.replaceAll("\\", "/"))
    .filter((key) => key.startsWith("product-knowledge/") && key.endsWith(".md"));
  if (keys.length === 0) {
    throw new ProductMissingFixtureError("product-knowledge");
  }
  const documents = [];
  for (const key of keys) {
    const text = await resolveFixtureText(
      `${defaultFixtureDir}/${key}`,
      key,
      store,
      ProductMissingFixtureError,
    );
    documents.push({ source: key, text });
  }
  return parseProductKnowledgeDocuments(documents);
}

async function hostedRanked(
  store: FixtureAssetStore,
  providers: Awaited<ReturnType<typeof hostedMarket>>["providers"],
) {
  if (existsSync(defaultArtifactPath)) {
    return loadRankedProviders({ providers });
  }
  const json = await resolveFixtureText(
    defaultArtifactPath,
    "ranked-providers/list.json",
    store,
    RankedMissingFixtureError,
  );
  return parseRankedProviders(json, providers);
}

async function hostedBriefs(
  store: FixtureAssetStore,
  ranked: Awaited<ReturnType<typeof hostedRanked>>["providers"],
  providers: Awaited<ReturnType<typeof hostedMarket>>["providers"],
  notes: Awaited<ReturnType<typeof hostedNotes>>["notes"],
  assays: Awaited<ReturnType<typeof hostedKnowledge>>["assays"],
) {
  if (existsSync(defaultBriefsPath)) {
    return loadProviderBriefs({ ranked, providers, notes, assays });
  }
  const json = await resolveFixtureText(
    defaultBriefsPath,
    "provider-briefs/briefs.json",
    store,
    BriefMissingFixtureError,
  );
  return parseProviderBriefs(json, ranked, providers, notes, assays);
}

const diskOnlyStore: FixtureAssetStore = {
  getItem: async (key) => {
    throw new RankedMissingFixtureError(key);
  },
  getKeys: async () => [],
};

async function hostedSnapshot(store?: FixtureAssetStore) {
  const assets =
    store ?? (existsSync(defaultFixturePaths.providers) ? diskOnlyStore : await assetStore());
  const market = await hostedMarket(assets);
  const notes = await hostedNotes(assets);
  const knowledge = await hostedKnowledge(assets);
  const ranked = await hostedRanked(assets, market.providers);
  const briefs = await hostedBriefs(
    assets,
    ranked.providers,
    market.providers,
    notes.notes,
    knowledge.assays,
  );
  return { market, notes, knowledge, ranked, briefs };
}

export const getRankedProviders = createServerFn({ method: "GET" }).handler(async () => {
  const { ranked } = await hostedSnapshot();
  return {
    providers: ranked.providers.map(toRankedListRow),
  };
});

export const getProviderBrief = createServerFn({ method: "GET" })
  .validator(z.object({ npi: z.string() }))
  .handler(async ({ data }) => {
    if (!/^\d{10}$/.test(data.npi)) {
      return null;
    }
    try {
      if (existsSync(defaultBriefsPath)) {
        return toBriefPagePayload(loadProviderBrief(data.npi));
      }
      const { briefs } = await hostedSnapshot();
      const brief = briefs.briefs.find((row) => row.npi === data.npi);
      if (!brief) {
        return null;
      }
      return toBriefPagePayload(brief);
    } catch (error) {
      if (error instanceof BriefNotFoundError) {
        return null;
      }
      throw error;
    }
  });

export const getMarketIntelligence = createServerFn({ method: "GET" }).handler(async () => {
  const { market } = await hostedSnapshot();
  return {
    providers: market.providers,
    events: market.events,
  };
});

export const getProductKnowledge = createServerFn({ method: "GET" }).handler(async () => {
  const { knowledge } = await hostedSnapshot();
  return { assays: knowledge.assays };
});

export const getCrmNotes = createServerFn({ method: "GET" }).handler(async () => {
  const { notes, market } = await hostedSnapshot();
  return {
    notes: notesWithClinicianNames(notes.notes, market.providers),
  };
});
