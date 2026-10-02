import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { loadCrmNotes } from "@/lib/crm-notes/load";
import { loadMarketIntelligence } from "@/lib/market-intelligence/load";
import { loadProductKnowledge } from "@/lib/product-knowledge/load";
import { BriefNotFoundError, loadProviderBrief } from "@/lib/provider-briefs/load";
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

export const getProviderBrief = createServerFn({ method: "GET" })
  .validator(z.object({ npi: z.string() }))
  .handler(async ({ data }) => {
    if (!/^\d{10}$/.test(data.npi)) {
      return null;
    }
    try {
      const brief = loadProviderBrief(data.npi);
      return {
        npi: brief.npi,
        full_name: brief.full_name,
        specialty: brief.specialty,
        org_name: brief.org_name,
        city: brief.city,
        state: brief.state,
        primary_tumor_focus: brief.primary_tumor_focus,
        incumbent_lab: brief.incumbent_lab,
        rank: brief.rank,
        opportunity_patients: brief.opportunity_patients,
        why_now: brief.why_now,
        matched_events: brief.matched_events.map((event) => ({
          headline: event.headline,
          event_date: event.event_date,
          tumor_type: event.tumor_type,
        })),
        crm_notes: brief.crm_notes.map((note) => ({
          note_date: note.note_date,
          body: note.body,
        })),
        assays: brief.assays.map((assay) => ({
          display_name: assay.display_name,
        })),
        meeting_script: brief.meeting_script,
        objection_response: brief.objection_response,
      };
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
