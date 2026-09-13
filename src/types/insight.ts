export interface Insight {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  // Empty ("" / []) rather than fabricated when Gemini's response omits the section.
  playstyle: string;
  seasonProgress: string;
  riskFactors: string[];
  trainingPriorities: string[];
  source: string;
}
