import { z } from "zod";

const memberCountSchema = z.number().finite().int().nonnegative();
const commissionAmountSchema = z.number().finite();

export const teamStatsSchema = z.object({
  level1Count: memberCountSchema,
  level2Count: memberCountSchema,
  level3Count: memberCountSchema,
  demoMemberCount: memberCountSchema,
  totalCommission: commissionAmountSchema,
  level1Commission: commissionAmountSchema,
  level2Commission: commissionAmountSchema,
  level3Commission: commissionAmountSchema,
  totalDepositAmount: commissionAmountSchema.optional(),
  totalWithdrawalAmount: commissionAmountSchema.optional(),
});

export type TeamStats = z.infer<typeof teamStatsSchema>;

export function parseTeamStats(data: unknown): TeamStats {
  return teamStatsSchema.parse(data);
}
