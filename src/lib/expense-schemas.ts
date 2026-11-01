import { z } from "zod";

const minorAmount = z.union([
  z.number().int().positive(),
  z.string().regex(/^[1-9]\d*$/),
]);

const dateValue = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const createExpenseSchema = z.object({
  title: z.string().trim().min(1).max(160),
  amountMinor: minorAmount,
  payerId: z.string().uuid(),
  participantIds: z.array(z.string().uuid()).min(1).max(100).optional(),
  splits: z.array(z.object({
    userId: z.string().uuid(),
    shareMinor: minorAmount,
  })).min(1).max(100).optional(),
  splitType: z.enum(["equal", "custom"]),
  category: z.string().trim().max(50).nullable().optional(),
  expenseDate: dateValue,
}).superRefine((value, context) => {
  if (value.splitType === "equal" && !value.participantIds) {
    context.addIssue({
      code: "custom",
      path: ["participantIds"],
      message: "Participants are required for an equal split.",
    });
  }
  if (value.splitType === "custom" && !value.splits) {
    context.addIssue({
      code: "custom",
      path: ["splits"],
      message: "Splits are required for a custom split.",
    });
  }
});

export const updateExpenseSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  category: z.string().trim().max(50).nullable().optional(),
  expenseDate: dateValue.optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one expense field is required.",
});

export function minorToBigInt(value: number | string): bigint {
  return BigInt(value);
}
