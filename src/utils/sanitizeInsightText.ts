// Collapses accidental word repeats in Gemini output (e.g. "lobby lobby wipe").
export function dedupeAdjacentWords(text: string): string {
  return text.replace(/\b(\w+)(\s+\1\b)+/gi, "$1");
}
