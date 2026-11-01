import { z } from "zod";

export const groupIdSchema = z.string().uuid();

export const createGroupSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).nullable().optional(),
  currency: z.string().trim().length(3).toUpperCase().default("INR"),
});

export const updateGroupSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  archived: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one group field is required.",
});

export const updateMemberSchema = z.object({
  role: z.enum(["admin", "member"]),
});

export const createInvitationSchema = z.object({
  expiresInDays: z.number().int().positive().max(30).optional().default(7),
  maxUses: z.number().int().positive().max(100).nullable().optional(),
});
