import type { AcceptedProvider } from "../market-intelligence/schema";
import type { Readiness, ScoreBreakdown } from "./schema";

const COMPETITOR_LABS = new Set(["FMI", "Caris", "Guardant"]);

export function ngsGapFactor(estNgsTestingRate: number): number {
  return 0.7 + 0.3 * (1 - estNgsTestingRate);
}

export function incumbentWeight(incumbentLab: AcceptedProvider["incumbent_lab"]): number {
  if (incumbentLab === "FMI" || incumbentLab === "Caris" || incumbentLab === "Guardant") {
    return 1.25;
  }
  if (incumbentLab === "unknown") {
    return 1.15;
  }
  if (incumbentLab === "in_house") {
    return 1.1;
  }
  return 0.75;
}

export function eventBoost(hasMatchedEvents: boolean): number {
  return hasMatchedEvents ? 1.15 : 1;
}

export function crmMultiplier(readiness: Readiness): number {
  if (readiness === "switch") {
    return 1.35;
  }
  if (readiness === "expand") {
    return 1.2;
  }
  if (readiness === "retain") {
    return 0.55;
  }
  return 1;
}

export function clampReadiness(
  incumbentLab: AcceptedProvider["incumbent_lab"],
  readiness: Readiness,
): Readiness {
  if (incumbentLab === "Tempus" && readiness === "switch") {
    return "expand";
  }
  if (COMPETITOR_LABS.has(incumbentLab) && readiness === "retain") {
    return "switch";
  }
  return readiness;
}

export type ScoreInput = {
  opportunity_patients: number;
  est_ngs_testing_rate: number;
  incumbent_lab: AcceptedProvider["incumbent_lab"];
  has_matched_events: boolean;
  readiness: Readiness;
};

export type ScoreResult = {
  readiness: Readiness;
  impact_score: number;
  score_breakdown: ScoreBreakdown;
};

export function scoreProvider(input: ScoreInput): ScoreResult {
  const readiness = clampReadiness(input.incumbent_lab, input.readiness);
  const ngs_gap_factor = ngsGapFactor(input.est_ngs_testing_rate);
  const incumbent_weight = incumbentWeight(input.incumbent_lab);
  const event_boost = eventBoost(input.has_matched_events);
  const crm_multiplier = crmMultiplier(readiness);
  const impact_score =
    input.opportunity_patients * ngs_gap_factor * incumbent_weight * event_boost * crm_multiplier;

  return {
    readiness,
    impact_score,
    score_breakdown: {
      opportunity_patients: input.opportunity_patients,
      ngs_gap_factor,
      incumbent_weight,
      event_boost,
      crm_multiplier,
    },
  };
}

export function compareImpact(
  left: { impact_score: number; opportunity_patients: number; npi: string },
  right: { impact_score: number; opportunity_patients: number; npi: string },
): number {
  if (right.impact_score !== left.impact_score) {
    return right.impact_score - left.impact_score;
  }
  if (right.opportunity_patients !== left.opportunity_patients) {
    return right.opportunity_patients - left.opportunity_patients;
  }
  return left.npi.localeCompare(right.npi);
}
