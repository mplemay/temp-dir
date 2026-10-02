export function deriveOpportunity(input: {
  est_advanced_solid_tumor_annual: number;
  tempus_orders_t12m: number;
}): { tempus_share: number; opportunity_patients: number } {
  const eligible = input.est_advanced_solid_tumor_annual;
  if (eligible <= 0) {
    return { tempus_share: 0, opportunity_patients: 0 };
  }

  const tempus_share = Math.min(1, Math.max(0, input.tempus_orders_t12m / eligible));
  const opportunity_patients = Math.round(eligible * (1 - tempus_share));
  return { tempus_share, opportunity_patients };
}
