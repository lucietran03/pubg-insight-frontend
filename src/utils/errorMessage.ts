import axios from "axios";

export function getErrorMessage(error: unknown, notFoundMessage: string): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404) {
      return notFoundMessage;
    }
    if (error.response?.status === 429) {
      return "PUBG API rate limit reached. Please try again shortly.";
    }
    if (error.response) {
      return "PUBG service is temporarily unavailable. Please try again later.";
    }
  }
  return "Could not reach the server. Please check your connection and try again.";
}
