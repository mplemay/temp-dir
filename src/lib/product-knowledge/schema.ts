import { z } from "zod";

export const specimenSchema = z.enum(["tissue", "liquid", "other"]);
export const regulatoryStatusSchema = z.enum(["fda_cdx", "ldt", "unknown"]);
export const tatQualifierSchema = z.enum([
  "typically_expected",
  "from_specimen_receipt",
  "unpublished",
]);

const nullableNonNegativeIntSchema = z
  .number()
  .int()
  .nonnegative()
  .nullable()
  .optional()
  .transform((value) => value ?? null);

export const sourceUrlSchema = z
  .string()
  .min(1)
  .refine((value) => {
    try {
      const url = new URL(value);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return false;
      }
      return url.hostname === "tempus.com" || url.hostname.endsWith(".tempus.com");
    } catch {
      return false;
    }
  }, "must be a tempus.com URL");

export const assayDocumentSchema = z
  .object({
    test_id: z.string().min(1),
    display_name: z.string().min(1),
    aliases: z.array(z.string().min(1)).min(1),
    specimen: specimenSchema,
    regulatory_status: regulatoryStatusSchema,
    gene_count: nullableNonNegativeIntSchema,
    tat_days: nullableNonNegativeIntSchema,
    tat_qualifier: tatQualifierSchema,
    source_url: sourceUrlSchema,
    retrieved_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    body: z.string().trim().min(1),
  })
  .superRefine((data, context) => {
    if (data.tat_days === null && data.tat_qualifier !== "unpublished") {
      context.addIssue({
        code: "custom",
        path: ["tat_qualifier"],
        message: "must be unpublished when tat_days is null",
      });
    }
    if (data.tat_days !== null && data.tat_qualifier === "unpublished") {
      context.addIssue({
        code: "custom",
        path: ["tat_qualifier"],
        message: "cannot be unpublished when tat_days is set",
      });
    }
  });

export type AcceptedAssay = z.infer<typeof assayDocumentSchema>;

export type SkipRecord = {
  source: string;
  reason: string;
};

export function formatZodIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) {
    return "invalid assay";
  }
  const path = issue.path.length > 0 ? issue.path.join(".") : "row";
  return `${path}: ${issue.message}`;
}
