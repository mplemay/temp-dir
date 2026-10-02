import { z } from "zod";

export const orgTypeSchema = z.enum([
  "academic",
  "nci_designated",
  "community_hospital",
  "independent_practice",
]);

export const specialtySchema = z.enum([
  "Medical Oncology",
  "Hematology/Oncology",
  "Gynecologic Oncology",
  "Thoracic Oncology",
  "Surgical Oncology",
]);

export const tumorFocusSchema = z.enum([
  "NSCLC",
  "breast",
  "CRC",
  "prostate",
  "gyn",
  "heme",
  "mixed",
]);

export const eventTumorTypeSchema = z.enum(["NSCLC", "breast", "CRC", "prostate", "gyn", "heme"]);

export const incumbentLabSchema = z.enum([
  "Tempus",
  "FMI",
  "Caris",
  "Guardant",
  "in_house",
  "unknown",
]);

export const volumeConfidenceSchema = z.enum(["high", "medium", "low"]);

export const csvBooleanSchema = z
  .enum(["true", "false", "TRUE", "FALSE"])
  .transform((value) => value.toLowerCase() === "true");

export const providerRowSchema = z.object({
  npi: z.string().regex(/^\d{10}$/, "NPI must be 10 digits"),
  full_name: z.string().min(1),
  specialty: specialtySchema,
  org_name: z.string().min(1),
  org_type: orgTypeSchema,
  health_system: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(2),
  primary_tumor_focus: tumorFocusSchema,
  est_new_cancer_patients_annual: z.coerce.number().int().nonnegative(),
  est_advanced_solid_tumor_annual: z.coerce.number().int().nonnegative(),
  est_ngs_testing_rate: z.coerce.number().min(0).max(1),
  incumbent_lab: incumbentLabSchema,
  tempus_orders_t12m: z.coerce.number().int().nonnegative(),
  volume_basis: z.string().min(1),
  volume_confidence: volumeConfidenceSchema,
  reserved_for_crm: csvBooleanSchema,
});

export const eventRowSchema = z.object({
  event_id: z.string().min(1),
  tumor_type: eventTumorTypeSchema,
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  headline: z.string().min(1),
  relevant_tests: z.string().min(1),
  why_now: z.string().min(1),
});

export type ProviderRow = z.infer<typeof providerRowSchema>;
export type EventRow = z.infer<typeof eventRowSchema>;
export type OpportunityFeatures = {
  tempus_share: number;
  opportunity_patients: number;
};
export type AcceptedEvent = EventRow;
export type AcceptedProvider = ProviderRow &
  OpportunityFeatures & {
    matched_events: AcceptedEvent[];
  };

export type SkipRecord = {
  source: string;
  line: number;
  reason: string;
};

export function formatZodIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) {
    return "invalid row";
  }
  const path = issue.path.length > 0 ? issue.path.join(".") : "row";
  return `${path}: ${issue.message}`;
}
