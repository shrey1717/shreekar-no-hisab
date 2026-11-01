import { z } from "zod";

export const createSettlementSchema = z.object({
  fromUserId: z.string().uuid(),
  toUserId: z.string().uuid(),
  amountMinor: z.union([
    z.number().int().positive(),
    z.string().regex(/^[1-9]\d*$/),
  ]),
});
