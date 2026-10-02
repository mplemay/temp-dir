import { createServerFn } from "@tanstack/react-start";
import { loadCrmNotes } from "@/lib/crm-notes/load";
import { loadMarketIntelligence } from "@/lib/market-intelligence/load";
import { loadProductKnowledge } from "@/lib/product-knowledge/load";
import { notesWithClinicianNames } from "./display";

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
