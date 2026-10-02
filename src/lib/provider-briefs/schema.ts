import { z } from "zod";

export const briefRowSchema = z.object({
  npi: z.string().regex(/^\d{10}$/, "NPI must be 10 digits"),
  meeting_script: z.string().trim().min(1),
  objection_response: z.string(),
});

export const briefsArtifactSchema = z.object({
  generated_at: z.string().min(1),
  model: z.literal("gpt-6-luna"),
  reasoning_effort: z.literal("medium"),
  as_of: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  briefs: z.array(briefRowSchema).min(1),
});

export type BriefRow = z.infer<typeof briefRowSchema>;
export type BriefsArtifact = z.infer<typeof briefsArtifactSchema>;

export function formatZodIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) {
    return "invalid artifact";
  }
  const path = issue.path.length > 0 ? issue.path.join(".") : "row";
  return `${path}: ${issue.message}`;
}
