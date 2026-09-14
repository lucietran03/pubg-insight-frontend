// Conservative display-only cleanup for occasional Gemini output artifacts like
// "lobby lobby wipe" - collapses an immediately-repeated word, case-insensitively, without
// otherwise touching the generated text's meaning or wording.
export function dedupeAdjacentWords(text: string): string {
  return text.replace(/\b(\w+)(\s+\1\b)+/gi, "$1");
}
