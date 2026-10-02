import { z } from "zod";

export const noteRowSchema = z.object({
  npi: z.string().regex(/^\d{10}$/, "NPI must be 10 digits"),
  note_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  body: z.string().trim().min(1),
});

export type AcceptedNote = z.infer<typeof noteRowSchema>;

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
