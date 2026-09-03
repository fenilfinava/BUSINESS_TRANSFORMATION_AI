/**
 * Global Error Sanitization Utility
 * Intercepts and sanitizes raw database/network errors before they ever hit the UI state.
 */
export const sanitizeError = (
  error: any,
  defaultMessage: string = "An unexpected error occurred."
): string => {
  if (!error) return "";

  let rawMessage = "";
  if (typeof error === "string") {
    rawMessage = error;
  } else if (error && typeof error === "object") {
    rawMessage = error.message || error.error || error.details || error.hint || "";
  }

  // STRICT BAN: If the error contains the infinite recursion string, mask it completely.
  const lower = (rawMessage || "").toLowerCase();
  if (
    lower.includes("infinite recursion") ||
    lower.includes("policy for relation") ||
    lower.includes("recursion detected")
  ) {
    return "Action blocked by security policy. Please contact the workspace owner.";
  }

  return rawMessage || defaultMessage;
};
