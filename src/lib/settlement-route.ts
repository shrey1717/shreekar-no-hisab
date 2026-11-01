import { ApiError } from "@/src/lib/api-error";
import { groupIdSchema } from "@/src/lib/group-schemas";

export function validateSettlementIds(
  groupId: string,
  settlementId: string,
): void {
  if (
    !groupIdSchema.safeParse(groupId).success ||
    !groupIdSchema.safeParse(settlementId).success
  ) {
    throw new ApiError(
      "INVALID_SETTLEMENT_ID",
      "Group or settlement ID is invalid.",
      400,
    );
  }
}
