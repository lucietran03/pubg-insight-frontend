import axios from "axios";

// Surface the backend's own error message instead of deriving one from the HTTP status code.
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
