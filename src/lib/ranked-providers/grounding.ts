export type CopyGrounding = {
  tat_days: Array<number | null | undefined>;
  gene_count: Array<number | null | undefined>;
};

export type WhyNowGrounding = CopyGrounding;

function allowedNumbers(values: Array<number | null | undefined>): Set<string> {
  return new Set(
    values.filter((value): value is number => value != null).map((value) => String(value)),
  );
}

export function assertGroundedCopy(text: string, packet: CopyGrounding, field = "copy"): void {
  const allowedTat = allowedNumbers(packet.tat_days);
  const allowedGenes = allowedNumbers(packet.gene_count);

  for (const match of text.matchAll(/(\d+(?:\.\d+)?)\s*-?\s*(?:day|days)\b/gi)) {
    const value = match[1];
    if (value && !allowedTat.has(value)) {
      throw new Error(`${field} invents a turnaround-time claim of ${value}`);
    }
  }

  for (const match of text.matchAll(/\btat\b[\s\S]{0,32}?(\d+(?:\.\d+)?)/gi)) {
    const value = match[1];
    if (value && !allowedTat.has(value)) {
      throw new Error(`${field} invents a turnaround-time claim of ${value}`);
    }
  }

  for (const match of text.matchAll(/(\d+)\s*-?\s*(?:gene|genes)\b/gi)) {
    const value = match[1];
    if (value && !allowedGenes.has(value)) {
      throw new Error(`${field} invents a gene-count claim of ${value}`);
    }
  }

  if (/\d+(?:\.\d+)?\s*%/.test(text)) {
    throw new Error(`${field} invents an accuracy claim`);
  }
}

export function assertGroundedWhyNow(whyNow: string, packet: WhyNowGrounding): void {
  assertGroundedCopy(whyNow, packet, "why_now");
}
