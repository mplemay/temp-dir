export type WhyNowGrounding = {
  tat_days: Array<number | null | undefined>;
  gene_count: Array<number | null | undefined>;
};

function allowedNumbers(values: Array<number | null | undefined>): Set<string> {
  return new Set(
    values.filter((value): value is number => value != null).map((value) => String(value)),
  );
}

export function assertGroundedWhyNow(whyNow: string, packet: WhyNowGrounding): void {
  const allowedTat = allowedNumbers(packet.tat_days);
  const allowedGenes = allowedNumbers(packet.gene_count);

  for (const match of whyNow.matchAll(/(\d+(?:\.\d+)?)\s*-?\s*(?:day|days)\b/gi)) {
    const value = match[1];
    if (value && !allowedTat.has(value)) {
      throw new Error(`why_now invents a turnaround-time claim of ${value}`);
    }
  }

  for (const match of whyNow.matchAll(/\btat\b[\s\S]{0,32}?(\d+(?:\.\d+)?)/gi)) {
    const value = match[1];
    if (value && !allowedTat.has(value)) {
      throw new Error(`why_now invents a turnaround-time claim of ${value}`);
    }
  }

  for (const match of whyNow.matchAll(/(\d+)\s*-?\s*(?:gene|genes)\b/gi)) {
    const value = match[1];
    if (value && !allowedGenes.has(value)) {
      throw new Error(`why_now invents a gene-count claim of ${value}`);
    }
  }

  if (/\d+(?:\.\d+)?\s*%/.test(whyNow)) {
    throw new Error("why_now invents an accuracy claim");
  }
}
