export function notImplemented(resource: string): Response {
  return Response.json(
    {
      error: {
        code: "NOT_IMPLEMENTED",
        message: `${resource} API is not implemented yet.`,
      },
    },
    { status: 501 },
  );
}
