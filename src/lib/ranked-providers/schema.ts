import { z } from "zod";

export const readinessSchema = z.enum(["switch", "expand", "retain", "unknown"]);

export const scoreBreakdownSchema = z.object({
  opportunity_patients: z.number(),
  ngs_gap_factor: z.number(),
  incumbent_weight: z.number(),
  event_boost: z.number(),
  crm_multiplier: z.number(),
});

export const rankedRowSchema = z.object({
  rank: z.number().int().positive(),
  npi: z.string().regex(/^\d{10}$/, "NPI must be 10 digits"),
  impact_score: z.number(),
  score_breakdown: scoreBreakdownSchema,
  readiness: readinessSchema,
  concern: z.string(),
  interest: z.string(),
  why_now: z.string().trim().min(1),
  has_crm: z.boolean(),
});

export const rankedArtifactSchema = z.object({
  generated_at: z.string().min(1),
  model: z.literal("gpt-6-luna"),
  reasoning_effort: z.literal("medium"),
  as_of: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  providers: z.array(rankedRowSchema).min(1),
});

export type Readiness = z.infer<typeof readinessSchema>;
export type ScoreBreakdown = z.infer<typeof scoreBreakdownSchema>;
export type RankedRow = z.infer<typeof rankedRowSchema>;
export type RankedArtifact = z.infer<typeof rankedArtifactSchema>;

export function formatZodIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) {
    return "invalid artifact";
  }
  const path = issue.path.length > 0 ? issue.path.join(".") : "row";
  return `${path}: ${issue.message}`;
}
