import { createServerFn } from "@tanstack/react-start";
import { loadCrmNotes } from "@/lib/crm-notes/load";
import { loadMarketIntelligence } from "@/lib/market-intelligence/load";
import { loadProductKnowledge } from "@/lib/product-knowledge/load";
import { loadRankedProviders } from "@/lib/ranked-providers/load";
import { notesWithClinicianNames } from "./display";

export const getRankedProviders = createServerFn({ method: "GET" }).handler(async () => {
  const loaded = loadRankedProviders();
  return {
    providers: loaded.providers.map((provider) => ({
      rank: provider.rank,
      npi: provider.npi,
      full_name: provider.full_name,
      org_name: provider.org_name,
      primary_tumor_focus: provider.primary_tumor_focus,
      incumbent_lab: provider.incumbent_lab,
      opportunity_patients: provider.opportunity_patients,
      why_now: provider.why_now,
    })),
  };
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
