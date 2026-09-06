import axios from "axios";

// The backend already returns a distinct, human-readable "error" message per failure
// type (PUBG failure, Gemini failure, rate limit, etc. - see GlobalExceptionHandler).
// Surface that message directly instead of guessing a generic one from the status code
// alone - a hardcoded per-status string here previously showed "PUBG service
// unavailable" for a Gemini failure, since both happened to return the same HTTP status.
export function getErrorMessage(error: unknown, notFoundMessage: string): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404) {
      return notFoundMessage;
    }
    const backendMessage = error.response?.data?.error;
    if (typeof backendMessage === "string" && backendMessage.length > 0) {
      return backendMessage;
    }
    if (error.response) {
      return "The server is temporarily unavailable. Please try again later.";
    }
  }
  return "Could not reach the server. Please check your connection and try again.";
}
