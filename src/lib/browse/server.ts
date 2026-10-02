import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { loadCrmNotes } from "@/lib/crm-notes/load";
import { loadMarketIntelligence } from "@/lib/market-intelligence/load";
import { loadProductKnowledge } from "@/lib/product-knowledge/load";
import { BriefNotFoundError, loadProviderBrief } from "@/lib/provider-briefs/load";
import { loadRankedProviders } from "@/lib/ranked-providers/load";
import { notesWithClinicianNames } from "./display";
import { toBriefPagePayload, toRankedListRow } from "./payload";

export const getRankedProviders = createServerFn({ method: "GET" }).handler(async () => {
  const loaded = loadRankedProviders();
  return {
    providers: loaded.providers.map(toRankedListRow),
  };
});

export const getProviderBrief = createServerFn({ method: "GET" })
  .validator(z.object({ npi: z.string() }))
  .handler(async ({ data }) => {
    if (!/^\d{10}$/.test(data.npi)) {
      return null;
    }
    try {
      const brief = loadProviderBrief(data.npi);
      return toBriefPagePayload(brief);
    } catch (error) {
      if (error instanceof BriefNotFoundError) {
        return null;
      }
      throw error;
    }
  });

export const getMarketIntelligence = createServerFn({ method: "GET" }).handler(async () => {
  const loaded = loadMarketIntelligence();
  return {
    providers: loaded.providers,
    events: loaded.events,
  };
});

export const getProductKnowledge = createServerFn({ method: "GET" }).handler(async () => {
  const loaded = loadProductKnowledge();
  return { assays: loaded.assays };
});

export const getCrmNotes = createServerFn({ method: "GET" }).handler(async () => {
  const notes = loadCrmNotes();
  const market = loadMarketIntelligence();
  return {
    notes: notesWithClinicianNames(notes.notes, market.providers),
  };
});
