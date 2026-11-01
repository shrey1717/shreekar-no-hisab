export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function parseJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  console.error("Unhandled API error:", error);
  const errorCode =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";
  const message =
    errorCode === "ECONNREFUSED"
      ? "The database is unavailable. Please start PostgreSQL and try again."
      : error instanceof Error && error.message
        ? error.message
        : "An unexpected error occurred.";

  return Response.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: message || "An unexpected error occurred.",
      },
    },
    { status: 500 },
  );
}
